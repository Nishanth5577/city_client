// ═══════════════════════════════════════════════════════════════
// Building3DView — Professional BIM 3D Viewport
// Integrates all procedural engines for architectural visualization
// ═══════════════════════════════════════════════════════════════
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, GizmoHelper, GizmoViewport, Html } from '@react-three/drei';
import { useSelector, useDispatch } from 'react-redux';
import { useMemo, Suspense, useState, useCallback, useEffect, memo } from 'react';
import * as THREE from 'three';
import { selectElement, clearSelection, setRenderMode } from '../../../redux/slices/bimSlice';
import { RENDER_MODES, CAMERA_PRESETS } from '../../../utils/bimConstants';

// Engine imports
import ProceduralWall from './engine/ProceduralWall';
import ProceduralFurniture from './engine/ProceduralFurniture';
import ProceduralRoof from './engine/ProceduralRoof';
import ProceduralTerrain from './engine/ProceduralTerrain';
import RoomGenerator from './engine/RoomGenerator';
import LightingSystem from './engine/LightingSystem';
import PostProcessingEffects from './engine/PostProcessing';
import ArchitecturalDetails from './engine/ArchitecturalDetails';
import { preloadTextures } from './engine/ProceduralTextures';

// MEP views
import ElectricalView3D from './elements/ElectricalView3D';
import PlumbingView3D from './elements/PlumbingView3D';
import HVACView3D from './elements/HVACView3D';
import SolarView3D from './elements/SolarView3D';

const S = 0.001;

// ─── Column3D (procedural) ─────────────────────────────────────
const Column3D = memo(function Column3D({ column, floorY = 0, renderMode, selected, onSelect }) {
  if (!column?.position) return null;
  const x = column.position.x * S;
  const z = column.position.y * S;
  const h = (column.height || 3000) * S;

  const isCircular = column.shape === 'circular';
  const emissive = selected ? '#FF6B35' : '#000000';
  const emissiveI = selected ? 0.2 : 0;

  const matProps = useMemo(() => {
    if (renderMode === 'wireframe') return { color: '#909090', wireframe: true };
    if (renderMode === 'xray') return { color: '#909090', transparent: true, opacity: 0.12, side: THREE.DoubleSide };
    return { color: column.color || '#909090', roughness: 0.6, metalness: 0.1 };
  }, [renderMode, column.color]);

  if (isCircular) {
    const r = ((column.diameter || 300) / 2) * S;
    return (
      <mesh position={[x, floorY + h / 2, z]} castShadow receiveShadow
        onClick={(e) => { e.stopPropagation(); onSelect?.(column._id || column.canvas_id, 'column'); }}>
        <cylinderGeometry args={[r, r, h, 24]} />
        <meshStandardMaterial {...matProps} emissive={emissive} emissiveIntensity={emissiveI} />
      </mesh>
    );
  }

  const w = (column.width || 300) * S;
  const d = (column.depth || 300) * S;
  return (
    <mesh position={[x, floorY + h / 2, z]} castShadow receiveShadow
      onClick={(e) => { e.stopPropagation(); onSelect?.(column._id || column.canvas_id, 'column'); }}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial {...matProps} emissive={emissive} emissiveIntensity={emissiveI} />
    </mesh>
  );
});

// ─── Beam3D ────────────────────────────────────────────────────
const Beam3D = memo(function Beam3D({ beam, floorY = 0, renderMode }) {
  if (!beam?.start_point || !beam?.end_point) return null;
  const dx = beam.end_point.x - beam.start_point.x;
  const dy = beam.end_point.y - beam.start_point.y;
  const length = Math.sqrt(dx * dx + dy * dy) * S;
  if (length < 0.001) return null;
  const beamH = (beam.depth || 400) * S;
  const beamW = (beam.width || 230) * S;
  const wallH = (beam.height || 3000) * S;
  const angle = Math.atan2(dy, dx);
  const cx = ((beam.start_point.x + beam.end_point.x) / 2) * S;
  const cy = ((beam.start_point.y + beam.end_point.y) / 2) * S;

  const matProps = useMemo(() => {
    if (renderMode === 'wireframe') return { color: '#808080', wireframe: true };
    if (renderMode === 'xray') return { color: '#808080', transparent: true, opacity: 0.12 };
    return { color: beam.color || '#808080', roughness: 0.6, metalness: 0.2 };
  }, [renderMode, beam.color]);

  return (
    <mesh position={[cx, floorY + wallH - beamH / 2, cy]} rotation={[0, -angle, 0]} castShadow receiveShadow>
      <boxGeometry args={[length, beamH, beamW]} />
      <meshStandardMaterial {...matProps} />
    </mesh>
  );
});

