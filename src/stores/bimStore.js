// ═══════════════════════════════════════════════════════════════
// Zustand BIM Store — Central state for the Building Designer
// Replaces Redux for real-time 3D BIM state management
// ═══════════════════════════════════════════════════════════════
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { createCommand, createInverseCommand, getElementTypeFromCommand, CMD } from './commandSystem';
import { BIM_ENGINE_STATUS, VIEW_MODES, RENDER_MODES, CAMERA_PRESETS, TIME_OF_DAY, DEFAULTS, ROOF_VISIBILITY, CUTAWAY_DIRECTIONS, FLOOR_DISPLAY } from './bimTypes';
import bimService from '../services/bimService';

const MAX_UNDO = 100;

const useBimStore = create(
  subscribeWithSelector((set, get) => ({
    // ─── Project ─────────────────────────────────────────────
    projectId: null,
    projectName: '',
    projectLoading: false,
    projectError: null,

    // ─── Site ────────────────────────────────────────────────
    site: {
      width: 40000,  // mm
      length: 30000,
      elevation: 0,
    },

    // ─── Building ────────────────────────────────────────────
    building: null, // { id, name, type, width, length, position, rotation }

    // ─── Floors ──────────────────────────────────────────────
    floors: [],  // [{ id, name, number, elevation, floorHeight, visible, locked }]
    activeFloorId: null,

    // ─── Elements (per-floor, keyed by floor ID) ─────────────
    // Each is an object: { [floorId]: [...elements] }
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

    // ─── Selection ───────────────────────────────────────────
    selectedIds: [],
    hoveredId: null,
    activeTool: 'select',
    activeToolCategory: null,

    // ─── View ────────────────────────────────────────────────
    viewMode: VIEW_MODES.VIEW_3D,
    renderMode: RENDER_MODES.REALISTIC,
    cameraPreset: CAMERA_PRESETS.PERSPECTIVE,
    timeOfDay: TIME_OF_DAY.DAY,
    showGrid: true,
    showDimensions: true,
    showRoomLabels: true,

    // ─── UI ──────────────────────────────────────────────────
    showBuildingWizard: false,
    showMaterialBrowser: false,
    showFurnitureCatalog: false,
    showBonsaiPanel: false,
    showAIAssistant: false,
    showVersionHistory: false,

    // ─── Undo / Redo ─────────────────────────────────────────
    undoStack: [],
    redoStack: [],
    hasUnsavedChanges: false,
    lastSaved: null,

    // ─── Save Status ─────────────────────────────────────────
    saveStatus: 'idle', // 'idle' | 'saving' | 'saved' | 'error'
    saveError: null,

    // ─── BIM Engine ──────────────────────────────────────────
    bimEngineStatus: BIM_ENGINE_STATUS.OFFLINE,

    // ─── Walkthrough ─────────────────────────────────────────
    walkthroughActive: false,

    // ─── Dollhouse / Cutaway (visual-only state) ─────────────
    roofVisibility: ROOF_VISIBILITY.SHOW,
    cutawayDirection: CUTAWAY_DIRECTIONS.NONE,
    cutawayAmount: 0.5,
    sectionPlanes: {
      x: { enabled: false, position: 0.5 },
      y: { enabled: false, position: 0.5 },
      z: { enabled: false, position: 0.5 },
    },
    floorDisplay: FLOOR_DISPLAY.ALL,
    explodedFloorSpacing: 2.0,
    visibleFloorId: null, // null = all visible
    showFurniture: true,
    showShadows: true,
    cameraPresetTarget: null, // { position, target } for smooth transition

    // ═════════════════════════════════════════════════════════
    //                    ACTIONS
    // ═════════════════════════════════════════════════════════

    // ─── Project Loading ─────────────────────────────────────
    setProject: (project) => set({
      projectId: project._id || project.id,
      projectName: project.name || project.project_name || '',
      building: project.building || null,
      floors: project.floors || [],
      activeFloorId: project.floors?.[0]?.id || null,
      site: project.site || get().site,
    }),

    setProjectLoading: (loading) => set({ projectLoading: loading }),
    setProjectError: (error) => set({ projectError: error }),

    // ─── Element Getters ─────────────────────────────────────
    getFloorElements: (floorId) => {
      const s = get();
      const fid = floorId || s.activeFloorId;
      return {
        walls: s.walls[fid] || [],
        doors: s.doors[fid] || [],
        windows: s.windows[fid] || [],
        rooms: s.rooms[fid] || [],
        slabs: s.slabs[fid] || [],
        stairs: s.stairs[fid] || [],
        columns: s.columns[fid] || [],
        beams: s.beams[fid] || [],
        furniture: s.furniture[fid] || [],
      };
    },

    getAllElements: () => {
      const s = get();
      const result = { walls: [], doors: [], windows: [], rooms: [], slabs: [], roofs: [], stairs: [], columns: [], beams: [], furniture: [], landscape: [] };
      for (const floor of s.floors) {
        const fid = floor.id;
        for (const key of Object.keys(result)) {
          if (key === 'roofs' || key === 'landscape') continue;
          result[key].push(...(s[key][fid] || []));
        }
      }
      result.roofs = s.roofs['building'] || [];
      result.landscape = s.landscape['site'] || [];
      return result;
    },

    getElementById: (id) => {
      const s = get();
      const elementLists = ['walls', 'doors', 'windows', 'rooms', 'slabs', 'roofs', 'stairs', 'columns', 'beams', 'furniture', 'landscape'];
      for (const listName of elementLists) {
        const collection = s[listName];
        for (const key of Object.keys(collection)) {
          const found = collection[key]?.find(e => e.id === id);
          if (found) return { ...found, _elementType: listName };
        }
      }
      return null;
    },

    // ─── Execute Command (central entry point) ───────────────
    executeCommand: (cmdType, payload, options = {}) => {
      const state = get();
      const floorId = payload.floorId || state.activeFloorId;
      const elementId = payload.id || uuid();
      const fullPayload = { ...payload, id: elementId, floorId };

      const cmd = createCommand(cmdType, fullPayload, {
        projectId: state.projectId,
        floorId,
        ...options,
      });

      // Get previous state for undo
      let previousState = null;
      if (cmd.undoable) {
        const elementType = getElementTypeFromCommand(cmdType);
        if (elementType && payload.id) {
          const collection = state[elementType];
          const bucket = elementType === 'roofs' ? 'building' : (elementType === 'landscape' ? 'site' : floorId);
          previousState = collection[bucket]?.find(e => e.id === payload.id);
          previousState = previousState ? { ...previousState } : null;
        }
      }

      // Apply command locally
      _applyCommand(set, get, cmd);

      // Push to undo stack
      if (cmd.undoable) {
        const inverse = createInverseCommand(cmd, previousState);
        set(s => ({
          undoStack: [...s.undoStack.slice(-MAX_UNDO), { cmd, inverse, previousState }],
          redoStack: [],
          hasUnsavedChanges: true,
        }));
      }

      // Sync command to server via debounced save
      _scheduleSave(get);

      return elementId;
    },

    // ─── Undo / Redo ─────────────────────────────────────────
    undo: () => {
      const { undoStack } = get();
      if (undoStack.length === 0) return;
      const entry = undoStack[undoStack.length - 1];
      if (entry.inverse) {
        _applyCommand(set, get, entry.inverse);
      }
      set(s => ({
        undoStack: s.undoStack.slice(0, -1),
        redoStack: [...s.redoStack, entry],
      }));
    },

    redo: () => {
      const { redoStack } = get();
      if (redoStack.length === 0) return;
      const entry = redoStack[redoStack.length - 1];
      _applyCommand(set, get, entry.cmd);
      set(s => ({
        redoStack: s.redoStack.slice(0, -1),
        undoStack: [...s.undoStack, entry],
      }));
    },

    // ─── Selection ───────────────────────────────────────────
    select: (id) => set({ selectedIds: [id] }),
    addToSelection: (id) => set(s => ({ selectedIds: [...s.selectedIds, id] })),
    clearSelection: () => set({ selectedIds: [], hoveredId: null }),
    setHovered: (id) => set({ hoveredId: id }),

    // ─── Tool ────────────────────────────────────────────────
    setActiveTool: (tool, category) => set({ activeTool: tool, activeToolCategory: category || null }),

    // ─── Floor ───────────────────────────────────────────────
    setActiveFloor: (floorId) => set({ activeFloorId: floorId }),

    // ─── View ────────────────────────────────────────────────
    setViewMode: (mode) => set({ viewMode: mode }),
    setRenderMode: (mode) => set({ renderMode: mode }),
    setCameraPreset: (preset) => set({ cameraPreset: preset }),
    setTimeOfDay: (time) => set({ timeOfDay: time }),
    toggleGrid: () => set(s => ({ showGrid: !s.showGrid })),
    toggleDimensions: () => set(s => ({ showDimensions: !s.showDimensions })),
    toggleRoomLabels: () => set(s => ({ showRoomLabels: !s.showRoomLabels })),

    // ─── UI Panels ───────────────────────────────────────────
    toggleBuildingWizard: () => set(s => ({ showBuildingWizard: !s.showBuildingWizard })),
    toggleMaterialBrowser: () => set(s => ({ showMaterialBrowser: !s.showMaterialBrowser })),
    toggleFurnitureCatalog: () => set(s => ({ showFurnitureCatalog: !s.showFurnitureCatalog })),
    toggleBonsaiPanel: () => set(s => ({ showBonsaiPanel: !s.showBonsaiPanel })),
    toggleAIAssistant: () => set(s => ({ showAIAssistant: !s.showAIAssistant })),
    toggleVersionHistory: () => set(s => ({ showVersionHistory: !s.showVersionHistory })),

    // ─── Walkthrough ─────────────────────────────────────────
    toggleWalkthrough: () => set(s => ({ walkthroughActive: !s.walkthroughActive })),

    // ─── Dollhouse / Cutaway Actions ─────────────────────────
    setRoofVisibility: (v) => set({ roofVisibility: v }),
    setCutaway: (direction, amount) => set(s => ({
      cutawayDirection: direction !== undefined ? direction : s.cutawayDirection,
      cutawayAmount: amount !== undefined ? amount : s.cutawayAmount,
    })),
    setSectionPlane: (axis, changes) => set(s => ({
      sectionPlanes: {
        ...s.sectionPlanes,
        [axis]: { ...s.sectionPlanes[axis], ...changes },
      },
    })),
    setFloorDisplay: (mode) => set({ floorDisplay: mode }),
    setExplodedSpacing: (v) => set({ explodedFloorSpacing: v }),
    setVisibleFloor: (floorId) => set({ visibleFloorId: floorId }),
    toggleFurniture: () => set(s => ({ showFurniture: !s.showFurniture })),
    toggleShadows: () => set(s => ({ showShadows: !s.showShadows })),
    setCameraPresetTarget: (target) => set({ cameraPresetTarget: target }),

    // Enter dollhouse mode
    enterDollhouse: () => set({
      viewMode: VIEW_MODES.DOLLHOUSE,
      roofVisibility: ROOF_VISIBILITY.HIDE,
      walkthroughActive: false,
    }),

    // Exit dollhouse mode
    exitDollhouse: () => set({
      viewMode: VIEW_MODES.VIEW_3D,
      roofVisibility: ROOF_VISIBILITY.SHOW,
      cutawayDirection: CUTAWAY_DIRECTIONS.NONE,
      floorDisplay: FLOOR_DISPLAY.ALL,
      visibleFloorId: null,
    }),

    // ─── BIM Engine ──────────────────────────────────────────
    setBimEngineStatus: (status) => set({ bimEngineStatus: status }),

    // ─── Bulk Load (from server/template) ────────────────────
    loadBuildingData: (data) => {
      const { building, floors, walls, doors, windows, rooms, slabs, roofs, stairs, columns, beams, furniture, landscape, site } = data;
      set({
        building: building || null,
        floors: floors || [],
        activeFloorId: floors?.[0]?.id || null,
        walls: walls || {},
        doors: doors || {},
        windows: windows || {},
        rooms: rooms || {},
        slabs: slabs || {},
        roofs: roofs || {},
        stairs: stairs || {},
        columns: columns || {},
        beams: beams || {},
        furniture: furniture || {},
        landscape: landscape || {},
        site: site || get().site,
        undoStack: [],
        redoStack: [],
        hasUnsavedChanges: false,
        selectedIds: [],
        hoveredId: null,
      });
    },

    // ─── Reset ───────────────────────────────────────────────
    resetStore: () => set({
      building: null,
      floors: [],
      activeFloorId: null,
      walls: {}, doors: {}, windows: {}, rooms: {}, slabs: {}, roofs: {},
      stairs: {}, columns: {}, beams: {}, furniture: {}, landscape: {},
      selectedIds: [], hoveredId: null,
      undoStack: [], redoStack: [],
      hasUnsavedChanges: false,
      showBuildingWizard: false,
    }),

    // ─── Mark Saved ──────────────────────────────────────────
    markSaved: () => set({ hasUnsavedChanges: false, lastSaved: new Date().toISOString(), saveStatus: 'saved' }),

    // ─── Server Persistence ──────────────────────────────────
    saveBuildingToServer: async () => {
      const state = get();
      if (!state.projectId) {
        console.warn('Cannot save: no projectId set');
        return;
      }

      set({ saveStatus: 'saving', saveError: null });

      try {
        // Collect all BIM data
        const allElements = state.getAllElements();
        const buildingData = {
          building: state.building,
          site: state.site,
          floors: state.floors,
          walls: state.walls,
          doors: state.doors,
          windows: state.windows,
          rooms: state.rooms,
          slabs: state.slabs,
          roofs: state.roofs,
          stairs: state.stairs,
          columns: state.columns,
          beams: state.beams,
          furniture: state.furniture,
          landscape: state.landscape,
        };

        await bimService.updateProject(state.projectId, {
          building_data: buildingData,
          element_counts: {
            walls: allElements.walls.length,
            doors: allElements.doors.length,
            windows: allElements.windows.length,
            rooms: allElements.rooms.length,
            floors: state.floors.length,
            furniture: allElements.furniture.length,
          },
        });

        set({
          hasUnsavedChanges: false,
          lastSaved: new Date().toISOString(),
          saveStatus: 'saved',
          saveError: null,
        });

        // Reset to idle after 3 seconds
        setTimeout(() => {
          const current = get();
          if (current.saveStatus === 'saved') {
            set({ saveStatus: 'idle' });
          }
        }, 3000);
      } catch (error) {
        console.error('BIM save failed:', error);
        set({
          saveStatus: 'error',
          saveError: error.response?.data?.message || error.message || 'Save failed',
        });
      }
    },

    loadBuildingFromServer: async (projectId) => {
      set({ projectLoading: true, projectError: null });

      try {
        const { data: project } = await bimService.getProject(projectId);

        // Set project metadata
        set({
          projectId: project._id || projectId,
          projectName: project.design_name || project.name || '',
        });

        // If the project has stored building data, load it
        if (project.building_data) {
          const bd = project.building_data;
          get().loadBuildingData({
            building: bd.building || null,
            floors: bd.floors || [],
            walls: bd.walls || {},
            doors: bd.doors || {},
            windows: bd.windows || {},
            rooms: bd.rooms || {},
            slabs: bd.slabs || {},
            roofs: bd.roofs || {},
            stairs: bd.stairs || {},
            columns: bd.columns || {},
            beams: bd.beams || {},
            furniture: bd.furniture || {},
            landscape: bd.landscape || {},
            site: bd.site || undefined,
          });
        }

        set({ projectLoading: false });
        return project;
      } catch (error) {
        console.error('BIM project load failed:', error);
        set({
          projectLoading: false,
          projectError: error.response?.data?.message || error.message || 'Failed to load project',
        });
        return null;
      }
    },
  }))
);
// ═════════════════════════════════════════════════════════════
//          DEBOUNCED AUTO-SAVE (2s after last change)
// ═════════════════════════════════════════════════════════════
let _saveTimer = null;
function _scheduleSave(getState) {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    const state = getState();
    if (state.projectId && state.hasUnsavedChanges) {
      state.saveBuildingToServer();
    }
  }, 2000); // 2 second debounce
}

