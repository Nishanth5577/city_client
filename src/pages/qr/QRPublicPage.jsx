import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { formatDate, getProgressColor } from '../../utils/helpers';
import { HardHat, Building2, MapPin } from 'lucide-react';

export default function QRPublicPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    api.get(`/api/projects/public/${id}`)
      .then(r => setData(r.data))
      .catch(err => setError(err.response?.data?.message || 'Unable to load project'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-md">
        <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">Unable to load project</h3>
        <p className="text-surface-500 mb-6">{error}</p>
        <button onClick={fetchData} className="btn-primary">Retry</button>
      </div>
    </div>
  );
  if (!data) return <div className="min-h-screen flex items-center justify-center text-surface-400">Project not found</div>;

  const { project, stages } = data;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 gradient-mesh p-6">
      <div className="max-w-lg mx-auto animate-slide-up">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center shadow-glow"><HardHat className="w-6 h-6 text-white" /></div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">CITY CONSTRUCTIONS</h1>
        </div>

        <div className="glass-card p-6 mb-4">
          <h2 className="text-xl font-bold text-surface-900 dark:text-white">{project.project_name}</h2>
          <div className="flex items-center gap-4 mt-2 text-sm text-surface-500">
            <span className="flex items-center gap-1"><Building2 className="w-4 h-4" />{project.client_name}</span>
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{project.location}</span>
          </div>
          {project.description && <p className="text-sm text-surface-600 dark:text-surface-400 mt-3">{project.description}</p>}

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Progress</span>
              <span className="text-xl font-bold text-gradient">{project.progress_percentage}%</span>
            </div>
            <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(project.progress_percentage)}`} style={{ width: `${project.progress_percentage}%` }} />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Construction Stages</h3>
          <div className="space-y-3">
            {stages?.map((stage, i) => (
              <div key={stage._id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${stage.status === 'completed' ? 'bg-emerald-500 text-white' : stage.status === 'in_progress' ? 'bg-blue-500 text-white' : 'bg-surface-200 text-surface-500'}`}>
                  {stage.status === 'completed' ? '✓' : i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-surface-900 dark:text-white">{stage.stage_name}</p>
                  <div className="h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full mt-1 overflow-hidden">
                    <div className={`h-full rounded-full ${stage.status === 'completed' ? 'bg-emerald-500' : stage.status === 'in_progress' ? 'bg-blue-500' : 'bg-surface-300'}`} style={{ width: `${stage.completion_percentage}%` }} />
                  </div>
                </div>
                <span className="text-xs text-surface-400">{stage.completion_percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
