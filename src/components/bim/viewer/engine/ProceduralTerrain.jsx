// ═══════════════════════════════════════════════════════════════
// Procedural Terrain v2 — Professional Landscaping
// Multi-layer trees, palms, garden lights, paving, rocks,
// compound wall with pillar caps, detailed driveway
// ═══════════════════════════════════════════════════════════════
import { useMemo, memo } from 'react';
import * as THREE from 'three';
import { getProceduralMaterial } from './ProceduralTextures';

const S = 0.001;

// ─── Multi-Layer Foliage Tree ──────────────────────────────────
function RealisticTree({ trunkH = 2.8, crownR = 1.4, variant = 0 }) {
  const trunkR = 0.08 + variant * 0.02;
  const leafColor1 = ['#2D6B30', '#1E5C28', '#3A7A3A'][variant % 3];
  const leafColor2 = ['#246828', '#1A5020', '#2E6E2E'][variant % 3];
  const leafColor3 = ['#348A38', '#287030', '#408840'][variant % 3];

  return (
    <group>
      {/* Trunk — tapered cylinder */}
      <mesh position={[0, trunkH / 2, 0]} castShadow>
        <cylinderGeometry args={[trunkR * 0.6, trunkR, trunkH, 8]} />
        <meshStandardMaterial color="#5A3A1E" roughness={0.9} />
      </mesh>
      {/* Branch stubs */}
      <mesh position={[0.1, trunkH * 0.6, 0.05]} rotation={[0.3, 0, 0.8]} castShadow>
        <cylinderGeometry args={[0.02, 0.03, 0.4, 6]} />
        <meshStandardMaterial color="#5A3A1E" roughness={0.9} />
      </mesh>
      <mesh position={[-0.08, trunkH * 0.7, -0.06]} rotation={[-0.2, 0, -0.6]} castShadow>
        <cylinderGeometry args={[0.02, 0.025, 0.35, 6]} />
        <meshStandardMaterial color="#5A3A1E" roughness={0.9} />
      </mesh>
      {/* Multi-layer foliage — 3 offset clusters */}
      <mesh position={[0, trunkH + crownR * 0.3, 0]} castShadow>
        <dodecahedronGeometry args={[crownR * 0.9, 1]} />
        <meshStandardMaterial color={leafColor1} roughness={0.95} flatShading />
      </mesh>
      <mesh position={[crownR * 0.25, trunkH + crownR * 0.1, crownR * 0.15]} castShadow>
        <dodecahedronGeometry args={[crownR * 0.75, 1]} />
        <meshStandardMaterial color={leafColor2} roughness={0.95} flatShading />
      </mesh>
      <mesh position={[-crownR * 0.2, trunkH + crownR * 0.5, -crownR * 0.1]} castShadow>
        <dodecahedronGeometry args={[crownR * 0.65, 1]} />
        <meshStandardMaterial color={leafColor3} roughness={0.95} flatShading />
      </mesh>
      {/* Root flare */}
      <mesh position={[0, 0.04, 0]} castShadow>
        <cylinderGeometry args={[trunkR * 1.8, trunkR * 2.2, 0.08, 8]} />
        <meshStandardMaterial color="#4A2A10" roughness={0.95} />
      </mesh>
    </group>
  );
}

