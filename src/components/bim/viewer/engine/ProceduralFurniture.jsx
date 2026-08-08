// ═══════════════════════════════════════════════════════════════
// Procedural Furniture v2 — Professional quality furniture
// Rounded edges, detailed kitchen/bathroom, curtains, fans
// ═══════════════════════════════════════════════════════════════
import { memo, useMemo } from 'react';
import * as THREE from 'three';
import { getProceduralMaterial } from './ProceduralTextures';
import { RoundedBox } from '@react-three/drei';

const S = 0.001;

// ─── Helpers ───────────────────────────────────────────────────
function B({ pos, size, color, roughness = 0.6, metalness = 0, mat, castShadow = true, emissive, emissiveIntensity = 0 }) {
  const texProps = useMemo(() => {
    if (mat) {
      const t = getProceduralMaterial(mat);
      if (t) return { map: t.map, normalMap: t.normalMap || null, roughness: t.roughness, metalness: t.metalness };
    }
    return { color, roughness, metalness };
  }, [mat, color, roughness, metalness]);

  return (
    <mesh position={pos} castShadow={castShadow} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial {...texProps} emissive={emissive} emissiveIntensity={emissiveIntensity} />
    </mesh>
  );
}

function Cyl({ pos, args, color, roughness = 0.6, metalness = 0, rotation }) {
  return (
    <mesh position={pos} rotation={rotation} castShadow>
      <cylinderGeometry args={args} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  );
}

function RB({ pos, size, radius = 0.01, color, roughness = 0.6, metalness = 0, mat }) {
  const texProps = useMemo(() => {
    if (mat) {
      const t = getProceduralMaterial(mat);
      if (t) return { map: t.map, normalMap: t.normalMap || null, roughness: t.roughness, metalness: t.metalness };
    }
    return { color, roughness, metalness };
  }, [mat, color, roughness, metalness]);

  return (
    <RoundedBox args={size} radius={radius} position={pos} castShadow receiveShadow>
      <meshStandardMaterial {...texProps} />
    </RoundedBox>
  );
}

// ─── SOFA (with throw pillows) ─────────────────────────────────
function Sofa({ w = 2.0, d = 0.85 }) {
  const seatH = 0.38, backH = 0.38, armW = 0.13, legH = 0.06;
  return (
    <group>
      {/* Legs — tapered metallic */}
      {[[-w/2+0.08, 0, -d/2+0.08], [w/2-0.08, 0, -d/2+0.08], [-w/2+0.08, 0, d/2-0.08], [w/2-0.08, 0, d/2-0.08]].map((p, i) => (
        <Cyl key={i} pos={[p[0], legH/2, p[2]]} args={[0.012, 0.018, legH, 6]} color="#3A3A3A" metalness={0.5} roughness={0.25} />
      ))}
      {/* Seat cushion — rounded */}
      <RB pos={[0, legH + seatH/2, 0.04]} size={[w - armW*2 - 0.02, seatH, d - 0.18]} radius={0.03} mat="fabric_beige" />
      {/* Back cushion — rounded */}
      <RB pos={[0, legH + seatH + backH/2 - 0.05, -d/2 + 0.12]} size={[w - armW*2 - 0.04, backH, 0.2]} radius={0.04} mat="fabric_beige" />
      {/* Left armrest */}
      <RB pos={[-w/2 + armW/2, legH + seatH/2, 0]} size={[armW, seatH + 0.06, d - 0.08]} radius={0.02} mat="fabric_brown" />
      {/* Right armrest */}
      <RB pos={[w/2 - armW/2, legH + seatH/2, 0]} size={[armW, seatH + 0.06, d - 0.08]} radius={0.02} mat="fabric_brown" />
      {/* Throw pillows */}
      <RB pos={[-w/3, legH + seatH + 0.12, -d/4]} size={[0.25, 0.25, 0.08]} radius={0.03} color="#D04050" roughness={0.9} />
      <RB pos={[w/3, legH + seatH + 0.12, -d/4]} size={[0.22, 0.22, 0.08]} radius={0.03} color="#4080C0" roughness={0.9} />
    </group>
  );
}

