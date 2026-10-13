// ═══════════════════════════════════════════════════════════════
// BuildingViewport — Professional 3D Architectural Viewport
// Supports: 3D View, Dollhouse/Cutaway, Walkthrough, Render
// Real clipping planes, floor explode, roof visibility control
// ═══════════════════════════════════════════════════════════════
import { Suspense, useCallback, useRef, useMemo, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import {
  OrbitControls, GizmoHelper, GizmoViewport, Grid,
  Html, PerspectiveCamera, AdaptiveDpr, ContactShadows,
} from '@react-three/drei';
import * as THREE from 'three';
import useBimStore from '../../../stores/bimStore';
import {
  MM_TO_M, VIEW_MODES, RENDER_MODES, ROOF_VISIBILITY,
  CUTAWAY_DIRECTIONS, FLOOR_DISPLAY,
} from '../../../stores/bimTypes';

import SceneLighting from './SceneLighting';
import SceneEnvironment from './SceneEnvironment';
import CameraController from './CameraController';
import Site3D from './elements/Site3D';
import Wall3D from './elements/Wall3D';
import Door3D from './elements/Door3D';
import Window3D from './elements/Window3D';
import Slab3D from './elements/Slab3D';
import Roof3D from './elements/Roof3D';
import Stair3D from './elements/Stair3D';
import { Room3D, Column3D, Beam3D, Furniture3D, Landscape3D } from './elements/BIMElements3D';
import WalkController from '../viewer/engine/WalkController';

// ─── Cutaway Clipping System ──────────────────────────────────
function CutawaySystem() {
  const { gl } = useThree();
  const viewMode = useBimStore(s => s.viewMode);
  const cutawayDirection = useBimStore(s => s.cutawayDirection);
  const cutawayAmount = useBimStore(s => s.cutawayAmount);
  const sectionPlanes = useBimStore(s => s.sectionPlanes);
  const building = useBimStore(s => s.building);
  const site = useBimStore(s => s.site);

  const S = MM_TO_M;
  const bx = building ? building.position.x * S : 0;
  const bz = building ? building.position.y * S : 0;
  const bw = building ? building.width * S : site.width * S;
  const bl = building ? building.length * S : site.length * S;

  useEffect(() => {
    if (viewMode !== VIEW_MODES.DOLLHOUSE) {
      gl.clippingPlanes = [];
      gl.localClippingEnabled = false;
      return;
    }

    const planes = [];

    // Directional cutaway
    if (cutawayDirection !== CUTAWAY_DIRECTIONS.NONE) {
      const amt = cutawayAmount;
      switch (cutawayDirection) {
        case CUTAWAY_DIRECTIONS.FRONT:
          planes.push(new THREE.Plane(new THREE.Vector3(0, 0, 1), -(bz + bl * (1 - amt))));
          break;
        case CUTAWAY_DIRECTIONS.BACK:
          planes.push(new THREE.Plane(new THREE.Vector3(0, 0, -1), bz + bl * amt));
          break;
        case CUTAWAY_DIRECTIONS.LEFT:
          planes.push(new THREE.Plane(new THREE.Vector3(1, 0, 0), -(bx + bw * (1 - amt))));
          break;
        case CUTAWAY_DIRECTIONS.RIGHT:
          planes.push(new THREE.Plane(new THREE.Vector3(-1, 0, 0), bx + bw * amt));
          break;
      }
    }

    // Section planes
    if (sectionPlanes.x.enabled) {
      planes.push(new THREE.Plane(new THREE.Vector3(-1, 0, 0), bx + bw * sectionPlanes.x.position));
    }
    if (sectionPlanes.y.enabled) {
      const maxH = 12; // max building height in meters
      planes.push(new THREE.Plane(new THREE.Vector3(0, -1, 0), maxH * sectionPlanes.y.position));
    }
    if (sectionPlanes.z.enabled) {
      planes.push(new THREE.Plane(new THREE.Vector3(0, 0, -1), bz + bl * sectionPlanes.z.position));
    }

    gl.clippingPlanes = planes;
    gl.localClippingEnabled = planes.length > 0;

    return () => {
      gl.clippingPlanes = [];
      gl.localClippingEnabled = false;
    };
  }, [viewMode, cutawayDirection, cutawayAmount, sectionPlanes, gl, bx, bz, bw, bl]);

  return null;
}

// ─── Floor Group with Explode Offset ──────────────────────────
function FloorGroup({ floor, floorIndex, children }) {
  const floorDisplay = useBimStore(s => s.floorDisplay);
  const explodedSpacing = useBimStore(s => s.explodedFloorSpacing);
  const visibleFloorId = useBimStore(s => s.visibleFloorId);
  const groupRef = useRef();
  const targetY = useRef(0);

  // Calculate target Y offset
  const explodeOffset = floorDisplay === FLOOR_DISPLAY.EXPLODED
    ? floorIndex * explodedSpacing
    : 0;

  // Visibility
  const isVisible = floorDisplay === FLOOR_DISPLAY.SINGLE
    ? visibleFloorId === floor.id || visibleFloorId === null
    : true;

  // Smooth animation
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    targetY.current = explodeOffset;
    const current = groupRef.current.position.y;
    const diff = targetY.current - current;
    if (Math.abs(diff) > 0.001) {
      groupRef.current.position.y += diff * Math.min(delta * 5, 1);
    }
  });

  if (!isVisible) return null;

  return (
    <group ref={groupRef}>
      {children}
    </group>
  );
}

