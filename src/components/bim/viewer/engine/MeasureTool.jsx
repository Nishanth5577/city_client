// ═══════════════════════════════════════════════════════════════
// Measurement Tool — 3D distance/angle measurement overlay
// Click two points to measure distance, click three for angle
// Shows dimension line with label in 3D space
// ═══════════════════════════════════════════════════════════════
import { useState, useRef, useCallback, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';

function MeasurementLine({ start, end, color = '#00FF88' }) {
  const distance = start.distanceTo(end);
  const midpoint = new THREE.Vector3().lerpVectors(start, end, 0.5);
  const distMM = Math.round(distance * 1000); // Convert scene units to mm

  // Format dimension
  const dimText = distMM >= 1000
    ? `${(distMM / 1000).toFixed(2)} m`
    : `${distMM} mm`;

  return (
    <group>
      {/* Dimension line */}
      <Line
        points={[start, end]}
        color={color}
        lineWidth={2}
        dashed
        dashScale={20}
        dashSize={0.05}
        gapSize={0.02}
      />

      {/* End markers */}
      <mesh position={start}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={end}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Dimension label */}
      <Html position={[midpoint.x, midpoint.y + 0.15, midpoint.z]} center>
        <div className="bg-black/80 backdrop-blur-sm rounded-lg px-2 py-1 border border-emerald-500/30 whitespace-nowrap pointer-events-none select-none">
          <span className="text-[11px] font-mono text-emerald-400 font-bold">{dimText}</span>
        </div>
      </Html>

      {/* Extension lines (perpendicular tick marks at ends) */}
      {distance > 0.1 && (() => {
        const dir = new THREE.Vector3().subVectors(end, start).normalize();
        const perp = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(0.05);
        return (
          <>
            <Line points={[start.clone().add(perp), start.clone().sub(perp)]} color={color} lineWidth={1} />
            <Line points={[end.clone().add(perp), end.clone().sub(perp)]} color={color} lineWidth={1} />
          </>
        );
      })()}
    </group>
  );
}

function AngleMeasurement({ p1, p2, p3, color = '#FFB300' }) {
  const v1 = new THREE.Vector3().subVectors(p1, p2).normalize();
  const v2 = new THREE.Vector3().subVectors(p3, p2).normalize();
  const angle = Math.acos(Math.max(-1, Math.min(1, v1.dot(v2))));
  const angleDeg = (angle * 180 / Math.PI).toFixed(1);

  // Draw arc
  const arcRadius = 0.2;
  const arcPoints = [];
  const steps = 16;
  const normal = new THREE.Vector3().crossVectors(v1, v2).normalize();
  if (normal.lengthSq() < 0.001) return null;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const q = new THREE.Quaternion().setFromAxisAngle(normal, angle * t);
    const pt = v1.clone().applyQuaternion(q).multiplyScalar(arcRadius).add(p2);
    arcPoints.push(pt);
  }

  const labelPos = v1.clone().add(v2).normalize().multiplyScalar(arcRadius * 1.5).add(p2);

  return (
    <group>
      <Line points={arcPoints} color={color} lineWidth={2} />
      <Line points={[p2, p2.clone().add(v1.clone().multiplyScalar(arcRadius * 1.5))]} color={color} lineWidth={1} />
      <Line points={[p2, p2.clone().add(v2.clone().multiplyScalar(arcRadius * 1.5))]} color={color} lineWidth={1} />
      <Html position={labelPos} center>
        <div className="bg-black/80 backdrop-blur-sm rounded-lg px-2 py-1 border border-amber-500/30 whitespace-nowrap pointer-events-none select-none">
          <span className="text-[11px] font-mono text-amber-400 font-bold">{angleDeg}°</span>
        </div>
      </Html>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// MEASURE TOOL — Click handler in 3D scene
// ═══════════════════════════════════════════════════════════════
export default function MeasureTool({ enabled = false, mode = 'distance' }) {
  const [points, setPoints] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [cursorPoint, setCursorPoint] = useState(null);
  const { camera, raycaster, scene } = useThree();
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  // Raycast to get 3D point from mouse
  const getPoint = useCallback((event) => {
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);

    // Try to hit scene objects first
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      return intersects[0].point.clone();
    }

    // Fall back to ground plane
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(planeRef.current, target);
    return target;
  }, [camera, raycaster, scene]);

  // Handle click
  const handleClick = useCallback((event) => {
    if (!enabled) return;
    event.stopPropagation();

    const point = getPoint(event);
    if (!point) return;

    const newPoints = [...points, point];

    if (mode === 'distance' && newPoints.length >= 2) {
      setMeasurements(prev => [...prev, { type: 'distance', start: newPoints[0], end: newPoints[1] }]);
      setPoints([]);
    } else if (mode === 'angle' && newPoints.length >= 3) {
      setMeasurements(prev => [...prev, { type: 'angle', p1: newPoints[0], p2: newPoints[1], p3: newPoints[2] }]);
      setPoints([]);
    } else {
      setPoints(newPoints);
    }
  }, [enabled, points, mode, getPoint]);

  if (!enabled) return null;

  return (
    <group onClick={handleClick}>
      {/* Invisible click plane */}
      <mesh visible={false}>
        <planeGeometry args={[500, 500]} />
        <meshBasicMaterial side={THREE.DoubleSide} />
      </mesh>

      {/* Placed points */}
      {points.map((pt, i) => (
        <mesh key={i} position={pt}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshBasicMaterial color="#00FF88" />
        </mesh>
      ))}

      {/* Preview line from last point to cursor */}
      {points.length === 1 && cursorPoint && (
        <Line
          points={[points[0], cursorPoint]}
          color="#00FF88"
          lineWidth={1}
          dashed
          dashScale={30}
        />
      )}

      {/* Completed measurements */}
      {measurements.map((m, i) => (
        m.type === 'distance' ? (
          <MeasurementLine key={i} start={m.start} end={m.end} />
        ) : (
          <AngleMeasurement key={i} p1={m.p1} p2={m.p2} p3={m.p3} />
        )
      ))}
    </group>
  );
}

// ─── Measurement HUD ───────────────────────────────────────────
export function MeasureToolHUD({ enabled, measureCount, onClear }) {
  if (!enabled) return null;
  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-surface-900/90 backdrop-blur-sm rounded-xl px-4 py-2 border border-surface-700/50 z-20">
      <div className="flex items-center gap-4 text-[11px]">
        <span className="text-emerald-400 font-medium">📏 Measure Tool Active</span>
        <span className="text-surface-400">Click two points to measure distance</span>
        {measureCount > 0 && (
          <button onClick={onClear} className="text-red-400 hover:text-red-300 text-[10px]">
            Clear ({measureCount})
          </button>
        )}
      </div>
    </div>
  );
}
