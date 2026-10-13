// ═══════════════════════════════════════════════════════════════
// Section Plane — Interactive building section cut
// Clipping plane that reveals interior structure
// Adjustable height and position
// ═══════════════════════════════════════════════════════════════
import { useRef, useEffect, useMemo, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export default function SectionPlane({
  enabled = false,
  direction = 'horizontal', // horizontal (Y cut), vertical-x, vertical-z
  position = 1.5, // cut position in scene units
  showHelper = true,
  onPositionChange,
}) {
  const { scene, gl } = useThree();
  const planeRef = useRef(null);
  const helperRef = useRef(null);

  // Create clipping plane
  const clippingPlane = useMemo(() => {
    switch (direction) {
      case 'horizontal':
        return new THREE.Plane(new THREE.Vector3(0, -1, 0), position);
      case 'vertical-x':
        return new THREE.Plane(new THREE.Vector3(-1, 0, 0), position);
      case 'vertical-z':
        return new THREE.Plane(new THREE.Vector3(0, 0, -1), position);
      default:
        return new THREE.Plane(new THREE.Vector3(0, -1, 0), position);
    }
  }, [direction, position]);

  // Enable/disable clipping
  useEffect(() => {
    if (enabled) {
      gl.clippingPlanes = [clippingPlane];
      gl.localClippingEnabled = true;
    } else {
      gl.clippingPlanes = [];
      gl.localClippingEnabled = false;
    }

    return () => {
      gl.clippingPlanes = [];
      gl.localClippingEnabled = false;
    };
  }, [enabled, clippingPlane, gl]);

  // Update plane position when prop changes
  useEffect(() => {
    clippingPlane.constant = position;
  }, [position, clippingPlane]);

  if (!enabled) return null;

  // Helper visualization
  const helperPosition = useMemo(() => {
    switch (direction) {
      case 'horizontal': return [5, position, 5];
      case 'vertical-x': return [position, 2, 5];
      case 'vertical-z': return [5, 2, position];
      default: return [5, position, 5];
    }
  }, [direction, position]);

  const helperRotation = useMemo(() => {
    switch (direction) {
      case 'horizontal': return [0, 0, 0];
      case 'vertical-x': return [0, 0, Math.PI / 2];
      case 'vertical-z': return [Math.PI / 2, 0, 0];
      default: return [0, 0, 0];
    }
  }, [direction]);

  return (
    <group>
      {showHelper && (
        <>
          {/* Section plane visualization */}
          <mesh
            ref={helperRef}
            position={helperPosition}
            rotation={helperRotation}
          >
            <planeGeometry args={[20, 20]} />
            <meshBasicMaterial
              color="#FF4444"
              transparent
              opacity={0.08}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* Section plane border */}
          <mesh
            position={helperPosition}
            rotation={helperRotation}
          >
            <ringGeometry args={[9.9, 10, 4]} />
            <meshBasicMaterial
              color="#FF4444"
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Section label */}
          <Html position={helperPosition} center>
            <div className="bg-red-900/80 backdrop-blur-sm rounded px-2 py-0.5 border border-red-500/30 pointer-events-none">
              <span className="text-[9px] text-red-300 font-mono">
                Section {direction === 'horizontal' ? `Y=${(position * 1000).toFixed(0)}mm` :
                  direction === 'vertical-x' ? `X=${(position * 1000).toFixed(0)}mm` :
                  `Z=${(position * 1000).toFixed(0)}mm`}
              </span>
            </div>
          </Html>
        </>
      )}
    </group>
  );
}

// ─── Section Plane Controls (HUD overlay) ──────────────────────
export function SectionPlaneControls({
  enabled,
  direction,
  position,
  onToggle,
  onDirectionChange,
  onPositionChange,
}) {
  if (!enabled) return null;

  return (
    <div className="absolute bottom-16 left-3 bg-surface-900/90 backdrop-blur-sm rounded-xl p-3 border border-surface-700/50 z-20 min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-red-400">✂️ Section Cut</span>
        <button
          onClick={onToggle}
          className="text-[9px] text-surface-400 hover:text-white px-1.5 py-0.5 bg-surface-800 rounded"
        >
          Disable
        </button>
      </div>

      {/* Direction */}
      <div className="flex gap-1 mb-2">
        {[
          { id: 'horizontal', label: 'Horizontal' },
          { id: 'vertical-x', label: 'X Cut' },
          { id: 'vertical-z', label: 'Z Cut' },
        ].map(d => (
          <button
            key={d.id}
            onClick={() => onDirectionChange?.(d.id)}
            className={`flex-1 py-1 rounded text-[9px] font-medium transition-colors ${
              direction === d.id
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'text-surface-400 bg-surface-800 hover:text-surface-200'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Position slider */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-surface-500">Cut Height</span>
        <input
          type="range"
          min="0"
          max="10"
          step="0.1"
          value={position}
          onChange={e => onPositionChange?.(parseFloat(e.target.value))}
          className="flex-1 h-1 bg-surface-700 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
            [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-red-400
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
        />
        <span className="text-[9px] text-surface-300 font-mono w-12 text-right">
          {(position * 1000).toFixed(0)}mm
        </span>
      </div>
    </div>
  );
}
