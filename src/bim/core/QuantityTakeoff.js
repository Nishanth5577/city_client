// ═══════════════════════════════════════════════════════════════
// Quantity Takeoff — Calculate areas/volumes from BIM geometry
// All computed from live BIM data, never hardcoded
// ═══════════════════════════════════════════════════════════════

const S = 0.001; // mm to meters

/**
 * Calculate all quantities from current BIM state
 * @param {object} state - Current bimStore state
 * @returns {object} Quantity summary
 */
export function calculateQuantities(state) {
  const { floors, walls, doors, windows, rooms, slabs, roofs, stairs, columns, beams, furniture } = state;

  const quantities = {
    floors: [],
    totals: {
      wallArea: 0, wallVolume: 0, wallLength: 0,
      floorArea: 0, ceilingArea: 0,
      slabVolume: 0,
      roofArea: 0,
      paintArea: 0,
      tileArea: 0,
      concreteVolume: 0,
      doorCount: 0, windowCount: 0,
      stairCount: 0,
      columnCount: 0, beamCount: 0,
      furnitureCount: 0,
      roomCount: 0,
    },
  };

  for (const floor of floors) {
    const fid = floor.id;
    const fWalls = walls[fid] || [];
    const fDoors = doors[fid] || [];
    const fWindows = windows[fid] || [];
    const fRooms = rooms[fid] || [];
    const fSlabs = slabs[fid] || [];
    const fStairs = stairs[fid] || [];
    const fColumns = columns[fid] || [];
    const fBeams = beams[fid] || [];
    const fFurniture = furniture[fid] || [];

    const floorData = {
      name: floor.name,
      id: fid,
      walls: { count: fWalls.length, totalLength: 0, totalArea: 0, totalVolume: 0 },
      rooms: { count: fRooms.length, totalArea: 0, totalVolume: 0, items: [] },
      doors: { count: fDoors.length },
      windows: { count: fWindows.length },
      slabs: { count: fSlabs.length, totalVolume: 0 },
      stairs: { count: fStairs.length },
      columns: { count: fColumns.length },
      beams: { count: fBeams.length },
      furniture: { count: fFurniture.length },
      paintArea: 0,
      tileArea: 0,
    };

    // Walls
    for (const wall of fWalls) {
      const dx = (wall.end.x - wall.start.x) * S;
      const dy = (wall.end.y - wall.start.y) * S;
      const length = Math.sqrt(dx * dx + dy * dy);
      const height = (wall.height || 3000) * S;
      const thickness = (wall.thickness || 230) * S;
      const area = length * height;
      const volume = area * thickness;

      floorData.walls.totalLength += length;
      floorData.walls.totalArea += area;
      floorData.walls.totalVolume += volume;

      // Calculate door/window openings area for this wall
      let openingArea = 0;
      for (const door of fDoors) {
        if (door.wallId === wall.id) {
          openingArea += (door.width || 900) * S * (door.height || 2100) * S;
        }
      }
      for (const win of fWindows) {
        if (win.wallId === wall.id) {
          openingArea += (win.width || 1200) * S * (win.height || 1200) * S;
        }
      }

      // Paint area = both sides minus openings
      const paintableSides = wall.wallType === 'exterior' ? 1 : 2;
      floorData.paintArea += (area - openingArea) * paintableSides;
    }

    // Rooms
    for (const room of fRooms) {
      const area = (room.area || 0) / 1e6; // mm² to m²
      const cHeight = (room.ceilingHeight || 3000) * S;
      const volume = area * cHeight;
      
      floorData.rooms.totalArea += area;
      floorData.rooms.totalVolume += volume;
      floorData.rooms.items.push({
        name: room.name, type: room.roomType, area, volume,
      });

      // Tile area for tiled rooms
      const tiledTypes = ['kitchen', 'bathroom', 'toilet', 'utility', 'balcony'];
      if (tiledTypes.includes(room.roomType)) {
        floorData.tileArea += area;
      }
    }

    // Slabs
    for (const slab of fSlabs) {
      const slabArea = (slab.boundary || []).length > 0
        ? calculatePolygonArea(slab.boundary) / 1e6
        : 0;
      const thickness = (slab.thickness || 150) * S;
      floorData.slabs.totalVolume += slabArea * thickness;
    }

    // Accumulate
    quantities.floors.push(floorData);
    quantities.totals.wallArea += floorData.walls.totalArea;
    quantities.totals.wallVolume += floorData.walls.totalVolume;
    quantities.totals.wallLength += floorData.walls.totalLength;
    quantities.totals.floorArea += floorData.rooms.totalArea;
    quantities.totals.paintArea += floorData.paintArea;
    quantities.totals.tileArea += floorData.tileArea;
    quantities.totals.slabVolume += floorData.slabs.totalVolume;
    quantities.totals.doorCount += floorData.doors.count;
    quantities.totals.windowCount += floorData.windows.count;
    quantities.totals.stairCount += floorData.stairs.count;
    quantities.totals.columnCount += floorData.columns.count;
    quantities.totals.beamCount += floorData.beams.count;
    quantities.totals.furnitureCount += floorData.furniture.count;
    quantities.totals.roomCount += floorData.rooms.count;
  }

  // Concrete volume = slabs + columns + beams
  for (const floor of floors) {
    const fColumns = columns[floor.id] || [];
    const fBeams = beams[floor.id] || [];
    for (const col of fColumns) {
      const w = (col.width || 300) * S;
      const d = (col.depth || 300) * S;
      const h = (col.height || 3000) * S;
      quantities.totals.concreteVolume += w * d * h;
    }
    for (const beam of fBeams) {
      if (!beam.start || !beam.end) continue;
      const dx = (beam.end.x - beam.start.x) * S;
      const dy = (beam.end.y - beam.start.y) * S;
      const length = Math.sqrt(dx * dx + dy * dy);
      const w = (beam.width || 230) * S;
      const d = (beam.depth || 450) * S;
      quantities.totals.concreteVolume += length * w * d;
    }
  }
  quantities.totals.concreteVolume += quantities.totals.slabVolume;

  // Roof area
  const buildingRoofs = roofs['building'] || [];
  for (const roof of buildingRoofs) {
    const roofArea = (roof.boundary || []).length > 0
      ? calculatePolygonArea(roof.boundary) / 1e6
      : 0;
    quantities.totals.roofArea += roofArea;
  }

  return quantities;
}

// Shoelace formula for polygon area
function calculatePolygonArea(boundary) {
  if (!boundary || boundary.length < 3) return 0;
  let area = 0;
  const n = boundary.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += boundary[i].x * boundary[j].y;
    area -= boundary[j].x * boundary[i].y;
  }
  return Math.abs(area) / 2;
}

/**
 * Get a summary string for display
 */
export function getQuantitySummary(quantities) {
  const t = quantities.totals;
  return [
    `${t.roomCount} Rooms · ${t.floorArea.toFixed(1)} m² Total Area`,
    `${t.wallLength.toFixed(1)} m Wall Length · ${t.wallArea.toFixed(1)} m² Wall Area`,
    `${t.paintArea.toFixed(1)} m² Paint Area · ${t.tileArea.toFixed(1)} m² Tile Area`,
    `${t.doorCount} Doors · ${t.windowCount} Windows`,
    `${t.concreteVolume.toFixed(2)} m³ Concrete`,
    `${t.furnitureCount} Furniture Items`,
  ].join('\n');
}