// ─── BED (with blanket drape + bedsheet) ───────────────────────
function Bed({ w = 1.8, d = 2.0 }) {
  const frameH = 0.22, mattH = 0.2, headH = 0.75, legH = 0.08;
  return (
    <group>
      {/* Legs */}
      {[[-w/2+0.05, 0, -d/2+0.05], [w/2-0.05, 0, -d/2+0.05], [-w/2+0.05, 0, d/2-0.05], [w/2-0.05, 0, d/2-0.05]].map((p, i) => (
        <B key={i} pos={[p[0], legH/2, p[2]]} size={[0.06, legH, 0.06]} color="#5A4030" />
      ))}
      {/* Frame */}
      <RB pos={[0, legH + frameH/2, 0]} size={[w, frameH, d]} radius={0.01} mat="wood_teak" />
      {/* Mattress — rounded */}
      <RB pos={[0, legH + frameH + mattH/2, 0.02]} size={[w - 0.06, mattH, d - 0.1]} radius={0.03} color="#F5F0E0" roughness={0.92} />
      {/* Bedsheet drape over edges */}
      <B pos={[0, legH + frameH + mattH + 0.005, 0.02]} size={[w - 0.02, 0.01, d - 0.04]} color="#FFFDF5" roughness={0.95} />
      {/* Blanket fold at foot */}
      <RB pos={[0, legH + frameH + mattH + 0.04, d/2 - 0.3]} size={[w - 0.1, 0.06, 0.5]} radius={0.02} color="#8B7060" roughness={0.9} />
      {/* Headboard */}
      <RB pos={[0, legH + headH/2, -d/2 + 0.03]} size={[w + 0.02, headH, 0.06]} radius={0.01} mat="wood_walnut" />
      {/* Pillows — rounded */}
      <RB pos={[-w/4, legH + frameH + mattH + 0.08, -d/2 + 0.3]} size={[w/3, 0.12, 0.38]} radius={0.04} color="#FFFFFF" roughness={0.95} />
      <RB pos={[w/4, legH + frameH + mattH + 0.08, -d/2 + 0.3]} size={[w/3, 0.12, 0.38]} radius={0.04} color="#FFFFFF" roughness={0.95} />
      {/* Side table (left) */}
      <B pos={[-w/2 - 0.3, 0.25, -d/2 + 0.25]} size={[0.4, 0.5, 0.4]} mat="wood_teak" />
      {/* Bedside lamp */}
      <Cyl pos={[-w/2 - 0.3, 0.55, -d/2 + 0.25]} args={[0.04, 0.05, 0.08, 8]} color="#3A3A3A" metalness={0.5} roughness={0.3} />
      <Cyl pos={[-w/2 - 0.3, 0.65, -d/2 + 0.25]} args={[0.08, 0.04, 0.1, 12]} color="#F5E8D0" roughness={0.8} />
    </group>
  );
}

// ─── DINING TABLE (with rounded top) ───────────────────────────
function DiningTable({ w = 1.5, d = 0.9, h = 0.76 }) {
  const topH = 0.04;
  return (
    <group>
      <RB pos={[0, h - topH/2, 0]} size={[w, topH, d]} radius={0.015} mat="wood_oak" />
      {[[-w/2+0.08, 0, -d/2+0.08], [w/2-0.08, 0, -d/2+0.08], [-w/2+0.08, 0, d/2-0.08], [w/2-0.08, 0, d/2-0.08]].map((p, i) => (
        <Cyl key={i} pos={[p[0], (h-topH)/2, p[2]]} args={[0.025, 0.025, h-topH, 8]} color="#8A6A40" roughness={0.5} />
      ))}
    </group>
  );
}

// ─── CHAIR ─────────────────────────────────────────────────────
function Chair() {
  const w = 0.44, d = 0.44, seatH = 0.45, backH = 0.4;
  return (
    <group>
      {[[-w/2+0.04, 0, -d/2+0.04], [w/2-0.04, 0, -d/2+0.04], [-w/2+0.04, 0, d/2-0.04], [w/2-0.04, 0, d/2-0.04]].map((p, i) => (
        <Cyl key={i} pos={[p[0], seatH/2, p[2]]} args={[0.015, 0.015, seatH, 6]} color="#8A6A40" roughness={0.5} />
      ))}
      <RB pos={[0, seatH + 0.015, 0]} size={[w, 0.03, d]} radius={0.008} mat="wood_oak" />
      <RB pos={[0, seatH + 0.03 + backH/2, -d/2+0.02]} size={[w - 0.04, backH, 0.025]} radius={0.005} mat="wood_oak" />
    </group>
  );
}

