// ═══════════════════════════════════════════════════════════════
// Slab3D — Floor/ceiling slab from boundary polygon
// Proper slab geometry with edge visibility
// ═══════════════════════════════════════════════════════════════
import { memo, useMemo } from 'react';
import * as THREE from 'three';
import { MM_TO_M } from '../../../../stores/bimTypes';
import { getPBRMaterial } from '../../../../bim/core/ProceduralPBR';

const Slab3D = memo(function Slab3D({ slab, selected, onClick }) {
  const S = MM_TO_M;
  const {
    boundary = [], thickness = 150, elevation = 0,
    material = 'concrete',
  } = slab;

  const slabGeometry = useMemo(() => {
    if (boundary.length < 3) return null;

    const shape = new THREE.Shape();
    shape.moveTo(boundary[0].x * S, boundary[0].y * S);
    for (let i = 1; i < boundary.length; i++) {
      shape.lineTo(boundary[i].x * S, boundary[i].y * S);
    }
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: thickness * S,
      bevelEnabled: false,
      steps: 1,
    });

    // Rotate to lay flat (extrude goes along Z, we want Y)
    geometry.rotateX(-Math.PI / 2);

    return geometry;
  }, [boundary, thickness]);

  const slabMaterial = useMemo(() => {
    if (selected) {
      return new THREE.MeshStandardMaterial({
        color: '#4FC3F7', roughness: 0.5, transparent: true, opacity: 0.8,
      });
    }
    return getPBRMaterial(material);
  }, [material, selected]);

  if (!slabGeometry) return null;

  return (
    <mesh
      geometry={slabGeometry}
      material={slabMaterial}
      position={[0, elevation * S, 0]}
      castShadow
      receiveShadow
      onClick={(e) => { e.stopPropagation(); onClick?.(slab); }}
    />
  );
});

export default Slab3D;