// ─── Palm Tree ─────────────────────────────────────────────────
function PalmTree({ trunkH = 4.0 }) {
  const fronds = useMemo(() => {
    const f = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const tilt = 0.4 + Math.random() * 0.3;
      f.push({ angle, tilt, len: 1.5 + Math.random() * 0.5, droop: 0.2 + Math.random() * 0.2 });
    }
    return f;
  }, []);

  return (
    <group>
      {/* Trunk — slightly curved cylinder segments */}
      <mesh position={[0, trunkH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, trunkH, 8]} />
        <meshStandardMaterial color="#8B7355" roughness={0.9} />
      </mesh>
      {/* Ring marks on trunk */}
      {[0.3, 0.6, 0.9, 1.2, 1.5].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <torusGeometry args={[0.11, 0.008, 4, 12]} />
          <meshStandardMaterial color="#7A6548" roughness={0.9} />
        </mesh>
      ))}
      {/* Coconut cluster */}
      <mesh position={[0.08, trunkH - 0.1, 0.05]} castShadow>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial color="#5A4020" roughness={0.8} />
      </mesh>
      <mesh position={[-0.06, trunkH - 0.05, -0.04]} castShadow>
        <sphereGeometry args={[0.055, 8, 6]} />
        <meshStandardMaterial color="#5A4020" roughness={0.8} />
      </mesh>
      {/* Fronds */}
      {fronds.map((fr, i) => (
        <group key={i} position={[0, trunkH, 0]} rotation={[fr.tilt, fr.angle, 0]}>
          <mesh position={[0, 0, fr.len / 2]} rotation={[-fr.droop, 0, 0]} castShadow>
            <boxGeometry args={[0.25, 0.015, fr.len]} />
            <meshStandardMaterial color="#3A7030" roughness={0.9} side={THREE.DoubleSide} />
          </mesh>
          {/* Leaf blade segments */}
          {[0.3, 0.6, 0.9].map((t, j) => (
            <mesh key={j} position={[0, -0.02 * j, fr.len * t]} rotation={[-fr.droop - 0.1 * j, 0, 0]}>
              <boxGeometry args={[0.35 - j * 0.08, 0.008, 0.2]} />
              <meshStandardMaterial color={j === 2 ? '#2D6020' : '#3A7A30'} roughness={0.95} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// ─── Bush Cluster ──────────────────────────────────────────────
function BushCluster({ scale = 1.0 }) {
  const bushes = useMemo(() => [
    { pos: [0, 0.15, 0], r: 0.22, c: '#2E6E30' },
    { pos: [0.15, 0.12, 0.1], r: 0.18, c: '#348838' },
    { pos: [-0.12, 0.1, 0.08], r: 0.15, c: '#267028' },
    { pos: [0.05, 0.08, -0.12], r: 0.14, c: '#388A38' },
  ], []);

  return (
    <group scale={[scale, scale, scale]}>
      {bushes.map((b, i) => (
        <mesh key={i} position={b.pos} castShadow>
          <dodecahedronGeometry args={[b.r, 1]} />
          <meshStandardMaterial color={b.c} roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  );
}

// ─── Garden Bollard Light ──────────────────────────────────────
function BollardLight({ height = 0.7, renderMode }) {
  if (renderMode === 'wireframe' || renderMode === 'xray') return null;
  return (
    <group>
      {/* Post */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, height, 8]} />
        <meshStandardMaterial color="#2A2A2A" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Lamp head */}
      <mesh position={[0, height + 0.04, 0]}>
        <sphereGeometry args={[0.06, 12, 8]} />
        <meshStandardMaterial color="#FFF8E0" emissive="#FFE8A0" emissiveIntensity={0.6} />
      </mesh>
      {/* Base plate */}
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.02, 8]} />
        <meshStandardMaterial color="#2A2A2A" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Light source */}
      <pointLight position={[0, height + 0.04, 0]} intensity={0.15} color="#FFF4E0" distance={5} decay={2} />
    </group>
  );
}

// ─── Rock ──────────────────────────────────────────────────────
function Rock({ scale = 1.0 }) {
  return (
    <mesh position={[0, scale * 0.1, 0]} castShadow receiveShadow scale={[scale * 1.2, scale * 0.7, scale]}>
      <dodecahedronGeometry args={[0.2, 0]} />
      <meshStandardMaterial color="#706860" roughness={0.95} flatShading />
    </mesh>
  );
}

// ─── Garden Bench ──────────────────────────────────────────────
function GardenBench({ renderMode }) {
  if (renderMode === 'wireframe' || renderMode === 'xray') return null;
  return (
    <group>
      {/* Seat */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[1.2, 0.04, 0.4]} />
        <meshStandardMaterial color="#6B4226" roughness={0.7} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 0.65, -0.18]} castShadow>
        <boxGeometry args={[1.2, 0.4, 0.03]} />
        <meshStandardMaterial color="#6B4226" roughness={0.7} />
      </mesh>
      {/* Legs */}
      {[[-0.5, 0.21, 0.15], [0.5, 0.21, 0.15], [-0.5, 0.21, -0.15], [0.5, 0.21, -0.15]].map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <boxGeometry args={[0.04, 0.42, 0.04]} />
          <meshStandardMaterial color="#3A3A3A" metalness={0.5} roughness={0.3} />
        </mesh>
      ))}
      {/* Armrests */}
      <mesh position={[-0.56, 0.55, 0]} castShadow>
        <boxGeometry args={[0.04, 0.04, 0.4]} />
        <meshStandardMaterial color="#3A3A3A" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0.56, 0.55, 0]} castShadow>
        <boxGeometry args={[0.04, 0.04, 0.4]} />
        <meshStandardMaterial color="#3A3A3A" metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ─── Flower Planter ────────────────────────────────────────────
