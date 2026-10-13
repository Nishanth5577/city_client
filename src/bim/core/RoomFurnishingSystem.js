// ═══════════════════════════════════════════════════════════════
// Room Furnishing System — Automatic furniture placement
// Places furniture based on room type, dimensions, doors, windows
// ═══════════════════════════════════════════════════════════════
import { v4 as uuid } from 'uuid';
import { ROOM_TYPES, ROOM_FLOOR_MATERIALS } from '../../stores/bimTypes';

const S = 0.001; // mm to meters

// ─── Furniture templates per room type ────────────────────────
const FURNITURE_TEMPLATES = {
  [ROOM_TYPES.LIVING_ROOM]: [
    { itemId: 'sofa_3seat', name: 'Sofa', category: 'seating', w: 2200, d: 900, h: 850, placement: 'against_longest_wall', offset: 200, color: '#6B7B8D' },
    { itemId: 'coffee_table', name: 'Coffee Table', category: 'tables', w: 1200, d: 600, h: 450, placement: 'center_offset', offsetFromSofa: 600, color: '#8B6914' },
    { itemId: 'tv_unit', name: 'TV Unit', category: 'storage', w: 1800, d: 450, h: 500, placement: 'opposite_sofa', offset: 100, color: '#5D4037' },
    { itemId: 'tv_55', name: 'TV', category: 'electronics', w: 1230, d: 80, h: 720, placement: 'on_tv_unit', color: '#1A1A1A' },
    { itemId: 'rug_large', name: 'Rug', category: 'decorative', w: 2400, d: 1700, h: 20, placement: 'center', color: '#C4A882' },
    { itemId: 'plant_pot_large', name: 'Plant', category: 'decorative', w: 400, d: 400, h: 1200, placement: 'corner', cornerIndex: 0, color: '#4CAF50' },
    { itemId: 'side_table', name: 'Side Table', category: 'tables', w: 500, d: 500, h: 550, placement: 'beside_sofa', side: 'left', color: '#8B6914' },
  ],
  [ROOM_TYPES.KITCHEN]: [
    { itemId: 'kitchen_counter', name: 'Kitchen Counter', category: 'kitchen', w: 2400, d: 600, h: 850, placement: 'against_longest_wall', offset: 0, color: '#F5F5F0' },
    { itemId: 'kitchen_sink', name: 'Sink', category: 'kitchen', w: 800, d: 500, h: 200, placement: 'on_counter_center', color: '#C0C0C0' },
    { itemId: 'refrigerator', name: 'Refrigerator', category: 'kitchen', w: 700, d: 700, h: 1800, placement: 'corner', cornerIndex: 1, color: '#E8E8E8' },
    { itemId: 'oven', name: 'Oven', category: 'kitchen', w: 600, d: 600, h: 850, placement: 'beside_counter', color: '#2C2C2C' },
  ],
  [ROOM_TYPES.DINING_ROOM]: [
    { itemId: 'dining_table_6', name: 'Dining Table', category: 'tables', w: 1800, d: 900, h: 750, placement: 'center', color: '#8B6914' },
    { itemId: 'dining_chair', name: 'Chair', category: 'seating', w: 450, d: 500, h: 900, placement: 'around_table', count: 6, color: '#6B4423' },
    { itemId: 'plant_pot_small', name: 'Plant', category: 'decorative', w: 250, d: 250, h: 600, placement: 'corner', cornerIndex: 0, color: '#4CAF50' },
  ],
  [ROOM_TYPES.MASTER_BEDROOM]: [
    { itemId: 'king_bed', name: 'King Bed', category: 'beds', w: 2000, d: 2200, h: 600, placement: 'against_wall_away_from_door', offset: 100, color: '#F5F5F0' },
    { itemId: 'side_table', name: 'Bedside Table L', category: 'tables', w: 500, d: 450, h: 550, placement: 'beside_bed', side: 'left', color: '#8B6914' },
    { itemId: 'side_table', name: 'Bedside Table R', category: 'tables', w: 500, d: 450, h: 550, placement: 'beside_bed', side: 'right', color: '#8B6914' },
    { itemId: 'wardrobe', name: 'Wardrobe', category: 'storage', w: 1800, d: 600, h: 2200, placement: 'adjacent_wall', offset: 200, color: '#5D4037' },
    { itemId: 'study_desk', name: 'Desk', category: 'tables', w: 1200, d: 600, h: 750, placement: 'near_window', color: '#8B6914', minRoomArea: 14 },
  ],
  [ROOM_TYPES.BEDROOM]: [
    { itemId: 'queen_bed', name: 'Bed', category: 'beds', w: 1800, d: 2000, h: 600, placement: 'against_wall_away_from_door', offset: 100, color: '#F5F5F0' },
    { itemId: 'side_table', name: 'Bedside Table', category: 'tables', w: 500, d: 450, h: 550, placement: 'beside_bed', side: 'right', color: '#8B6914' },
    { itemId: 'wardrobe', name: 'Wardrobe', category: 'storage', w: 1600, d: 600, h: 2200, placement: 'adjacent_wall', offset: 200, color: '#5D4037' },
  ],
  [ROOM_TYPES.BATHROOM]: [
    { itemId: 'toilet', name: 'Toilet', category: 'bathroom', w: 400, d: 700, h: 750, placement: 'corner', cornerIndex: 2, offset: 150, color: '#FFFFFF' },
    { itemId: 'wash_basin', name: 'Wash Basin', category: 'bathroom', w: 600, d: 450, h: 850, placement: 'near_door_wall', offset: 300, color: '#FFFFFF' },
    { itemId: 'shower', name: 'Shower', category: 'bathroom', w: 900, d: 900, h: 2100, placement: 'corner', cornerIndex: 0, color: '#E0E0E0' },
  ],
  [ROOM_TYPES.TOILET]: [
    { itemId: 'toilet', name: 'Toilet', category: 'bathroom', w: 400, d: 700, h: 750, placement: 'corner', cornerIndex: 1, offset: 150, color: '#FFFFFF' },
    { itemId: 'wash_basin', name: 'Wash Basin', category: 'bathroom', w: 500, d: 400, h: 850, placement: 'near_door_wall', offset: 200, color: '#FFFFFF' },
  ],
  [ROOM_TYPES.GARAGE]: [
    { itemId: 'outdoor_table', name: 'Storage Cabinet', category: 'storage', w: 1200, d: 600, h: 1800, placement: 'against_back_wall', offset: 200, color: '#757575' },
  ],
  [ROOM_TYPES.OFFICE]: [
    { itemId: 'office_desk', name: 'Desk', category: 'tables', w: 1600, d: 800, h: 750, placement: 'near_window', color: '#8B6914' },
    { itemId: 'office_chair', name: 'Chair', category: 'seating', w: 600, d: 600, h: 1050, placement: 'at_desk', color: '#333333' },
    { itemId: 'bookshelf', name: 'Bookshelf', category: 'storage', w: 1200, d: 350, h: 2000, placement: 'against_wall_away_from_door', offset: 100, color: '#8B6914' },
  ],
  [ROOM_TYPES.STUDY]: [
    { itemId: 'study_desk', name: 'Desk', category: 'tables', w: 1400, d: 700, h: 750, placement: 'near_window', color: '#8B6914' },
    { itemId: 'office_chair', name: 'Chair', category: 'seating', w: 600, d: 600, h: 1050, placement: 'at_desk', color: '#333333' },
    { itemId: 'bookshelf', name: 'Bookshelf', category: 'storage', w: 1200, d: 350, h: 2000, placement: 'against_longest_wall', offset: 100, color: '#8B6914' },
  ],
  [ROOM_TYPES.POOJA_ROOM]: [
    { itemId: 'side_table', name: 'Altar Table', category: 'tables', w: 800, d: 500, h: 750, placement: 'against_back_wall', offset: 50, color: '#8B6914' },
    { itemId: 'plant_pot_small', name: 'Plant', category: 'decorative', w: 250, d: 250, h: 600, placement: 'corner', cornerIndex: 0, color: '#4CAF50' },
  ],
};

