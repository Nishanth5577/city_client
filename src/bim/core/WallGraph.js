// ═══════════════════════════════════════════════════════════════
// Wall Graph — Manages wall connectivity & intersections
// Clean T and L junction detection, wall trimming,
// room boundary detection from wall loops
// ═══════════════════════════════════════════════════════════════

const EPSILON = 0.5; // mm tolerance for point matching

export class WallNode {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.wallIds = new Set(); // walls connected to this node
  }

  distanceTo(other) {
    return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
  }

  matches(x, y, tolerance = EPSILON) {
    return Math.abs(this.x - x) < tolerance && Math.abs(this.y - y) < tolerance;
  }
}

export class WallEdge {
  constructor(wallId, startNode, endNode, thickness = 230) {
    this.wallId = wallId;
    this.startNode = startNode;
    this.endNode = endNode;
    this.thickness = thickness;
  }

  get length() {
    return this.startNode.distanceTo(this.endNode);
  }

  get angle() {
    return Math.atan2(
      this.endNode.y - this.startNode.y,
      this.endNode.x - this.startNode.x
    );
  }

  get midpoint() {
    return {
      x: (this.startNode.x + this.endNode.x) / 2,
      y: (this.startNode.y + this.endNode.y) / 2,
    };
  }
}

export class WallGraph {
  constructor() {
    this.nodes = [];
    this.edges = [];
    this._nodeMap = new Map(); // for fast lookup
  }

  // Build graph from wall array
  static fromWalls(walls) {
    const graph = new WallGraph();
    if (!walls || walls.length === 0) return graph;

    for (const wall of walls) {
      if (!wall?.start_point || !wall?.end_point) continue;
      const wallId = wall._id || wall.canvas_id || wall.id;

      const startNode = graph.findOrCreateNode(wall.start_point.x, wall.start_point.y);
      const endNode = graph.findOrCreateNode(wall.end_point.x, wall.end_point.y);

      startNode.wallIds.add(wallId);
      endNode.wallIds.add(wallId);

      const edge = new WallEdge(wallId, startNode, endNode, wall.thickness || 230);
      graph.edges.push(edge);
    }

    return graph;
  }

  findOrCreateNode(x, y, tolerance = 50) {
    // Check existing nodes
    for (const node of this.nodes) {
      if (node.matches(x, y, tolerance)) {
        return node;
      }
    }
    // Create new node
    const node = new WallNode(x, y);
    this.nodes.push(node);
    return node;
  }

  // Find all nodes where 3+ walls meet (T/X junctions)
  getJunctions() {
    return this.nodes.filter(n => n.wallIds.size >= 3);
  }

  // Find all nodes where exactly 2 walls meet (corners/L junctions)
  getCorners() {
    return this.nodes.filter(n => n.wallIds.size === 2);
  }

  // Find all endpoints (degree 1)
  getEndpoints() {
    return this.nodes.filter(n => n.wallIds.size === 1);
  }

  // Get all walls connected to a node
  getWallsAtNode(node) {
    return this.edges.filter(e =>
      e.startNode === node || e.endNode === node
    );
  }

  // Get angle between two walls meeting at a node
  getAngleBetweenWalls(edge1, edge2, node) {
    let angle1 = edge1.startNode === node ? edge1.angle : edge1.angle + Math.PI;
    let angle2 = edge2.startNode === node ? edge2.angle : edge2.angle + Math.PI;
    let diff = angle2 - angle1;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return diff;
  }

  // Detect room boundaries by following wall loops
  detectRoomLoops() {
    const loops = [];
    const visitedEdgePairs = new Set();

    for (const startNode of this.nodes) {
      if (startNode.wallIds.size < 2) continue;

      const connectedEdges = this.getWallsAtNode(startNode);

      for (const startEdge of connectedEdges) {
        const pairKey = `${startNode.x},${startNode.y}-${startEdge.wallId}`;
        if (visitedEdgePairs.has(pairKey)) continue;

        const loop = this._traceLoop(startNode, startEdge);
        if (loop && loop.length >= 3) {
          const loopKey = loop.map(n => `${Math.round(n.x)},${Math.round(n.y)}`).sort().join('|');
          if (!loops.some(l => l.key === loopKey)) {
            loops.push({
              key: loopKey,
              nodes: loop,
              boundary: loop.map(n => ({ x: n.x, y: n.y })),
            });
          }
        }

        visitedEdgePairs.add(pairKey);
      }
    }

    return loops;
  }

