// ═══════════════════════════════════════════════════════════════
// BIM Geometry Utilities — 2D calculations for floor plan editor
// ═══════════════════════════════════════════════════════════════

/** Snap value to nearest grid increment */
export const snapToGrid = (value, gridSize) => Math.round(value / gridSize) * gridSize;

/** Distance between two points */
export const distance = (p1, p2) => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

/** Angle between two points in radians */
export const angle = (p1, p2) => Math.atan2(p2.y - p1.y, p2.x - p1.x);

/** Angle in degrees */
export const angleDeg = (p1, p2) => (angle(p1, p2) * 180) / Math.PI;

/** Midpoint of two points */
export const midpoint = (p1, p2) => ({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });

/** Point on line at distance from start */
export const pointOnLine = (start, end, dist) => {
  const len = distance(start, end);
  if (len === 0) return { ...start };
  const t = dist / len;
  return { x: start.x + t * (end.x - start.x), y: start.y + t * (end.y - start.y) };
};

/** Perpendicular offset points for wall thickness */
export const wallOffsetPoints = (start, end, thickness) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { left: { ...start }, right: { ...start } };
  const nx = -dy / len;
  const ny = dx / len;
  const half = thickness / 2;
  return {
    topLeft: { x: start.x + nx * half, y: start.y + ny * half },
    topRight: { x: end.x + nx * half, y: end.y + ny * half },
    bottomRight: { x: end.x - nx * half, y: end.y - ny * half },
    bottomLeft: { x: start.x - nx * half, y: start.y - ny * half },
  };
};

/** Check if point is near a line segment (within threshold) */
export const pointNearLine = (point, lineStart, lineEnd, threshold = 10) => {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = lenSq !== 0 ? dot / lenSq : -1;
  param = Math.max(0, Math.min(1, param));
  const xx = lineStart.x + param * C;
  const yy = lineStart.y + param * D;
  const dist = Math.sqrt((point.x - xx) ** 2 + (point.y - yy) ** 2);
  return dist <= threshold;
};

/** Polygon area (Shoelace formula) */
export const polygonArea = (points) => {
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
};

/** Polygon perimeter */
export const polygonPerimeter = (points) => {
  let perimeter = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    perimeter += distance(points[i], points[j]);
  }
  return perimeter;
};

/** Check if point is inside polygon */
export const pointInPolygon = (point, polygon) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

/** Line-line intersection */
export const lineIntersection = (p1, p2, p3, p4) => {
  const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y;
  const x3 = p3.x, y3 = p3.y, x4 = p4.x, y4 = p4.y;
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 1e-10) return null;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
  }
  return null;
};

/** Convert mm to display pixels */
export const mmToPixels = (mm, scale = 0.1) => mm * scale;

/** Convert display pixels to mm */
export const pixelsToMm = (px, scale = 0.1) => px / scale;

/** Format mm as human readable */
export const formatMeasurement = (mm) => {
  if (mm >= 1000) return `${(mm / 1000).toFixed(2)}m`;
  return `${Math.round(mm)}mm`;
};

/** Calculate wall area in sqm */
export const wallArea = (start, end, height) => {
  const len = distance(start, end);
  return (len * height) / 1e6; // mm² to m²
};

/** Calculate room area from walls */
export const calculateRoomArea = (boundaryPoints) => {
  if (!boundaryPoints || boundaryPoints.length < 3) return 0;
  return polygonArea(boundaryPoints) / 1e6; // mm² to m²
};

/** Rotate point around center */
export const rotatePoint = (point, center, angleDeg) => {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
};

/** Mirror point across axis */
export const mirrorPoint = (point, axisStart, axisEnd) => {
  const dx = axisEnd.x - axisStart.x;
  const dy = axisEnd.y - axisStart.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { ...point };
  const t = ((point.x - axisStart.x) * dx + (point.y - axisStart.y) * dy) / lenSq;
  const projX = axisStart.x + t * dx;
  const projY = axisStart.y + t * dy;
  return { x: 2 * projX - point.x, y: 2 * projY - point.y };
};

/** Get bounding box of elements */
export const getBoundingBox = (elements) => {
  if (!elements.length) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  elements.forEach(el => {
    const points = el.start_point && el.end_point
      ? [el.start_point, el.end_point]
      : [el.position || { x: 0, y: 0 }];
    points.forEach(p => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + (el.width || 0));
      maxY = Math.max(maxY, p.y + (el.depth || el.height || 0));
    });
  });
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};