// ─── Door3D (detailed) ─────────────────────────────────────────
const Door3D = memo(function Door3D({ door, floorY = 0, renderMode, selected, onSelect }) {
  if (!door?.position) return null;
  const x = door.position.x * S;
  const z = door.position.y * S;
  const w = (door.width || 900) * S;
  const h = (door.height || 2100) * S;
  const t = 0.04;
  const rotation = -(door.rotation || 0) * Math.PI / 180;
  const emissive = selected ? '#FF6B35' : '#000000';
  const emI = selected ? 0.15 : 0;

  if (renderMode === 'wireframe' || renderMode === 'xray') {
    return (
      <mesh position={[x, floorY + h / 2, z]} rotation={[0, rotation, 0]}>
        <boxGeometry args={[w, h, t]} />
        <meshStandardMaterial color="#8B4513" wireframe={renderMode === 'wireframe'} transparent={renderMode === 'xray'} opacity={0.1} />
      </mesh>
    );
  }

  return (
    <group position={[x, floorY, z]} rotation={[0, rotation, 0]}
      onClick={(e) => { e.stopPropagation(); onSelect?.(door._id || door.canvas_id, 'door'); }}>
      {/* Frame */}
      <mesh position={[w / 2, h / 2, 0]} castShadow>
        <boxGeometry args={[w + 0.06, h + 0.02, t + 0.04]} />
        <meshStandardMaterial color="#5C4033" roughness={0.7} metalness={0.1} emissive={emissive} emissiveIntensity={emI} />
      </mesh>
      {/* Panel */}
      <mesh position={[w / 2, h / 2 - 0.01, 0.005]} castShadow>
        <boxGeometry args={[w - 0.04, h - 0.06, t - 0.01]} />
        <meshStandardMaterial color={door.color || '#8B4513'} roughness={0.5} emissive={emissive} emissiveIntensity={emI} />
      </mesh>
      {/* Panel detail — two panels */}
      <mesh position={[w / 2, h * 0.7, t / 2 + 0.002]} castShadow>
        <boxGeometry args={[w - 0.1, h * 0.35, 0.005]} />
        <meshStandardMaterial color="#704020" roughness={0.55} />
      </mesh>
      <mesh position={[w / 2, h * 0.25, t / 2 + 0.002]} castShadow>
        <boxGeometry args={[w - 0.1, h * 0.3, 0.005]} />
        <meshStandardMaterial color="#704020" roughness={0.55} />
      </mesh>
      {/* Handle */}
      <mesh position={[w - 0.08, h * 0.45, t / 2 + 0.015]}>
        <cylinderGeometry args={[0.008, 0.008, 0.04, 8]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Handle plate */}
      <mesh position={[w - 0.08, h * 0.45, t / 2 + 0.008]}>
        <boxGeometry args={[0.03, 0.12, 0.005]} />
        <meshStandardMaterial color="#B0B0B0" metalness={0.7} roughness={0.25} />
      </mesh>
    </group>
  );
});

