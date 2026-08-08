import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Users, BarChart3 } from 'lucide-react';

const ACTIONS = [
  { label: 'New Project', icon: Plus, path: '/projects', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { label: 'View Reports', icon: FileText, path: '/reports', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { label: 'Manage Workers', icon: Users, path: '/workers', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  { label: 'Resources', icon: BarChart3, path: '/resources', color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-3">
      {ACTIONS.map((action) => (
        <button
          key={action.label}
          onClick={() => navigate(action.path)}
          className="glass-card-hover p-4 text-left flex items-center gap-3"
        >
          <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center flex-shrink-0`}>
            <action.icon className={`w-5 h-5 ${action.color}`} />
          </div>
          <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{action.label}</span>
        </button>
      ))}
    </div>
  );
}
