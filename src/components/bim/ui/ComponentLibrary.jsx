import { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveTool, addElementLocal, pushUndo } from '../../../redux/slices/bimSlice';
import {
  COMPONENT_CATEGORIES, FURNITURE_CATALOG, LANDSCAPE_CATALOG,
  EQUIPMENT_CATALOG, FIRE_SAFETY_CATALOG, SMART_DEVICES_CATALOG,
  WALL_PRESETS, DOOR_PRESETS, WINDOW_PRESETS, COLUMN_PRESETS, STAIR_PRESETS,
} from '../../../utils/bimConstants';
import {
  ChevronRight, ChevronDown, Search, Building2, Blocks, Zap,
  Droplets, Wind, Armchair, TreePine, Settings, Flame, Wifi,
  GripVertical, Plus,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const ICON_MAP = {
  Building2, Blocks, Zap, Droplets, Wind, Armchair, TreePine, Settings, Flame, Wifi,
};

const PRESET_MAP = {
  WALL_PRESETS: WALL_PRESETS,
  DOOR_PRESETS: DOOR_PRESETS,
  WINDOW_PRESETS: WINDOW_PRESETS,
  COLUMN_PRESETS: COLUMN_PRESETS,
  STAIR_PRESETS: STAIR_PRESETS,
};

const CATALOG_MAP = {
  bedroom: FURNITURE_CATALOG.filter(f => f.category === 'bedroom'),
  living: FURNITURE_CATALOG.filter(f => f.category === 'living'),
  dining: FURNITURE_CATALOG.filter(f => f.category === 'dining'),
  kitchen: FURNITURE_CATALOG.filter(f => f.category === 'kitchen'),
  bathroom: FURNITURE_CATALOG.filter(f => f.category === 'bathroom'),
  office: FURNITURE_CATALOG.filter(f => f.category === 'office'),
};

export default function ComponentLibrary() {
  const dispatch = useDispatch();
  const { activeTool, activeFloorId, elements } = useSelector(s => s.bim);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({ architecture: true });
  const [expandedChild, setExpandedChild] = useState({});

  const toggleCategory = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleChild = (id) => {
    setExpandedChild(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Search across all catalogs
  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    const results = [];

    // Search presets
    [...WALL_PRESETS, ...DOOR_PRESETS, ...WINDOW_PRESETS, ...COLUMN_PRESETS, ...STAIR_PRESETS]
      .filter(p => p.name.toLowerCase().includes(q))
      .forEach(p => results.push({ ...p, source: 'preset' }));

    // Search catalogs
    [...FURNITURE_CATALOG, ...LANDSCAPE_CATALOG, ...EQUIPMENT_CATALOG, ...FIRE_SAFETY_CATALOG, ...SMART_DEVICES_CATALOG]
      .filter(c => c.name.toLowerCase().includes(q) || c.type?.toLowerCase().includes(q))
      .forEach(c => results.push({ ...c, source: 'catalog' }));

    return results.slice(0, 30);
  }, [search]);

  const handlePlaceItem = (item) => {
    if (!activeFloorId) return;

    const canvasId = uuidv4();
    const baseX = 2000 + Math.random() * 4000;
    const baseY = 2000 + Math.random() * 4000;

    dispatch(pushUndo({ type: 'add', data: JSON.parse(JSON.stringify(elements)) }));

    dispatch(addElementLocal({
      element_type: 'furniture',
      element: {
        canvas_id: canvasId,
        name: item.name,
        type: item.type,
        position: { x: baseX, y: baseY },
        width: item.width || 1000,
        depth: item.depth || 1000,
        height: item.height || 1000,
        color: item.color || '#808080',
        rotation: 0,
        material: 'default',
        layer: 'furniture',
      },
    }));
  };

  const getItemCount = (categoryId) => {
    const cat = COMPONENT_CATEGORIES.find(c => c.id === categoryId);
    if (!cat) return 0;
    let count = 0;
    cat.children.forEach(child => {
      if (child.presets) count += (PRESET_MAP[child.presets] || []).length;
      else if (child.catalog) count += (CATALOG_MAP[child.catalog] || []).length;
    });
    return count;
  };

  const renderPresetItem = (preset, index) => (
    <button
      key={index}
      onClick={() => {
        if (preset.tool) dispatch(setActiveTool(preset.tool));
        else handlePlaceItem(preset);
      }}
      className="flex items-center gap-2 w-full px-2 py-1.5 text-left rounded-md hover:bg-surface-700/50 transition-colors group"
    >
      <div className="w-7 h-7 rounded bg-surface-700/50 border border-surface-600/30 flex items-center justify-center flex-shrink-0">
        <div
          className="w-4 h-3 rounded-sm"
          style={{ backgroundColor: preset.color || '#808080' }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-surface-200 truncate leading-tight">{preset.name}</div>
        {preset.thickness && (
          <div className="text-[9px] text-surface-500 leading-tight">{preset.thickness}mm thick</div>
        )}
        {preset.width && preset.height && !preset.thickness && (
          <div className="text-[9px] text-surface-500 leading-tight">{preset.width}×{preset.height}mm</div>
        )}
        {preset.width && preset.depth && preset.height && (
          <div className="text-[9px] text-surface-500 leading-tight">{preset.width}×{preset.depth}×{preset.height}mm</div>
        )}
      </div>
      <Plus className="w-3 h-3 text-surface-600 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );

  const renderChildCategory = (child) => {
    const isOpen = expandedChild[child.id];
    let items = [];

    if (child.presets) items = PRESET_MAP[child.presets] || [];
    else if (child.catalog) items = CATALOG_MAP[child.catalog] || [];

    return (
      <div key={child.id}>
        <button
          onClick={() => {
            if (child.tool && !child.presets && !child.catalog) {
              dispatch(setActiveTool(child.tool));
            } else {
              toggleChild(child.id);
            }
          }}
          className={`flex items-center gap-1.5 w-full px-4 py-1.5 text-left hover:bg-surface-800/50 transition-colors ${
            child.tool && activeTool === child.tool ? 'bg-primary-600/15 text-primary-400' : 'text-surface-300'
          }`}
        >
          {items.length > 0 ? (
            isOpen ? <ChevronDown className="w-3 h-3 text-surface-500" /> : <ChevronRight className="w-3 h-3 text-surface-500" />
          ) : (
            <div className="w-3 h-3 rounded-full bg-surface-700 border border-surface-600" />
          )}
          <span className="text-[11px] font-medium flex-1">{child.name}</span>
          {items.length > 0 && (
            <span className="text-[9px] text-surface-600 bg-surface-800 px-1.5 py-0.5 rounded-full">{items.length}</span>
          )}
        </button>

        {isOpen && items.length > 0 && (
          <div className="pl-4 pr-1 py-1 space-y-0.5">
            {items.map((item, i) => renderPresetItem(item, i))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Search */}
      <div className="px-2 py-2 border-b border-surface-800/50">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search components..."
            className="w-full pl-7 pr-2 py-1.5 bg-surface-800/50 border border-surface-700/50 rounded-lg text-[11px] text-surface-200 placeholder-surface-600 focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500/50 outline-none transition-all"
          />
        </div>
      </div>

      {/* Search Results */}
      {searchResults ? (
        <div className="flex-1 overflow-y-auto px-1 py-1">
          <div className="px-2 py-1">
            <span className="text-[10px] text-surface-500 font-medium">
              {searchResults.length} results for "{search}"
            </span>
          </div>
          <div className="space-y-0.5 px-1">
            {searchResults.map((item, i) => renderPresetItem(item, i))}
          </div>
          {searchResults.length === 0 && (
            <div className="text-center py-6 text-surface-500 text-xs">No components found</div>
          )}
        </div>
      ) : (
        /* Category Tree */
        <div className="flex-1 overflow-y-auto">
          {COMPONENT_CATEGORIES.map(cat => {
            const Icon = ICON_MAP[cat.icon] || Building2;
            const isOpen = expanded[cat.id];
            const count = getItemCount(cat.id);

            return (
              <div key={cat.id} className="border-b border-surface-800/30">
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="flex items-center gap-2 w-full px-2 py-2 text-left hover:bg-surface-800/30 transition-colors"
                >
                  {isOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-surface-500 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-surface-500 flex-shrink-0" />
                  )}
                  <Icon className="w-4 h-4 text-primary-400 flex-shrink-0" />
                  <span className="text-[11px] font-semibold text-surface-200 flex-1">{cat.name}</span>
                  {count > 0 && (
                    <span className="text-[9px] text-surface-600 bg-surface-800 px-1.5 py-0.5 rounded-full">{count}</span>
                  )}
                </button>

                {isOpen && (
                  <div className="pb-1">
                    {cat.children.map(child => renderChildCategory(child))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Access */}
      <div className="border-t border-surface-800/50 px-2 py-1.5">
        <div className="flex items-center gap-1 flex-wrap">
          {[
            { tool: 'wall', icon: '▬', label: 'W' },
            { tool: 'column', icon: '▮', label: 'C' },
            { tool: 'door', icon: '🚪', label: 'D' },
            { tool: 'window', icon: '⊞', label: 'N' },
            { tool: 'stair', icon: '⊟', label: 'S' },
          ].map(q => (
            <button
              key={q.tool}
              onClick={() => dispatch(setActiveTool(q.tool))}
              title={`${q.tool} (${q.label})`}
              className={`w-7 h-7 rounded flex items-center justify-center text-xs transition-all ${
                activeTool === q.tool
                  ? 'bg-primary-600/30 text-primary-400 ring-1 ring-primary-500/50'
                  : 'bg-surface-800/50 text-surface-400 hover:bg-surface-700 hover:text-white'
              }`}
            >
              {q.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
