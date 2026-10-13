// ═══════════════════════════════════════════════════════════════
// WallCSG — Creates wall geometry with REAL boolean openings
// Uses THREE.ExtrudeGeometry with Shape + Holes
// The wall is a 2D shape (height x length) extruded to thickness
// Doors/windows cut actual holes through the wall geometry
// ═══════════════════════════════════════════════════════════════
import * as THREE from 'three';
import { MM_TO_M } from '../../stores/bimTypes';

const S = MM_TO_M;
const geometryCache = new Map();

/**
 * Create wall geometry with real openings for doors and windows.
 * @param {object} wall - Wall data { start, end, height, thickness }
 * @param {array} doors - Doors on this wall
 * @param {array} windows - Windows on this wall
 * @returns {{ geometry, position, rotation }} Ready for Three.js mesh
 */
export function createWallWithOpenings(wall, doors = [], windows = []) {
  const { start, end, height = 3200, thickness = 200 } = wall;
  if (!start || !end) return null;

  const sx = start.x * S, sy = start.y * S;
  const ex = end.x * S, ey = end.y * S;
  const dx = ex - sx, dy = ey - sy;
  const wallLength = Math.sqrt(dx * dx + dy * dy);
  if (wallLength < 0.01) return null;

  const h = height * S;
  const t = thickness * S;
  const angle = Math.atan2(dy, dx);

  // Collect openings for this wall
  const openings = [];

  // Doors
  for (const door of doors) {
    if (door.wallId !== wall.id) continue;
    const pos = door.position || 0.5;
    const dw = (door.width || 900) * S;
    const dh = (door.height || 2100) * S;
    const sillH = (door.sillHeight || 0) * S;
    const cx = pos * wallLength;
    openings.push({
      x: cx - dw / 2,
      y: sillH,
      width: dw,
      height: dh,
    });
  }

  // Windows
  for (const win of windows) {
    if (win.wallId !== wall.id) continue;
    const pos = win.position || 0.5;
    const ww = (win.width || 1200) * S;
    const wh = (win.height || 1200) * S;
    const sillH = (win.sillHeight || 900) * S;
    const cx = pos * wallLength;
    openings.push({
      x: cx - ww / 2,
      y: sillH,
      width: ww,
      height: wh,
    });
  }

  // Create cache key
  const cacheKey = `${wallLength.toFixed(3)}_${h.toFixed(3)}_${t.toFixed(3)}_${openings.map(o => `${o.x.toFixed(2)},${o.y.toFixed(2)},${o.width.toFixed(2)},${o.height.toFixed(2)}`).join('|')}`;
  
  if (geometryCache.has(cacheKey)) {
    const cached = geometryCache.get(cacheKey);
    return {
      geometry: cached,
      position: [(sx + ex) / 2, h / 2, (sy + ey) / 2],
      rotation: [0, -angle, 0],
      wallLength,
      wallAngle: angle,
    };
  }

  let geometry;

  if (openings.length === 0) {
    // Simple box for walls without openings
    geometry = new THREE.BoxGeometry(wallLength, h, t);
  } else {
    // Create 2D shape with holes, then extrude
    // The shape is the wall face (length x height), and we cut holes
    // Extrusion direction = wall thickness
    const shape = new THREE.Shape();
    // Wall face rectangle (centered at origin in local space)
    const halfL = wallLength / 2;
    const halfH = h / 2;
    shape.moveTo(-halfL, -halfH);
    shape.lineTo(halfL, -halfH);
    shape.lineTo(halfL, halfH);
    shape.lineTo(-halfL, halfH);
    shape.closePath();

    // Cut holes for openings
    for (const opening of openings) {
      // Opening coordinates relative to wall center
      const ox = opening.x - wallLength / 2;
      const oy = opening.y - h / 2;
      const ow = opening.width;
      const oh = opening.height;

      // Clamp opening to wall bounds with small margin
      const margin = 0.005;
      const clampedX = Math.max(-halfL + margin, ox);
      const clampedY = Math.max(-halfH + margin, oy);
      const clampedW = Math.min(ow, halfL * 2 - margin * 2);
      const clampedH = Math.min(oh, halfH * 2 - margin * 2);

      if (clampedW > 0.01 && clampedH > 0.01) {
        const hole = new THREE.Path();
        hole.moveTo(clampedX, clampedY);
        hole.lineTo(clampedX + clampedW, clampedY);
        hole.lineTo(clampedX + clampedW, clampedY + clampedH);
        hole.lineTo(clampedX, clampedY + clampedH);
        hole.closePath();
        shape.holes.push(hole);
      }
    }

    // Extrude to get wall thickness
    const extrudeSettings = {
      depth: t,
      bevelEnabled: false,
      steps: 1,
    };

    geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Center the geometry (extrude goes from 0 to depth, so shift by -t/2)
    geometry.translate(0, 0, -t / 2);
    geometry.computeVertexNormals();
  }

  geometryCache.set(cacheKey, geometry);

  return {
    geometry,
    position: [(sx + ex) / 2, h / 2, (sy + ey) / 2],
    rotation: [0, -angle, 0],
    wallLength,
    wallAngle: angle,
  };
}

/**
 * Calculate door/window position in world space given wall and position parameter
 */
export function getOpeningWorldPosition(wall, positionParam, floorElevation = 0) {
  const { start, end } = wall;
  if (!start || !end) return null;
  const t = positionParam || 0.5;
  const x = (start.x + (end.x - start.x) * t) * S;
  const z = (start.y + (end.y - start.y) * t) * S;
  const angle = Math.atan2((end.y - start.y), (end.x - start.x));
  return { x, z, angle, elevation: floorElevation * S };
}

/**
 * Clear geometry cache
 */
export function clearWallCSGCache() {
  for (const [, geom] of geometryCache) {
    geom.dispose();
  }
  geometryCache.clear();
}
