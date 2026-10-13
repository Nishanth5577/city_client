import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formatDate, getProgressColor } from '../../utils/helpers';
import { Hammer, CheckCircle2, Clock, TrendingUp, MessageSquare, AlertTriangle } from 'lucide-react';
import StatsCard from '../../components/dashboard/StatsCard';

export default function WorkerDashboard() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: d } = await api.get('/api/dashboard/worker');
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

  const pendingTasks = data?.pendingTasks || [];
  const firstName = user?.name?.split(' ')[0] || 'Worker';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--t1)' }}>
          Welcome, {firstName} 🏗️
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>Your tasks and daily schedule</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard label="Pending" value={pendingTasks.length} icon={Hammer} color="#0D9488" delay={0} />
        <StatsCard label="Completed" value={data?.completedTasks || 0} icon={CheckCircle2} color="#059669" delay={80} />
        <StatsCard label="Total Tasks" value={data?.totalTasks || 0} icon={Clock} color="#D97706" delay={160} />
        <StatsCard label="Productivity" value={`${data?.productivity || 0}%`} icon={TrendingUp} color="#7C3AED" delay={240} />
      </div>

      {/* Pending Tasks */}
      <div className="cinematic-card p-6">
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--t4)', letterSpacing: '0.15em' }}>My Pending Tasks</h3>
        <div className="space-y-2">
          {pendingTasks.map((task) => (
            <div key={task._id} className="flex items-center gap-4 p-3 rounded-xl transition-all duration-200"
              style={{ border: '1px solid var(--border-subtle)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                task.priority === 'high' || task.priority === 'urgent' ? 'bg-red-500' :
                task.priority === 'medium' ? 'bg-amber-500' : 'bg-teal-500'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" style={{ color: 'var(--t1)' }}>{task.task_name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--t3)' }}>
                  {task.project_id?.project_name || 'Project'} • Due: {formatDate(task.end_date)}
                </p>
              </div>
              <div className="hidden sm:block w-20 flex-shrink-0">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(task.completion_percentage || 0)}`} style={{ width: `${task.completion_percentage || 0}%` }} />
                </div>
                <p className="text-xs text-right mt-1" style={{ color: 'var(--t3)' }}>{task.completion_percentage || 0}%</p>
              </div>
              <span className="text-xs font-medium capitalize px-2 py-0.5 rounded-lg flex-shrink-0" style={{
                background: task.priority === 'high' || task.priority === 'urgent' ? '#FEF2F2' : task.priority === 'medium' ? '#FFFBEB' : '#F0FDFA',
                color: task.priority === 'high' || task.priority === 'urgent' ? '#DC2626' : task.priority === 'medium' ? '#D97706' : '#0D9488',
              }}>
                {task.priority || 'normal'}
              </span>
            </div>
          ))}
          {pendingTasks.length === 0 && (
            <div className="flex flex-col items-center py-10">
              <CheckCircle2 className="w-10 h-10 mb-3" style={{ color: '#059669' }} />
              <p className="text-sm" style={{ color: 'var(--t4)' }}>🎉 No pending tasks! Great job!</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => navigate('/tasks')} className="cinematic-card p-5 text-left transition-all duration-200"
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(13, 148, 136, 0.3)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <Hammer className="w-6 h-6 mb-2" style={{ color: 'var(--accent)' }} />
          <p className="font-medium text-sm" style={{ color: 'var(--t1)' }}>All Tasks</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--t3)' }}>View and update tasks</p>
        </button>
        <button onClick={() => navigate('/chat')} className="cinematic-card p-5 text-left transition-all duration-200"
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(212, 136, 42, 0.3)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <MessageSquare className="w-6 h-6 mb-2" style={{ color: 'var(--accent)' }} />
          <p className="font-medium text-sm" style={{ color: 'var(--t1)' }}>Chat</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--t3)' }}>Message your team</p>
        </button>
      </div>
    </div>
  );
}
