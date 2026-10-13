// ═══════════════════════════════════════════════════════════════
// Camera Toolbar — Camera presets, modes, and presentation
// ═══════════════════════════════════════════════════════════════
import { useState, useCallback } from 'react';
import {
  Eye, Camera, Move, RotateCcw, Video, Maximize2, Grid3X3,
  Sun, Moon, Cloud, Sunrise, Sunset, TreePine,
  Box, Square, PanelLeft, PanelRight, ArrowUp,
  Footprints, Orbit, SunDim, Sparkles, Scan, Compass,
} from 'lucide-react';
import { LIGHTING_PRESETS } from '../viewer/engine/EnvironmentSystem';

const CAMERA_VIEWS = [
  { id: 'perspective', label: 'Perspective', icon: Box, position: [15, 12, 15] },
  { id: 'top', label: 'Top', icon: ArrowUp, position: [0, 30, 0.01] },
  { id: 'front', label: 'Front', icon: Square, position: [0, 5, 30] },
  { id: 'back', label: 'Back', icon: Square, position: [0, 5, -30] },
  { id: 'left', label: 'Left', icon: PanelLeft, position: [-30, 5, 0] },
  { id: 'right', label: 'Right', icon: PanelRight, position: [30, 5, 0] },
  { id: 'isometric', label: 'Isometric', icon: Box, position: [20, 20, 20] },
];

const RENDER_MODES = [
  { id: 'realistic', label: 'Realistic', icon: Sparkles },
  { id: 'shaded', label: 'Shaded', icon: SunDim },
  { id: 'wireframe', label: 'Wireframe', icon: Grid3X3 },
  { id: 'xray', label: 'X-Ray', icon: Scan },
];

export default function CameraToolbar({
  cameraMode = 'orbit',
  renderMode = 'realistic',
  onCameraView,
  onCameraMode,
  onRenderMode,
  onWalkMode,
  timeOfDay = 14,
  onTimeChange,
  onLightingPreset,
}) {
  const [showLighting, setShowLighting] = useState(false);
  const [showViews, setShowViews] = useState(false);

  return (
    <div className="absolute top-16 right-3 z-20 flex flex-col gap-1.5">
      {/* Camera Views */}
      <div className="relative">
        <button
          onClick={() => { setShowViews(!showViews); setShowLighting(false); }}
          className="p-2 bg-surface-900/90 backdrop-blur-lg rounded-lg border border-surface-700/50 
            hover:bg-surface-800/90 hover:border-surface-600 transition-all shadow-xl group"
          title="Camera Views"
        >
          <Camera className="w-4 h-4 text-surface-300 group-hover:text-primary-400" />
        </button>

        {showViews && (
          <div className="absolute right-full mr-1.5 top-0 bg-surface-900/95 backdrop-blur-xl rounded-xl 
            border border-surface-700/50 shadow-2xl p-2 min-w-[140px]">
            <div className="text-[9px] font-semibold text-surface-500 px-2 pb-1 uppercase tracking-wider">Views</div>
            {CAMERA_VIEWS.map(view => (
              <button
                key={view.id}
                onClick={() => { onCameraView?.(view.id, view.position); setShowViews(false); }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] text-surface-300 
                  hover:bg-surface-800 hover:text-white transition-colors"
              >
                <view.icon className="w-3.5 h-3.5 text-surface-500" />
                {view.label}
              </button>
            ))}
            <div className="border-t border-surface-800 mt-1 pt-1">
              <button
                onClick={() => { onWalkMode?.(); setShowViews(false); }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] text-amber-400 
                  hover:bg-amber-500/10 transition-colors font-medium"
              >
                <Footprints className="w-3.5 h-3.5" />
                Walk Through
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Render Modes */}
      <div className="flex flex-col bg-surface-900/90 backdrop-blur-lg rounded-lg border border-surface-700/50 
        overflow-hidden shadow-xl">
        {RENDER_MODES.map(mode => (
          <button
            key={mode.id}
            onClick={() => onRenderMode?.(mode.id)}
            className={`p-2 transition-all ${
              renderMode === mode.id
                ? 'bg-primary-600/30 text-primary-400'
                : 'text-surface-400 hover:bg-surface-800 hover:text-surface-200'
            }`}
            title={mode.label}
          >
            <mode.icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Lighting */}
      <div className="relative">
        <button
          onClick={() => { setShowLighting(!showLighting); setShowViews(false); }}
          className="p-2 bg-surface-900/90 backdrop-blur-lg rounded-lg border border-surface-700/50 
            hover:bg-surface-800/90 hover:border-surface-600 transition-all shadow-xl group"
          title="Lighting"
        >
          <Sun className="w-4 h-4 text-surface-300 group-hover:text-amber-400" />
        </button>

        {showLighting && (
          <div className="absolute right-full mr-1.5 top-0 bg-surface-900/95 backdrop-blur-xl rounded-xl 
            border border-surface-700/50 shadow-2xl p-2 min-w-[160px]">
            <div className="text-[9px] font-semibold text-surface-500 px-2 pb-1 uppercase tracking-wider">Lighting</div>
            
            {/* Time slider */}
            <div className="px-2 py-1.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-surface-400">Time of Day</span>
                <span className="text-[10px] text-white font-mono">
                  {Math.floor(timeOfDay)}:{String(Math.round((timeOfDay % 1) * 60)).padStart(2, '0')}
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="21"
                step="0.5"
                value={timeOfDay}
                onChange={e => onTimeChange?.(parseFloat(e.target.value))}
                className="w-full h-1 bg-surface-700 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                  [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-amber-400 
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            {/* Presets */}
            <div className="border-t border-surface-800 mt-1 pt-1">
              {Object.entries(LIGHTING_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => { onLightingPreset?.(preset); setShowLighting(false); }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] text-surface-300 
                    hover:bg-surface-800 hover:text-white transition-colors"
                >
                  <span className="text-sm">{preset.icon}</span>
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fit view */}
      <button
        onClick={() => onCameraView?.('perspective', [15, 12, 15])}
        className="p-2 bg-surface-900/90 backdrop-blur-lg rounded-lg border border-surface-700/50 
          hover:bg-surface-800/90 hover:border-surface-600 transition-all shadow-xl group"
        title="Fit to View"
      >
        <Maximize2 className="w-4 h-4 text-surface-300 group-hover:text-primary-400" />
      </button>
    </div>
  );
}