// ─── Window3D (detailed with mullions) ─────────────────────────
const Window3D = memo(function Window3D({ win, floorY = 0, renderMode, selected, onSelect }) {
  if (!win?.position) return null;
  const x = win.position.x * S;
  const z = win.position.y * S;
  const w = (win.width || 1200) * S;
  const h = (win.height || 1200) * S;
  const sill = (win.sill_height || 900) * S;
  const rotation = -(win.rotation || 0) * Math.PI / 180;
  const emissive = selected ? '#FF6B35' : '#000000';
  const emI = selected ? 0.15 : 0;

  if (renderMode === 'wireframe' || renderMode === 'xray') {
    return (
      <mesh position={[x, floorY + sill + h / 2, z]} rotation={[0, rotation, 0]}>
        <boxGeometry args={[w, h, 0.06]} />
        <meshStandardMaterial color="#87CEEB" wireframe={renderMode === 'wireframe'} transparent opacity={0.15} />
      </mesh>
    );
  }

  return (
    <group position={[x, floorY + sill, z]} rotation={[0, rotation, 0]}
      onClick={(e) => { e.stopPropagation(); onSelect?.(win._id || win.canvas_id, 'window'); }}>
      {/* Outer frame */}
      <mesh position={[w / 2, h / 2, 0]} castShadow>
        <boxGeometry args={[w + 0.04, h + 0.04, 0.06]} />
        <meshStandardMaterial color={win.frame_color || '#E0E0E0'} metalness={0.5} roughness={0.3} emissive={emissive} emissiveIntensity={emI} />
      </mesh>
      {/* Glass pane — realistic physical material */}
      <mesh position={[w / 2, h / 2, 0]}>
        <boxGeometry args={[w - 0.03, h - 0.03, 0.008]} />
        <meshPhysicalMaterial
          color="#E8F4F8"
          transmission={0.92}
          ior={1.52}
          thickness={0.005}
          roughness={0.02}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.1}
          transparent
          opacity={0.45}
          envMapIntensity={1.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Vertical mullion — aluminium */}
      <mesh position={[w / 2, h / 2, 0.018]}>
        <boxGeometry args={[0.015, h - 0.02, 0.02]} />
        <meshStandardMaterial color="#D0D0D0" metalness={0.7} roughness={0.15} />
      </mesh>
      {/* Horizontal mullion — aluminium */}
      <mesh position={[w / 2, h / 2, 0.018]}>
        <boxGeometry args={[w - 0.02, 0.015, 0.02]} />
        <meshStandardMaterial color="#D0D0D0" metalness={0.7} roughness={0.15} />
      </mesh>
      {/* Window sill — granite with drip edge */}
      <mesh position={[w / 2, -0.02, 0.05]} castShadow>
        <boxGeometry args={[w + 0.12, 0.035, 0.12]} />
        <meshStandardMaterial color="#A09080" roughness={0.3} metalness={0.05} />
      </mesh>
      {/* Drip edge under sill */}
      <mesh position={[w / 2, -0.045, 0.11]}>
        <boxGeometry args={[w + 0.10, 0.012, 0.015]} />
        <meshStandardMaterial color="#908070" roughness={0.4} />
      </mesh>
      {/* Lintel above window */}
      <mesh position={[w / 2, h + 0.035, 0.02]} castShadow>
        <boxGeometry args={[w + 0.1, 0.06, 0.08]} />
        <meshStandardMaterial color="#C8C0B4" roughness={0.75} />
      </mesh>
      {/* Window reveal — depth recess (left) */}
      <mesh position={[-0.015, h / 2, 0.015]}>
        <boxGeometry args={[0.025, h + 0.02, 0.06]} />
        <meshStandardMaterial color="#E8E4DC" roughness={0.8} />
      </mesh>
      {/* Window reveal — depth recess (right) */}
      <mesh position={[w + 0.015, h / 2, 0.015]}>
        <boxGeometry args={[0.025, h + 0.02, 0.06]} />
        <meshStandardMaterial color="#E8E4DC" roughness={0.8} />
      </mesh>
    </group>
  );
});