  // Trace a loop from a starting node/edge by always turning left (or right)
  _traceLoop(startNode, startEdge, maxSteps = 20) {
    const path = [startNode];
    let currentNode = startNode;
    let currentEdge = startEdge;
    let nextNode = currentEdge.startNode === currentNode ? currentEdge.endNode : currentEdge.startNode;

    for (let step = 0; step < maxSteps; step++) {
      path.push(nextNode);

      if (nextNode === startNode && step > 0) {
        return path.slice(0, -1); // Closed loop
      }

      // Find the next edge — take the leftmost turn
      const edges = this.getWallsAtNode(nextNode).filter(e => e !== currentEdge);
      if (edges.length === 0) return null; // Dead end

      let bestEdge = null;
      let bestAngle = -Infinity;

      const incomingAngle = Math.atan2(
        nextNode.y - currentNode.y,
        nextNode.x - currentNode.x
      );

      for (const edge of edges) {
        const otherNode = edge.startNode === nextNode ? edge.endNode : edge.startNode;
        let outAngle = Math.atan2(
          otherNode.y - nextNode.y,
          otherNode.x - nextNode.x
        );
        // Calculate turn angle (positive = left turn)
        let turn = outAngle - incomingAngle;
        while (turn > Math.PI) turn -= 2 * Math.PI;
        while (turn <= -Math.PI) turn += 2 * Math.PI;

        if (turn > bestAngle || !bestEdge) {
          bestAngle = turn;
          bestEdge = edge;
        }
      }

      currentNode = nextNode;
      currentEdge = bestEdge;
      nextNode = bestEdge.startNode === currentNode ? bestEdge.endNode : bestEdge.startNode;
    }

    return null; // Exceeded max steps
  }

  // Calculate wall intersection geometry for clean corners
  getIntersectionData(nodeIndex) {
    const node = this.nodes[nodeIndex];
    if (!node) return null;
    const edges = this.getWallsAtNode(node);
    if (edges.length < 2) return null;

    const angles = edges.map(e => {
      const angle = e.startNode === node ? e.angle : e.angle + Math.PI;
      return { edge: e, angle: ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) };
    }).sort((a, b) => a.angle - b.angle);

    return {
      node,
      type: edges.length === 2 ? 'L' : edges.length === 3 ? 'T' : 'X',
      edges: angles,
    };
  }

  // Get all wall intersection adjustments (for clean wall drawing)
  getWallTrims() {
    const trims = {};

    for (const node of this.nodes) {
      const edges = this.getWallsAtNode(node);
      if (edges.length < 2) continue;

      for (const edge of edges) {
        const isStart = edge.startNode === node;
        const wallId = edge.wallId;

        // Calculate how much to extend/trim this wall at this junction
        // For L-joints: extend to meet
        // For T-joints: extend through wall to main wall face
        const otherEdges = edges.filter(e => e !== edge);
        let maxExtension = 0;

        for (const other of otherEdges) {
          const halfThickness = other.thickness / 2;
          const relAngle = Math.abs(this.getAngleBetweenWalls(edge, other, node));
          const extension = halfThickness / Math.abs(Math.sin(relAngle || 0.001));
          maxExtension = Math.max(maxExtension, Math.min(extension, other.thickness));
        }

        if (!trims[wallId]) trims[wallId] = { startExtend: 0, endExtend: 0 };
        if (isStart) {
          trims[wallId].startExtend = maxExtension;
        } else {
          trims[wallId].endExtend = maxExtension;
        }
      }
    }

    return trims;
  }
}

export default WallGraph;
