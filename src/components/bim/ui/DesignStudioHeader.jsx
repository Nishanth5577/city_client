// ═══════════════════════════════════════════════════════════════
// DesignStudioHeader — Project header bar for the 3D Design Studio
// Shows project name, floor selector, view modes, save status, actions
// ═══════════════════════════════════════════════════════════════
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setViewMode, setActiveFloor, undo, redo,
} from '../../../redux/slices/bimSlice';
import { VIEW_MODES } from '../../../utils/bimConstants';
import {
  ChevronLeft, Save, Undo2, Redo2, Box, Grid3X3,
  Home, Footprints, Eye, Camera, Download, Share2,
  Maximize2, ChevronDown, Loader2, Check, AlertCircle,
} from 'lucide-react';

const VIEW_TABS = [
  { id: VIEW_MODES.VIEW_3D, label: '3D View', icon: Box },
  { id: VIEW_MODES.PLAN_2D, label: '2D Floor Plan', icon: Grid3X3 },
  { id: 'dollhouse', label: 'Dollhouse', icon: Home },
  { id: 'walkthrough', label: 'Walkthrough', icon: Footprints },
  { id: 'render', label: 'Render', icon: Camera },
];

export default function DesignStudioHeader({
  onBack, onSave, saving, hasUnsavedChanges, onExport, onShare,
  onToggleFullscreen, activeViewTab, onViewTabChange,
}) {
  const dispatch = useDispatch();
  const {
    activeProject, activeFloorId, activeBuildingId,
    undoStack, redoStack, lastSaved, viewMode,
  } = useSelector(s => s.bim);
  const [showFloorDropdown, setShowFloorDropdown] = useState(false);

  const currentBuilding = activeProject?.buildings?.find(b => b._id === activeBuildingId);
  const currentFloor = currentBuilding?.floors?.find(f => f._id === activeFloorId);
  const allFloors = activeProject?.buildings?.flatMap(b =>
    (b.floors || []).map(f => ({ ...f, buildingName: b.name }))
  ) || [];

  // Save status indicator
  const SaveStatus = () => {
    if (saving) return (
      <span className="bim-header__save-status bim-header__save-status--saving">
        <Loader2 className="w-3 h-3 animate-spin" /> Saving...
      </span>
    );
    if (hasUnsavedChanges) return (
      <span className="bim-header__save-status bim-header__save-status--unsaved">
        <AlertCircle className="w-3 h-3" /> Unsaved
      </span>
    );
    if (lastSaved) return (
      <span className="bim-header__save-status bim-header__save-status--saved">
        <Check className="w-3 h-3" /> Saved
      </span>
    );
    return null;
  };

  return (
    <div className="bim-header">
      {/* Left section: Back + Project info */}
      <div className="bim-header__left">
        <button onClick={onBack} className="bim-header__back" title="Back to Projects">
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="bim-header__project">
          <div className="bim-header__project-icon">
            <Box className="w-3.5 h-3.5" />
          </div>
          <div className="bim-header__project-info">
            <span className="bim-header__project-name">
              {activeProject?.design_name || 'Untitled Design'}
            </span>
            <SaveStatus />
          </div>
        </div>

        {/* Divider */}
        <div className="bim-header__divider" />

        {/* Floor Selector */}
        <div className="bim-header__floor-selector" style={{ position: 'relative' }}>
          <button
            className="bim-header__floor-btn"
            onClick={() => setShowFloorDropdown(!showFloorDropdown)}
          >
            <span className="bim-header__floor-label">
              {currentFloor?.floor_name || 'Select Floor'}
            </span>
            <ChevronDown className="w-3 h-3" style={{ opacity: 0.5 }} />
          </button>

          {showFloorDropdown && (
            <>
              <div className="bim-header__dropdown-backdrop" onClick={() => setShowFloorDropdown(false)} />
              <div className="bim-header__floor-dropdown">
                {allFloors.map(floor => (
                  <button
                    key={floor._id}
                    className={`bim-header__floor-option ${floor._id === activeFloorId ? 'bim-header__floor-option--active' : ''}`}
                    onClick={() => {
                      dispatch(setActiveFloor(floor._id));
                      setShowFloorDropdown(false);
                    }}
                  >
                    <span>{floor.buildingName} — {floor.floor_name}</span>
                    {floor._id === activeFloorId && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Center section: View Mode Tabs */}
      <div className="bim-header__center">
        <div className="bim-header__view-tabs">
          {VIEW_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeViewTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`bim-header__view-tab ${isActive ? 'bim-header__view-tab--active' : ''}`}
                onClick={() => onViewTabChange(tab.id)}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right section: Actions */}
      <div className="bim-header__right">
        <div className="bim-header__actions">
          <button
            onClick={() => dispatch(undo())}
            disabled={undoStack.length === 0}
            className="bim-header__action-btn"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => dispatch(redo())}
            disabled={redoStack.length === 0}
            className="bim-header__action-btn"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bim-header__divider" />

        <button onClick={onSave} className="bim-header__save-btn" title="Save (Ctrl+S)">
          <Save className="w-3.5 h-3.5" />
          <span>Save</span>
        </button>

        <button onClick={onExport} className="bim-header__action-btn" title="Export">
          <Download className="w-3.5 h-3.5" />
        </button>
        <button onClick={onShare} className="bim-header__action-btn" title="Share">
          <Share2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={onToggleFullscreen} className="bim-header__action-btn" title="Fullscreen">
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
