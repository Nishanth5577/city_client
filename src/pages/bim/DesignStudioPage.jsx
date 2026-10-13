// ═══════════════════════════════════════════════════════════════
// DesignStudioPage — Premium Architectural Design Workspace
// Complete redesign: Header + Toolbar + Left Panel + Viewport + Right Panel
// ═══════════════════════════════════════════════════════════════
import { useEffect, useCallback, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchBimProject, fetchFloor, saveCanvasData,
  setActiveTool, setViewMode, undo, redo, setZoom,
  clearSelection, pushUndo, toggleComponentLibrary, togglePropertiesPanel,
  toggleLayerPanel, selectElement, addElementLocal, removeElementLocal,
  updateElementLocal, createBimElement, deleteBimElement,
  setActiveFloor, setRenderMode, setTransformMode, setWalkMode,
} from '../../redux/slices/bimSlice';
import { TOOLS, VIEW_MODES, TRANSFORM_MODES, RENDER_MODES } from '../../utils/bimConstants';

// New UI components
import DesignStudioHeader from '../../components/bim/ui/DesignStudioHeader';
import DesignStudioToolbar from '../../components/bim/ui/DesignStudioToolbar';
import '../../components/bim/ui/DesignStudio.css';

// Existing components
import ComponentLibrary from '../../components/bim/ui/ComponentLibrary';
import InspectorPanel from '../../components/bim/ui/InspectorPanel';
import LevelManager from '../../components/bim/ui/LevelManager';
import FloorPlanCanvas from '../../components/bim/editor/FloorPlanCanvas';
import Building3DView from '../../components/bim/viewer/Building3DView';

import {
  Loader2, Box, ZoomIn, ZoomOut, Maximize2,
  MapPin, Save, Keyboard, Layers, AlertTriangle,
} from 'lucide-react';

