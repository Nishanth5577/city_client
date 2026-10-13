// ═══════════════════════════════════════════════════════════════
// Room Generator — Auto-detect rooms from walls, generate
// floors, ceilings, labels, and suggested furniture
// ═══════════════════════════════════════════════════════════════
import { useMemo, memo } from 'react';
import { Html } from '@react-three/drei';
import ProceduralFloor from './ProceduralFloor';
import ProceduralCeiling from './ProceduralCeiling';

const S = 0.001;
const SNAP = 150; // mm

// ─── Room Detection ────────────────────────────────────────────
function detectRooms(walls) {
  if (!walls || walls.length < 3) return [];

  const rooms = [];
  const endpoints = [];
  walls.forEach((wall, i) => {
    if (!wall?.start_point || !wall?.end_point) return;
    endpoints.push({ wallIdx: i, point: wall.start_point, end: 'start' });
    endpoints.push({ wallIdx: i, point: wall.end_point, end: 'end' });
  });

  function findConnected(wallIdx, endType) {
    const wall = walls[wallIdx];
    const target = endType === 'start' ? wall.start_point : wall.end_point;
    return endpoints.filter(ep => {
      if (ep.wallIdx === wallIdx) return false;
      const dx = ep.point.x - target.x;
      const dy = ep.point.y - target.y;
      return Math.sqrt(dx * dx + dy * dy) < SNAP;
    });
  }

  function findLoop(startIdx, path, visited) {
    if (path.length > 2) {
      const last = walls[path[path.length - 1]];
      const first = walls[path[0]];
      if (last?.end_point && first?.start_point) {
        const dx = last.end_point.x - first.start_point.x;
        const dy = last.end_point.y - first.start_point.y;
        if (Math.sqrt(dx * dx + dy * dy) < SNAP) return [...path];
      }
    }
    if (path.length >= 8) return null;

    const lastIdx = path[path.length - 1];
    const connections = findConnected(lastIdx, 'end');
    for (const conn of connections) {
      if (visited.has(conn.wallIdx)) {
        if (conn.wallIdx === startIdx && path.length > 2) return [...path];
        continue;
      }
      visited.add(conn.wallIdx);
      const result = findLoop(startIdx, [...path, conn.wallIdx], visited);
      if (result) return result;
      visited.delete(conn.wallIdx);
    }
    return null;
  }

  const used = new Set();
  walls.forEach((_, i) => {
    if (used.has(i)) return;
    const visited = new Set([i]);
    const loop = findLoop(i, [i], visited);
    if (loop && loop.length >= 3) {
      const points = loop.map(idx => walls[idx]?.start_point).filter(Boolean);
      const area = calcArea(points);
      if (area > 500000) { // > 0.5 sqm minimum
        rooms.push({
          wallIndices: loop,
          points,
          areaSqmm: area,
          areaSqm: area / 1e6,
          areaSqft: (area / 1e6) * 10.764,
        });
        loop.forEach(idx => used.add(idx));
      }
    }
  });

  return rooms;
}

function calcArea(points) {
  if (!points || points.length < 3) return 0;
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

function centroid(points) {
  if (!points || points.length === 0) return { x: 0, y: 0 };
  const sx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const sy = points.reduce((s, p) => s + p.y, 0) / points.length;
  return { x: sx, y: sy };
}

// ─── Room Type Classification ──────────────────────────────────
function classifyRoom(area, index, totalRooms) {
  const sqm = area / 1e6;
  if (sqm > 20) return { type: 'living', name: 'Living Room' };
  if (sqm > 14) return { type: 'master_bedroom', name: 'Master Bedroom' };
  if (sqm > 10) return { type: index < totalRooms / 2 ? 'bedroom' : 'dining', name: index < totalRooms / 2 ? 'Bedroom' : 'Dining Room' };
  if (sqm > 6) return { type: 'kitchen', name: 'Kitchen' };
  if (sqm > 3) return { type: 'bathroom', name: 'Bathroom' };
  return { type: 'utility', name: 'Utility' };
}

// ─── Room Label Component ──────────────────────────────────────
function RoomLabel({ center, name, area, renderMode }) {
  if (renderMode === 'wireframe' || renderMode === 'xray') return null;
  return (
    <Html
      position={[center.x * S, 0.15, center.y * S]}
      distanceFactor={10}
      center
    >
      <div className="pointer-events-none select-none text-center">
        <div className="text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-sm whitespace-nowrap">
          {name}
        </div>
        <div className="text-[8px] text-white/70 mt-0.5">
          {(area / 1e6).toFixed(1)} m² / {((area / 1e6) * 10.764).toFixed(0)} sqft
        </div>
      </div>
    </Html>
  );
}

// ─── Main Component ────────────────────────────────────────────
const RoomGenerator = memo(function RoomGenerator({ walls, renderMode, showCeiling = true }) {
  const rooms = useMemo(() => {
    const detected = detectRooms(walls);
    return detected.map((room, i) => {
      const classification = classifyRoom(room.areaSqmm, i, detected.length);
      return {
        ...room,
        ...classification,
        center: centroid(room.points),
      };
    });
  }, [walls]);

  if (rooms.length === 0) return null;

  return (
    <group>
      {rooms.map((room, i) => (
        <group key={i}>
          {/* Floor */}
          <ProceduralFloor
            points={room.points}
            roomType={room.type}
            floorY={0}
            renderMode={renderMode}
          />
          {/* Ceiling — hidden in dollhouse/studio view */}
          {showCeiling && (
            <ProceduralCeiling
              points={room.points}
              ceilingHeight={walls[0]?.height || 3000}
              renderMode={renderMode}
            />
          )}
          {/* Label */}
          <RoomLabel
            center={room.center}
            name={room.name}
            area={room.areaSqmm}
            renderMode={renderMode}
          />
        </group>
      ))}
    </group>
  );
});

export default RoomGenerator;
export { detectRooms, classifyRoom, centroid };
