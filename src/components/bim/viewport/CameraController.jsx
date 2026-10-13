// ═══════════════════════════════════════════════════════════════
// CameraController — Smooth camera transitions + presets
// Handles animated camera movement between view presets
// ═══════════════════════════════════════════════════════════════
import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useBimStore from '../../../stores/bimStore';
import { MM_TO_M } from '../../../stores/bimTypes';

const LERP_SPEED = 3.0;
const ARRIVAL_THRESHOLD = 0.01;

export default function CameraController() {
  const { camera } = useThree();
  const building = useBimStore(s => s.building);
  const site = useBimStore(s => s.site);
  const cameraPresetTarget = useBimStore(s => s.cameraPresetTarget);
  const setCameraPresetTarget = useBimStore(s => s.setCameraPresetTarget);

  const targetPos = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const isAnimating = useRef(false);
  const controlsRef = useRef(null);

  // Calculate building center
  const S = MM_TO_M;
  const cx = building ? (building.position.x + building.width / 2) * S : site.width * S / 2;
  const cy = 0;
  const cz = building ? (building.position.y + building.length / 2) * S : site.length * S / 2;

  // When a preset target is set, start animation
  useEffect(() => {
    if (!cameraPresetTarget) return;

    const { position, target } = cameraPresetTarget;
    targetPos.current.set(
      position[0] + cx, position[1], position[2] + cz
    );
    targetLookAt.current.set(
      (target?.[0] || 0) + cx, target?.[1] || 0, (target?.[2] || 0) + cz
    );
    isAnimating.current = true;
  }, [cameraPresetTarget, cx, cz]);

  // Smooth animation
  useFrame((state, delta) => {
    if (!isAnimating.current) return;

    const t = 1 - Math.pow(1 - LERP_SPEED * delta, 2);

    camera.position.lerp(targetPos.current, Math.min(t, 1));

    // Check if arrived
    const dist = camera.position.distanceTo(targetPos.current);
    if (dist < ARRIVAL_THRESHOLD) {
      camera.position.copy(targetPos.current);
      isAnimating.current = false;
      setCameraPresetTarget(null);
    }

    // Update orbit controls target if available
    const controls = state.controls;
    if (controls && controls.target) {
      controls.target.lerp(targetLookAt.current, Math.min(t, 1));
      controls.update();
    }
  });

  return null;
}

// ─── Camera Preset Definitions ────────────────────────────────
export const CAMERA_PRESETS_3D = {
  isometric: { position: [12, 12, 12], target: [0, 0, 0], label: 'Isometric' },
  top: { position: [0, 25, 0.01], target: [0, 0, 0], label: 'Top' },
  front: { position: [0, 5, 18], target: [0, 2, 0], label: 'Front' },
  back: { position: [0, 5, -18], target: [0, 2, 0], label: 'Back' },
  left: { position: [-18, 5, 0], target: [0, 2, 0], label: 'Left' },
  right: { position: [18, 5, 0], target: [0, 2, 0], label: 'Right' },
  perspective: { position: [20, 14, 25], target: [0, 0, 0], label: 'Perspective' },
};

export const DOLLHOUSE_PRESETS = {
  isometric: { position: [14, 16, 14], target: [0, 0, 0], label: 'Isometric' },
  top: { position: [0, 30, 0.01], target: [0, 0, 0], label: 'Top' },
  frontCutaway: { position: [0, 10, -16], target: [0, 0, 0], label: 'Front Cutaway', cutaway: 'front' },
  rightCutaway: { position: [16, 10, 0], target: [0, 0, 0], label: 'Right Cutaway', cutaway: 'right' },
  leftCutaway: { position: [-16, 10, 0], target: [0, 0, 0], label: 'Left Cutaway', cutaway: 'left' },
};
