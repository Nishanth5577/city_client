import { useEffect, useState } from 'react';
import api from '../../services/api';
import { formatCurrency, formatDate, getProgressColor } from '../../utils/helpers';
import { FolderKanban, ListChecks, Clock, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/dashboard/manager').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="glass-card p-6 h-32 animate-pulse" />)}</div>;

  const taskStats = {};
  (data?.taskStats || []).forEach(t => { taskStats[t._id] = t.count; });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Manager Dashboard</h1>
        <p className="text-surface-500 mt-1">Overview of your assigned projects and tasks</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5"><div className="flex items-center gap-3 mb-2"><FolderKanban className="w-5 h-5 text-blue-500" /><span className="text-sm text-surface-500">My Projects</span></div><p className="text-2xl font-bold text-surface-900 dark:text-white">{data?.projects?.length || 0}</p></div>
        <div className="glass-card p-5"><div className="flex items-center gap-3 mb-2"><ListChecks className="w-5 h-5 text-emerald-500" /><span className="text-sm text-surface-500">Completed Tasks</span></div><p className="text-2xl font-bold text-surface-900 dark:text-white">{taskStats.completed || 0}</p></div>
        <div className="glass-card p-5"><div className="flex items-center gap-3 mb-2"><Clock className="w-5 h-5 text-amber-500" /><span className="text-sm text-surface-500">In Progress</span></div><p className="text-2xl font-bold text-surface-900 dark:text-white">{taskStats.in_progress || 0}</p></div>
        <div className="glass-card p-5"><div className="flex items-center gap-3 mb-2"><AlertTriangle className="w-5 h-5 text-red-500" /><span className="text-sm text-surface-500">Pending Tasks</span></div><p className="text-2xl font-bold text-surface-900 dark:text-white">{taskStats.pending || 0}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects */}
        <div className="glass-card p-6">
          <h3 className="section-title mb-4">My Projects</h3>
          <div className="space-y-3">
            {(data?.projects || []).map(project => (
              <div key={project._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/50 cursor-pointer transition-colors" onClick={() => navigate(`/projects/${project._id}`)}>
                <div className="flex-1">
                  <p className="font-medium text-surface-900 dark:text-white">{project.project_name}</p>
                  <p className="text-sm text-surface-500">{formatCurrency(project.budget)} • Due {formatDate(project.expected_end_date)}</p>
                </div>
                <div className="w-24">
                  <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(project.progress_percentage)}`} style={{ width: `${project.progress_percentage}%` }} />
                  </div>
                  <p className="text-xs text-surface-500 text-right mt-1">{project.progress_percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="glass-card p-6">
          <h3 className="section-title mb-4">Upcoming Deadlines</h3>
          <div className="space-y-3">
            {(data?.upcomingDeadlines || []).map(task => (
              <div key={task._id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
                <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{task.task_name}</p>
                  <p className="text-xs text-surface-500">Due: {formatDate(task.end_date)} • {task.assigned_worker?.name || 'Unassigned'}</p>
                </div>
              </div>
            ))}
            {(!data?.upcomingDeadlines || data.upcomingDeadlines.length === 0) && <p className="text-center text-surface-400 py-4">No upcoming deadlines</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