function Planter({ renderMode }) {
  if (renderMode === 'wireframe' || renderMode === 'xray') return null;
  return (
    <group>
      {/* Pot */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.15, 0.4, 12]} />
        <meshStandardMaterial color="#8B5E3C" roughness={0.85} />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.02, 12]} />
        <meshStandardMaterial color="#3A2A1A" roughness={0.95} />
      </mesh>
      {/* Flowers */}
      {[0, 1.2, 2.4, 3.6, 5.0].map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * 0.08, 0.5 + Math.random() * 0.1, Math.sin(a) * 0.08]}>
          <sphereGeometry args={[0.04, 6, 5]} />
          <meshStandardMaterial color={['#E03050', '#E8A020', '#D050C0', '#F06030', '#8040C0'][i]} roughness={0.9} />
        </mesh>
      ))}
      {/* Stems */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.001, 0.001, 0.15, 3]} />
        <meshStandardMaterial color="#2A5A20" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ─── Ground Plane with texture ─────────────────────────────────
function GroundPlane({ size = 80, renderMode }) {
  const matProps = useMemo(() => {
    if (renderMode === 'wireframe') return { color: '#4A7C4F', wireframe: true };
    if (renderMode === 'xray') return { color: '#4A7C4F', transparent: true, opacity: 0.05 };
    const tex = getProceduralMaterial('grass');
    if (tex) return { map: tex.map, normalMap: tex.normalMap, roughness: 0.95, metalness: 0 };
    return { color: '#4A7C4F', roughness: 0.95 };
  }, [renderMode]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial {...matProps} />
    </mesh>
  );
}

