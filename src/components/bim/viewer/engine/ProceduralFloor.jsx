// ═══════════════════════════════════════════════════════════════
// Procedural Floor — Room-shaped floors with per-room textures
// ═══════════════════════════════════════════════════════════════
import { useMemo, memo } from 'react';
import * as THREE from 'three';
import { getProceduralMaterial } from './ProceduralTextures';

const S = 0.001;

// Floor material mapping by room type
const FLOOR_MATERIALS = {
  living: 'wood_oak',
  bedroom: 'wood_teak',
  master_bedroom: 'wood_walnut',
  kitchen: 'tiles_kitchen',
  bathroom: 'tiles_bathroom',
  toilet: 'tiles_bathroom',
  dining: 'wood_oak',
  pooja: 'marble',
  entrance: 'marble',
  hallway: 'marble',
  corridor: 'tiles',
  balcony: 'tiles',
  parking: 'concrete',
  utility: 'tiles',
  storeroom: 'concrete',
  default: 'tiles',
};

const ProceduralFloor = memo(function ProceduralFloor({ points, roomType, floorY = 0, renderMode }) {
  if (!points || points.length < 3) return null;

  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(points[0].x * S, points[0].y * S);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i].x * S, points[i].y * S);
    }
    shape.lineTo(points[0].x * S, points[0].y * S);

    const geo = new THREE.ShapeGeometry(shape);
    // Rotate to lay flat (XZ plane)
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [points]);

  const matProps = useMemo(() => {
    if (renderMode === 'wireframe') return { color: '#666', wireframe: true };
    if (renderMode === 'xray') return { color: '#666', transparent: true, opacity: 0.08 };

    const matName = FLOOR_MATERIALS[roomType] || FLOOR_MATERIALS.default;
    const tex = getProceduralMaterial(matName);
    if (tex) {
      return {
        map: tex.map,
        normalMap: tex.normalMap || null,
        roughnessMap: tex.roughnessMap || null,
        roughness: tex.roughness ?? 0.5,
        metalness: tex.metalness ?? 0,
      };
    }
    return { color: '#D8D0C0', roughness: 0.6 };
  }, [roomType, renderMode]);

  return (
    <mesh geometry={geometry} position={[0, floorY + 0.001, 0]} receiveShadow>
      <meshStandardMaterial {...matProps} side={THREE.DoubleSide} />
    </mesh>
  );
});

export default ProceduralFloor;
export { FLOOR_MATERIALS };
