// ═══════════════════════════════════════════════════════════════
// Design Validator — Real-time architectural rule checks
// Checks: room dimensions, door clearances, stair regulations,
// window areas, ventilation, structural requirements
// ═══════════════════════════════════════════════════════════════
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  ShieldCheck, AlertTriangle, XCircle, CheckCircle,
  ChevronDown, ChevronRight, Info,
} from 'lucide-react';

// ─── Rule Engine ───────────────────────────────────────────────
function validateDesign(elements) {
  const issues = [];
  const { walls = [], doors = [], windows = [], rooms = [], stairs = [], columns = [] } = elements;

  // 1. Wall validation
  walls.forEach((wall, i) => {
    if (!wall?.start_point || !wall?.end_point) return;
    const dx = wall.end_point.x - wall.start_point.x;
    const dy = wall.end_point.y - wall.start_point.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length < 300) {
      issues.push({
        level: 'error',
        category: 'Walls',
        message: `Wall ${i + 1} is too short (${Math.round(length)}mm). Minimum 300mm.`,
        elementId: wall._id || wall.canvas_id,
      });
    }

    if ((wall.thickness || 230) < 100) {
      issues.push({
        level: 'warning',
        category: 'Walls',
        message: `Wall ${i + 1} thickness (${wall.thickness}mm) is below minimum 100mm.`,
        elementId: wall._id || wall.canvas_id,
      });
    }

    if ((wall.height || 3000) < 2700) {
      issues.push({
        level: 'warning',
        category: 'Walls',
        message: `Wall ${i + 1} height (${wall.height}mm) is below recommended 2700mm.`,
        elementId: wall._id || wall.canvas_id,
      });
    }
  });

  // 2. Door validation
  doors.forEach((door, i) => {
    if ((door.width || 900) < 750) {
      issues.push({
        level: 'error',
        category: 'Doors',
        message: `Door ${i + 1} width (${door.width}mm) is below minimum 750mm for accessibility.`,
        elementId: door._id || door.canvas_id,
      });
    }
    if ((door.height || 2100) < 2000) {
      issues.push({
        level: 'warning',
        category: 'Doors',
        message: `Door ${i + 1} height (${door.height}mm) is below standard 2100mm.`,
        elementId: door._id || door.canvas_id,
      });
    }
  });

  // 3. Window validation (ventilation check)
  const totalFloorArea = rooms.reduce((sum, r) => {
    if (!r.boundary || r.boundary.length < 3) return sum;
    let area = 0;
    for (let i = 0; i < r.boundary.length; i++) {
      const j = (i + 1) % r.boundary.length;
      area += r.boundary[i].x * r.boundary[j].y;
      area -= r.boundary[j].x * r.boundary[i].y;
    }
    return sum + Math.abs(area) / 2;
  }, 0);

  const totalWindowArea = windows.reduce((sum, w) => sum + (w.width || 1200) * (w.height || 1200), 0);

  if (totalFloorArea > 0 && totalWindowArea / totalFloorArea < 0.1) {
    issues.push({
      level: 'warning',
      category: 'Ventilation',
      message: `Window area is less than 10% of floor area. Natural ventilation may be insufficient.`,
    });
  }

  // 4. Stair validation (IRC 2016 compliance)
  stairs.forEach((stair, i) => {
    const riserH = stair.riser_height || 167;
    const treadD = stair.tread_depth || 270;

    if (riserH > 190) {
      issues.push({
        level: 'error',
        category: 'Stairs',
        message: `Stair ${i + 1} riser height (${riserH}mm) exceeds max 190mm (IRC).`,
        elementId: stair._id || stair.canvas_id,
      });
    }
    if (treadD < 250) {
      issues.push({
        level: 'error',
        category: 'Stairs',
        message: `Stair ${i + 1} tread depth (${treadD}mm) is below minimum 250mm (IRC).`,
        elementId: stair._id || stair.canvas_id,
      });
    }
    if ((stair.width || 1200) < 900) {
      issues.push({
        level: 'error',
        category: 'Stairs',
        message: `Stair ${i + 1} width (${stair.width}mm) is below minimum 900mm.`,
        elementId: stair._id || stair.canvas_id,
      });
    }
    // 2R + T formula (should be 600-650mm)
    const formula = 2 * riserH + treadD;
    if (formula < 580 || formula > 660) {
      issues.push({
        level: 'warning',
        category: 'Stairs',
        message: `Stair ${i + 1}: 2R+T = ${formula}mm (recommended 600-650mm).`,
        elementId: stair._id || stair.canvas_id,
      });
    }
  });

  // 5. Room area checks
  rooms.forEach((room, i) => {
    if (!room.boundary || room.boundary.length < 3) return;
    let area = 0;
    for (let j = 0; j < room.boundary.length; j++) {
      const k = (j + 1) % room.boundary.length;
      area += room.boundary[j].x * room.boundary[k].y;
      area -= room.boundary[k].x * room.boundary[j].y;
    }
    const areaSqm = Math.abs(area) / 2e6;
    const name = room.name || `Room ${i + 1}`;

    if (areaSqm < 6) {
      issues.push({
        level: 'warning',
        category: 'Rooms',
        message: `${name} area (${areaSqm.toFixed(1)} sqm) is below habitable minimum 6 sqm.`,
        elementId: room._id || room.canvas_id,
      });
    }
  });

  // 6. Structural checks
  if (walls.length > 0 && columns.length === 0) {
    // Check if any wall spans more than 5m without column support
    walls.forEach((wall, i) => {
      if (!wall?.start_point || !wall?.end_point) return;
      const dx = wall.end_point.x - wall.start_point.x;
      const dy = wall.end_point.y - wall.start_point.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length > 5000) {
        issues.push({
          level: 'info',
          category: 'Structural',
          message: `Wall ${i + 1} spans ${(length / 1000).toFixed(1)}m without column support. Consider adding columns.`,
          elementId: wall._id || wall.canvas_id,
        });
      }
    });
  }

  // 7. No entry door check
  if (walls.length > 0 && doors.length === 0) {
    issues.push({
      level: 'error',
      category: 'Access',
      message: 'No doors in design. At least one entry door is required.',
    });
  }

  // 8. No windows check
  if (walls.length > 2 && windows.length === 0) {
    issues.push({
      level: 'warning',
      category: 'Ventilation',
      message: 'No windows in design. Natural ventilation and light are required.',
    });
  }

  // Summary
  const errors = issues.filter(i => i.level === 'error').length;
  const warnings = issues.filter(i => i.level === 'warning').length;
  const infos = issues.filter(i => i.level === 'info').length;

  return { issues, summary: { errors, warnings, infos, total: issues.length } };
}

