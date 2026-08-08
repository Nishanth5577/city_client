import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formatDate, getProgressColor } from '../../utils/helpers';
import { ClipboardList, CheckCircle2, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function EngineerDashboard() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: d } = await api.get('/api/dashboard/engineer');
        setData(d);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      }
      setLoading(false);
    };
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;

  const tasks = data?.tasks || [];
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const overdueTasks = tasks.filter(t => t.status !== 'completed' && new Date(t.end_date) < new Date());

  const statCards = [
    { label: 'Total Tasks', value: tasks.length, icon: ClipboardList, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', iconColor: '#3b82f6' },
    { label: 'In Progress', value: inProgressTasks.length, icon: Clock, color: 'from-cyan-500 to-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20', iconColor: '#06b6d4' },
    { label: 'Completed', value: completedTasks.length, icon: CheckCircle2, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: '#10b981' },
    { label: 'Overdue', value: overdueTasks.length, icon: AlertTriangle, color: 'from-red-500 to-red-600', bg: 'bg-red-50 dark:bg-red-900/20', iconColor: '#ef4444' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Welcome, {user?.name?.split(' ')[0]} 🔧</h1>
        <p className="text-surface-500 mt-1">Your assigned tasks and project updates</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="glass-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5" style={{ color: stat.iconColor }} />
              </div>
              <span className="text-sm text-surface-500">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-surface-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Active Tasks */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">My Tasks</h3>
          <button onClick={() => navigate('/tasks')} className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {tasks.slice(0, 10).map((task) => (
            <div key={task._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                task.status === 'completed' ? 'bg-emerald-500' :
                task.status === 'in_progress' ? 'bg-cyan-500' :
                new Date(task.end_date) < new Date() ? 'bg-red-500' : 'bg-slate-400'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-surface-900 dark:text-white truncate">{task.task_name}</p>
                <p className="text-sm text-surface-500">{task.project_id?.project_name || 'Unassigned'}</p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs text-surface-400">Due: {formatDate(task.end_date)}</p>
                <div className="w-20 h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full mt-1">
                  <div className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(task.completion_percentage || 0)}`} style={{ width: `${task.completion_percentage || 0}%` }} />
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${
                task.status === 'completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' :
                task.status === 'in_progress' ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400' :
                'bg-slate-50 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400'
              }`}>
                {task.status?.replace('_', ' ')}
              </span>
            </div>
          ))}
          {tasks.length === 0 && (
            <p className="text-center text-surface-400 py-8">No tasks assigned yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
