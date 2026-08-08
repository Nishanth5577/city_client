// ═══════════════════════════════════════════════════════════════
// Lighting System v2 — Professional architectural lighting
// Key/Fill/Rim technique, facade wash, interior glow
// ═══════════════════════════════════════════════════════════════
import { memo, useMemo } from 'react';
import { Environment, Sky, ContactShadows, useHelper } from '@react-three/drei';
import * as THREE from 'three';

const LightingSystem = memo(function LightingSystem({
  timeOfDay = 14,
  enableShadows = true,
  interiorLights = [],
  renderMode,
}) {
  // Sun position based on time of day
  const sunPos = useMemo(() => {
    const hour = timeOfDay % 24;
    const angle = ((hour - 6) / 12) * Math.PI;
    const elevation = Math.sin(angle) * 60;
    const azimuth = Math.cos(angle) * 80;
    return [azimuth, Math.max(5, elevation), 50];
  }, [timeOfDay]);

  // Sun intensity based on time
  const sunIntensity = useMemo(() => {
    const hour = timeOfDay % 24;
    if (hour < 5 || hour > 20) return 0.08;
    if (hour < 7 || hour > 18) return 0.6;
    return 1.6;
  }, [timeOfDay]);

  // Light color temperature
  const sunColor = useMemo(() => {
    const hour = timeOfDay % 24;
    if (hour < 5 || hour > 20) return '#4060A0'; // Night — blue moonlight
    if (hour < 7) return '#FFB070'; // Dawn — warm orange
    if (hour > 18) return '#FFA050'; // Sunset — deep orange
    if (hour > 15) return '#FFF0D0'; // Afternoon — warm
    return '#FFF8F0'; // Midday — neutral
  }, [timeOfDay]);

  const skyColor = useMemo(() => {
    const hour = timeOfDay % 24;
    if (hour < 5 || hour > 20) return '#0A0A2A';
    if (hour < 7 || hour > 18) return '#FF8C42';
    return '#87CEEB';
  }, [timeOfDay]);

  if (renderMode === 'wireframe' || renderMode === 'xray') {
    return (
      <>
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 20, 10]} intensity={0.5} />
      </>
    );
  }

  return (
    <>
      {/* ═══ KEY LIGHT — Primary sun ═══ */}
      <directionalLight
        position={sunPos}
        intensity={sunIntensity}
        castShadow={enableShadows}
        shadow-mapSize={[4096, 4096]}
        shadow-camera-far={120}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.00015}
        shadow-normalBias={0.025}
        shadow-radius={3}
        color={sunColor}
      />

      {/* ═══ FILL LIGHT — Opposite side, soft bounce simulation ═══ */}
      <directionalLight
        position={[-sunPos[0] * 0.6, sunPos[1] * 0.4, -sunPos[2] * 0.6]}
        intensity={sunIntensity * 0.25}
        color="#C8D8F0"
      />

      {/* ═══ RIM LIGHT — Edge highlighting from behind ═══ */}
      <directionalLight
        position={[-sunPos[0] * 0.3, sunPos[1] * 0.8, -sunPos[2]]}
        intensity={sunIntensity * 0.15}
        color="#F0F4FF"
      />

      {/* ═══ HEMISPHERE — Sky/ground ambient ═══ */}
      <hemisphereLight
        skyColor={skyColor}
        groundColor="#3A5A3A"
        intensity={0.3}
      />

      {/* ═══ AMBIENT — Base fill ═══ */}
      <ambientLight intensity={0.12} color="#F8F4F0" />

      {/* ═══ INTERIOR LIGHTS — Warm room illumination ═══ */}
      {interiorLights.map((light, i) => (
        <group key={i}>
          <pointLight
            position={light.position}
            intensity={0.6}
            color="#FFF4E0"
            distance={8}
            decay={2}
            castShadow={false}
          />
          {/* Spot component for focused downlight effect */}
          <spotLight
            position={[light.position[0], light.position[1], light.position[2]]}
            target-position={[light.position[0], 0, light.position[2]]}
            intensity={0.3}
            angle={Math.PI / 3}
            penumbra={0.8}
            color="#FFF8E8"
            distance={6}
            decay={2}
          />
        </group>
      ))}

      {/* ═══ SKY DOME ═══ */}
      <Sky
        sunPosition={sunPos}
        turbidity={timeOfDay < 7 || timeOfDay > 18 ? 10 : 4}
        rayleigh={timeOfDay < 7 || timeOfDay > 18 ? 0.5 : 2.5}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      {/* ═══ HDR ENVIRONMENT — Reflections ═══ */}
      <Environment preset="sunset" background={false} />

      {/* ═══ CONTACT SHADOWS — Ground plane ═══ */}
      <ContactShadows
        position={[0, -0.003, 0]}
        opacity={0.5}
        scale={70}
        blur={2.0}
        far={25}
        resolution={1024}
      />

      {/* ═══ ATMOSPHERIC FOG ═══ */}
      <fog
        attach="fog"
        args={[skyColor, 50, 200]}
      />
    </>
  );
});

export default LightingSystem;
