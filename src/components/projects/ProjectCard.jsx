import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate, getProgressColor } from '../../utils/helpers';
import { PROJECT_STATUS_MAP } from '../../utils/constants';

export default function ProjectCard({ project, viewMode = 'grid' }) {
  const navigate = useNavigate();
  const statusInfo = PROJECT_STATUS_MAP[project.project_status] || { label: project.project_status, color: 'badge-neutral' };

  if (viewMode === 'list') {
    return (
      <div onClick={() => navigate(`/projects/${project._id}`)} className="glass-card-hover p-4 flex items-center gap-4 cursor-pointer">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={statusInfo.color}>{statusInfo.label}</span>
            <h3 className="font-semibold text-surface-900 dark:text-white truncate">{project.project_name}</h3>
          </div>
          <p className="text-sm text-surface-500">{project.client_name} • {project.location}</p>
        </div>
        <div className="w-28 hidden sm:block">
          <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(project.progress_percentage)}`} style={{ width: `${project.progress_percentage}%` }} />
          </div>
          <p className="text-xs text-surface-400 text-right mt-1">{project.progress_percentage}%</p>
        </div>
        <span className="text-sm font-medium text-surface-700 dark:text-surface-300 hidden md:block">{formatCurrency(project.budget)}</span>
        <span className="text-sm text-surface-500 hidden lg:block">{formatDate(project.expected_end_date)}</span>
      </div>
    );
  }

  return (
    <div onClick={() => navigate(`/projects/${project._id}`)} className="glass-card-hover p-5 cursor-pointer">
      <div className="flex items-center justify-between mb-2">
        <span className={statusInfo.color}>{statusInfo.label}</span>
        <span className="text-xs text-surface-400">{project.progress_percentage}%</span>
      </div>
      <h3 className="font-semibold text-surface-900 dark:text-white truncate">{project.project_name}</h3>
      <p className="text-sm text-surface-500 mt-1">{project.client_name} • {project.location}</p>
      <div className="mt-3 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(project.progress_percentage)} transition-all duration-500`} style={{ width: `${project.progress_percentage}%` }} />
      </div>
      <div className="flex items-center justify-between mt-3 text-xs text-surface-500">
        <span>{formatCurrency(project.budget)}</span>
        <span>Due: {formatDate(project.expected_end_date)}</span>
      </div>
    </div>
  );
}
