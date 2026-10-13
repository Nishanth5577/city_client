// ═══════════════════════════════════════════════════════════════
// IFCViewerEngine — Browser-based IFC 3D viewer using Three.js
// Loads and renders IFC files with spatial tree navigation,
// element selection, and property inspection
// ═══════════════════════════════════════════════════════════════
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, GizmoHelper, GizmoViewport, Html, Environment } from '@react-three/drei';
import { useState, useCallback, useRef, useEffect, Suspense, useMemo, memo } from 'react';
import * as THREE from 'three';
import {
  Loader2, Upload, Box, Layers, ChevronRight, ChevronDown,
  Eye, EyeOff, MousePointer2, Info, TreePine,
} from 'lucide-react';

// ─── Fallback IFC Element Renderer ─────────────────────────────
// When web-ifc is not available, we render imported IFC elements
// using the same Three.js procedural approach as Building3DView
const S = 0.001; // mm to meters

const IFCWall3D = memo(({ wall }) => {
  if (!wall?.start_point || !wall?.end_point) return null;
  const sx = wall.start_point.x * S, sy = wall.start_point.y * S;
  const ex = wall.end_point.x * S, ey = wall.end_point.y * S;
  const dx = ex - sx, dy = ey - sy;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length < 0.01) return null;
  const h = (wall.height || 3000) * S;
  const t = (wall.thickness || 230) * S;
  const angle = Math.atan2(dy, dx);
  const mx = (sx + ex) / 2, mz = (sy + ey) / 2;

  return (
    <mesh position={[mx, h / 2, mz]} rotation={[0, -angle, 0]}>
      <boxGeometry args={[length, h, t]} />
      <meshStandardMaterial color={wall.color || '#8B7355'} roughness={0.8} />
    </mesh>
  );
});

const IFCColumn3D = memo(({ column }) => {
  if (!column?.position) return null;
  const x = column.position.x * S, z = column.position.y * S;
  const w = (column.width || 300) * S;
  const d = (column.depth || column.width || 300) * S;
  const h = (column.height || 3000) * S;

  return (
    <mesh position={[x, h / 2, z]}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color="#A0A0A0" roughness={0.6} />
    </mesh>
  );
});

const IFCDoor3D = memo(({ door }) => {
  if (!door?.position) return null;
  const x = door.position.x * S, z = door.position.y * S;
  const w = (door.width || 900) * S;
  const h = (door.height || 2100) * S;

  return (
    <mesh position={[x, h / 2, z]}>
      <boxGeometry args={[w, h, 0.05]} />
      <meshStandardMaterial color="#8B4513" roughness={0.5} />
    </mesh>
  );
});

const IFCWindow3D = memo(({ window: win }) => {
  if (!win?.position) return null;
  const x = win.position.x * S, z = win.position.y * S;
  const w = (win.width || 1200) * S;
  const h = (win.height || 1200) * S;
  const sill = (win.sill_height || 900) * S;

  return (
    <mesh position={[x, sill + h / 2, z]}>
      <boxGeometry args={[w, h, 0.04]} />
      <meshStandardMaterial color="#87CEEB" transparent opacity={0.4} roughness={0.0} metalness={0.1} />
    </mesh>
  );
});

const IFCFurniture3D = memo(({ furniture }) => {
  if (!furniture?.position) return null;
  const x = furniture.position.x * S, z = furniture.position.y * S;
  const w = (furniture.width || 600) * S;
  const d = (furniture.depth || 600) * S;
  const h = (furniture.height || 750) * S;

  return (
    <mesh position={[x, h / 2, z]}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={furniture.color || '#D2B48C'} roughness={0.7} />
    </mesh>
  );
});

// ─── Scene Component ───────────────────────────────────────────
function IFCScene({ elements, onSelect }) {
  const walls = elements?.walls || [];
  const columns = elements?.columns || [];
  const doors = elements?.doors || [];
  const windows = elements?.windows || [];
  const furniture = elements?.furniture || [];

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[15, 20, 10]} intensity={0.8} castShadow />
      <directionalLight position={[-10, 15, -5]} intensity={0.3} />
      <hemisphereLight skyColor="#87CEEB" groundColor="#8B7355" intensity={0.3} />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
      </mesh>

      {/* Grid */}
      <gridHelper args={[50, 50, '#333', '#222']} position={[0, 0, 0]} />

      {/* Elements */}
      {walls.map((w, i) => <IFCWall3D key={`w-${i}`} wall={w} />)}
      {columns.map((c, i) => <IFCColumn3D key={`c-${i}`} column={c} />)}
      {doors.map((d, i) => <IFCDoor3D key={`d-${i}`} door={d} />)}
      {windows.map((w, i) => <IFCWindow3D key={`win-${i}`} window={w} />)}
      {furniture.map((f, i) => <IFCFurniture3D key={`f-${i}`} furniture={f} />)}
    </>
  );
}

