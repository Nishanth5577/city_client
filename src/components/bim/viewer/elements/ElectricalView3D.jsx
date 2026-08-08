import { useSelector } from 'react-redux';
import * as THREE from 'three';

const S = 0.001; // mm to meters

function Conduit({ start, end, color = '#FFD700' }) {
  if (!start || !end) return null;
  const sx = start.x * S, sz = start.y * S;
  const ex = end.x * S, ez = end.y * S;
  const dx = ex - sx, dz = ez - sz;
  const len = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);
  return (
    <mesh position={[(sx + ex) / 2, 2.5, (sz + ez) / 2]} rotation={[0, -angle, 0]}>
      <cylinderGeometry args={[0.012, 0.012, len, 6]} rotation={[0, 0, Math.PI / 2]} />
      <meshStandardMaterial color={color} roughness={0.4} />
    </mesh>
  );
}

function SwitchSocket3D({ el, floorY = 0 }) {
  const x = (el.position?.x || 0) * S;
  const z = (el.position?.y || 0) * S;
  const mountH = (el.mounting_height || 1200) * S;
  const color = el.element_type === 'switch' ? '#FFD700' : '#FF8C00';
  return (
    <mesh position={[x, floorY + mountH, z]}>
      <boxGeometry args={[0.07, 0.07, 0.02]} />
      <meshStandardMaterial color={color} roughness={0.3} />
    </mesh>
  );
}

function Light3D({ el, floorY = 0, ceilingH = 3 }) {
  const x = (el.position?.x || 0) * S;
  const z = (el.position?.y || 0) * S;
  return (
    <group position={[x, floorY + ceilingH - 0.05, z]}>
      <mesh>
        <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
        <meshStandardMaterial color="#FFF" emissive="#FFFF99" emissiveIntensity={0.5} />
      </mesh>
      <pointLight color="#FFF5E0" intensity={0.3} distance={5} />
    </group>
  );
}

function DistributionBoard3D({ el, floorY = 0 }) {
  const x = (el.position?.x || 0) * S;
  const z = (el.position?.y || 0) * S;
  return (
    <mesh position={[x, floorY + 1.5, z]}>
      <boxGeometry args={[0.4, 0.5, 0.12]} />
      <meshStandardMaterial color="#E0E0E0" roughness={0.5} metalness={0.3} />
    </mesh>
  );
}

export default function ElectricalView3D({ elements = [], floorY = 0 }) {
  return (
    <group>
      {elements.map((el, i) => {
        const key = el._id || el.canvas_id || i;
        switch (el.element_type) {
          case 'switch': case 'socket': return <SwitchSocket3D key={key} el={el} floorY={floorY} />;
          case 'light': case 'fan': return <Light3D key={key} el={el} floorY={floorY} />;
          case 'distribution_board': case 'main_panel': return <DistributionBoard3D key={key} el={el} floorY={floorY} />;
          default: return null;
        }
      })}
      {/* Wire routes as conduits */}
      {elements.filter(el => el.wire_route?.length > 1).map((el, i) => (
        el.wire_route.slice(0, -1).map((pt, j) => (
          <Conduit key={`c-${i}-${j}`} start={pt} end={el.wire_route[j + 1]} />
        ))
      ))}
    </group>
  );
}
