import { formatRelative } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus, Package, FolderEdit, Receipt,
  FileUp, CheckCircle2, Banknote, Clock, Activity
} from 'lucide-react';

const ACTIVITY_ICONS = {
  'worker': { icon: UserPlus, color: '#059669', bg: 'rgba(5,150,105,0.1)' },
  'material': { icon: Package, color: '#0D9488', bg: 'rgba(13,148,136,0.1)' },
  'project': { icon: FolderEdit, color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
  'expense': { icon: Receipt, color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
  'document': { icon: FileUp, color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
  'task': { icon: CheckCircle2, color: '#0891B2', bg: 'rgba(8,145,178,0.1)' },
  'payment': { icon: Banknote, color: '#059669', bg: 'rgba(5,150,105,0.1)' },
  'default': { icon: Activity, color: 'var(--t4)', bg: 'var(--glass-hover)' },
};

function getActivityIcon(module) {
  if (!module) return ACTIVITY_ICONS.default;
  const key = module.toLowerCase();
  if (key.includes('worker') || key.includes('user')) return ACTIVITY_ICONS.worker;
  if (key.includes('material') || key.includes('resource')) return ACTIVITY_ICONS.material;
  if (key.includes('project')) return ACTIVITY_ICONS.project;
  if (key.includes('expense')) return ACTIVITY_ICONS.expense;
  if (key.includes('document')) return ACTIVITY_ICONS.document;
  if (key.includes('task')) return ACTIVITY_ICONS.task;
  if (key.includes('payment') || key.includes('finance')) return ACTIVITY_ICONS.payment;
  return ACTIVITY_ICONS.default;
}

export default function RecentActivity({ activities = [] }) {
  const navigate = useNavigate();

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--t1)', letterSpacing: '-0.01em' }}>Recent activity</h3>
        <button
          className="text-xs font-medium transition-colors hover:text-teal-700"
          style={{ color: 'var(--accent)' }}
        >
          View all
        </button>
      </div>

      {/* Activity timeline */}
      <div className="space-y-0">
        {activities.slice(0, 6).map((activity, idx) => {
          const actIcon = getActivityIcon(activity.module);
          const IconComp = actIcon.icon;

          return (
            <div key={activity._id || idx} className="timeline-item">
              {/* Icon */}
              <div
                className="absolute left-0 w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  background: actIcon.bg,
                  border: `1px solid ${actIcon.color}20`,
                }}
              >
                <IconComp className="w-3 h-3" style={{ color: actIcon.color }} strokeWidth={1.5} />
              </div>

              {/* Content */}
              <div className="min-w-0">
                <p className="text-xs leading-relaxed" style={{ color: 'var(--t2)' }}>
                  <span className="font-medium" style={{ color: 'var(--t1)' }}>
                    {activity.user_name || activity.user_id?.name || 'System'}
                  </span>
                  {' '}
                  <span style={{ color: 'var(--t4)' }}>{activity.action}</span>
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono" style={{ color: 'var(--t5)', fontSize: '10px' }}>{activity.module}</span>
                  <span style={{ color: 'var(--t5)', fontSize: '10px' }}>·</span>
                  <span className="font-mono" style={{ color: 'var(--t5)', fontSize: '10px' }}>
                    {formatRelative(activity.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {activities.length === 0 && (
          <div className="text-center py-6">
            <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--t5)' }} strokeWidth={1.5} />
            <p className="text-xs" style={{ color: 'var(--t5)' }}>No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}
