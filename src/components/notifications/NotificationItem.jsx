import { formatRelative } from '../../utils/helpers';
import { AlertTriangle, CheckCircle, Info, MessageSquare, DollarSign, ClipboardList } from 'lucide-react';

const typeConfig = {
  task_assigned: { icon: ClipboardList, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  task_completed: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  expense_submitted: { icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  expense_approved: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  expense_rejected: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  message_received: { icon: MessageSquare, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  project_update: { icon: Info, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
  alert: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
};

export default function NotificationItem({ notification, onMarkRead }) {
  const config = typeConfig[notification.type] || typeConfig.alert;
  const Icon = config.icon;
  const isUnread = notification.status === 'unread';

  return (
    <div
      onClick={() => isUnread && onMarkRead?.(notification._id)}
      className={`flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer ${
        isUnread
          ? 'bg-primary-50/50 dark:bg-primary-900/10 hover:bg-primary-50 dark:hover:bg-primary-900/20'
          : 'hover:bg-surface-50 dark:hover:bg-surface-800/50'
      }`}
    >
      <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${isUnread ? 'font-semibold text-surface-900 dark:text-white' : 'text-surface-700 dark:text-surface-300'}`}>
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{notification.message}</p>
        )}
        <p className="text-[10px] text-surface-400 mt-1">{formatRelative(notification.createdAt)}</p>
      </div>
      {isUnread && <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />}
    </div>
  );
}
