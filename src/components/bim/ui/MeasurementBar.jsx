import { formatMeasurement } from '../../../utils/geometryUtils';
import { Crosshair, Maximize2, Grid3X3, Save } from 'lucide-react';

export default function MeasurementBar({ cursorPos, zoom, floorName, totalArea }) {
  return (
    <div className="h-7 bg-surface-900 border-t border-surface-800 flex items-center px-3 gap-4 text-[11px] text-surface-500 flex-shrink-0">
      <div className="flex items-center gap-1.5">
        <Crosshair className="w-3 h-3" />
        <span className="font-mono">X: {formatMeasurement(cursorPos.x || 0)}</span>
        <span className="font-mono">Y: {formatMeasurement(cursorPos.y || 0)}</span>
      </div>

      <div className="w-px h-4 bg-surface-800" />

      <div className="flex items-center gap-1.5">
        <Grid3X3 className="w-3 h-3" />
        <span>Zoom: {Math.round(zoom * 100)}%</span>
      </div>

      <div className="w-px h-4 bg-surface-800" />

      {floorName && (
        <>
          <span className="text-primary-400 font-medium">{floorName}</span>
          <div className="w-px h-4 bg-surface-800" />
        </>
      )}

      {totalArea > 0 && (
        <div className="flex items-center gap-1.5">
          <Maximize2 className="w-3 h-3" />
          <span>Area: {totalArea.toFixed(1)} m² ({(totalArea * 10.764).toFixed(0)} sqft)</span>
        </div>
      )}

      <div className="flex-1" />
      <span className="text-surface-600">Scale: 1:100</span>
    </div>
  );
}