// ─── TV UNIT (with panel & decor) ──────────────────────────────
function TVUnit({ w = 1.6 }) {
  const d = 0.4, h = 0.5;
  return (
    <group>
      <RB pos={[0, h/2, 0]} size={[w, h, d]} radius={0.01} mat="wood_walnut" />
      {/* Drawer faces */}
      <B pos={[-w/4, h/2, d/2 + 0.003]} size={[w/2 - 0.04, h - 0.06, 0.003]} color="#3A3020" roughness={0.4} />
      <B pos={[w/4, h/2, d/2 + 0.003]} size={[w/2 - 0.04, h - 0.06, 0.003]} color="#3A3020" roughness={0.4} />
      {/* Drawer handles */}
      <Cyl pos={[-w/4, h/2, d/2 + 0.015]} args={[0.005, 0.005, 0.08, 6]} color="#B0A090" metalness={0.6} roughness={0.2} rotation={[Math.PI/2, 0, 0]} />
      <Cyl pos={[w/4, h/2, d/2 + 0.015]} args={[0.005, 0.005, 0.08, 6]} color="#B0A090" metalness={0.6} roughness={0.2} rotation={[Math.PI/2, 0, 0]} />
      {/* TV Screen — thin with bezel */}
      <B pos={[0, h + 0.02, -d/2 + 0.03]} size={[0.05, 0.04, 0.08]} color="#2A2A2A" roughness={0.3} />
      <B pos={[0, h + 0.42, -d/2 + 0.03]} size={[1.2, 0.7, 0.03]} color="#0A0A0A" roughness={0.05} metalness={0.2} />
      {/* Screen content (slight emissive) */}
      <B pos={[0, h + 0.42, -d/2 + 0.048]} size={[1.16, 0.66, 0.001]} color="#1A3A5A" emissive="#1A3A5A" emissiveIntensity={0.15} roughness={0.0} />
    </group>
  );
}

