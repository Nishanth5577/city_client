// ═══════════════════════════════════════════════════════════════
// Window3D — Detailed architectural window with aluminum/wood
// frame, glass panels with reflections, mullions, sill
// ═══════════════════════════════════════════════════════════════
import { memo, useMemo } from 'react';
import * as THREE from 'three';
import { MM_TO_M } from '../../../../stores/bimTypes';
import { getOpeningWorldPosition } from '../../../../bim/core/WallCSG';

const Window3D = memo(function Window3D({ window: win, wall, floorElevation = 0, selected, hovered, onClick }) {
  const S = MM_TO_M;
  const {
    width = 1200, height = 1200, sillHeight = 900, frameWidth = 50,
    windowType = 'fixed', absolutePosition, wallSide, material: frameMaterial = 'aluminium',
    position: posParam,
  } = win;

  const geom = useMemo(() => {
    let posX, posZ, angle;
    if (absolutePosition) {
      posX = absolutePosition.x * S;
      posZ = absolutePosition.y * S;
      const rotations = { south: 0, east: Math.PI / 2, north: Math.PI, west: -Math.PI / 2 };
      angle = rotations[wallSide] || 0;
    } else if (wall) {
      const wp = getOpeningWorldPosition(wall, posParam, 0);
      if (!wp) return null;
      posX = wp.x;
      posZ = wp.z;
      angle = wp.angle;
    } else return null;
    return { posX, posZ, angle };
  }, [absolutePosition, wallSide, wall, posParam]);

  if (!geom) return null;

  const w = width * S;
  const h = height * S;
  const sill = sillHeight * S;
  const fw = frameWidth * S;
  const wt = wall ? (wall.thickness || 200) * S : 0.2;
  const elev = floorElevation * S;
  const centerY = elev + sill + h / 2;

  const isSelected = selected || hovered;
  const frameCol = isSelected ? '#4FC3F7' : (frameMaterial === 'aluminium' ? '#2C2C2C' : '#5D4037');
  const frameRoughness = frameMaterial === 'aluminium' ? 0.25 : 0.5;
  const frameMetalness = frameMaterial === 'aluminium' ? 0.9 : 0.0;

  // Number of horizontal panes
  const numHPanes = windowType === 'sliding' ? 2 : windowType === 'large_glass' ? 1 : width > 1500 ? 2 : 1;
  const numVPanes = height > 1500 ? 2 : 1;

  return (
    <group
      position={[geom.posX, centerY, geom.posZ]}
      rotation={[0, -geom.angle, 0]}
      onClick={(e) => { e.stopPropagation(); onClick?.(win); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      {/* Outer Frame — 4 pieces with profile depth */}
      {/* Top frame */}
      <mesh position={[0, h / 2 - fw / 2, 0]} castShadow>
        <boxGeometry args={[w, fw, wt * 0.6]} />
        <meshStandardMaterial color={frameCol} roughness={frameRoughness} metalness={frameMetalness} />
      </mesh>
      {/* Bottom frame */}
      <mesh position={[0, -h / 2 + fw / 2, 0]} castShadow>
        <boxGeometry args={[w, fw, wt * 0.6]} />
        <meshStandardMaterial color={frameCol} roughness={frameRoughness} metalness={frameMetalness} />
      </mesh>
      {/* Left frame */}
      <mesh position={[-w / 2 + fw / 2, 0, 0]} castShadow>
        <boxGeometry args={[fw, h, wt * 0.6]} />
        <meshStandardMaterial color={frameCol} roughness={frameRoughness} metalness={frameMetalness} />
      </mesh>
      {/* Right frame */}
      <mesh position={[w / 2 - fw / 2, 0, 0]} castShadow>
        <boxGeometry args={[fw, h, wt * 0.6]} />
        <meshStandardMaterial color={frameCol} roughness={frameRoughness} metalness={frameMetalness} />
      </mesh>

      {/* Mullions (vertical dividers) */}
      {numHPanes > 1 && (
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[fw * 0.7, h - fw * 2, wt * 0.5]} />
          <meshStandardMaterial color={frameCol} roughness={frameRoughness} metalness={frameMetalness} />
        </mesh>
      )}

      {/* Transoms (horizontal dividers) */}
      {numVPanes > 1 && (
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[w - fw * 2, fw * 0.7, wt * 0.5]} />
          <meshStandardMaterial color={frameCol} roughness={frameRoughness} metalness={frameMetalness} />
        </mesh>
      )}

      {/* Glass Panes */}
      {Array.from({ length: numHPanes }).map((_, hi) =>
        Array.from({ length: numVPanes }).map((_, vi) => {
          const paneW = (w - fw * 2 - (numHPanes - 1) * fw * 0.7) / numHPanes;
          const paneH = (h - fw * 2 - (numVPanes - 1) * fw * 0.7) / numVPanes;
          const px = -w / 2 + fw + paneW / 2 + hi * (paneW + fw * 0.7);
          const py = -h / 2 + fw + paneH / 2 + vi * (paneH + fw * 0.7);

          return (
            <mesh key={`${hi}_${vi}`} position={[px, py, 0]}>
              <boxGeometry args={[paneW - 0.004, paneH - 0.004, 0.006]} />
              <meshPhysicalMaterial
                color={isSelected ? '#B3E5FC' : '#C8E6F8'}
                transparent
                opacity={0.2}
                roughness={0.02}
                metalness={0.0}
                transmission={0.88}
                ior={1.5}
                thickness={0.006}
                envMapIntensity={1.5}
                side={THREE.DoubleSide}
              />
            </mesh>
          );
        })
      )}

      {/* Window Sill — extending out from wall */}
      <mesh position={[0, -h / 2 - 0.012, wt * 0.25]} castShadow>
        <boxGeometry args={[w + 0.04, 0.025, wt * 0.8]} />
        <meshStandardMaterial color="#9E9E9E" roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Interior sill */}
      <mesh position={[0, -h / 2 - 0.012, -wt * 0.25]} castShadow>
        <boxGeometry args={[w + 0.02, 0.02, wt * 0.6]} />
        <meshStandardMaterial color="#E0E0E0" roughness={0.6} metalness={0.0} />
      </mesh>

      {/* Sliding track indicator */}
      {windowType === 'sliding' && (
        <>
          <mesh position={[0, -h / 2 + fw + 0.002, wt * 0.15]}>
            <boxGeometry args={[w - fw * 2, 0.004, 0.008]} />
            <meshStandardMaterial color={frameCol} roughness={0.3} metalness={0.8} />
          </mesh>
          <mesh position={[0, h / 2 - fw - 0.002, wt * 0.15]}>
            <boxGeometry args={[w - fw * 2, 0.004, 0.008]} />
            <meshStandardMaterial color={frameCol} roughness={0.3} metalness={0.8} />
          </mesh>
        </>
      )}

      {/* Selection wireframe */}
      {isSelected && (
        <mesh>
          <boxGeometry args={[w + 0.02, h + 0.02, wt + 0.04]} />
          <meshBasicMaterial color="#2196F3" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
});

export default Window3D;
