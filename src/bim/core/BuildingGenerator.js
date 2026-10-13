// ═══════════════════════════════════════════════════════════════
// Building Generator — Parametric Building Creation Engine
// Generates complete buildings from configuration parameters
// Produces: Site → Floors → Rooms → Walls → Doors → Windows →
//           Stairs → Slabs → Roof → ready for 3D rendering
// ═══════════════════════════════════════════════════════════════
import { v4 as uuid } from 'uuid';
import { DEFAULTS, ROOM_TYPES, ROOM_COLORS, ROOF_TYPES, ROOM_FLOOR_MATERIALS, MM_TO_M } from '../../stores/bimTypes';
import { furnishAllRooms } from './RoomFurnishingSystem';

// ─── Room Layout Standards (mm) ────────────────────────────────
const ROOM_STANDARDS = {
  [ROOM_TYPES.LIVING_ROOM]:    { minW: 4000, minD: 4000, ratio: 0.22 },
  [ROOM_TYPES.KITCHEN]:        { minW: 2700, minD: 2700, ratio: 0.10 },
  [ROOM_TYPES.DINING_ROOM]:    { minW: 3000, minD: 3000, ratio: 0.10 },
  [ROOM_TYPES.MASTER_BEDROOM]: { minW: 3600, minD: 3600, ratio: 0.16 },
  [ROOM_TYPES.BEDROOM]:        { minW: 3000, minD: 3000, ratio: 0.12 },
  [ROOM_TYPES.BATHROOM]:       { minW: 1500, minD: 1800, ratio: 0.04 },
  [ROOM_TYPES.TOILET]:         { minW: 1200, minD: 1500, ratio: 0.03 },
  [ROOM_TYPES.BALCONY]:        { minW: 1200, minD: 1200, ratio: 0.04 },
  [ROOM_TYPES.GARAGE]:         { minW: 3000, minD: 5500, ratio: 0.10 },
  [ROOM_TYPES.UTILITY]:        { minW: 1200, minD: 1200, ratio: 0.02 },
  [ROOM_TYPES.STORE_ROOM]:     { minW: 1500, minD: 1500, ratio: 0.03 },
  [ROOM_TYPES.CORRIDOR]:       { minW: 1050, minD: 2000, ratio: 0.05 },
  [ROOM_TYPES.POOJA_ROOM]:     { minW: 1500, minD: 1500, ratio: 0.02 },
  [ROOM_TYPES.ENTRANCE]:       { minW: 1500, minD: 1500, ratio: 0.03 },
  [ROOM_TYPES.STAIRWELL]:      { minW: 2500, minD: 3000, ratio: 0.05 },
  [ROOM_TYPES.STUDY]:          { minW: 2400, minD: 2400, ratio: 0.06 },
  [ROOM_TYPES.OFFICE]:         { minW: 3000, minD: 3000, ratio: 0.08 },
  [ROOM_TYPES.LOBBY]:          { minW: 3000, minD: 3000, ratio: 0.06 },
};

/**
 * Generate a complete building from configuration
 * @param {object} config - Building configuration
 * @returns {object} Complete building data ready for bimStore.loadBuildingData()
 */
