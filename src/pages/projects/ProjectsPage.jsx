import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchProjects, createProject } from '../../redux/slices/projectSlice';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { PROJECT_STATUS_MAP } from '../../utils/constants';
import { Plus, Search, LayoutGrid, List, FolderKanban, MapPin, Calendar } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  active: { bg: 'rgba(16, 185, 129, 0.15)', text: '#059669', border: 'rgba(16, 185, 129, 0.2)', label: 'In Progress' },
  planning: { bg: 'rgba(59, 130, 246, 0.15)', text: '#2563EB', border: 'rgba(59, 130, 246, 0.2)', label: 'Planning' },
  completed: { bg: 'rgba(16, 185, 129, 0.15)', text: '#059669', border: 'rgba(16, 185, 129, 0.2)', label: 'Completed' },
  delayed: { bg: 'rgba(239, 68, 68, 0.15)', text: '#DC2626', border: 'rgba(220,38,38,0.12)', label: 'Delayed' },
  on_hold: { bg: 'rgba(245, 158, 11, 0.15)', text: '#D97706', border: 'rgba(245, 158, 11, 0.2)', label: 'On Hold' },
  cancelled: { bg: 'rgba(107, 114, 128, 0.15)', text: '#6B7280', border: 'rgba(107, 114, 128, 0.2)', label: 'Cancelled' },
};

function getProgressGradient(pct) {
  if (pct >= 80) return 'linear-gradient(90deg, #059669, #059669)';
  if (pct >= 50) return 'linear-gradient(90deg, #0D9488, #14B8A6)';
  if (pct >= 25) return 'linear-gradient(90deg, var(--accent), #D97706)';
  return 'linear-gradient(90deg, #DC2626, #DC2626)';
}

export default function ProjectsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list: projects, loading, total } = useSelector((state) => state.projects);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ project_name: '', client_name: '', location: '', description: '', budget: '', start_date: '', expected_end_date: '' });

  useEffect(() => {
    dispatch(fetchProjects({ search, status: statusFilter }));
  }, [dispatch, search, statusFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const result = await dispatch(createProject({ ...form, budget: Number(form.budget) }));
    if (createProject.fulfilled.match(result)) {
      toast.success('Project created!');
      setShowModal(false);
      setForm({ project_name: '', client_name: '', location: '', description: '', budget: '', start_date: '', expected_end_date: '' });
    } else toast.error(result.payload || 'Failed to create project');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>{total} total projects</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2" id="create-project-btn">
          <Plus className="w-4 h-4" />New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--t3)' }} />
          <input type="text" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" id="project-search" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select-field w-auto" id="project-status-filter">
          <option value="">All Status</option>
          {Object.entries(PROJECT_STATUS_MAP).map(([val, { label }]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <button
            onClick={() => setViewMode('grid')}
            className="p-2.5 transition-colors"
            style={{
              background: viewMode === 'grid' ? 'rgba(37,99,235,0.08)' : 'transparent',
              color: viewMode === 'grid' ? 'var(--accent)' : 'var(--t3)',
            }}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className="p-2.5 transition-colors"
            style={{
              background: viewMode === 'list' ? 'rgba(37,99,235,0.08)' : 'transparent',
              color: viewMode === 'list' ? 'var(--accent)' : 'var(--t3)',
            }}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Projects Grid/List */}
      {loading ? <LoadingSpinner /> : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
          {projects.map((project) => {
            const status = STATUS_COLORS[project.project_status] || STATUS_COLORS.active;
            const progress = project.progress_percentage || 0;
            return (
              <div
                key={project._id}
                onClick={() => navigate(`/projects/${project._id}`)}
                className={`cinematic-card p-5 cursor-pointer transition-all duration-300 hover:shadow-card-hover ${viewMode === 'list' ? 'flex items-center gap-4' : ''}`}
                style={{ transform: 'translateY(0)' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <div className={viewMode === 'list' ? 'flex-1 min-w-0' : ''}>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{ background: status.bg, color: status.text, border: `1px solid ${status.border}` }}
                    >
                      {status.label}
                    </span>
                    {viewMode === 'grid' && (
                      <span className="text-xs font-medium" style={{ color: 'var(--t3)' }}>{progress}%</span>
                    )}
                  </div>
                  <h3 className="font-semibold truncate text-sm" style={{ color: 'var(--t1)' }}>{project.project_name}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs" style={{ color: 'var(--t3)' }}>{project.client_name}</span>
                    {project.location && (
                      <>
                        <span style={{ color: 'var(--t4)' }}>•</span>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" style={{ color: 'var(--t4)' }} />
                          <span className="text-xs" style={{ color: 'var(--t3)' }}>{project.location}</span>
                        </div>
                      </>
                    )}
                  </div>
                  {viewMode === 'grid' && (
                    <>
                      <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: getProgressGradient(progress) }} />
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>{formatCurrency(project.budget)}</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" style={{ color: 'var(--t4)' }} />
                          <span className="text-xs" style={{ color: 'var(--t4)' }}>{formatDate(project.expected_end_date)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {viewMode === 'list' && (
                  <>
                    <div className="w-28 hidden sm:block">
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                        <div className="h-full rounded-full" style={{ width: `${progress}%`, background: getProgressGradient(progress) }} />
                      </div>
                      <p className="text-xs text-right mt-1" style={{ color: 'var(--t3)' }}>{progress}%</p>
                    </div>
                    <span className="text-sm font-medium hidden md:block" style={{ color: 'var(--accent)' }}>{formatCurrency(project.budget)}</span>
                    <span className="text-xs hidden lg:block" style={{ color: 'var(--t4)' }}>{formatDate(project.expected_end_date)}</span>
                  </>
                )}
              </div>
            );
          })}
          {projects.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <FolderKanban className="w-16 h-16 mb-4" style={{ color: 'var(--t5)' }} />
              <p className="text-lg font-medium" style={{ color: 'var(--t3)' }}>No projects found</p>
              <p className="text-sm mt-1" style={{ color: 'var(--t4)' }}>Create your first project to get started</p>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-lg p-6 rounded-2xl animate-scale-in"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--t1)' }}>Create New Project</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className="label-text">Project Name</label><input type="text" value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} className="input-field" required id="new-project-name" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-text">Client Name</label><input type="text" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} className="input-field" required /></div>
                <div><label className="label-text">Location</label><input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-field" /></div>
              </div>
              <div><label className="label-text">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field h-20 resize-none" /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="label-text">Budget (₹)</label><input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className="input-field" /></div>
                <div><label className="label-text">Start Date</label><input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="input-field" /></div>
                <div><label className="label-text">Expected End</label><input type="date" value={form.expected_end_date} onChange={(e) => setForm({ ...form, expected_end_date: e.target.value })} className="input-field" /></div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" id="submit-project">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
