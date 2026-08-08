// ═══════════════════════════════════════════════════════════════
// Procedural Wall System — Multi-layer walls with openings
// ═══════════════════════════════════════════════════════════════
import { useMemo, memo } from 'react';
import * as THREE from 'three';
import { getProceduralMaterial } from './ProceduralTextures';

const S = 0.001; // mm to scene units

// ─── Create wall shape with opening holes ──────────────────────
function createWallShape(length, height, openings = []) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(length, 0);
  shape.lineTo(length, height);
  shape.lineTo(0, height);
  shape.lineTo(0, 0);

  // Subtract openings (doors/windows)
  openings.forEach(op => {
    const hole = new THREE.Path();
    const x1 = Math.max(0.01, op.x);
    const x2 = Math.min(length - 0.01, op.x + op.w);
    const y1 = Math.max(0, op.y);
    const y2 = Math.min(height, op.y + op.h);
    hole.moveTo(x1, y1);
    hole.lineTo(x2, y1);
    hole.lineTo(x2, y2);
    hole.lineTo(x1, y2);
    hole.lineTo(x1, y1);
    shape.holes.push(hole);
  });

  return shape;
}

// ─── Find openings (doors/windows) on a wall ───────────────────
function findOpeningsOnWall(wall, doors, windows) {
  if (!wall?.start_point || !wall?.end_point) return [];
  const openings = [];
  const wsx = wall.start_point.x, wsy = wall.start_point.y;
  const wex = wall.end_point.x, wey = wall.end_point.y;
  const wdx = wex - wsx, wdy = wey - wsy;
  const wallLen = Math.sqrt(wdx * wdx + wdy * wdy);
  if (wallLen < 1) return [];

  const checkElement = (el, type) => {
    if (!el?.position) return;
    const px = el.position.x - wsx;
    const py = el.position.y - wsy;
    // Project onto wall direction
    const t = (px * wdx + py * wdy) / (wallLen * wallLen);
    // Distance from wall line
    const projX = wsx + t * wdx;
    const projY = wsy + t * wdy;
    const dist = Math.sqrt((el.position.x - projX) ** 2 + (el.position.y - projY) ** 2);

    if (dist < (wall.thickness || 230) * 0.7 && t > -0.1 && t < 1.1) {
      const w = (el.width || (type === 'door' ? 900 : 1200)) * S;
      const h = (el.height || (type === 'door' ? 2100 : 1200)) * S;
      const elPos = t * wallLen * S;
      const sillH = type === 'window' ? (el.sill_height || 900) * S : 0;

      openings.push({
        x: Math.max(0, elPos - w / 2),
        y: sillH,
        w: w,
        h: h,
        type,
      });
    }
  };

  (doors || []).forEach(d => checkElement(d, 'door'));
  (windows || []).forEach(w => checkElement(w, 'window'));

  return openings;
}

// ─── Single Wall Layer Mesh ────────────────────────────────────
function WallLayer({ shape, depth, offsetZ, materialName, color, renderMode }) {
  const geometry = useMemo(() => {
    const extrudeSettings = {
      steps: 1,
      depth: depth,
      bevelEnabled: false,
    };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.translate(0, 0, offsetZ);
    return geo;
  }, [shape, depth, offsetZ]);

  const texMat = useMemo(() => {
    if (renderMode === 'wireframe') return { color: color || '#888', wireframe: true, transparent: true, opacity: 0.6 };
    if (renderMode === 'xray') return { color: color || '#888', transparent: true, opacity: 0.12, side: THREE.DoubleSide };
    const tex = getProceduralMaterial(materialName);
    if (tex) {
      return {
        map: tex.map,
        normalMap: tex.normalMap || null,
        roughnessMap: tex.roughnessMap || null,
        roughness: tex.roughness ?? 0.8,
        metalness: tex.metalness ?? 0,
      };
    }
    return { color: color || '#C4A882', roughness: 0.8, metalness: 0 };
  }, [materialName, color, renderMode]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial {...texMat} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ─── Skirting Board ────────────────────────────────────────────
function Skirting({ length, height = 0.1, depth = 0.012, renderMode }) {
  if (renderMode === 'wireframe' || renderMode === 'xray') return null;
  return (
    <mesh position={[length / 2, height / 2, 0]} castShadow>
      <boxGeometry args={[length, height, depth]} />
      <meshStandardMaterial color="#F5F0E0" roughness={0.5} />
    </mesh>
  );
}

// ─── Complete Procedural Wall ──────────────────────────────────
const ProceduralWall = memo(function ProceduralWall({
  wall, doors, windows, renderMode, selected, onSelect
}) {
  if (!wall?.start_point || !wall?.end_point) return null;

  const dx = wall.end_point.x - wall.start_point.x;
  const dy = wall.end_point.y - wall.start_point.y;
  const length = Math.sqrt(dx * dx + dy * dy) * S;
  if (length < 0.01) return null;

  const height = (wall.height || 3000) * S;
  const thickness = (wall.thickness || 230) * S;
  const angle = Math.atan2(dy, dx);
  const cx = ((wall.start_point.x + wall.end_point.x) / 2) * S;
  const cy = ((wall.start_point.y + wall.end_point.y) / 2) * S;

  // Find openings on this wall
  const openings = useMemo(
    () => findOpeningsOnWall(wall, doors, windows),
    [wall, doors, windows]
  );

  // Create wall shape with holes
  const wallShape = useMemo(
    () => createWallShape(length, height, openings),
    [length, height, openings]
  );

  // Layer thicknesses
  const plasterT = 0.005; // 5mm plaster
  const coreT = thickness - plasterT * 2;
  const skirtH = 0.10; // 100mm skirting

  // Determine materials based on wall type
  const isExterior = wall.wall_type === 'exterior' || wall.wall_type === 'shear';
  const coreMaterial = isExterior ? 'brick' : 'concrete';
  const finishMaterial = wall.paint_color ? `paint_${wall.paint_color}` : (isExterior ? 'plaster_cream' : 'paint_white');

  return (
    <group
      position={[wall.start_point.x * S, 0, wall.start_point.y * S]}
      rotation={[0, -angle, 0]}
      onClick={(e) => { e.stopPropagation(); onSelect?.(wall._id || wall.canvas_id, 'wall'); }}
    >
      {/* Inner plaster/paint finish */}
      <WallLayer
        shape={wallShape}
        depth={plasterT}
        offsetZ={0}
        materialName={finishMaterial}
        color="#F5F0E8"
        renderMode={renderMode}
      />

      {/* Core — brick / concrete */}
      <WallLayer
        shape={wallShape}
        depth={coreT}
        offsetZ={plasterT}
        materialName={coreMaterial}
        color={wall.color || '#B85C38'}
        renderMode={renderMode}
      />

      {/* Outer plaster/paint finish */}
      <WallLayer
        shape={wallShape}
        depth={plasterT}
        offsetZ={plasterT + coreT}
        materialName={isExterior ? 'plaster_cream' : finishMaterial}
        color="#F0E8D8"
        renderMode={renderMode}
      />

      {/* Skirting board (inner side) */}
      <Skirting length={length} height={skirtH} depth={0.012} renderMode={renderMode} />

      {/* Selection highlight */}
      {selected && (
        <mesh position={[length / 2, height / 2, thickness / 2]}>
          <boxGeometry args={[length + 0.02, height + 0.02, thickness + 0.02]} />
          <meshBasicMaterial color="#FF6B35" transparent opacity={0.12} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
});

export default ProceduralWall;
export { findOpeningsOnWall, createWallShape };
