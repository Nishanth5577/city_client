// ═══════════════════════════════════════════════════════════════
// Wall3D — Modern Architectural Wall with PBR Materials
// Clean white exterior, proper CSG openings, selection outline
// Matches high-end arch-viz aesthetic: crisp, clean, modern
// ═══════════════════════════════════════════════════════════════
import { useMemo, memo, useRef } from 'react';
import * as THREE from 'three';
import { MM_TO_M } from '../../../../stores/bimTypes';
import { createWallWithOpenings } from '../../../../bim/core/WallCSG';
import { getPBRMaterial } from '../../../../bim/core/ProceduralPBR';
import useBimStore from '../../../../stores/bimStore';

// Modern architectural material palette
const WALL_MATERIALS = {
  exterior: {
    color: '#F2EDE6',      // warm white plaster
    roughness: 0.75,
    metalness: 0.0,
  },
  exterior_accent: {
    color: '#B08050',      // wood cladding accent
    roughness: 0.55,
    metalness: 0.0,
  },
  interior: {
    color: '#FAFAF8',      // clean white interior
    roughness: 0.85,
    metalness: 0.0,
  },
  concrete: {
    color: '#D8D4CC',      // exposed concrete
    roughness: 0.65,
    metalness: 0.02,
  },
  partition: {
    color: '#F0EDE8',      // partition wall
    roughness: 0.8,
    metalness: 0.0,
  },
};

const Wall3D = memo(function Wall3D({ wall, doors = [], windows = [], floorElevation = 0, selected, hovered, onClick, isDollhouse }) {
  const S = MM_TO_M;
  const meshRef = useRef();
  const {
    start, end, height = 3200, thickness = 200,
    color, material = 'plaster', wallType = 'exterior',
  } = wall;

  // Create wall geometry with real openings
  const wallData = useMemo(() => {
    if (!start || !end) return null;
    return createWallWithOpenings(
      { ...wall, height, thickness },
      doors, windows
    );
  }, [start, end, height, thickness, wall.id, doors, windows]);

  // Material — prioritize modern clean look
  const wallMaterial = useMemo(() => {
    if (selected) {
      return new THREE.MeshStandardMaterial({
        color: '#64B5F6',
        roughness: 0.5,
        metalness: 0.0,
        transparent: true,
        opacity: 0.85,
        emissive: '#1565C0',
        emissiveIntensity: 0.1,
      });
    }
    if (hovered) {
      return new THREE.MeshStandardMaterial({
        color: '#90CAF9',
        roughness: 0.5,
        metalness: 0.0,
        transparent: true,
        opacity: 0.9,
      });
    }

    // Check if there's a specific material override
    if (material === 'wood_cladding' || material === 'wood') {
      const preset = WALL_MATERIALS.exterior_accent;
      return new THREE.MeshStandardMaterial({
        color: preset.color,
        roughness: preset.roughness,
        metalness: preset.metalness,
      });
    }

    if (material === 'concrete_exposed' || material === 'concrete') {
      const preset = WALL_MATERIALS.concrete;
      return new THREE.MeshStandardMaterial({
        color: preset.color,
        roughness: preset.roughness,
        metalness: preset.metalness,
      });
    }

    // Default: clean modern wall based on type
    const preset = wallType === 'exterior'
      ? WALL_MATERIALS.exterior
      : wallType === 'partition'
        ? WALL_MATERIALS.partition
        : WALL_MATERIALS.interior;

    return new THREE.MeshStandardMaterial({
      color: color || preset.color,
      roughness: preset.roughness,
      metalness: preset.metalness,
      side: THREE.DoubleSide,
    });
  }, [material, wallType, color, selected, hovered]);

  if (!wallData) return null;

  const { geometry, position, rotation } = wallData;
  const adjustedPos = [position[0], floorElevation * S + position[1], position[2]];

  // In dollhouse mode, reduce wall height
  const wallHeight = isDollhouse ? height * 0.65 : height;

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={wallMaterial}
        position={adjustedPos}
        rotation={rotation}
        castShadow
        receiveShadow
        onClick={(e) => { e.stopPropagation(); onClick?.(wall); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      />

      {/* Selection glow outline */}
      {selected && (
        <mesh position={adjustedPos} rotation={rotation}>
          <boxGeometry args={[
            wallData.wallLength + 0.03,
            height * S + 0.03,
            thickness * S + 0.03
          ]} />
          <meshBasicMaterial
            color="#2196F3"
            wireframe
            transparent
            opacity={0.35}
          />
        </mesh>
      )}
    </group>
  );
});

export default Wall3D;