// ─── Enhanced Compound Wall ────────────────────────────────────
function CompoundWall({ bounds, height = 1.8, gateWidth = 3.5, renderMode }) {
  if (!bounds) return null;

  const wallProps = useMemo(() => {
    if (renderMode === 'wireframe') return { color: '#999', wireframe: true };
    if (renderMode === 'xray') return { color: '#999', transparent: true, opacity: 0.08 };
    const tex = getProceduralMaterial('plaster_cream');
    return tex ? { map: tex.map, normalMap: tex.normalMap, roughness: 0.85, metalness: 0 } : { color: '#E8E0D0', roughness: 0.85 };
  }, [renderMode]);

  const stoneProps = useMemo(() => {
    if (renderMode === 'wireframe' || renderMode === 'xray') return null;
    const tex = getProceduralMaterial('granite');
    return tex ? { map: tex.map, normalMap: tex.normalMap, roughness: 0.3, metalness: 0.05 } : { color: '#605850', roughness: 0.3 };
  }, [renderMode]);

  const margin = 3.5;
  const t = 0.2;
  const x1 = bounds.minX * S - margin;
  const x2 = bounds.maxX * S + margin;
  const z1 = bounds.minY * S - margin;
  const z2 = bounds.maxY * S + margin;
  const w = x2 - x1;
  const d = z2 - z1;
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  const gW = gateWidth;
  const pillarW = 0.35;
  const pillarH = height * 1.25;

  return (
    <group>
      {/* Back wall */}
      <mesh position={[cx, height / 2, z1]} castShadow receiveShadow>
        <boxGeometry args={[w, height, t]} />
        <meshStandardMaterial {...wallProps} />
      </mesh>

      {/* Front wall — split for gate */}
      <mesh position={[cx - gW / 2 - (w / 2 - gW / 2) / 2, height / 2, z2]} castShadow>
        <boxGeometry args={[(w - gW) / 2, height, t]} />
        <meshStandardMaterial {...wallProps} />
      </mesh>
      <mesh position={[cx + gW / 2 + (w / 2 - gW / 2) / 2, height / 2, z2]} castShadow>
        <boxGeometry args={[(w - gW) / 2, height, t]} />
        <meshStandardMaterial {...wallProps} />
      </mesh>

      {/* Gate pillars with caps */}
      {[-1, 1].map((side, i) => (
        <group key={i} position={[cx + side * gW / 2, 0, z2]}>
          {/* Pillar body */}
          <mesh position={[0, pillarH / 2, 0]} castShadow>
            <boxGeometry args={[pillarW, pillarH, pillarW]} />
            <meshStandardMaterial {...wallProps} />
          </mesh>
          {/* Stone cladding on pillar base */}
          {stoneProps && (
            <mesh position={[0, 0.4, 0]} castShadow>
              <boxGeometry args={[pillarW + 0.02, 0.8, pillarW + 0.02]} />
              <meshStandardMaterial {...stoneProps} />
            </mesh>
          )}
          {/* Pillar cap — pyramid */}
          <mesh position={[0, pillarH + 0.08, 0]} castShadow>
            <boxGeometry args={[pillarW + 0.06, 0.04, pillarW + 0.06]} />
            <meshStandardMaterial color="#D0C8B8" roughness={0.6} />
          </mesh>
          <mesh position={[0, pillarH + 0.14, 0]} castShadow>
            <coneGeometry args={[(pillarW + 0.04) / 2, 0.1, 4]} />
            <meshStandardMaterial color="#C8C0B0" roughness={0.6} />
          </mesh>
          {/* Pillar light */}
          <pointLight position={[0, pillarH + 0.2, side * 0.3]} intensity={0.15} color="#FFF0D0" distance={5} decay={2} />
        </group>
      ))}

      {/* Gate — iron with vertical bars */}
      {renderMode !== 'wireframe' && renderMode !== 'xray' && (
        <group position={[cx, 0, z2]}>
          {/* Top rail */}
          <mesh position={[0, height * 0.9, 0]} castShadow>
            <boxGeometry args={[gW - pillarW, 0.04, 0.03]} />
            <meshStandardMaterial color="#2A2A2A" metalness={0.7} roughness={0.25} />
          </mesh>
          {/* Bottom rail */}
          <mesh position={[0, 0.15, 0]} castShadow>
            <boxGeometry args={[gW - pillarW, 0.04, 0.03]} />
            <meshStandardMaterial color="#2A2A2A" metalness={0.7} roughness={0.25} />
          </mesh>
          {/* Vertical bars */}
          {Array.from({ length: Math.floor((gW - pillarW) / 0.12) }).map((_, bi) => (
            <mesh key={bi} position={[-(gW - pillarW) / 2 + 0.06 + bi * 0.12, height * 0.52, 0]} castShadow>
              <boxGeometry args={[0.015, height * 0.75, 0.015]} />
              <meshStandardMaterial color="#2A2A2A" metalness={0.7} roughness={0.25} />
            </mesh>
          ))}
          {/* Decorative spear tips */}
          {Array.from({ length: Math.floor((gW - pillarW) / 0.12) }).map((_, bi) => (
            <mesh key={`tip-${bi}`} position={[-(gW - pillarW) / 2 + 0.06 + bi * 0.12, height * 0.9 + 0.04, 0]}>
              <coneGeometry args={[0.012, 0.05, 4]} />
              <meshStandardMaterial color="#2A2A2A" metalness={0.7} roughness={0.25} />
            </mesh>
          ))}
        </group>
      )}

      {/* Left & Right walls */}
      <mesh position={[x1, height / 2, cz]} castShadow>
        <boxGeometry args={[t, height, d]} />
        <meshStandardMaterial {...wallProps} />
      </mesh>
      <mesh position={[x2, height / 2, cz]} castShadow>
        <boxGeometry args={[t, height, d]} />
        <meshStandardMaterial {...wallProps} />
      </mesh>

      {/* Wall coping (top cap) */}
      {[[cx, z1, w, t], [cx, z2, w, t], [x1, cz, t, d], [x2, cz, t, d]].map(([px, pz, sw, sd], i) => (
        <mesh key={`cap-${i}`} position={[px, height + 0.03, pz]} castShadow>
          <boxGeometry args={[sw + 0.06, 0.06, sd + 0.06]} />
          <meshStandardMaterial color="#C8C0B0" roughness={0.6} />
        </mesh>
      ))}

      {/* Stone base band on walls */}
      {stoneProps && (
        <>
          <mesh position={[cx, 0.15, z1]} castShadow><boxGeometry args={[w, 0.3, t + 0.02]} /><meshStandardMaterial {...stoneProps} /></mesh>
          <mesh position={[cx, 0.15, z2]} castShadow><boxGeometry args={[w, 0.3, t + 0.02]} /><meshStandardMaterial {...stoneProps} /></mesh>
          <mesh position={[x1, 0.15, cz]} castShadow><boxGeometry args={[t + 0.02, 0.3, d]} /><meshStandardMaterial {...stoneProps} /></mesh>
          <mesh position={[x2, 0.15, cz]} castShadow><boxGeometry args={[t + 0.02, 0.3, d]} /><meshStandardMaterial {...stoneProps} /></mesh>
        </>
      )}
    </group>
  );
}

