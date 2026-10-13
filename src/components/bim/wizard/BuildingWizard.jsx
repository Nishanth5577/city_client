// ═══════════════════════════════════════════════════════════════
// Building Wizard — Step-by-step building creation
// ═══════════════════════════════════════════════════════════════
import { useState, useCallback } from 'react';
import useBimStore from '../../../stores/bimStore';
import { generateBuilding, BUILDING_TEMPLATES } from '../../../bim/core/BuildingGenerator';
import {
  BUILDING_TYPES, BUILDING_TYPE_LABELS, ROOF_TYPES,
  ROOM_TYPES, ROOM_TYPE_LABELS,
} from '../../../stores/bimTypes';
import {
  Building2, Home, Layers, ArrowRight, ArrowLeft, Check,
  Ruler, X, Sparkles, Plus, Trash2,
} from 'lucide-react';

export default function BuildingWizard({ onClose }) {
  const loadBuildingData = useBimStore(s => s.loadBuildingData);
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({
    name: 'New Building',
    type: 'villa',
    siteWidth: 40000,
    siteLength: 30000,
    buildingWidth: 15000,
    buildingLength: 12000,
    numFloors: 2,
    floorHeight: 3200,
    wallThickness: 230,
    roofType: 'flat',
    rooms: [],
  });

  const updateConfig = (key, value) => setConfig(prev => ({ ...prev, [key]: value }));

  const handleGenerate = useCallback(() => {
    const data = generateBuilding(config);
    loadBuildingData(data);
    onClose?.();
  }, [config, loadBuildingData, onClose]);

  const handleTemplate = useCallback((template) => {
    const data = generateBuilding(template.config);
    loadBuildingData(data);
    onClose?.();
  }, [loadBuildingData, onClose]);

  const addRoom = (floor = 0) => {
    setConfig(prev => ({
      ...prev,
      rooms: [...prev.rooms, { type: ROOM_TYPES.BEDROOM, name: `Room ${prev.rooms.length + 1}`, floor }],
    }));
  };

  const removeRoom = (index) => {
    setConfig(prev => ({
      ...prev,
      rooms: prev.rooms.filter((_, i) => i !== index),
    }));
  };

  const updateRoom = (index, key, value) => {
    setConfig(prev => ({
      ...prev,
      rooms: prev.rooms.map((r, i) => i === index ? { ...r, [key]: value } : r),
    }));
  };

  const steps = [
    { title: 'Building Type', icon: Building2 },
    { title: 'Dimensions', icon: Ruler },
    { title: 'Floors & Rooms', icon: Layers },
    { title: 'Roof & Style', icon: Home },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1a1d23] rounded-2xl border border-white/10 w-full max-w-2xl mx-4 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create Building</h2>
              <p className="text-xs text-white/50">Step {step + 1} of {steps.length}: {steps[step].title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white/50" />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="flex px-6 pt-4 gap-2">
          {steps.map((s, i) => (
            <div key={i} className="flex-1">
              <div className={`h-1 rounded-full transition-all ${i <= step ? 'bg-emerald-500' : 'bg-white/10'}`} />
              <span className={`text-[9px] mt-1 block ${i <= step ? 'text-emerald-400' : 'text-white/30'}`}>{s.title}</span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-5 min-h-[340px]">
          {/* Step 0: Building Type */}
          {step === 0 && (
            <div>
              <label className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-3 block">Building Name</label>
              <input
                type="text" value={config.name}
                onChange={(e) => updateConfig('name', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none mb-4"
                placeholder="My Dream Home"
              />
              <label className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-3 block">Select Type</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(BUILDING_TYPE_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => updateConfig('type', key)}
                    className={`px-3 py-3 rounded-xl text-xs font-medium transition-all text-left ${
                      config.type === key
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 border'
                        : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Dimensions */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-2 block">Site Dimensions (meters)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-white/40 mb-1 block">Width</label>
                    <input type="number" value={config.siteWidth / 1000}
                      onChange={(e) => updateConfig('siteWidth', Number(e.target.value) * 1000)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 mb-1 block">Length</label>
                    <input type="number" value={config.siteLength / 1000}
                      onChange={(e) => updateConfig('siteLength', Number(e.target.value) * 1000)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-2 block">Building Dimensions (meters)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-white/40 mb-1 block">Width</label>
                    <input type="number" value={config.buildingWidth / 1000}
                      onChange={(e) => updateConfig('buildingWidth', Number(e.target.value) * 1000)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 mb-1 block">Length</label>
                    <input type="number" value={config.buildingLength / 1000}
                      onChange={(e) => updateConfig('buildingLength', Number(e.target.value) * 1000)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-white/40 mb-1 block">Wall Thickness (mm)</label>
                  <input type="number" value={config.wallThickness}
                    onChange={(e) => updateConfig('wallThickness', Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 mb-1 block">Floor Height (m)</label>
                  <input type="number" value={config.floorHeight / 1000} step={0.1}
                    onChange={(e) => updateConfig('floorHeight', Number(e.target.value) * 1000)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Floors & Rooms */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-2 block">Number of Floors</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => updateConfig('numFloors', n)}
                      className={`w-12 h-12 rounded-xl font-bold text-sm transition-all ${
                        config.numFloors === n
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/10'
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-white/60 font-semibold uppercase tracking-wider">Custom Rooms</label>
                  <button onClick={() => addRoom(0)}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Room
                  </button>
                </div>
                <p className="text-[10px] text-white/30 mb-2">Leave empty to use auto-generated rooms based on building type.</p>
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {config.rooms.map((room, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                      <select value={room.type}
                        onChange={(e) => updateRoom(i, 'type', e.target.value)}
                        className="flex-1 bg-transparent text-xs text-white outline-none">
                        {Object.entries(ROOM_TYPE_LABELS).map(([k, v]) => (
                          <option key={k} value={k} className="bg-[#1a1d23]">{v}</option>
                        ))}
                      </select>
                      <input type="text" value={room.name} placeholder="Name"
                        onChange={(e) => updateRoom(i, 'name', e.target.value)}
                        className="w-28 bg-white/5 rounded px-2 py-1 text-xs text-white outline-none"
                      />
                      <select value={room.floor}
                        onChange={(e) => updateRoom(i, 'floor', Number(e.target.value))}
                        className="w-16 bg-transparent text-xs text-white/60 outline-none">
                        {Array.from({ length: config.numFloors }, (_, fi) => (
                          <option key={fi} value={fi} className="bg-[#1a1d23]">F{fi}</option>
                        ))}
                      </select>
                      <button onClick={() => removeRoom(i)} className="p-1 text-white/30 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Roof & Style */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-3 block">Roof Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(ROOF_TYPES).map(([key, value]) => (
                    <button key={key} onClick={() => updateConfig('roofType', value)}
                      className={`px-3 py-3 rounded-xl text-xs font-medium transition-all ${
                        config.roofType === value
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 border'
                          : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                      }`}>
                      {key.charAt(0) + key.slice(1).toLowerCase()} Roof
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h4 className="text-xs font-semibold text-white mb-2">Summary</h4>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className="text-white/50">Building:</div><div className="text-white">{config.name}</div>
                  <div className="text-white/50">Type:</div><div className="text-white">{BUILDING_TYPE_LABELS[config.type]}</div>
                  <div className="text-white/50">Site:</div><div className="text-white">{config.siteWidth / 1000}m × {config.siteLength / 1000}m</div>
                  <div className="text-white/50">Building:</div><div className="text-white">{config.buildingWidth / 1000}m × {config.buildingLength / 1000}m</div>
                  <div className="text-white/50">Floors:</div><div className="text-white">{config.numFloors}</div>
                  <div className="text-white/50">Floor Height:</div><div className="text-white">{config.floorHeight / 1000}m</div>
                  <div className="text-white/50">Roof:</div><div className="text-white">{config.roofType}</div>
                  <div className="text-white/50">Rooms:</div><div className="text-white">{config.rooms.length || 'Auto-generated'}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
          <div>
            {step === 0 && (
              <div className="flex gap-2">
                {BUILDING_TEMPLATES.slice(0, 3).map(t => (
                  <button key={t.id} onClick={() => handleTemplate(t)}
                    className="text-[10px] text-white/40 hover:text-emerald-400 transition-colors flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 transition-colors flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(step + 1)}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1">
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleGenerate}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1">
                <Check className="w-4 h-4" /> Generate Building
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