// ─── Roof Group with Visibility ───────────────────────────────
function RoofGroup({ children }) {
  const roofVisibility = useBimStore(s => s.roofVisibility);

  if (roofVisibility === ROOF_VISIBILITY.HIDE) return null;

  return (
    <group>
      {children}
    </group>
  );
}

// ─── Scene Content ─────────────────────────────────────────────
function BuildingScene() {
  const floors = useBimStore(s => s.floors);
  const walls = useBimStore(s => s.walls);
  const doors = useBimStore(s => s.doors);
  const windows = useBimStore(s => s.windows);
  const rooms = useBimStore(s => s.rooms);
  const slabs = useBimStore(s => s.slabs);
  const roofs = useBimStore(s => s.roofs);
  const stairs = useBimStore(s => s.stairs);
  const columns = useBimStore(s => s.columns);
  const beams = useBimStore(s => s.beams);
  const furniture = useBimStore(s => s.furniture);
  const landscape = useBimStore(s => s.landscape);
  const site = useBimStore(s => s.site);
  const building = useBimStore(s => s.building);
  const selectedIds = useBimStore(s => s.selectedIds);
  const hoveredId = useBimStore(s => s.hoveredId);
  const showGrid = useBimStore(s => s.showGrid);
  const showRoomLabels = useBimStore(s => s.showRoomLabels);
  const showFurniture = useBimStore(s => s.showFurniture);
  const viewMode = useBimStore(s => s.viewMode);
  const roofVisibility = useBimStore(s => s.roofVisibility);
  const select = useBimStore(s => s.select);

  const S = MM_TO_M;
  const isSelected = (id) => selectedIds.includes(id);
  const isHovered = (id) => hoveredId === id;
  const isDollhouse = viewMode === VIEW_MODES.DOLLHOUSE;

  const handleClick = useCallback((element) => {
    select(element.id);
  }, [select]);

  return (
    <>
      {/* ═══ Clipping System ═══ */}
      <CutawaySystem />

      {/* ═══ Camera Controller ═══ */}
      <CameraController />

      {/* ═══ Professional Lighting ═══ */}
      <SceneLighting />

      {/* ═══ Environment (Sky, HDRI, Fog) ═══ */}
      <SceneEnvironment />

      {/* ═══ Site / Ground ═══ */}
      <Site3D site={site} building={building} />

      {/* Grid */}
      {showGrid && (
        <Grid
          position={[site.width * S / 2, 0.02, site.length * S / 2]}
          args={[site.width * S, site.length * S]}
          cellSize={1}
          cellThickness={0.4}
          cellColor="#666"
          sectionSize={5}
          sectionThickness={0.8}
          sectionColor="#999"
          fadeDistance={60}
          fadeStrength={1.2}
          infiniteGrid={false}
        />
      )}

      {/* ═══ Building Elements Per Floor ═══ */}
      {floors.map((floor, floorIndex) => {
        if (!floor.visible) return null;
        const fid = floor.id;
        const elev = floor.elevation;
        const floorDoors = doors[fid] || [];
        const floorWindows = windows[fid] || [];

        return (
          <FloorGroup key={fid} floor={floor} floorIndex={floorIndex}>
            {/* Walls — with real CSG openings */}
            {(walls[fid] || []).map(wall => (
              <Wall3D key={wall.id} wall={wall} floorElevation={elev}
                doors={floorDoors}
                windows={floorWindows}
                selected={isSelected(wall.id)} hovered={isHovered(wall.id)}
                onClick={handleClick}
                isDollhouse={isDollhouse} />
            ))}

            {/* Doors — positioned within wall openings */}
            {floorDoors.map(door => {
              const parentWall = (walls[fid] || []).find(w => w.id === door.wallId);
              return (
                <Door3D key={door.id} door={door} wall={parentWall} floorElevation={elev}
                  selected={isSelected(door.id)} hovered={isHovered(door.id)}
                  onClick={handleClick} />
              );
            })}

            {/* Windows — positioned within wall openings */}
            {floorWindows.map(win => {
              const parentWall = (walls[fid] || []).find(w => w.id === win.wallId);
              return (
                <Window3D key={win.id} window={win} wall={parentWall} floorElevation={elev}
                  selected={isSelected(win.id)} hovered={isHovered(win.id)}
                  onClick={handleClick} />
              );
            })}

            {/* Rooms — floor + ceiling + labels */}
            {(rooms[fid] || []).map(room => (
              <Room3D key={room.id} room={room} floorElevation={elev}
                showLabels={showRoomLabels} onClick={handleClick} />
            ))}

            {/* Slabs */}
            {(slabs[fid] || []).map(slab => (
              <Slab3D key={slab.id} slab={slab} selected={isSelected(slab.id)}
                onClick={handleClick} />
            ))}

            {/* Stairs */}
            {(stairs[fid] || []).map(stair => (
              <Stair3D key={stair.id} stair={stair} floorElevation={elev}
                selected={isSelected(stair.id)} onClick={handleClick} />
            ))}

            {/* Columns */}
            {(columns[fid] || []).map(col => (
              <Column3D key={col.id} column={col} floorElevation={elev}
                selected={isSelected(col.id)} onClick={handleClick} />
            ))}

            {/* Beams */}
            {(beams[fid] || []).map(beam => (
              <Beam3D key={beam.id} beam={beam} floorElevation={elev}
                selected={isSelected(beam.id)} onClick={handleClick} />
            ))}

            {/* Furniture */}
            {showFurniture && (furniture[fid] || []).map(furn => (
              <Furniture3D key={furn.id} furniture={furn} floorElevation={elev}
                selected={isSelected(furn.id)} hovered={isHovered(furn.id)}
                onClick={handleClick} />
            ))}
          </FloorGroup>
        );
      })}

      {/* ═══ Roof ═══ */}
      <RoofGroup>
        {(roofs['building'] || []).map(roof => (
          <Roof3D key={roof.id} roof={roof} selected={isSelected(roof.id)}
            onClick={handleClick}
            transparent={roofVisibility === ROOF_VISIBILITY.TRANSPARENT} />
        ))}
      </RoofGroup>

      {/* ═══ Landscape ═══ */}
      {(landscape['site'] || []).map(item => (
        <Landscape3D key={item.id} item={item} onClick={handleClick} />
      ))}

      {/* ═══ Contact shadows for dollhouse ═══ */}
      {isDollhouse && (
        <ContactShadows
          position={[site.width * S / 2, 0.01, site.length * S / 2]}
          width={site.width * S}
          height={site.length * S}
          opacity={0.4}
          scale={40}
          blur={2}
          far={10}
        />
      )}
    </>
  );
}

