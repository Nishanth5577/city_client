import { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setActiveTool, undo, redo, setViewMode, clearSelection,
  pushUndo, removeElementLocal, deleteBimElement, toggleComponentLibrary,
  togglePropertiesPanel,
} from '../../../redux/slices/bimSlice';
import { RIBBON_TABS, TOOLS, VIEW_MODES, RENDER_MODES } from '../../../utils/bimConstants';
import {
  MousePointer2, Undo2, Redo2, Trash2, Copy, ClipboardPaste,
  Minus, Square, DoorOpen, AppWindow, Footprints, RectangleHorizontal,
  Home, Ruler, Type, LayoutDashboard, Armchair, TreePine,
  Zap, Droplets, Wind, Sun, ArrowUpDown, Container, Cpu,
  ArrowUp, PanelLeft, PanelRight, Box, Sparkles, Grid3X3, Scan,
  Layers, Scissors, ClipboardList, IndianRupee, Maximize2,
  AlertTriangle, Compass, ShieldCheck, UserPlus, MessageSquare,
  GitBranch, FileText, Download, Braces, Save,
  ChevronLeft, Flame, Settings, Wifi, PanelLeftClose, PanelRightClose,
  Search, Keyboard,
} from 'lucide-react';

const ICON_MAP = {
  MousePointer2, Undo2, Redo2, Trash2, Copy, ClipboardPaste,
  Minus, Square, DoorOpen, AppWindow, Footprints, RectangleHorizontal,
  Home, Ruler, Type, LayoutDashboard, Armchair, TreePine,
  Zap, Droplets, Wind, Sun, ArrowUpDown, Container, Cpu,
  ArrowUp, PanelLeft, PanelRight, Box, Sparkles, Grid3X3, Scan,
  Layers, Scissors, ClipboardList, IndianRupee, Maximize2,
  AlertTriangle, Compass, ShieldCheck, UserPlus, MessageSquare,
  GitBranch, FileText, Download, Braces, Save,
};

export default function TopRibbon({
  projectName, onSave, saving, hasUnsavedChanges, onBack,
  onAction, showSearch, onToggleSearch,
}) {
  const dispatch = useDispatch();
  const { activeTool, undoStack, redoStack, selectedElementIds, selectedElementType, elements } = useSelector(s => s.bim);
  const [activeTab, setActiveTab] = useState('home');

  const currentTab = useMemo(() => RIBBON_TABS.find(t => t.id === activeTab), [activeTab]);

  const handleToolClick = (item) => {
    if (item.tool) {
      dispatch(setActiveTool(item.tool));
    } else if (item.action) {
      handleAction(item.action);
    }
  };

  const handleAction = (action) => {
    switch (action) {
      case 'undo': dispatch(undo()); break;
      case 'redo': dispatch(redo()); break;
      case 'delete':
        if (selectedElementIds.length > 0 && selectedElementType) {
          dispatch(pushUndo({ type: 'delete', data: JSON.parse(JSON.stringify(elements)) }));
          selectedElementIds.forEach(elId => {
            dispatch(removeElementLocal({ element_type: selectedElementType, element_id: elId }));
            dispatch(deleteBimElement({ type: selectedElementType, id: elId }));
          });
          dispatch(clearSelection());
        }
        break;
      case 'save': onSave?.(); break;
      default: onAction?.(action); break;
    }
  };

  return (
    <div className="flex flex-col bg-surface-900 border-b border-surface-700/50 select-none">
      {/* Title Bar */}
      <div className="flex items-center h-9 px-2 bg-surface-950/80 border-b border-surface-800/50">
        <button onClick={onBack} className="flex items-center gap-1 px-2 py-1 text-surface-400 hover:text-white hover:bg-surface-800 rounded transition-colors mr-2" title="Back to Projects">
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <Box className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-semibold text-white truncate">{projectName || 'BIM Design Studio'}</span>
          {hasUnsavedChanges && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Unsaved changes" />}
          {saving && <span className="text-[10px] text-amber-400 animate-pulse">Saving...</span>}
        </div>

        <div className="flex items-center gap-1">
          <button onClick={onToggleSearch} className="p-1.5 hover:bg-surface-800 rounded-lg transition-colors" title="Search (Ctrl+F)">
            <Search className="w-3.5 h-3.5 text-surface-400" />
          </button>
          <button onClick={() => dispatch(toggleComponentLibrary())} className="p-1.5 hover:bg-surface-800 rounded-lg transition-colors" title="Toggle Component Library">
            <PanelLeftClose className="w-3.5 h-3.5 text-surface-400" />
          </button>
          <button onClick={() => dispatch(togglePropertiesPanel())} className="p-1.5 hover:bg-surface-800 rounded-lg transition-colors" title="Toggle Properties Panel">
            <PanelRightClose className="w-3.5 h-3.5 text-surface-400" />
          </button>
        </div>
      </div>

      {/* Ribbon Tabs */}
      <div className="flex items-center h-7 px-1 gap-0.5 border-b border-surface-800/50">
        {RIBBON_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1 text-[11px] font-medium rounded-t transition-all ${
              activeTab === tab.id
                ? 'text-white bg-surface-800 border-b-2 border-primary-500'
                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Ribbon Tools */}
      <div className="flex items-stretch h-[72px] px-1 gap-0 overflow-x-auto">
        {currentTab?.groups.map((group, gi) => (
          <div key={gi} className="flex items-stretch">
            {/* Tools */}
            <div className="flex items-center gap-0.5 px-1.5 py-1">
              {group.tools.map((item, ti) => {
                const Icon = ICON_MAP[item.icon] || Box;
                const isActive = item.tool && activeTool === item.tool;
                const isDisabled = (item.action === 'undo' && undoStack.length === 0)
                  || (item.action === 'redo' && redoStack.length === 0)
                  || (item.action === 'delete' && selectedElementIds.length === 0);

                return (
                  <button
                    key={ti}
                    onClick={() => !isDisabled && handleToolClick(item)}
                    disabled={isDisabled}
                    title={`${item.label}${item.shortcut ? ` (${item.shortcut})` : ''}`}
                    className={`flex flex-col items-center justify-center w-12 h-14 rounded-lg transition-all text-[9px] font-medium gap-0.5 ${
                      isActive
                        ? 'bg-primary-600/30 text-primary-400 ring-1 ring-primary-500/50'
                        : isDisabled
                        ? 'text-surface-600 cursor-not-allowed'
                        : 'text-surface-400 hover:text-white hover:bg-surface-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-primary-400' : ''}`} />
                    <span className="leading-tight truncate w-full text-center">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Divider + Group Label */}
            {gi < currentTab.groups.length - 1 && (
              <div className="flex flex-col items-center justify-between py-1">
                <div className="w-px flex-1 bg-surface-700/50" />
                <span className="text-[8px] text-surface-600 font-medium px-1 whitespace-nowrap">{group.name}</span>
              </div>
            )}
            {gi === currentTab.groups.length - 1 && (
              <div className="flex items-end pb-1 pl-1">
                <span className="text-[8px] text-surface-600 font-medium whitespace-nowrap">{group.name}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
