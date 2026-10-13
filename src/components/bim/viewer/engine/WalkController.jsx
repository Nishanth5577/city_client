// ═══════════════════════════════════════════════════════════════
// Walk Controller — First-person building exploration
// WASD movement, mouse look, collision detection
// ═══════════════════════════════════════════════════════════════
import { useRef, useEffect, useCallback, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const DEFAULT_EYE_HEIGHT = 1.65; // meters (1650mm → 1.65 scene units with S=0.001)
const MOVE_SPEED = 3.0; // scene units per second
const LOOK_SPEED = 0.002;
const GRAVITY = 9.81;
const COLLISION_RADIUS = 0.3; // scene units

export default function WalkController({
  enabled = false,
  eyeHeight = DEFAULT_EYE_HEIGHT,
  moveSpeed = MOVE_SPEED,
  onExit,
  walls = [],
}) {
  const { camera, gl } = useThree();
  const keysRef = useRef({});
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const velocityRef = useRef(new THREE.Vector3());
  const positionRef = useRef(new THREE.Vector3(5, eyeHeight, 5));
  const isLockedRef = useRef(false);
  const [isActive, setIsActive] = useState(false);

  // Store original camera state to restore on exit
  const originalCameraRef = useRef({
    position: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
  });

  // Build collision geometry from walls
  const wallColliders = useRef([]);
  useEffect(() => {
    if (!walls || walls.length === 0) return;
    const S = 0.001;
    const colliders = [];
    walls.forEach(wall => {
      if (!wall?.start_point || !wall?.end_point) return;
      const sx = wall.start_point.x * S;
      const sz = wall.start_point.y * S;
      const ex = wall.end_point.x * S;
      const ez = wall.end_point.y * S;
      const thickness = (wall.thickness || 230) * S;
      const height = (wall.height || 3000) * S;
      colliders.push({ sx, sz, ex, ez, thickness, height });
    });
    wallColliders.current = colliders;
  }, [walls]);

  // Activate walk mode
  useEffect(() => {
    if (!enabled) {
      if (isActive) {
        // Restore original camera
        setIsActive(false);
        document.exitPointerLock?.();
      }
      return;
    }

    // Save original camera state
    originalCameraRef.current.position.copy(camera.position);
    originalCameraRef.current.quaternion.copy(camera.quaternion);

    // Set initial position
    positionRef.current.set(
      camera.position.x,
      eyeHeight,
      camera.position.z
    );

    // Calculate initial yaw from camera direction
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    yawRef.current = Math.atan2(dir.x, dir.z);
    pitchRef.current = Math.asin(Math.max(-1, Math.min(1, dir.y)));

    setIsActive(true);
  }, [enabled, camera, eyeHeight]);

  // Keyboard events
  useEffect(() => {
    if (!isActive) return;

    const onKeyDown = (e) => {
      keysRef.current[e.code] = true;
      if (e.code === 'Escape') {
        document.exitPointerLock?.();
        onExit?.();
      }
    };
    const onKeyUp = (e) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [isActive, onExit]);

  // Mouse look (pointer lock)
  useEffect(() => {
    if (!isActive) return;
    
    const canvas = gl.domElement;
    
    const onMouseMove = (e) => {
      if (!document.pointerLockElement) return;
      yawRef.current -= e.movementX * LOOK_SPEED;
      pitchRef.current -= e.movementY * LOOK_SPEED;
      pitchRef.current = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, pitchRef.current));
    };

    const onClick = () => {
      if (!document.pointerLockElement) {
        canvas.requestPointerLock?.();
      }
    };

    const onPointerLockChange = () => {
      isLockedRef.current = !!document.pointerLockElement;
    };

    canvas.addEventListener('click', onClick);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onPointerLockChange);

    return () => {
      canvas.removeEventListener('click', onClick);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      document.exitPointerLock?.();
    };
  }, [isActive, gl]);

  // Collision check against walls
  const checkCollision = useCallback((newPos) => {
    for (const wall of wallColliders.current) {
      // Wall segment as line, check distance from player to line
      const dx = wall.ex - wall.sx;
      const dz = wall.ez - wall.sz;
      const len = Math.sqrt(dx * dx + dz * dz);
      if (len < 0.01) continue;

      // Project player position onto wall line
      const t = Math.max(0, Math.min(1, 
        ((newPos.x - wall.sx) * dx + (newPos.z - wall.sz) * dz) / (len * len)
      ));
      const closestX = wall.sx + t * dx;
      const closestZ = wall.sz + t * dz;
      const distToWall = Math.sqrt(
        (newPos.x - closestX) ** 2 + (newPos.z - closestZ) ** 2
      );

      const wallHalfThickness = wall.thickness / 2 + COLLISION_RADIUS;
      if (distToWall < wallHalfThickness && newPos.y < wall.height) {
        // Push player away from wall
        const nx = (newPos.x - closestX) / distToWall;
        const nz = (newPos.z - closestZ) / distToWall;
        newPos.x = closestX + nx * wallHalfThickness;
        newPos.z = closestZ + nz * wallHalfThickness;
      }
    }
    return newPos;
  }, []);

  // Frame update — movement and camera
  useFrame((_, delta) => {
    if (!isActive || !enabled) return;

    const keys = keysRef.current;
    const speed = moveSpeed * delta;

    // Movement direction
    const forward = new THREE.Vector3(
      Math.sin(yawRef.current),
      0,
      Math.cos(yawRef.current)
    );
    const right = new THREE.Vector3(
      Math.sin(yawRef.current + Math.PI / 2),
      0,
      Math.cos(yawRef.current + Math.PI / 2)
    );

    const moveDir = new THREE.Vector3();
    if (keys['KeyW'] || keys['ArrowUp']) moveDir.add(forward);
    if (keys['KeyS'] || keys['ArrowDown']) moveDir.sub(forward);
    if (keys['KeyA'] || keys['ArrowLeft']) moveDir.sub(right);
    if (keys['KeyD'] || keys['ArrowRight']) moveDir.add(right);
    
    if (moveDir.lengthSq() > 0) {
      moveDir.normalize().multiplyScalar(speed);
      // Sprint with shift
      if (keys['ShiftLeft'] || keys['ShiftRight']) {
        moveDir.multiplyScalar(2.0);
      }
    }

    // Apply movement
    const pos = positionRef.current;
    pos.x += moveDir.x;
    pos.z += moveDir.z;
    pos.y = eyeHeight; // Keep at eye height (no vertical movement for now)

    // Collision detection
    checkCollision(pos);

    // Update camera
    camera.position.copy(pos);

    // Apply look direction
    const euler = new THREE.Euler(pitchRef.current, yawRef.current, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);
  });

  if (!isActive) return null;

  return null; // This is a controller-only component, no rendering
}

// ─── Walk Mode HUD (overlay) ───────────────────────────────────
export function WalkModeHUD({ isActive, onExit }) {
  if (!isActive) return null;
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-6 h-6 relative">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/50" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/50" />
        </div>
      </div>
      
      {/* Controls info */}
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-xl px-6 py-3 pointer-events-auto">
        <div className="flex items-center gap-6 text-white/80 text-xs">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">W</kbd>
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">A</kbd>
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">S</kbd>
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">D</kbd>
            Move
          </span>
          <span className="flex items-center gap-1">
            <span className="text-[10px]">🖱️</span> Look
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">Shift</kbd>
            Sprint
          </span>
          <button
            onClick={onExit}
            className="px-3 py-1 bg-red-500/80 rounded-lg text-white text-xs hover:bg-red-500 transition-colors pointer-events-auto"
          >
            ESC — Exit Walk Mode
          </button>
        </div>
      </div>
    </div>
  );
}
