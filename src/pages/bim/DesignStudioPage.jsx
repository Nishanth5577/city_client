import { useEffect, useCallback, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchBimProject, fetchFloor, saveCanvasData,
  setActiveTool, setViewMode, undo, redo, setZoom,
  clearSelection, pushUndo, toggleComponentLibrary, togglePropertiesPanel,
  toggleLayerPanel, selectElement, addElementLocal, removeElementLocal,
  updateElementLocal, createBimElement, deleteBimElement,
  setActiveFloor, setRenderMode, setTransformMode,
} from '../../redux/slices/bimSlice';
import { TOOLS, VIEW_MODES, KEYBOARD_SHORTCUTS, RENDER_MODES, TRANSFORM_MODES, CAMERA_PRESETS } from '../../utils/bimConstants';
import TopRibbon from '../../components/bim/ui/TopRibbon';
import ComponentLibrary from '../../components/bim/ui/ComponentLibrary';
import InspectorPanel from '../../components/bim/ui/InspectorPanel';
import FloorPlanCanvas from '../../components/bim/editor/FloorPlanCanvas';
import Building3DView from '../../components/bim/viewer/Building3DView';
import {
  Loader2, Box, Grid3X3, ZoomIn, ZoomOut, Maximize2,
  MapPin, Save, Keyboard, Info, Layers,
} from 'lucide-react';

