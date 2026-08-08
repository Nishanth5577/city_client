// ═══════════════════════════════════════════════════════════════
// Architectural Details — Balconies, Railings, Cornices,
// Cladding, Sunshades, Canopies, Drainage, Exterior Lights
// ═══════════════════════════════════════════════════════════════
import { useMemo, memo } from 'react';
import * as THREE from 'three';
import { getProceduralMaterial } from './ProceduralTextures';

const S = 0.001;

// ─── Glass Railing (balcony / terrace) ─────────────────────────
function GlassRailing({ length, height = 1.05, renderMode }) {
  if (renderMode === 'wireframe' || renderMode === 'xray') return null;
  const postSpacing = Math.max(1, length / Math.ceil(length / 1.2));
  const numPosts = Math.ceil(length / postSpacing) + 1;

  return (
    <group>
      {/* Glass panel */}
      <mesh position={[length / 2, height / 2, 0]} castShadow>
        <boxGeometry args={[length, height - 0.1, 0.012]} />
        <meshPhysicalMaterial
          color="#E8F4F8"
          transmission={0.85}
          ior={1.52}
          thickness={0.012}
          roughness={0.05}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.1}
          transparent
          opacity={0.4}
          envMapIntensity={1.2}
        />
      </mesh>
      {/* Top handrail — stainless steel */}
      <mesh position={[length / 2, height, 0]} castShadow>
        <boxGeometry args={[length + 0.02, 0.04, 0.04]} />
        <meshStandardMaterial color="#D0D0D0" metalness={0.8} roughness={0.15} />
      </mesh>
      {/* Steel posts */}
      {Array.from({ length: numPosts }).map((_, i) => (
        <mesh key={i} position={[i * postSpacing, height / 2, 0]} castShadow>
          <boxGeometry args={[0.04, height, 0.04]} />
          <meshStandardMaterial color="#C8C8C8" metalness={0.8} roughness={0.15} />
        </mesh>
      ))}
      {/* Bottom channel */}
      <mesh position={[length / 2, 0.02, 0]}>
        <boxGeometry args={[length, 0.04, 0.06]} />
        <meshStandardMaterial color="#B0B0B0" metalness={0.7} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ─── Balcony Slab ──────────────────────────────────────────────
function BalconySlab({ width, depth = 1.2, wallHeight, renderMode }) {
  if (renderMode === 'wireframe' || renderMode === 'xray') return null;
  const slabH = 0.15;
  const dripH = 0.025;

  const matProps = useMemo(() => {
    const tex = getProceduralMaterial('concrete');
    return tex ? { map: tex.map, normalMap: tex.normalMap, roughness: 0.85, metalness: 0 } : { color: '#D0D0D0', roughness: 0.85 };
  }, []);

  const tileProps = useMemo(() => {
    const tex = getProceduralMaterial('tiles');
    return tex ? { map: tex.map, roughness: 0.5, metalness: 0 } : { color: '#E0D8D0', roughness: 0.5 };
  }, []);

  return (
    <group position={[0, wallHeight * S, 0]}>
      {/* Concrete slab */}
      <mesh position={[width / 2, -slabH / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.02, slabH, depth]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      {/* Floor tiles on top */}
      <mesh position={[width / 2, 0.005, depth / 2]} receiveShadow>
        <boxGeometry args={[width - 0.02, 0.01, depth - 0.05]} />
        <meshStandardMaterial {...tileProps} />
      </mesh>
      {/* Drip edge (prevents water stains on facade) */}
      <mesh position={[width / 2, -slabH - dripH / 2, depth + 0.01]} castShadow>
        <boxGeometry args={[width + 0.04, dripH, 0.03]} />
        <meshStandardMaterial color="#C0C0C0" roughness={0.7} />
      </mesh>
      {/* Glass railing */}
      <group position={[0, 0.01, depth]}>
        <GlassRailing length={width} renderMode={renderMode} />
      </group>
    </group>
  );
}

// ─── Cornice / Wall Band ───────────────────────────────────────
function Cornice({ length, wallHeight, renderMode }) {
  if (renderMode === 'wireframe' || renderMode === 'xray') return null;
  const bandH = 0.06;
  const bandD = 0.03;
  const y = wallHeight * S;

  return (
    <group>
      {/* Main cornice band */}
      <mesh position={[length / 2, y - 0.02, bandD / 2]} castShadow>
        <boxGeometry args={[length + 0.04, bandH, bandD]} />
        <meshStandardMaterial color="#E8E4DC" roughness={0.65} />
      </mesh>
      {/* Lower accent line */}
      <mesh position={[length / 2, y - 0.08, bandD / 2 - 0.005]}>
        <boxGeometry args={[length + 0.02, 0.015, bandD - 0.005]} />
        <meshStandardMaterial color="#D8D4CC" roughness={0.7} />
      </mesh>
      {/* Sill band at floor level */}
      <mesh position={[length / 2, 0.15, bandD / 2]} castShadow>
        <boxGeometry args={[length + 0.04, 0.04, bandD]} />
        <meshStandardMaterial color="#D0CCC4" roughness={0.7} />
      </mesh>
    </group>
  );
}

// ─── Sunshade / Chajja (above windows) ─────────────────────────
function Sunshade({ width, depth = 0.4, renderMode }) {
  if (renderMode === 'wireframe' || renderMode === 'xray') return null;
  return (
    <group>
      {/* Concrete chajja */}
      <mesh position={[width / 2, 0, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.15, 0.06, depth]} />
        <meshStandardMaterial color="#D8D4CC" roughness={0.8} />
      </mesh>
      {/* Drip line */}
      <mesh position={[width / 2, -0.035, depth]}>
        <boxGeometry args={[width + 0.16, 0.01, 0.015]} />
        <meshStandardMaterial color="#C0BCA8" roughness={0.7} />
      </mesh>
    </group>
  );
}

// ─── Entrance Canopy ───────────────────────────────────────────
function Canopy({ width = 2.5, depth = 1.5, height = 2.8, renderMode }) {
  if (renderMode === 'wireframe' || renderMode === 'xray') return null;
  return (
    <group position={[0, height, 0]}>
      {/* Canopy slab */}
      <mesh position={[width / 2, 0, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.1, depth]} />
        <meshStandardMaterial color="#D0D0D0" roughness={0.7} metalness={0.05} />
      </mesh>
      {/* Steel supports */}
      <mesh position={[0.08, -height / 2 + 0.05, depth - 0.1]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, height, 8]} />
        <meshStandardMaterial color="#A0A0A0" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[width - 0.08, -height / 2 + 0.05, depth - 0.1]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, height, 8]} />
        <meshStandardMaterial color="#A0A0A0" metalness={0.7} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ─── Exterior Wall Light Fixture ───────────────────────────────
function WallLight({ position, renderMode }) {
  if (renderMode === 'wireframe' || renderMode === 'xray') return null;
  return (
    <group position={position}>
      {/* Fixture body */}
      <mesh castShadow>
        <boxGeometry args={[0.08, 0.15, 0.06]} />
        <meshStandardMaterial color="#2A2A2A" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Light diffuser */}
      <mesh position={[0, 0, 0.035]}>
        <boxGeometry args={[0.06, 0.12, 0.01]} />
        <meshStandardMaterial color="#FFF8E0" emissive="#FFE0A0" emissiveIntensity={0.8} />
      </mesh>
      {/* Point light */}
      <pointLight position={[0, 0, 0.15]} intensity={0.3} color="#FFF4E0" distance={4} decay={2} />
    </group>
  );
}