// ─── Stair3D ───────────────────────────────────────────────────
const Stair3D = memo(function Stair3D({ stair, floorY = 0, renderMode }) {
  if (!stair?.position) return null;
  const x = stair.position.x * S;
  const z = stair.position.y * S;
  const w = (stair.width || 1200) * S;
  const numSteps = Math.min(stair.num_risers || 18, 20);
  const riserH = (stair.riser_height || 167) * S;
  const treadD = (stair.tread_depth || 270) * S;

  const matProps = useMemo(() => {
    if (renderMode === 'wireframe') return { color: '#C0C0C0', wireframe: true };
    if (renderMode === 'xray') return { color: '#C0C0C0', transparent: true, opacity: 0.12 };
    return { color: '#D0D0D0', roughness: 0.7, metalness: 0.1 };
  }, [renderMode]);

  const steps = [];
  for (let i = 0; i < numSteps; i++) {
    steps.push(
      <mesh key={i} position={[0, floorY + riserH * (i + 0.5), treadD * i]} castShadow receiveShadow>
        <boxGeometry args={[w, riserH, treadD]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
    );
  }

  return (
    <group position={[x, 0, z]} rotation={[0, -(stair.rotation || 0) * Math.PI / 180, 0]}>
      {steps}
      {/* Railing (left) */}
      {renderMode !== 'wireframe' && renderMode !== 'xray' && (
        <>
          <mesh position={[-w / 2 - 0.02, floorY + numSteps * riserH / 2, (numSteps - 1) * treadD / 2]}>
            <boxGeometry args={[0.04, numSteps * riserH, numSteps * treadD]} />
            <meshStandardMaterial color="#3A3A3A" metalness={0.5} roughness={0.3} transparent opacity={0.4} />
          </mesh>
          <mesh position={[w / 2 + 0.02, floorY + numSteps * riserH / 2, (numSteps - 1) * treadD / 2]}>
            <boxGeometry args={[0.04, numSteps * riserH, numSteps * treadD]} />
            <meshStandardMaterial color="#3A3A3A" metalness={0.5} roughness={0.3} transparent opacity={0.4} />
          </mesh>
          {/* Handrail */}
          <mesh position={[-w / 2 - 0.02, floorY + numSteps * riserH + 0.04, (numSteps - 1) * treadD / 2]}>
            <boxGeometry args={[0.05, 0.05, numSteps * treadD + 0.1]} />
            <meshStandardMaterial color="#5A4030" roughness={0.5} />
          </mesh>
          <mesh position={[w / 2 + 0.02, floorY + numSteps * riserH + 0.04, (numSteps - 1) * treadD / 2]}>
            <boxGeometry args={[0.05, 0.05, numSteps * treadD + 0.1]} />
            <meshStandardMaterial color="#5A4030" roughness={0.5} />
          </mesh>
        </>
      )}
    </group>
  );
});

// ─── Camera Controller ─────────────────────────────────────────
function CameraController({ preset }) {
  const { camera } = useThree();
  useEffect(() => {
    if (preset) {
      const p = CAMERA_PRESETS[preset];
      if (p) {
        camera.position.set(...p.position);
        camera.lookAt(...p.target);
      }
    }
  }, [preset, camera]);
  return null;
}

// ─── Texture Preloader ─────────────────────────────────────────
function TexturePreloader() {
  useEffect(() => {
    preloadTextures(['brick', 'concrete', 'plaster', 'wood', 'tiles', 'glass', 'grass', 'asphalt']);
  }, []);
  return null;
}

// ─── Loading Indicator ─────────────────────────────────────────
function LoadingFallback() {
  return (
    <Html center>
      <div className="flex items-center gap-2 bg-surface-900/90 px-4 py-2 rounded-xl border border-surface-700">
        <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-surface-300">Loading 3D Scene...</span>
      </div>
    </Html>
  );
}

// ─── Scene Container ───────────────────────────────────────────
function BuildingScene({ renderMode, selectedIds, onSelect }) {
  const { elements, layers, electricalElements, plumbingElements, hvacElements, solarElements } = useSelector(s => s.bim);
  const floorY = 0;
  const elecLayer = layers.find(l => l.id === 'electrical');
  const plumbLayer = layers.find(l => l.id === 'plumbing');
  const hvacLayer = layers.find(l => l.id === 'hvac');
  const solarLayer = layers.find(l => l.id === 'solar');

  const wallHeight = elements.walls?.[0]?.height || 3000;

  // Compute interior light positions from rooms
  const interiorLights = useMemo(() => {
    if (!elements.walls || elements.walls.length < 3) return [];
    const lights = [];
    // Place a light at the centroid of every 3-wall group as an approximation
    const walls = elements.walls;
    const allPts = walls.filter(w => w?.start_point).map(w => w.start_point);
    if (allPts.length > 0) {
      const cx = allPts.reduce((s, p) => s + p.x, 0) / allPts.length * S;
      const cz = allPts.reduce((s, p) => s + p.y, 0) / allPts.length * S;
      lights.push({ position: [cx, wallHeight * S - 0.1, cz] });
    }
    return lights;
  }, [elements.walls, wallHeight]);

  return (
    <group>
      <TexturePreloader />

      {/* Terrain (ground, compound wall, driveway, garden) */}
      <ProceduralTerrain
        walls={elements.walls}
        renderMode={renderMode}
      />

      {/* Auto-detected rooms → floors + ceilings + labels */}
      <RoomGenerator
        walls={elements.walls}
        renderMode={renderMode}
      />

      {/* Roof */}
      {elements.walls?.length >= 3 && (
        <ProceduralRoof
          walls={elements.walls}
          roofType="flat"
          wallHeight={wallHeight}
          renderMode={renderMode}
        />
      )}

      {/* Procedural Walls (multi-layer with openings) */}
      {elements.walls?.map((wall, i) => (
        <ProceduralWall
          key={wall._id || wall.canvas_id || i}
          wall={wall}
          doors={elements.doors}
          windows={elements.windows}
          renderMode={renderMode}
          selected={selectedIds.includes(wall._id || wall.canvas_id)}
          onSelect={onSelect}
        />
      ))}

      {/* Columns */}
      {elements.columns?.map((col, i) => (
        <Column3D
          key={col._id || col.canvas_id || i}
          column={col}
          renderMode={renderMode}
          selected={selectedIds.includes(col._id || col.canvas_id)}
          onSelect={onSelect}
        />
      ))}

      {/* Beams */}
      {elements.beams?.map((beam, i) => (
        <Beam3D
          key={beam._id || beam.canvas_id || i}
          beam={beam}
          floorY={floorY}
          renderMode={renderMode}
        />
      ))}

      {/* Doors (detailed) */}
      {elements.doors?.map((door, i) => (
        <Door3D
          key={door._id || door.canvas_id || i}
          door={door}
          floorY={floorY}
          renderMode={renderMode}
          selected={selectedIds.includes(door._id || door.canvas_id)}
          onSelect={onSelect}
        />
      ))}

      {/* Windows (detailed with mullions) */}
      {elements.windows?.map((win, i) => (
        <Window3D
          key={win._id || win.canvas_id || i}
          win={win}
          floorY={floorY}
          renderMode={renderMode}
          selected={selectedIds.includes(win._id || win.canvas_id)}
          onSelect={onSelect}
        />
      ))}

      {/* Procedural Furniture */}
      {elements.furniture?.map((fur, i) => (
        <ProceduralFurniture
          key={fur._id || fur.canvas_id || i}
          fur={fur}
          floorY={floorY}
          renderMode={renderMode}
          selected={selectedIds.includes(fur._id || fur.canvas_id)}
          onSelect={onSelect}
        />
      ))}

      {/* Stairs (with railings) */}
      {elements.stairs?.map((stair, i) => (
        <Stair3D
          key={stair._id || stair.canvas_id || i}
          stair={stair}
          floorY={floorY}
          renderMode={renderMode}
        />
      ))}

      {/* Architectural Details (cornices, sunshades, cladding, canopy, drainage, lights) */}
      <ArchitecturalDetails
        walls={elements.walls}
        windows={elements.windows}
        wallHeight={wallHeight}
        renderMode={renderMode}
      />

      {/* MEP 3D Views */}
      {elecLayer?.visible && electricalElements?.length > 0 && <ElectricalView3D elements={electricalElements} floorY={floorY} />}
      {plumbLayer?.visible && plumbingElements?.length > 0 && <PlumbingView3D elements={plumbingElements} floorY={floorY} />}
      {hvacLayer?.visible && hvacElements?.length > 0 && <HVACView3D elements={hvacElements} floorY={floorY} />}
      {solarLayer?.visible && solarElements?.length > 0 && <SolarView3D elements={solarElements} roofY={wallHeight * S + 0.15} />}

      {/* Lighting System */}
      <LightingSystem
        timeOfDay={14}
        interiorLights={interiorLights}
        renderMode={renderMode}
      />
    </group>
  );
}

// ─── Main Export ───────────────────────────────────────────────
export default function Building3DView() {
  const dispatch = useDispatch();
  const { renderMode, selectedElementIds } = useSelector(s => s.bim);
  const [cameraPreset, setCameraPreset] = useState(null);

  const handleSelect = useCallback((id, type) => {
    dispatch(selectElement({ id, type }));
  }, [dispatch]);

  return (
    <div className="w-full h-full relative bg-gradient-to-b from-sky-200 to-sky-400">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.4,
          outputColorSpace: THREE.SRGBColorSpace,
          powerPreference: 'high-performance',
          physicallyCorrectLights: true,
        }}
      >
        <PerspectiveCamera makeDefault position={[15, 12, 15]} fov={50} near={0.1} far={500} />
        <OrbitControls
          enableDamping dampingFactor={0.05}
          minDistance={2} maxDistance={150}
          maxPolarAngle={Math.PI / 2.05}
          target={[5, 1, 5]}
        />

        <CameraController preset={cameraPreset} />

        {/* ViewCube */}
        <GizmoHelper alignment="top-right" margin={[80, 80]}>
          <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="white" />
        </GizmoHelper>

        <Suspense fallback={<LoadingFallback />}>
          <BuildingScene
            renderMode={renderMode}
            selectedIds={selectedElementIds}
            onSelect={handleSelect}
          />
          {/* Post-processing effects */}
          <PostProcessingEffects enabled renderMode={renderMode} />
        </Suspense>
      </Canvas>

      {/* Render Mode Selector — Bottom Left */}
      <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-surface-900/90 backdrop-blur-sm rounded-xl p-1 border border-surface-700/50">
        {Object.entries(RENDER_MODES).map(([key, value]) => (
          <button
            key={key}
            onClick={() => dispatch(setRenderMode(value))}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
              renderMode === value
                ? 'bg-primary-600/30 text-primary-400 ring-1 ring-primary-500/50'
                : 'text-surface-400 hover:text-white hover:bg-surface-800'
            }`}
            title={key}
          >
            {key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Camera Presets — Bottom Right */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1 bg-surface-900/90 backdrop-blur-sm rounded-xl p-1 border border-surface-700/50">
        {Object.entries(CAMERA_PRESETS).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => setCameraPreset(key)}
            className="px-2.5 py-1 rounded-lg text-[10px] font-medium text-surface-400 hover:text-white hover:bg-surface-800 transition-all text-left"
            title={preset.name}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Selection Info — Top Left */}
      {selectedElementIds.length > 0 && (
        <div className="absolute top-3 left-3 bg-surface-900/90 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-primary-500/30 text-xs text-primary-400">
          {selectedElementIds.length} element{selectedElementIds.length > 1 ? 's' : ''} selected
        </div>
      )}

      {/* Engine Badge — Top Right */}
      <div className="absolute top-3 right-3 bg-surface-900/70 backdrop-blur-sm rounded-lg px-2 py-1 border border-surface-700/30 text-[9px] text-surface-500">
        PBR Engine • Procedural Textures
      </div>
    </div>
  );
}