export default function DesignStudioPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // UI state
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(260);
  const [rightPanelWidth, setRightPanelWidth] = useState(300);
  const [activeViewTab, setActiveViewTab] = useState(VIEW_MODES.VIEW_3D);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [leftTab, setLeftTab] = useState('library'); // library | floors | hierarchy
  const isResizingLeft = useRef(false);
  const isResizingRight = useRef(false);

  const {
    activeProject, activeProjectLoading, activeFloorId, activeBuildingId,
    elements, selectedElementIds, selectedElementType,
    activeTool, viewMode, renderMode, zoom, hasUnsavedChanges, saving,
    showComponentLibrary, showPropertiesPanel, undoStack, redoStack,
    lastSaved, layers, walkMode,
  } = useSelector(s => s.bim);

  // ─── Load Project ───
  useEffect(() => {
    if (id) dispatch(fetchBimProject(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (activeFloorId) dispatch(fetchFloor(activeFloorId));
  }, [dispatch, activeFloorId]);

  // ─── Auto-save ───
  const saveRef = useRef(null);
  saveRef.current = () => {
    if (activeFloorId) {
      dispatch(saveCanvasData({ floorId: activeFloorId, canvasData: elements }));
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (hasUnsavedChanges && activeFloorId) saveRef.current();
    }, 30000);
    return () => clearInterval(interval);
  }, [hasUnsavedChanges, activeFloorId]);

  const handleSave = useCallback(() => saveRef.current?.(), []);

  // ─── Delete Selected ───
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

  // ─── View Tab Change Handler ───
  const handleViewTabChange = useCallback((tabId) => {
    setActiveViewTab(tabId);
    if (tabId === VIEW_MODES.VIEW_3D) {
      dispatch(setViewMode(VIEW_MODES.VIEW_3D));
      dispatch(setWalkMode(false));
      dispatch(setRenderMode(RENDER_MODES.REALISTIC));
    } else if (tabId === VIEW_MODES.PLAN_2D) {
      dispatch(setViewMode(VIEW_MODES.PLAN_2D));
      dispatch(setWalkMode(false));
    } else if (tabId === 'dollhouse') {
      dispatch(setViewMode(VIEW_MODES.VIEW_3D));
      dispatch(setWalkMode(false));
      // DollhouseControls will handle the section plane
    } else if (tabId === 'walkthrough') {
      dispatch(setViewMode(VIEW_MODES.VIEW_3D));
      dispatch(setWalkMode(true));
    } else if (tabId === 'render') {
      dispatch(setViewMode(VIEW_MODES.VIEW_3D));
      dispatch(setWalkMode(false));
      dispatch(setRenderMode(RENDER_MODES.REALISTIC));
    }
  }, [dispatch]);

  // ─── Fullscreen Toggle ───
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  // ─── Keyboard Shortcuts ───
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
        case '2': handleViewTabChange(VIEW_MODES.PLAN_2D); break;
        case '3': handleViewTabChange(VIEW_MODES.VIEW_3D); break;
        case 'Ctrl+=': case '+': e.preventDefault(); dispatch(setZoom(zoom * 1.2)); break;
        case 'Ctrl+-': case '-': e.preventDefault(); dispatch(setZoom(zoom / 1.2)); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dispatch, zoom, selectedElementIds, handleSave, handleDeleteSelected, handleViewTabChange]);

  // ─── Panel Resize ───
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingLeft.current) setLeftPanelWidth(Math.max(200, Math.min(400, e.clientX)));
      if (isResizingRight.current) setRightPanelWidth(Math.max(220, Math.min(420, window.innerWidth - e.clientX)));
    };
    const handleMouseUp = () => {
      isResizingLeft.current = false;
      isResizingRight.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, []);

  const startResizeLeft = () => { isResizingLeft.current = true; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; };
  const startResizeRight = () => { isResizingRight.current = true; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; };

  // ─── Computed Values ───
  const currentBuilding = activeProject?.buildings?.find(b => b._id === activeBuildingId);
  const currentFloor = currentBuilding?.floors?.find(f => f._id === activeFloorId);
  const totalElements = Object.values(elements).reduce((sum, arr) => sum + (arr?.length || 0), 0);

  // ─── Loading State ───
  if (activeProjectLoading) {
    return (
      <div className="bim-studio" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#0D9488', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748B', fontSize: 14 }}>Loading Design Studio...</p>
        </div>
      </div>
    );
  }

  // ─── Error State ───
  if (!activeProject) {
    return (
      <div className="bim-studio" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <AlertTriangle className="w-12 h-12" style={{ color: '#F59E0B', margin: '0 auto 16px' }} />
          <h2 style={{ color: '#F1F5F9', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Project Not Found</h2>
          <p style={{ color: '#64748B', fontSize: 13, marginBottom: 20 }}>This design may have been deleted or you don't have access.</p>
          <button
            onClick={() => navigate('/bim')}
            style={{
              padding: '8px 20px', background: '#0D9488', color: '#F0FDFA',
              border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bim-studio">
      {/* ═══ Header ═══ */}
      <DesignStudioHeader
        onBack={() => navigate('/bim')}
        onSave={handleSave}
        saving={saving}
        hasUnsavedChanges={hasUnsavedChanges}
        onExport={() => {}}
        onShare={() => {}}
        onToggleFullscreen={handleToggleFullscreen}
        activeViewTab={activeViewTab}
        onViewTabChange={handleViewTabChange}
      />

      {/* ═══ Toolbar ═══ */}
      <DesignStudioToolbar
        onToggleLeft={() => dispatch(toggleComponentLibrary())}
        onToggleRight={() => dispatch(togglePropertiesPanel())}
        showLeft={showComponentLibrary}
        showRight={showPropertiesPanel}
      />

      {/* ═══ Main Content ═══ */}
      <div className="bim-content">

        {/* ─── Left Panel ─── */}
        {showComponentLibrary && (
          <>
            <div className="bim-panel bim-panel--left" style={{ width: leftPanelWidth }}>
              {/* Left panel tab switcher */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  { id: 'library', label: 'Components' },
                  { id: 'floors', label: 'Floors' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setLeftTab(tab.id)}
                    style={{
                      flex: 1, padding: '8px 4px', fontSize: 10, fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      color: leftTab === tab.id ? '#5EEAD4' : '#475569',
                      background: 'transparent', border: 'none',
                      borderBottom: leftTab === tab.id ? '2px solid #0D9488' : '2px solid transparent',
                      cursor: 'pointer', transition: 'all 0.12s',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Left panel content */}
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {leftTab === 'library' && <ComponentLibrary />}
                {leftTab === 'floors' && <LevelManager />}
              </div>
            </div>

            {/* Left resize handle */}
            <div className="bim-panel__resize" onMouseDown={startResizeLeft} />
          </>
        )}

        {/* ─── Center — Viewport ─── */}
        <div className="bim-viewport">
          {/* Zoom Controls */}
          <div className="bim-viewport__zoom">
            <button onClick={() => dispatch(setZoom(zoom * 1.3))} className="bim-viewport__zoom-btn" title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={() => dispatch(setZoom(1))} className="bim-viewport__zoom-btn" title="Fit View">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button onClick={() => dispatch(setZoom(zoom / 1.3))} className="bim-viewport__zoom-btn" title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>

          {/* Canvas / 3D View */}
          <div className="bim-viewport__canvas">
            {viewMode === VIEW_MODES.PLAN_2D ? (
              <FloorPlanCanvas onCursorMove={setCursorPos} />
            ) : (
              <Building3DView />
            )}
          </div>
        </div>

        {/* ─── Right Panel ─── */}
        {showPropertiesPanel && (
          <>
            {/* Right resize handle */}
            <div className="bim-panel__resize" onMouseDown={startResizeRight} />

            <div className="bim-panel bim-panel--right" style={{ width: rightPanelWidth }}>
              <InspectorPanel />
            </div>
          </>
        )}
      </div>

      {/* ═══ Status Bar ═══ */}
      <div className="bim-statusbar">
        <div className="bim-statusbar__group">
          <span className="bim-statusbar__item">
            <MapPin className="w-3 h-3" />
            X: {Math.round(cursorPos.x)} Y: {Math.round(cursorPos.y)}
          </span>
          <span className="bim-statusbar__item">Zoom: {Math.round(zoom * 100)}%</span>
          <span className="bim-statusbar__item" style={{ color: '#94A3B8', fontWeight: 500 }}>
            {currentFloor?.floor_name || '—'}
          </span>
        </div>
        <div className="bim-statusbar__group">
          <span className="bim-statusbar__item">{totalElements} elements</span>
          {currentFloor?.total_area > 0 && (
            <span className="bim-statusbar__item">{currentFloor.total_area.toLocaleString()} sq.ft</span>
          )}
          <span className="bim-statusbar__item">
            <Layers className="w-3 h-3" />
            {layers.filter(l => l.visible).length}/{layers.length}
          </span>
          {lastSaved && !hasUnsavedChanges && (
            <span className="bim-statusbar__item bim-statusbar__item--saved">
              <Save className="w-3 h-3" /> Saved
            </span>
          )}
          {hasUnsavedChanges && !saving && (
            <span className="bim-statusbar__item bim-statusbar__item--unsaved">● Unsaved</span>
          )}
          {saving && (
            <span className="bim-statusbar__item" style={{ color: '#FBBF24' }}>Saving...</span>
          )}
          <button
            onClick={() => setShowShortcuts(true)}
            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 0, display: 'flex' }}
            title="Keyboard Shortcuts"
          >
            <Keyboard className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ═══ Keyboard Shortcuts Modal ═══ */}
      {showShortcuts && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowShortcuts(false)}
        >
          <div
            style={{
              background: '#1E293B', borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.1)',
              padding: 24, maxWidth: 520, width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Keyboard className="w-5 h-5" style={{ color: '#5EEAD4' }} /> Keyboard Shortcuts
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', maxHeight: 400, overflowY: 'auto' }}>
              {[
                ['Ctrl+Z', 'Undo'], ['Ctrl+Y', 'Redo'], ['Ctrl+S', 'Save'],
                ['Delete', 'Delete Selected'], ['Escape', 'Deselect'],
                ['W', 'Wall Tool'], ['C', 'Column'], ['D', 'Door'],
                ['N', 'Window'], ['S', 'Stair'], ['F', 'Furniture'],
                ['M', 'Measure'], ['V', 'Select'], ['T', 'Move'],
                ['R', 'Rotate'], ['2', '2D View'], ['3', '3D View'],
                ['+', 'Zoom In'], ['-', 'Zoom Out'],
              ].map(([key, label]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>{label}</span>
                  <kbd style={{
                    padding: '2px 8px', background: '#0F172A', borderRadius: 4,
                    fontSize: 10, color: '#CBD5E1', border: '1px solid rgba(255,255,255,0.1)',
                    fontFamily: 'monospace',
                  }}>{key}</kbd>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowShortcuts(false)}
              style={{
                marginTop: 16, width: '100%', padding: '8px 0',
                background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8,
                color: '#94A3B8', fontSize: 12, cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