// ─── KITCHEN CABINETS (enhanced) ───────────────────────────────
function KitchenCabinets({ w = 3.0, d = 0.6 }) {
  const lH = 0.85, uH = 0.6, gap = 0.5, ctH = 0.04;
  const numLower = Math.floor(w / 0.6);
  const numUpper = Math.floor(w / 0.5);
  return (
    <group>
      {/* Lower cabinets */}
      <RB pos={[0, lH/2, 0]} size={[w, lH, d]} radius={0.005} mat="wood_pine" />
      {/* Countertop — granite */}
      <RB pos={[0, lH + ctH/2, 0]} size={[w + 0.02, ctH, d + 0.03]} radius={0.005} mat="granite" />
      {/* Backsplash tiles */}
      <B pos={[0, lH + ctH + 0.15, -d/2 + 0.008]} size={[w, 0.3, 0.015]} mat="tiles_white" />
      {/* Upper cabinets */}
      <RB pos={[0, lH + ctH + gap + uH/2, 0]} size={[w, uH, d - 0.1]} radius={0.005} mat="wood_pine" />
      {/* Sink */}
      <B pos={[0, lH + ctH + 0.005, 0.05]} size={[0.55, 0.01, 0.42]} color="#D8D8D8" metalness={0.6} roughness={0.15} />
      {/* Tap — arch shape */}
      <Cyl pos={[0, lH + ctH + 0.12, -d/2 + 0.15]} args={[0.012, 0.012, 0.2, 8]} color="#C0C0C0" metalness={0.8} roughness={0.15} />
      <Cyl pos={[0, lH + ctH + 0.2, -d/2 + 0.22]} args={[0.01, 0.01, 0.12, 8]} color="#C0C0C0" metalness={0.8} roughness={0.15} rotation={[Math.PI/3, 0, 0]} />
      {/* Gas stove / cooktop */}
      <B pos={[w/3, lH + ctH + 0.008, 0]} size={[0.6, 0.015, 0.5]} color="#1A1A1A" metalness={0.3} roughness={0.2} />
      {/* Burner rings */}
      {[[w/3 - 0.12, 0.1], [w/3 + 0.12, 0.1], [w/3 - 0.12, -0.1], [w/3 + 0.12, -0.1]].map((bp, i) => (
        <mesh key={i} position={[bp[0], lH + ctH + 0.018, bp[1]]} rotation={[-Math.PI/2, 0, 0]}>
          <torusGeometry args={[0.05, 0.006, 4, 16]} />
          <meshStandardMaterial color="#404040" metalness={0.5} roughness={0.3} />
        </mesh>
      ))}
      {/* Chimney hood */}
      <B pos={[w/3, lH + ctH + gap + 0.15, -d/2 + 0.2]} size={[0.7, 0.3, 0.35]} color="#C0C0C0" metalness={0.5} roughness={0.2} />
      <B pos={[w/3, lH + ctH + gap + 0.45, -d/2 + 0.12]} size={[0.4, 0.3, 0.2]} color="#B0B0B0" metalness={0.5} roughness={0.2} />
      {/* Lower cabinet handles */}
      {Array.from({ length: numLower }).map((_, i) => (
        <Cyl key={`lh-${i}`} pos={[(-w/2 + 0.3) + i * (w/numLower), lH/2, d/2 + 0.015]} args={[0.005, 0.005, 0.1, 6]} color="#A0A0A0" metalness={0.6} roughness={0.2} rotation={[Math.PI/2, 0, 0]} />
      ))}
      {/* Upper cabinet handles */}
      {Array.from({ length: numUpper }).map((_, i) => (
        <Cyl key={`uh-${i}`} pos={[(-w/2 + 0.25) + i * (w/numUpper), lH + ctH + gap + uH/2, (d-0.1)/2 + 0.015]} args={[0.005, 0.005, 0.08, 6]} color="#A0A0A0" metalness={0.6} roughness={0.2} rotation={[Math.PI/2, 0, 0]} />
      ))}
    </group>
  );
}

// ─── WARDROBE ──────────────────────────────────────────────────
function Wardrobe({ w = 1.8, d = 0.6, h = 2.1 }) {
  return (
    <group>
      <RB pos={[0, h/2, 0]} size={[w, h, d]} radius={0.005} mat="wood_teak" />
      <B pos={[0, h/2, d/2 + 0.002]} size={[0.01, h - 0.04, 0.003]} color="#2A2018" />
      {/* Mirror panel on one door */}
      <B pos={[-w/4, h/2, d/2 + 0.005]} size={[w/2 - 0.06, h - 0.1, 0.003]} color="#C8D8E8" roughness={0.02} metalness={0.2} />
      {/* Handles */}
      <Cyl pos={[-0.05, h/2, d/2 + 0.02]} args={[0.005, 0.005, 0.12, 6]} color="#B0A090" metalness={0.5} roughness={0.2} />
      <Cyl pos={[0.05, h/2, d/2 + 0.02]} args={[0.005, 0.005, 0.12, 6]} color="#B0A090" metalness={0.5} roughness={0.2} />
    </group>
  );
}

// ─── STUDY TABLE ───────────────────────────────────────────────
function StudyTable({ w = 1.2, d = 0.6, h = 0.75 }) {
  return (
    <group>
      <RB pos={[0, h - 0.02, 0]} size={[w, 0.03, d]} radius={0.008} mat="wood_oak" />
      <B pos={[-w/2 + 0.02, h/2, 0]} size={[0.03, h, d - 0.04]} mat="wood_oak" />
      <B pos={[w/2 - 0.02, h/2, 0]} size={[0.03, h, d - 0.04]} mat="wood_oak" />
      <RB pos={[w/4, h - 0.1, 0]} size={[w/3, 0.12, d - 0.08]} radius={0.005} mat="wood_oak" />
      {/* Monitor */}
      <B pos={[0, h + 0.2, -d/4]} size={[0.5, 0.35, 0.02]} color="#1A1A1A" roughness={0.1} metalness={0.2} />
      <B pos={[0, h + 0.2, -d/4 + 0.012]} size={[0.47, 0.32, 0.001]} color="#2A3A5A" emissive="#2A3A5A" emissiveIntensity={0.1} roughness={0.0} />
      <B pos={[0, h + 0.02, -d/4]} size={[0.08, 0.02, 0.08]} color="#2A2A2A" metalness={0.3} roughness={0.3} />
      {/* Keyboard */}
      <B pos={[0, h + 0.01, d/6]} size={[0.35, 0.01, 0.12]} color="#2A2A2A" roughness={0.5} />
    </group>
  );
}

