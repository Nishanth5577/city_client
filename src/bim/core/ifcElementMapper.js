// ═══════════════════════════════════════════════════════════════
// IFC ↔ BIM Studio Element Mapper
// Bidirectional conversion between IFC entity data and internal
// BIM Design Studio element format for round-trip editing
// ═══════════════════════════════════════════════════════════════
import { v4 as uuidv4 } from 'uuid';

/**
 * Map IFC parsed elements (from Bonsai Python service) into Design Studio elements.
 * Assigns canvas_ids, normalizes coordinate system, fills defaults.
 */
export function mapIFCToStudioElements(ifcData) {
  const { buildings = [], all_elements = {} } = ifcData;
  
  const mappedBuildings = buildings.map(building => ({
    name: building.name || 'Building',
    ifc_guid: building.ifc_guid,
    floors: (building.floors || []).map(floor => ({
      floor_name: floor.floor_name || 'Level',
      floor_number: floor.floor_number || 0,
      floor_height: floor.floor_height || 0,
      ifc_guid: floor.ifc_guid,
      elements: mapElementSet(floor.elements || all_elements),
    })),
  }));
  
  return {
    buildings: mappedBuildings,
    totalElements: ifcData.total_elements || 0,
  };
}

/**
 * Map a set of elements from IFC format to Studio format.
 */
function mapElementSet(elements) {
  return {
    walls: (elements.walls || []).map(mapWall),
    columns: (elements.columns || []).map(mapColumn),
    beams: (elements.beams || []).map(mapBeam),
    doors: (elements.doors || []).map(mapDoor),
    windows: (elements.windows || []).map(mapWindow),
    stairs: (elements.stairs || []).map(mapStair),
    furniture: (elements.furniture || []).map(mapFurniture),
    rooms: (elements.rooms || []).map(mapRoom),
  };
}

function mapWall(ifcWall) {
  return {
    _id: uuidv4(),
    canvas_id: uuidv4(),
    ifc_guid: ifcWall.ifc_guid,
    name: ifcWall.name || 'Imported Wall',
    wall_type: ifcWall.wall_type || 'exterior',
    start_point: {
      x: ifcWall.start_point?.x || 0,
      y: ifcWall.start_point?.y || 0,
    },
    end_point: {
      x: ifcWall.end_point?.x || 3000,
      y: ifcWall.end_point?.y || 0,
    },
    thickness: ifcWall.thickness || 230,
    height: ifcWall.height || 3000,
    color: ifcWall.wall_type === 'exterior' ? '#8B7355' : '#A89070',
    material: ifcWall.material || 'brick_class1',
    locked: false,
    visible: true,
    source: 'ifc_import',
  };
}

function mapColumn(ifcCol) {
  return {
    _id: uuidv4(),
    canvas_id: uuidv4(),
    ifc_guid: ifcCol.ifc_guid,
    name: ifcCol.name || 'Imported Column',
    position: {
      x: ifcCol.position?.x || 0,
      y: ifcCol.position?.y || 0,
    },
    width: ifcCol.width || 300,
    depth: ifcCol.depth || ifcCol.width || 300,
    height: ifcCol.height || 3000,
    shape: ifcCol.shape || 'rectangular',
    diameter: ifcCol.diameter,
    rotation: ifcCol.rotation || 0,
    color: '#A0A0A0',
    locked: false,
    visible: true,
    source: 'ifc_import',
  };
}

function mapBeam(ifcBeam) {
  return {
    _id: uuidv4(),
    canvas_id: uuidv4(),
    ifc_guid: ifcBeam.ifc_guid,
    name: ifcBeam.name || 'Imported Beam',
    position: {
      x: ifcBeam.position?.x || 0,
      y: ifcBeam.position?.y || 0,
    },
    width: ifcBeam.width || 230,
    depth: ifcBeam.depth || 450,
    length: ifcBeam.length || 3000,
    rotation: ifcBeam.rotation || 0,
    color: '#909090',
    locked: false,
    visible: true,
    source: 'ifc_import',
  };
}

