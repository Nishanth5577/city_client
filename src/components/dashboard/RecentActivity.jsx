import { Clock } from 'lucide-react';
import { formatRelative } from '../../utils/helpers';

export default function RecentActivity({ activities = [] }) {
  if (!activities.length) {
    return <p className="text-center text-surface-400 py-4">No recent activity</p>;
  }

  return (
    <div className="space-y-3">
      {activities.slice(0, 8).map((activity) => (
        <div key={activity._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-surface-700 dark:text-surface-300">
              <span className="font-medium">{activity.user_name || 'System'}</span> {activity.action}
            </p>
            <p className="text-xs text-surface-400">{activity.module} • {formatRelative(activity.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
