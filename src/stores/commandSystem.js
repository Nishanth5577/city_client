// ═══════════════════════════════════════════════════════════════
// BIM Command System — Every BIM modification is a command
// Enables undo/redo, Bonsai sync, and WebSocket collaboration
// ═══════════════════════════════════════════════════════════════
import { v4 as uuid } from 'uuid';

// ─── Command Types ─────────────────────────────────────────────
export const CMD = {
  // Building
  CREATE_BUILDING: 'CREATE_BUILDING',
  UPDATE_BUILDING: 'UPDATE_BUILDING',
  DELETE_BUILDING: 'DELETE_BUILDING',
  // Floor
  CREATE_FLOOR: 'CREATE_FLOOR',
  UPDATE_FLOOR: 'UPDATE_FLOOR',
  DELETE_FLOOR: 'DELETE_FLOOR',
  DUPLICATE_FLOOR: 'DUPLICATE_FLOOR',
  // Wall
  CREATE_WALL: 'CREATE_WALL',
  UPDATE_WALL: 'UPDATE_WALL',
  DELETE_WALL: 'DELETE_WALL',
  MOVE_WALL: 'MOVE_WALL',
  // Door
  CREATE_DOOR: 'CREATE_DOOR',
  UPDATE_DOOR: 'UPDATE_DOOR',
  DELETE_DOOR: 'DELETE_DOOR',
  // Window
  CREATE_WINDOW: 'CREATE_WINDOW',
  UPDATE_WINDOW: 'UPDATE_WINDOW',
  DELETE_WINDOW: 'DELETE_WINDOW',
  // Room
  CREATE_ROOM: 'CREATE_ROOM',
  UPDATE_ROOM: 'UPDATE_ROOM',
  DELETE_ROOM: 'DELETE_ROOM',
  // Slab
  CREATE_SLAB: 'CREATE_SLAB',
  UPDATE_SLAB: 'UPDATE_SLAB',
  DELETE_SLAB: 'DELETE_SLAB',
  // Roof
  CREATE_ROOF: 'CREATE_ROOF',
  UPDATE_ROOF: 'UPDATE_ROOF',
  DELETE_ROOF: 'DELETE_ROOF',
  // Stair
  CREATE_STAIR: 'CREATE_STAIR',
  UPDATE_STAIR: 'UPDATE_STAIR',
  DELETE_STAIR: 'DELETE_STAIR',
  // Structure
  CREATE_COLUMN: 'CREATE_COLUMN',
  UPDATE_COLUMN: 'UPDATE_COLUMN',
  DELETE_COLUMN: 'DELETE_COLUMN',
  CREATE_BEAM: 'CREATE_BEAM',
  UPDATE_BEAM: 'UPDATE_BEAM',
  DELETE_BEAM: 'DELETE_BEAM',
  // Furniture
  CREATE_FURNITURE: 'CREATE_FURNITURE',
  UPDATE_FURNITURE: 'UPDATE_FURNITURE',
  DELETE_FURNITURE: 'DELETE_FURNITURE',
  MOVE_FURNITURE: 'MOVE_FURNITURE',
  ROTATE_FURNITURE: 'ROTATE_FURNITURE',
  // Landscape
  CREATE_LANDSCAPE: 'CREATE_LANDSCAPE',
  UPDATE_LANDSCAPE: 'UPDATE_LANDSCAPE',
  DELETE_LANDSCAPE: 'DELETE_LANDSCAPE',
  // Material
  ASSIGN_MATERIAL: 'ASSIGN_MATERIAL',
  // Properties
  SET_PROPERTY: 'SET_PROPERTY',
  // General
  MOVE_ELEMENT: 'MOVE_ELEMENT',
  ROTATE_ELEMENT: 'ROTATE_ELEMENT',
  RESIZE_ELEMENT: 'RESIZE_ELEMENT',
  DUPLICATE_ELEMENT: 'DUPLICATE_ELEMENT',
  // Batch
  GENERATE_BUILDING: 'GENERATE_BUILDING',
  APPLY_TEMPLATE: 'APPLY_TEMPLATE',
  // IFC
  IMPORT_IFC: 'IMPORT_IFC',
  EXPORT_IFC: 'EXPORT_IFC',
  // Persistence
  SAVE_MODEL: 'SAVE_MODEL',
  LOAD_MODEL: 'LOAD_MODEL',
};

/**
 * Create a BIM command object
 */
export function createCommand(type, payload, options = {}) {
  return {
    id: uuid(),
    type,
    payload,
    timestamp: Date.now(),
    userId: options.userId || null,
    projectId: options.projectId || null,
    floorId: options.floorId || null,
    undoable: options.undoable !== false,
    synced: false,
  };
}

/**
 * Create the inverse (undo) command for a given command + previous state
 */
