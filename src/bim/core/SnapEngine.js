// ═══════════════════════════════════════════════════════════════
// Snap Engine — Professional snapping system
// Supports: grid, endpoint, midpoint, center, wall, corner,
// face, object, room boundary, level
// Shows temporary snap indicators and dimensions
// ═══════════════════════════════════════════════════════════════

const SNAP_TOLERANCE = 150; // mm — how close to snap
const GRID_DEFAULT = 100; // mm

export const SNAP_TYPES = {
  GRID: 'grid',
  ENDPOINT: 'endpoint',
  MIDPOINT: 'midpoint',
  CENTER: 'center',
  WALL: 'wall',
  CORNER: 'corner',
  PERPENDICULAR: 'perpendicular',
  INTERSECTION: 'intersection',
  NEAREST: 'nearest',
};

export class SnapResult {
  constructor(point, type, sourceId = null, distance = 0) {
    this.point = { x: point.x, y: point.y };
    this.type = type;
    this.sourceId = sourceId;
    this.distance = distance;
    this.snapped = true;
  }
}

export class SnapEngine {
  constructor(options = {}) {
    this.enabled = options.enabled !== undefined ? options.enabled : true;
    this.gridSize = options.gridSize || GRID_DEFAULT;
    this.tolerance = options.tolerance || SNAP_TOLERANCE;
    this.activeSnaps = {
      [SNAP_TYPES.GRID]: true,
      [SNAP_TYPES.ENDPOINT]: true,
      [SNAP_TYPES.MIDPOINT]: true,
      [SNAP_TYPES.CENTER]: true,
      [SNAP_TYPES.WALL]: true,
      [SNAP_TYPES.CORNER]: true,
      [SNAP_TYPES.PERPENDICULAR]: true,
      [SNAP_TYPES.INTERSECTION]: true,
      [SNAP_TYPES.NEAREST]: false,
    };
    this.walls = [];
    this.columns = [];
    this.rooms = [];
    this.lastSnap = null;
    this.guidelines = []; // temporary drawing guidelines
  }

  setElements(elements) {
    this.walls = elements.walls || [];
    this.columns = elements.columns || [];
    this.rooms = elements.rooms || [];
  }

