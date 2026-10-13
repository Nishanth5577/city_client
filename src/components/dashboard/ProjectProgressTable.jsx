import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { MapPin, MoreVertical } from 'lucide-react';

const STATUS_CONFIG = {
  active: { bg: '#ECFDF5', text: '#059669', border: '#D1FAE5', label: 'In Progress' },
  planning: { bg: '#EFF6FF', text: '#2563EB', border: '#DBEAFE', label: 'Planning' },
  completed: { bg: '#ECFDF5', text: '#059669', border: '#D1FAE5', label: 'Completed' },
  delayed: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', label: 'Delayed' },
  on_hold: { bg: '#FFFBEB', text: '#D97706', border: '#FEF3C7', label: 'On Hold' },
  cancelled: { bg: '#F5F5F0', text: '#78756E', border: '#E8E5E0', label: 'Cancelled' },
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Ongoing' },
  { key: 'completed', label: 'Completed' },
  { key: 'on_hold', label: 'On Hold' },
  { key: 'planning', label: 'Upcoming' },
];

function getProgressGradient(pct) {
  if (pct >= 80) return 'linear-gradient(90deg, #059669, #059669)';
  if (pct >= 50) return 'linear-gradient(90deg, #0D9488, #14b8a6)';
  if (pct >= 25) return 'linear-gradient(90deg, #D97706, #D97706)';
  return 'linear-gradient(90deg, #DC2626, #DC2626)';
}

export default function ProjectProgressTable({ projects = [] }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? projects : projects.filter(p => p.project_status === filter);

  const getCounts = (key) => {
    if (key === 'all') return projects.length;
    return projects.filter(p => p.project_status === key).length;
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--t1)' }}>Project Progress</h3>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 px-5 pb-4 overflow-x-auto no-scrollbar">
        {FILTERS.map(f => {
          const count = getCounts(f.key);
          const isActive = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5"
              style={{
                background: isActive ? '#F0FDFA' : 'var(--glass)',
                color: isActive ? '#0D9488' : 'var(--t4)',
                border: `1px solid ${isActive ? '#CCFBF1' : 'var(--border-subtle)'}`,
              }}
            >
              {f.label}
              <span
                className="text-micro px-1.5 py-0.5 rounded-full"
                style={{
                  background: isActive ? 'rgba(13,148,136,0.12)' : 'var(--glass-hover)',
                  fontSize: '10px',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
              {['#', 'Project Name', 'Type', 'Location', 'Progress', 'Status', ''].map((h, i) => (
                <th
                  key={i}
                  className="px-5 py-3 text-left text-xs font-medium"
                  style={{ color: 'var(--t4)', background: 'var(--card-elevated)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((project, idx) => {
              const status = STATUS_CONFIG[project.project_status] || STATUS_CONFIG.active;
              const progress = project.progress_percentage || 0;
              return (
                <tr
                  key={project._id}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-bg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  onClick={() => navigate(`/projects/${project._id}`)}
                >
                  <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--t4)' }}>{idx + 1}</td>
                  <td className="px-5 py-3.5">
                    <p className="text-xs font-medium" style={{ color: 'var(--t1)' }}>{project.project_name}</p>
                  </td>
                  <td className="px-5 py-3.5 text-xs capitalize" style={{ color: 'var(--t3)' }}>
                    {project.project_type || 'Construction'}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" style={{ color: 'var(--t4)' }} />
                      <span className="text-xs" style={{ color: 'var(--t3)' }}>
                        {project.location || project.site_address?.city || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5 min-w-[120px]">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#EEECE8' }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${progress}%`, background: getProgressGradient(progress) }}
                        />
                      </div>
                      <span className="text-xs font-medium" style={{ color: 'var(--t3)' }}>{progress}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{
                        background: status.bg,
                        color: status.text,
                        border: `1px solid ${status.border}`,
                        fontSize: '11px',
                      }}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      className="p-1 rounded-lg transition-colors"
                      style={{ color: 'var(--t4)' }}
                      onClick={(e) => { e.stopPropagation(); }}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-xs" style={{ color: 'var(--t4)' }}>
                  No projects found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
