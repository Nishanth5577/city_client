import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import bimService from '../../services/bimService';
import { TOOLS, VIEW_MODES, LAYERS } from '../../utils/bimConstants';

// Async thunks
export const fetchBimProjects = createAsyncThunk('bim/fetchProjects', async (params, { rejectWithValue }) => {
  try { const { data } = await bimService.getProjects(params); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch projects'); }
});

export const fetchBimProject = createAsyncThunk('bim/fetchProject', async (id, { rejectWithValue }) => {
  try { const { data } = await bimService.getProject(id); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch project'); }
});

export const createBimProject = createAsyncThunk('bim/createProject', async (projectData, { rejectWithValue }) => {
  try { const { data } = await bimService.createProject(projectData); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to create project'); }
});

export const updateBimProject = createAsyncThunk('bim/updateProject', async ({ id, updates }, { rejectWithValue }) => {
  try { const { data } = await bimService.updateProject(id, updates); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to update project'); }
});

export const fetchFloor = createAsyncThunk('bim/fetchFloor', async (id, { rejectWithValue }) => {
  try { const { data } = await bimService.getFloor(id); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch floor'); }
});

export const saveCanvasData = createAsyncThunk('bim/saveCanvas', async ({ floorId, canvasData }, { rejectWithValue }) => {
  try { const { data } = await bimService.saveCanvas(floorId, { canvas_data: canvasData }); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to save canvas'); }
});

export const createBimElement = createAsyncThunk('bim/createElement', async (elementData, { rejectWithValue }) => {
  try { const { data } = await bimService.createElement(elementData); return { element_type: elementData.element_type, element: data }; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to create element'); }
});

export const updateBimElement = createAsyncThunk('bim/updateElement', async ({ type, id, data: updates }, { rejectWithValue }) => {
  try { const { data } = await bimService.updateElement(type, id, updates); return { element_type: type, element: data }; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to update element'); }
});

export const deleteBimElement = createAsyncThunk('bim/deleteElement', async ({ type, id }, { rejectWithValue }) => {
  try { await bimService.deleteElement(type, id); return { element_type: type, element_id: id }; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to delete element'); }
});

export const fetchMaterials = createAsyncThunk('bim/fetchMaterials', async (params, { rejectWithValue }) => {
  try { const { data } = await bimService.getMaterials(params); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch materials'); }
});

export const generateBOQ = createAsyncThunk('bim/generateBOQ', async (data, { rejectWithValue }) => {
  try { const res = await bimService.generateBOQ(data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to generate BOQ'); }
});

export const fetchAnalytics = createAsyncThunk('bim/fetchAnalytics', async (_, { rejectWithValue }) => {
  try { const { data } = await bimService.getAnalytics(); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch analytics'); }
});

// MEP thunks
export const fetchMEPElements = createAsyncThunk('bim/fetchMEPElements', async ({ type, floorId }, { rejectWithValue }) => {
  try { const { data } = await bimService.getMEPElements(type, floorId); return { type, elements: data }; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch MEP elements'); }
});

export const createMEPElement = createAsyncThunk('bim/createMEPElement', async ({ type, data: elData }, { rejectWithValue }) => {
  try { const { data } = await bimService.createMEPElement(type, elData); return { type, element: data }; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to create MEP element'); }
});

export const deleteMEPElement = createAsyncThunk('bim/deleteMEPElement', async ({ type, id }, { rejectWithValue }) => {
  try { await bimService.deleteMEPElement(type, id); return { type, id }; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to delete MEP element'); }
});

// ═══════ Bonsai / IFC Thunks ═══════
export const checkBonsaiStatus = createAsyncThunk('bim/checkBonsaiStatus', async (_, { rejectWithValue }) => {
  try { const { data } = await bimService.getBonsaiStatus(); return data; }
  catch (err) { return rejectWithValue('Bonsai service unavailable'); }
});

export const exportProjectToIFC = createAsyncThunk('bim/exportToIFC', async ({ projectId, config }, { rejectWithValue }) => {
  try { const { data } = await bimService.exportToIFC(projectId, config); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'IFC export failed'); }
});

export const importIFCToProject = createAsyncThunk('bim/importIFC', async (formData, { rejectWithValue }) => {
  try { const { data } = await bimService.importIFC(formData); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'IFC import failed'); }
});

export const fetchIFCExports = createAsyncThunk('bim/fetchIFCExports', async (projectId, { rejectWithValue }) => {
  try { const { data } = await bimService.getIFCExports(projectId); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch IFC exports'); }
});

export const validateProjectIFC = createAsyncThunk('bim/validateIFC', async (exportId, { rejectWithValue }) => {
  try { const { data } = await bimService.validateIFC(exportId); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'IFC validation failed'); }
});

const initialState = {
  // Project list
  projects: [],
  totalProjects: 0,
  projectsLoading: false,

  // Active project
  activeProject: null,
  activeProjectLoading: false,

  // Active floor
  activeFloor: null,
  activeFloorId: null,
  activeBuildingId: null,

  // Canvas state
  elements: { walls: [], columns: [], beams: [], doors: [], windows: [], stairs: [], furniture: [], rooms: [], slabs: [], roofs: [], foundations: [], railings: [], ceilings: [] },
  selectedElementIds: [],
  selectedElementType: null,
  hoveredElementId: null,

  // Tool state
  activeTool: TOOLS.SELECT,
  viewMode: VIEW_MODES.PLAN_2D,
  renderMode: 'realistic',
  transformMode: 'translate',
  isDrawing: false,
  drawingPoints: [],
  toolSettings: {
    wallThickness: 230,
    wallType: 'exterior',
    columnPreset: 0,
    doorPreset: 0,
    windowPreset: 0,
    furniturePreset: 0,
    gridSize: 100,
    snapEnabled: true,
  },

  // View state
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  layers: LAYERS,

  // History (undo/redo)
  undoStack: [],
  redoStack: [],

  // Collaboration
  collaborators: [],
  remoteCursors: {},

  // Materials
  materials: [],
  materialsLoading: false,

  // Cost estimation
  costEstimation: null,
  costLoading: false,

  // Analytics
  analytics: null,
  analyticsLoading: false,

  // UI
  showComponentLibrary: true,
  showPropertiesPanel: true,
  showLayerPanel: false,
  showTimeline: false,
  showModelTree: false,
  darkMode: true,

  // Auto-save
  hasUnsavedChanges: false,
  lastSaved: null,
  saving: false,

  // MEP Elements
  electricalElements: [],
  plumbingElements: [],
  hvacElements: [],
  solarElements: [],
  mepLoading: false,

  // Structural
  structuralDesign: null,
  structuralLoading: false,

  // Camera & Presentation (new)
  cameraMode: 'orbit', // orbit, walk, first_person, fly
  walkMode: false,
  presentationMode: 'design', // design, realistic, presentation, walkthrough
  timeOfDay: 14, // 0-24 hour for lighting
  lightingPreset: 'afternoon',

  // Roof settings (new)
  roofSettings: {
    type: 'flat',
    slope: 30,
    ridgeHeight: 1200,
    overhang: 300,
    thickness: 150,
    hasParapet: true,
    parapetHeight: 900,
    material: 'concrete',
  },

  // Bonsai / IFC
  bonsaiConnected: false,
  bonsaiStatus: null,
  bonsaiLoading: false,
  ifcExporting: false,
  ifcExportProgress: null,
  ifcExports: [],
  ifcExportsLoading: false,
  ifcImporting: false,
  ifcImportResult: null,
  ifcValidation: null,
  ifcValidating: false,
  showBonsaiPanel: false,

  error: null,
};

const bimSlice = createSlice({
  name: 'bim',
  initialState,
  reducers: {
    // Tool management
    setActiveTool: (state, action) => { state.activeTool = action.payload; state.isDrawing = false; state.drawingPoints = []; },
    setViewMode: (state, action) => { state.viewMode = action.payload; },
    setToolSettings: (state, action) => { state.toolSettings = { ...state.toolSettings, ...action.payload }; },

    // Drawing
    startDrawing: (state, action) => { state.isDrawing = true; state.drawingPoints = [action.payload]; },
    addDrawingPoint: (state, action) => { state.drawingPoints.push(action.payload); },
    endDrawing: (state) => { state.isDrawing = false; state.drawingPoints = []; },

    // Selection
    selectElement: (state, action) => {
      const { id, type, multi } = action.payload;
      if (multi) {
        if (state.selectedElementIds.includes(id)) {
          state.selectedElementIds = state.selectedElementIds.filter(eid => eid !== id);
        } else {
          state.selectedElementIds.push(id);
        }
      } else {
        state.selectedElementIds = [id];
      }
      state.selectedElementType = type;
    },
    clearSelection: (state) => { state.selectedElementIds = []; state.selectedElementType = null; },
    setHoveredElement: (state, action) => { state.hoveredElementId = action.payload; },

    // Elements (local state)
    addElementLocal: (state, action) => {
      const { element_type, element } = action.payload;
      const key = element_type === 'furniture' ? 'furniture' : `${element_type}s`;
      if (state.elements[key]) state.elements[key].push(element);
      state.hasUnsavedChanges = true;
    },
    updateElementLocal: (state, action) => {
      const { element_type, element, element_id, updates } = action.payload;
      const key = element_type === 'furniture' ? 'furniture' : `${element_type}s`;
      if (state.elements[key]) {
        if (element_id && updates) {
          // New format: { element_type, element_id, updates }
          const idx = state.elements[key].findIndex(e => (e._id || e.canvas_id) === element_id);
          if (idx !== -1) state.elements[key][idx] = { ...state.elements[key][idx], ...updates };
        } else if (element) {
          // Legacy format: { element_type, element }
          const idx = state.elements[key].findIndex(e => e._id === element._id || e.canvas_id === element.canvas_id);
          if (idx !== -1) state.elements[key][idx] = { ...state.elements[key][idx], ...element };
        }
      }
      state.hasUnsavedChanges = true;
    },
    removeElementLocal: (state, action) => {
      const { element_type, element_id } = action.payload;
      const key = element_type === 'furniture' ? 'furniture' : `${element_type}s`;
      if (state.elements[key]) {
        state.elements[key] = state.elements[key].filter(e => e._id !== element_id && e.canvas_id !== element_id);
      }
      state.selectedElementIds = state.selectedElementIds.filter(id => id !== element_id);
      state.hasUnsavedChanges = true;
    },
    setElements: (state, action) => { state.elements = action.payload; },

    // Floor navigation
    setActiveFloor: (state, action) => { state.activeFloorId = action.payload; },
    setActiveBuilding: (state, action) => { state.activeBuildingId = action.payload; },

    // View controls
    setZoom: (state, action) => { state.zoom = Math.max(0.1, Math.min(5, action.payload)); },
    setPanOffset: (state, action) => { state.panOffset = action.payload; },
    toggleLayer: (state, action) => {
      const layer = state.layers.find(l => l.id === action.payload);
      if (layer) layer.visible = !layer.visible;
    },
    lockLayer: (state, action) => {
      const layer = state.layers.find(l => l.id === action.payload);
      if (layer) layer.locked = !layer.locked;
    },

    // Undo/Redo
    pushUndo: (state, action) => {
      state.undoStack.push(action.payload);
      if (state.undoStack.length > 50) state.undoStack.shift();
      state.redoStack = [];
    },
    undo: (state) => {
      if (state.undoStack.length === 0) return;
      const last = state.undoStack.pop();
      state.redoStack.push({ type: last.type, data: JSON.parse(JSON.stringify(state.elements)) });
      if (last.data) state.elements = last.data;
      state.hasUnsavedChanges = true;
    },
    redo: (state) => {
      if (state.redoStack.length === 0) return;
      const next = state.redoStack.pop();
      state.undoStack.push({ type: next.type, data: JSON.parse(JSON.stringify(state.elements)) });
      if (next.data) state.elements = next.data;
      state.hasUnsavedChanges = true;
    },

    // Collaboration
    setCollaborators: (state, action) => { state.collaborators = action.payload; },
    updateRemoteCursor: (state, action) => {
      const { user_id, x, y, name, color } = action.payload;
      state.remoteCursors[user_id] = { x, y, name, color };
    },
    removeRemoteCursor: (state, action) => { delete state.remoteCursors[action.payload]; },

    // UI toggles
    toggleComponentLibrary: (state) => { state.showComponentLibrary = !state.showComponentLibrary; },
    togglePropertiesPanel: (state) => { state.showPropertiesPanel = !state.showPropertiesPanel; },
    toggleLayerPanel: (state) => { state.showLayerPanel = !state.showLayerPanel; },
    toggleTimeline: (state) => { state.showTimeline = !state.showTimeline; },
    toggleDarkMode: (state) => { state.darkMode = !state.darkMode; },

    // Layer aliases
    toggleLayerVisibility: (state, action) => {
      const layer = state.layers.find(l => l.id === action.payload);
      if (layer) layer.visible = !layer.visible;
    },
    toggleLayerLock: (state, action) => {
      const layer = state.layers.find(l => l.id === action.payload);
      if (layer) layer.locked = !layer.locked;
    },

    // Render & Transform
    setRenderMode: (state, action) => { state.renderMode = action.payload; },
    setTransformMode: (state, action) => { state.transformMode = action.payload; },

    // Camera & Presentation (new)
    setCameraMode: (state, action) => { state.cameraMode = action.payload; },
    setWalkMode: (state, action) => { state.walkMode = action.payload; },
    setPresentationMode: (state, action) => { state.presentationMode = action.payload; },
    setTimeOfDay: (state, action) => { state.timeOfDay = action.payload; },
    setLightingPreset: (state, action) => { state.lightingPreset = action.payload; },

    // Roof settings (new)
    setRoofSettings: (state, action) => { state.roofSettings = { ...state.roofSettings, ...action.payload }; },

    // Level management (new)
    addLevel: (state, action) => {
      const building = state.activeProject?.buildings?.find(b => b._id === state.activeBuildingId) || state.activeProject?.buildings?.[0];
      if (building) {
        const newFloor = {
          _id: `floor_${Date.now()}`,
          floor_name: action.payload.name || `Floor ${building.floors?.length || 0}`,
          floor_number: action.payload.number || (building.floors?.length || 0),
          elevation: action.payload.elevation || 0,
          floor_to_floor: action.payload.floorToFloor || 3000,
          visible: true,
          locked: false,
          elements: { walls: [], columns: [], beams: [], doors: [], windows: [], stairs: [], furniture: [], rooms: [], slabs: [], roofs: [], foundations: [], railings: [], ceilings: [] },
        };
        if (!building.floors) building.floors = [];
        building.floors.push(newFloor);
        state.activeFloorId = newFloor._id;
        state.hasUnsavedChanges = true;
      }
    },
    removeLevel: (state, action) => {
      const building = state.activeProject?.buildings?.find(b => b._id === state.activeBuildingId) || state.activeProject?.buildings?.[0];
      if (building?.floors) {
        building.floors = building.floors.filter(f => f._id !== action.payload.floorId);
        if (state.activeFloorId === action.payload.floorId) {
          state.activeFloorId = building.floors[0]?._id || null;
        }
        state.hasUnsavedChanges = true;
      }
    },
    duplicateLevel: (state, action) => {
      const building = state.activeProject?.buildings?.find(b => b._id === state.activeBuildingId) || state.activeProject?.buildings?.[0];
      if (building?.floors) {
        const source = building.floors.find(f => f._id === action.payload.floorId);
        if (source) {
          const newFloor = JSON.parse(JSON.stringify(source));
          newFloor._id = `floor_${Date.now()}`;
          newFloor.floor_name = `${source.floor_name} (Copy)`;
          newFloor.floor_number = building.floors.length;
          newFloor.elevation = (source.elevation || 0) + (source.floor_to_floor || 3000);
          building.floors.push(newFloor);
          state.activeFloorId = newFloor._id;
          state.hasUnsavedChanges = true;
        }
      }
    },
    renameLevel: (state, action) => {
      const building = state.activeProject?.buildings?.find(b => b._id === state.activeBuildingId) || state.activeProject?.buildings?.[0];
      if (building?.floors) {
        const floor = building.floors.find(f => f._id === action.payload.floorId);
        if (floor) { floor.floor_name = action.payload.name; state.hasUnsavedChanges = true; }
      }
    },
    toggleLevelVisibility: (state, action) => {
      const building = state.activeProject?.buildings?.find(b => b._id === state.activeBuildingId) || state.activeProject?.buildings?.[0];
      if (building?.floors) {
        const floor = building.floors.find(f => f._id === action.payload.floorId);
        if (floor) floor.visible = !floor.visible;
      }
    },
    setLevelHeight: (state, action) => {
      const building = state.activeProject?.buildings?.find(b => b._id === state.activeBuildingId) || state.activeProject?.buildings?.[0];
      if (building?.floors) {
        const floor = building.floors.find(f => f._id === action.payload.floorId);
        if (floor) { floor.floor_to_floor = action.payload.height; state.hasUnsavedChanges = true; }
      }
    },
    toggleModelTree: (state) => { state.showModelTree = !state.showModelTree; },
    toggleBonsaiPanel: (state) => { state.showBonsaiPanel = !state.showBonsaiPanel; },

    // Save state
    markSaved: (state) => { state.hasUnsavedChanges = false; state.lastSaved = new Date().toISOString(); },
    clearError: (state) => { state.error = null; },
    resetBimState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch projects
      .addCase(fetchBimProjects.pending, (state) => { state.projectsLoading = true; })
      .addCase(fetchBimProjects.fulfilled, (state, action) => {
        state.projectsLoading = false;
        state.projects = action.payload.projects;
        state.totalProjects = action.payload.total;
      })
      .addCase(fetchBimProjects.rejected, (state, action) => { state.projectsLoading = false; state.error = action.payload; })

      // Fetch project
      .addCase(fetchBimProject.pending, (state) => { state.activeProjectLoading = true; })
      .addCase(fetchBimProject.fulfilled, (state, action) => {
        state.activeProjectLoading = false;
        state.activeProject = action.payload;
        // Set default building/floor
        if (action.payload.buildings?.length > 0) {
          state.activeBuildingId = action.payload.buildings[0]._id;
          if (action.payload.buildings[0].floors?.length > 0) {
            state.activeFloorId = action.payload.buildings[0].floors[0]._id;
          }
        }
      })
      .addCase(fetchBimProject.rejected, (state, action) => { state.activeProjectLoading = false; state.error = action.payload; })

      // Create project
      .addCase(createBimProject.fulfilled, (state, action) => { state.projects.unshift(action.payload); state.activeProject = action.payload; })

      // Fetch floor
      .addCase(fetchFloor.fulfilled, (state, action) => {
        state.activeFloor = action.payload;
        state.elements = {
          walls: action.payload.elements?.walls || [],
          columns: action.payload.elements?.columns || [],
          beams: action.payload.elements?.beams || [],
          doors: action.payload.elements?.doors || [],
          windows: action.payload.elements?.windows || [],
          stairs: action.payload.elements?.stairs || [],
          furniture: action.payload.elements?.furniture || [],
          rooms: action.payload.rooms || [],
          slabs: action.payload.elements?.slabs || [],
          roofs: action.payload.elements?.roofs || [],
          foundations: action.payload.elements?.foundations || [],
          railings: action.payload.elements?.railings || [],
          ceilings: action.payload.elements?.ceilings || [],
        };
      })

      // Save canvas
      .addCase(saveCanvasData.pending, (state) => { state.saving = true; })
      .addCase(saveCanvasData.fulfilled, (state) => { state.saving = false; state.hasUnsavedChanges = false; state.lastSaved = new Date().toISOString(); })
      .addCase(saveCanvasData.rejected, (state) => { state.saving = false; })

      // Create element
      .addCase(createBimElement.fulfilled, (state, action) => {
        const { element_type, element } = action.payload;
        const key = element_type === 'furniture' ? 'furniture' : `${element_type}s`;
        if (state.elements[key]) {
          const idx = state.elements[key].findIndex(e => e.canvas_id === element.canvas_id);
          if (idx !== -1) state.elements[key][idx] = element;
          else state.elements[key].push(element);
        }
      })

      // Materials
      .addCase(fetchMaterials.pending, (state) => { state.materialsLoading = true; })
      .addCase(fetchMaterials.fulfilled, (state, action) => { state.materialsLoading = false; state.materials = action.payload; })
      .addCase(fetchMaterials.rejected, (state) => { state.materialsLoading = false; })

      // BOQ
      .addCase(generateBOQ.pending, (state) => { state.costLoading = true; })
      .addCase(generateBOQ.fulfilled, (state, action) => { state.costLoading = false; state.costEstimation = action.payload; })
      .addCase(generateBOQ.rejected, (state) => { state.costLoading = false; })

      // Analytics
      .addCase(fetchAnalytics.pending, (state) => { state.analyticsLoading = true; })
      .addCase(fetchAnalytics.fulfilled, (state, action) => { state.analyticsLoading = false; state.analytics = action.payload; })
      .addCase(fetchAnalytics.rejected, (state) => { state.analyticsLoading = false; })

      // MEP Elements
      .addCase(fetchMEPElements.pending, (state) => { state.mepLoading = true; })
      .addCase(fetchMEPElements.fulfilled, (state, action) => {
        state.mepLoading = false;
        const { type, elements } = action.payload;
        const key = `${type}Elements`;
        if (state[key] !== undefined) state[key] = elements;
      })
      .addCase(fetchMEPElements.rejected, (state) => { state.mepLoading = false; })
      .addCase(createMEPElement.fulfilled, (state, action) => {
        const { type, element } = action.payload;
        const key = `${type}Elements`;
        if (state[key]) state[key].push(element);
      })
      .addCase(deleteMEPElement.fulfilled, (state, action) => {
        const { type, id } = action.payload;
        const key = `${type}Elements`;
        if (state[key]) state[key] = state[key].filter(e => e._id !== id);
      })

      // ═══════ Bonsai / IFC ═══════
      .addCase(checkBonsaiStatus.pending, (state) => { state.bonsaiLoading = true; })
      .addCase(checkBonsaiStatus.fulfilled, (state, action) => {
        state.bonsaiLoading = false;
        state.bonsaiConnected = action.payload.connected;
        state.bonsaiStatus = action.payload;
      })
      .addCase(checkBonsaiStatus.rejected, (state) => {
        state.bonsaiLoading = false;
        state.bonsaiConnected = false;
      })

      .addCase(exportProjectToIFC.pending, (state) => { state.ifcExporting = true; state.ifcExportProgress = 'Preparing export...'; })
      .addCase(exportProjectToIFC.fulfilled, (state, action) => {
        state.ifcExporting = false;
        state.ifcExportProgress = null;
        if (action.payload?.export) {
          state.ifcExports.unshift(action.payload.export);
        }
      })
      .addCase(exportProjectToIFC.rejected, (state, action) => {
        state.ifcExporting = false;
        state.ifcExportProgress = null;
        state.error = action.payload;
      })

      .addCase(importIFCToProject.pending, (state) => { state.ifcImporting = true; })
      .addCase(importIFCToProject.fulfilled, (state, action) => {
        state.ifcImporting = false;
        state.ifcImportResult = action.payload;
      })
      .addCase(importIFCToProject.rejected, (state, action) => {
        state.ifcImporting = false;
        state.error = action.payload;
      })

      .addCase(fetchIFCExports.pending, (state) => { state.ifcExportsLoading = true; })
      .addCase(fetchIFCExports.fulfilled, (state, action) => {
        state.ifcExportsLoading = false;
        state.ifcExports = action.payload;
      })
      .addCase(fetchIFCExports.rejected, (state) => { state.ifcExportsLoading = false; })

      .addCase(validateProjectIFC.pending, (state) => { state.ifcValidating = true; })
      .addCase(validateProjectIFC.fulfilled, (state, action) => {
        state.ifcValidating = false;
        state.ifcValidation = action.payload?.validation;
      })
      .addCase(validateProjectIFC.rejected, (state, action) => {
        state.ifcValidating = false;
        state.error = action.payload;
      });
  },
});

export const {
  setActiveTool, setViewMode, setToolSettings,
  startDrawing, addDrawingPoint, endDrawing,
  selectElement, clearSelection, setHoveredElement,
  addElementLocal, updateElementLocal, removeElementLocal, setElements,
  setActiveFloor, setActiveBuilding,
  setZoom, setPanOffset, toggleLayer, lockLayer,
  pushUndo, undo, redo,
  setCollaborators, updateRemoteCursor, removeRemoteCursor,
  toggleComponentLibrary, togglePropertiesPanel, toggleLayerPanel, toggleTimeline, toggleDarkMode,
  toggleLayerVisibility, toggleLayerLock,
  setRenderMode, setTransformMode,
  // New actions
  setCameraMode, setWalkMode, setPresentationMode, setTimeOfDay, setLightingPreset,
  setRoofSettings,
  addLevel, removeLevel, duplicateLevel, renameLevel, toggleLevelVisibility, setLevelHeight,
  toggleModelTree,
  toggleBonsaiPanel,
  markSaved, clearError, resetBimState,
} = bimSlice.actions;

export default bimSlice.reducer;

// Alias for pages that import with different casing
export { fetchBimProjects as fetchBIMProjects };