export function generateBuilding(config) {
  const {
    name = 'New Building',
    type = 'residential',
    siteWidth = 40000,    // mm
    siteLength = 30000,
    buildingWidth = 15000,
    buildingLength = 12000,
    numFloors = 2,
    floorHeight = DEFAULTS.FLOOR_HEIGHT,
    wallThickness = DEFAULTS.WALL_THICKNESS,
    roofType = ROOF_TYPES.FLAT,
    rooms = [],           // [{ type, name, floor }]
    style = 'modern',
  } = config;

  const buildingId = uuid();
  const result = {
    building: {
      id: buildingId,
      name,
      type,
      width: buildingWidth,
      length: buildingLength,
      position: {
        x: (siteWidth - buildingWidth) / 2,
        y: (siteLength - buildingLength) / 2,
      },
    },
    site: { width: siteWidth, length: siteLength, elevation: 0 },
    floors: [],
    walls: {},
    doors: {},
    windows: {},
    rooms: {},
    slabs: {},
    roofs: {},
    stairs: {},
    columns: {},
    beams: {},
    furniture: {},
    landscape: {},
  };

  // ─── Create Floors ─────────────────────────────────────────
  const floorIds = [];
  for (let i = 0; i < numFloors; i++) {
    const floorId = uuid();
    floorIds.push(floorId);
    result.floors.push({
      id: floorId,
      name: i === 0 ? 'Ground Floor' : i === 1 ? 'First Floor' : `Floor ${i}`,
      number: i,
      elevation: i * floorHeight,
      floorHeight,
      visible: true,
      locked: false,
    });
    // Initialize element arrays for this floor
    result.walls[floorId] = [];
    result.doors[floorId] = [];
    result.windows[floorId] = [];
    result.rooms[floorId] = [];
    result.slabs[floorId] = [];
    result.stairs[floorId] = [];
    result.columns[floorId] = [];
    result.beams[floorId] = [];
    result.furniture[floorId] = [];
  }
  result.roofs['building'] = [];
  result.landscape['site'] = [];

  // ─── Auto-generate room config if not provided ─────────────
  let roomConfig = rooms.length > 0 ? rooms : generateDefaultRooms(type, numFloors);

  // ─── Generate rooms, walls, openings per floor ─────────────
  const bx = result.building.position.x;
  const by = result.building.position.y;

  for (let fi = 0; fi < numFloors; fi++) {
    const floorId = floorIds[fi];
    const floorRooms = roomConfig.filter(r => (r.floor || 0) === fi);

    // Layout rooms within the building footprint
    const layoutResult = layoutRooms(floorRooms, buildingWidth, buildingLength, wallThickness);

    // Create room elements
    for (const room of layoutResult.rooms) {
      const roomId = uuid();
      result.rooms[floorId].push({
        id: roomId,
        type: 'room',
        roomType: room.roomType,
        name: room.name,
        boundary: room.boundary.map(p => ({ x: p.x + bx, y: p.y + by })),
        area: room.area,
        perimeter: room.perimeter,
        volume: room.area * floorHeight * MM_TO_M * MM_TO_M * MM_TO_M,
        ceilingHeight: floorHeight,
        floorMaterial: room.roomType === ROOM_TYPES.BATHROOM || room.roomType === ROOM_TYPES.TOILET ? 'tile_grey' : 'tile_white',
        ceilingMaterial: 'paint_white',
        wallIds: [],
        color: ROOM_COLORS[room.roomType] || '#4FC3F7',
        floorId,
        ifcType: 'IfcSpace',
        createdAt: Date.now(),
      });
    }

    // Create walls from room layout
    for (const wall of layoutResult.walls) {
      const wallId = uuid();
      result.walls[floorId].push({
        id: wallId,
        type: 'wall',
        wallType: wall.isExterior ? 'exterior' : 'interior',
        start: { x: wall.start.x + bx, y: wall.start.y + by },
        end: { x: wall.end.x + bx, y: wall.end.y + by },
        height: floorHeight,
        thickness: wall.isExterior ? wallThickness : Math.round(wallThickness * 0.65),
        baseElevation: 0,
        material: wall.isExterior ? 'concrete' : 'brick',
        color: wall.isExterior ? '#D4C4A8' : '#E8D5B7',
        openings: [],
        floorId,
        ifcType: 'IfcWallStandardCase',
        createdAt: Date.now(),
      });
    }

    // Create doors
    for (const door of layoutResult.doors) {
      const doorId = uuid();
      const wallEl = result.walls[floorId].find(w => {
        const ws = w.start, we = w.end;
        // Find the wall this door belongs to
        return isPointOnSegment(door.position, { start: { x: ws.x - bx, y: ws.y - by }, end: { x: we.x - bx, y: we.y - by } }, wallThickness * 2);
      });
      result.doors[floorId].push({
        id: doorId,
        type: 'door',
        doorType: door.isMain ? 'main_entrance' : 'interior',
        wallId: wallEl?.id || null,
        position: door.positionOnWall || 0.5,
        width: door.isMain ? DEFAULTS.MAIN_DOOR_WIDTH : DEFAULTS.DOOR_WIDTH,
        height: door.isMain ? DEFAULTS.MAIN_DOOR_HEIGHT : DEFAULTS.DOOR_HEIGHT,
        sillHeight: 0,
        frameWidth: 50,
        swingDirection: 'left',
        swingAngle: 90,
        material: 'wood_oak',
        color: door.isMain ? '#654321' : '#8B4513',
        absolutePosition: { x: door.position.x + bx, y: door.position.y + by },
        floorId,
        ifcType: 'IfcDoor',
        createdAt: Date.now(),
      });
    }

    // Create windows on exterior walls
    for (const win of layoutResult.windows) {
      const winId = uuid();
      result.windows[floorId].push({
        id: winId,
        type: 'window',
        windowType: 'sliding',
        wallId: null,
        position: win.positionOnWall || 0.5,
        width: DEFAULTS.WINDOW_WIDTH,
        height: DEFAULTS.WINDOW_HEIGHT,
        sillHeight: DEFAULTS.WINDOW_SILL,
        frameWidth: 50,
        glassType: 'clear',
        material: 'aluminium',
        color: '#87CEEB',
        absolutePosition: { x: win.position.x + bx, y: win.position.y + by },
        wallSide: win.wallSide,
        floorId,
        ifcType: 'IfcWindow',
        createdAt: Date.now(),
      });
    }

    // Create floor slab
    const slabId = uuid();
    result.slabs[floorId].push({
      id: slabId,
      type: 'slab',
      boundary: [
        { x: bx, y: by },
        { x: bx + buildingWidth, y: by },
        { x: bx + buildingWidth, y: by + buildingLength },
        { x: bx, y: by + buildingLength },
      ],
      thickness: DEFAULTS.SLAB_THICKNESS,
      elevation: fi * floorHeight,
      material: 'concrete',
      floorId,
      ifcType: 'IfcSlab',
      createdAt: Date.now(),
    });

    // Create stairs between floors (except top floor)
    if (fi < numFloors - 1) {
      const stairId = uuid();
      const numSteps = Math.ceil(floorHeight / DEFAULTS.STAIR_RISER);
      const stairLength = numSteps * DEFAULTS.STAIR_TREAD;
      result.stairs[floorId].push({
        id: stairId,
        type: 'stair',
        stairType: 'straight',
        position: { x: bx + buildingWidth - 3000, y: by + buildingLength / 2 - 500 },
        rotation: 0,
        width: DEFAULTS.STAIR_WIDTH,
        length: stairLength,
        floorHeight,
        riserHeight: DEFAULTS.STAIR_RISER,
        treadDepth: DEFAULTS.STAIR_TREAD,
        numSteps,
        hasLanding: numSteps > 14,
        material: 'concrete',
        railingHeight: DEFAULTS.RAILING_HEIGHT,
        floorId,
        ifcType: 'IfcStairFlight',
        createdAt: Date.now(),
      });
    }
  }

  // ─── Create Roof ───────────────────────────────────────────
  const roofId = uuid();
  result.roofs['building'].push({
    id: roofId,
    type: 'roof',
    roofType,
    pitch: roofType === ROOF_TYPES.FLAT ? 0 : roofType === ROOF_TYPES.SHED ? 15 : 30,
    overhang: DEFAULTS.ROOF_OVERHANG,
    thickness: 200,
    ridgeHeight: roofType === ROOF_TYPES.FLAT ? 0 :
      (roofType === ROOF_TYPES.GABLE || roofType === ROOF_TYPES.HIP ?
        Math.tan(30 * Math.PI / 180) * (buildingWidth / 2) : 0),
    material: roofType === ROOF_TYPES.FLAT ? 'concrete' : 'roof_tile',
    color: roofType === ROOF_TYPES.FLAT ? '#9E9E9E' : '#A0522D',
    boundary: [
      { x: bx - DEFAULTS.ROOF_OVERHANG, y: by - DEFAULTS.ROOF_OVERHANG },
      { x: bx + buildingWidth + DEFAULTS.ROOF_OVERHANG, y: by - DEFAULTS.ROOF_OVERHANG },
      { x: bx + buildingWidth + DEFAULTS.ROOF_OVERHANG, y: by + buildingLength + DEFAULTS.ROOF_OVERHANG },
      { x: bx - DEFAULTS.ROOF_OVERHANG, y: by + buildingLength + DEFAULTS.ROOF_OVERHANG },
    ],
    buildingWidth,
    buildingLength,
    elevation: numFloors * floorHeight,
    ifcType: 'IfcRoof',
    createdAt: Date.now(),
  });

  // ─── Link windows to wall IDs for CSG ──────────────────────
  for (let fi = 0; fi < numFloors; fi++) {
    const floorId = floorIds[fi];
    for (const win of result.windows[floorId]) {
      if (!win.wallId && win.absolutePosition) {
        // Find closest exterior wall
        let bestWall = null;
        let bestDist = Infinity;
        for (const wall of result.walls[floorId]) {
          if (wall.wallType !== 'exterior') continue;
          const ws = wall.start, we = wall.end;
          const mx = (ws.x + we.x) / 2, my = (ws.y + we.y) / 2;
          // Distance from window to wall midpoint direction
          const dx = we.x - ws.x, dy = we.y - ws.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len < 1) continue;
          const t = ((win.absolutePosition.x - ws.x) * dx + (win.absolutePosition.y - ws.y) * dy) / (len * len);
          const clampedT = Math.max(0.05, Math.min(0.95, t));
          const projX = ws.x + clampedT * dx;
          const projY = ws.y + clampedT * dy;
          const dist = Math.sqrt((win.absolutePosition.x - projX) ** 2 + (win.absolutePosition.y - projY) ** 2);
          if (dist < bestDist) {
            bestDist = dist;
            bestWall = wall;
            win.position = clampedT;
          }
        }
        if (bestWall && bestDist < wallThickness * 3) {
          win.wallId = bestWall.id;
        }
      }
    }
    // Same for doors
    for (const door of result.doors[floorId]) {
      if (!door.wallId && door.absolutePosition) {
        let bestWall = null;
        let bestDist = Infinity;
        for (const wall of result.walls[floorId]) {
          const ws = wall.start, we = wall.end;
          const dx = we.x - ws.x, dy = we.y - ws.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len < 1) continue;
          const t = ((door.absolutePosition.x - ws.x) * dx + (door.absolutePosition.y - ws.y) * dy) / (len * len);
          const clampedT = Math.max(0.05, Math.min(0.95, t));
          const projX = ws.x + clampedT * dx;
          const projY = ws.y + clampedT * dy;
          const dist = Math.sqrt((door.absolutePosition.x - projX) ** 2 + (door.absolutePosition.y - projY) ** 2);
          if (dist < bestDist) {
            bestDist = dist;
            bestWall = wall;
            door.position = clampedT;
          }
        }
        if (bestWall && bestDist < wallThickness * 3) {
          door.wallId = bestWall.id;
        }
      }
    }
  }

  // ─── Generate Landscape ────────────────────────────────────
  const landscapeItems = result.landscape['site'];
  const margin = 2000; // 2m from boundary

  // Boundary walls (4 sides of property)
  const bwH = 1800, bwT = 200;
  // South boundary wall (with gap for gate)
  const gateWidth = 4000;
  const gateCenterX = siteWidth / 2;
  landscapeItems.push({
    id: uuid(), type: 'landscape', itemId: 'boundary_wall',
    category: 'boundary',
    position: { x: gateCenterX - gateWidth / 2 - (gateCenterX - gateWidth / 2) / 2, y: 0 },
    dimensions: { width: gateCenterX - gateWidth / 2, height: bwH, thickness: bwT },
    createdAt: Date.now(),
  });
  landscapeItems.push({
    id: uuid(), type: 'landscape', itemId: 'boundary_wall',
    category: 'boundary',
    position: { x: gateCenterX + gateWidth / 2 + (siteWidth - gateCenterX - gateWidth / 2) / 2, y: 0 },
    dimensions: { width: siteWidth - gateCenterX - gateWidth / 2, height: bwH, thickness: bwT },
    createdAt: Date.now(),
  });
  // East boundary wall
  landscapeItems.push({
    id: uuid(), type: 'landscape', itemId: 'boundary_wall',
    category: 'boundary',
    position: { x: siteWidth, y: siteLength / 2 },
    dimensions: { width: bwT, height: bwH, thickness: siteLength },
    createdAt: Date.now(),
  });
  // North boundary wall
  landscapeItems.push({
    id: uuid(), type: 'landscape', itemId: 'boundary_wall',
    category: 'boundary',
    position: { x: siteWidth / 2, y: siteLength },
    dimensions: { width: siteWidth, height: bwH, thickness: bwT },
    createdAt: Date.now(),
  });
  // West boundary wall
  landscapeItems.push({
    id: uuid(), type: 'landscape', itemId: 'boundary_wall',
    category: 'boundary',
    position: { x: 0, y: siteLength / 2 },
    dimensions: { width: bwT, height: bwH, thickness: siteLength },
    createdAt: Date.now(),
  });

  // Main gate
  landscapeItems.push({
    id: uuid(), type: 'landscape', itemId: 'gate_main',
    category: 'boundary',
    position: { x: siteWidth / 2, y: 0 },
    dimensions: { width: gateWidth, height: 2000, thickness: 100 },
    createdAt: Date.now(),
  });

  // Driveway from gate to building entrance
  const dwLength = bx + buildingWidth / 2;
  landscapeItems.push({
    id: uuid(), type: 'landscape', itemId: 'driveway',
    category: 'hardscape',
    position: { x: siteWidth / 2, y: by / 2 },
    dimensions: { width: 3000, depth: by },
    createdAt: Date.now(),
  });

  // Trees at property corners
  const treePositions = [
    { x: margin + 1500, y: margin + 1500 },
    { x: siteWidth - margin - 1500, y: margin + 1500 },
    { x: margin + 1500, y: siteLength - margin - 1500 },
    { x: siteWidth - margin - 1500, y: siteLength - margin - 1500 },
  ];
  for (const tp of treePositions) {
    landscapeItems.push({
      id: uuid(), type: 'landscape', itemId: 'tree_large',
      category: 'vegetation',
      position: tp,
      dimensions: { radius: 2500, height: 7000 },
      scale: 0.8 + Math.random() * 0.4,
      createdAt: Date.now(),
    });
  }

  // Trees along east/west boundaries
  for (let y = 4000; y < siteLength - 4000; y += 6000) {
    landscapeItems.push({
      id: uuid(), type: 'landscape', itemId: 'tree_medium',
      category: 'vegetation',
      position: { x: margin + 1500, y },
      dimensions: { radius: 1800, height: 5000 },
      scale: 0.7 + Math.random() * 0.3,
      createdAt: Date.now(),
    });
    landscapeItems.push({
      id: uuid(), type: 'landscape', itemId: 'tree_medium',
      category: 'vegetation',
      position: { x: siteWidth - margin - 1500, y },
      dimensions: { radius: 1800, height: 5000 },
      scale: 0.7 + Math.random() * 0.3,
      createdAt: Date.now(),
    });
  }

  // Parking spot near entrance
  landscapeItems.push({
    id: uuid(), type: 'landscape', itemId: 'parking_spot',
    category: 'hardscape',
    position: { x: siteWidth / 2 + 4000, y: by / 2 },
    dimensions: { width: 2800, depth: 5500 },
    createdAt: Date.now(),
  });

  // ─── Auto-furnish rooms ────────────────────────────────────
  const autoFurniture = furnishAllRooms(result);
  for (const floorId of Object.keys(autoFurniture)) {
    result.furniture[floorId] = [
      ...(result.furniture[floorId] || []),
      ...autoFurniture[floorId],
    ];
  }

  return result;
}

