// ═══════════════════════════════════════════════════════════════
// Environment System — Procedural sky, sun, atmosphere
// Dynamic sky with time-of-day and sun position
// ═══════════════════════════════════════════════════════════════
import { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Sun Position Calculator ───────────────────────────────────
export function calculateSunPosition(hour = 14, month = 6, latitude = 12.97) {
  // Simplified solar position calculation
  const dayOfYear = month * 30;
  const declination = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
  const decRad = declination * Math.PI / 180;
  const latRad = latitude * Math.PI / 180;
  
  const hourAngle = (hour - 12) * 15; // degrees
  const haRad = hourAngle * Math.PI / 180;
  
  const sinAlt = Math.sin(latRad) * Math.sin(decRad) + 
                 Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  
  const cosAz = (Math.sin(decRad) - Math.sin(altitude) * Math.sin(latRad)) / 
                (Math.cos(altitude) * Math.cos(latRad));
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz)));
  if (hour > 12) azimuth = 2 * Math.PI - azimuth;
  
  const distance = 50;
  const x = distance * Math.cos(altitude) * Math.sin(azimuth);
  const y = Math.max(0.5, distance * Math.sin(altitude));
  const z = distance * Math.cos(altitude) * Math.cos(azimuth);
  
  return { x, y, z, altitude, azimuth };
}

// ─── Sky Colors based on time ──────────────────────────────────
function getSkyColors(hour) {
  if (hour >= 6 && hour < 8) {
    // Morning
    return {
      zenith: new THREE.Color('#4A90D9'),
      horizon: new THREE.Color('#FFB366'),
      ground: new THREE.Color('#8B7355'),
      sunColor: new THREE.Color('#FFD700'),
      intensity: 0.8 + (hour - 6) * 0.3,
      ambientIntensity: 0.3,
    };
  } else if (hour >= 8 && hour < 16) {
    // Day
    return {
      zenith: new THREE.Color('#2563EB'),
      horizon: new THREE.Color('#87CEEB'),
      ground: new THREE.Color('#B8A88A'),
      sunColor: new THREE.Color('#FFFAF0'),
      intensity: 1.2 + Math.sin((hour - 8) / 8 * Math.PI) * 0.6,
      ambientIntensity: 0.45,
    };
  } else if (hour >= 16 && hour < 18) {
    // Golden Hour
    return {
      zenith: new THREE.Color('#4169E1'),
      horizon: new THREE.Color('#FF8C42'),
      ground: new THREE.Color('#8B6914'),
      sunColor: new THREE.Color('#FF9F43'),
      intensity: 1.0 - (hour - 16) * 0.3,
      ambientIntensity: 0.35,
    };
  } else if (hour >= 18 && hour < 20) {
    // Sunset
    return {
      zenith: new THREE.Color('#1E3A5F'),
      horizon: new THREE.Color('#E74C3C'),
      ground: new THREE.Color('#5A3825'),
      sunColor: new THREE.Color('#FF6B35'),
      intensity: 0.4 - (hour - 18) * 0.15,
      ambientIntensity: 0.25,
    };
  } else {
    // Night
    return {
      zenith: new THREE.Color('#0A0E1A'),
      horizon: new THREE.Color('#1A2332'),
      ground: new THREE.Color('#1A1A2E'),
      sunColor: new THREE.Color('#C0C0FF'),
      intensity: 0.05,
      ambientIntensity: 0.1,
    };
  }
}

// ─── Procedural Sky Dome ───────────────────────────────────────
function ProceduralSkyDome({ hour = 14 }) {
  const meshRef = useRef();
  const { zenith, horizon, ground } = useMemo(() => getSkyColors(hour), [hour]);

  const material = useMemo(() => {
    const vertexShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    const fragmentShader = `
      uniform vec3 uZenith;
      uniform vec3 uHorizon;
      uniform vec3 uGround;
      varying vec3 vWorldPosition;
      void main() {
        vec3 dir = normalize(vWorldPosition);
        float y = dir.y;
        vec3 color;
        if (y > 0.0) {
          float t = pow(y, 0.4);
          color = mix(uHorizon, uZenith, t);
        } else {
          float t = pow(-y, 0.5);
          color = mix(uHorizon, uGround, t);
        }
        // Add some haze near horizon
        float haze = exp(-abs(y) * 3.0) * 0.15;
        color += vec3(haze);
        gl_FragColor = vec4(color, 1.0);
      }
    `;
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uZenith: { value: zenith },
        uHorizon: { value: horizon },
        uGround: { value: ground },
      },
      side: THREE.BackSide,
      depthWrite: false,
    });
  }, [zenith, horizon, ground]);

  return (
    <mesh ref={meshRef} material={material}>
      <sphereGeometry args={[200, 32, 16]} />
    </mesh>
  );
}