// ─── TOILET / WC (enhanced) ────────────────────────────────────
function ToiletWC() {
  return (
    <group>
      <B pos={[0, 0.55, -0.16]} size={[0.35, 0.32, 0.15]} color="#FFFFFF" roughness={0.1} />
      <mesh position={[0, 0.24, 0.05]} castShadow>
        <cylinderGeometry args={[0.18, 0.14, 0.32, 16]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.08} />
      </mesh>
      <RB pos={[0, 0.42, 0.05]} size={[0.38, 0.02, 0.4]} radius={0.08} color="#FFFFFF" roughness={0.08} />
      {/* Flush button */}
      <Cyl pos={[0, 0.72, -0.16]} args={[0.025, 0.025, 0.01, 12]} color="#D0D0D0" metalness={0.5} roughness={0.2} />
    </group>
  );
}

// ─── WASH BASIN (modern wall-mount) ────────────────────────────
function WashBasin() {
  return (
    <group>
      {/* Vanity counter */}
      <RB pos={[0, 0.78, 0]} size={[0.6, 0.06, 0.45]} radius={0.01} mat="marble_white" />
      {/* Basin — recessed */}
      <mesh position={[0, 0.72, 0.02]} castShadow>
        <cylinderGeometry args={[0.18, 0.16, 0.1, 16]} />
        <meshStandardMaterial color="#FAFAFA" roughness={0.06} />
      </mesh>
      {/* Tap — modern mixer */}
      <Cyl pos={[0, 0.88, -0.15]} args={[0.012, 0.012, 0.18, 8]} color="#C0C0C0" metalness={0.85} roughness={0.1} />
      <Cyl pos={[0, 0.95, -0.08]} args={[0.008, 0.008, 0.14, 8]} color="#C0C0C0" metalness={0.85} roughness={0.1} rotation={[Math.PI/3, 0, 0]} />
      {/* Mirror with frame */}
      <B pos={[0, 1.35, -0.22]} size={[0.5, 0.65, 0.015]} color="#C8D8E8" roughness={0.02} metalness={0.15} />
      <B pos={[0, 1.35, -0.23]} size={[0.54, 0.69, 0.01]} color="#2A2A2A" roughness={0.4} metalness={0.3} />
      {/* Vanity cabinet below */}
      <RB pos={[0, 0.5, 0]} size={[0.56, 0.48, 0.4]} radius={0.005} mat="wood_walnut" />
    </group>
  );
}

// ─── SHOWER (glass partition) ──────────────────────────────────
function Shower() {
  return (
    <group>
      {/* Base tray */}
      <RB pos={[0, 0.03, 0]} size={[0.9, 0.06, 0.9]} radius={0.02} color="#E8E8E8" roughness={0.15} />
      {/* Glass partition */}
      <mesh position={[0.44, 1.0, 0]} castShadow>
        <boxGeometry args={[0.01, 1.9, 0.88]} />
        <meshPhysicalMaterial
          color="#E8F4F8" transmission={0.88} ior={1.52} thickness={0.01}
          roughness={0.05} metalness={0} clearcoat={1} transparent opacity={0.35} envMapIntensity={1.2}
        />
      </mesh>
      {/* Chrome rail */}
      <B pos={[0.44, 1.95, 0]} size={[0.02, 0.02, 0.9]} color="#C0C0C0" metalness={0.8} roughness={0.1} />
      {/* Rain shower head */}
      <Cyl pos={[0, 2.0, -0.3]} args={[0.1, 0.1, 0.02, 16]} color="#C0C0C0" metalness={0.8} roughness={0.1} />
      {/* Shower arm */}
      <Cyl pos={[0, 1.95, -0.35]} args={[0.012, 0.012, 0.12, 8]} color="#C0C0C0" metalness={0.8} roughness={0.1} />
      {/* Mixer valve */}
      <Cyl pos={[0, 1.2, -0.44]} args={[0.025, 0.025, 0.02, 12]} color="#C0C0C0" metalness={0.8} roughness={0.1} />
    </group>
  );
}

