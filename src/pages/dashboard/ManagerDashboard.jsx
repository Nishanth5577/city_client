import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { formatCurrency, formatDate, getProgressColor } from '../../utils/helpers';
import { FolderKanban, ListChecks, Clock, AlertTriangle, Users, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../../components/dashboard/StatsCard';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = () => {
    setLoading(true);
    setError(null);
    api.get('/api/dashboard/manager')
      .then(r => setData(r.data))
      .catch(err => setError(err.response?.data?.message || 'Unable to load dashboard data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton rounded-2xl" style={{ height: '80px' }} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton rounded-2xl" style={{ height: '130px' }} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="skeleton rounded-2xl" style={{ height: '300px' }} />
        <div className="skeleton rounded-2xl" style={{ height: '300px' }} />
      </div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="p-8 text-center max-w-md rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: '#DC2626' }} />
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--t1)' }}>Unable to load data</h3>
        <p className="text-sm mb-6" style={{ color: 'var(--t3)' }}>{error}</p>
        <button onClick={fetchDashboard} className="btn-primary">Retry</button>
      </div>
    </div>
  );

  const taskStats = {};
  (data?.taskStats || []).forEach(t => { taskStats[t._id] = t.count; });
  const firstName = user?.name?.split(' ')[0] || 'Manager';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--t1)' }}>
          Welcome back, {firstName} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>Overview of your assigned projects and tasks</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard label="My Projects" value={data?.projects?.length || 0} icon={FolderKanban} color="#0D9488" delay={0} />
        <StatsCard label="Completed Tasks" value={taskStats.completed || 0} icon={ListChecks} color="#059669" delay={80} />
        <StatsCard label="In Progress" value={taskStats.in_progress || 0} icon={Clock} color="#D97706" delay={160} />
        <StatsCard label="Workers Assigned" value={data?.workerCount || 0} icon={Users} color="#7C3AED" delay={240} />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects */}
        <div className="cinematic-card p-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--t4)', letterSpacing: '0.15em' }}>My Projects</h3>
          <div className="space-y-3">
            {(data?.projects || []).map(project => (
              <div key={project._id}
                className="flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-200"
                style={{ border: '1px solid var(--border-subtle)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                onClick={() => navigate(`/projects/${project._id}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: 'var(--t1)' }}>{project.project_name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--t3)' }}>{formatCurrency(project.budget)} • Due {formatDate(project.expected_end_date)}</p>
                </div>
                <div className="w-20 flex-shrink-0">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(project.progress_percentage)}`} style={{ width: `${project.progress_percentage}%` }} />
                  </div>
                  <p className="text-xs text-right mt-1" style={{ color: 'var(--t3)' }}>{project.progress_percentage}%</p>
                </div>
              </div>
            ))}
            {(!data?.projects || data.projects.length === 0) && (
              <div className="flex flex-col items-center py-8">
                <FolderKanban className="w-10 h-10 mb-3" style={{ color: 'var(--t5)' }} />
                <p className="text-sm" style={{ color: 'var(--t4)' }}>No projects assigned</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="cinematic-card p-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--t4)', letterSpacing: '0.15em' }}>Upcoming Deadlines</h3>
          <div className="space-y-3">
            {(data?.upcomingDeadlines || []).map(task => (
              <div key={task._id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#FFFBEB', border: '1px solid #FEF3C7' }}>
                <Clock className="w-4 h-4 flex-shrink-0" style={{ color: '#D97706' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--t1)' }}>{task.task_name}</p>
                  <p className="text-xs" style={{ color: 'var(--t3)' }}>Due: {formatDate(task.end_date)} • {task.assigned_worker?.name || 'Unassigned'}</p>
                </div>
              </div>
            ))}
            {(!data?.upcomingDeadlines || data.upcomingDeadlines.length === 0) && (
              <div className="flex flex-col items-center py-8">
                <Clock className="w-10 h-10 mb-3" style={{ color: 'var(--t5)' }} />
                <p className="text-sm" style={{ color: 'var(--t4)' }}>No upcoming deadlines</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
