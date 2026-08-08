import { useEffect, useState } from 'react';
import api from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { GanttChart } from 'lucide-react';

export default function GanttPage() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/api/projects').then(r => { setProjects(r.data.projects || []); if (r.data.projects?.length) setSelectedProject(r.data.projects[0]._id); }).finally(() => setLoading(false)); }, []);

  useEffect(() => {
    if (selectedProject) {
      api.get(`/api/tasks/gantt/${selectedProject}`).then(r => setTasks(r.data)).catch(console.error);
    }
  }, [selectedProject]);

  const getBarWidth = (start, end) => {
    if (!start || !end) return 10;
    const days = Math.max(1, Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)));
    return Math.min(Math.max(days * 4, 40), 400);
  };

  const getBarColor = (status) => {
    if (status === 'completed') return 'bg-emerald-500';
    if (status === 'in_progress') return 'bg-blue-500';
    return 'bg-surface-300 dark:bg-surface-600';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Gantt Chart</h1><p className="text-surface-500 mt-1">Visual project timeline</p></div>
        <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="select-field w-auto">
          {projects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}
        </select>
      </div>

      <div className="glass-card p-6 overflow-x-auto">
        {tasks.length > 0 ? (
          <div className="min-w-[600px] space-y-2">
            {tasks.map(task => (
              <div key={task._id} className="flex items-center gap-4">
                <div className="w-48 flex-shrink-0 text-sm font-medium text-surface-900 dark:text-white truncate">{task.task_name}</div>
                <div className="flex-1 relative h-8">
                  <div className={`h-6 ${getBarColor(task.status)} rounded-lg opacity-80 relative`} style={{ width: `${getBarWidth(task.start_date, task.end_date)}px` }}>
                    <div className="absolute inset-0 flex items-center px-2">
                      <span className="text-xs text-white font-medium truncate">{task.completion_percentage}%</span>
                    </div>
                  </div>
                </div>
                <div className="w-32 flex-shrink-0 text-xs text-surface-500">{formatDate(task.start_date)} - {formatDate(task.end_date)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-16 text-surface-400"><GanttChart className="w-16 h-16 mb-4 opacity-30" /><p>Select a project to view Gantt chart</p></div>
        )}
      </div>
    </div>
  );
}
