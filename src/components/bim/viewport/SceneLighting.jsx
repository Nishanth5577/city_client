// ═══════════════════════════════════════════════════════════════
// SceneLighting — Professional Architectural Visualization Lighting
// Clean, bright daylight with soft shadow mapping
// Three-point lighting setup for arch-viz quality
// ═══════════════════════════════════════════════════════════════
import { useRef } from 'react';
import * as THREE from 'three';
import useBimStore from '../../../stores/bimStore';
import { TIME_OF_DAY } from '../../../stores/bimTypes';

const SUN_CONFIGS = {
  [TIME_OF_DAY.MORNING]: {
    position: [30, 20, 25],
    color: '#FFF8E8',
    intensity: 4.0,
    ambient: 0.6,
    hemisphere: { sky: '#B4D7F0', ground: '#E8DFD0', intensity: 0.6 },
    fillColor: '#D4E5F7',
    fillIntensity: 0.6,
    rimIntensity: 0.25,
  },
  [TIME_OF_DAY.DAY]: {
    position: [20, 40, 15],
    color: '#FFFFFF',
    intensity: 4.5,
    ambient: 0.7,
    hemisphere: { sky: '#87CEEB', ground: '#E0DDD5', intensity: 0.7 },
    fillColor: '#D0E4F5',
    fillIntensity: 0.7,
    rimIntensity: 0.3,
  },
  [TIME_OF_DAY.EVENING]: {
    position: [-25, 10, 18],
    color: '#FFD0A0',
    intensity: 3.0,
    ambient: 0.4,
    hemisphere: { sky: '#E8A060', ground: '#8B7355', intensity: 0.4 },
    fillColor: '#A0B8D0',
    fillIntensity: 0.35,
    rimIntensity: 0.2,
  },
  [TIME_OF_DAY.SUNSET]: {
    position: [-30, 5, 14],
    color: '#FF8040',
    intensity: 2.0,
    ambient: 0.25,
    hemisphere: { sky: '#FF7043', ground: '#5D4037', intensity: 0.3 },
    fillColor: '#8090B0',
    fillIntensity: 0.2,
    rimIntensity: 0.15,
  },
  [TIME_OF_DAY.NIGHT]: {
    position: [10, 25, 10],
    color: '#6080C0',
    intensity: 0.3,
    ambient: 0.1,
    hemisphere: { sky: '#101830', ground: '#151520', intensity: 0.08 },
    fillColor: '#304060',
    fillIntensity: 0.05,
    rimIntensity: 0.02,
  },
};

export default function SceneLighting() {
  const timeOfDay = useBimStore(s => s.timeOfDay);
  const sunRef = useRef();
  const config = SUN_CONFIGS[timeOfDay] || SUN_CONFIGS[TIME_OF_DAY.DAY];

  return (
    <>
      {/* ── Key Light (Sun) ── */}
      <directionalLight
        ref={sunRef}
        position={config.position}
        color={config.color}
        intensity={config.intensity}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={150}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-bias={-0.0001}
        shadow-normalBias={0.04}
        shadow-radius={3}
      />

      {/* ── Fill Light (opposite, cooler) ── */}
      <directionalLight
        position={[-config.position[0] * 0.6, config.position[1] * 0.5, -config.position[2] * 0.6]}
        color={config.fillColor}
        intensity={config.fillIntensity}
      />

      {/* ── Rim / Back Light (definition edges) ── */}
      <directionalLight
        position={[-15, 25, -20]}
        color="#E8F0FF"
        intensity={config.rimIntensity}
      />

      {/* ── Top bounce light (soft overhead fill) ── */}
      <directionalLight
        position={[0, 50, 0]}
        color="#F0F0FF"
        intensity={0.15}
      />

      {/* ── Ambient base ── */}
      <ambientLight color="#F5F2EE" intensity={config.ambient} />

      {/* ── Hemisphere (sky/ground color bleed) ── */}
      <hemisphereLight
        skyColor={config.hemisphere.sky}
        groundColor={config.hemisphere.ground}
        intensity={config.hemisphere.intensity}
      />
    </>
  );
}