// ─── Paved Driveway ────────────────────────────────────────────
function Driveway({ bounds, renderMode }) {
  if (!bounds) return null;

  const matProps = useMemo(() => {
    if (renderMode === 'wireframe') return { color: '#555', wireframe: true };
    const tex = getProceduralMaterial('tiles');
    return tex ? { map: tex.map, normalMap: tex.normalMap, roughness: 0.7, metalness: 0 } : { color: '#B0A890', roughness: 0.7 };
  }, [renderMode]);

  const cx = (bounds.minX + bounds.maxX) / 2 * S;
  const z2 = bounds.maxY * S + 3.5;
  const driveLen = 7;
  const driveW = 3.5;

  return (
    <group>
      {/* Main driveway */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.005, z2 + driveLen / 2]} receiveShadow>
        <planeGeometry args={[driveW, driveLen]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      {/* Driveway borders */}
      <mesh position={[cx - driveW / 2 - 0.04, 0.03, z2 + driveLen / 2]} castShadow>
        <boxGeometry args={[0.06, 0.06, driveLen]} />
        <meshStandardMaterial color="#A09080" roughness={0.7} />
      </mesh>
      <mesh position={[cx + driveW / 2 + 0.04, 0.03, z2 + driveLen / 2]} castShadow>
        <boxGeometry args={[0.06, 0.06, driveLen]} />
        <meshStandardMaterial color="#A09080" roughness={0.7} />
      </mesh>
    </group>
  );
}

// ─── Stone Walkway ─────────────────────────────────────────────
function Walkway({ bounds, renderMode }) {
  if (!bounds || renderMode === 'wireframe') return null;
  const matProps = useMemo(() => {
    const tex = getProceduralMaterial('tiles');
    return tex ? { map: tex.map, roughness: 0.6, metalness: 0 } : { color: '#B0A890', roughness: 0.6 };
  }, []);
  const cx = (bounds.minX + bounds.maxX) / 2 * S;
  const bz = bounds.maxY * S;
  const margin = 3.5;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.008, bz + margin / 2]} receiveShadow>
        <planeGeometry args={[1.3, margin]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      {/* Walkway border stones */}
      <mesh position={[cx - 0.68, 0.02, bz + margin / 2]} castShadow>
        <boxGeometry args={[0.04, 0.04, margin]} />
        <meshStandardMaterial color="#908070" roughness={0.7} />
      </mesh>
      <mesh position={[cx + 0.68, 0.02, bz + margin / 2]} castShadow>
        <boxGeometry args={[0.04, 0.04, margin]} />
        <meshStandardMaterial color="#908070" roughness={0.7} />
      </mesh>
    </group>
  );
}