// ═════════════════════════════════════════════════════════════
//                 ROOM LAYOUT ALGORITHM
// ═════════════════════════════════════════════════════════════

function generateDefaultRooms(buildingType, numFloors) {
  const rooms = [];

  // Ground floor rooms
  if (buildingType === 'villa' || buildingType === 'residential') {
    rooms.push(
      { type: ROOM_TYPES.LIVING_ROOM, name: 'Living Room', floor: 0 },
      { type: ROOM_TYPES.KITCHEN, name: 'Kitchen', floor: 0 },
      { type: ROOM_TYPES.DINING_ROOM, name: 'Dining Room', floor: 0 },
      { type: ROOM_TYPES.BEDROOM, name: 'Bedroom 1', floor: 0 },
      { type: ROOM_TYPES.BATHROOM, name: 'Bathroom 1', floor: 0 },
      { type: ROOM_TYPES.ENTRANCE, name: 'Entrance', floor: 0 },
    );
    if (numFloors > 1) {
      rooms.push(
        { type: ROOM_TYPES.STAIRWELL, name: 'Stairwell', floor: 0 },
        { type: ROOM_TYPES.MASTER_BEDROOM, name: 'Master Bedroom', floor: 1 },
        { type: ROOM_TYPES.BEDROOM, name: 'Bedroom 2', floor: 1 },
        { type: ROOM_TYPES.BEDROOM, name: 'Bedroom 3', floor: 1 },
        { type: ROOM_TYPES.BATHROOM, name: 'Master Bath', floor: 1 },
        { type: ROOM_TYPES.BATHROOM, name: 'Common Bath', floor: 1 },
        { type: ROOM_TYPES.BALCONY, name: 'Balcony', floor: 1 },
        { type: ROOM_TYPES.STAIRWELL, name: 'Stairwell', floor: 1 },
      );
    }
  } else if (buildingType === 'apartment') {
    rooms.push(
      { type: ROOM_TYPES.LIVING_ROOM, name: 'Living + Dining', floor: 0 },
      { type: ROOM_TYPES.KITCHEN, name: 'Kitchen', floor: 0 },
      { type: ROOM_TYPES.MASTER_BEDROOM, name: 'Master Bedroom', floor: 0 },
      { type: ROOM_TYPES.BEDROOM, name: 'Bedroom 2', floor: 0 },
      { type: ROOM_TYPES.BATHROOM, name: 'Master Bath', floor: 0 },
      { type: ROOM_TYPES.BATHROOM, name: 'Common Bath', floor: 0 },
      { type: ROOM_TYPES.BALCONY, name: 'Balcony', floor: 0 },
      { type: ROOM_TYPES.UTILITY, name: 'Utility', floor: 0 },
    );
  } else if (buildingType === 'office') {
    rooms.push(
      { type: ROOM_TYPES.LOBBY, name: 'Lobby', floor: 0 },
      { type: ROOM_TYPES.OFFICE, name: 'Office 1', floor: 0 },
      { type: ROOM_TYPES.OFFICE, name: 'Office 2', floor: 0 },
      { type: ROOM_TYPES.BATHROOM, name: 'Restroom', floor: 0 },
      { type: ROOM_TYPES.CORRIDOR, name: 'Corridor', floor: 0 },
    );
    if (numFloors > 1) {
      rooms.push(
        { type: ROOM_TYPES.STAIRWELL, name: 'Stairwell', floor: 0 },
        { type: ROOM_TYPES.OFFICE, name: 'Office 3', floor: 1 },
        { type: ROOM_TYPES.OFFICE, name: 'Office 4', floor: 1 },
        { type: ROOM_TYPES.OFFICE, name: 'Conference Room', floor: 1 },
        { type: ROOM_TYPES.BATHROOM, name: 'Restroom', floor: 1 },
        { type: ROOM_TYPES.STAIRWELL, name: 'Stairwell', floor: 1 },
      );
    }
  } else {
    // Generic default
    rooms.push(
      { type: ROOM_TYPES.LIVING_ROOM, name: 'Main Hall', floor: 0 },
      { type: ROOM_TYPES.OFFICE, name: 'Room 1', floor: 0 },
      { type: ROOM_TYPES.BATHROOM, name: 'Restroom', floor: 0 },
    );
  }

  return rooms;
}

