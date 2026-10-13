// ═══════════════════════════════════════════════════════════════
// Transform Gizmo — Three.js TransformControls wrapper
// Translate/Rotate/Scale selected BIM elements in 3D
// Syncs back to Redux on drag-end
// ═══════════════════════════════════════════════════════════════
import { useRef, useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { TransformControls as DreiTransformControls } from '@react-three/drei';

/**
 * TransformGizmo - Renders Three.js TransformControls on the target mesh
 * @param {Object} props
 * @param {THREE.Object3D} props.object - Target mesh ref
 * @param {string} props.mode - 'translate' | 'rotate' | 'scale'
 * @param {boolean} props.enabled - Whether the gizmo is active
 * @param {Function} props.onDragStart - Called when drag starts
 * @param {Function} props.onDragEnd - Called when drag ends with { position, rotation, scale }
 * @param {Function} props.onOrbitDisable - Callback to disable orbit controls during drag
 */
export default function TransformGizmo({
  object,
  mode = 'translate',
  enabled = true,
  onDragStart,
  onDragEnd,
  onOrbitDisable,
  showX = true,
  showY = true,
  showZ = true,
  space = 'world',
  size = 0.8,
  translationSnap = null,
  rotationSnap = null,
  scaleSnap = null,
}) {
  const controlsRef = useRef();

  // Disable orbit when dragging
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const handleDragStart = () => {
      onOrbitDisable?.(true);
      onDragStart?.();
    };

    const handleDragEnd = () => {
      onOrbitDisable?.(false);
      if (object) {
        onDragEnd?.({
          position: {
            x: object.position.x,
            y: object.position.y,
            z: object.position.z,
          },
          rotation: {
            x: object.rotation.x,
            y: object.rotation.y,
            z: object.rotation.z,
          },
          scale: {
            x: object.scale.x,
            y: object.scale.y,
            z: object.scale.z,
          },
        });
      }
    };

    controls.addEventListener('dragging-changed', (event) => {
      if (event.value) handleDragStart();
      else handleDragEnd();
    });

    return () => {
      controls.removeEventListener('dragging-changed', handleDragStart);
    };
  }, [object, onDragStart, onDragEnd, onOrbitDisable]);

  if (!object || !enabled) return null;

  return (
    <DreiTransformControls
      ref={controlsRef}
      object={object}
      mode={mode}
      showX={showX}
      showY={showY}
      showZ={showZ}
      space={space}
      size={size}
      translationSnap={translationSnap}
      rotationSnap={rotationSnap}
      scaleSnap={scaleSnap}
    />
  );
}

// ─── Mode Toolbar (overlays the 3D viewport) ───────────────────
export function TransformToolbar({ mode, onModeChange }) {
  const modes = [
    { id: 'translate', label: 'Move', shortcut: 'T', icon: '⇕' },
    { id: 'rotate', label: 'Rotate', shortcut: 'R', icon: '↻' },
    { id: 'scale', label: 'Scale', shortcut: 'E', icon: '⇔' },
  ];

  return (
    <div className="absolute top-14 left-3 z-20 flex flex-col gap-0.5 bg-surface-900/90 backdrop-blur-sm rounded-xl p-1 border border-surface-700/50">
      {modes.map(m => (
        <button
          key={m.id}
          onClick={() => onModeChange(m.id)}
          className={`px-2 py-1.5 rounded-lg text-[10px] font-medium flex items-center gap-1.5 transition-all ${
            mode === m.id
              ? 'bg-primary-600/30 text-primary-400 ring-1 ring-primary-500/50'
              : 'text-surface-400 hover:text-white hover:bg-surface-800'
          }`}
          title={`${m.label} (${m.shortcut})`}
        >
          <span className="text-sm">{m.icon}</span>
          <span>{m.label}</span>
        </button>
      ))}
    </div>
  );
}