// ─── REFRIGERATOR ──────────────────────────────────────────────
function Refrigerator() {
  return (
    <group>
      <RB pos={[0, 0.85, 0]} size={[0.65, 1.7, 0.65]} radius={0.01} color="#E8E8E8" metalness={0.3} roughness={0.15} />
      <B pos={[0, 1.2, 0.327]} size={[0.63, 0.012, 0.003]} color="#C0C0C0" />
      <Cyl pos={[0.28, 1.0, 0.34]} args={[0.008, 0.008, 0.28, 6]} color="#A0A0A0" metalness={0.7} roughness={0.15} />
      <Cyl pos={[0.28, 1.5, 0.34]} args={[0.008, 0.008, 0.18, 6]} color="#A0A0A0" metalness={0.7} roughness={0.15} />
      {/* Water dispenser */}
      <B pos={[-0.1, 0.95, 0.33]} size={[0.12, 0.08, 0.01]} color="#B0B0B0" metalness={0.3} roughness={0.2} />
    </group>
  );
}

// ─── COFFEE TABLE ──────────────────────────────────────────────
function CoffeeTable() {
  return (
    <group>
      <RB pos={[0, 0.42, 0]} size={[0.9, 0.025, 0.5]} radius={0.008} mat="marble_white" />
      {[[-0.38, 0, -0.2], [0.38, 0, -0.2], [-0.38, 0, 0.2], [0.38, 0, 0.2]].map((p, i) => (
        <Cyl key={i} pos={[p[0], 0.21, p[2]]} args={[0.015, 0.015, 0.4, 6]} color="#C8A060" metalness={0.5} roughness={0.3} />
      ))}
      {/* Decor items */}
      <B pos={[0.15, 0.45, 0]} size={[0.15, 0.02, 0.2]} color="#3A5040" roughness={0.5} />
      <Cyl pos={[-0.15, 0.48, 0]} args={[0.04, 0.03, 0.06, 8]} color="#E0D8C0" roughness={0.7} />
    </group>
  );
}

// ─── CEILING FAN ───────────────────────────────────────────────
function CeilingFan() {
  return (
    <group>
      {/* Motor housing */}
      <Cyl pos={[0, 0, 0]} args={[0.08, 0.08, 0.12, 12]} color="#E8E4DC" roughness={0.4} metalness={0.2} />
      {/* Mounting rod */}
      <Cyl pos={[0, 0.15, 0]} args={[0.015, 0.015, 0.2, 6]} color="#C0C0C0" metalness={0.6} roughness={0.2} />
      {/* Blades */}
      {[0, 2.09, 4.19].map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * 0.35, -0.02, Math.sin(a) * 0.35]} rotation={[0, -a, 0]} castShadow>
          <boxGeometry args={[0.6, 0.01, 0.1]} />
          <meshStandardMaterial color="#D0C8B0" roughness={0.6} />
        </mesh>
      ))}
      {/* Light kit */}
      <mesh position={[0, -0.08, 0]}>
        <sphereGeometry args={[0.05, 10, 8]} />
        <meshStandardMaterial color="#FFF8E0" emissive="#FFE8B0" emissiveIntensity={0.5} roughness={0.1} />
      </mesh>
    </group>
  );
}