export default function DesignStudioPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(260);
  const [rightPanelWidth, setRightPanelWidth] = useState(280);
  const isResizingLeft = useRef(false);
  const isResizingRight = useRef(false);

  const {
    activeProject, activeProjectLoading, activeFloorId, activeBuildingId,
    elements, selectedElementIds, selectedElementType,
    activeTool, viewMode, renderMode, zoom, hasUnsavedChanges, saving,
    showComponentLibrary, showPropertiesPanel, undoStack, redoStack,
    lastSaved, layers,
  } = useSelector(s => s.bim);

  // Load project
  useEffect(() => {
    if (id) dispatch(fetchBimProject(id));
  }, [dispatch, id]);

  // Load floor data when floor changes
  useEffect(() => {
    if (activeFloorId) dispatch(fetchFloor(activeFloorId));
  }, [dispatch, activeFloorId]);

  // Auto-save with stable reference
  const saveRef = useRef(null);
  saveRef.current = () => {
    if (activeFloorId) {
      dispatch(saveCanvasData({ floorId: activeFloorId, canvasData: elements }));
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (hasUnsavedChanges && activeFloorId) {
        saveRef.current();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [hasUnsavedChanges, activeFloorId]);

  const handleSave = useCallback(() => {
    saveRef.current?.();
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (selectedElementIds.length > 0 && selectedElementType) {
      dispatch(pushUndo({ type: 'delete', data: JSON.parse(JSON.stringify(elements)) }));
      selectedElementIds.forEach(elId => {
        dispatch(removeElementLocal({ element_type: selectedElementType, element_id: elId }));
        dispatch(deleteBimElement({ type: selectedElementType, id: elId }));
      });
      dispatch(clearSelection());
    }
  }, [dispatch, selectedElementIds, selectedElementType, elements]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      const key = `${e.ctrlKey ? 'Ctrl+' : ''}${e.key.toUpperCase()}`;

      switch (key) {
        case 'Ctrl+Z': e.preventDefault(); dispatch(undo()); break;
        case 'Ctrl+Y': e.preventDefault(); dispatch(redo()); break;
        case 'Ctrl+S': e.preventDefault(); handleSave(); break;
        case 'W': dispatch(setActiveTool(TOOLS.WALL)); break;
        case 'C': dispatch(setActiveTool(TOOLS.COLUMN)); break;
        case 'D': dispatch(setActiveTool(TOOLS.DOOR)); break;
        case 'N': dispatch(setActiveTool(TOOLS.WINDOW)); break;
        case 'S': dispatch(setActiveTool(TOOLS.STAIR)); break;
        case 'F': dispatch(setActiveTool(TOOLS.FURNITURE)); break;
        case 'M': dispatch(setActiveTool(TOOLS.MEASURE)); break;
        case 'V': dispatch(setActiveTool(TOOLS.SELECT)); break;
        case 'T': dispatch(setTransformMode(TRANSFORM_MODES.TRANSLATE)); break;
        case 'R': dispatch(setTransformMode(TRANSFORM_MODES.ROTATE)); break;
        case 'E': dispatch(setTransformMode(TRANSFORM_MODES.SCALE)); break;
        case 'G': dispatch(setActiveTool(TOOLS.PAN)); break;
        case 'L': dispatch(toggleLayerPanel()); break;
        case 'ESCAPE': dispatch(clearSelection()); dispatch(setActiveTool(TOOLS.SELECT)); break;
        case 'DELETE': handleDeleteSelected(); break;
        case '2': dispatch(setViewMode(VIEW_MODES.PLAN_2D)); break;
        case '3': dispatch(setViewMode(VIEW_MODES.VIEW_3D)); break;
        case 'Ctrl+=': case '+': e.preventDefault(); dispatch(setZoom(zoom * 1.2)); break;
        case 'Ctrl+-': case '-': e.preventDefault(); dispatch(setZoom(zoom / 1.2)); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dispatch, zoom, selectedElementIds, handleSave, handleDeleteSelected]);

  // Ribbon action handler
  const handleRibbonAction = useCallback((action) => {
    switch (action) {
      case 'toggle_grid': dispatch(setActiveTool(TOOLS.PAN)); break;
      case 'toggle_layers': dispatch(toggleLayerPanel()); break;
      case 'render_realistic': dispatch(setRenderMode(RENDER_MODES.REALISTIC)); break;
      case 'render_wireframe': dispatch(setRenderMode(RENDER_MODES.WIREFRAME)); break;
      case 'render_xray': dispatch(setRenderMode(RENDER_MODES.XRAY)); break;
      case 'view_top': case 'view_front': case 'view_left': case 'view_right': case 'view_iso':
        dispatch(setViewMode(VIEW_MODES.VIEW_3D));
        break;
      case 'export_json': break;
      case 'export_pdf': break;
      case 'export_gltf': break;
      case 'quantity_takeoff': break;
      case 'cost_estimate': break;
      default: break;
    }
  }, [dispatch]);

  // Panel resize
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingLeft.current) {
        setLeftPanelWidth(Math.max(200, Math.min(400, e.clientX)));
      }
      if (isResizingRight.current) {
        setRightPanelWidth(Math.max(200, Math.min(420, window.innerWidth - e.clientX)));
      }
    };
    const handleMouseUp = () => {
      isResizingLeft.current = false;
      isResizingRight.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startResizeLeft = () => {
    isResizingLeft.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const startResizeRight = () => {
    isResizingRight.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // Floor info
  const currentBuilding = activeProject?.buildings?.find(b => b._id === activeBuildingId);
  const currentFloor = currentBuilding?.floors?.find(f => f._id === activeFloorId);

  // Total element count
  const totalElements = Object.values(elements).reduce((sum, arr) => sum + (arr?.length || 0), 0);

  if (activeProjectLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-950">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-surface-400 text-lg">Loading BIM Design Studio...</p>
        </div>
      </div>
    );
  }

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-950">
        <div className="text-center">
          <Box className="w-16 h-16 text-surface-600 mx-auto mb-4" />
          <h2 className="text-xl text-white mb-2">Project Not Found</h2>
          <button onClick={() => navigate('/bim')} className="btn-primary mt-4">Go to BIM Projects</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-surface-950 text-surface-200 overflow-hidden -m-6">
      {/* Top Ribbon */}
      <TopRibbon
        projectName={activeProject?.design_name}
        onSave={handleSave}
        saving={saving}
        hasUnsavedChanges={hasUnsavedChanges}
        onBack={() => navigate('/bim')}
        onAction={handleRibbonAction}
        showSearch={showSearch}
        onToggleSearch={() => setShowSearch(!showSearch)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel — Component Library */}
        {showComponentLibrary && (
          <>
            <div
              className="border-r border-surface-800/50 bg-surface-900 flex flex-col overflow-hidden"
              style={{ width: leftPanelWidth }}
            >
              {/* Floor Selector */}
              <div className="px-3 py-2 border-b border-surface-800/50">
                <label className="text-[9px] text-surface-500 font-semibold uppercase tracking-wider mb-1 block">Building / Floor</label>
                <select
                  className="w-full bg-surface-800/50 border border-surface-700/50 rounded-lg px-2 py-1.5 text-[11px] text-surface-200 focus:ring-1 focus:ring-primary-500/50 outline-none"
                  value={activeFloorId || ''}
                  onChange={(e) => dispatch(setActiveFloor(e.target.value))}
                >
                  {activeProject?.buildings?.map(building => (
                    building.floors?.map(floor => (
                      <option key={floor._id} value={floor._id}>
                        {building.name} — {floor.floor_name}
                      </option>
                    ))
                  ))}
                </select>
              </div>

              <ComponentLibrary />
            </div>

            {/* Left Resize Handle */}
            <div
              onMouseDown={startResizeLeft}
              className="w-1 cursor-col-resize hover:bg-primary-500/30 active:bg-primary-500/50 transition-colors flex-shrink-0"
            />
          </>
        )}

        {/* Center — Canvas / 3D View */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* View Toggle */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-surface-900/90 backdrop-blur-sm rounded-xl p-1 border border-surface-700/50 shadow-lg">
            <button
              onClick={() => dispatch(setViewMode(VIEW_MODES.PLAN_2D))}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === VIEW_MODES.PLAN_2D ? 'bg-primary-600 text-white shadow-md' : 'text-surface-400 hover:text-white hover:bg-surface-800'}`}
            >
              <Grid3X3 className="w-3.5 h-3.5 inline mr-1.5" />2D Plan
            </button>
            <button
              onClick={() => dispatch(setViewMode(VIEW_MODES.VIEW_3D))}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === VIEW_MODES.VIEW_3D ? 'bg-primary-600 text-white shadow-md' : 'text-surface-400 hover:text-white hover:bg-surface-800'}`}
            >
              <Box className="w-3.5 h-3.5 inline mr-1.5" />3D View
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="absolute top-3 right-3 z-20 flex flex-col gap-1 bg-surface-900/90 backdrop-blur-sm rounded-xl p-1 border border-surface-700/50">
            <button onClick={() => dispatch(setZoom(zoom * 1.3))} className="p-1.5 hover:bg-surface-800 rounded-lg" title="Zoom In"><ZoomIn className="w-4 h-4 text-surface-400" /></button>
            <button onClick={() => dispatch(setZoom(1))} className="p-1.5 hover:bg-surface-800 rounded-lg" title="Fit"><Maximize2 className="w-4 h-4 text-surface-400" /></button>
            <button onClick={() => dispatch(setZoom(zoom / 1.3))} className="p-1.5 hover:bg-surface-800 rounded-lg" title="Zoom Out"><ZoomOut className="w-4 h-4 text-surface-400" /></button>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative">
            {viewMode === VIEW_MODES.PLAN_2D ? (
              <FloorPlanCanvas onCursorMove={setCursorPos} />
            ) : (
              <Building3DView />
            )}
          </div>

          {/* Status Bar */}
          <div className="h-7 flex items-center justify-between px-3 bg-surface-900/90 border-t border-surface-800/50 text-[10px]">
            <div className="flex items-center gap-4 text-surface-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                X: {Math.round(cursorPos.x)} Y: {Math.round(cursorPos.y)}
              </span>
              <span>Zoom: {Math.round(zoom * 100)}%</span>
              <span className="text-surface-400 font-medium">{currentFloor?.floor_name || '—'}</span>
            </div>
            <div className="flex items-center gap-4 text-surface-500">
              <span>{totalElements} elements</span>
              {currentFloor?.total_area > 0 && (
                <span>{currentFloor.total_area.toLocaleString()} sq.ft</span>
              )}
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3" />
                {layers.filter(l => l.visible).length}/{layers.length}
              </span>
              {lastSaved && (
                <span className="text-green-500 flex items-center gap-1">
                  <Save className="w-3 h-3" /> Saved
                </span>
              )}
              {hasUnsavedChanges && !saving && (
                <span className="text-amber-500 flex items-center gap-1 animate-pulse">● Unsaved</span>
              )}
              {saving && (
                <span className="text-amber-400 animate-pulse">Saving...</span>
              )}
              <button onClick={() => setShowShortcuts(true)} className="hover:text-white transition-colors" title="Keyboard Shortcuts">
                <Keyboard className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel — Inspector */}
        {showPropertiesPanel && (
          <>
            {/* Right Resize Handle */}
            <div
              onMouseDown={startResizeRight}
              className="w-1 cursor-col-resize hover:bg-primary-500/30 active:bg-primary-500/50 transition-colors flex-shrink-0"
            />

            <div
              className="border-l border-surface-800/50 bg-surface-900 flex flex-col overflow-hidden"
              style={{ width: rightPanelWidth }}
            >
              <InspectorPanel />
            </div>
          </>
        )}
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowShortcuts(false)}>
          <div className="bg-surface-900 rounded-2xl border border-surface-700 p-6 max-w-lg w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-primary-400" /> Keyboard Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm max-h-96 overflow-y-auto">
              {Object.entries(KEYBOARD_SHORTCUTS).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between py-1 border-b border-surface-800/30">
                  <span className="text-surface-400 text-xs">{label}</span>
                  <kbd className="px-2 py-0.5 bg-surface-800 rounded text-[10px] text-surface-300 border border-surface-700 font-mono ml-2">{key}</kbd>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowShortcuts(false)}
              className="mt-4 w-full py-2 bg-surface-800 hover:bg-surface-700 rounded-lg text-sm text-surface-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
