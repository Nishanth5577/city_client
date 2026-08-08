import { formatDate, getProgressColor } from '../../utils/helpers';

const priorityColors = {
  urgent: 'bg-red-500',
  high: 'bg-red-400',
  medium: 'bg-amber-500',
  low: 'bg-blue-400',
  normal: 'bg-slate-400',
};

export default function TaskCard({ task, onStatusChange }) {
  return (
    <div className="glass-card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority] || priorityColors.normal}`} />
          <span className="text-xs font-medium text-surface-400 capitalize">{task.priority || 'normal'}</span>
        </div>
        {onStatusChange && (
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task._id, e.target.value)}
            className="text-xs bg-transparent border border-surface-200 dark:border-surface-700 rounded-lg px-2 py-1 text-surface-600 dark:text-surface-400"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        )}
      </div>
      <h4 className="font-medium text-surface-900 dark:text-white text-sm mb-1">{task.task_name}</h4>
      {task.description && <p className="text-xs text-surface-500 line-clamp-2 mb-2">{task.description}</p>}
      <div className="h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden mb-2">
        <div className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(task.completion_percentage || 0)}`} style={{ width: `${task.completion_percentage || 0}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs text-surface-400">
        <span>{task.completion_percentage || 0}%</span>
        <span>{formatDate(task.end_date)}</span>
      </div>
    </div>
  );
}