// ─── CURTAIN ───────────────────────────────────────────────────
function Curtain({ width = 1.2, height = 2.0 }) {
  const geo = useMemo(() => {
    const w = width / 2, h = height, segs = 20;
    const positions = [], indices = [], normals = [], uvs = [];
    for (let j = 0; j <= segs; j++) {
      for (let i = 0; i <= segs; i++) {
        const u = i / segs, v = j / segs;
        const x = u * w;
        const y = (1 - v) * h;
        const z = Math.sin(u * Math.PI * 3) * 0.04 * (1 - v * 0.5); // Wave
        positions.push(x, y, z);
        normals.push(0, 0, 1);
        uvs.push(u, v);
      }
    }
    for (let j = 0; j < segs; j++) {
      for (let i = 0; i < segs; i++) {
        const a = j * (segs + 1) + i, b = a + 1;
        const c = (j + 1) * (segs + 1) + i, dd = c + 1;
        indices.push(a, b, dd, a, dd, c);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, [width, height]);

  return (
    <group>
      {/* Left curtain panel */}
      <mesh geometry={geo} position={[-width / 2, 0, 0]} castShadow>
        <meshStandardMaterial color="#D8C8A0" roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      {/* Right curtain panel (mirrored) */}
      <mesh geometry={geo} position={[0, 0, 0]} castShadow>
        <meshStandardMaterial color="#D8C8A0" roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      {/* Curtain rod */}
      <Cyl pos={[0, height + 0.02, -0.03]} args={[0.01, 0.01, width + 0.15, 8]} color="#B0A080" metalness={0.5} roughness={0.3} rotation={[0, 0, Math.PI/2]} />
      {/* Rod ends */}
      <mesh position={[-width/2 - 0.08, height + 0.02, -0.03]}>
        <sphereGeometry args={[0.02, 8, 6]} />
        <meshStandardMaterial color="#B0A080" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[width/2 + 0.08, height + 0.02, -0.03]}>
        <sphereGeometry args={[0.02, 8, 6]} />
        <meshStandardMaterial color="#B0A080" metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ─── PICTURE FRAME ─────────────────────────────────────────────
function PictureFrame({ w = 0.4, h = 0.3 }) {
  return (
    <group>
      <B pos={[0, 0, 0]} size={[w + 0.03, h + 0.03, 0.02]} color="#5A4030" roughness={0.5} />
      <B pos={[0, 0, 0.011]} size={[w - 0.02, h - 0.02, 0.002]} color="#E8D8C0" roughness={0.7} />
    </group>
  );
}

// ─── CAR (enhanced) ────────────────────────────────────────────
function Car() {
  return (
    <group>
      <RB pos={[0, 0.48, 0]} size={[1.8, 0.45, 4.2]} radius={0.08} color="#2A4060" roughness={0.12} metalness={0.65} />
      <RB pos={[0, 0.88, -0.2]} size={[1.6, 0.42, 2.2]} radius={0.12} color="#2A4060" roughness={0.12} metalness={0.65} />
      {/* Windshield — physical glass */}
      <mesh position={[0, 0.92, 0.9]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[1.5, 0.5, 0.006]} />
        <meshPhysicalMaterial color="#C0D8E8" transmission={0.8} ior={1.5} roughness={0.02} clearcoat={1} transparent opacity={0.4} />
      </mesh>
      {/* Headlights */}
      <B pos={[-0.6, 0.5, 2.1]} size={[0.3, 0.1, 0.02]} color="#F0F0E0" emissive="#FFE8C0" emissiveIntensity={0.4} roughness={0.05} />
      <B pos={[0.6, 0.5, 2.1]} size={[0.3, 0.1, 0.02]} color="#F0F0E0" emissive="#FFE8C0" emissiveIntensity={0.4} roughness={0.05} />
      {/* Tail lights */}
      <B pos={[-0.65, 0.55, -2.08]} size={[0.2, 0.08, 0.02]} color="#C02020" emissive="#C02020" emissiveIntensity={0.3} roughness={0.1} />
      <B pos={[0.65, 0.55, -2.08]} size={[0.2, 0.08, 0.02]} color="#C02020" emissive="#C02020" emissiveIntensity={0.3} roughness={0.1} />
      {/* Wheels */}
      {[[-0.9, 0.3, 1.2], [0.9, 0.3, 1.2], [-0.9, 0.3, -1.2], [0.9, 0.3, -1.2]].map((p, i) => (
        <group key={i} position={p}>
          <Cyl pos={[0, 0, 0]} args={[0.3, 0.3, 0.2, 16]} color="#1A1A1A" roughness={0.9} />
          <Cyl pos={[0, 0, 0]} args={[0.18, 0.18, 0.22, 8]} color="#C0C0C0" metalness={0.7} roughness={0.15} />
        </group>
      ))}
      {/* Side mirrors */}
      <B pos={[-0.92, 0.85, 0.6]} size={[0.08, 0.06, 0.1]} color="#2A4060" roughness={0.12} metalness={0.65} />
      <B pos={[0.92, 0.85, 0.6]} size={[0.08, 0.06, 0.1]} color="#2A4060" roughness={0.12} metalness={0.65} />
    </group>
  );
}

// ─── BOOKSHELF ─────────────────────────────────────────────────
function Bookshelf() {
  const shelfH = [0.3, 0.65, 1.0, 1.35];
  return (
    <group>
      <RB pos={[0, 0.9, 0]} size={[0.8, 1.8, 0.3]} radius={0.005} mat="wood_oak" />
      {shelfH.map((y, i) => (
        <B key={i} pos={[0, y, 0.005]} size={[0.76, 0.02, 0.28]} mat="wood_oak" />
      ))}
      {/* Books */}
      {shelfH.slice(0, 3).map((y, i) => (
        <group key={`books-${i}`}>
          {Array.from({ length: 4 + i }).map((_, j) => (
            <B key={j} pos={[-0.3 + j * 0.1, y + 0.12, 0]} size={[0.06, 0.2 - j * 0.01, 0.2]}
              color={['#B03030', '#3050B0', '#308030', '#C08020', '#6030A0', '#308080'][j % 6]} roughness={0.8} />
          ))}
        </group>
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// Furniture Factory
// ═══════════════════════════════════════════════════════════════
const FURNITURE_MAP = {
  sofa: Sofa,
  bed: Bed,
  bed_single: () => <Bed w={0.9} d={1.9} />,
  dining_table: DiningTable,
  chair: Chair,
  tv_unit: TVUnit,
  kitchen_cabinets: KitchenCabinets,
  wardrobe: Wardrobe,
  study_table: StudyTable,
  toilet: ToiletWC,
  wash_basin: WashBasin,
  shower: Shower,
  refrigerator: Refrigerator,
  coffee_table: CoffeeTable,
  ceiling_fan: CeilingFan,
  curtain: Curtain,
  picture_frame: PictureFrame,
  bookshelf: Bookshelf,
  car: Car,
};

// ─── Main Component ────────────────────────────────────────────
const ProceduralFurniture = memo(function ProceduralFurniture({
  fur, floorY = 0, renderMode, selected, onSelect
}) {
  if (!fur?.position) return null;

  const x = fur.position.x * S;
  const z = fur.position.y * S;
  const rotation = -(fur.rotation || 0) * Math.PI / 180;
  const furType = fur.type || fur.furniture_type || 'generic';
  const Component = FURNITURE_MAP[furType];

  if (renderMode === 'wireframe' || renderMode === 'xray') {
    const w = (fur.width || 600) * S;
    const d = (fur.depth || 600) * S;
    const h = (fur.height || 750) * S;
    return (
      <mesh position={[x, floorY + h / 2, z]} rotation={[0, rotation, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={fur.color || '#DEB887'}
          wireframe={renderMode === 'wireframe'}
          transparent={renderMode === 'xray'}
          opacity={renderMode === 'xray' ? 0.1 : 0.7}
        />
      </mesh>
    );
  }

  return (
    <group position={[x, floorY, z]} rotation={[0, rotation, 0]}
      onClick={(e) => { e.stopPropagation(); onSelect?.(fur._id || fur.canvas_id, 'furniture'); }}>
      {Component ? <Component /> : (
        <RB pos={[0, (fur.height || 750) * S / 2, 0]}
          size={[(fur.width || 600) * S, (fur.height || 750) * S, (fur.depth || 600) * S]}
          radius={0.01} color={fur.color || '#DEB887'} />
      )}
      {selected && (
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshBasicMaterial color="#FF6B35" transparent opacity={0.06} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
});

export default ProceduralFurniture;
export { FURNITURE_MAP, Sofa, Bed, DiningTable, Chair, TVUnit, KitchenCabinets, Wardrobe, StudyTable, ToiletWC, WashBasin, Shower, Refrigerator, CoffeeTable, CeilingFan, Curtain, PictureFrame, Bookshelf, Car };
