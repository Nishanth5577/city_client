// ═══════════════════════════════════════════════════════════════
// SceneEnvironment — Clean Arch-Viz Sky, Ground, Atmosphere
// Soft blue gradient sky, HDRI reflections, atmospheric fog
// ═══════════════════════════════════════════════════════════════
import { useMemo } from 'react';
import { Sky, Stars, Environment, ContactShadows } from '@react-three/drei';
import useBimStore from '../../../stores/bimStore';
import { TIME_OF_DAY, MM_TO_M } from '../../../stores/bimTypes';

const SKY_CONFIGS = {
  [TIME_OF_DAY.MORNING]: { sunPosition: [30, 20, 25], turbidity: 4, rayleigh: 0.5, mieCoefficient: 0.003, mieDirectionalG: 0.8 },
  [TIME_OF_DAY.DAY]:     { sunPosition: [20, 40, 15], turbidity: 3, rayleigh: 0.3, mieCoefficient: 0.002, mieDirectionalG: 0.9 },
  [TIME_OF_DAY.EVENING]: { sunPosition: [-25, 10, 18], turbidity: 6, rayleigh: 1.5, mieCoefficient: 0.005, mieDirectionalG: 0.85 },
  [TIME_OF_DAY.SUNSET]:  { sunPosition: [-30, 5, 14], turbidity: 8, rayleigh: 2.5, mieCoefficient: 0.01, mieDirectionalG: 0.8 },
  [TIME_OF_DAY.NIGHT]:   { sunPosition: [10, -15, 10], turbidity: 10, rayleigh: 0.1, mieCoefficient: 0.001, mieDirectionalG: 0.7 },
};

export default function SceneEnvironment() {
  const timeOfDay = useBimStore(s => s.timeOfDay);
  const site = useBimStore(s => s.site);
  const isNight = timeOfDay === TIME_OF_DAY.NIGHT;
  const config = SKY_CONFIGS[timeOfDay] || SKY_CONFIGS[TIME_OF_DAY.DAY];
  const S = MM_TO_M;

  const siteCenter = useMemo(() => [
    site.width * S / 2, 0, site.length * S / 2,
  ], [site.width, site.length]);

  return (
    <>
      {/* ── Sky ── */}
      {isNight ? (
        <Stars radius={300} depth={100} count={3000} factor={4} saturation={0} fade speed={0.3} />
      ) : (
        <Sky
          distance={450000}
          sunPosition={config.sunPosition}
          turbidity={config.turbidity}
          rayleigh={config.rayleigh}
          mieCoefficient={config.mieCoefficient}
          mieDirectionalG={config.mieDirectionalG}
        />
      )}

      {/* ── HDRI Environment for realistic reflections on glass/metal ── */}
      <Environment
        preset="city"
        background={false}
        environmentIntensity={0.5}
      />

      {/* ── Soft ground-level contact shadows ── */}
      <ContactShadows
        position={[siteCenter[0], 0.01, siteCenter[2]]}
        opacity={0.45}
        scale={100}
        blur={3}
        far={25}
        resolution={1024}
        color="#1a1a2a"
      />

      {/* ── Atmospheric fog for depth ── */}
      {!isNight && (
        <fog attach="fog" args={['#E4E8EC', 100, 350]} />
      )}
      {isNight && (
        <fog attach="fog" args={['#0A0E18', 50, 180]} />
      )}
    </>
  );
}