// ═════════════════════════════════════════════════════════════
//          LOCAL COMMAND APPLICATOR (pure state update)
// ═════════════════════════════════════════════════════════════

function _applyCommand(set, get, cmd) {
  const { type, payload } = cmd;
  const floorId = payload.floorId || get().activeFloorId;

  // Helper: add element to a collection bucket
  const addElement = (collection, bucket, element) => {
    set(s => ({
      [collection]: {
        ...s[collection],
        [bucket]: [...(s[collection][bucket] || []), element],
      },
    }));
  };

  // Helper: update element in a collection bucket
  const updateElement = (collection, bucket, id, changes) => {
    set(s => ({
      [collection]: {
        ...s[collection],
        [bucket]: (s[collection][bucket] || []).map(e =>
          e.id === id ? { ...e, ...changes, updatedAt: Date.now() } : e
        ),
      },
    }));
  };

  // Helper: remove element from a collection bucket
  const removeElement = (collection, bucket, id) => {
    set(s => ({
      [collection]: {
        ...s[collection],
        [bucket]: (s[collection][bucket] || []).filter(e => e.id !== id),
      },
    }));
  };

  switch (type) {
    // ═══ BUILDING ═══
    case CMD.CREATE_BUILDING:
      set({ building: { id: payload.id, ...payload } });
      break;
    case CMD.UPDATE_BUILDING:
      set(s => ({ building: { ...s.building, ...payload } }));
      break;

    // ═══ FLOOR ═══
    case CMD.CREATE_FLOOR:
      set(s => ({
        floors: [...s.floors, {
          id: payload.id,
          name: payload.name || `Floor ${s.floors.length}`,
          number: payload.number ?? s.floors.length,
          elevation: payload.elevation ?? (s.floors.length * (payload.floorHeight || DEFAULTS.FLOOR_HEIGHT)),
          floorHeight: payload.floorHeight || DEFAULTS.FLOOR_HEIGHT,
          visible: true,
          locked: false,
        }],
        activeFloorId: s.activeFloorId || payload.id,
      }));
      break;
    case CMD.UPDATE_FLOOR:
      set(s => ({
        floors: s.floors.map(f => f.id === payload.id ? { ...f, ...payload } : f),
      }));
      break;
    case CMD.DELETE_FLOOR:
      set(s => ({
        floors: s.floors.filter(f => f.id !== payload.id),
        activeFloorId: s.activeFloorId === payload.id
          ? s.floors.find(f => f.id !== payload.id)?.id || null
          : s.activeFloorId,
      }));
      break;

    // ═══ WALLS ═══
    case CMD.CREATE_WALL:
      addElement('walls', floorId, {
        id: payload.id,
        type: 'wall',
        wallType: payload.wallType || 'exterior',
        start: payload.start, // { x, y } in mm
        end: payload.end,
        height: payload.height || DEFAULTS.FLOOR_HEIGHT,
        thickness: payload.thickness || DEFAULTS.WALL_THICKNESS,
        baseElevation: payload.baseElevation || 0,
        material: payload.material || 'concrete',
        layers: payload.layers || null,
        color: payload.color || '#D4C4A8',
        openings: [], // door/window ids
        floorId,
        ifcGuid: payload.ifcGuid || null,
        ifcType: 'IfcWallStandardCase',
        createdAt: Date.now(),
      });
      break;
    case CMD.UPDATE_WALL:
    case CMD.MOVE_WALL:
      updateElement('walls', floorId, payload.id, payload);
      break;
    case CMD.DELETE_WALL:
      removeElement('walls', floorId, payload.id);
      break;

    // ═══ DOORS ═══
    case CMD.CREATE_DOOR:
      addElement('doors', floorId, {
        id: payload.id,
        type: 'door',
        doorType: payload.doorType || 'single',
        wallId: payload.wallId,
        position: payload.position || 0.5, // 0-1 along wall
        width: payload.width || DEFAULTS.DOOR_WIDTH,
        height: payload.height || DEFAULTS.DOOR_HEIGHT,
        sillHeight: 0,
        frameWidth: payload.frameWidth || 50,
        swingDirection: payload.swingDirection || 'left',
        swingAngle: payload.swingAngle || 90,
        material: payload.material || 'wood_oak',
        color: payload.color || '#8B4513',
        floorId,
        ifcGuid: payload.ifcGuid || null,
        ifcType: 'IfcDoor',
        createdAt: Date.now(),
      });
      // Add opening to wall
      updateElement('walls', floorId, payload.wallId, {});
      break;
    case CMD.UPDATE_DOOR:
      updateElement('doors', floorId, payload.id, payload);
      break;
    case CMD.DELETE_DOOR:
      removeElement('doors', floorId, payload.id);
      break;

    // ═══ WINDOWS ═══
    case CMD.CREATE_WINDOW:
      addElement('windows', floorId, {
        id: payload.id,
        type: 'window',
        windowType: payload.windowType || 'fixed',
        wallId: payload.wallId,
        position: payload.position || 0.5,
        width: payload.width || DEFAULTS.WINDOW_WIDTH,
        height: payload.height || DEFAULTS.WINDOW_HEIGHT,
        sillHeight: payload.sillHeight || DEFAULTS.WINDOW_SILL,
        frameWidth: payload.frameWidth || 50,
        glassType: payload.glassType || 'clear',
        material: payload.material || 'aluminium',
        color: payload.color || '#87CEEB',
        floorId,
        ifcGuid: payload.ifcGuid || null,
        ifcType: 'IfcWindow',
        createdAt: Date.now(),
      });
      break;
    case CMD.UPDATE_WINDOW:
      updateElement('windows', floorId, payload.id, payload);
      break;
    case CMD.DELETE_WINDOW:
      removeElement('windows', floorId, payload.id);
      break;

    // ═══ ROOMS ═══
    case CMD.CREATE_ROOM:
      addElement('rooms', floorId, {
        id: payload.id,
        type: 'room',
        roomType: payload.roomType || 'living_room',
        name: payload.name || 'Room',
        boundary: payload.boundary || [], // [{ x, y }, ...]
        area: payload.area || 0,
        perimeter: payload.perimeter || 0,
        volume: payload.volume || 0,
        ceilingHeight: payload.ceilingHeight || DEFAULTS.FLOOR_HEIGHT,
        floorMaterial: payload.floorMaterial || 'tile_white',
        ceilingMaterial: payload.ceilingMaterial || 'paint_white',
        wallIds: payload.wallIds || [],
        color: payload.color || '#4FC3F7',
        floorId,
        ifcGuid: payload.ifcGuid || null,
        ifcType: 'IfcSpace',
        createdAt: Date.now(),
      });
      break;
    case CMD.UPDATE_ROOM:
      updateElement('rooms', floorId, payload.id, payload);
      break;
    case CMD.DELETE_ROOM:
      removeElement('rooms', floorId, payload.id);
      break;

    // ═══ SLABS ═══
    case CMD.CREATE_SLAB:
      addElement('slabs', floorId, {
        id: payload.id,
        type: 'slab',
        boundary: payload.boundary || [],
        thickness: payload.thickness || DEFAULTS.SLAB_THICKNESS,
        elevation: payload.elevation || 0,
        material: payload.material || 'concrete',
        floorId,
        ifcType: 'IfcSlab',
        createdAt: Date.now(),
      });
      break;
    case CMD.UPDATE_SLAB:
      updateElement('slabs', floorId, payload.id, payload);
      break;
    case CMD.DELETE_SLAB:
      removeElement('slabs', floorId, payload.id);
      break;

    // ═══ ROOFS ═══
    case CMD.CREATE_ROOF:
      addElement('roofs', 'building', {
        id: payload.id,
        type: 'roof',
        roofType: payload.roofType || 'flat',
        pitch: payload.pitch || 30,
        overhang: payload.overhang || DEFAULTS.ROOF_OVERHANG,
        thickness: payload.thickness || 200,
        ridgeHeight: payload.ridgeHeight || 0,
        material: payload.material || 'roof_tile',
        color: payload.color || '#A0522D',
        boundary: payload.boundary || [],
        ifcType: 'IfcRoof',
        createdAt: Date.now(),
      });
      break;
    case CMD.UPDATE_ROOF:
      updateElement('roofs', 'building', payload.id, payload);
      break;
    case CMD.DELETE_ROOF:
      removeElement('roofs', 'building', payload.id);
      break;

    // ═══ STAIRS ═══
    case CMD.CREATE_STAIR:
      addElement('stairs', floorId, {
        id: payload.id,
        type: 'stair',
        stairType: payload.stairType || 'straight',
        position: payload.position || { x: 0, y: 0 },
        rotation: payload.rotation || 0,
        width: payload.width || DEFAULTS.STAIR_WIDTH,
        floorHeight: payload.floorHeight || DEFAULTS.FLOOR_HEIGHT,
        riserHeight: payload.riserHeight || DEFAULTS.STAIR_RISER,
        treadDepth: payload.treadDepth || DEFAULTS.STAIR_TREAD,
        numSteps: payload.numSteps || Math.ceil(DEFAULTS.FLOOR_HEIGHT / DEFAULTS.STAIR_RISER),
        hasLanding: payload.hasLanding || false,
        material: payload.material || 'concrete',
        railingHeight: payload.railingHeight || DEFAULTS.RAILING_HEIGHT,
        floorId,
        ifcType: 'IfcStairFlight',
        createdAt: Date.now(),
      });
      break;
    case CMD.UPDATE_STAIR:
      updateElement('stairs', floorId, payload.id, payload);
      break;
    case CMD.DELETE_STAIR:
      removeElement('stairs', floorId, payload.id);
      break;

    // ═══ COLUMNS ═══
    case CMD.CREATE_COLUMN:
      addElement('columns', floorId, {
        id: payload.id,
        type: 'column',
        position: payload.position || { x: 0, y: 0 },
        width: payload.width || DEFAULTS.COLUMN_SIZE,
        depth: payload.depth || DEFAULTS.COLUMN_SIZE,
        height: payload.height || DEFAULTS.FLOOR_HEIGHT,
        shape: payload.shape || 'rectangular', // rectangular, circular
        material: payload.material || 'concrete',
        floorId,
        ifcType: 'IfcColumn',
        createdAt: Date.now(),
      });
      break;
    case CMD.UPDATE_COLUMN:
      updateElement('columns', floorId, payload.id, payload);
      break;
    case CMD.DELETE_COLUMN:
      removeElement('columns', floorId, payload.id);
      break;

    // ═══ BEAMS ═══
    case CMD.CREATE_BEAM:
      addElement('beams', floorId, {
        id: payload.id,
        type: 'beam',
        start: payload.start,
        end: payload.end,
        width: payload.width || DEFAULTS.BEAM_WIDTH,
        depth: payload.depth || DEFAULTS.BEAM_DEPTH,
        material: payload.material || 'concrete',
        floorId,
        ifcType: 'IfcBeam',
        createdAt: Date.now(),
      });
      break;
    case CMD.UPDATE_BEAM:
      updateElement('beams', floorId, payload.id, payload);
      break;
    case CMD.DELETE_BEAM:
      removeElement('beams', floorId, payload.id);
      break;

    // ═══ FURNITURE ═══
    case CMD.CREATE_FURNITURE:
      addElement('furniture', floorId, {
        id: payload.id,
        type: 'furniture',
        itemId: payload.itemId,
        name: payload.name || 'Furniture',
        category: payload.category || 'seating',
        position: payload.position || { x: 0, y: 0, z: 0 },
        rotation: payload.rotation || { x: 0, y: 0, z: 0 },
        width: payload.width || 1000,
        depth: payload.depth || 1000,
        height: payload.height || 750,
        material: payload.material || null,
        color: payload.color || '#D2B48C',
        glbPath: payload.glbPath || null,
        floorId,
        ifcType: 'IfcFurnishingElement',
        createdAt: Date.now(),
      });
      break;
    case CMD.UPDATE_FURNITURE:
    case CMD.MOVE_FURNITURE:
    case CMD.ROTATE_FURNITURE:
      updateElement('furniture', floorId, payload.id, payload);
      break;
    case CMD.DELETE_FURNITURE:
      removeElement('furniture', floorId, payload.id);
      break;

    // ═══ LANDSCAPE ═══
    case CMD.CREATE_LANDSCAPE:
      addElement('landscape', 'site', {
        id: payload.id,
        type: 'landscape',
        itemId: payload.itemId,
        name: payload.name || 'Landscape',
        category: payload.category || 'vegetation',
        position: payload.position || { x: 0, y: 0, z: 0 },
        rotation: payload.rotation || 0,
        scale: payload.scale || 1,
        dimensions: payload.dimensions || {},
        createdAt: Date.now(),
      });
      break;
    case CMD.UPDATE_LANDSCAPE:
      updateElement('landscape', 'site', payload.id, payload);
      break;
    case CMD.DELETE_LANDSCAPE:
      removeElement('landscape', 'site', payload.id);
      break;

    // ═══ MATERIAL ═══
    case CMD.ASSIGN_MATERIAL: {
      const elem = get().getElementById(payload.id);
      if (elem) {
        const elementType = elem._elementType;
        const bucket = (elementType === 'roofs') ? 'building' : (elementType === 'landscape' ? 'site' : floorId);
        updateElement(elementType, bucket, payload.id, { material: payload.material });
      }
      break;
    }

    // ═══ GENERAL TRANSFORMS ═══
    case CMD.MOVE_ELEMENT: {
      const elem = get().getElementById(payload.id);
      if (elem) {
        const elementType = elem._elementType;
        const bucket = (elementType === 'roofs') ? 'building' : (elementType === 'landscape' ? 'site' : floorId);
        updateElement(elementType, bucket, payload.id, { position: payload.position, start: payload.start, end: payload.end });
      }
      break;
    }

    case CMD.GENERATE_BUILDING:
    case CMD.APPLY_TEMPLATE:
      // These are handled by BuildingGenerator which calls loadBuildingData
      break;

    default:
      console.warn(`Unknown command: ${type}`);
  }
}

export default useBimStore;