// ─── Sun Disc ──────────────────────────────────────────────────
function SunDisc({ position, color, intensity }) {
  if (position[1] < 0.5) return null;
  const glowColor = new THREE.Color(color).multiplyScalar(1.5);
  return (
    <group position={position}>
      {/* Sun core */}
      <mesh>
        <sphereGeometry args={[2, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Glow */}
      <mesh>
        <sphereGeometry args={[4, 16, 16]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

// ─── Ground Plane (infinite-looking) ───────────────────────────
function InfiniteGround() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
      <planeGeometry args={[500, 500]} />
      <meshStandardMaterial
        color="#7B9B5A"
        roughness={0.95}
        metalness={0}
      />
    </mesh>
  );
}

// ─── Atmosphere Fog ────────────────────────────────────────────
function AtmosphereFog({ hour }) {
  const { scene } = useThree();
  const colors = useMemo(() => getSkyColors(hour), [hour]);

  useEffect(() => {
    scene.fog = new THREE.FogExp2(colors.horizon.getHex(), 0.008);
    return () => { scene.fog = null; };
  }, [scene, colors.horizon]);

  return null;
}

// ═══════════════════════════════════════════════════════════════
// MAIN ENVIRONMENT SYSTEM
// ═══════════════════════════════════════════════════════════════
export default function EnvironmentSystem({
  hour = 14,
  month = 6,
  latitude = 12.97, // Bangalore default
  showGround = true,
  showFog = true,
  castShadow = true,
}) {
  const sunPos = useMemo(() => calculateSunPosition(hour, month, latitude), [hour, month, latitude]);
  const skyColors = useMemo(() => getSkyColors(hour), [hour]);

  // Update shadow camera when sun moves
  const dirLightRef = useRef();
  useEffect(() => {
    if (dirLightRef.current) {
      const light = dirLightRef.current;
      light.shadow.camera.left = -40;
      light.shadow.camera.right = 40;
      light.shadow.camera.top = 40;
      light.shadow.camera.bottom = -40;
      light.shadow.camera.near = 0.5;
      light.shadow.camera.far = 120;
      light.shadow.mapSize.width = 2048;
      light.shadow.mapSize.height = 2048;
      light.shadow.bias = -0.0002;
      light.shadow.normalBias = 0.02;
      light.shadow.camera.updateProjectionMatrix();
    }
  }, []);

  return (
    <>
      {/* Sky dome */}
      <ProceduralSkyDome hour={hour} />
      
      {/* Sun disc */}
      <SunDisc
        position={[sunPos.x, sunPos.y, sunPos.z]}
        color={skyColors.sunColor}
        intensity={skyColors.intensity}
      />

      {/* Main directional light (sun) */}
      <directionalLight
        ref={dirLightRef}
        position={[sunPos.x, sunPos.y, sunPos.z]}
        intensity={skyColors.intensity}
        color={skyColors.sunColor}
        castShadow={castShadow}
      />

      {/* Ambient light (sky bounce) */}
      <ambientLight intensity={skyColors.ambientIntensity} color="#B8C8E0" />

      {/* Hemisphere light (sky + ground bounce) */}
      <hemisphereLight
        skyColor={skyColors.zenith}
        groundColor={skyColors.ground}
        intensity={0.3}
      />

      {/* Fill light (opposite side of sun) */}
      <directionalLight
        position={[-sunPos.x * 0.5, sunPos.y * 0.3, -sunPos.z * 0.5]}
        intensity={skyColors.intensity * 0.15}
        color="#8EBBFF"
      />

      {/* Ground plane */}
      {showGround && <InfiniteGround />}

      {/* Atmospheric fog */}
      {showFog && <AtmosphereFog hour={hour} />}
    </>
  );
}

// ─── Lighting Presets ──────────────────────────────────────────
export const LIGHTING_PRESETS = {
  MORNING: { hour: 7, month: 3, name: 'Morning', icon: '🌅' },
  AFTERNOON: { hour: 14, month: 6, name: 'Afternoon', icon: '☀️' },
  GOLDEN_HOUR: { hour: 17, month: 9, name: 'Golden Hour', icon: '🌇' },
  EVENING: { hour: 19, month: 6, name: 'Evening', icon: '🌆' },
  NIGHT: { hour: 22, month: 6, name: 'Night', icon: '🌙' },
  CLOUDY: { hour: 12, month: 12, name: 'Cloudy', icon: '☁️' },
};
