// ═══════════════════════════════════════════════════════════════
// BIM Design Studio — Smart Features Engine
// ═══════════════════════════════════════════════════════════════

/**
 * Detect closed rooms from wall segments.
 * Uses a simplified approach: finds closed polygons from connected wall endpoints.
 */
export function detectRooms(walls) {
  if (!walls || walls.length < 3) return [];

  const SNAP_THRESHOLD = 150; // mm
  const rooms = [];
  const used = new Set();

  // Build adjacency from wall endpoints
  const endpoints = [];
  walls.forEach((wall, i) => {
    if (!wall?.start_point || !wall?.end_point) return;
    endpoints.push({ wallIdx: i, point: wall.start_point, end: 'start' });
    endpoints.push({ wallIdx: i, point: wall.end_point, end: 'end' });
  });

  function findConnected(wallIdx, endType) {
    const wall = walls[wallIdx];
    const targetPoint = endType === 'start' ? wall.start_point : wall.end_point;

    return endpoints.filter(ep => {
      if (ep.wallIdx === wallIdx) return false;
      const dx = ep.point.x - targetPoint.x;
      const dy = ep.point.y - targetPoint.y;
      return Math.sqrt(dx * dx + dy * dy) < SNAP_THRESHOLD;
    });
  }

  // DFS to find closed loops
  function findLoop(startWallIdx, path, visited) {
    if (path.length > 2) {
      const lastWall = walls[path[path.length - 1]];
      const firstWall = walls[path[0]];
      if (lastWall && firstWall) {
        const endPt = lastWall.end_point;
        const startPt = firstWall.start_point;
        const dx = endPt.x - startPt.x;
        const dy = endPt.y - startPt.y;
        if (Math.sqrt(dx * dx + dy * dy) < SNAP_THRESHOLD) {
          return [...path];
        }
      }
    }

    if (path.length >= 8) return null;

    const lastIdx = path[path.length - 1];
    const connections = findConnected(lastIdx, 'end');

    for (const conn of connections) {
      if (visited.has(conn.wallIdx)) {
        if (conn.wallIdx === startWallIdx && path.length > 2) {
          return [...path];
        }
        continue;
      }

      visited.add(conn.wallIdx);
      const result = findLoop(startWallIdx, [...path, conn.wallIdx], visited);
      if (result) return result;
      visited.delete(conn.wallIdx);
    }

    return null;
  }

  walls.forEach((_, i) => {
    if (used.has(i)) return;
    const visited = new Set([i]);
    const loop = findLoop(i, [i], visited);
    if (loop && loop.length >= 3) {
      const roomPoints = loop.map(idx => walls[idx].start_point).filter(Boolean);
      const area = calculatePolygonArea(roomPoints);
      if (area > 100000) { // Minimum 0.1 sq.m
        rooms.push({
          wall_indices: loop,
          points: roomPoints,
          area_sqmm: area,
          area_sqm: area / 1e6,
          area_sqft: (area / 1e6) * 10.764,
        });
        loop.forEach(idx => used.add(idx));
      }
    }
  });

  return rooms;
}

/**
 * Calculate area of polygon using Shoelace formula.
 * Points: [{ x, y }, ...]
 * Returns area in sq.mm (same units as input)
 */