// ─── Main Viewport Component ───────────────────────────────────
export default function BuildingViewport() {
  const clearSelection = useBimStore(s => s.clearSelection);
  const viewMode = useBimStore(s => s.viewMode);
  const walkthroughActive = useBimStore(s => s.walkthroughActive);
  const showShadows = useBimStore(s => s.showShadows);
  const walls = useBimStore(s => s.walls);
  const floors = useBimStore(s => s.floors);
  const toggleWalkthrough = useBimStore(s => s.toggleWalkthrough);

  const isWalkthrough = viewMode === VIEW_MODES.WALKTHROUGH || walkthroughActive;

  // Gather all walls for walkthrough collision
  const allWalls = useMemo(() => {
    const result = [];
    for (const fid of Object.keys(walls)) {
      for (const w of (walls[fid] || [])) {
        result.push({
          start_point: w.start,
          end_point: w.end,
          thickness: w.thickness,
          height: w.height,
        });
      }
    }
    return result;
  }, [walls]);

  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows={showShadows ? 'soft' : false}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.4,
          outputColorSpace: THREE.SRGBColorSpace,
          physicallyCorrectLights: true,
          powerPreference: 'high-performance',
          alpha: false,
          logarithmicDepthBuffer: true,
        }}
        camera={{ position: [22, 16, 28], fov: 40, near: 0.1, far: 600 }}
        onPointerMissed={() => clearSelection()}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
      >
        <PerspectiveCamera makeDefault position={[22, 16, 28]} fov={40} />

        {/* Adaptive DPR for performance */}
        <AdaptiveDpr pixelated />

        <Suspense fallback={
          <Html center>
            <div className="flex flex-col items-center gap-3 text-white bg-black/80 px-8 py-5 rounded-2xl backdrop-blur-sm">
              <div className="w-8 h-8 border-3 border-white/20 border-t-emerald-400 rounded-full animate-spin" />
              <span className="text-sm font-medium">Loading Building...</span>
            </div>
          </Html>
        }>
          <BuildingScene />
        </Suspense>

        {/* Orbit Controls (disabled in walkthrough) */}
        {!isWalkthrough && (
          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.08}
            minDistance={2}
            maxDistance={200}
            maxPolarAngle={Math.PI * 0.48}
            rotateSpeed={0.8}
            panSpeed={1.2}
            zoomSpeed={1.5}
          />
        )}

        {/* Walkthrough Controller */}
        {isWalkthrough && (
          <WalkController
            enabled={true}
            walls={allWalls}
            onExit={() => {
              toggleWalkthrough();
              useBimStore.getState().setViewMode(VIEW_MODES.VIEW_3D);
            }}
          />
        )}

        {/* Navigation Gizmo */}
        {!isWalkthrough && (
          <GizmoHelper alignment="bottom-right" margin={[70, 70]}>
            <GizmoViewport
              axisColors={['#DC2626', '#22c55e', '#0D9488']}
              labelColor="white"
              hideNegativeAxes={false}
            />
          </GizmoHelper>
        )}
      </Canvas>

      {/* Viewport info overlay */}
      <div className="absolute bottom-2 left-2 text-[9px] text-white/30 font-mono pointer-events-none">
        R3F · Three.js · PBR · ACES · {viewMode.toUpperCase()}
      </div>

      {/* Walkthrough HUD */}
      {isWalkthrough && (
        <div className="absolute inset-0 pointer-events-none z-30">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-6 h-6 relative">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/50" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/50" />
            </div>
          </div>
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-xl px-6 py-3 pointer-events-auto">
            <div className="flex items-center gap-6 text-white/80 text-xs">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">W</kbd>
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">A</kbd>
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">S</kbd>
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">D</kbd>
                Move
              </span>
              <span>🖱️ Look</span>
              <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">Shift</kbd> Sprint</span>
              <button
                onClick={() => {
                  toggleWalkthrough();
                  useBimStore.getState().setViewMode(VIEW_MODES.VIEW_3D);
                }}
                className="px-3 py-1 bg-red-500/80 rounded-lg text-white text-xs hover:bg-red-500 transition-colors"
              >
                ESC — Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
