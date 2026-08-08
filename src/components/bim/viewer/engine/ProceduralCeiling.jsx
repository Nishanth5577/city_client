// ═══════════════════════════════════════════════════════════════
// Procedural Ceiling — Room-shaped ceilings
// ═══════════════════════════════════════════════════════════════
import { useMemo, memo } from 'react';
import * as THREE from 'three';
import { getProceduralMaterial } from './ProceduralTextures';

const S = 0.001;

const ProceduralCeiling = memo(function ProceduralCeiling({ points, ceilingHeight = 3000, renderMode }) {
  if (!points || points.length < 3) return null;

  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(points[0].x * S, points[0].y * S);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i].x * S, points[i].y * S);
    }
    shape.lineTo(points[0].x * S, points[0].y * S);

    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [points]);

  const matProps = useMemo(() => {
    if (renderMode === 'wireframe') return { color: '#888', wireframe: true };
    if (renderMode === 'xray') return { color: '#888', transparent: true, opacity: 0.05 };
    const tex = getProceduralMaterial('plaster_white');
    if (tex) {
      return { map: tex.map, normalMap: tex.normalMap || null, roughness: 0.9, metalness: 0 };
    }
    return { color: '#FFFFFF', roughness: 0.9 };
  }, [renderMode]);

  return (
    <mesh geometry={geometry} position={[0, ceilingHeight * S, 0]} receiveShadow>
      <meshStandardMaterial {...matProps} side={THREE.DoubleSide} />
    </mesh>
  );
});

export default ProceduralCeiling;
