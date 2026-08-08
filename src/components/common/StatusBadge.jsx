const STATUS_STYLES = {
  // Project statuses
  planning: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
  active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
  completed: 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400 border border-violet-200 dark:border-violet-800',
  delayed: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800',
  on_hold: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
  // Task statuses
  pending: 'bg-slate-50 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400 border border-slate-200 dark:border-slate-800',
  in_progress: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800',
  // Approval statuses
  approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
  rejected: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800',
  // Availability
  available: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
  assigned: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
  on_leave: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
  // Stage statuses
  not_started: 'bg-slate-50 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400 border border-slate-200 dark:border-slate-800',
  // Generic
  read: 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400',
  unread: 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 border border-primary-200 dark:border-primary-800',
};

const formatLabel = (status) => status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown';

export default function StatusBadge({ status, label, className = '' }) {
  const style = STATUS_STYLES[status] || 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium whitespace-nowrap ${style} ${className}`}>
      {label || formatLabel(status)}
    </span>
  );
}