// ─── Room geometry helpers ────────────────────────────────────

function getRoomBounds(boundary) {
  if (!boundary || boundary.length < 3) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of boundary) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

function getRoomWalls(bounds) {
  // Return 4 walls as segments: north, east, south, west
  const { minX, minY, maxX, maxY, width, height } = bounds;
  return [
    { id: 'north', sx: minX, sy: maxY, ex: maxX, ey: maxY, length: width, dir: 'horizontal', normal: { x: 0, y: -1 } },
    { id: 'east', sx: maxX, sy: minY, ex: maxX, ey: maxY, length: height, dir: 'vertical', normal: { x: -1, y: 0 } },
    { id: 'south', sx: minX, sy: minY, ex: maxX, ey: minY, length: width, dir: 'horizontal', normal: { x: 0, y: 1 } },
    { id: 'west', sx: minX, sy: minY, ex: minX, ey: maxY, length: height, dir: 'vertical', normal: { x: 1, y: 0 } },
  ];
}

function findLongestWall(roomWalls) {
  return roomWalls.reduce((best, w) => w.length > best.length ? w : best, roomWalls[0]);
}

function findDoorWall(roomWalls, doors, roomBounds) {
  // Find which wall the door is closest to
  if (!doors || doors.length === 0) return roomWalls[2]; // default south
  const door = doors[0];
  if (!door.absolutePosition) return roomWalls[2];
  const dp = door.absolutePosition;
  let best = roomWalls[0], bestDist = Infinity;
  for (const w of roomWalls) {
    const mx = (w.sx + w.ex) / 2;
    const my = (w.sy + w.ey) / 2;
    const dist = Math.sqrt((dp.x - mx) ** 2 + (dp.y - my) ** 2);
    if (dist < bestDist) { bestDist = dist; best = w; }
  }
  return best;
}

