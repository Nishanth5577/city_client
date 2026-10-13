import { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectElement, clearSelection } from '../../../redux/slices/bimSlice';
import {
  ChevronRight, ChevronDown, Eye, EyeOff, Lock, Unlock,
  Building2, Layers, Box,
} from 'lucide-react';

const ELEMENT_GROUPS = [
  { key: 'walls', label: 'Walls', icon: '▬', color: '#8B7355' },
  { key: 'columns', label: 'Columns', icon: '▮', color: '#A0A0A0' },
  { key: 'beams', label: 'Beams', icon: '━', color: '#909090' },
  { key: 'doors', label: 'Doors', icon: '🚪', color: '#8B4513' },
  { key: 'windows', label: 'Windows', icon: '⊞', color: '#87CEEB' },
  { key: 'stairs', label: 'Stairs', icon: '⊟', color: '#B0B0B0' },
  { key: 'furniture', label: 'Furniture', icon: '🪑', color: '#7C3AED' },
  { key: 'rooms', label: 'Rooms', icon: '⬚', color: '#4A90D9' },
];

export default function ObjectTree() {
  const dispatch = useDispatch();
  const { elements, selectedElementIds, activeProject, activeBuildingId, activeFloorId } = useSelector(s => s.bim);
  const [expanded, setExpanded] = useState({ walls: true, columns: true });

  const currentBuilding = activeProject?.buildings?.find(b => b._id === activeBuildingId);
  const currentFloor = currentBuilding?.floors?.find(f => f._id === activeFloorId);

  const totalElements = useMemo(() => {
    let count = 0;
    ELEMENT_GROUPS.forEach(g => { count += (elements[g.key] || []).length; });
    return count;
  }, [elements]);

  const toggleGroup = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectElement = (id, type) => {
    dispatch(selectElement({ id, type }));
  };

  return (
    <div className="flex-1 overflow-y-auto text-[11px]">
      {/* Building Header */}
      <div className="px-3 py-2 border-b border-surface-800/50">
        <div className="flex items-center gap-1.5 text-surface-300">
          <Building2 className="w-3.5 h-3.5 text-primary-400" />
          <span className="font-semibold truncate">{currentBuilding?.name || 'Building'}</span>
        </div>
        <div className="flex items-center gap-1.5 pl-5 mt-1 text-surface-400">
          <Layers className="w-3 h-3" />
          <span className="truncate">{currentFloor?.floor_name || 'Floor'}</span>
          <span className="text-[9px] text-surface-600 ml-auto">{totalElements} elements</span>
        </div>
      </div>

      {/* Element Groups */}
      <div className="py-1">
        {ELEMENT_GROUPS.map(group => {
          const items = elements[group.key] || [];
          if (items.length === 0) return null;

          const isOpen = expanded[group.key];

          return (
            <div key={group.key}>
              <button
                onClick={() => toggleGroup(group.key)}
                className="flex items-center gap-1.5 w-full px-3 py-1.5 hover:bg-surface-800/30 transition-colors"
              >
                {isOpen ? (
                  <ChevronDown className="w-3 h-3 text-surface-500" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-surface-500" />
                )}
                <span className="text-sm" style={{ color: group.color }}>{group.icon}</span>
                <span className="font-medium text-surface-300 flex-1 text-left">{group.label}</span>
                <span className="text-[9px] text-surface-600 bg-surface-800 px-1.5 py-0.5 rounded-full">
                  {items.length}
                </span>
              </button>

              {isOpen && (
                <div className="pl-6 pr-2 py-0.5">
                  {items.map((item, i) => {
                    const id = item._id || item.canvas_id;
                    const isSelected = selectedElementIds.includes(id);
                    const name = item.name || item.wall_type || item.door_type || `${group.label.slice(0, -1)} ${i + 1}`;

                    return (
                      <button
                        key={id || i}
                        onClick={() => handleSelectElement(id, group.key.replace(/s$/, ''))}
                        className={`flex items-center gap-1.5 w-full px-2 py-1 rounded transition-all ${
                          isSelected
                            ? 'bg-primary-600/20 text-primary-300 ring-1 ring-primary-500/30'
                            : 'text-surface-400 hover:bg-surface-800/40 hover:text-surface-200'
                        }`}
                      >
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color || group.color }}
                        />
                        <span className="truncate flex-1 text-left">{name}</span>
                        {item.width && (
                          <span className="text-[9px] text-surface-600">{item.width}mm</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalElements === 0 && (
        <div className="text-center py-8 text-surface-500 text-xs">
          <Box className="w-8 h-8 mx-auto mb-2 text-surface-700" />
          No elements yet.<br />Draw walls or place components.
        </div>
      )}
    </div>
  );
}
