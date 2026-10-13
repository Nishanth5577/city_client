// ═══════════════════════════════════════════════════════════════
// Level Manager — Multi-floor building management
// Add/delete/duplicate/rename levels
// Floor-to-floor height, show/hide/isolate levels
// ═══════════════════════════════════════════════════════════════
import { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setActiveFloor, addLevel, removeLevel, duplicateLevel,
  renameLevel, toggleLevelVisibility, setLevelHeight,
} from '../../../redux/slices/bimSlice';
import {
  Layers, Plus, Trash2, Copy, Eye, EyeOff, Lock, Unlock,
  ChevronDown, ChevronRight, Edit2, Check, X, Building2,
  ArrowUp, ArrowDown, Home,
} from 'lucide-react';

export default function LevelManager() {
  const dispatch = useDispatch();
  const {
    activeProject, activeFloorId, activeBuildingId,
  } = useSelector(s => s.bim);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [expanded, setExpanded] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLevelName, setNewLevelName] = useState('');

  // Get current building
  const building = activeProject?.buildings?.find(b => b._id === activeBuildingId) || activeProject?.buildings?.[0];
  const floors = building?.floors || [];

  const handleSelectFloor = useCallback((floorId) => {
    dispatch(setActiveFloor(floorId));
  }, [dispatch]);

  const handleStartRename = useCallback((floor) => {
    setEditingId(floor._id);
    setEditName(floor.floor_name || floor.name || '');
  }, []);

  const handleSaveRename = useCallback(() => {
    if (editingId && editName.trim()) {
      dispatch(renameLevel({ floorId: editingId, name: editName.trim() }));
    }
    setEditingId(null);
    setEditName('');
  }, [dispatch, editingId, editName]);

  const handleAddLevel = useCallback(() => {
    const name = newLevelName.trim() || `Floor ${floors.length}`;
    dispatch(addLevel({
      buildingId: building?._id,
      name,
      number: floors.length,
      elevation: floors.length * 3000,
      floorToFloor: 3000,
    }));
    setShowAddModal(false);
    setNewLevelName('');
  }, [dispatch, building, floors, newLevelName]);

  const handleDuplicateLevel = useCallback((floorId) => {
    dispatch(duplicateLevel({ floorId }));
  }, [dispatch]);

  const handleDeleteLevel = useCallback((floorId) => {
    if (floors.length <= 1) return; // Prevent deleting last level
    if (window.confirm('Delete this level and all its elements?')) {
      dispatch(removeLevel({ floorId }));
    }
  }, [dispatch, floors]);

  const handleToggleVisibility = useCallback((floorId) => {
    dispatch(toggleLevelVisibility({ floorId }));
  }, [dispatch]);

  const getLevelIcon = (floor) => {
    const name = (floor.floor_name || floor.name || '').toLowerCase();
    if (name.includes('ground') || name.includes('gf')) return <Home className="w-3.5 h-3.5" />;
    if (name.includes('terrace') || name.includes('roof')) return <Building2 className="w-3.5 h-3.5" />;
    return <Layers className="w-3.5 h-3.5" />;
  };

  const getElevationText = (floor, index) => {
    const elevation = floor.elevation || (index * 3000);
    if (elevation === 0) return 'GL ±0.000';
    return `+${(elevation / 1000).toFixed(3)} m`;
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-800/50">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-surface-300 hover:text-white transition-colors"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <Building2 className="w-3.5 h-3.5 text-primary-400" />
          Levels
        </button>
        <button
          onClick={() => setShowAddModal(true)}
          className="p-1 hover:bg-surface-800 rounded-md transition-colors group"
          title="Add Level"
        >
          <Plus className="w-3.5 h-3.5 text-surface-500 group-hover:text-primary-400" />
        </button>
      </div>

      {/* Level List */}
      {expanded && (
        <div className="py-1">
          {floors.length === 0 ? (
            <div className="px-3 py-4 text-center text-surface-500 text-[10px]">
              No levels yet. Click + to add.
            </div>
          ) : (
            [...floors].reverse().map((floor, index) => {
              const isActive = floor._id === activeFloorId;
              const isEditing = editingId === floor._id;
              const isVisible = floor.visible !== false;
              const isLocked = floor.locked === true;
              const floorIndex = floors.length - 1 - index;

              return (
                <div
                  key={floor._id || index}
                  className={`group flex items-center gap-1.5 px-2 py-1.5 mx-1 rounded-lg cursor-pointer transition-all ${
                    isActive
                      ? 'bg-primary-600/20 border border-primary-500/30 text-white'
                      : 'hover:bg-surface-800/50 text-surface-400 hover:text-surface-200 border border-transparent'
                  }`}
                  onClick={() => !isEditing && handleSelectFloor(floor._id)}
                >
                  {/* Level icon */}
                  <span className={`flex-shrink-0 ${isActive ? 'text-primary-400' : 'text-surface-500'}`}>
                    {getLevelIcon(floor)}
                  </span>

                  {/* Name */}
                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveRename();
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="flex-1 bg-surface-800 border border-surface-600 rounded px-1.5 py-0.5 text-[10px] text-white outline-none focus:border-primary-500"
                        autoFocus
                        onClick={e => e.stopPropagation()}
                      />
                      <button onClick={(e) => { e.stopPropagation(); handleSaveRename(); }}
                        className="p-0.5 hover:bg-green-500/20 rounded">
                        <Check className="w-3 h-3 text-green-400" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                        className="p-0.5 hover:bg-red-500/20 rounded">
                        <X className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-medium truncate">
                        {floor.floor_name || floor.name || `Level ${floorIndex}`}
                      </div>
                      <div className="text-[8px] text-surface-500">
                        {getElevationText(floor, floorIndex)}
                        {floor.total_area > 0 && ` • ${floor.total_area} sqft`}
                      </div>
                    </div>
                  )}

                  {/* Action buttons (visible on hover) */}
                  {!isEditing && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleVisibility(floor._id); }}
                        className="p-0.5 hover:bg-surface-700 rounded"
                        title={isVisible ? 'Hide' : 'Show'}
                      >
                        {isVisible ? (
                          <Eye className="w-3 h-3 text-surface-400" />
                        ) : (
                          <EyeOff className="w-3 h-3 text-surface-500" />
                        )}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStartRename(floor); }}
                        className="p-0.5 hover:bg-surface-700 rounded"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3 text-surface-400" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDuplicateLevel(floor._id); }}
                        className="p-0.5 hover:bg-surface-700 rounded"
                        title="Duplicate Level"
                      >
                        <Copy className="w-3 h-3 text-surface-400" />
                      </button>
                      {floors.length > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteLevel(floor._id); }}
                          className="p-0.5 hover:bg-red-500/20 rounded"
                          title="Delete Level"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add Level Modal */}
      {showAddModal && (
        <div className="px-3 py-2 border-t border-surface-800/50 bg-surface-850">
          <div className="text-[10px] font-semibold text-surface-300 mb-1.5">Add New Level</div>
          <input
            type="text"
            value={newLevelName}
            onChange={e => setNewLevelName(e.target.value)}
            placeholder={`Floor ${floors.length}`}
            className="w-full bg-surface-800 border border-surface-700 rounded-lg px-2 py-1.5 text-[10px] text-white outline-none focus:border-primary-500 mb-2"
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') handleAddLevel();
              if (e.key === 'Escape') setShowAddModal(false);
            }}
          />
          <div className="flex gap-1.5">
            <button
              onClick={handleAddLevel}
              className="flex-1 py-1 bg-primary-600 hover:bg-primary-500 rounded-lg text-[10px] text-white font-medium transition-colors"
            >
              Add Level
            </button>
            <button
              onClick={() => setShowAddModal(false)}
              className="px-3 py-1 bg-surface-800 hover:bg-surface-700 rounded-lg text-[10px] text-surface-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
