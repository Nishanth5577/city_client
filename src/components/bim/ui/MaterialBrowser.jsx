import { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateElementLocal } from '../../../redux/slices/bimSlice';
import { MATERIAL_LIBRARY } from '../../../utils/bimConstants';
import { Search, Palette, Check } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'concrete', label: 'Concrete' },
  { id: 'steel', label: 'Steel' },
  { id: 'brick', label: 'Brick' },
  { id: 'glass', label: 'Glass' },
  { id: 'wood', label: 'Wood' },
  { id: 'granite', label: 'Granite' },
  { id: 'marble', label: 'Marble' },
  { id: 'tile', label: 'Tile' },
  { id: 'aluminium', label: 'Aluminium' },
  { id: 'pvc', label: 'PVC' },
  { id: 'paint', label: 'Paint' },
  { id: 'plaster', label: 'Plaster' },
  { id: 'gypsum', label: 'Gypsum' },
];

export default function MaterialBrowser() {
  const dispatch = useDispatch();
  const { selectedElementIds, selectedElementType, elements } = useSelector(s => s.bim);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const filteredMaterials = useMemo(() => {
    let list = MATERIAL_LIBRARY;
    if (activeCategory !== 'all') {
      list = list.filter(m => m.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q));
    }
    return list;
  }, [activeCategory, search]);

  const getSelectedElement = () => {
    if (!selectedElementIds.length || !selectedElementType) return null;
    const typeKey = selectedElementType === 'furniture' ? 'furniture' : `${selectedElementType}s`;
    const arr = elements[typeKey] || [];
    return arr.find(el => (el._id || el.canvas_id) === selectedElementIds[0]);
  };

  const currentElement = getSelectedElement();

  const handleApplyMaterial = (material) => {
    if (!selectedElementIds.length || !selectedElementType) return;
    setSelectedMaterial(material.id);

    selectedElementIds.forEach(elId => {
      dispatch(updateElementLocal({
        element_type: selectedElementType,
        element_id: elId,
        updates: {
          material: material.name,
          color: material.color,
        },
      }));
    });
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col text-[11px]">
      {/* Search */}
      <div className="px-2 py-2 border-b border-surface-800/50">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-surface-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search materials..."
            className="w-full pl-7 pr-2 py-1.5 bg-surface-800/50 border border-surface-700/50 rounded-lg text-[11px] text-surface-200 placeholder-surface-600 focus:ring-1 focus:ring-primary-500/50 outline-none"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="px-2 py-1.5 border-b border-surface-800/50 flex flex-wrap gap-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-2 py-0.5 rounded-full text-[9px] font-medium transition-all ${
              activeCategory === cat.id
                ? 'bg-primary-600/30 text-primary-400 ring-1 ring-primary-500/30'
                : 'bg-surface-800/50 text-surface-500 hover:text-surface-300 hover:bg-surface-700/50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Material Grid */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-2 gap-1.5">
          {filteredMaterials.map(mat => {
            const isApplied = currentElement?.material === mat.name;

            return (
              <button
                key={mat.id}
                onClick={() => handleApplyMaterial(mat)}
                className={`relative rounded-lg p-2 text-left transition-all border ${
                  isApplied
                    ? 'border-primary-500/50 bg-primary-600/10 ring-1 ring-primary-500/30'
                    : 'border-surface-700/30 bg-surface-800/30 hover:bg-surface-700/40 hover:border-surface-600/50'
                }`}
              >
                {/* Color Swatch */}
                <div
                  className="w-full h-8 rounded-md mb-1.5 border border-surface-600/20"
                  style={{
                    backgroundColor: mat.color,
                    opacity: mat.opacity ?? 1,
                  }}
                />

                {/* Name */}
                <div className="text-[10px] font-medium text-surface-200 truncate">{mat.name}</div>

                {/* Properties */}
                <div className="text-[9px] text-surface-500 mt-0.5 space-y-0.5">
                  <div>₹{mat.cost?.toLocaleString()}/{mat.unit}</div>
                  {mat.density > 0 && <div>{mat.density} kg/m³</div>}
                  {mat.strength > 0 && <div>{mat.strength} MPa</div>}
                </div>

                {/* Applied indicator */}
                {isApplied && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {filteredMaterials.length === 0 && (
          <div className="text-center py-6 text-surface-500 text-xs">
            <Palette className="w-8 h-8 mx-auto mb-2 text-surface-700" />
            No materials found
          </div>
        )}
      </div>

      {/* Selected element info */}
      {currentElement && (
        <div className="px-3 py-2 border-t border-surface-800/50 bg-surface-800/30">
          <div className="text-[9px] text-surface-500">
            Applying to: <span className="text-surface-300">{currentElement.name || selectedElementType}</span>
          </div>
          {currentElement.material && (
            <div className="text-[9px] text-surface-500 mt-0.5">
              Current: <span className="text-primary-400">{currentElement.material}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