// ─── Garden Layout Generator ───────────────────────────────────
function GardenElements({ bounds, renderMode }) {
  if (!bounds || renderMode === 'wireframe' || renderMode === 'xray') return null;

  const margin = 3.5;
  const x1 = bounds.minX * S - margin;
  const x2 = bounds.maxX * S + margin;
  const z1 = bounds.minY * S - margin;
  const z2 = bounds.maxY * S + margin;
  const midX = (x1 + x2) / 2;

  const elements = useMemo(() => {
    return {
      trees: [
        { pos: [x1 + 1.0, 0, z1 + 1.0], variant: 0, h: 3.2, r: 1.5 },
        { pos: [x2 - 1.0, 0, z1 + 1.0], variant: 1, h: 2.8, r: 1.3 },
        { pos: [x1 + 1.0, 0, z2 - 1.5], variant: 2, h: 3.0, r: 1.4 },
        { pos: [x2 - 1.0, 0, z2 - 1.5], variant: 0, h: 2.6, r: 1.2 },
        { pos: [x1 + 0.8, 0, (z1 + z2) / 2], variant: 1, h: 3.5, r: 1.6 },
      ],
      palms: [
        { pos: [x2 - 0.8, 0, (z1 + z2) / 2] },
        { pos: [midX + 2.5, 0, z2 + 1] },
      ],
      bushes: [
        { pos: [x1 + 1.8, 0, z1 + 0.5], s: 0.9 },
        { pos: [x2 - 1.8, 0, z1 + 0.5], s: 0.7 },
        { pos: [x1 + 0.5, 0, z1 + 2.0], s: 0.8 },
        { pos: [x2 - 0.5, 0, z1 + 2.0], s: 1.0 },
        { pos: [midX - 1.5, 0, z2 + 0.5], s: 0.6 },
        { pos: [midX + 1.5, 0, z2 + 0.5], s: 0.7 },
      ],
      lights: [
        [x1 + 0.4, z1 + 0.4],
        [x2 - 0.4, z1 + 0.4],
        [x1 + 0.4, z2 - 0.4],
        [x2 - 0.4, z2 - 0.4],
        [midX - 2, z2 + 2],
        [midX + 2, z2 + 2],
      ],
      rocks: [
        { pos: [x1 + 2.5, 0, z1 + 0.8], s: 0.8 },
        { pos: [x2 - 2.2, 0, z2 - 0.6], s: 0.6 },
        { pos: [x1 + 1.2, 0, z2 - 0.5], s: 1.0 },
      ],
      planters: [
        [midX - 0.8, z2 + 3.8],
        [midX + 0.8, z2 + 3.8],
      ],
    };
  }, [x1, x2, z1, z2, midX]);

  return (
    <group>
      {/* Multi-layer foliage trees */}
      {elements.trees.map((t, i) => (
        <group key={`tree-${i}`} position={t.pos}>
          <RealisticTree trunkH={t.h} crownR={t.r} variant={t.variant} />
        </group>
      ))}

      {/* Palm trees */}
      {elements.palms.map((p, i) => (
        <group key={`palm-${i}`} position={p.pos}>
          <PalmTree trunkH={3.5 + i * 0.5} />
        </group>
      ))}

      {/* Bush clusters */}
      {elements.bushes.map((b, i) => (
        <group key={`bush-${i}`} position={b.pos}>
          <BushCluster scale={b.s} />
        </group>
      ))}

      {/* Garden bollard lights */}
      {elements.lights.map((l, i) => (
        <group key={`light-${i}`} position={[l[0], 0, l[1]]}>
          <BollardLight renderMode={renderMode} />
        </group>
      ))}

      {/* Rocks */}
      {elements.rocks.map((r, i) => (
        <group key={`rock-${i}`} position={r.pos}>
          <Rock scale={r.s} />
        </group>
      ))}

      {/* Flower planters near entrance */}
      {elements.planters.map((p, i) => (
        <group key={`planter-${i}`} position={[p[0], 0, p[1]]}>
          <Planter renderMode={renderMode} />
        </group>
      ))}

      {/* Garden bench */}
      <group position={[x2 - 1.2, 0, (z1 + z2) / 2 + 1]} rotation={[0, -Math.PI / 2, 0]}>
        <GardenBench renderMode={renderMode} />
      </group>
    </group>
  );
}

// ─── Main Terrain Component ────────────────────────────────────
const ProceduralTerrain = memo(function ProceduralTerrain({
  walls, showCompoundWall = true, showDriveway = true, showGarden = true, renderMode,
}) {
  const bounds = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    (walls || []).forEach(w => {
      if (!w?.start_point || !w?.end_point) return;
      minX = Math.min(minX, w.start_point.x, w.end_point.x);
      maxX = Math.max(maxX, w.start_point.x, w.end_point.x);
      minY = Math.min(minY, w.start_point.y, w.end_point.y);
      maxY = Math.max(maxY, w.start_point.y, w.end_point.y);
    });
    return isFinite(minX) ? { minX, maxX, minY, maxY } : null;
  }, [walls]);

  return (
    <group>
      <GroundPlane renderMode={renderMode} />
      {showCompoundWall && <CompoundWall bounds={bounds} renderMode={renderMode} />}
      {showDriveway && <Driveway bounds={bounds} renderMode={renderMode} />}
      {showDriveway && <Walkway bounds={bounds} renderMode={renderMode} />}
      {showGarden && <GardenElements bounds={bounds} renderMode={renderMode} />}
    </group>
  );
});

export default ProceduralTerrain;
export { RealisticTree, PalmTree, BushCluster, BollardLight, Rock, GardenBench, Planter };
