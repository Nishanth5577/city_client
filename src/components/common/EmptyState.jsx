import { FolderOpen } from 'lucide-react';

export default function EmptyState({ icon: Icon = FolderOpen, title = 'No data found', description = '', action, actionLabel = 'Get Started' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-surface-300 dark:text-surface-600" />
      </div>
      <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-2">{title}</h3>
      {description && <p className="text-sm text-surface-400 max-w-sm mb-6">{description}</p>}
      {action && (
        <button onClick={action} className="btn-primary text-sm">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
