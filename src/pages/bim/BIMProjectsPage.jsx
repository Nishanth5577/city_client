import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBimProjects, createBimProject, updateBimProject } from '../../redux/slices/bimSlice';
import bimService from '../../services/bimService';
import {
  Plus, Box, Clock, CheckCircle2, FileEdit, Search, Filter,
  Building2, Layers, MoreVertical, Trash2, ExternalLink, Loader2,
  LayoutGrid, List, ArrowUpDown, Copy, Pencil, Eye, Archive,
  AlertTriangle, X, ChevronDown, Calendar, SortAsc, SortDesc
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  all: { label: 'All', icon: Box },
  draft: { label: 'Draft', icon: FileEdit, color: 'var(--t4)', bg: 'rgba(138,136,128,0.1)' },
  in_progress: { label: 'In Progress', icon: Clock, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  review: { label: 'Under Review', icon: Eye, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  approved: { label: 'Approved', icon: CheckCircle2, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  archived: { label: 'Archived', icon: Archive, color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
};

const STATUS_BADGES = {
  draft: { label: 'Draft', color: 'bg-surface-600/20 text-surface-400' },
  in_progress: { label: 'In Progress', color: 'bg-blue-600/20 text-blue-400' },
  review: { label: 'Under Review', color: 'bg-amber-600/20 text-amber-400' },
  approved: { label: 'Approved', color: 'bg-emerald-600/20 text-emerald-400' },
  archived: { label: 'Archived', color: 'bg-surface-700/20 text-surface-500' },
};

export default function BIMProjectsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { projects, projectsLoading, totalProjects } = useSelector(s => s.bim);

  // UI state
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(null); // project object to edit
  const [showDelete, setShowDelete] = useState(null); // project to delete
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, name_asc, name_desc
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [activeMenu, setActiveMenu] = useState(null); // project._id of open context menu
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(null);

  // Create form
  const [erpProjects, setErpProjects] = useState([]);
  const [form, setForm] = useState({
    design_name: '', project_id: '', description: '',
    num_floors: 2, floor_height: 3000, building_type: 'residential',
  });

  // Edit form
  const [editForm, setEditForm] = useState({
    design_name: '', description: '', status: '',
  });

  const menuRef = useRef(null);

  useEffect(() => { dispatch(fetchBimProjects({})); }, [dispatch]);

  // Close context menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setActiveMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch ERP projects for linking
  useEffect(() => {
    if (showCreate) {
      import('../../services/projectService').then(mod => {
        mod.default.getAll().then(res => setErpProjects(res.data.projects || res.data || []));
      }).catch(() => {});
    }
  }, [showCreate]);

  // ─── Handlers ───
  const handleCreate = async (e) => {
    e.preventDefault();
    await dispatch(createBimProject({
      design_name: form.design_name,
      project_id: form.project_id || undefined,
      description: form.description,
      buildings_config: {
        name: 'Building A',
        building_type: form.building_type,
        num_floors: parseInt(form.num_floors),
        floor_height: parseInt(form.floor_height),
      },
    })).unwrap();
    setShowCreate(false);
    setForm({ design_name: '', project_id: '', description: '', num_floors: 2, floor_height: 3000, building_type: 'residential' });
    dispatch(fetchBimProjects({}));
    toast.success('Design created successfully');
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateBimProject({ id: showEdit._id, updates: editForm })).unwrap();
      dispatch(fetchBimProjects({}));
      setShowEdit(null);
      toast.success('Design updated successfully');
    } catch (err) {
      toast.error(err || 'Failed to update');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await bimService.deleteProject(showDelete._id);
      dispatch(fetchBimProjects({}));
      setShowDelete(null);
      toast.success('Design deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
    setDeleting(false);
  };

  const handleDuplicate = async (project) => {
    setDuplicating(project._id);
    try {
      await dispatch(createBimProject({
        design_name: `${project.design_name} (Copy)`,
        project_id: project.project_id?._id || undefined,
        description: project.description,
        buildings_config: {
          name: 'Building A',
          building_type: 'residential',
          num_floors: 2,
          floor_height: 3000,
        },
      })).unwrap();
      dispatch(fetchBimProjects({}));
      toast.success('Design duplicated');
    } catch {
      toast.error('Failed to duplicate');
    }
    setDuplicating(null);
    setActiveMenu(null);
  };

  const handleStatusChange = async (project, newStatus) => {
    try {
      await dispatch(updateBimProject({ id: project._id, updates: { status: newStatus } })).unwrap();
      dispatch(fetchBimProjects({}));
      toast.success(`Status changed to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
    } catch {
      toast.error('Failed to change status');
    }
    setActiveMenu(null);
  };

  const openEditModal = (project) => {
    setEditForm({
      design_name: project.design_name || '',
      description: project.description || '',
      status: project.status || 'draft',
    });
    setShowEdit(project);
    setActiveMenu(null);
  };

  // ─── Filtering & Sorting ───
  const filtered = projects
    .filter(p => statusFilter === 'all' || p.status === statusFilter)
    .filter(p => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return p.design_name?.toLowerCase().includes(q) ||
             p.description?.toLowerCase().includes(q) ||
             p.project_id?.project_name?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
        case 'name_asc': return (a.design_name || '').localeCompare(b.design_name || '');
        case 'name_desc': return (b.design_name || '').localeCompare(a.design_name || '');
        case 'newest':
        default: return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  // Status counts
  const statusCounts = {
    all: projects.length,
    draft: projects.filter(p => p.status === 'draft').length,
    in_progress: projects.filter(p => p.status === 'in_progress').length,
    review: projects.filter(p => p.status === 'review').length,
    approved: projects.filter(p => p.status === 'approved').length,
    archived: projects.filter(p => p.status === 'archived').length,
  };

  return (
    <div className="space-y-6">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Box className="w-5 h-5 text-white" />
            </div>
            BIM Design Studio
          </h1>
          <p className="text-surface-500 mt-1">{totalProjects} design projects</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Design
        </button>
      </div>

      {/* ═══ Quick Stats ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Designs', value: totalProjects, icon: Box, color: 'from-blue-600 to-indigo-600' },
          { label: 'In Progress', value: statusCounts.in_progress, icon: FileEdit, color: 'from-amber-500 to-orange-500' },
          { label: 'Under Review', value: statusCounts.review, icon: Clock, color: 'from-purple-500 to-pink-500' },
          { label: 'Approved', value: statusCounts.approved, icon: CheckCircle2, color: 'from-emerald-500 to-teal-500' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-surface-500 font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ═══ Search, Filter & Controls Bar ═══ */}
      <div className="glass-card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--t5)' }} />
            <input
              type="text"
              placeholder="Search designs by name, description, or linked project..."
              className="input-field w-full"
              style={{ paddingLeft: 40 }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              className="select-field pr-8"
              style={{ minWidth: 160 }}
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name A–Z</option>
              <option value="name_desc">Name Z–A</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <button
              onClick={() => setViewMode('grid')}
              className="p-2.5 transition-colors"
              style={{
                background: viewMode === 'grid' ? 'var(--accent)' : 'var(--card)',
                color: viewMode === 'grid' ? '#fff' : 'var(--t4)',
              }}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="p-2.5 transition-colors"
              style={{
                background: viewMode === 'list' ? 'var(--accent)' : 'var(--card)',
                color: viewMode === 'list' ? '#fff' : 'var(--t4)',
                borderLeft: '1px solid var(--border)',
              }}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: statusFilter === key ? (key === 'all' ? 'var(--accent)' : cfg.bg) : 'var(--glass)',
                color: statusFilter === key ? (key === 'all' ? '#fff' : cfg.color) : 'var(--t4)',
                border: `1px solid ${statusFilter === key ? (key === 'all' ? 'var(--accent)' : cfg.color + '33') : 'transparent'}`,
              }}
            >
              <cfg.icon className="w-3 h-3" />
              {cfg.label}
              <span className="ml-1 opacity-60">{statusCounts[key]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Results Info ═══ */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium" style={{ color: 'var(--t4)' }}>
          Showing {filtered.length} of {projects.length} designs
          {searchQuery && <span> matching "{searchQuery}"</span>}
        </p>
      </div>

      {/* ═══ Projects Grid / List ═══ */}
      {projectsLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 glass-card rounded-2xl">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--accent-wash)' }}>
            <Box className="w-8 h-8" style={{ color: 'var(--accent)' }} />
          </div>
          <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--t1)' }}>
            {searchQuery || statusFilter !== 'all' ? 'No designs found' : 'No designs yet'}
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--t4)', maxWidth: 360, textAlign: 'center' }}>
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'Get started by creating your first BIM design project.'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create First Design
            </button>
          )}
          {(searchQuery || statusFilter !== 'all') && (
            <button onClick={() => { setSearchQuery(''); setStatusFilter('all'); }} className="btn-secondary flex items-center gap-2">
              Clear Filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ═══ GRID VIEW ═══ */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((project, i) => {
            const badge = STATUS_BADGES[project.status] || STATUS_BADGES.draft;
            const isMenuOpen = activeMenu === project._id;
            return (
              <motion.div key={project._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-card-hover p-5 group relative">
                {/* Thumbnail */}
                <div
                  className="h-36 bg-gradient-to-br from-surface-800 to-surface-900 rounded-xl mb-4 flex items-center justify-center overflow-hidden border border-surface-700/50 cursor-pointer"
                  onClick={() => navigate(`/bim/studio/${project._id}`)}
                >
                  <Building2 className="w-12 h-12 text-surface-700 group-hover:text-primary-600 transition-colors" />
                </div>

                {/* Title + Badge + Menu */}
                <div className="flex items-start justify-between mb-2 gap-2">
                  <h3
                    className="font-semibold text-surface-900 dark:text-white text-sm group-hover:text-primary-500 transition-colors cursor-pointer truncate flex-1"
                    onClick={() => navigate(`/bim/studio/${project._id}`)}
                  >
                    {project.design_name}
                  </h3>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`badge text-[10px] ${badge.color}`}>{badge.label}</span>
                    {/* Context Menu Trigger */}
                    <div className="relative" ref={isMenuOpen ? menuRef : null}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveMenu(isMenuOpen ? null : project._id); }}
                        className="p-1 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        style={{ color: 'var(--t4)' }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Context Menu Dropdown */}
                      <AnimatePresence>
                        {isMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            className="absolute right-0 top-8 z-30 w-52 py-1.5 rounded-xl"
                            style={{ background: 'var(--dropdown-bg)', border: '1px solid var(--dropdown-border)', boxShadow: 'var(--dropdown-shadow)' }}
                            onClick={e => e.stopPropagation()}
                          >
                            <button onClick={() => navigate(`/bim/studio/${project._id}`)}
                              className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 text-xs transition-colors hover:bg-surface-100"
                              style={{ color: 'var(--t2)' }}>
                              <ExternalLink className="w-3.5 h-3.5" style={{ color: 'var(--t4)' }} /> Open in Studio
                            </button>
                            <button onClick={() => openEditModal(project)}
                              className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 text-xs transition-colors hover:bg-surface-100"
                              style={{ color: 'var(--t2)' }}>
                              <Pencil className="w-3.5 h-3.5" style={{ color: 'var(--t4)' }} /> Edit Details
                            </button>
                            <button onClick={() => handleDuplicate(project)} disabled={duplicating === project._id}
                              className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 text-xs transition-colors hover:bg-surface-100"
                              style={{ color: 'var(--t2)' }}>
                              {duplicating === project._id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--t4)' }} />
                                : <Copy className="w-3.5 h-3.5" style={{ color: 'var(--t4)' }} />}
                              Duplicate
                            </button>

                            {/* Status submenu */}
                            <div className="mx-3 my-1" style={{ height: 1, background: 'var(--dropdown-divider)' }} />
                            <p className="px-3.5 py-1 text-[10px] font-semibold uppercase" style={{ color: 'var(--t5)', letterSpacing: '0.05em' }}>Change Status</p>
                            {['draft', 'in_progress', 'review', 'approved', 'archived']
                              .filter(s => s !== project.status)
                              .map(s => (
                                <button key={s} onClick={() => handleStatusChange(project, s)}
                                  className="w-full text-left px-3.5 py-1.5 flex items-center gap-2.5 text-xs transition-colors hover:bg-surface-100"
                                  style={{ color: 'var(--t2)' }}>
                                  <div className="w-2 h-2 rounded-full" style={{ background: STATUS_CONFIG[s]?.color }} />
                                  {STATUS_CONFIG[s]?.label}
                                </button>
                              ))}

                            <div className="mx-3 my-1" style={{ height: 1, background: 'var(--dropdown-divider)' }} />
                            <button onClick={() => { setShowDelete(project); setActiveMenu(null); }}
                              className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 text-xs transition-colors hover:bg-red-50 dark:hover:bg-red-900/10"
                              style={{ color: '#DC2626' }}>
                              <Trash2 className="w-3.5 h-3.5" /> Delete Design
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {project.project_id?.project_name && (
                  <p className="text-xs text-primary-500 mb-1 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />{project.project_id.project_name}
                  </p>
                )}

                <p className="text-xs text-surface-500 line-clamp-2 mb-3">{project.description || 'No description'}</p>

                <div className="flex items-center justify-between text-xs text-surface-500">
                  <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{project.buildings?.length || 0} buildings</span>
                  <div className="flex items-center gap-3">
                    {project.createdAt && (
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(project.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    )}
                    <span>v{project.version}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Create New Card */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="glass-card border-2 border-dashed border-surface-300 dark:border-surface-700 p-5 cursor-pointer flex flex-col items-center justify-center min-h-[280px] hover:border-primary-500 hover:bg-primary-50/5 transition-all"
            onClick={() => setShowCreate(true)}>
            <Plus className="w-10 h-10 text-surface-400 mb-3" />
            <span className="text-sm font-medium text-surface-500">Create New Design</span>
          </motion.div>
        </div>
      ) : (
        /* ═══ LIST VIEW ═══ */
        <div className="glass-card overflow-hidden">
          {/* List Header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--t5)', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>
            <div className="col-span-4">Design Name</div>
            <div className="col-span-2">Linked Project</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Buildings</div>
            <div className="col-span-1">Version</div>
            <div className="col-span-2">Created</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          {filtered.map((project, i) => {
            const badge = STATUS_BADGES[project.status] || STATUS_BADGES.draft;
            const isMenuOpen = activeMenu === project._id;
            return (
              <motion.div
                key={project._id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center transition-colors group cursor-pointer"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
                onClick={() => navigate(`/bim/studio/${project._id}`)}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.1)' }}>
                    <Building2 className="w-4 h-4" style={{ color: '#6366F1' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary-500 transition-colors" style={{ color: 'var(--t1)' }}>{project.design_name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--t5)' }}>{project.description || 'No description'}</p>
                  </div>
                </div>
                <div className="col-span-2 text-xs truncate" style={{ color: project.project_id?.project_name ? 'var(--accent)' : 'var(--t5)' }}>
                  {project.project_id?.project_name || '—'}
                </div>
                <div className="col-span-1">
                  <span className={`badge text-[10px] ${badge.color}`}>{badge.label}</span>
                </div>
                <div className="col-span-1 text-xs" style={{ color: 'var(--t4)' }}>
                  {project.buildings?.length || 0}
                </div>
                <div className="col-span-1 text-xs font-mono" style={{ color: 'var(--t4)' }}>
                  v{project.version}
                </div>
                <div className="col-span-2 text-xs" style={{ color: 'var(--t4)' }}>
                  {project.createdAt ? new Date(project.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </div>
                <div className="col-span-1 flex justify-end gap-1">
                  <button onClick={e => { e.stopPropagation(); openEditModal(project); }}
                    className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100" style={{ color: 'var(--t4)' }} title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); handleDuplicate(project); }}
                    className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100" style={{ color: 'var(--t4)' }} title="Duplicate">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); setShowDelete(project); }}
                    className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100" style={{ color: '#DC2626' }} title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ═══ CREATE MODAL ═══ */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-2xl shadow-2xl max-w-lg w-full p-6"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--t1)' }}>
                  <Box className="w-5 h-5" style={{ color: 'var(--accent)' }} /> New BIM Design
                </h2>
                <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg" style={{ color: 'var(--t4)' }}><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="label-text">Design Name *</label>
                  <input className="input-field" required placeholder="e.g., Skyline Tower - Ground Floor Plan"
                    value={form.design_name} onChange={e => setForm({ ...form, design_name: e.target.value })} />
                </div>
                <div>
                  <label className="label-text">Link to ERP Project</label>
                  <select className="select-field" value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}>
                    <option value="">— None (Standalone) —</option>
                    {erpProjects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Number of Floors</label>
                    <input className="input-field" type="number" min="1" max="200"
                      value={form.num_floors} onChange={e => setForm({ ...form, num_floors: e.target.value })} />
                  </div>
                  <div>
                    <label className="label-text">Floor Height (mm)</label>
                    <input className="input-field" type="number" min="2400" max="6000"
                      value={form.floor_height} onChange={e => setForm({ ...form, floor_height: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="label-text">Building Type</label>
                  <select className="select-field" value={form.building_type} onChange={e => setForm({ ...form, building_type: e.target.value })}>
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="industrial">Industrial</option>
                    <option value="mixed_use">Mixed Use</option>
                    <option value="institutional">Institutional</option>
                  </select>
                </div>
                <div>
                  <label className="label-text">Description</label>
                  <textarea className="input-field" rows={2} placeholder="Brief description..."
                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1">Create & Open Studio</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ EDIT MODAL ═══ */}
      <AnimatePresence>
        {showEdit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowEdit(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-2xl shadow-2xl max-w-md w-full p-6"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--t1)' }}>
                  <Pencil className="w-5 h-5" style={{ color: 'var(--accent)' }} /> Edit Design
                </h2>
                <button onClick={() => setShowEdit(null)} className="p-1 rounded-lg" style={{ color: 'var(--t4)' }}><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <label className="label-text">Design Name *</label>
                  <input className="input-field" required
                    value={editForm.design_name} onChange={e => setEditForm({ ...editForm, design_name: e.target.value })} />
                </div>
                <div>
                  <label className="label-text">Status</label>
                  <select className="select-field" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                    <option value="draft">Draft</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="label-text">Description</label>
                  <textarea className="input-field" rows={3}
                    value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowEdit(null)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ DELETE CONFIRMATION ═══ */}
      <AnimatePresence>
        {showDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => !deleting && setShowDelete(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-2xl shadow-2xl max-w-sm w-full p-6"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              onClick={e => e.stopPropagation()}>
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(220,38,38,0.1)' }}>
                  <AlertTriangle className="w-7 h-7" style={{ color: '#DC2626' }} />
                </div>
                <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--t1)' }}>Delete Design?</h3>
                <p className="text-sm mb-1" style={{ color: 'var(--t3)' }}>
                  This will permanently delete
                </p>
                <p className="text-sm font-semibold mb-4" style={{ color: 'var(--t1)' }}>
                  "{showDelete.design_name}"
                </p>
                <p className="text-xs mb-6" style={{ color: 'var(--t5)' }}>
                  All buildings, floors, elements, and associated data will be lost. This action cannot be undone.
                </p>
                <div className="flex gap-3 w-full">
                  <button onClick={() => setShowDelete(null)} disabled={deleting} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handleDelete} disabled={deleting} className="btn-danger flex-1 flex items-center justify-center gap-2">
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
