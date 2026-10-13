// ═══════════════════════════════════════════════════════════════
// Door3D — Detailed architectural door with frame, panels, handle
// Supports: single, double, sliding, glass, main entrance
// Proper positioning within wall opening
// ═══════════════════════════════════════════════════════════════
import { useMemo, memo } from 'react';
import * as THREE from 'three';
import { MM_TO_M } from '../../../../stores/bimTypes';
import { getOpeningWorldPosition } from '../../../../bim/core/WallCSG';
import { getPBRMaterial } from '../../../../bim/core/ProceduralPBR';

const Door3D = memo(function Door3D({ door, wall, floorElevation = 0, selected, hovered, onClick }) {
  const S = MM_TO_M;
  const {
    width = 900, height = 2100, doorType = 'single', frameWidth = 50,
    color = '#8B4513', material = 'wood_oak', swingDirection = 'left',
    absolutePosition, position: posParam,
  } = door;

  const doorGeometry = useMemo(() => {
    let posX, posZ, angle;
    if (absolutePosition) {
      posX = absolutePosition.x * S;
      posZ = absolutePosition.y * S;
      angle = 0;
      if (wall) {
        angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
      }
    } else if (wall) {
      const wp = getOpeningWorldPosition(wall, posParam, 0);
      if (!wp) return null;
      posX = wp.x;
      posZ = wp.z;
      angle = wp.angle;
    } else return null;

    return { posX, posZ, angle };
  }, [absolutePosition, wall, posParam]);

  if (!doorGeometry) return null;
  const { posX, posZ, angle } = doorGeometry;

  const w = width * S;
  const h = height * S;
  const fw = frameWidth * S;
  const wt = wall ? (wall.thickness || 200) * S : 0.2; // wall thickness
  const elev = floorElevation * S;

  const isSelected = selected || hovered;
  const frameCol = isSelected ? '#4FC3F7' : '#3E2723';
  const panelCol = isSelected ? '#64B5F6' : color;
  const handleCol = '#B8B8B8';

  return (
    <group
      position={[posX, elev, posZ]}
      rotation={[0, -angle, 0]}
      onClick={(e) => { e.stopPropagation(); onClick?.(door); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      {/* Door Frame — 3-piece (left, right, top) embedded in wall thickness */}
      {/* Left frame */}
      <mesh position={[-w / 2 + fw / 2, h / 2, 0]} castShadow>
        <boxGeometry args={[fw, h, wt + 0.01]} />
        <meshStandardMaterial color={frameCol} roughness={0.45} metalness={0.0} />
      </mesh>
      {/* Right frame */}
      <mesh position={[w / 2 - fw / 2, h / 2, 0]} castShadow>
        <boxGeometry args={[fw, h, wt + 0.01]} />
        <meshStandardMaterial color={frameCol} roughness={0.45} metalness={0.0} />
      </mesh>
      {/* Top frame */}
      <mesh position={[0, h - fw / 2, 0]} castShadow>
        <boxGeometry args={[w, fw, wt + 0.01]} />
        <meshStandardMaterial color={frameCol} roughness={0.45} metalness={0.0} />
      </mesh>
      {/* Threshold */}
      <mesh position={[0, 0.005, 0]} castShadow>
        <boxGeometry args={[w - fw, 0.01, wt + 0.02]} />
        <meshStandardMaterial color="#808080" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Door Panel(s) */}
      {doorType === 'double' ? (
        <>
          {/* Left panel */}
          <mesh position={[-w / 4, h / 2 - fw / 2, wt * 0.3]} castShadow>
            <boxGeometry args={[w / 2 - fw * 2, h - fw * 2, 0.04]} />
            <meshStandardMaterial color={panelCol} roughness={0.4} metalness={0.0} />
          </mesh>
          {/* Left panel recess */}
          <mesh position={[-w / 4, h * 0.55, wt * 0.3 + 0.022]}>
            <boxGeometry args={[w / 2 - fw * 3.5, h * 0.35, 0.003]} />
            <meshStandardMaterial color={panelCol} roughness={0.35} metalness={0.0} />
          </mesh>
          {/* Right panel */}
          <mesh position={[w / 4, h / 2 - fw / 2, wt * 0.3]} castShadow>
            <boxGeometry args={[w / 2 - fw * 2, h - fw * 2, 0.04]} />
            <meshStandardMaterial color={panelCol} roughness={0.4} metalness={0.0} />
          </mesh>
          {/* Right panel recess */}
          <mesh position={[w / 4, h * 0.55, wt * 0.3 + 0.022]}>
            <boxGeometry args={[w / 2 - fw * 3.5, h * 0.35, 0.003]} />
            <meshStandardMaterial color={panelCol} roughness={0.35} metalness={0.0} />
          </mesh>
        </>
      ) : doorType === 'glass' || doorType === 'sliding' ? (
        <>
          {/* Glass panel with thin frame */}
          <mesh position={[0, h / 2 - fw / 2, wt * 0.3]}>
            <boxGeometry args={[w - fw * 3, h - fw * 2.5, 0.008]} />
            <meshPhysicalMaterial
              color="#D0E8F0"
              transparent
              opacity={0.2}
              roughness={0.05}
              metalness={0.0}
              transmission={0.85}
              ior={1.5}
              envMapIntensity={1.0}
            />
          </mesh>
          {/* Inner frame */}
          <mesh position={[0, h / 2 - fw / 2, wt * 0.3]}>
            <boxGeometry args={[w - fw * 3 + 0.01, h - fw * 2.5 + 0.01, 0.006]} />
            <meshStandardMaterial color={frameCol} roughness={0.3} metalness={0.85} wireframe={false} />
          </mesh>
        </>
      ) : doorType === 'main_entrance' ? (
        <>
          {/* Solid panel with decorative elements */}
          <mesh position={[0, h / 2 - fw / 2, wt * 0.3]} castShadow>
            <boxGeometry args={[w - fw * 3, h - fw * 2, 0.05]} />
            <meshStandardMaterial color={panelCol} roughness={0.35} metalness={0.0} />
          </mesh>
          {/* Upper panel recess */}
          <mesh position={[0, h * 0.65, wt * 0.3 + 0.027]}>
            <boxGeometry args={[w - fw * 5, h * 0.25, 0.005]} />
            <meshStandardMaterial color={panelCol} roughness={0.3} metalness={0.0} />
          </mesh>
          {/* Lower panel recess */}
          <mesh position={[0, h * 0.25, wt * 0.3 + 0.027]}>
            <boxGeometry args={[w - fw * 5, h * 0.3, 0.005]} />
            <meshStandardMaterial color={panelCol} roughness={0.3} metalness={0.0} />
          </mesh>
        </>
      ) : (
        <>
          {/* Single panel door */}
          <mesh position={[0, h / 2 - fw / 2, wt * 0.3]} castShadow>
            <boxGeometry args={[w - fw * 3, h - fw * 2, 0.04]} />
            <meshStandardMaterial color={panelCol} roughness={0.4} metalness={0.0} />
          </mesh>
          {/* Upper recess */}
          <mesh position={[0, h * 0.6, wt * 0.3 + 0.022]}>
            <boxGeometry args={[w - fw * 5, h * 0.3, 0.003]} />
            <meshStandardMaterial color={panelCol} roughness={0.35} metalness={0.0} />
          </mesh>
          {/* Lower recess */}
          <mesh position={[0, h * 0.22, wt * 0.3 + 0.022]}>
            <boxGeometry args={[w - fw * 5, h * 0.25, 0.003]} />
            <meshStandardMaterial color={panelCol} roughness={0.35} metalness={0.0} />
          </mesh>
        </>
      )}

      {/* Door Handle — lever style */}
      {doorType !== 'sliding' && (
        <group position={[
          swingDirection === 'left' ? w / 2 - fw * 3.5 : -w / 2 + fw * 3.5,
          h * 0.45,
          wt * 0.3 + 0.03
        ]}>
          {/* Rosette */}
          <mesh castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.01, 12]} />
            <meshStandardMaterial color={handleCol} roughness={0.2} metalness={0.9} />
          </mesh>
          {/* Lever */}
          <mesh position={[0, 0, 0.03]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.006, 0.006, 0.1, 8]} />
            <meshStandardMaterial color={handleCol} roughness={0.2} metalness={0.9} />
          </mesh>
          {/* Lever end */}
          <mesh position={[0, -0.05, 0.03]} castShadow>
            <cylinderGeometry args={[0.006, 0.006, 0.02, 8]} />
            <meshStandardMaterial color={handleCol} roughness={0.2} metalness={0.9} />
          </mesh>
        </group>
      )}

      {/* Hinges (for non-sliding doors) */}
      {doorType !== 'sliding' && doorType !== 'glass' && (
        <>
          <mesh position={[swingDirection === 'left' ? -w / 2 + fw * 1.5 : w / 2 - fw * 1.5, h * 0.15, wt * 0.3 + 0.02]} castShadow>
            <boxGeometry args={[0.015, 0.06, 0.012]} />
            <meshStandardMaterial color="#888" roughness={0.3} metalness={0.8} />
          </mesh>
          <mesh position={[swingDirection === 'left' ? -w / 2 + fw * 1.5 : w / 2 - fw * 1.5, h * 0.8, wt * 0.3 + 0.02]} castShadow>
            <boxGeometry args={[0.015, 0.06, 0.012]} />
            <meshStandardMaterial color="#888" roughness={0.3} metalness={0.8} />
          </mesh>
        </>
      )}

      {/* Selection wireframe */}
      {isSelected && (
        <mesh position={[0, h / 2, 0]}>
          <boxGeometry args={[w + 0.02, h + 0.02, wt + 0.04]} />
          <meshBasicMaterial color="#2196F3" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
});

export default Door3D;
