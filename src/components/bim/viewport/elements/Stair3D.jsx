// ═══════════════════════════════════════════════════════════════
// Stair3D — Detailed stair with individual treads, risers, railings
// Supports straight, L-shaped stairs with proper geometry
// ═══════════════════════════════════════════════════════════════
import { memo, useMemo } from 'react';
import * as THREE from 'three';
import { MM_TO_M } from '../../../../stores/bimTypes';
import { getPBRMaterial } from '../../../../bim/core/ProceduralPBR';

const Stair3D = memo(function Stair3D({ stair, floorElevation = 0, selected, onClick }) {
  const S = MM_TO_M;
  const {
    position = { x: 0, y: 0 }, rotation = 0,
    width = 1000, floorHeight = 3200,
    riserHeight = 175, treadDepth = 250,
    numSteps = 18, stairType = 'straight',
    railingHeight = 1050, material = 'concrete',
  } = stair;

  const px = position.x * S, pz = position.y * S;
  const elev = floorElevation * S;
  const w = width * S;
  const rH = riserHeight * S;
  const tD = treadDepth * S;
  const railH = railingHeight * S;
  const col = selected ? '#4FC3F7' : '#C0B8B0';
  const railCol = selected ? '#4FC3F7' : '#808080';

  const steps = useMemo(() => {
    const result = [];
    const halfSteps = stairType === 'l_shaped' ? Math.ceil(numSteps / 2) : numSteps;

    for (let i = 0; i < halfSteps; i++) {
      result.push({
        treadPos: [0, rH * (i + 1) - 0.005, tD * i + tD / 2],
        treadSize: [w, 0.01 + rH * 0.05, tD + 0.005],
        riserPos: [0, rH * i + rH / 2, tD * i],
        riserSize: [w, rH, 0.015],
      });
    }

    if (stairType === 'l_shaped' && numSteps > halfSteps) {
      // Landing
      result.push({
        isLanding: true,
        pos: [w / 2, rH * halfSteps, tD * halfSteps + w / 2],
        size: [w, 0.15, w],
      });
    }

    return result;
  }, [numSteps, rH, tD, w, stairType]);

  return (
    <group
      position={[px, elev, pz]}
      rotation={[0, -rotation * Math.PI / 180, 0]}
      onClick={(e) => { e.stopPropagation(); onClick?.(stair); }}
    >
      {/* Stringer (side support) */}
      <mesh position={[-w / 2 - 0.015, floorHeight * S / 2, numSteps * tD / 2]} castShadow>
        <boxGeometry args={[0.03, floorHeight * S, numSteps * tD]} />
        <meshStandardMaterial color={col} roughness={0.7} metalness={0.0} transparent opacity={0.3} />
      </mesh>

      {/* Individual Steps */}
      {steps.map((step, i) => {
        if (step.isLanding) {
          return (
            <mesh key={`landing_${i}`} position={step.pos} castShadow receiveShadow>
              <boxGeometry args={step.size} />
              <meshStandardMaterial color={col} roughness={0.7} />
            </mesh>
          );
        }
        return (
          <group key={i}>
            {/* Tread */}
            <mesh position={step.treadPos} castShadow receiveShadow>
              <boxGeometry args={step.treadSize} />
              <meshStandardMaterial color={col} roughness={0.6} metalness={0.0} />
            </mesh>
            {/* Riser */}
            <mesh position={step.riserPos} castShadow>
              <boxGeometry args={step.riserSize} />
              <meshStandardMaterial color={col} roughness={0.7} metalness={0.0} />
            </mesh>
          </group>
        );
      })}

      {/* Railings */}
      {/* Left railing */}
      <group position={[-w / 2 - 0.02, 0, 0]}>
        {/* Railing posts (every 3 steps) */}
        {Array.from({ length: Math.ceil(numSteps / 3) + 1 }).map((_, i) => {
          const stepIdx = Math.min(i * 3, numSteps - 1);
          const py = rH * (stepIdx + 1);
          const pzPost = tD * stepIdx;
          return (
            <group key={`lpost_${i}`}>
              {/* Post */}
              <mesh position={[0, py + railH / 2, pzPost]} castShadow>
                <boxGeometry args={[0.04, railH, 0.04]} />
                <meshStandardMaterial color={railCol} roughness={0.3} metalness={0.85} />
              </mesh>
              {/* Baluster ball */}
              <mesh position={[0, py + railH + 0.015, pzPost]}>
                <sphereGeometry args={[0.025, 8, 6]} />
                <meshStandardMaterial color={railCol} roughness={0.2} metalness={0.9} />
              </mesh>
            </group>
          );
        })}
        {/* Handrail */}
        <mesh position={[0, floorHeight * S / 2 + railH, numSteps * tD / 2]}
          rotation={[Math.atan2(floorHeight * S, numSteps * tD), 0, 0]} castShadow>
          <boxGeometry args={[0.05, 0.03, Math.sqrt((floorHeight * S) ** 2 + (numSteps * tD) ** 2)]} />
          <meshStandardMaterial color={railCol} roughness={0.25} metalness={0.85} />
        </mesh>
      </group>

      {/* Right railing */}
      <group position={[w / 2 + 0.02, 0, 0]}>
        {Array.from({ length: Math.ceil(numSteps / 3) + 1 }).map((_, i) => {
          const stepIdx = Math.min(i * 3, numSteps - 1);
          const py = rH * (stepIdx + 1);
          const pzPost = tD * stepIdx;
          return (
            <mesh key={`rpost_${i}`} position={[0, py + railH / 2, pzPost]} castShadow>
              <boxGeometry args={[0.04, railH, 0.04]} />
              <meshStandardMaterial color={railCol} roughness={0.3} metalness={0.85} />
            </mesh>
          );
        })}
        <mesh position={[0, floorHeight * S / 2 + railH, numSteps * tD / 2]}
          rotation={[Math.atan2(floorHeight * S, numSteps * tD), 0, 0]} castShadow>
          <boxGeometry args={[0.05, 0.03, Math.sqrt((floorHeight * S) ** 2 + (numSteps * tD) ** 2)]} />
          <meshStandardMaterial color={railCol} roughness={0.25} metalness={0.85} />
        </mesh>
      </group>

      {/* Selection */}
      {selected && (
        <mesh position={[0, floorHeight * S / 2, numSteps * tD / 2]}>
          <boxGeometry args={[w + 0.1, floorHeight * S + 0.1, numSteps * tD + 0.1]} />
          <meshBasicMaterial color="#2196F3" wireframe transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
});

export default Stair3D;