// ─── Main IFC Viewer Component ─────────────────────────────────
export default function IFCViewerEngine({ elements, spatialTree, onElementSelect }) {
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [treeExpanded, setTreeExpanded] = useState({});

  const totalElements = useMemo(() => {
    if (!elements) return 0;
    return Object.values(elements).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  }, [elements]);

  const handleSelect = useCallback((element) => {
    setSelectedId(element?._id || element?.ifc_guid);
    onElementSelect?.(element);
  }, [onElementSelect]);

  const toggleTreeNode = useCallback((key) => {
    setTreeExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  if (!elements || totalElements === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-surface-950">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-800/50 flex items-center justify-center mx-auto mb-4">
            <TreePine className="w-8 h-8 text-emerald-500/50" />
          </div>
          <h3 className="text-lg font-semibold text-surface-300 mb-2">IFC Viewer</h3>
          <p className="text-sm text-surface-500 max-w-md">
            Import an IFC file or export your current design to view it in the IFC viewer.
            Use the Bonsai panel to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* 3D Canvas */}
      <Canvas
        shadows
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
        camera={{ position: [15, 12, 15], fov: 50, near: 0.1, far: 1000 }}
      >
        <Suspense fallback={
          <Html center>
            <div className="flex items-center gap-2 text-white bg-surface-900/90 px-4 py-2 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading IFC model...
            </div>
          </Html>
        }>
          <IFCScene elements={elements} onSelect={handleSelect} />
        </Suspense>
        <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
        <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
          <GizmoViewport />
        </GizmoHelper>
      </Canvas>

      {/* IFC Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-surface-900/90 backdrop-blur-sm rounded-xl px-3 py-2 border border-surface-700/50">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <TreePine className="w-3 h-3 text-white" />
        </div>
        <div>
          <span className="text-[10px] font-semibold text-white block">IFC Viewer</span>
          <span className="text-[9px] text-surface-400">{totalElements} elements</span>
        </div>
      </div>

      {/* Spatial Tree (mini) */}
      {spatialTree && spatialTree.length > 0 && (
        <div className="absolute top-3 right-3 z-10 w-56 max-h-64 overflow-y-auto bg-surface-900/90 backdrop-blur-sm rounded-xl border border-surface-700/50 p-2">
          <h4 className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider px-2 py-1">Spatial Tree</h4>
          {spatialTree.map((node, i) => (
            <TreeNode key={i} node={node} level={0} expanded={treeExpanded} onToggle={toggleTreeNode} />
          ))}
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-surface-950/80 flex items-center justify-center z-20">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-surface-300">Loading IFC model...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Recursive tree node
function TreeNode({ node, level, expanded, onToggle }) {
  const key = node.guid || node.name || `node-${level}`;
  const isExpanded = expanded[key] !== false;
  const hasChildren = node.children && node.children.length > 0;
  const indent = level * 12;

  const typeColors = {
    'IfcProject': 'text-purple-400',
    'IfcSite': 'text-green-400',
    'IfcBuilding': 'text-blue-400',
    'IfcBuildingStorey': 'text-amber-400',
  };

  return (
    <div>
      <button
        onClick={() => hasChildren && onToggle(key)}
        className="w-full flex items-center gap-1 px-2 py-1 hover:bg-surface-800/50 rounded text-left transition-colors"
        style={{ paddingLeft: `${indent + 8}px` }}
      >
        {hasChildren ? (
          isExpanded ? <ChevronDown className="w-3 h-3 text-surface-500 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 text-surface-500 flex-shrink-0" />
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}
        <span className={`text-[10px] ${typeColors[node.type] || 'text-surface-300'}`}>
          {node.name}
        </span>
        {node.element_count > 0 && (
          <span className="text-[8px] text-surface-500 ml-auto">{node.element_count}</span>
        )}
      </button>
      {isExpanded && hasChildren && node.children.map((child, i) => (
        <TreeNode key={i} node={child} level={level + 1} expanded={expanded} onToggle={onToggle} />
      ))}
    </div>
  );
}
