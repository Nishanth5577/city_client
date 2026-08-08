import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formatDate, getProgressColor } from '../../utils/helpers';
import { Hammer, CheckCircle2, Clock, TrendingUp, MessageSquare } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function WorkerDashboard() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: d } = await api.get('/api/dashboard/worker');
        setData(d);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      }
      setLoading(false);
    };
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;

  const pendingTasks = data?.pendingTasks || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Welcome, {user?.name?.split(' ')[0]} 🏗️</h1>
        <p className="text-surface-500 mt-1">Your tasks and daily schedule</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Hammer className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-sm text-surface-500">Pending</span>
          </div>
          <p className="text-2xl font-bold text-surface-900 dark:text-white">{pendingTasks.length}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-sm text-surface-500">Completed</span>
          </div>
          <p className="text-2xl font-bold text-surface-900 dark:text-white">{data?.completedTasks || 0}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-sm text-surface-500">Total Tasks</span>
          </div>
          <p className="text-2xl font-bold text-surface-900 dark:text-white">{data?.totalTasks || 0}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-violet-500" />
            </div>
            <span className="text-sm text-surface-500">Productivity</span>
          </div>
          <p className="text-2xl font-bold text-surface-900 dark:text-white">{data?.productivity || 0}%</p>
        </div>
      </div>

      {/* Today's Tasks */}
      <div className="glass-card p-6">
        <h3 className="section-title mb-4">My Pending Tasks</h3>
        <div className="space-y-3">
          {pendingTasks.map((task) => (
            <div key={task._id} className="flex items-center gap-4 p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                task.priority === 'high' || task.priority === 'urgent' ? 'bg-red-500' :
                task.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-surface-900 dark:text-white">{task.task_name}</p>
                <p className="text-sm text-surface-500 mt-0.5">
                  {task.project_id?.project_name || 'Project'} • Due: {formatDate(task.end_date)}
                </p>
              </div>
              <div className="hidden sm:block w-24">
                <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(task.completion_percentage || 0)}`} style={{ width: `${task.completion_percentage || 0}%` }} />
                </div>
                <p className="text-xs text-surface-400 text-right mt-1">{task.completion_percentage || 0}%</p>
              </div>
              <span className={`text-xs font-medium capitalize px-2 py-1 rounded-lg ${
                task.priority === 'high' || task.priority === 'urgent'
                  ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                  : task.priority === 'medium'
                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                  : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
              }`}>
                {task.priority || 'normal'}
              </span>
            </div>
          ))}
          {pendingTasks.length === 0 && (
            <p className="text-center text-surface-400 py-8">🎉 No pending tasks! Great job!</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => navigate('/tasks')} className="glass-card-hover p-5 text-left">
          <Hammer className="w-6 h-6 text-primary-600 mb-2" />
          <p className="font-medium text-surface-900 dark:text-white">All Tasks</p>
          <p className="text-sm text-surface-500 mt-0.5">View and update tasks</p>
        </button>
        <button onClick={() => navigate('/chat')} className="glass-card-hover p-5 text-left">
          <MessageSquare className="w-6 h-6 text-primary-600 mb-2" />
          <p className="font-medium text-surface-900 dark:text-white">Chat</p>
          <p className="text-sm text-surface-500 mt-0.5">Message your team</p>
        </button>
      </div>
    </div>
  );
}
