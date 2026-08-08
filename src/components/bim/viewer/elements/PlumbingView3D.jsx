const S = 0.001;

function PipeRun3D({ route, diameter_mm = 20, color = '#2196F3', floorY = 0 }) {
  if (!route || route.length < 2) return null;
  return (
    <group>
      {route.slice(0, -1).map((pt, i) => {
        const next = route[i + 1];
        const sx = pt.x * S, sz = pt.y * S;
        const ex = next.x * S, ez = next.y * S;
        const dx = ex - sx, dz = ez - sz;
        const len = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dz, dx);
        const r = (diameter_mm / 2) * S;
        return (
          <mesh key={i} position={[(sx + ex) / 2, floorY + 0.3, (sz + ez) / 2]}
            rotation={[0, -angle, Math.PI / 2]}>
            <cylinderGeometry args={[r, r, len, 8]} />
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} transparent opacity={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}

function Fixture3D({ el, floorY = 0 }) {
  const x = (el.position?.x || 0) * S;
  const z = (el.position?.y || 0) * S;
  const colors = { toilet: '#F5F5F5', sink: '#E0E0E0', shower: '#B3E5FC', bathtub: '#E1F5FE', wash_basin: '#ECEFF1' };
  const color = colors[el.element_type] || '#BDBDBD';
  const sizes = {
    toilet: [0.4, 0.4, 0.7], sink: [0.5, 0.25, 0.4],
    shower: [0.9, 0.02, 0.9], bathtub: [1.5, 0.5, 0.7], wash_basin: [0.45, 0.15, 0.35],
  };
  const [w, h, d] = sizes[el.element_type] || [0.4, 0.3, 0.4];
  const mountH = el.element_type === 'wash_basin' ? 0.8 : el.element_type === 'shower' ? 2.0 : 0;

  return (
    <mesh position={[x, floorY + mountH + h / 2, z]} rotation={[0, -(el.rotation || 0) * Math.PI / 180, 0]}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} roughness={0.2} metalness={0.1} />
    </mesh>
  );
}

function Tank3D({ el, floorY = 0, isOverhead = false }) {
  const x = (el.position?.x || 0) * S;
  const z = (el.position?.y || 0) * S;
  const capacity = el.capacity_liters || 1000;
  const vol = capacity / 1000;
  const side = Math.cbrt(vol);
  const y = isOverhead ? floorY + 3.5 : floorY - 1;

  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[side * 1.5, side, side]} />
      <meshStandardMaterial color={isOverhead ? '#1565C0' : '#37474F'} transparent opacity={0.6} roughness={0.3} />
    </mesh>
  );
}

export default function PlumbingView3D({ elements = [], floorY = 0 }) {
  const pipes = elements.filter(el => el.element_type?.includes('pipe'));
  const fixtures = elements.filter(el => !el.element_type?.includes('pipe') && !['water_tank', 'septic_tank'].includes(el.element_type));
  const tanks = elements.filter(el => ['water_tank', 'septic_tank'].includes(el.element_type));

  return (
    <group>
      {pipes.map((pipe, i) => (
        <PipeRun3D key={pipe._id || i} route={pipe.pipe_route}
          diameter_mm={pipe.pipe_diameter || 20}
          color={pipe.element_type === 'drain_pipe' ? '#4CAF50' : pipe.element_type === 'sewage_pipe' ? '#795548' : '#2196F3'}
          floorY={floorY} />
      ))}
      {fixtures.map((fix, i) => <Fixture3D key={fix._id || i} el={fix} floorY={floorY} />)}
      {tanks.map((tank, i) => <Tank3D key={tank._id || i} el={tank} floorY={floorY}
        isOverhead={tank.element_type === 'water_tank'} />)}
    </group>
  );
}