export function calculatePolygonArea(points) {
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

/**
 * Calculate volume from area and height.
 */
export function calculateVolume(areaSqmm, heightMm) {
  return (areaSqmm / 1e6) * (heightMm / 1000); // cubic meters
}

/**
 * Check collision between two rectangular elements.
 */
export function checkCollision(a, b) {
  if (!a || !b) return false;

  // For walls (line segments)
  if (a.start_point && a.end_point && b.start_point && b.end_point) {
    return lineIntersects(
      a.start_point, a.end_point,
      b.start_point, b.end_point
    );
  }

  // For positioned elements (column, furniture, door, window)
  if (a.position && b.position) {
    const aLeft = a.position.x - (a.width || 0) / 2;
    const aRight = a.position.x + (a.width || 0) / 2;
    const aTop = a.position.y - (a.depth || a.height || 0) / 2;
    const aBottom = a.position.y + (a.depth || a.height || 0) / 2;

    const bLeft = b.position.x - (b.width || 0) / 2;
    const bRight = b.position.x + (b.width || 0) / 2;
    const bTop = b.position.y - (b.depth || b.height || 0) / 2;
    const bBottom = b.position.y + (b.depth || b.height || 0) / 2;

    return !(aRight < bLeft || aLeft > bRight || aBottom < bTop || aTop > bBottom);
  }

  return false;
}

function lineIntersects(p1, p2, p3, p4) {
  const d1 = direction(p3, p4, p1);
  const d2 = direction(p3, p4, p2);
  const d3 = direction(p1, p2, p3);
  const d4 = direction(p1, p2, p4);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  return false;
}

function direction(pi, pj, pk) {
  return (pk.x - pi.x) * (pj.y - pi.y) - (pj.x - pi.x) * (pk.y - pi.y);
}

/**
 * Detect all collisions in the element set.
 * Returns array of { typeA, indexA, typeB, indexB } pairs.
 */
export function detectAllCollisions(elements) {
  const collisions = [];
  const allElements = [];

  // Flatten with type info
  Object.entries(elements).forEach(([type, arr]) => {
    (arr || []).forEach((el, idx) => {
      allElements.push({ type, idx, el });
    });
  });

  for (let i = 0; i < allElements.length; i++) {
    for (let j = i + 1; j < allElements.length; j++) {
      if (checkCollision(allElements[i].el, allElements[j].el)) {
        collisions.push({
          typeA: allElements[i].type,
          indexA: allElements[i].idx,
          nameA: allElements[i].el.name || `${allElements[i].type} ${allElements[i].idx}`,
          typeB: allElements[j].type,
          indexB: allElements[j].idx,
          nameB: allElements[j].el.name || `${allElements[j].type} ${allElements[j].idx}`,
        });
      }
    }
  }

  return collisions;
}

/**
 * Validate door/window placement against walls.
 * Returns array of invalid placements.
 */
export function validateOpenings(walls, doors, windows) {
  const issues = [];

  const checkOnWall = (opening, type) => {
    if (!opening?.position || !walls?.length) return;

    const pos = opening.position;
    const isOnWall = walls.some(wall => {
      if (!wall?.start_point || !wall?.end_point) return false;

      const dx = wall.end_point.x - wall.start_point.x;
      const dy = wall.end_point.y - wall.start_point.y;
      const wallLen = Math.sqrt(dx * dx + dy * dy);
      if (wallLen < 1) return false;

      // Distance from point to line segment
      const t = Math.max(0, Math.min(1,
        ((pos.x - wall.start_point.x) * dx + (pos.y - wall.start_point.y) * dy) / (wallLen * wallLen)
      ));
      const projX = wall.start_point.x + t * dx;
      const projY = wall.start_point.y + t * dy;
      const dist = Math.sqrt((pos.x - projX) ** 2 + (pos.y - projY) ** 2);

      return dist < (wall.thickness || 230);
    });

    if (!isOnWall) {
      issues.push({
        type,
        element: opening,
        message: `${type} "${opening.name || ''}" is not placed on a wall`,
      });
    }
  };

  (doors || []).forEach(d => checkOnWall(d, 'door'));
  (windows || []).forEach(w => checkOnWall(w, 'window'));

  return issues;
}

/**
 * Auto cost estimation from elements and material library.
 */
export function estimateCost(elements, materialLibrary = []) {
  const costs = {
    walls: 0,
    columns: 0,
    beams: 0,
    doors: 0,
    windows: 0,
    stairs: 0,
    furniture: 0,
    total: 0,
    breakdown: [],
  };

  // Wall cost: length × height × thickness × rate
  (elements.walls || []).forEach(wall => {
    if (!wall?.start_point || !wall?.end_point) return;
    const dx = wall.end_point.x - wall.start_point.x;
    const dy = wall.end_point.y - wall.start_point.y;
    const length = Math.sqrt(dx * dx + dy * dy) / 1000; // meters
    const height = (wall.height || 3000) / 1000;
    const thickness = (wall.thickness || 230) / 1000;
    const volume = length * height * thickness; // cubic meters
    const rate = wall.bim?.cost_per_sqm || 4500; // Rs per sqm
    const area = length * height;
    const cost = area * rate;
    costs.walls += cost;
    costs.breakdown.push({ type: 'wall', name: wall.name || wall.wall_type, area: area.toFixed(2), cost: Math.round(cost) });
  });

  // Column cost
  (elements.columns || []).forEach(col => {
    if (!col?.position) return;
    const w = (col.width || 300) / 1000;
    const d = (col.depth || col.width || 300) / 1000;
    const h = (col.height || 3000) / 1000;
    const volume = w * d * h;
    const rate = 8000; // Rs per cum for RCC column
    const cost = volume * rate;
    costs.columns += cost;
    costs.breakdown.push({ type: 'column', name: col.name || `${col.width}×${col.depth}`, volume: volume.toFixed(3), cost: Math.round(cost) });
  });

  // Door cost (unit basis)
  (elements.doors || []).forEach(door => {
    const cost = door.bim?.cost || 8000;
    costs.doors += cost;
    costs.breakdown.push({ type: 'door', name: door.name || door.door_type, cost: Math.round(cost) });
  });

  // Window cost (unit basis)
  (elements.windows || []).forEach(win => {
    const cost = win.bim?.cost || 6000;
    costs.windows += cost;
    costs.breakdown.push({ type: 'window', name: win.name || win.window_type, cost: Math.round(cost) });
  });

  costs.total = costs.walls + costs.columns + costs.beams + costs.doors + costs.windows + costs.stairs + costs.furniture;

  return costs;
}

/**
 * Snap angle to nearest 45° increment.
 */
export function snapAngle(angle, snapDegrees = 45) {
  const snap = (snapDegrees * Math.PI) / 180;
  return Math.round(angle / snap) * snap;
}

/**
 * Snap point to grid.
 */
export function snapToGrid(point, gridSize = 100) {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

/**
 * Calculate quantity takeoff from all elements.
 */
export function quantityTakeoff(elements) {
  const takeoff = {
    walls: { count: 0, totalLength: 0, totalArea: 0, totalVolume: 0 },
    columns: { count: 0, totalVolume: 0 },
    beams: { count: 0, totalLength: 0, totalVolume: 0 },
    doors: { count: 0, byType: {} },
    windows: { count: 0, byType: {} },
    stairs: { count: 0 },
    furniture: { count: 0, byType: {} },
    rooms: { count: 0, totalArea: 0 },
  };

  (elements.walls || []).forEach(wall => {
    if (!wall?.start_point || !wall?.end_point) return;
    takeoff.walls.count++;
    const dx = wall.end_point.x - wall.start_point.x;
    const dy = wall.end_point.y - wall.start_point.y;
    const length = Math.sqrt(dx * dx + dy * dy) / 1000;
    const height = (wall.height || 3000) / 1000;
    const thickness = (wall.thickness || 230) / 1000;
    takeoff.walls.totalLength += length;
    takeoff.walls.totalArea += length * height;
    takeoff.walls.totalVolume += length * height * thickness;
  });

  (elements.columns || []).forEach(col => {
    if (!col?.position) return;
    takeoff.columns.count++;
    const w = (col.width || 300) / 1000;
    const d = (col.depth || col.width || 300) / 1000;
    const h = (col.height || 3000) / 1000;
    takeoff.columns.totalVolume += w * d * h;
  });

  (elements.doors || []).forEach(door => {
    takeoff.doors.count++;
    const type = door.door_type || 'single';
    takeoff.doors.byType[type] = (takeoff.doors.byType[type] || 0) + 1;
  });

  (elements.windows || []).forEach(win => {
    takeoff.windows.count++;
    const type = win.window_type || 'casement';
    takeoff.windows.byType[type] = (takeoff.windows.byType[type] || 0) + 1;
  });

  takeoff.stairs.count = (elements.stairs || []).length;

  (elements.furniture || []).forEach(fur => {
    takeoff.furniture.count++;
    const type = fur.type || 'other';
    takeoff.furniture.byType[type] = (takeoff.furniture.byType[type] || 0) + 1;
  });

  takeoff.rooms.count = (elements.rooms || []).length;

  return takeoff;
}