export function createInverseCommand(cmd, previousState) {
  const { type, payload } = cmd;

  switch (type) {
    // CREATE → DELETE (inverse)
    case CMD.CREATE_WALL:
      return createCommand(CMD.DELETE_WALL, { id: payload.id }, { undoable: false });
    case CMD.CREATE_DOOR:
      return createCommand(CMD.DELETE_DOOR, { id: payload.id }, { undoable: false });
    case CMD.CREATE_WINDOW:
      return createCommand(CMD.DELETE_WINDOW, { id: payload.id }, { undoable: false });
    case CMD.CREATE_ROOM:
      return createCommand(CMD.DELETE_ROOM, { id: payload.id }, { undoable: false });
    case CMD.CREATE_SLAB:
      return createCommand(CMD.DELETE_SLAB, { id: payload.id }, { undoable: false });
    case CMD.CREATE_ROOF:
      return createCommand(CMD.DELETE_ROOF, { id: payload.id }, { undoable: false });
    case CMD.CREATE_STAIR:
      return createCommand(CMD.DELETE_STAIR, { id: payload.id }, { undoable: false });
    case CMD.CREATE_COLUMN:
      return createCommand(CMD.DELETE_COLUMN, { id: payload.id }, { undoable: false });
    case CMD.CREATE_BEAM:
      return createCommand(CMD.DELETE_BEAM, { id: payload.id }, { undoable: false });
    case CMD.CREATE_FURNITURE:
      return createCommand(CMD.DELETE_FURNITURE, { id: payload.id }, { undoable: false });
    case CMD.CREATE_LANDSCAPE:
      return createCommand(CMD.DELETE_LANDSCAPE, { id: payload.id }, { undoable: false });
    case CMD.CREATE_FLOOR:
      return createCommand(CMD.DELETE_FLOOR, { id: payload.id }, { undoable: false });

    // DELETE → CREATE (restore previous state)
    case CMD.DELETE_WALL:
    case CMD.DELETE_DOOR:
    case CMD.DELETE_WINDOW:
    case CMD.DELETE_ROOM:
    case CMD.DELETE_SLAB:
    case CMD.DELETE_ROOF:
    case CMD.DELETE_STAIR:
    case CMD.DELETE_COLUMN:
    case CMD.DELETE_BEAM:
    case CMD.DELETE_FURNITURE:
    case CMD.DELETE_LANDSCAPE:
    case CMD.DELETE_FLOOR: {
      const createType = type.replace('DELETE_', 'CREATE_');
      return createCommand(createType, previousState, { undoable: false });
    }

    // UPDATE → UPDATE (restore to previous values)
    case CMD.UPDATE_WALL:
    case CMD.UPDATE_DOOR:
    case CMD.UPDATE_WINDOW:
    case CMD.UPDATE_ROOM:
    case CMD.UPDATE_SLAB:
    case CMD.UPDATE_ROOF:
    case CMD.UPDATE_STAIR:
    case CMD.UPDATE_COLUMN:
    case CMD.UPDATE_BEAM:
    case CMD.UPDATE_FURNITURE:
    case CMD.UPDATE_LANDSCAPE:
    case CMD.UPDATE_FLOOR:
    case CMD.UPDATE_BUILDING:
      return createCommand(type, { id: payload.id, ...previousState }, { undoable: false });

    // MOVE → MOVE back
    case CMD.MOVE_ELEMENT:
    case CMD.MOVE_WALL:
    case CMD.MOVE_FURNITURE:
      return createCommand(type, { id: payload.id, ...previousState }, { undoable: false });

    // ROTATE → ROTATE back
    case CMD.ROTATE_ELEMENT:
    case CMD.ROTATE_FURNITURE:
      return createCommand(type, { id: payload.id, rotation: previousState.rotation }, { undoable: false });

    // RESIZE → RESIZE back
    case CMD.RESIZE_ELEMENT:
      return createCommand(type, { id: payload.id, ...previousState }, { undoable: false });

    // ASSIGN_MATERIAL → re-assign old material
    case CMD.ASSIGN_MATERIAL:
      return createCommand(CMD.ASSIGN_MATERIAL, { id: payload.id, material: previousState.material }, { undoable: false });

    default:
      return null;
  }
}

/**
 * Get the element type from a command type
 */
export function getElementTypeFromCommand(cmdType) {
  const mapping = {
    WALL: 'walls', DOOR: 'doors', WINDOW: 'windows', ROOM: 'rooms',
    SLAB: 'slabs', ROOF: 'roofs', STAIR: 'stairs',
    COLUMN: 'columns', BEAM: 'beams',
    FURNITURE: 'furniture', LANDSCAPE: 'landscape',
    FLOOR: 'floors', BUILDING: 'buildings',
  };
  for (const [key, value] of Object.entries(mapping)) {
    if (cmdType.includes(key)) return value;
  }
  return null;
}

/**
 * Categorize a command for the history panel display
 */
export function getCommandLabel(cmd) {
  const action = cmd.type.split('_')[0]; // CREATE, UPDATE, DELETE, MOVE, etc.
  const target = cmd.type.split('_').slice(1).join(' ');
  const name = cmd.payload?.name || cmd.payload?.id?.substring(0, 8) || '';
  return `${action} ${target}${name ? ` "${name}"` : ''}`;
}
