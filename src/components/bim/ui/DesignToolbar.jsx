import { useDispatch, useSelector } from 'react-redux';
import { setActiveTool, setViewMode, undo, redo, toggleComponentLibrary, togglePropertiesPanel } from '../../../redux/slices/bimSlice';
import { TOOLS, VIEW_MODES } from '../../../utils/bimConstants';
import {
  MousePointer2, Minus, Square, DoorOpen, AppWindow, Footprints, Armchair, Ruler,
  Undo2, Redo2, Save, Download, ChevronLeft, Grid3X3, Box, PanelLeftOpen, PanelRightOpen,
  Loader2, Circle
} from 'lucide-react';

const TOOL_ITEMS = [
  { tool: TOOLS.SELECT, icon: MousePointer2, label: 'Select (V)', key: 'V' },
  { tool: TOOLS.WALL, icon: Minus, label: 'Wall (W)', key: 'W' },
  { tool: TOOLS.COLUMN, icon: Square, label: 'Column (C)', key: 'C' },
  { tool: TOOLS.DOOR, icon: DoorOpen, label: 'Door (D)', key: 'D' },
  { tool: TOOLS.WINDOW, icon: AppWindow, label: 'Window (N)', key: 'N' },
  { tool: TOOLS.STAIR, icon: Footprints, label: 'Stair (S)', key: 'S' },
  { tool: TOOLS.FURNITURE, icon: Armchair, label: 'Furniture (F)', key: 'F' },
  { tool: TOOLS.MEASURE, icon: Ruler, label: 'Measure (M)', key: 'M' },
];

export default function DesignToolbar({ projectName, onSave, saving, hasUnsavedChanges, onBack }) {
  const dispatch = useDispatch();
  const { activeTool, undoStack, redoStack, showComponentLibrary, showPropertiesPanel } = useSelector(s => s.bim);

  return (
    <div className="h-12 bg-surface-900 border-b border-surface-800 flex items-center px-2 gap-1 flex-shrink-0">
      {/* Back button */}
      <button onClick={onBack} className="p-2 hover:bg-surface-800 rounded-lg transition-colors" title="Back to Projects">
        <ChevronLeft className="w-4 h-4 text-surface-400" />
      </button>

      {/* Project name */}
      <div className="flex items-center gap-2 px-3 border-r border-surface-800 mr-2">
        <span className="text-sm font-semibold text-white truncate max-w-[180px]">{projectName}</span>
        {hasUnsavedChanges && <Circle className="w-2 h-2 fill-amber-400 text-amber-400" />}
      </div>

      {/* Panel toggles */}
      <button
        onClick={() => dispatch(toggleComponentLibrary())}
        className={`p-2 rounded-lg transition-colors ${showComponentLibrary ? 'bg-surface-700 text-white' : 'text-surface-500 hover:bg-surface-800'}`}
        title="Component Library"
      >
        <PanelLeftOpen className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-surface-800 mx-1" />

      {/* Drawing Tools */}
      {TOOL_ITEMS.map(({ tool, icon: Icon, label }) => (
        <button
          key={tool}
          onClick={() => dispatch(setActiveTool(tool))}
          className={`p-2 rounded-lg transition-all ${activeTool === tool
            ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30'
            : 'text-surface-400 hover:bg-surface-800 hover:text-surface-200'
          }`}
          title={label}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}

      <div className="w-px h-6 bg-surface-800 mx-1" />

      {/* Undo/Redo */}
      <button onClick={() => dispatch(undo())} disabled={undoStack.length === 0}
        className="p-2 rounded-lg text-surface-400 hover:bg-surface-800 disabled:opacity-30 disabled:cursor-not-allowed" title="Undo (Ctrl+Z)">
        <Undo2 className="w-4 h-4" />
      </button>
      <button onClick={() => dispatch(redo())} disabled={redoStack.length === 0}
        className="p-2 rounded-lg text-surface-400 hover:bg-surface-800 disabled:opacity-30 disabled:cursor-not-allowed" title="Redo (Ctrl+Y)">
        <Redo2 className="w-4 h-4" />
      </button>

      <div className="flex-1" />

      {/* Save */}
      <button onClick={onSave} disabled={saving || !hasUnsavedChanges}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
          ${hasUnsavedChanges ? 'bg-primary-600 text-white hover:bg-primary-700' : 'text-surface-500 bg-surface-800/50'}
          disabled:opacity-50`}
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        {saving ? 'Saving...' : 'Save'}
      </button>

      {/* Export */}
      <button className="p-2 rounded-lg text-surface-400 hover:bg-surface-800" title="Export">
        <Download className="w-4 h-4" />
      </button>

      {/* Right panel toggle */}
      <button
        onClick={() => dispatch(togglePropertiesPanel())}
        className={`p-2 rounded-lg transition-colors ${showPropertiesPanel ? 'bg-surface-700 text-white' : 'text-surface-500 hover:bg-surface-800'}`}
        title="Properties Panel"
      >
        <PanelRightOpen className="w-4 h-4" />
      </button>
    </div>
  );
}