function getCornerPosition(bounds, cornerIndex, offsetX = 300, offsetY = 300) {
  const corners = [
    { x: bounds.minX + offsetX, y: bounds.minY + offsetY },
    { x: bounds.maxX - offsetX, y: bounds.minY + offsetY },
    { x: bounds.maxX - offsetX, y: bounds.maxY - offsetY },
    { x: bounds.minX + offsetX, y: bounds.maxY - offsetY },
  ];
  return corners[cornerIndex % 4];
}

function getPositionAgainstWall(wall, bounds, itemW, itemD, offset = 0) {
  const cx = (wall.sx + wall.ex) / 2;
  const cy = (wall.sy + wall.ey) / 2;
  if (wall.dir === 'horizontal') {
    return {
      x: cx, y: cy + wall.normal.y * (itemD / 2 + offset),
      rotation: wall.normal.y > 0 ? 0 : Math.PI,
    };
  }
  return {
    x: cx + wall.normal.x * (itemD / 2 + offset), y: cy,
    rotation: wall.normal.x > 0 ? Math.PI / 2 : -Math.PI / 2,
  };
}

// ─── Main furnishing function ─────────────────────────────────

export function furnishRoom(room, doors = [], windows = []) {
  const bounds = getRoomBounds(room.boundary);
  if (!bounds) return [];

  const roomArea = (bounds.width * bounds.height) / 1e6; // m²
  const templates = FURNITURE_TEMPLATES[room.roomType] || [];
  if (templates.length === 0) return [];

  const roomWalls = getRoomWalls(bounds);
  const longestWall = findLongestWall(roomWalls);
  const doorWall = findDoorWall(roomWalls, doors, bounds);
  const oppositeWalls = {
    north: 'south', south: 'north', east: 'west', west: 'east',
  };
  const adjacentWalls = {
    north: 'east', east: 'south', south: 'west', west: 'north',
  };

  // Find wall opposite to longest
  const oppositeLongest = roomWalls.find(w => w.id === oppositeWalls[longestWall.id]);
  // Find wall opposite to door wall
  const oppositeDoor = roomWalls.find(w => w.id === oppositeWalls[doorWall.id]);
  // Find wall adjacent to door wall
  const adjacentDoor = roomWalls.find(w => w.id === adjacentWalls[doorWall.id]);

  const placed = [];
  let sofaPos = null;
  let bedPos = null;
  let deskPos = null;
  let tablePos = null;
  let counterWall = null;

  for (const tmpl of templates) {
    // Skip if room is too small
    if (tmpl.minRoomArea && roomArea < tmpl.minRoomArea) continue;
    // Skip if item doesn't fit
    if (tmpl.w > bounds.width - 200 && tmpl.d > bounds.height - 200) continue;

    let pos = { x: bounds.cx, y: bounds.cy };
    let rot = 0;

    switch (tmpl.placement) {
      case 'against_longest_wall': {
        const result = getPositionAgainstWall(longestWall, bounds, tmpl.w, tmpl.d, tmpl.offset || 0);
        pos = { x: result.x, y: result.y };
        rot = result.rotation;
        if (tmpl.category === 'kitchen') counterWall = longestWall;
        if (tmpl.category === 'seating') sofaPos = { ...pos, wallId: longestWall.id };
        break;
      }
      case 'against_wall_away_from_door': {
        const targetWall = oppositeDoor || longestWall;
        const result = getPositionAgainstWall(targetWall, bounds, tmpl.w, tmpl.d, tmpl.offset || 0);
        pos = { x: result.x, y: result.y };
        rot = result.rotation;
        if (tmpl.category === 'beds') bedPos = { ...pos, wallId: targetWall.id, w: tmpl.w, d: tmpl.d, rot };
        break;
      }
      case 'against_back_wall': {
        const backWall = oppositeDoor || roomWalls[0];
        const result = getPositionAgainstWall(backWall, bounds, tmpl.w, tmpl.d, tmpl.offset || 0);
        pos = { x: result.x, y: result.y };
        rot = result.rotation;
        break;
      }
      case 'adjacent_wall': {
        const adjWall = adjacentDoor || roomWalls[1];
        const result = getPositionAgainstWall(adjWall, bounds, tmpl.w, tmpl.d, tmpl.offset || 0);
        pos = { x: result.x, y: result.y };
        rot = result.rotation;
        break;
      }
      case 'opposite_sofa': {
        if (sofaPos) {
          const oppWall = roomWalls.find(w => w.id === oppositeWalls[sofaPos.wallId]);
          if (oppWall) {
            const result = getPositionAgainstWall(oppWall, bounds, tmpl.w, tmpl.d, tmpl.offset || 0);
            pos = { x: result.x, y: result.y };
            rot = result.rotation;
          }
        }
        break;
      }
      case 'on_tv_unit': {
        // Place on top of previous tv_unit
        const tvUnit = placed.find(p => p.itemId === 'tv_unit');
        if (tvUnit) {
          pos = { x: tvUnit.position.x, y: tvUnit.position.y };
          rot = tvUnit.rotation?.y || 0;
        }
        break;
      }
      case 'center':
        pos = { x: bounds.cx, y: bounds.cy };
        break;
      case 'center_offset': {
        if (sofaPos) {
          // Position between sofa and center
          pos = { x: (sofaPos.x + bounds.cx) / 2, y: (sofaPos.y + bounds.cy) / 2 };
        } else {
          pos = { x: bounds.cx, y: bounds.cy };
        }
        break;
      }
      case 'corner': {
        const cp = getCornerPosition(bounds, tmpl.cornerIndex || 0, tmpl.w / 2 + 200, tmpl.d / 2 + 200);
        pos = cp;
        break;
      }
      case 'beside_sofa': {
        if (sofaPos) {
          const offset = tmpl.side === 'left' ? -(1100 + tmpl.w / 2 + 100) : (1100 + tmpl.w / 2 + 100);
          const wallDir = longestWall.dir;
          if (wallDir === 'horizontal') {
            pos = { x: sofaPos.x + offset, y: sofaPos.y };
          } else {
            pos = { x: sofaPos.x, y: sofaPos.y + offset };
          }
        }
        break;
      }
      case 'beside_bed': {
        if (bedPos) {
          const offset = tmpl.side === 'left' ? -(bedPos.w / 2 + tmpl.w / 2 + 50) : (bedPos.w / 2 + tmpl.w / 2 + 50);
          pos = { x: bedPos.x + offset * Math.cos(bedPos.rot), y: bedPos.y + offset * Math.sin(bedPos.rot) };
          rot = bedPos.rot;
        }
        break;
      }
      case 'near_door_wall': {
        const result = getPositionAgainstWall(doorWall, bounds, tmpl.w, tmpl.d, tmpl.offset || 300);
        pos = { x: result.x, y: result.y };
        rot = result.rotation;
        // Offset along the wall to not block door
        if (doorWall.dir === 'horizontal') {
          pos.x = doorWall.sx + tmpl.w / 2 + 300;
        } else {
          pos.y = doorWall.sy + tmpl.d / 2 + 300;
        }
        break;
      }
      case 'near_window': {
        // Place near the first window's wall, or use a wall with a window
        const windowWall = windows.length > 0 ? longestWall : adjacentDoor || roomWalls[1];
        const result = getPositionAgainstWall(windowWall, bounds, tmpl.w, tmpl.d, 200);
        pos = { x: result.x, y: result.y };
        rot = result.rotation;
        deskPos = { ...pos, rot };
        break;
      }
      case 'at_desk': {
        if (deskPos) {
          pos = { x: deskPos.x, y: deskPos.y };
          rot = deskPos.rot + Math.PI;
        }
        break;
      }
      case 'beside_counter': {
        if (counterWall) {
          const result = getPositionAgainstWall(counterWall, bounds, tmpl.w, tmpl.d, 0);
          if (counterWall.dir === 'horizontal') {
            pos = { x: result.x + 1500, y: result.y };
          } else {
            pos = { x: result.x, y: result.y + 1500 };
          }
          rot = result.rotation;
        }
        break;
      }
      case 'around_table': {
        // Generate chairs around center table
        const count = tmpl.count || 4;
        const tableX = bounds.cx;
        const tableY = bounds.cy;
        const spacingX = 500;
        const spacingY = 300;
        for (let i = 0; i < count; i++) {
          const side = i % 4;
          const idx = Math.floor(i / 4);
          let cx, cy, cr;
          switch (side) {
            case 0: cx = tableX - spacingX - idx * 500; cy = tableY + spacingY + 250; cr = Math.PI; break;
            case 1: cx = tableX + spacingX + idx * 500; cy = tableY + spacingY + 250; cr = Math.PI; break;
            case 2: cx = tableX - spacingX - idx * 500; cy = tableY - spacingY - 250; cr = 0; break;
            case 3: cx = tableX + spacingX + idx * 500; cy = tableY - spacingY - 250; cr = 0; break;
          }
          if (cx >= bounds.minX + 200 && cx <= bounds.maxX - 200 &&
              cy >= bounds.minY + 200 && cy <= bounds.maxY - 200) {
            placed.push({
              id: uuid(), type: 'furniture', itemId: tmpl.itemId, name: `${tmpl.name} ${i + 1}`,
              category: tmpl.category,
              position: { x: cx, y: cy, z: 0 },
              rotation: { x: 0, y: cr, z: 0 },
              width: tmpl.w, depth: tmpl.d, height: tmpl.h,
              color: tmpl.color, floorId: room.floorId,
              ifcType: 'IfcFurnishingElement', createdAt: Date.now(),
            });
          }
        }
        continue; // Skip default push
      }
    }

    // Clamp position inside room bounds
    pos.x = Math.max(bounds.minX + tmpl.w / 2 + 50, Math.min(bounds.maxX - tmpl.w / 2 - 50, pos.x));
    pos.y = Math.max(bounds.minY + tmpl.d / 2 + 50, Math.min(bounds.maxY - tmpl.d / 2 - 50, pos.y));

    placed.push({
      id: uuid(), type: 'furniture', itemId: tmpl.itemId, name: tmpl.name,
      category: tmpl.category,
      position: { x: pos.x, y: pos.y, z: 0 },
      rotation: { x: 0, y: rot, z: 0 },
      width: tmpl.w, depth: tmpl.d, height: tmpl.h,
      color: tmpl.color, floorId: room.floorId,
      ifcType: 'IfcFurnishingElement', createdAt: Date.now(),
    });
  }

  return placed;
}