/**
 * Layout rooms within a rectangular building footprint using a grid-packing approach
 * All coordinates are in mm, relative to building origin (0,0)
 */
function layoutRooms(roomConfigs, buildingWidth, buildingLength, wallThickness) {
  const wt = wallThickness;
  const interiorWidth = buildingWidth - 2 * wt;
  const interiorLength = buildingLength - 2 * wt;
  const totalInteriorArea = interiorWidth * interiorLength;

  // Calculate room sizes based on ratios
  const roomLayouts = roomConfigs.map(rc => {
    const standard = ROOM_STANDARDS[rc.type] || { minW: 2400, minD: 2400, ratio: 0.10 };
    const targetArea = totalInteriorArea * standard.ratio;
    const width = Math.max(standard.minW, Math.sqrt(targetArea * 1.2));
    const depth = targetArea / width;
    return {
      ...rc,
      roomType: rc.type,
      width: Math.round(width),
      depth: Math.round(Math.max(standard.minD, depth)),
      standard,
    };
  });

  // Simple grid-based packing: place rooms left-to-right, top-to-bottom
  const placed = [];
  let cursorX = wt;
  let cursorY = wt;
  let rowMaxDepth = 0;

  for (const room of roomLayouts) {
    // Clamp room to available space
    let rw = Math.min(room.width, interiorWidth);
    let rd = Math.min(room.depth, interiorLength);

    // Check if room fits in current row
    if (cursorX + rw > buildingWidth - wt) {
      // Move to next row
      cursorX = wt;
      cursorY += rowMaxDepth + wt;
      rowMaxDepth = 0;
    }

    // If doesn't fit vertically, clamp
    if (cursorY + rd > buildingLength - wt) {
      rd = Math.max(DEFAULTS.MIN_ROOM_DEPTH, buildingLength - wt - cursorY);
    }

    const x = cursorX;
    const y = cursorY;

    placed.push({
      ...room,
      x, y,
      width: rw,
      depth: rd,
      boundary: [
        { x, y },
        { x: x + rw, y },
        { x: x + rw, y: y + rd },
        { x, y: y + rd },
      ],
      area: Math.round((rw * rd) / (1000 * 1000) * 100) / 100, // sq.m
      perimeter: Math.round(2 * (rw + rd)),
    });

    cursorX += rw + wt;
    rowMaxDepth = Math.max(rowMaxDepth, rd);
  }

  // ─── Generate Walls ────────────────────────────────────────
  const walls = [];
  const wallSet = new Set(); // deduplicate

  // Exterior walls (building perimeter)
  const exteriorWalls = [
    { start: { x: 0, y: 0 }, end: { x: buildingWidth, y: 0 }, isExterior: true, side: 'south' },
    { start: { x: buildingWidth, y: 0 }, end: { x: buildingWidth, y: buildingLength }, isExterior: true, side: 'east' },
    { start: { x: buildingWidth, y: buildingLength }, end: { x: 0, y: buildingLength }, isExterior: true, side: 'north' },
    { start: { x: 0, y: buildingLength }, end: { x: 0, y: 0 }, isExterior: true, side: 'west' },
  ];
  walls.push(...exteriorWalls);

  // Interior walls from room boundaries
  for (const room of placed) {
    const segs = [
      { start: { x: room.x, y: room.y }, end: { x: room.x + room.width, y: room.y } },
      { start: { x: room.x + room.width, y: room.y }, end: { x: room.x + room.width, y: room.y + room.depth } },
      { start: { x: room.x + room.width, y: room.y + room.depth }, end: { x: room.x, y: room.y + room.depth } },
      { start: { x: room.x, y: room.y + room.depth }, end: { x: room.x, y: room.y } },
    ];

    for (const seg of segs) {
      const key = `${Math.round(seg.start.x)},${Math.round(seg.start.y)}-${Math.round(seg.end.x)},${Math.round(seg.end.y)}`;
      const revKey = `${Math.round(seg.end.x)},${Math.round(seg.end.y)}-${Math.round(seg.start.x)},${Math.round(seg.start.y)}`;

      // Skip if it's on the building perimeter (already have exterior walls)
      const isOnPerimeter = (
        (seg.start.x <= wt && seg.end.x <= wt) || // west
        (seg.start.x >= buildingWidth - wt && seg.end.x >= buildingWidth - wt) || // east
        (seg.start.y <= wt && seg.end.y <= wt) || // south
        (seg.start.y >= buildingLength - wt && seg.end.y >= buildingLength - wt) // north
      );

      if (!isOnPerimeter && !wallSet.has(key) && !wallSet.has(revKey)) {
        wallSet.add(key);
        walls.push({ ...seg, isExterior: false });
      }
    }
  }

  // ─── Generate Doors ────────────────────────────────────────
  const doors = [];

  // Main entrance on south wall
  doors.push({
    position: { x: buildingWidth / 2, y: 0 },
    positionOnWall: 0.5,
    isMain: true,
    wallSide: 'south',
  });

  // Interior doors: one per room (placed on a shared interior wall or first available wall)
  for (const room of placed) {
    // Place a door on the room's south-facing side (entrance side)
    if (room.roomType !== ROOM_TYPES.ENTRANCE && room.roomType !== ROOM_TYPES.STAIRWELL) {
      doors.push({
        position: { x: room.x + room.width / 2, y: room.y },
        positionOnWall: 0.5,
        isMain: false,
        wallSide: 'interior',
      });
    }
  }

  // ─── Generate Windows ──────────────────────────────────────
  const windows = [];
  const windowSpacing = 3000; // one window every 3m on exterior walls

  for (const wall of exteriorWalls) {
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const wallLength = Math.sqrt(dx * dx + dy * dy);
    const numWindows = Math.max(1, Math.floor(wallLength / windowSpacing));

    for (let i = 0; i < numWindows; i++) {
      const t = (i + 0.5) / numWindows;
      // Skip if too close to corners or door positions
      const wx = wall.start.x + dx * t;
      const wy = wall.start.y + dy * t;

      // Don't place windows too close to doors
      const tooCloseToDoor = doors.some(d => {
        const ddist = Math.sqrt((d.position.x - wx) ** 2 + (d.position.y - wy) ** 2);
        return ddist < 1200;
      });

      if (!tooCloseToDoor) {
        windows.push({
          position: { x: wx, y: wy },
          positionOnWall: t,
          wallSide: wall.side,
        });
      }
    }
  }

  return {
    rooms: placed,
    walls,
    doors,
    windows,
  };
}

