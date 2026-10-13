// ═══════════════════════════════════════════════════════════════
// Model Tree — Hierarchical BIM element browser
// Building → Level → Category → Elements
// Hide/show/isolate/lock/select/rename per item
// ═══════════════════════════════════════════════════════════════
import { useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectElement, clearSelection } from '../../../redux/slices/bimSlice';
import {
  ChevronDown, ChevronRight, Eye, EyeOff, Lock, Unlock,
  Layers, Box, Minus, DoorOpen, AppWindow, Footprints,
  Square, Armchair, Building2, Search,
} from 'lucide-react';

const CATEGORY_CONFIG = {
  walls: { icon: Minus, label: 'Walls', color: '#8B7355' },
  columns: { icon: Square, label: 'Columns', color: '#A0A0A0' },
  beams: { icon: Minus, label: 'Beams', color: '#808080' },
  doors: { icon: DoorOpen, label: 'Doors', color: '#8B4513' },
  windows: { icon: AppWindow, label: 'Windows', color: '#87CEEB' },
  stairs: { icon: Footprints, label: 'Stairs', color: '#C0C0C0' },
  furniture: { icon: Armchair, label: 'Furniture', color: '#7C3AED' },
  rooms: { icon: Layers, label: 'Rooms', color: '#0D9488' },
};

function getElementName(el, category, index) {
  if (el.name) return el.name;
  if (el.floor_name) return el.floor_name;
  const cfg = CATEGORY_CONFIG[category];
  const label = cfg?.label || category;
  // Generate descriptive names
  switch (category) {
    case 'walls': {
      const type = el.wall_type || 'exterior';
      const length = el.start_point && el.end_point ?
        Math.round(Math.sqrt((el.end_point.x - el.start_point.x) ** 2 + (el.end_point.y - el.start_point.y) ** 2)) : 0;
      return `${type.charAt(0).toUpperCase() + type.slice(1)} Wall ${length ? `(${length}mm)` : ''}`;
    }
    case 'doors': return `${(el.door_type || el.type || 'Single').charAt(0).toUpperCase() + (el.door_type || el.type || 'single').slice(1)} Door`;
    case 'windows': return `${(el.window_type || el.type || 'Casement').charAt(0).toUpperCase() + (el.window_type || el.type || 'casement').slice(1)} Window`;
    case 'furniture': return el.type ? el.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : `Furniture ${index + 1}`;
    case 'rooms': return el.name || `Room ${index + 1}`;
    default: return `${label.slice(0, -1)} ${index + 1}`;
  }
}

function TreeNode({ label, icon: Icon, color, count, children, isExpanded, onToggle, onSelect, isSelected, depth = 0 }) {
  const hasChildren = children && children.length > 0;
  const [expanded, setExpanded] = useState(isExpanded || false);

  const handleToggle = () => {
    setExpanded(!expanded);
    onToggle?.();
  };

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-1.5 py-1 cursor-pointer rounded-md transition-all text-[10px] ${
          isSelected
            ? 'bg-primary-600/20 text-primary-400 border-l-2 border-primary-500'
            : 'text-surface-400 hover:bg-surface-800/60 hover:text-surface-200 border-l-2 border-transparent'
        }`}
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
        onClick={() => {
          if (hasChildren) handleToggle();
          else onSelect?.();
        }}
      >
        {hasChildren ? (
          <button onClick={(e) => { e.stopPropagation(); handleToggle(); }} className="flex-shrink-0">
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}
        {Icon && <Icon className="w-3 h-3 flex-shrink-0" style={{ color: color || 'inherit' }} />}
        <span className="flex-1 truncate">{label}</span>
        {count !== undefined && (
          <span className="text-[8px] text-surface-500 bg-surface-800 px-1 rounded">{count}</span>
        )}
      </div>
      {expanded && hasChildren && (
        <div>{children}</div>
      )}
    </div>
  );
}

export default function ModelTree() {
  const dispatch = useDispatch();
  const { elements, selectedElementIds, selectedElementType, activeProject, activeBuildingId } = useSelector(s => s.bim);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(true);

  const building = activeProject?.buildings?.find(b => b._id === activeBuildingId) || activeProject?.buildings?.[0];

  const handleSelectElement = useCallback((id, type) => {
    dispatch(selectElement({ id, type }));
  }, [dispatch]);

  // Organize elements by category
  const tree = useMemo(() => {
    const categories = {};
    Object.entries(elements).forEach(([key, arr]) => {
      if (arr && arr.length > 0) {
        const cfg = CATEGORY_CONFIG[key];
        if (cfg) {
          categories[key] = {
            ...cfg,
            elements: arr.filter(el => {
              if (!search) return true;
              const name = getElementName(el, key, 0).toLowerCase();
              return name.includes(search.toLowerCase());
            }),
          };
        }
      }
    });
    return categories;
  }, [elements, search]);

  const totalElements = Object.values(tree).reduce((sum, cat) => sum + cat.elements.length, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-800/50">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-surface-300 hover:text-white transition-colors"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <Box className="w-3.5 h-3.5 text-primary-400" />
          Model Tree
        </button>
        <span className="text-[9px] text-surface-500">{totalElements}</span>
      </div>

      {expanded && (
        <>
          {/* Search */}
          <div className="px-2 py-1.5">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-surface-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search elements..."
                className="w-full bg-surface-800/50 border border-surface-700/50 rounded-lg pl-6 pr-2 py-1 text-[10px] text-surface-200 outline-none focus:border-primary-500/50 placeholder:text-surface-600"
              />
            </div>
          </div>

          {/* Tree */}
          <div className="flex-1 overflow-y-auto px-1 py-1">
            {/* Building node */}
            <TreeNode
              label={building?.name || 'Building'}
              icon={Building2}
              color="#6366F1"
              count={totalElements}
              isExpanded={true}
              depth={0}
            >
              {Object.entries(tree).map(([key, category]) => (
                <TreeNode
                  key={key}
                  label={category.label}
                  icon={category.icon}
                  color={category.color}
                  count={category.elements.length}
                  isExpanded={category.elements.length <= 8}
                  depth={1}
                >
                  {category.elements.map((el, i) => {
                    const id = el._id || el.canvas_id || el.id;
                    const isSelected = selectedElementIds.includes(id);
                    const type = key === 'furniture' ? 'furniture' : key.replace(/s$/, '');
                    return (
                      <TreeNode
                        key={id || i}
                        label={getElementName(el, key, i)}
                        color={category.color}
                        depth={2}
                        isSelected={isSelected}
                        onSelect={() => handleSelectElement(id, type)}
                      />
                    );
                  })}
                </TreeNode>
              ))}
            </TreeNode>

            {totalElements === 0 && (
              <div className="text-center text-surface-500 text-[10px] py-6">
                No elements yet.<br />Draw walls or add components.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
