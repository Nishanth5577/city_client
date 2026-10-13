// ═══════════════════════════════════════════════════════════════
// Material Editor — Select & change material/color/texture
// Material presets for quick assignment
// ═══════════════════════════════════════════════════════════════
import { useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateElementLocal } from '../../../redux/slices/bimSlice';
import { MATERIAL_LIBRARY } from '../../../utils/bimConstants';
import { Palette, Paintbrush, ChevronDown, ChevronRight, Layers, Check, Droplets } from 'lucide-react';

const MATERIAL_PRESETS = [
  { id: 'modern_white', name: 'Modern White', color: '#F5F5F0', roughness: 0.4, metalness: 0 },
  { id: 'warm_cream', name: 'Warm Cream', color: '#F5E6D3', roughness: 0.5, metalness: 0 },
  { id: 'cool_grey', name: 'Cool Grey', color: '#9CA3AF', roughness: 0.6, metalness: 0.05 },
  { id: 'charcoal', name: 'Charcoal', color: '#374151', roughness: 0.5, metalness: 0.1 },
  { id: 'sand_beige', name: 'Sand Beige', color: '#D4B896', roughness: 0.6, metalness: 0 },
  { id: 'terracotta', name: 'Terracotta', color: '#C87941', roughness: 0.7, metalness: 0 },
  { id: 'navy_blue', name: 'Navy Blue', color: '#1E3A5F', roughness: 0.5, metalness: 0 },
  { id: 'sage_green', name: 'Sage Green', color: '#7B9B5A', roughness: 0.6, metalness: 0 },
  { id: 'dusty_rose', name: 'Dusty Rose', color: '#C08B8B', roughness: 0.5, metalness: 0 },
  { id: 'matte_black', name: 'Matte Black', color: '#1A1A1A', roughness: 0.9, metalness: 0 },
  { id: 'brushed_metal', name: 'Brushed Metal', color: '#B0B0B0', roughness: 0.3, metalness: 0.8 },
  { id: 'polished_chrome', name: 'Polished Chrome', color: '#D0D0D0', roughness: 0.1, metalness: 0.9 },
];

const TEXTURE_PRESETS = [
  { id: 'brick', name: 'Red Brick', material: 'brick' },
  { id: 'concrete', name: 'Concrete', material: 'concrete' },
  { id: 'plaster', name: 'Plaster', material: 'plaster' },
  { id: 'wood_teak', name: 'Teak Wood', material: 'wood' },
  { id: 'marble_white', name: 'White Marble', material: 'marble' },
  { id: 'granite_black', name: 'Black Granite', material: 'granite' },
  { id: 'tiles_vitrified', name: 'Vitrified Tile', material: 'tiles' },
  { id: 'glass_clear', name: 'Clear Glass', material: 'glass' },
  { id: 'metal_steel', name: 'Steel', material: 'steel' },
];

// Group materials by category
function groupMaterials(materials) {
  const groups = {};
  materials.forEach(mat => {
    const cat = mat.category || 'other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(mat);
  });
  return groups;
}

