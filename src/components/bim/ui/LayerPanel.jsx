import { useSelector, useDispatch } from 'react-redux';
import { toggleLayerVisibility, toggleLayerLock } from '../../../redux/slices/bimSlice';
import { Eye, EyeOff, Lock, Unlock } from 'lucide-react';

export default function LayerPanel() {
  const dispatch = useDispatch();
  const { layers } = useSelector(s => s.bim);

  return (
    <div className="flex-1 overflow-y-auto text-[11px]">
      {/* Header */}
      <div className="px-3 py-2 border-b border-surface-800/50 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">Layers</span>
        <span className="text-[9px] text-surface-600">{layers.filter(l => l.visible).length}/{layers.length} visible</span>
      </div>

      {/* Layers List */}
      <div className="py-1">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`flex items-center gap-2 px-3 py-1.5 hover:bg-surface-800/30 transition-colors ${
              !layer.visible ? 'opacity-50' : ''
            }`}
          >
            {/* Color Dot */}
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-surface-600/50"
              style={{ backgroundColor: layer.color }}
            />

            {/* Name */}
            <span className="flex-1 text-surface-300 font-medium truncate">{layer.name}</span>

            {/* Visibility */}
            <button
              onClick={() => dispatch(toggleLayerVisibility(layer.id))}
              className={`p-1 rounded transition-colors ${
                layer.visible
                  ? 'text-surface-400 hover:text-white hover:bg-surface-700'
                  : 'text-surface-600 hover:text-surface-400 hover:bg-surface-800'
              }`}
              title={layer.visible ? 'Hide layer' : 'Show layer'}
            >
              {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>

            {/* Lock */}
            <button
              onClick={() => dispatch(toggleLayerLock(layer.id))}
              className={`p-1 rounded transition-colors ${
                layer.locked
                  ? 'text-amber-500 hover:text-amber-400 hover:bg-surface-700'
                  : 'text-surface-600 hover:text-surface-400 hover:bg-surface-800'
              }`}
              title={layer.locked ? 'Unlock layer' : 'Lock layer'}
            >
              {layer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
