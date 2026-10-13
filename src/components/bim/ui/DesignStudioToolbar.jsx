// ═══════════════════════════════════════════════════════════════
// DesignStudioToolbar — Compact single-row professional toolbar
// Replaces the multi-row ribbon with a streamlined tool bar
// ═══════════════════════════════════════════════════════════════
import { memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setActiveTool, clearSelection, pushUndo,
  removeElementLocal, deleteBimElement,
  setTransformMode,
} from '../../../redux/slices/bimSlice';
import { TOOLS, TRANSFORM_MODES } from '../../../utils/bimConstants';
import {
  MousePointer2, Move, RotateCw, Maximize2,
  Trash2, Copy, Minus, Square, DoorOpen, AppWindow,
  Footprints, RectangleHorizontal, Home, Ruler,
  Armchair, Type, LayoutDashboard,
  PanelLeftClose, PanelRightClose,
} from 'lucide-react';

const TOOL_GROUPS = [
  {
    name: 'Select',
    tools: [
      { id: TOOLS.SELECT, label: 'Select', icon: MousePointer2, shortcut: 'V' },
      { id: '__move', label: 'Move', icon: Move, shortcut: 'T', transform: TRANSFORM_MODES.TRANSLATE },
      { id: '__rotate', label: 'Rotate', icon: RotateCw, shortcut: 'R', transform: TRANSFORM_MODES.ROTATE },
    ],
  },
  {
    name: 'Architecture',
    tools: [
      { id: TOOLS.WALL, label: 'Wall', icon: Minus, shortcut: 'W' },
      { id: TOOLS.DOOR, label: 'Door', icon: DoorOpen, shortcut: 'D' },
      { id: TOOLS.WINDOW, label: 'Window', icon: AppWindow, shortcut: 'N' },
      { id: TOOLS.COLUMN, label: 'Column', icon: Square, shortcut: 'C' },
      { id: TOOLS.STAIR, label: 'Stair', icon: Footprints, shortcut: 'S' },
      { id: TOOLS.SLAB, label: 'Slab', icon: RectangleHorizontal },
      { id: TOOLS.ROOF, label: 'Roof', icon: Home },
      { id: TOOLS.ROOM, label: 'Room', icon: LayoutDashboard },
    ],
  },
  {
    name: 'Design',
    tools: [
      { id: TOOLS.FURNITURE, label: 'Furniture', icon: Armchair, shortcut: 'F' },
      { id: TOOLS.MEASURE, label: 'Measure', icon: Ruler, shortcut: 'M' },
      { id: TOOLS.TEXT, label: 'Annotate', icon: Type },
    ],
  },
];

const ToolButton = memo(function ToolButton({ tool, isActive, onClick }) {
  const Icon = tool.icon;
  return (
    <button
      onClick={onClick}
      className={`bim-toolbar__tool ${isActive ? 'bim-toolbar__tool--active' : ''}`}
      title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
});

export default function DesignStudioToolbar({ onToggleLeft, onToggleRight, showLeft, showRight }) {
  const dispatch = useDispatch();
  const { activeTool, transformMode, selectedElementIds, selectedElementType, elements } = useSelector(s => s.bim);

  const handleToolClick = (tool) => {
    if (tool.transform) {
      dispatch(setTransformMode(tool.transform));
      dispatch(setActiveTool(TOOLS.SELECT));
    } else {
      dispatch(setActiveTool(tool.id));
    }
  };

  const handleDelete = () => {
    if (selectedElementIds.length > 0 && selectedElementType) {
      dispatch(pushUndo({ type: 'delete', data: JSON.parse(JSON.stringify(elements)) }));
      selectedElementIds.forEach(elId => {
        dispatch(removeElementLocal({ element_type: selectedElementType, element_id: elId }));
        dispatch(deleteBimElement({ type: selectedElementType, id: elId }));
      });
      dispatch(clearSelection());
    }
  };

  return (
    <div className="bim-toolbar">
      {/* Left panel toggle */}
      <button
        onClick={onToggleLeft}
        className={`bim-toolbar__panel-toggle ${showLeft ? 'bim-toolbar__panel-toggle--active' : ''}`}
        title="Toggle Component Library"
      >
        <PanelLeftClose className="w-4 h-4" />
      </button>

      <div className="bim-toolbar__divider" />

      {/* Tool groups */}
      {TOOL_GROUPS.map((group, gi) => (
        <div key={gi} className="bim-toolbar__group">
          {group.tools.map(tool => {
            const isActive = tool.transform
              ? (activeTool === TOOLS.SELECT && transformMode === tool.transform)
              : activeTool === tool.id;
            return (
              <ToolButton
                key={tool.id}
                tool={tool}
                isActive={isActive}
                onClick={() => handleToolClick(tool)}
              />
            );
          })}
          {gi < TOOL_GROUPS.length - 1 && <div className="bim-toolbar__divider" />}
        </div>
      ))}

      {/* Spacer */}
      <div className="bim-toolbar__spacer" />

      {/* Context actions */}
      {selectedElementIds.length > 0 && (
        <div className="bim-toolbar__group">
          <button onClick={handleDelete} className="bim-toolbar__tool bim-toolbar__tool--danger" title="Delete (Del)">
            <Trash2 className="w-4 h-4" />
          </button>
          <button className="bim-toolbar__tool" title="Duplicate (Ctrl+D)">
            <Copy className="w-4 h-4" />
          </button>
          <div className="bim-toolbar__divider" />
        </div>
      )}

      {/* Right panel toggle */}
      <button
        onClick={onToggleRight}
        className={`bim-toolbar__panel-toggle ${showRight ? 'bim-toolbar__panel-toggle--active' : ''}`}
        title="Toggle Properties Panel"
      >
        <PanelRightClose className="w-4 h-4" />
      </button>
    </div>
  );
}