export default function MaterialEditor({ selectedElement, selectedType }) {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('presets'); // presets, library, custom
  const [expandedCat, setExpandedCat] = useState(null);

  const materialGroups = useMemo(() => groupMaterials(MATERIAL_LIBRARY), []);

  const handleApplyColor = useCallback((color) => {
    if (!selectedElement) return;
    const id = selectedElement._id || selectedElement.canvas_id;
    dispatch(updateElementLocal({
      element_type: selectedType,
      element_id: id,
      updates: { color },
    }));
  }, [dispatch, selectedElement, selectedType]);

  const handleApplyMaterial = useCallback((materialId) => {
    if (!selectedElement) return;
    const id = selectedElement._id || selectedElement.canvas_id;
    dispatch(updateElementLocal({
      element_type: selectedType,
      element_id: id,
      updates: { material: materialId },
    }));
  }, [dispatch, selectedElement, selectedType]);

  if (!selectedElement) {
    return (
      <div className="px-3 py-4 text-center text-surface-500 text-[10px]">
        Select an element to edit its material
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-surface-800/50">
        <Palette className="w-3.5 h-3.5 text-primary-400" />
        <span className="text-[11px] font-semibold text-surface-300">Material</span>
      </div>

      {/* Current material info */}
      <div className="px-3 py-2 border-b border-surface-800/30">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg border border-surface-700 shadow-inner"
            style={{ backgroundColor: selectedElement.color || '#808080' }}
          />
          <div>
            <div className="text-[10px] text-surface-300">
              {selectedElement.material || 'Default'}
            </div>
            <div className="text-[9px] text-surface-500">
              {selectedElement.color || '#808080'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-800/50">
        {[
          { id: 'presets', label: 'Presets' },
          { id: 'library', label: 'Library' },
          { id: 'custom', label: 'Custom' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1.5 text-[9px] font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-primary-400 border-b-2 border-primary-500'
                : 'text-surface-500 hover:text-surface-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto max-h-64">
        {/* Presets Tab */}
        {activeTab === 'presets' && (
          <div className="p-2">
            <div className="text-[9px] font-semibold text-surface-500 mb-1.5 px-1 uppercase tracking-wider">Colors</div>
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {MATERIAL_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => handleApplyColor(preset.color)}
                  className="group relative"
                  title={preset.name}
                >
                  <div
                    className={`w-full aspect-square rounded-lg border-2 transition-all ${
                      selectedElement.color === preset.color
                        ? 'border-primary-500 ring-1 ring-primary-400/50'
                        : 'border-surface-700 hover:border-surface-500'
                    }`}
                    style={{ backgroundColor: preset.color }}
                  >
                    {selectedElement.color === preset.color && (
                      <Check className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-lg" />
                    )}
                  </div>
                  <div className="text-[7px] text-surface-500 text-center mt-0.5 truncate">{preset.name}</div>
                </button>
              ))}
            </div>

            <div className="text-[9px] font-semibold text-surface-500 mb-1.5 px-1 uppercase tracking-wider">Textures</div>
            <div className="space-y-1">
              {TEXTURE_PRESETS.map(tex => (
                <button
                  key={tex.id}
                  onClick={() => handleApplyMaterial(tex.material)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] transition-colors ${
                    selectedElement.material === tex.material
                      ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                      : 'text-surface-400 hover:bg-surface-800 hover:text-surface-200 border border-transparent'
                  }`}
                >
                  <Layers className="w-3 h-3 text-surface-500" />
                  {tex.name}
                  {selectedElement.material === tex.material && (
                    <Check className="w-3 h-3 text-primary-400 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Library Tab */}
        {activeTab === 'library' && (
          <div className="p-2">
            {Object.entries(materialGroups).map(([cat, mats]) => (
              <div key={cat}>
                <button
                  onClick={() => setExpandedCat(expandedCat === cat ? null : cat)}
                  className="w-full flex items-center gap-1.5 px-1 py-1 text-[10px] font-medium text-surface-300 hover:text-white"
                >
                  {expandedCat === cat ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  <span className="text-[8px] text-surface-500 ml-auto">{mats.length}</span>
                </button>
                {expandedCat === cat && (
                  <div className="ml-3 space-y-0.5 mb-2">
                    {mats.map(mat => (
                      <button
                        key={mat.id}
                        onClick={() => {
                          handleApplyMaterial(mat.id);
                          handleApplyColor(mat.color);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1 rounded text-[9px] text-surface-400 hover:bg-surface-800 hover:text-surface-200"
                      >
                        <div className="w-3 h-3 rounded-sm border border-surface-600" style={{ backgroundColor: mat.color }} />
                        {mat.name}
                        <span className="ml-auto text-[8px] text-surface-500">₹{mat.cost}/{mat.unit}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Custom Tab */}
        {activeTab === 'custom' && (
          <div className="p-3 space-y-3">
            {/* Color picker */}
            <div>
              <label className="text-[9px] text-surface-500 font-medium">Color</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={selectedElement.color || '#808080'}
                  onChange={e => handleApplyColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-surface-700"
                />
                <input
                  type="text"
                  value={selectedElement.color || '#808080'}
                  onChange={e => handleApplyColor(e.target.value)}
                  className="flex-1 bg-surface-800 border border-surface-700 rounded px-2 py-1 text-[10px] text-white font-mono outline-none focus:border-primary-500"
                />
              </div>
            </div>

            {/* Roughness */}
            <div>
              <label className="text-[9px] text-surface-500 font-medium flex justify-between">
                <span>Roughness</span>
                <span className="text-surface-400">{(selectedElement.materialProps?.roughness || 0.5).toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={selectedElement.materialProps?.roughness || 0.5}
                onChange={e => {
                  const id = selectedElement._id || selectedElement.canvas_id;
                  dispatch(updateElementLocal({
                    element_type: selectedType,
                    element_id: id,
                    updates: { materialProps: { ...selectedElement.materialProps, roughness: parseFloat(e.target.value) } },
                  }));
                }}
                className="w-full mt-1 h-1 bg-surface-700 rounded-full appearance-none
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
                  [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary-400
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            {/* Metalness */}
            <div>
              <label className="text-[9px] text-surface-500 font-medium flex justify-between">
                <span>Metalness</span>
                <span className="text-surface-400">{(selectedElement.materialProps?.metalness || 0).toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={selectedElement.materialProps?.metalness || 0}
                onChange={e => {
                  const id = selectedElement._id || selectedElement.canvas_id;
                  dispatch(updateElementLocal({
                    element_type: selectedType,
                    element_id: id,
                    updates: { materialProps: { ...selectedElement.materialProps, metalness: parseFloat(e.target.value) } },
                  }));
                }}
                className="w-full mt-1 h-1 bg-surface-700 rounded-full appearance-none
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
                  [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary-400
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