function mapDoor(ifcDoor) {
  return {
    _id: uuidv4(),
    canvas_id: uuidv4(),
    ifc_guid: ifcDoor.ifc_guid,
    name: ifcDoor.name || 'Imported Door',
    position: {
      x: ifcDoor.position?.x || 0,
      y: ifcDoor.position?.y || 0,
    },
    width: ifcDoor.width || 900,
    height: ifcDoor.height || 2100,
    door_type: ifcDoor.door_type || 'single',
    rotation: ifcDoor.rotation || 0,
    color: '#8B4513',
    locked: false,
    visible: true,
    source: 'ifc_import',
  };
}

function mapWindow(ifcWin) {
  return {
    _id: uuidv4(),
    canvas_id: uuidv4(),
    ifc_guid: ifcWin.ifc_guid,
    name: ifcWin.name || 'Imported Window',
    position: {
      x: ifcWin.position?.x || 0,
      y: ifcWin.position?.y || 0,
    },
    width: ifcWin.width || 1200,
    height: ifcWin.height || 1200,
    sill_height: ifcWin.sill_height || 900,
    window_type: ifcWin.window_type || 'casement',
    rotation: ifcWin.rotation || 0,
    color: '#87CEEB',
    locked: false,
    visible: true,
    source: 'ifc_import',
  };
}

function mapStair(ifcStair) {
  return {
    _id: uuidv4(),
    canvas_id: uuidv4(),
    ifc_guid: ifcStair.ifc_guid,
    name: ifcStair.name || 'Imported Stair',
    position: {
      x: ifcStair.position?.x || 0,
      y: ifcStair.position?.y || 0,
    },
    width: ifcStair.width || 1200,
    total_height: ifcStair.total_height || 3000,
    num_risers: ifcStair.num_risers || 18,
    riser_height: ifcStair.riser_height || 167,
    tread_depth: ifcStair.tread_depth || 270,
    stair_type: ifcStair.stair_type || 'straight',
    rotation: ifcStair.rotation || 0,
    color: '#B0B0B0',
    locked: false,
    visible: true,
    source: 'ifc_import',
  };
}

function mapFurniture(ifcFurn) {
  return {
    _id: uuidv4(),
    canvas_id: uuidv4(),
    ifc_guid: ifcFurn.ifc_guid,
    name: ifcFurn.name || 'Imported Furniture',
    position: {
      x: ifcFurn.position?.x || 0,
      y: ifcFurn.position?.y || 0,
    },
    width: ifcFurn.width || 600,
    depth: ifcFurn.depth || 600,
    height: ifcFurn.height || 750,
    category: ifcFurn.category || 'other',
    type: ifcFurn.type || 'generic',
    rotation: ifcFurn.rotation || 0,
    color: '#D2B48C',
    locked: false,
    visible: true,
    source: 'ifc_import',
  };
}

function mapRoom(ifcRoom) {
  return {
    _id: uuidv4(),
    canvas_id: uuidv4(),
    ifc_guid: ifcRoom.ifc_guid,
    name: ifcRoom.name || 'Room',
    room_type: ifcRoom.room_type || 'room',
    boundary: ifcRoom.boundary || [],
    area: ifcRoom.area || 0,
    height: ifcRoom.height || 3000,
    color: '#F0F8FF20',
    locked: false,
    visible: true,
    source: 'ifc_import',
  };
}

/**
 * Map IFC entity type to internal element type
 */
export const IFC_TYPE_MAP = {
  'IfcWall': 'walls',
  'IfcWallStandardCase': 'walls',
  'IfcColumn': 'columns',
  'IfcBeam': 'beams',
  'IfcDoor': 'doors',
  'IfcWindow': 'windows',
  'IfcStairFlight': 'stairs',
  'IfcStair': 'stairs',
  'IfcFurnishingElement': 'furniture',
  'IfcFurniture': 'furniture',
  'IfcSpace': 'rooms',
};

/**
 * Map internal element type to IFC entity type
 */
export const STUDIO_TO_IFC_MAP = {
  'walls': 'IfcWallStandardCase',
  'columns': 'IfcColumn',
  'beams': 'IfcBeam',
  'doors': 'IfcDoor',
  'windows': 'IfcWindow',
  'stairs': 'IfcStairFlight',
  'furniture': 'IfcFurnishingElement',
  'rooms': 'IfcSpace',
};

export default {
  mapIFCToStudioElements,
  IFC_TYPE_MAP,
  STUDIO_TO_IFC_MAP,
};
