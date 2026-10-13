// ═══════════════════════════════════════════════════════════════
// Roof3D — Detailed architectural roof (flat, gable, hip, shed)
// Fascia, parapet, overhang, proper slope geometry
// ═══════════════════════════════════════════════════════════════
import { memo, useMemo } from 'react';
import * as THREE from 'three';
import { MM_TO_M } from '../../../../stores/bimTypes';

const Roof3D = memo(function Roof3D({ roof, selected, onClick }) {
  const S = MM_TO_M;
  const {
    roofType = 'flat', pitch = 30, overhang = 600,
    thickness = 200, ridgeHeight = 0, material = 'concrete',
    boundary = [], buildingWidth = 15000, buildingLength = 12000,
    elevation = 6400, color = '#9E9E9E',
  } = roof;

  const roofColor = selected ? '#4FC3F7' : color;
  const fasciaColor = selected ? '#4FC3F7' : '#E0E0E0';
  const elevM = elevation * S;

  const roofData = useMemo(() => {
    if (boundary.length < 4) return null;
    const minX = Math.min(...boundary.map(p => p.x)) * S;
    const maxX = Math.max(...boundary.map(p => p.x)) * S;
    const minZ = Math.min(...boundary.map(p => p.y)) * S;
    const maxZ = Math.max(...boundary.map(p => p.y)) * S;
    const w = maxX - minX;
    const d = maxZ - minZ;
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    return { minX, maxX, minZ, maxZ, w, d, cx, cz };
  }, [boundary]);

  if (!roofData) return null;
  const { w, d, cx, cz, minX, minZ } = roofData;
  const t = thickness * S;
  const rH = ridgeHeight * S;

  if (roofType === 'flat') {
    return (
      <group onClick={(e) => { e.stopPropagation(); onClick?.(roof); }}>
        {/* Flat roof slab */}
        <mesh position={[cx, elevM + t / 2, cz]} castShadow receiveShadow>
          <boxGeometry args={[w, t, d]} />
          <meshStandardMaterial color={roofColor} roughness={0.85} metalness={0.0} />
        </mesh>

        {/* Parapet walls — 4 sides */}
        {/* Front parapet */}
        <mesh position={[cx, elevM + t + 0.45 * S, cz - d / 2 + 0.05]} castShadow>
          <boxGeometry args={[w, 0.9 * S, 0.12]} />
          <meshStandardMaterial color={fasciaColor} roughness={0.7} />
        </mesh>
        {/* Back parapet */}
        <mesh position={[cx, elevM + t + 0.45 * S, cz + d / 2 - 0.05]} castShadow>
          <boxGeometry args={[w, 0.9 * S, 0.12]} />
          <meshStandardMaterial color={fasciaColor} roughness={0.7} />
        </mesh>
        {/* Left parapet */}
        <mesh position={[cx - w / 2 + 0.05, elevM + t + 0.45 * S, cz]} castShadow>
          <boxGeometry args={[0.12, 0.9 * S, d]} />
          <meshStandardMaterial color={fasciaColor} roughness={0.7} />
        </mesh>
        {/* Right parapet */}
        <mesh position={[cx + w / 2 - 0.05, elevM + t + 0.45 * S, cz]} castShadow>
          <boxGeometry args={[0.12, 0.9 * S, d]} />
          <meshStandardMaterial color={fasciaColor} roughness={0.7} />
        </mesh>

        {/* Parapet coping (top cap) */}
        <mesh position={[cx, elevM + t + 0.9 * S + 0.015, cz - d / 2 + 0.05]} castShadow>
          <boxGeometry args={[w + 0.04, 0.03, 0.18]} />
          <meshStandardMaterial color="#D0D0D0" roughness={0.4} metalness={0.1} />
        </mesh>
        <mesh position={[cx, elevM + t + 0.9 * S + 0.015, cz + d / 2 - 0.05]} castShadow>
          <boxGeometry args={[w + 0.04, 0.03, 0.18]} />
          <meshStandardMaterial color="#D0D0D0" roughness={0.4} metalness={0.1} />
        </mesh>
        <mesh position={[cx - w / 2 + 0.05, elevM + t + 0.9 * S + 0.015, cz]} castShadow>
          <boxGeometry args={[0.18, 0.03, d + 0.04]} />
          <meshStandardMaterial color="#D0D0D0" roughness={0.4} metalness={0.1} />
        </mesh>
        <mesh position={[cx + w / 2 - 0.05, elevM + t + 0.9 * S + 0.015, cz]} castShadow>
          <boxGeometry args={[0.18, 0.03, d + 0.04]} />
          <meshStandardMaterial color="#D0D0D0" roughness={0.4} metalness={0.1} />
        </mesh>

        {/* Selection */}
        {selected && (
          <mesh position={[cx, elevM + t / 2 + 0.5, cz]}>
            <boxGeometry args={[w + 0.1, t + 1.2, d + 0.1]} />
            <meshBasicMaterial color="#2196F3" wireframe transparent opacity={0.3} />
          </mesh>
        )}
      </group>
    );
  }

  if (roofType === 'gable') {
    const slopeAngle = pitch * Math.PI / 180;
    const actualRH = Math.tan(slopeAngle) * (buildingWidth * S / 2);

    return (
      <group onClick={(e) => { e.stopPropagation(); onClick?.(roof); }}>
        {/* Two sloped planes */}
        {[-1, 1].map(side => {
          const slopeLen = (buildingWidth * S / 2) / Math.cos(slopeAngle);
          return (
            <mesh
              key={side}
              position={[cx + side * buildingWidth * S / 4, elevM + actualRH / 2 + t / 2, cz]}
              rotation={[0, 0, side * slopeAngle]}
              castShadow receiveShadow
            >
              <boxGeometry args={[slopeLen, t, d]} />
              <meshStandardMaterial color={roofColor} roughness={0.85} />
            </mesh>
          );
        })}

        {/* Ridge beam */}
        <mesh position={[cx, elevM + actualRH + t / 2, cz]} castShadow>
          <boxGeometry args={[0.1, 0.08, d + 0.1]} />
          <meshStandardMaterial color="#808080" roughness={0.6} metalness={0.3} />
        </mesh>

        {/* Gable end walls (triangles) */}
        {[-1, 1].map(side => {
          const shape = new THREE.Shape();
          shape.moveTo(-buildingWidth * S / 2, 0);
          shape.lineTo(buildingWidth * S / 2, 0);
          shape.lineTo(0, actualRH);
          shape.closePath();
          const geom = new THREE.ShapeGeometry(shape);

          return (
            <mesh
              key={`gable_${side}`}
              geometry={geom}
              position={[cx, elevM, cz + side * d / 2]}
              rotation={[0, side === 1 ? Math.PI : 0, 0]}
              castShadow
            >
              <meshStandardMaterial color={fasciaColor} roughness={0.7} side={THREE.DoubleSide} />
            </mesh>
          );
        })}

        {/* Fascia boards */}
        {[-1, 1].map(side => (
          <mesh key={`fascia_${side}`}
            position={[cx + side * w / 2, elevM + 0.05, cz]}
            castShadow>
            <boxGeometry args={[0.02, 0.15, d + 0.1]} />
            <meshStandardMaterial color={fasciaColor} roughness={0.5} />
          </mesh>
        ))}

        {selected && (
          <mesh position={[cx, elevM + actualRH / 2, cz]}>
            <boxGeometry args={[w + 0.2, actualRH + t + 0.2, d + 0.2]} />
            <meshBasicMaterial color="#2196F3" wireframe transparent opacity={0.3} />
          </mesh>
        )}
      </group>
    );
  }

  if (roofType === 'hip') {
    const slopeAngle = pitch * Math.PI / 180;
    const actualRH = Math.tan(slopeAngle) * Math.min(buildingWidth, buildingLength) * S / 2;
    const ridgeLen = Math.max(0, d - w);

    return (
      <group onClick={(e) => { e.stopPropagation(); onClick?.(roof); }}>
        {/* Four sloped planes - approximated as box for now */}
        <mesh position={[cx, elevM + actualRH / 2, cz]} castShadow receiveShadow>
          <coneGeometry args={[Math.max(w, d) / 2 * 1.1, actualRH, 4]} />
          <meshStandardMaterial color={roofColor} roughness={0.85} flatShading />
        </mesh>
        {/* Base edge */}
        <mesh position={[cx, elevM + t / 2, cz]} castShadow>
          <boxGeometry args={[w + 0.04, t, d + 0.04]} />
          <meshStandardMaterial color={fasciaColor} roughness={0.6} />
        </mesh>
        {selected && (
          <mesh position={[cx, elevM + actualRH / 2, cz]}>
            <boxGeometry args={[w + 0.2, actualRH + 0.2, d + 0.2]} />
            <meshBasicMaterial color="#2196F3" wireframe transparent opacity={0.3} />
          </mesh>
        )}
      </group>
    );
  }

  if (roofType === 'shed') {
    const slopeAngle = pitch * Math.PI / 180;
    const actualRH = Math.tan(slopeAngle) * buildingLength * S;
    const slopeLen = buildingLength * S / Math.cos(slopeAngle);

    return (
      <group onClick={(e) => { e.stopPropagation(); onClick?.(roof); }}>
        <mesh
          position={[cx, elevM + actualRH / 2, cz]}
          rotation={[slopeAngle, 0, 0]}
          castShadow receiveShadow
        >
          <boxGeometry args={[w, t, slopeLen]} />
          <meshStandardMaterial color={roofColor} roughness={0.85} />
        </mesh>
        {selected && (
          <mesh position={[cx, elevM + actualRH / 2, cz]}>
            <boxGeometry args={[w + 0.2, actualRH + t + 0.2, d + 0.2]} />
            <meshBasicMaterial color="#2196F3" wireframe transparent opacity={0.3} />
          </mesh>
        )}
      </group>
    );
  }

  // Default: flat box
  return (
    <mesh position={[cx, elevM + t / 2, cz]} castShadow receiveShadow
      onClick={(e) => { e.stopPropagation(); onClick?.(roof); }}>
      <boxGeometry args={[w, t, d]} />
      <meshStandardMaterial color={roofColor} roughness={0.85} />
    </mesh>
  );
});

export default Roof3D;