// ─── Utility: check if point is near a line segment ──────────
function isPointOnSegment(point, segment, tolerance) {
  const { start, end } = segment;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return false;

  const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / (len * len);
  if (t < -0.1 || t > 1.1) return false;

  const projX = start.x + t * dx;
  const projY = start.y + t * dy;
  const dist = Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2);
  return dist < tolerance;
}

// ═════════════════════════════════════════════════════════════
//                   BUILDING TEMPLATES
// ═════════════════════════════════════════════════════════════

export const BUILDING_TEMPLATES = [
  {
    id: 'modern_villa',
    name: 'Modern Villa',
    description: 'Spacious 2-floor villa with 3 bedrooms, modern open-plan living',
    type: 'villa',
    thumbnail: null,
    config: {
      name: 'Modern Villa',
      type: 'villa',
      siteWidth: 45000,
      siteLength: 35000,
      buildingWidth: 18000,
      buildingLength: 14000,
      numFloors: 2,
      floorHeight: 3200,
      wallThickness: 230,
      roofType: ROOF_TYPES.FLAT,
      style: 'modern',
    },
  },
  {
    id: 'traditional_house',
    name: 'Traditional House',
    description: 'Classic single-floor home with 2 bedrooms, gable roof',
    type: 'residential',
    config: {
      name: 'Traditional House',
      type: 'residential',
      siteWidth: 40000,
      siteLength: 30000,
      buildingWidth: 14000,
      buildingLength: 10000,
      numFloors: 1,
      floorHeight: 3000,
      wallThickness: 230,
      roofType: ROOF_TYPES.GABLE,
      style: 'traditional',
      rooms: [
        { type: ROOM_TYPES.LIVING_ROOM, name: 'Living Room', floor: 0 },
        { type: ROOM_TYPES.KITCHEN, name: 'Kitchen', floor: 0 },
        { type: ROOM_TYPES.DINING_ROOM, name: 'Dining Room', floor: 0 },
        { type: ROOM_TYPES.MASTER_BEDROOM, name: 'Master Bedroom', floor: 0 },
        { type: ROOM_TYPES.BEDROOM, name: 'Bedroom 2', floor: 0 },
        { type: ROOM_TYPES.BATHROOM, name: 'Bathroom', floor: 0 },
        { type: ROOM_TYPES.POOJA_ROOM, name: 'Pooja Room', floor: 0 },
      ],
    },
  },
  {
    id: 'luxury_villa',
    name: 'Luxury Villa',
    description: 'Premium 2-floor villa with 4 bedrooms, large lot, hip roof',
    type: 'villa',
    config: {
      name: 'Luxury Villa',
      type: 'villa',
      siteWidth: 60000,
      siteLength: 45000,
      buildingWidth: 22000,
      buildingLength: 16000,
      numFloors: 2,
      floorHeight: 3400,
      wallThickness: 230,
      roofType: ROOF_TYPES.HIP,
      style: 'modern',
    },
  },
  {
    id: 'apartment_2bhk',
    name: '2BHK Apartment',
    description: 'Standard 2-bedroom apartment unit, compact layout',
    type: 'apartment',
    config: {
      name: '2BHK Apartment',
      type: 'apartment',
      siteWidth: 20000,
      siteLength: 15000,
      buildingWidth: 12000,
      buildingLength: 10000,
      numFloors: 1,
      floorHeight: 3000,
      wallThickness: 200,
      roofType: ROOF_TYPES.FLAT,
      style: 'modern',
    },
  },
  {
    id: 'office_building',
    name: 'Office Building',
    description: 'Modern 3-floor office building with open floor plans',
    type: 'office',
    config: {
      name: 'Office Building',
      type: 'office',
      siteWidth: 50000,
      siteLength: 40000,
      buildingWidth: 25000,
      buildingLength: 15000,
      numFloors: 3,
      floorHeight: 3600,
      wallThickness: 200,
      roofType: ROOF_TYPES.FLAT,
      style: 'modern',
    },
  },
  {
    id: 'commercial_building',
    name: 'Commercial Building',
    description: 'Mixed-use commercial space, 2 floors',
    type: 'commercial',
    config: {
      name: 'Commercial Building',
      type: 'commercial',
      siteWidth: 45000,
      siteLength: 35000,
      buildingWidth: 20000,
      buildingLength: 12000,
      numFloors: 2,
      floorHeight: 4000,
      wallThickness: 230,
      roofType: ROOF_TYPES.FLAT,
      style: 'modern',
    },
  },
  {
    id: 'school_building',
    name: 'School Building',
    description: 'Standard school with classrooms, corridor layout',
    type: 'school',
    config: {
      name: 'School Building',
      type: 'school',
      siteWidth: 60000,
      siteLength: 50000,
      buildingWidth: 30000,
      buildingLength: 12000,
      numFloors: 2,
      floorHeight: 3600,
      wallThickness: 230,
      roofType: ROOF_TYPES.FLAT,
      style: 'modern',
    },
  },
  {
    id: 'warehouse',
    name: 'Warehouse',
    description: 'Large single-floor industrial warehouse',
    type: 'warehouse',
    config: {
      name: 'Warehouse',
      type: 'warehouse',
      siteWidth: 80000,
      siteLength: 60000,
      buildingWidth: 40000,
      buildingLength: 25000,
      numFloors: 1,
      floorHeight: 6000,
      wallThickness: 230,
      roofType: ROOF_TYPES.SHED,
      style: 'industrial',
      rooms: [
        { type: ROOM_TYPES.LOBBY, name: 'Main Storage', floor: 0 },
        { type: ROOM_TYPES.OFFICE, name: 'Office', floor: 0 },
        { type: ROOM_TYPES.BATHROOM, name: 'Restroom', floor: 0 },
      ],
    },
  },
];

export default { generateBuilding, BUILDING_TEMPLATES };