// ─── Issue Row ─────────────────────────────────────────────────
function IssueRow({ issue, onSelect }) {
  const icons = {
    error: <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />,
    warning: <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />,
    info: <Info className="w-3 h-3 text-blue-400 flex-shrink-0" />,
  };
  const bgClasses = {
    error: 'hover:bg-red-500/10 border-l-2 border-red-500/50',
    warning: 'hover:bg-amber-500/10 border-l-2 border-amber-500/50',
    info: 'hover:bg-blue-500/10 border-l-2 border-blue-500/30',
  };

  return (
    <button
      onClick={() => issue.elementId && onSelect?.(issue.elementId)}
      className={`w-full flex items-start gap-1.5 px-2 py-1.5 text-left transition-colors rounded-r-md ${bgClasses[issue.level]}`}
    >
      {icons[issue.level]}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-surface-300 leading-tight">{issue.message}</div>
        <div className="text-[8px] text-surface-500 mt-0.5">{issue.category}</div>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// DESIGN VALIDATOR PANEL
// ═══════════════════════════════════════════════════════════════
export default function DesignValidator() {
  const { elements } = useSelector(s => s.bim);
  const [expanded, setExpanded] = useState(true);

  const { issues, summary } = useMemo(() => validateDesign(elements), [elements]);

  const scoreColor = summary.errors > 0 ? 'text-red-400' : summary.warnings > 0 ? 'text-amber-400' : 'text-green-400';
  const scoreIcon = summary.errors > 0 ? XCircle : summary.warnings > 0 ? AlertTriangle : CheckCircle;
  const ScoreIcon = scoreIcon;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-800/50">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-surface-300 hover:text-white transition-colors"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <ShieldCheck className="w-3.5 h-3.5 text-primary-400" />
          Design Check
        </button>
        <div className={`flex items-center gap-1 text-[10px] ${scoreColor}`}>
          <ScoreIcon className="w-3 h-3" />
          {summary.total === 0 ? 'All Clear' : `${summary.total} issue${summary.total > 1 ? 's' : ''}`}
        </div>
      </div>

      {expanded && (
        <>
          {/* Summary badges */}
          {summary.total > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-surface-800/30">
              {summary.errors > 0 && (
                <span className="flex items-center gap-1 text-[9px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full">
                  <XCircle className="w-2.5 h-2.5" /> {summary.errors}
                </span>
              )}
              {summary.warnings > 0 && (
                <span className="flex items-center gap-1 text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                  <AlertTriangle className="w-2.5 h-2.5" /> {summary.warnings}
                </span>
              )}
              {summary.infos > 0 && (
                <span className="flex items-center gap-1 text-[9px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                  <Info className="w-2.5 h-2.5" /> {summary.infos}
                </span>
              )}
            </div>
          )}

          {/* Issues list */}
          <div className="max-h-48 overflow-y-auto px-1 py-1 space-y-0.5">
            {issues.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-4 text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-[10px]">Design passes all checks!</span>
              </div>
            ) : (
              issues.map((issue, i) => (
                <IssueRow key={i} issue={issue} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
