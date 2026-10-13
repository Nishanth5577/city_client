import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';

const STATUS_COLORS = {
  active: { bg: '#ECFDF5', text: '#059669', border: '#D1FAE5', label: 'In Progress' },
  planning: { bg: '#EFF6FF', text: '#2563EB', border: '#DBEAFE', label: 'Planning' },
  completed: { bg: '#ECFDF5', text: '#059669', border: '#D1FAE5', label: 'Completed' },
  delayed: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', label: 'Delayed' },
  on_hold: { bg: '#FFFBEB', text: '#D97706', border: '#FEF3C7', label: 'On Hold' },
  cancelled: { bg: '#F5F5F0', text: '#78756E', border: '#E8E5E0', label: 'Cancelled' },
};

const PROGRESS_COLORS = {
  high: 'linear-gradient(90deg, #059669, #059669)',
  medium: 'linear-gradient(90deg, #0D9488, #14b8a6)',
  low: 'linear-gradient(90deg, #D97706, #D97706)',
  critical: 'linear-gradient(90deg, #DC2626, #DC2626)',
};

function getProgressGradient(pct) {
  if (pct >= 80) return PROGRESS_COLORS.high;
  if (pct >= 50) return PROGRESS_COLORS.medium;
  if (pct >= 25) return PROGRESS_COLORS.low;
  return PROGRESS_COLORS.critical;
}

export default function RecentProjects({ projects = [] }) {
  const navigate = useNavigate();

  if (projects.length === 0) {
    return (
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--t1)', letterSpacing: '-0.01em' }}>Recent projects</h3>
        </div>
        <p className="text-xs text-center py-6" style={{ color: 'var(--t5)' }}>No projects yet</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--t1)', letterSpacing: '-0.01em' }}>Recent projects</h3>
        <button
          onClick={() => navigate('/projects')}
          className="text-xs font-medium flex items-center gap-1 transition-colors hover:text-teal-700"
          style={{ color: 'var(--accent)' }}
        >
          View all
        </button>
      </div>

      {/* Project list */}
      <div className="space-y-1">
        {projects.slice(0, 5).map((project) => {
          const status = STATUS_COLORS[project.project_status] || STATUS_COLORS.active;
          const progress = project.progress_percentage || 0;

          return (
            <div
              key={project._id}
              className="group flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-300"
              style={{ background: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-bg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              onClick={() => navigate(`/projects/${project._id}`)}
            >
              {/* Thumbnail */}
              <div
                className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold"
                style={{
                  background: 'rgba(13,148,136,0.1)',
                  color: 'var(--accent)',
                  border: '1px solid rgba(13,148,136,0.15)',
                }}
              >
                {project.project_name?.charAt(0) || 'P'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--t1)' }}>
                    {project.project_name}
                  </p>
                  <span
                    className="text-micro px-1.5 py-0.5 rounded-md flex-shrink-0"
                    style={{
                      background: status.bg,
                      color: status.text,
                      border: `1px solid ${status.border}`,
                      fontSize: '9px',
                      fontWeight: 600,
                    }}
                  >
                    {status.label}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin className="w-2.5 h-2.5" style={{ color: 'var(--t5)' }} />
                  <span className="text-micro truncate" style={{ color: 'var(--t5)', fontSize: '10px' }}>
                    {project.location || project.site_address?.city || 'N/A'}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: '#EEECE8' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${progress}%`,
                        background: getProgressGradient(progress),
                      }}
                    />
                  </div>
                  <span className="font-mono font-medium" style={{ color: 'var(--t4)', fontSize: '10px' }}>
                    {progress}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
