// ═══════════════════════════════════════════════════════════════
// ArchViz Lighting — Studio-quality architectural visualization
// Warm interior lighting with soft shadows for "dollhouse" view
// Matches Planner5D / architectural render quality
// ═══════════════════════════════════════════════════════════════
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const S = 0.001;

/**
 * Professional architectural visualization lighting setup
 * Creates the warm, even, shadow-rich look seen in Planner5D renders
 */
export default function ArchVizLighting({ walls = [], wallHeight = 3000, renderMode }) {
  const keyLightRef = useRef();
  const fillLightRef = useRef();
  const rimLightRef = useRef();

  // Calculate building center for light targeting
  const buildingCenter = useMemo(() => {
    if (!walls || walls.length === 0) return [5, 0, 5];
    const pts = walls.filter(w => w?.start_point).map(w => w.start_point);
    if (pts.length === 0) return [5, 0, 5];
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length * S;
    const cz = pts.reduce((s, p) => s + p.y, 0) / pts.length * S;
    return [cx, (wallHeight * S) / 2, cz];
  }, [walls, wallHeight]);

  // Calculate building extents for proper shadow coverage
  const buildingExtent = useMemo(() => {
    if (!walls || walls.length === 0) return 10;
    const pts = walls.filter(w => w?.start_point).flatMap(w => [w.start_point, w.end_point].filter(Boolean));
    if (pts.length === 0) return 10;
    const xs = pts.map(p => p.x * S);
    const zs = pts.map(p => p.y * S);
    const dx = Math.max(...xs) - Math.min(...xs);
    const dz = Math.max(...zs) - Math.min(...zs);
    return Math.max(dx, dz, 5) * 1.5;
  }, [walls]);

  if (renderMode === 'wireframe') {
    return (
      <>
        <ambientLight intensity={0.8} color="#FFFFFF" />
        <directionalLight position={[10, 15, 10]} intensity={0.5} />
      </>
    );
  }

  return (
    <>
      {/* ─── Key Light (Main directional — warm sunlight from top-front-right) ─── */}
      <directionalLight
        ref={keyLightRef}
        position={[
          buildingCenter[0] + buildingExtent * 0.8,
          buildingExtent * 1.5,
          buildingCenter[2] + buildingExtent * 0.6
        ]}
        target-position={buildingCenter}
        intensity={2.8}
        color="#FFF5E6"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-left={-buildingExtent}
        shadow-camera-right={buildingExtent}
        shadow-camera-top={buildingExtent}
        shadow-camera-bottom={-buildingExtent}
        shadow-camera-near={0.1}
        shadow-camera-far={buildingExtent * 5}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
        shadow-radius={3}
      />

      {/* ─── Fill Light (Soft blue from opposite side — sky bounce) ─── */}
      <directionalLight
        ref={fillLightRef}
        position={[
          buildingCenter[0] - buildingExtent * 0.5,
          buildingExtent * 1.2,
          buildingCenter[2] - buildingExtent * 0.3
        ]}
        intensity={1.0}
        color="#E0EEFF"
        castShadow={false}
      />

      {/* ─── Rim / Back Light (subtle accent from behind) ─── */}
      <directionalLight
        ref={rimLightRef}
        position={[
          buildingCenter[0] - buildingExtent * 0.3,
          buildingExtent * 0.8,
          buildingCenter[2] + buildingExtent * 1.2
        ]}
        intensity={0.6}
        color="#FFE8D0"
        castShadow={false}
      />

      {/* ─── Ambient (warm base — prevents pure black shadows) ─── */}
      <ambientLight intensity={0.35} color="#FFF0E0" />

      {/* ─── Hemisphere (sky + ground bounce — adds depth) ─── */}
      <hemisphereLight
        skyColor="#B4C8DC"
        groundColor="#D4B896"
        intensity={0.5}
      />

      {/* ─── Interior room lights (warm point lights inside rooms) ─── */}
      {walls && walls.length >= 3 && (() => {
        const pts = walls.filter(w => w?.start_point).map(w => w.start_point);
        if (pts.length === 0) return null;
        const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length * S;
        const cz = pts.reduce((s, p) => s + p.y, 0) / pts.length * S;
        const ceilingY = wallHeight * S - 0.15;
        return (
          <>
            <pointLight
              position={[cx, ceilingY, cz]}
              intensity={1.2}
              color="#FFF0D6"
              distance={buildingExtent * 1.5}
              decay={2}
              castShadow={false}
            />
            {/* Additional warm interior lights spread out */}
            <pointLight
              position={[cx - buildingExtent * 0.2, ceilingY * 0.7, cz - buildingExtent * 0.2]}
              intensity={0.5}
              color="#FFE8C8"
              distance={buildingExtent}
              decay={2}
            />
            <pointLight
              position={[cx + buildingExtent * 0.2, ceilingY * 0.7, cz + buildingExtent * 0.2]}
              intensity={0.5}
              color="#FFE8C8"
              distance={buildingExtent}
              decay={2}
            />
          </>
        );
      })()}
    </>
  );
}

/**
 * Studio backdrop for architectural visualization
 * Clean neutral grey gradient like Planner5D / SketchUp
 */
export function StudioBackdrop({ renderMode }) {
  if (renderMode === 'wireframe') return null;

  return (
    <>
      {/* Infinite ground plane — neutral grey, soft */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.005, 0]}
        receiveShadow
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial
          color="#C8C4BE"
          roughness={0.95}
          metalness={0}
          envMapIntensity={0.3}
        />
      </mesh>

      {/* Soft vignette ground — darker edges */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.006, 0]}
      >
        <circleGeometry args={[80, 64]} />
        <meshStandardMaterial
          color="#B8B4AE"
          roughness={1}
          metalness={0}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Very subtle fog for depth */}
      <fog attach="fog" args={['#E8E4E0', 30, 100]} />
    </>
  );
}
