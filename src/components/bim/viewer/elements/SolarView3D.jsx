const S = 0.001;

function SolarPanel3D({ x, z, width = 1, height = 1.7, tilt = 15, rotation = 0, roofY = 3 }) {
  const tiltRad = (tilt * Math.PI) / 180;
  return (
    <group position={[x, roofY + 0.3, z]} rotation={[0, -(rotation * Math.PI) / 180, 0]}>
      {/* Panel frame */}
      <mesh rotation={[tiltRad, 0, 0]} position={[0, Math.sin(tiltRad) * height / 2, 0]}>
        <boxGeometry args={[width, height, 0.04]} />
        <meshStandardMaterial color="#1A237E" roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Cell lines */}
      <mesh rotation={[tiltRad, 0, 0]} position={[0, Math.sin(tiltRad) * height / 2, 0.025]}>
        <planeGeometry args={[width - 0.04, height - 0.04]} />
        <meshStandardMaterial color="#283593" roughness={0.2} metalness={0.5} />
      </mesh>
      {/* Support leg */}
      <mesh position={[0, -0.1, -0.3]}>
        <boxGeometry args={[0.03, 0.3, 0.03]} />
        <meshStandardMaterial color="#9E9E9E" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Inverter3D({ el, floorY = 0 }) {
  const x = (el.position?.x || 0) * S;
  const z = (el.position?.y || 0) * S;
  return (
    <mesh position={[x, floorY + 1.2, z]}>
      <boxGeometry args={[0.4, 0.5, 0.15]} />
      <meshStandardMaterial color="#37474F" roughness={0.4} metalness={0.3} />
    </mesh>
  );
}

function BatteryBank3D({ el, floorY = 0 }) {
  const x = (el.position?.x || 0) * S;
  const z = (el.position?.y || 0) * S;
  const count = el.battery_count || 4;
  return (
    <group position={[x, floorY, z]}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[(i % 2) * 0.35 - 0.175, 0.25, Math.floor(i / 2) * 0.25 - 0.125]}>
          <boxGeometry args={[0.3, 0.5, 0.2]} />
          <meshStandardMaterial color="#424242" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

export default function SolarView3D({ elements = [], roofY = 3 }) {
  return (
    <group>
      {elements.map((solar, idx) => {
        const key = solar._id || solar.canvas_id || idx;

        // Render panel array
        if (solar.panels_layout?.length > 0) {
          return (
            <group key={key}>
              {solar.panels_layout.map((panel, pi) => (
                <SolarPanel3D key={pi}
                  x={(panel.x || 0) * S} z={(panel.y || 0) * S}
                  width={(panel.width || 1000) * S} height={(panel.height || 1700) * S}
                  tilt={solar.tilt_angle || 15} rotation={panel.rotation || 0}
                  roofY={roofY} />
              ))}
            </group>
          );
        }

        // Auto-generate panel grid from count
        if (solar.num_panels > 0) {
          const cols = Math.ceil(Math.sqrt(solar.num_panels));
          const rows = Math.ceil(solar.num_panels / cols);
          const panels = [];
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols && panels.length < solar.num_panels; c++) {
              panels.push(
                <SolarPanel3D key={panels.length}
                  x={c * 1.1 + 1} z={r * 1.8 + 1}
                  tilt={solar.tilt_angle || 15}
                  roofY={roofY} />
              );
            }
          }
          return <group key={key}>{panels}</group>;
        }

        return null;
      })}
    </group>
  );
}
