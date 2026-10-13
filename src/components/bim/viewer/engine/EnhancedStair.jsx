// ═══════════════════════════════════════════════════════════════
// Enhanced Stair Generator — Multiple stair types
// Straight, L-shaped, U-shaped, Spiral, Dog-legged
// With railings, stringers, landings
// ═══════════════════════════════════════════════════════════════
import { memo, useMemo } from 'react';
import * as THREE from 'three';

const S = 0.001;

// ─── Stair Step ────────────────────────────────────────────────
function Step({ position, width, riserH, treadD, material, renderMode }) {
  const matProps = useMemo(() => {
    if (renderMode === 'wireframe') return { color: '#C0C0C0', wireframe: true };
    if (renderMode === 'xray') return { color: '#C0C0C0', transparent: true, opacity: 0.12 };
    switch (material) {
      case 'marble': return { color: '#F5F0E8', roughness: 0.15, metalness: 0.05 };
      case 'wood': return { color: '#8B6914', roughness: 0.6, metalness: 0 };
      case 'granite': return { color: '#4A4A4A', roughness: 0.25, metalness: 0.1 };
      default: return { color: '#D8D0C8', roughness: 0.65, metalness: 0.05 };
    }
  }, [material, renderMode]);

  return (
    <group position={position}>
      {/* Tread */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, 0.025, treadD + 0.02]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      {/* Riser */}
      <mesh position={[0, -riserH / 2, -treadD / 2]} castShadow>
        <boxGeometry args={[width, riserH, 0.015]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      {/* Nosing */}
      <mesh position={[0, 0.005, treadD / 2 + 0.008]}>
        <boxGeometry args={[width, 0.012, 0.02]} />
        <meshStandardMaterial color="#A09080" roughness={0.5} />
      </mesh>
    </group>
  );
}

// ─── Railing ───────────────────────────────────────────────────
function Railing({ points, height = 0.9, type = 'glass', side = 'left', renderMode }) {
  if (renderMode === 'wireframe' || renderMode === 'xray' || points.length < 2) return null;

  return (
    <group>
      {points.map((pt, i) => {
        if (i === points.length - 1) return null;
        const next = points[i + 1];
        const dx = next.x - pt.x;
        const dy = next.y - pt.y;
        const dz = next.z - pt.z;
        const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const midX = (pt.x + next.x) / 2;
        const midY = (pt.y + next.y) / 2 + height / 2;
        const midZ = (pt.z + next.z) / 2;
        const angleY = Math.atan2(dx, dz);
        const angleX = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));

        return (
          <group key={i} position={[midX, midY, midZ]} rotation={[angleX, angleY, 0]}>
            {type === 'glass' ? (
              <>
                {/* Glass panel */}
                <mesh>
                  <boxGeometry args={[0.01, height - 0.1, length]} />
                  <meshPhysicalMaterial
                    color="#E8F4F8"
                    transmission={0.85}
                    ior={1.5}
                    thickness={0.01}
                    roughness={0.05}
                    transparent
                    opacity={0.3}
                  />
                </mesh>
                {/* Top rail */}
                <mesh position={[0, height / 2 - 0.02, 0]}>
                  <boxGeometry args={[0.04, 0.04, length + 0.02]} />
                  <meshStandardMaterial color="#606060" metalness={0.7} roughness={0.2} />
                </mesh>
              </>
            ) : type === 'metal' ? (
              <>
                {/* Top rail */}
                <mesh position={[0, height / 2 - 0.02, 0]}>
                  <boxGeometry args={[0.04, 0.04, length + 0.02]} />
                  <meshStandardMaterial color="#404040" metalness={0.8} roughness={0.15} />
                </mesh>
                {/* Balusters */}
                {Array.from({ length: Math.max(2, Math.floor(length / 0.12)) }).map((_, bi) => {
                  const t = (bi + 0.5) / Math.max(2, Math.floor(length / 0.12));
                  return (
                    <mesh key={bi} position={[0, 0, (t - 0.5) * length]}>
                      <cylinderGeometry args={[0.008, 0.008, height - 0.05, 6]} />
                      <meshStandardMaterial color="#505050" metalness={0.7} roughness={0.2} />
                    </mesh>
                  );
                })}
              </>
            ) : (
              <>
                {/* Wood handrail */}
                <mesh position={[0, height / 2 - 0.02, 0]}>
                  <boxGeometry args={[0.06, 0.05, length + 0.02]} />
                  <meshStandardMaterial color="#6B4226" roughness={0.5} />
                </mesh>
                {/* Wood balusters */}
                {Array.from({ length: Math.max(2, Math.floor(length / 0.12)) }).map((_, bi) => {
                  const t = (bi + 0.5) / Math.max(2, Math.floor(length / 0.12));
                  return (
                    <mesh key={bi} position={[0, 0, (t - 0.5) * length]}>
                      <boxGeometry args={[0.03, height - 0.06, 0.03]} />
                      <meshStandardMaterial color="#7B5232" roughness={0.5} />
                    </mesh>
                  );
                })}
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// STRAIGHT STAIR
// ═══════════════════════════════════════════════════════════════
function StraightStair({ stair, floorY, renderMode }) {
  const w = (stair.width || 1200) * S;
  const numSteps = Math.min(stair.num_risers || 18, 25);
  const riserH = (stair.riser_height || 167) * S;
  const treadD = (stair.tread_depth || 270) * S;
  const railType = stair.railing_type || 'glass';
  const mat = stair.material || 'concrete';

  const steps = [];
  const leftRailPts = [];
  const rightRailPts = [];

  for (let i = 0; i < numSteps; i++) {
    const y = floorY + riserH * (i + 1);
    const z = treadD * i;
    steps.push(
      <Step
        key={i}
        position={[0, y, z]}
        width={w}
        riserH={riserH}
        treadD={treadD}
        material={mat}
        renderMode={renderMode}
      />
    );
    leftRailPts.push({ x: -w / 2 - 0.02, y: y, z: z });
    rightRailPts.push({ x: w / 2 + 0.02, y: y, z: z });
  }

  return (
    <group>
      {steps}
      {/* Stringer */}
      {renderMode !== 'wireframe' && renderMode !== 'xray' && (
        <>
          <mesh position={[0, floorY + numSteps * riserH / 2, (numSteps - 1) * treadD / 2]} castShadow>
            <boxGeometry args={[w + 0.02, 0.03, numSteps * treadD + 0.1]} />
            <meshStandardMaterial color="#B0A898" roughness={0.7} />
          </mesh>
        </>
      )}
      <Railing points={leftRailPts} type={railType} side="left" renderMode={renderMode} />
      <Railing points={rightRailPts} type={railType} side="right" renderMode={renderMode} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// L-SHAPED STAIR
// ═══════════════════════════════════════════════════════════════
function LShapedStair({ stair, floorY, renderMode }) {
  const w = (stair.width || 1200) * S;
  const numSteps = Math.min(stair.num_risers || 18, 25);
  const riserH = (stair.riser_height || 167) * S;
  const treadD = (stair.tread_depth || 270) * S;
  const landingD = (stair.landing_depth || 1200) * S;
  const mat = stair.material || 'concrete';
  const railType = stair.railing_type || 'glass';

  const halfSteps = Math.floor(numSteps / 2);
  const steps = [];

  // First run (along Z)
  for (let i = 0; i < halfSteps; i++) {
    steps.push(
      <Step
        key={`a${i}`}
        position={[0, floorY + riserH * (i + 1), treadD * i]}
        width={w}
        riserH={riserH}
        treadD={treadD}
        material={mat}
        renderMode={renderMode}
      />
    );
  }

  // Landing
  const landingY = floorY + riserH * halfSteps;
  const landingZ = (halfSteps - 1) * treadD + treadD / 2 + landingD / 2;
  if (renderMode !== 'wireframe' && renderMode !== 'xray') {
    steps.push(
      <mesh key="landing" position={[0, landingY, landingZ]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.025, landingD]} />
        <meshStandardMaterial color="#D8D0C8" roughness={0.65} />
      </mesh>
    );
  }

  // Second run (turned 90° — along X)
  for (let i = 0; i < numSteps - halfSteps; i++) {
    steps.push(
      <Step
        key={`b${i}`}
        position={[
          treadD * (i + 1),
          landingY + riserH * (i + 1),
          landingZ + landingD / 2 - w / 2,
        ]}
        width={w}
        riserH={riserH}
        treadD={treadD}
        material={mat}
        renderMode={renderMode}
      />
    );
  }

  return <group>{steps}</group>;
}

// ═══════════════════════════════════════════════════════════════
// U-SHAPED STAIR
// ═══════════════════════════════════════════════════════════════
function UShapedStair({ stair, floorY, renderMode }) {
  const w = (stair.width || 1200) * S;
  const numSteps = Math.min(stair.num_risers || 20, 25);
  const riserH = (stair.riser_height || 150) * S;
  const treadD = (stair.tread_depth || 280) * S;
  const mat = stair.material || 'concrete';
  const gap = 0.1; // gap between runs

  const halfSteps = Math.floor(numSteps / 2);
  const steps = [];

  // First run (going up along Z)
  for (let i = 0; i < halfSteps; i++) {
    steps.push(
      <Step
        key={`up${i}`}
        position={[-w / 2 - gap / 2, floorY + riserH * (i + 1), treadD * i]}
        width={w}
        riserH={riserH}
        treadD={treadD}
        material={mat}
        renderMode={renderMode}
      />
    );
  }

  // Landing
  const landingY = floorY + riserH * halfSteps;
  const landingZ = (halfSteps - 1) * treadD;
  if (renderMode !== 'wireframe' && renderMode !== 'xray') {
    steps.push(
      <mesh key="landing" position={[0, landingY, landingZ + treadD / 2 + w / 2]} castShadow receiveShadow>
        <boxGeometry args={[w * 2 + gap, 0.025, w]} />
        <meshStandardMaterial color="#D8D0C8" roughness={0.65} />
      </mesh>
    );
  }

  // Second run (going back along -Z)
  for (let i = 0; i < numSteps - halfSteps; i++) {
    steps.push(
      <Step
        key={`down${i}`}
        position={[w / 2 + gap / 2, landingY + riserH * (i + 1), landingZ - treadD * i]}
        width={w}
        riserH={riserH}
        treadD={treadD}
        material={mat}
        renderMode={renderMode}
      />
    );
  }

  return <group>{steps}</group>;
}

// ═══════════════════════════════════════════════════════════════
// SPIRAL STAIR
// ═══════════════════════════════════════════════════════════════
function SpiralStair({ stair, floorY, renderMode }) {
  const innerR = 0.15;
  const outerR = (stair.width || 1800) * S / 2;
  const numSteps = Math.min(stair.num_risers || 16, 24);
  const riserH = (stair.riser_height || 188) * S;
  const totalAngle = Math.PI * 2; // Full rotation
  const mat = stair.material || 'concrete';

  const matProps = useMemo(() => {
    if (renderMode === 'wireframe') return { color: '#C0C0C0', wireframe: true };
    if (renderMode === 'xray') return { color: '#C0C0C0', transparent: true, opacity: 0.12 };
    return { color: '#D8D0C8', roughness: 0.65, metalness: 0.05 };
  }, [renderMode]);

  const steps = [];
  const angleStep = totalAngle / numSteps;

  // Center pole
  if (renderMode !== 'wireframe' && renderMode !== 'xray') {
    steps.push(
      <mesh key="pole" position={[0, floorY + numSteps * riserH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, numSteps * riserH + 0.1, 8]} />
        <meshStandardMaterial color="#505050" metalness={0.7} roughness={0.2} />
      </mesh>
    );
  }

  for (let i = 0; i < numSteps; i++) {
    const angle = i * angleStep;
    const y = floorY + riserH * (i + 1);

    // Wedge-shaped step
    const shape = new THREE.Shape();
    const segAngle = angleStep * 0.9;
    const segments = 8;
    shape.moveTo(innerR, 0);
    for (let s = 0; s <= segments; s++) {
      const a = (s / segments) * segAngle;
      shape.lineTo(outerR * Math.cos(a), outerR * Math.sin(a));
    }
    for (let s = segments; s >= 0; s--) {
      const a = (s / segments) * segAngle;
      shape.lineTo(innerR * Math.cos(a), innerR * Math.sin(a));
    }
    shape.closePath();

    const extrudeSettings = { depth: 0.025, bevelEnabled: false };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    steps.push(
      <mesh
        key={i}
        geometry={geo}
        position={[0, y, 0]}
        rotation={[Math.PI / 2, angle, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...matProps} />
      </mesh>
    );
  }

  return <group>{steps}</group>;
}

// ═══════════════════════════════════════════════════════════════
// MAIN ENHANCED STAIR COMPONENT
// ═══════════════════════════════════════════════════════════════
const EnhancedStair = memo(function EnhancedStair({ stair, floorY = 0, renderMode }) {
  if (!stair?.position) return null;
  const x = stair.position.x * S;
  const z = stair.position.y * S;
  const rotation = -(stair.rotation || 0) * Math.PI / 180;

  const stairType = stair.stair_type || 'straight';

  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
      {stairType === 'straight' && <StraightStair stair={stair} floorY={floorY} renderMode={renderMode} />}
      {stairType === 'l_shaped' && <LShapedStair stair={stair} floorY={floorY} renderMode={renderMode} />}
      {stairType === 'u_shaped' && <UShapedStair stair={stair} floorY={floorY} renderMode={renderMode} />}
      {stairType === 'spiral' && <SpiralStair stair={stair} floorY={floorY} renderMode={renderMode} />}
      {stairType === 'dog_legged' && <UShapedStair stair={stair} floorY={floorY} renderMode={renderMode} />}
    </group>
  );
});

export default EnhancedStair;
