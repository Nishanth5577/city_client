// ═══════════════════════════════════════════════════════════════
// Procedural Roof — Auto-generate from wall outline
// Supports: Flat, Gable, Hip, Parapet
// ═══════════════════════════════════════════════════════════════
import { useMemo, memo } from 'react';
import * as THREE from 'three';
import { getProceduralMaterial } from './ProceduralTextures';

const S = 0.001;

// ─── Compute bounding box from wall endpoints ─────────────────
function getWallBounds(walls) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  (walls || []).forEach(w => {
    if (!w?.start_point || !w?.end_point) return;
    minX = Math.min(minX, w.start_point.x, w.end_point.x);
    maxX = Math.max(maxX, w.start_point.x, w.end_point.x);
    minY = Math.min(minY, w.start_point.y, w.end_point.y);
    maxY = Math.max(maxY, w.start_point.y, w.end_point.y);
  });
  if (!isFinite(minX)) return null;
  return { minX, maxX, minY, maxY, width: maxX - minX, depth: maxY - minY };
}

// ─── Flat Roof with Parapet ────────────────────────────────────
function FlatRoof({ bounds, wallHeight, overhang, renderMode }) {
  const w = bounds.width * S + overhang * 2;
  const d = bounds.depth * S + overhang * 2;
  const cx = (bounds.minX + bounds.maxX) / 2 * S;
  const cz = (bounds.minY + bounds.maxY) / 2 * S;
  const h = wallHeight * S;
  const slabH = 0.15; // 150mm slab
  const parapetH = 0.6; // 600mm parapet
  const parapetT = 0.1; // 100mm thick

  const matProps = useMemo(() => {
    if (renderMode === 'wireframe') return { color: '#888', wireframe: true };
    if (renderMode === 'xray') return { color: '#888', transparent: true, opacity: 0.08 };
    const tex = getProceduralMaterial('concrete');
    return tex ? { map: tex.map, normalMap: tex.normalMap, roughness: 0.9, metalness: 0 } : { color: '#C0C0C0', roughness: 0.9 };
  }, [renderMode]);

  return (
    <group>
      {/* Roof slab */}
      <mesh position={[cx, h + slabH / 2, cz]} castShadow receiveShadow>
        <boxGeometry args={[w, slabH, d]} />
        <meshStandardMaterial {...matProps} />
      </mesh>

      {/* Parapet walls — 4 sides */}
      {/* Front */}
      <mesh position={[cx, h + slabH + parapetH / 2, cz + d / 2 - parapetT / 2]} castShadow>
        <boxGeometry args={[w, parapetH, parapetT]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      {/* Back */}
      <mesh position={[cx, h + slabH + parapetH / 2, cz - d / 2 + parapetT / 2]} castShadow>
        <boxGeometry args={[w, parapetH, parapetT]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      {/* Left */}
      <mesh position={[cx - w / 2 + parapetT / 2, h + slabH + parapetH / 2, cz]} castShadow>
        <boxGeometry args={[parapetT, parapetH, d]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      {/* Right */}
      <mesh position={[cx + w / 2 - parapetT / 2, h + slabH + parapetH / 2, cz]} castShadow>
        <boxGeometry args={[parapetT, parapetH, d]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
    </group>
  );
}

// ─── Gable Roof ────────────────────────────────────────────────
function GableRoof({ bounds, wallHeight, overhang, slope, renderMode }) {
  const w = bounds.width * S + overhang * 2;
  const d = bounds.depth * S + overhang * 2;
  const cx = (bounds.minX + bounds.maxX) / 2 * S;
  const cz = (bounds.minY + bounds.maxY) / 2 * S;
  const h = wallHeight * S;
  const ridgeH = (w / 2) * Math.tan(slope * Math.PI / 180);

  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, 0);
    shape.lineTo(0, ridgeH);
    shape.lineTo(w / 2, 0);
    shape.lineTo(-w / 2, 0);

    const extrudeSettings = { steps: 1, depth: d, bevelEnabled: false };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.translate(0, 0, -d / 2);
    return geo;
  }, [w, d, ridgeH]);

  const matProps = useMemo(() => {
    if (renderMode === 'wireframe') return { color: '#888', wireframe: true };
    if (renderMode === 'xray') return { color: '#888', transparent: true, opacity: 0.08 };
    const tex = getProceduralMaterial('roof_tile');
    return tex ? { map: tex.map, normalMap: tex.normalMap, roughness: 0.8, metalness: 0 } : { color: '#8B4513', roughness: 0.8 };
  }, [renderMode]);

  return (
    <mesh geometry={geometry} position={[cx, h, cz]} rotation={[0, 0, 0]} castShadow receiveShadow>
      <meshStandardMaterial {...matProps} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ─── Hip Roof ──────────────────────────────────────────────────
function HipRoof({ bounds, wallHeight, overhang, slope, renderMode }) {
  const w = bounds.width * S + overhang * 2;
  const d = bounds.depth * S + overhang * 2;
  const cx = (bounds.minX + bounds.maxX) / 2 * S;
  const cz = (bounds.minY + bounds.maxY) / 2 * S;
  const h = wallHeight * S;
  const ridgeH = Math.min(w, d) / 2 * Math.tan(slope * Math.PI / 180);
  const ridgeLen = Math.abs(w - d) > 0.1 ? Math.max(w, d) - Math.min(w, d) : 0;

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    // 5 vertices: 4 base corners + 1 or 2 ridge points
    const hw = w / 2, hd = d / 2;

    if (ridgeLen < 0.1) {
      // Pyramid (square-ish plan)
      const vertices = new Float32Array([
        -hw, 0, -hd,  hw, 0, -hd,  hw, 0, hd,  -hw, 0, hd,  0, ridgeH, 0,
      ]);
      const indices = [0,1,4, 1,2,4, 2,3,4, 3,0,4, 0,2,1, 0,3,2];
      geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geo.setIndex(indices);
    } else {
      // Hip with ridge line
      const rhl = ridgeLen / 2;
      const inset = Math.min(hw, hd);
      const vertices = new Float32Array([
        -hw, 0, -hd,  hw, 0, -hd,  hw, 0, hd,  -hw, 0, hd,
        -rhl, ridgeH, 0,  rhl, ridgeH, 0,
      ]);
      const indices = [
        0,1,5, 0,5,4,  // Front
        1,2,5,          // Right
        2,3,4, 2,4,5,   // Back
        3,0,4,           // Left
        0,2,1, 0,3,2,   // Bottom
      ];
      geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geo.setIndex(indices);
    }
    geo.computeVertexNormals();
    return geo;
  }, [w, d, ridgeH, ridgeLen]);

  const matProps = useMemo(() => {
    if (renderMode === 'wireframe') return { color: '#888', wireframe: true };
    if (renderMode === 'xray') return { color: '#888', transparent: true, opacity: 0.08 };
    const tex = getProceduralMaterial('roof_tile');
    return tex ? { map: tex.map, normalMap: tex.normalMap, roughness: 0.8, metalness: 0 } : { color: '#8B4513', roughness: 0.8 };
  }, [renderMode]);

  return (
    <mesh geometry={geometry} position={[cx, h, cz]} castShadow receiveShadow>
      <meshStandardMaterial {...matProps} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ─── Main Component ────────────────────────────────────────────
const ProceduralRoof = memo(function ProceduralRoof({
  walls,
  roofType = 'flat', // 'flat', 'gable', 'hip'
  wallHeight = 3000,
  overhang = 0.3,    // meters
  slope = 25,        // degrees
  renderMode,
}) {
  const bounds = useMemo(() => getWallBounds(walls), [walls]);
  if (!bounds || bounds.width < 100 || bounds.depth < 100) return null;

  switch (roofType) {
    case 'gable':
      return <GableRoof bounds={bounds} wallHeight={wallHeight} overhang={overhang} slope={slope} renderMode={renderMode} />;
    case 'hip':
      return <HipRoof bounds={bounds} wallHeight={wallHeight} overhang={overhang} slope={slope} renderMode={renderMode} />;
    case 'flat':
    default:
      return <FlatRoof bounds={bounds} wallHeight={wallHeight} overhang={overhang} renderMode={renderMode} />;
  }
});

export default ProceduralRoof;
export { getWallBounds };