/**
 * Furnish all rooms in a building data set.
 * @param {object} data - Building data with rooms, doors, windows keyed by floorId
 * @returns {object} furniture keyed by floorId
 */
export function furnishAllRooms(data) {
  const { rooms, doors, windows } = data;
  const furniture = {};

  for (const floorId of Object.keys(rooms)) {
    furniture[floorId] = furniture[floorId] || [];
    const floorRooms = rooms[floorId] || [];
    const floorDoors = doors[floorId] || [];
    const floorWindows = windows[floorId] || [];

    for (const room of floorRooms) {
      // Find doors belonging to this room (by proximity to boundary)
      const roomBounds = getRoomBounds(room.boundary);
      if (!roomBounds) continue;

      const roomDoors = floorDoors.filter(d => {
        if (!d.absolutePosition) return false;
        const p = d.absolutePosition;
        return p.x >= roomBounds.minX - 500 && p.x <= roomBounds.maxX + 500 &&
               p.y >= roomBounds.minY - 500 && p.y <= roomBounds.maxY + 500;
      });

      const roomWindows = floorWindows.filter(w => {
        if (!w.absolutePosition) return false;
        const p = w.absolutePosition;
        return p.x >= roomBounds.minX - 500 && p.x <= roomBounds.maxX + 500 &&
               p.y >= roomBounds.minY - 500 && p.y <= roomBounds.maxY + 500;
      });

      const items = furnishRoom(room, roomDoors, roomWindows);
      furniture[floorId].push(...items);
    }
  }

  return furniture;
}
