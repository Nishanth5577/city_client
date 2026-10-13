// ═══════════════════════════════════════════════════════════════
// DollhouseControls — Floating control panel for Dollhouse mode
// Roof, Floors, Cutaway, Section, Toggles
// ═══════════════════════════════════════════════════════════════
import { useState } from 'react';
import {
  Eye, EyeOff, Layers, ChevronDown, ChevronUp, RotateCcw,
  Glasses, Tag, Ruler, Armchair, Sun as ShadowIcon, X,
} from 'lucide-react';
import useBimStore from '../../../stores/bimStore';
import {
  ROOF_VISIBILITY, CUTAWAY_DIRECTIONS, FLOOR_DISPLAY,
} from '../../../stores/bimTypes';

export default function DollhouseControls() {
  const [collapsed, setCollapsed] = useState(false);

  const floors = useBimStore(s => s.floors);
  const roofVisibility = useBimStore(s => s.roofVisibility);
  const cutawayDirection = useBimStore(s => s.cutawayDirection);
  const cutawayAmount = useBimStore(s => s.cutawayAmount);
  const sectionPlanes = useBimStore(s => s.sectionPlanes);
  const floorDisplay = useBimStore(s => s.floorDisplay);
  const showRoomLabels = useBimStore(s => s.showRoomLabels);
  const showDimensions = useBimStore(s => s.showDimensions);
  const showFurniture = useBimStore(s => s.showFurniture);
  const showShadows = useBimStore(s => s.showShadows);
  const visibleFloorId = useBimStore(s => s.visibleFloorId);

  const setRoofVisibility = useBimStore(s => s.setRoofVisibility);
  const setCutaway = useBimStore(s => s.setCutaway);
  const setSectionPlane = useBimStore(s => s.setSectionPlane);
  const setFloorDisplay = useBimStore(s => s.setFloorDisplay);
  const setVisibleFloor = useBimStore(s => s.setVisibleFloor);
  const toggleRoomLabels = useBimStore(s => s.toggleRoomLabels);
  const toggleDimensions = useBimStore(s => s.toggleDimensions);
  const toggleFurniture = useBimStore(s => s.toggleFurniture);
  const toggleShadows = useBimStore(s => s.toggleShadows);
  const setCameraPresetTarget = useBimStore(s => s.setCameraPresetTarget);

  const resetView = () => {
    setRoofVisibility(ROOF_VISIBILITY.HIDE);
    setCutaway(CUTAWAY_DIRECTIONS.NONE, 0.5);
    setFloorDisplay(FLOOR_DISPLAY.ALL);
    setVisibleFloor(null);
    setSectionPlane('x', { enabled: false });
    setSectionPlane('y', { enabled: false });
    setSectionPlane('z', { enabled: false });
    setCameraPresetTarget({ position: [14, 16, 14], target: [0, 0, 0] });
  };

  const Btn = ({ active, onClick, children, className = '' }) => (
    <button onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
        active
          ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-500/40'
          : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 border border-transparent'
      } ${className}`}>
      {children}
    </button>
  );

  const Toggle = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-white/60">{label}</span>
      <button onClick={onChange}
        className={`w-8 h-4 rounded-full transition-all relative ${
          checked ? 'bg-emerald-500' : 'bg-white/15'
        }`}>
        <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${
          checked ? 'left-4.5' : 'left-0.5'
        }`} style={{ left: checked ? '17px' : '2px' }} />
      </button>
    </div>
  );

  return (
    <div className="absolute top-2 right-2 z-20 w-56">
      <div className="bg-[#1a1d24]/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl shadow-black/40 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
          <div className="flex items-center gap-1.5">
            <Glasses className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-semibold text-white/90">Dollhouse Controls</span>
          </div>
          <button onClick={() => setCollapsed(!collapsed)}
            className="p-0.5 text-white/40 hover:text-white/80">
            {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>

        {!collapsed && (
          <div className="p-2.5 space-y-3">
            {/* Roof */}
            <div>
              <div className="text-[9px] text-white/40 font-semibold uppercase tracking-wider mb-1.5">Roof</div>
              <div className="flex gap-1">
                <Btn active={roofVisibility === ROOF_VISIBILITY.SHOW}
                  onClick={() => setRoofVisibility(ROOF_VISIBILITY.SHOW)}>Show</Btn>
                <Btn active={roofVisibility === ROOF_VISIBILITY.HIDE}
                  onClick={() => setRoofVisibility(ROOF_VISIBILITY.HIDE)}>Hide</Btn>
                <Btn active={roofVisibility === ROOF_VISIBILITY.TRANSPARENT}
                  onClick={() => setRoofVisibility(ROOF_VISIBILITY.TRANSPARENT)}>Transparent</Btn>
              </div>
            </div>

            {/* Floors */}
            <div>
              <div className="text-[9px] text-white/40 font-semibold uppercase tracking-wider mb-1.5">Floors</div>
              <div className="flex gap-1 flex-wrap">
                <Btn active={floorDisplay === FLOOR_DISPLAY.ALL && !visibleFloorId}
                  onClick={() => { setFloorDisplay(FLOOR_DISPLAY.ALL); setVisibleFloor(null); }}>All</Btn>
                {floors.map(f => (
                  <Btn key={f.id}
                    active={visibleFloorId === f.id}
                    onClick={() => { setFloorDisplay(FLOOR_DISPLAY.SINGLE); setVisibleFloor(f.id); }}>
                    {f.name.replace('Floor', 'F').replace('Ground F', 'GF').replace('First F', '1F').replace('Second F', '2F')}
                  </Btn>
                ))}
                <Btn active={floorDisplay === FLOOR_DISPLAY.EXPLODED}
                  onClick={() => { setFloorDisplay(FLOOR_DISPLAY.EXPLODED); setVisibleFloor(null); }}
                  className="ml-auto">
                  <Layers className="w-3 h-3 inline mr-0.5" />Explode
                </Btn>
              </div>
            </div>

            {/* Cutaway */}
            <div>
              <div className="text-[9px] text-white/40 font-semibold uppercase tracking-wider mb-1.5">Cutaway</div>
              <div className="flex gap-1">
                {[
                  { d: CUTAWAY_DIRECTIONS.FRONT, l: 'Front' },
                  { d: CUTAWAY_DIRECTIONS.BACK, l: 'Back' },
                  { d: CUTAWAY_DIRECTIONS.LEFT, l: 'Left' },
                  { d: CUTAWAY_DIRECTIONS.RIGHT, l: 'Right' },
                ].map(({ d, l }) => (
                  <Btn key={d}
                    active={cutawayDirection === d}
                    onClick={() => setCutaway(cutawayDirection === d ? CUTAWAY_DIRECTIONS.NONE : d)}>
                    {l}
                  </Btn>
                ))}
              </div>
              {cutawayDirection !== CUTAWAY_DIRECTIONS.NONE && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[9px] text-white/40 w-5">0%</span>
                  <input type="range" min="0" max="1" step="0.01" value={cutawayAmount}
                    onChange={e => setCutaway(undefined, parseFloat(e.target.value))}
                    className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
                      [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-emerald-400
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer" />
                  <span className="text-[9px] text-white/40 w-8 text-right">{Math.round(cutawayAmount * 100)}%</span>
                </div>
              )}
            </div>

            {/* Section */}
            <div>
              <div className="text-[9px] text-white/40 font-semibold uppercase tracking-wider mb-1.5">Section</div>
              <div className="flex gap-1">
                {['x', 'y', 'z'].map(axis => (
                  <Btn key={axis}
                    active={sectionPlanes[axis].enabled}
                    onClick={() => setSectionPlane(axis, { enabled: !sectionPlanes[axis].enabled })}>
                    {axis.toUpperCase()}
                  </Btn>
                ))}
              </div>
              {Object.entries(sectionPlanes).filter(([, v]) => v.enabled).map(([axis, val]) => (
                <div key={axis} className="mt-1 flex items-center gap-2">
                  <span className="text-[9px] text-white/40 w-4 font-mono">{axis.toUpperCase()}</span>
                  <input type="range" min="0" max="1" step="0.01" value={val.position}
                    onChange={e => setSectionPlane(axis, { position: parseFloat(e.target.value) })}
                    className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
                      [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-red-400
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer" />
                </div>
              ))}
            </div>

            {/* Toggles */}
            <div className="space-y-1.5 pt-1 border-t border-white/5">
              <Toggle label="Room Labels" checked={showRoomLabels} onChange={toggleRoomLabels} />
              <Toggle label="Dimensions" checked={showDimensions} onChange={toggleDimensions} />
              <Toggle label="Furniture" checked={showFurniture} onChange={toggleFurniture} />
              <Toggle label="Shadows" checked={showShadows} onChange={toggleShadows} />
            </div>

            {/* Reset */}
            <button onClick={resetView}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg
                bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 text-[10px] font-medium
                border border-white/5 transition-all">
              <RotateCcw className="w-3 h-3" /> Reset View
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
