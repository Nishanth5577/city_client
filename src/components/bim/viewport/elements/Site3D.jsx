// ═══════════════════════════════════════════════════════════════
// Site3D — Professional Architectural Site & Landscape
// Clean grass, paved pathways, concrete driveway, boundary walls
// Matches high-end architectural visualization style
// ═══════════════════════════════════════════════════════════════
import { useMemo, memo } from 'react';
import * as THREE from 'three';
import { MM_TO_M } from '../../../../stores/bimTypes';
import { getPBRMaterial } from '../../../../bim/core/ProceduralPBR';

const Site3D = memo(function Site3D({ site, building }) {
  const S = MM_TO_M;
  const sw = site.width * S, sl = site.length * S;
  const cx = sw / 2, cz = sl / 2;

  const grassMat = useMemo(() => getPBRMaterial('grass', { scale: 1 }), []);

  return (
    <group>
      {/* ── Extended terrain (surrounding area) ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, -0.03, cz]} receiveShadow>
        <planeGeometry args={[sw * 4, sl * 4]} />
        <meshStandardMaterial color="#C4C8C0" roughness={0.95} metalness={0} />
      </mesh>

      {/* ── Site grass (property) ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.005, cz]} receiveShadow material={grassMat}>
        <planeGeometry args={[sw, sl]} />
      </mesh>

      {/* ── Concrete compound floor around building ── */}
      {building && (() => {
        const bx = (building.position?.x || 0) * S;
        const bz = (building.position?.y || 0) * S;
        const bw = building.width * S;
        const bl = building.length * S;
        const pad = 2.5; // concrete pad around building
        return (
          <mesh rotation={[-Math.PI / 2, 0, 0]}
            position={[bx + bw / 2, 0.008, bz + bl / 2]} receiveShadow>
            <planeGeometry args={[bw + pad, bl + pad]} />
            <meshStandardMaterial color="#E8E4DE" roughness={0.6} metalness={0.02} />
          </mesh>
        );
      })()}

      {/* ── Road along south edge ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.007, -3]} receiveShadow>
        <planeGeometry args={[sw * 2, 6]} />
        <meshStandardMaterial color="#505050" roughness={0.85} metalness={0} />
      </mesh>

      {/* ── Road center marking ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.009, -3]}>
        <planeGeometry args={[sw * 1.5, 0.08]} />
        <meshStandardMaterial color="#F0F0F0" roughness={0.4} />
      </mesh>

      {/* ── Sidewalk / Pavement ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.011, 0.2]} receiveShadow>
        <planeGeometry args={[sw * 1.6, 1.8]} />
        <meshStandardMaterial color="#D8D4CC" roughness={0.55} metalness={0.02} />
      </mesh>

      {/* ── Property boundary line (subtle) ── */}
      {[
        [[0, 0.02, 0], [sw, 0.015, 0]], // front
        [[0, 0.02, sl], [sw, 0.015, 0]], // back
        [[0, 0.02, cz], [0.015, 0.015, sl]], // left
        [[sw, 0.02, cz], [0.015, 0.015, sl]], // right
      ].map(([pos, size], i) => (
        <mesh key={i} position={pos} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[size[0] || sw, size[2] || 0.03]} />
          <meshBasicMaterial color="#999" transparent opacity={0.15} />
        </mesh>
      ))}

      {/* ── Corner markers ── */}
      {[[0, 0], [sw, 0], [sw, sl], [0, sl]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.015, z]}>
          <boxGeometry args={[0.15, 0.015, 0.15]} />
          <meshStandardMaterial color="#B0B0B0" roughness={0.5} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
});

export default Site3D;
