import { useEffect, useState } from 'react';
import { CalendarClock, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import api from '../../services/api';

function timeLeft(dateStr) {
  const diff = new Date(dateStr) - new Date();
  if (diff < 0) return { text: 'Overdue', color: '#DC2626' };
  const days = Math.ceil(diff / 86400000);
  if (days === 0) return { text: 'Today', color: '#D97706' };
  if (days === 1) return { text: 'Tomorrow', color: '#D97706' };
  if (days <= 7) return { text: `${days} days`, color: '#2563EB' };
  return { text: `${days} days`, color: 'var(--t3)' };
}

export default function UpcomingDeadlines() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    api.get('/api/tasks', { params: { limit: 50 } })
      .then(r => {
        const all = r.data.tasks || r.data || [];
        const upcoming = all
          .filter(t => t.due_date && t.status !== 'completed')
          .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
          .slice(0, 5);
        setTasks(upcoming);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="cinematic-card p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <CalendarClock className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--t3)' }}>
          Upcoming Deadlines
        </h3>
      </div>

      {tasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
          <CheckCircle2 className="w-8 h-8 mb-2" style={{ color: '#059669' }} />
          <p className="text-xs font-medium" style={{ color: 'var(--t2)' }}>All caught up!</p>
          <p className="text-[10px] mt-1" style={{ color: 'var(--t4)' }}>No pending deadlines</p>
        </div>
      ) : (
        <div className="flex-1 space-y-2.5">
          {tasks.map(task => {
            const tl = timeLeft(task.due_date);
            return (
              <div key={task._id} className="flex items-start gap-2.5 group">
                <div className="mt-0.5 flex-shrink-0">
                  {tl.text === 'Overdue' ? (
                    <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#DC2626' }} />
                  ) : (
                    <Clock className="w-3.5 h-3.5" style={{ color: tl.color }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--t1)' }}>
                    {task.title || task.task_name}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--t4)' }}>
                    {task.project?.project_name || ''}
                  </p>
                </div>
                <span className="text-[10px] font-semibold flex-shrink-0 px-1.5 py-0.5 rounded"
                  style={{ color: tl.color, background: tl.text === 'Overdue' ? 'rgba(220,38,38,0.1)' : 'transparent' }}>
                  {tl.text}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