  setGridSize(size) {
    this.gridSize = size;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  toggleSnapType(type) {
    if (this.activeSnaps[type] !== undefined) {
      this.activeSnaps[type] = !this.activeSnaps[type];
    }
  }

  // Main snap method — finds best snap point
  snap(rawPoint, excludeIds = []) {
    if (!this.enabled) {
      this.lastSnap = null;
      return rawPoint;
    }

    const candidates = [];

    // Collect all snap candidates
    if (this.activeSnaps[SNAP_TYPES.ENDPOINT]) {
      candidates.push(...this._getEndpointSnaps(rawPoint, excludeIds));
    }
    if (this.activeSnaps[SNAP_TYPES.MIDPOINT]) {
      candidates.push(...this._getMidpointSnaps(rawPoint, excludeIds));
    }
    if (this.activeSnaps[SNAP_TYPES.CENTER]) {
      candidates.push(...this._getCenterSnaps(rawPoint));
    }
    if (this.activeSnaps[SNAP_TYPES.WALL]) {
      candidates.push(...this._getWallSnaps(rawPoint, excludeIds));
    }
    if (this.activeSnaps[SNAP_TYPES.INTERSECTION]) {
      candidates.push(...this._getIntersectionSnaps(rawPoint));
    }
    if (this.activeSnaps[SNAP_TYPES.PERPENDICULAR]) {
      candidates.push(...this._getPerpendicularSnaps(rawPoint, excludeIds));
    }

    // Find closest candidate within tolerance
    let best = null;
    let bestDist = this.tolerance;

    // Priority: endpoint > midpoint > intersection > perpendicular > wall > center > grid
    const priority = {
      [SNAP_TYPES.ENDPOINT]: 0,
      [SNAP_TYPES.MIDPOINT]: 1,
      [SNAP_TYPES.INTERSECTION]: 2,
      [SNAP_TYPES.PERPENDICULAR]: 3,
      [SNAP_TYPES.WALL]: 4,
      [SNAP_TYPES.CENTER]: 5,
      [SNAP_TYPES.CORNER]: 0,
    };

    for (const snap of candidates) {
      const adjustedDist = snap.distance + (priority[snap.type] || 0) * 10;
      if (snap.distance <= this.tolerance && adjustedDist < bestDist + (priority[best?.type] || 0) * 10) {
        best = snap;
        bestDist = adjustedDist;
      }
    }

    if (best) {
      this.lastSnap = best;
      return best.point;
    }

    // Fall back to grid snap
    if (this.activeSnaps[SNAP_TYPES.GRID]) {
      const gridPoint = this._snapToGrid(rawPoint);
      this.lastSnap = new SnapResult(gridPoint, SNAP_TYPES.GRID, null, 0);
      return gridPoint;
    }

    this.lastSnap = null;
    return rawPoint;
  }

  // ─── Grid ────────────────────────────────────────────────────
  _snapToGrid(point) {
    return {
      x: Math.round(point.x / this.gridSize) * this.gridSize,
      y: Math.round(point.y / this.gridSize) * this.gridSize,
    };
  }

  // ─── Endpoints (wall start/end) ──────────────────────────────
  _getEndpointSnaps(point, excludeIds) {
    const results = [];
    for (const wall of this.walls) {
      if (excludeIds.includes(wall._id || wall.canvas_id)) continue;
      if (!wall.start_point || !wall.end_point) continue;

      const d1 = this._dist(point, wall.start_point);
      if (d1 <= this.tolerance) {
        results.push(new SnapResult(wall.start_point, SNAP_TYPES.ENDPOINT, wall._id || wall.canvas_id, d1));
      }

      const d2 = this._dist(point, wall.end_point);
      if (d2 <= this.tolerance) {
        results.push(new SnapResult(wall.end_point, SNAP_TYPES.ENDPOINT, wall._id || wall.canvas_id, d2));
      }
    }
    // Column centers
    for (const col of this.columns) {
      if (!col.position) continue;
      const d = this._dist(point, col.position);
      if (d <= this.tolerance) {
        results.push(new SnapResult(col.position, SNAP_TYPES.CENTER, col._id || col.canvas_id, d));
      }
    }
    return results;
  }

  // ─── Midpoints ───────────────────────────────────────────────
  _getMidpointSnaps(point, excludeIds) {
    const results = [];
    for (const wall of this.walls) {
      if (excludeIds.includes(wall._id || wall.canvas_id)) continue;
      if (!wall.start_point || !wall.end_point) continue;

      const mid = {
        x: (wall.start_point.x + wall.end_point.x) / 2,
        y: (wall.start_point.y + wall.end_point.y) / 2,
      };
      const d = this._dist(point, mid);
      if (d <= this.tolerance) {
        results.push(new SnapResult(mid, SNAP_TYPES.MIDPOINT, wall._id || wall.canvas_id, d));
      }
    }
    return results;
  }

  // ─── Centers (rooms, columns) ────────────────────────────────
  _getCenterSnaps(point) {
    const results = [];
    for (const room of this.rooms) {
      if (room.boundary && room.boundary.length >= 3) {
        const cx = room.boundary.reduce((s, p) => s + p.x, 0) / room.boundary.length;
        const cy = room.boundary.reduce((s, p) => s + p.y, 0) / room.boundary.length;
        const d = this._dist(point, { x: cx, y: cy });
        if (d <= this.tolerance) {
          results.push(new SnapResult({ x: cx, y: cy }, SNAP_TYPES.CENTER, room._id || room.canvas_id, d));
        }
      }
    }
    return results;
  }

  // ─── Wall line snap (closest point on wall) ──────────────────
  _getWallSnaps(point, excludeIds) {
    const results = [];
    for (const wall of this.walls) {
      if (excludeIds.includes(wall._id || wall.canvas_id)) continue;
      if (!wall.start_point || !wall.end_point) continue;

      const closest = this._closestPointOnSegment(point, wall.start_point, wall.end_point);
      if (closest) {
        const d = this._dist(point, closest);
        if (d <= this.tolerance) {
          results.push(new SnapResult(closest, SNAP_TYPES.WALL, wall._id || wall.canvas_id, d));
        }
      }
    }
    return results;
  }

  // ─── Intersections (where walls cross) ───────────────────────
  _getIntersectionSnaps(point) {
    const results = [];
    for (let i = 0; i < this.walls.length; i++) {
      for (let j = i + 1; j < this.walls.length; j++) {
        const w1 = this.walls[i], w2 = this.walls[j];
        if (!w1?.start_point || !w2?.start_point) continue;
        const ix = this._lineIntersection(w1.start_point, w1.end_point, w2.start_point, w2.end_point);
        if (ix) {
          const d = this._dist(point, ix);
          if (d <= this.tolerance) {
            results.push(new SnapResult(ix, SNAP_TYPES.INTERSECTION, null, d));
          }
        }
      }
    }
    return results;
  }

  // ─── Perpendicular snap ──────────────────────────────────────
  _getPerpendicularSnaps(point, excludeIds) {
    const results = [];
    for (const wall of this.walls) {
      if (excludeIds.includes(wall._id || wall.canvas_id)) continue;
      if (!wall.start_point || !wall.end_point) continue;
      const perp = this._perpendicularPoint(point, wall.start_point, wall.end_point);
      if (perp) {
        const d = this._dist(point, perp);
        if (d <= this.tolerance) {
          results.push(new SnapResult(perp, SNAP_TYPES.PERPENDICULAR, wall._id || wall.canvas_id, d));
        }
      }
    }
    return results;
  }

  // ─── Geometry helpers ────────────────────────────────────────
  _dist(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  _closestPointOnSegment(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    if (len2 < 1) return null;
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return { x: a.x + t * dx, y: a.y + t * dy };
  }

  _perpendicularPoint(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    if (len2 < 1) return null;
    const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
    if (t < 0 || t > 1) return null;
    return { x: a.x + t * dx, y: a.y + t * dy };
  }

  _lineIntersection(a1, a2, b1, b2) {
    const d1x = a2.x - a1.x, d1y = a2.y - a1.y;
    const d2x = b2.x - b1.x, d2y = b2.y - b1.y;
    const cross = d1x * d2y - d1y * d2x;
    if (Math.abs(cross) < 0.001) return null;
    const t = ((b1.x - a1.x) * d2y - (b1.y - a1.y) * d2x) / cross;
    const u = ((b1.x - a1.x) * d1y - (b1.y - a1.y) * d1x) / cross;
    if (t < -0.01 || t > 1.01 || u < -0.01 || u > 1.01) return null;
    return { x: a1.x + t * d1x, y: a1.y + t * d1y };
  }

  // ─── Get snap indicator info for rendering ───────────────────
  getSnapIndicator() {
    if (!this.lastSnap) return null;
    const colors = {
      [SNAP_TYPES.ENDPOINT]: '#00FF00',
      [SNAP_TYPES.MIDPOINT]: '#00CCFF',
      [SNAP_TYPES.CENTER]: '#FFAA00',
      [SNAP_TYPES.WALL]: '#FF6600',
      [SNAP_TYPES.CORNER]: '#00FF00',
      [SNAP_TYPES.PERPENDICULAR]: '#FF00FF',
      [SNAP_TYPES.INTERSECTION]: '#FF0000',
      [SNAP_TYPES.GRID]: '#6B7280',
      [SNAP_TYPES.NEAREST]: '#FFFFFF',
    };
    const icons = {
      [SNAP_TYPES.ENDPOINT]: '◆',
      [SNAP_TYPES.MIDPOINT]: '△',
      [SNAP_TYPES.CENTER]: '⊕',
      [SNAP_TYPES.WALL]: '⊥',
      [SNAP_TYPES.CORNER]: '⊾',
      [SNAP_TYPES.PERPENDICULAR]: '⊥',
      [SNAP_TYPES.INTERSECTION]: '✕',
      [SNAP_TYPES.GRID]: '·',
      [SNAP_TYPES.NEAREST]: '○',
    };
    return {
      point: this.lastSnap.point,
      type: this.lastSnap.type,
      color: colors[this.lastSnap.type] || '#FFFFFF',
      icon: icons[this.lastSnap.type] || '·',
    };
  }

  // ─── Calculate and return drawing guidelines ─────────────────
  getGuidelines(drawingStart, currentPoint) {
    if (!drawingStart) return [];
    const guidelines = [];
    const dx = currentPoint.x - drawingStart.x;
    const dy = currentPoint.y - drawingStart.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Show dimension
    guidelines.push({
      type: 'dimension',
      start: drawingStart,
      end: currentPoint,
      value: dist,
    });

    // Horizontal/vertical alignment guides
    if (Math.abs(dy) < 50) {
      guidelines.push({
        type: 'horizontal',
        y: drawingStart.y,
        x1: Math.min(drawingStart.x, currentPoint.x) - 500,
        x2: Math.max(drawingStart.x, currentPoint.x) + 500,
      });
    }
    if (Math.abs(dx) < 50) {
      guidelines.push({
        type: 'vertical',
        x: drawingStart.x,
        y1: Math.min(drawingStart.y, currentPoint.y) - 500,
        y2: Math.max(drawingStart.y, currentPoint.y) + 500,
      });
    }

    // Angular guidelines (45°, 90°)
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const snapAngle = Math.round(angle / 45) * 45;
    if (Math.abs(angle - snapAngle) < 5) {
      guidelines.push({
        type: 'angular',
        angle: snapAngle,
        start: drawingStart,
        length: dist,
      });
    }

    return guidelines;
  }
}

// Singleton
let _snapEngine = null;
export function getSnapEngine() {
  if (!_snapEngine) _snapEngine = new SnapEngine();
  return _snapEngine;
}

export default SnapEngine;
