const S = 0.001;

function DuctRun3D({ route, width_mm = 300, height_mm = 200, isReturn = false, floorY = 0 }) {
  if (!route || route.length < 2) return null;
  const color = isReturn ? '#EF5350' : '#42A5F5';
  const w = width_mm * S;
  const h = height_mm * S;

  return (
    <group>
      {route.slice(0, -1).map((pt, i) => {
        const next = route[i + 1];
        const sx = pt.x * S, sz = pt.y * S;
        const ex = next.x * S, ez = next.y * S;
        const dx = ex - sx, dz = ez - sz;
        const len = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dz, dx);
        return (
          <mesh key={i} position={[(sx + ex) / 2, floorY + 2.7, (sz + ez) / 2]}
            rotation={[0, -angle, 0]}>
            <boxGeometry args={[len, h, w]} />
            <meshStandardMaterial color={color} transparent opacity={0.4} roughness={0.6} metalness={0.3} />
          </mesh>
        );
      })}
    </group>
  );
}

function ACUnit3D({ el, floorY = 0 }) {
  const x = (el.position?.x || 0) * S;
  const z = (el.position?.y || 0) * S;
  // Indoor unit on wall
  return (
    <group position={[x, floorY + 2.3, z]} rotation={[0, -(el.rotation || 0) * Math.PI / 180, 0]}>
      <mesh>
        <boxGeometry args={[0.85, 0.3, 0.22]} />
        <meshStandardMaterial color="#F5F5F5" roughness={0.3} />
      </mesh>
      {/* Grille lines */}
      <mesh position={[0, -0.08, 0.115]}>
        <boxGeometry args={[0.75, 0.08, 0.005]} />
        <meshStandardMaterial color="#E0E0E0" />
      </mesh>
    </group>
  );
}

function Vent3D({ el, floorY = 0 }) {
  const x = (el.position?.x || 0) * S;
  const z = (el.position?.y || 0) * S;
  return (
    <mesh position={[x, floorY + 2.95, z]}>
      <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
      <meshStandardMaterial color="#90CAF9" roughness={0.3} metalness={0.4} />
    </mesh>
  );
}

function ExhaustFan3D({ el, floorY = 0 }) {
  const x = (el.position?.x || 0) * S;
  const z = (el.position?.y || 0) * S;
  return (
    <group position={[x, floorY + 2.5, z]}>
      <mesh>
        <boxGeometry args={[0.3, 0.3, 0.1]} />
        <meshStandardMaterial color="#78909C" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.06]}>
        <circleGeometry args={[0.1, 6]} />
        <meshStandardMaterial color="#546E7A" side={2} />
      </mesh>
    </group>
  );
}

export default function HVACView3D({ elements = [], floorY = 0 }) {
  const ducts = elements.filter(el => el.element_type === 'duct');
  const acUnits = elements.filter(el => el.element_type === 'ac_unit');
  const vents = elements.filter(el => el.element_type === 'vent' || el.element_type === 'diffuser');
  const exhausts = elements.filter(el => el.element_type === 'exhaust_fan');

  return (
    <group>
      {ducts.map((d, i) => <DuctRun3D key={d._id || i} route={d.duct_route}
        width_mm={d.duct_width} height_mm={d.duct_height}
        isReturn={d.duct_type === 'return'} floorY={floorY} />)}
      {acUnits.map((ac, i) => <ACUnit3D key={ac._id || i} el={ac} floorY={floorY} />)}
      {vents.map((v, i) => <Vent3D key={v._id || i} el={v} floorY={floorY} />)}
      {exhausts.map((e, i) => <ExhaustFan3D key={e._id || i} el={e} floorY={floorY} />)}
    </group>
  );
}
