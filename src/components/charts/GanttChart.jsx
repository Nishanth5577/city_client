import { useMemo } from 'react';
import { formatDate } from '../../utils/helpers';

const BAR_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
];

const statusColors = {
  completed: '#10b981',
  in_progress: '#06b6d4',
  pending: '#94a3b8',
};

export default function GanttChart({ tasks = [], title = 'Project Timeline' }) {
  const { sorted, minDate, maxDate, totalDays } = useMemo(() => {
    if (!tasks.length) return { sorted: [], minDate: new Date(), maxDate: new Date(), totalDays: 1 };

    const sorted = [...tasks]
      .filter(t => t.start_date && t.end_date)
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    const dates = sorted.flatMap(t => [new Date(t.start_date), new Date(t.end_date)]);
    const min = new Date(Math.min(...dates));
    const max = new Date(Math.max(...dates));
    const totalDays = Math.max(1, Math.ceil((max - min) / (1000 * 60 * 60 * 24)));

    return { sorted, minDate: min, maxDate: max, totalDays };
  }, [tasks]);

  const getBarStyle = (task, index) => {
    const start = new Date(task.start_date);
    const end = new Date(task.end_date);
    const leftPercent = ((start - minDate) / (1000 * 60 * 60 * 24) / totalDays) * 100;
    const widthPercent = Math.max(2, ((end - start) / (1000 * 60 * 60 * 24) / totalDays) * 100);
    const bgColor = statusColors[task.status] || BAR_COLORS[index % BAR_COLORS.length];

    return { left: `${leftPercent}%`, width: `${widthPercent}%`, backgroundColor: bgColor };
  };

  // Generate month markers
  const months = useMemo(() => {
    const result = [];
    const d = new Date(minDate);
    d.setDate(1);
    while (d <= maxDate) {
      const leftPercent = Math.max(0, ((d - minDate) / (1000 * 60 * 60 * 24) / totalDays) * 100);
      result.push({ label: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), left: leftPercent });
      d.setMonth(d.getMonth() + 1);
    }
    return result;
  }, [minDate, maxDate, totalDays]);

  return (
    <div className="glass-card p-5">
      <h3 className="section-title mb-4">{title}</h3>
      {sorted.length > 0 ? (
        <div className="overflow-x-auto">
          {/* Month headers */}
          <div className="relative h-6 mb-2 min-w-[600px]">
            {months.map((m, i) => (
              <span key={i} className="absolute text-[10px] text-surface-400 font-medium" style={{ left: `${m.left}%` }}>
                {m.label}
              </span>
            ))}
          </div>

          {/* Task bars */}
          <div className="space-y-2 min-w-[600px]">
            {sorted.map((task, i) => (
              <div key={task._id || i} className="flex items-center gap-3">
                <div className="w-36 flex-shrink-0 truncate text-xs text-surface-700 dark:text-surface-300 font-medium">
                  {task.task_name}
                </div>
                <div className="flex-1 relative h-7 bg-surface-100 dark:bg-surface-800 rounded-lg overflow-hidden">
                  <div
                    className="absolute h-full rounded-lg flex items-center justify-center transition-all duration-300"
                    style={getBarStyle(task, i)}
                    title={`${task.task_name}: ${formatDate(task.start_date)} - ${formatDate(task.end_date)}`}
                  >
                    <span className="text-[10px] text-white font-medium truncate px-1.5">
                      {task.completion_percentage || 0}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-surface-200 dark:border-surface-700">
            {Object.entries(statusColors).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                <span className="text-xs text-surface-500 capitalize">{status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-center text-surface-400 py-12 text-sm">No tasks with dates to display</p>
      )}
    </div>
  );
}
