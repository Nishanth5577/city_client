import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formatDate, getProgressColor } from '../../utils/helpers';
import { ClipboardList, CheckCircle2, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import StatsCard from '../../components/dashboard/StatsCard';

export default function EngineerDashboard() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: d } = await api.get('/api/dashboard/engineer');
      setData(d);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load dashboard data');
    }
    setLoading(false);
  };

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton rounded-2xl" style={{ height: '60px' }} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton rounded-2xl" style={{ height: '130px' }} />)}
      </div>
      <div className="skeleton rounded-2xl" style={{ height: '350px' }} />
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

  const tasks = data?.tasks || [];
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const overdueTasks = tasks.filter(t => t.status !== 'completed' && new Date(t.end_date) < new Date());
  const firstName = user?.name?.split(' ')[0] || 'Engineer';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--t1)' }}>
          Welcome, {firstName} 🔧
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>Your assigned tasks and project updates</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard label="Total Tasks" value={tasks.length} icon={ClipboardList} color="#0D9488" delay={0} />
        <StatsCard label="In Progress" value={inProgressTasks.length} icon={Clock} color="#0891B2" delay={80} />
        <StatsCard label="Completed" value={completedTasks.length} icon={CheckCircle2} color="#059669" delay={160} />
        <StatsCard label="Overdue" value={overdueTasks.length} icon={AlertTriangle} color="#DC2626" delay={240} />
      </div>

      {/* Task List */}
      <div className="cinematic-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--t4)', letterSpacing: '0.15em' }}>My Tasks</h3>
          <button onClick={() => navigate('/tasks')} className="flex items-center gap-1 text-xs font-medium transition-colors" style={{ color: 'var(--accent)' }}>
            View All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="space-y-2">
          {tasks.slice(0, 10).map((task) => (
            <div key={task._id} className="flex items-center gap-4 p-3 rounded-xl transition-all duration-200"
              style={{ border: '1px solid var(--border-subtle)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                task.status === 'completed' ? 'bg-emerald-500' :
                task.status === 'in_progress' ? 'bg-cyan-500' :
                new Date(task.end_date) < new Date() ? 'bg-red-500' : 'bg-slate-500'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" style={{ color: 'var(--t1)' }}>{task.task_name}</p>
                <p className="text-xs" style={{ color: 'var(--t3)' }}>{task.project_id?.project_name || 'Unassigned'}</p>
              </div>
              <div className="text-right hidden sm:block flex-shrink-0">
                <p className="text-xs" style={{ color: 'var(--t4)' }}>Due: {formatDate(task.end_date)}</p>
                <div className="w-16 h-1.5 rounded-full mt-1" style={{ background: 'var(--border)' }}>
                  <div className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(task.completion_percentage || 0)}`} style={{ width: `${task.completion_percentage || 0}%` }} />
                </div>
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-lg flex-shrink-0" style={{
                background: task.status === 'completed' ? '#ECFDF5' : task.status === 'in_progress' ? '#ECFEFF' : '#F5F5F0',
                color: task.status === 'completed' ? '#059669' : task.status === 'in_progress' ? '#0891B2' : '#57534E',
              }}>
                {task.status?.replace('_', ' ')}
              </span>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="flex flex-col items-center py-10">
              <ClipboardList className="w-10 h-10 mb-3" style={{ color: 'var(--t5)' }} />
              <p className="text-sm" style={{ color: 'var(--t4)' }}>No tasks assigned yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