// ─── Drainage Pipe ─────────────────────────────────────────────
function DrainagePipe({ height, renderMode }) {
  if (renderMode === 'wireframe' || renderMode === 'xray') return null;
  const pipeR = 0.035;
  return (
    <group>
      {/* Main pipe */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[pipeR, pipeR, height, 8]} />
        <meshStandardMaterial color="#808080" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Brackets */}
      {[0.3, height * 0.4, height * 0.75].map((y, i) => (
        <mesh key={i} position={[0, y, -pipeR - 0.01]}>
          <boxGeometry args={[0.06, 0.025, 0.03]} />
          <meshStandardMaterial color="#707070" metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
      {/* Elbow at bottom */}
      <mesh position={[0.05, 0.06, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[pipeR, pipeR, 0.1, 8]} />
        <meshStandardMaterial color="#808080" metalness={0.3} roughness={0.5} />
      </mesh>
    </group>
  );
}

// ─── Ventilator Grille ─────────────────────────────────────────
function VentilatorGrille({ renderMode }) {
  if (renderMode === 'wireframe' || renderMode === 'xray') return null;
  return (
    <mesh castShadow>
      <boxGeometry args={[0.25, 0.25, 0.02]} />
      <meshStandardMaterial color="#505050" metalness={0.4} roughness={0.5} />
    </mesh>
  );
}

// ─── Exterior Cladding Panel ───────────────────────────────────
function CladdingPanel({ width, height, renderMode }) {
  if (renderMode === 'wireframe' || renderMode === 'xray') return null;
  const matProps = useMemo(() => {
    const tex = getProceduralMaterial('granite');
    return tex ? { map: tex.map, normalMap: tex.normalMap, roughness: tex.roughness, metalness: tex.metalness }
      : { color: '#605850', roughness: 0.3, metalness: 0.05 };
  }, []);

  return (
    <mesh position={[width / 2, height / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[width, height, 0.025]} />
      <meshStandardMaterial {...matProps} />
    </mesh>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Component — Auto-generates details from wall data
// ═══════════════════════════════════════════════════════════════
const ArchitecturalDetails = memo(function ArchitecturalDetails({
  walls, windows, wallHeight = 3000, renderMode
}) {
  if (!walls || walls.length < 2 || renderMode === 'wireframe' || renderMode === 'xray') return null;

  // Find building bounds
  const bounds = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    walls.forEach(w => {
      if (!w?.start_point || !w?.end_point) return;
      minX = Math.min(minX, w.start_point.x, w.end_point.x);
      maxX = Math.max(maxX, w.start_point.x, w.end_point.x);
      minY = Math.min(minY, w.start_point.y, w.end_point.y);
      maxY = Math.max(maxY, w.start_point.y, w.end_point.y);
    });
    return isFinite(minX) ? { minX, maxX, minY, maxY, w: (maxX - minX) * S, d: (maxY - minY) * S } : null;
  }, [walls]);

  if (!bounds) return null;

  const wH = wallHeight * S;
  const bw = bounds.w;
  const bd = bounds.d;
  const cx = (bounds.minX + bounds.maxX) / 2 * S;
  const cz = (bounds.minY + bounds.maxY) / 2 * S;
  const x1 = bounds.minX * S;
  const z1 = bounds.minY * S;

  // Sunshades above windows
  const sunshades = useMemo(() => {
    if (!windows) return [];
    return windows.filter(w => w?.position).map(win => ({
      x: win.position.x * S,
      z: win.position.y * S,
      w: (win.width || 1200) * S,
      y: (win.sill_height || 900) * S + (win.height || 1200) * S,
      rotation: -(win.rotation || 0) * Math.PI / 180,
    }));
  }, [windows]);

  return (
    <group>
      {/* Cornice / wall band on each exterior wall */}
      {walls.filter(w => w?.wall_type === 'exterior' && w?.start_point && w?.end_point).slice(0, 4).map((wall, i) => {
        const dx = wall.end_point.x - wall.start_point.x;
        const dy = wall.end_point.y - wall.start_point.y;
        const len = Math.sqrt(dx * dx + dy * dy) * S;
        const angle = Math.atan2(dy, dx);
        return (
          <group key={`cornice-${i}`} position={[wall.start_point.x * S, 0, wall.start_point.y * S]} rotation={[0, -angle, 0]}>
            <Cornice length={len} wallHeight={wallHeight} renderMode={renderMode} />
          </group>
        );
      })}

      {/* Sunshades above windows */}
      {sunshades.map((sh, i) => (
        <group key={`shade-${i}`} position={[sh.x, sh.y, sh.z]} rotation={[0, sh.rotation, 0]}>
          <Sunshade width={sh.w} renderMode={renderMode} />
        </group>
      ))}

      {/* Drainage pipes at building corners */}
      <group position={[x1 + 0.05, 0, z1 + 0.05]}>
        <DrainagePipe height={wH} renderMode={renderMode} />
      </group>
      <group position={[x1 + bw - 0.05, 0, z1 + 0.05]}>
        <DrainagePipe height={wH} renderMode={renderMode} />
      </group>

      {/* Exterior wall lights (front face) */}
      <WallLight position={[x1 + 0.2, wH * 0.8, z1 + bd + 0.13]} renderMode={renderMode} />
      <WallLight position={[x1 + bw - 0.2, wH * 0.8, z1 + bd + 0.13]} renderMode={renderMode} />

      {/* Entrance canopy (front center) */}
      <group position={[cx - 1.25, 0, z1 + bd + 0.01]}>
        <Canopy renderMode={renderMode} />
      </group>

      {/* Lower exterior cladding (granite/stone) on front face */}
      <group position={[x1, 0, z1 + bd + 0.12]}>
        <CladdingPanel width={bw} height={Math.min(1.0, wH * 0.3)} renderMode={renderMode} />
      </group>

      {/* Ventilator grille (back face, near top) */}
      <group position={[cx, wH * 0.85, z1 - 0.13]}>
        <VentilatorGrille renderMode={renderMode} />
      </group>
    </group>
  );
});

export default ArchitecturalDetails;
export { GlassRailing, BalconySlab, Cornice, Sunshade, Canopy, WallLight, DrainagePipe, CladdingPanel };
