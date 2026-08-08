import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchProjects, createProject } from '../../redux/slices/projectSlice';
import { formatCurrency, formatDate, getProgressColor } from '../../utils/helpers';
import { PROJECT_STATUS_MAP } from '../../utils/constants';
import { Plus, Search, Filter, LayoutGrid, List, FolderKanban } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

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
          <p className="text-surface-500 mt-1">{total} total projects</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2" id="create-project-btn">
          <Plus className="w-4 h-4" />New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input type="text" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" id="project-search" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select-field w-auto" id="project-status-filter">
          <option value="">All Status</option>
          {Object.entries(PROJECT_STATUS_MAP).map(([val, { label }]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <div className="flex border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
          <button onClick={() => setViewMode('grid')} className={`p-2.5 ${viewMode === 'grid' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'}`}><LayoutGrid className="w-4 h-4" /></button>
          <button onClick={() => setViewMode('list')} className={`p-2.5 ${viewMode === 'list' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Projects Grid/List */}
      {loading ? <LoadingSpinner /> : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
          {projects.map((project) => {
            const statusInfo = PROJECT_STATUS_MAP[project.project_status] || { label: project.project_status, color: 'badge-neutral' };
            return (
              <div key={project._id} onClick={() => navigate(`/projects/${project._id}`)}
                className={`glass-card-hover p-5 cursor-pointer ${viewMode === 'list' ? 'flex items-center gap-4' : ''}`}>
                <div className={viewMode === 'list' ? 'flex-1 min-w-0' : ''}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={statusInfo.color}>{statusInfo.label}</span>
                    {viewMode === 'grid' && <span className="text-xs text-surface-400">{project.progress_percentage}%</span>}
                  </div>
                  <h3 className="font-semibold text-surface-900 dark:text-white truncate">{project.project_name}</h3>
                  <p className="text-sm text-surface-500 mt-1">{project.client_name} • {project.location}</p>
                  {viewMode === 'grid' && (
                    <>
                      <div className="mt-3 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(project.progress_percentage)} transition-all duration-500`} style={{ width: `${project.progress_percentage}%` }} />
                      </div>
                      <div className="flex items-center justify-between mt-3 text-xs text-surface-500">
                        <span>{formatCurrency(project.budget)}</span>
                        <span>Due: {formatDate(project.expected_end_date)}</span>
                      </div>
                    </>
                  )}
                </div>
                {viewMode === 'list' && (
                  <>
                    <div className="w-28 hidden sm:block"><div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden"><div className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(project.progress_percentage)}`} style={{ width: `${project.progress_percentage}%` }} /></div><p className="text-xs text-surface-400 text-right mt-1">{project.progress_percentage}%</p></div>
                    <span className="text-sm font-medium text-surface-700 dark:text-surface-300 hidden md:block">{formatCurrency(project.budget)}</span>
                    <span className="text-sm text-surface-500 hidden lg:block">{formatDate(project.expected_end_date)}</span>
                  </>
                )}
              </div>
            );
          })}
          {projects.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-surface-400">
              <FolderKanban className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">No projects found</p>
              <p className="text-sm mt-1">Create your first project to get started</p>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="glass-card p-6 w-full max-w-lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-4">Create New Project</h2>
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
