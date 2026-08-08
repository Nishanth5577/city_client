import { useNavigate } from 'react-router-dom';
import { formatCurrency, getProgressColor } from '../../utils/helpers';

export default function ProjectHealthCard({ project }) {
  const navigate = useNavigate();

  return (
    <div
      className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors cursor-pointer"
      onClick={() => navigate(`/projects/${project._id}`)}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-surface-900 dark:text-white truncate">{project.project_name}</p>
        <p className="text-sm text-surface-500">{formatCurrency(project.budget)}</p>
      </div>
      <div className="w-32">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-surface-500">{project.progress_percentage}%</span>
        </div>
        <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(project.progress_percentage)} transition-all duration-500`}
            style={{ width: `${project.progress_percentage}%` }}
          />
        </div>
      </div>
      <span className={`badge ${
        project.project_status === 'active' ? 'badge-success' :
        project.project_status === 'delayed' ? 'badge-danger' :
        project.project_status === 'completed' ? 'badge-info' : 'badge-neutral'
      }`}>
        {project.project_status}
      </span>
    </div>
  );
}
