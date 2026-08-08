import TaskCard from './TaskCard';

const COLUMNS = [
  { id: 'pending', label: 'Pending', color: 'border-slate-400' },
  { id: 'in_progress', label: 'In Progress', color: 'border-cyan-500' },
  { id: 'completed', label: 'Completed', color: 'border-emerald-500' },
];

export default function TaskBoard({ tasks = [], onStatusChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter(t => t.status === col.id);
        return (
          <div key={col.id} className="space-y-3">
            <div className={`flex items-center gap-2 pb-2 border-b-2 ${col.color}`}>
              <h3 className="font-semibold text-surface-900 dark:text-white text-sm">{col.label}</h3>
              <span className="text-xs bg-surface-100 dark:bg-surface-800 text-surface-500 px-2 py-0.5 rounded-full">{columnTasks.length}</span>
            </div>
            <div className="space-y-3 min-h-[200px]">
              {columnTasks.map(task => (
                <TaskCard key={task._id} task={task} onStatusChange={onStatusChange} />
              ))}
              {columnTasks.length === 0 && (
                <p className="text-xs text-surface-400 text-center py-8">No tasks</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
