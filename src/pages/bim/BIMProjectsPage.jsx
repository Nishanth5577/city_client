import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBimProjects, createBimProject } from '../../redux/slices/bimSlice';
import bimService from '../../services/bimService';
import {
  Plus, Box, Clock, CheckCircle2, FileEdit, Search, Filter,
  Building2, Layers, MoreVertical, Trash2, ExternalLink, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [showCreate, setShowCreate] = useState(false);
  const [erpProjects, setErpProjects] = useState([]);
  const [form, setForm] = useState({
    design_name: '', project_id: '', description: '',
    num_floors: 2, floor_height: 3000, building_type: 'residential',
  });

  useEffect(() => { dispatch(fetchBimProjects({})); }, [dispatch]);

  // Fetch ERP projects for linking
  useEffect(() => {
    if (showCreate) {
      import('../../services/projectService').then(mod => {
        mod.default.getAll().then(res => setErpProjects(res.data.projects || res.data || []));
      }).catch(() => {});
    }
  }, [showCreate]);

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
    dispatch(fetchBimProjects({}));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Designs', value: totalProjects, icon: Box, color: 'from-blue-600 to-indigo-600' },
          { label: 'In Progress', value: projects.filter(p => p.status === 'in_progress').length, icon: FileEdit, color: 'from-amber-500 to-orange-500' },
          { label: 'Under Review', value: projects.filter(p => p.status === 'review').length, icon: Clock, color: 'from-purple-500 to-pink-500' },
          { label: 'Approved', value: projects.filter(p => p.status === 'approved').length, icon: CheckCircle2, color: 'from-emerald-500 to-teal-500' },
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

      {/* Projects Grid */}
      {projectsLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project, i) => {
            const badge = STATUS_BADGES[project.status] || STATUS_BADGES.draft;
            return (
              <motion.div key={project._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-card-hover p-5 cursor-pointer group"
                onClick={() => navigate(`/bim/studio/${project._id}`)}>
                {/* Thumbnail */}
                <div className="h-36 bg-gradient-to-br from-surface-800 to-surface-900 rounded-xl mb-4 flex items-center justify-center overflow-hidden border border-surface-700/50">
                  <Building2 className="w-12 h-12 text-surface-700 group-hover:text-primary-600 transition-colors" />
                </div>

                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-surface-900 dark:text-white text-sm group-hover:text-primary-500 transition-colors">
                    {project.design_name}
                  </h3>
                  <span className={`badge text-[10px] ${badge.color}`}>{badge.label}</span>
                </div>

                {project.project_id?.project_name && (
                  <p className="text-xs text-primary-500 mb-1 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />{project.project_id.project_name}
                  </p>
                )}

                <p className="text-xs text-surface-500 line-clamp-2 mb-3">{project.description || 'No description'}</p>

                <div className="flex items-center justify-between text-xs text-surface-500">
                  <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{project.buildings?.length || 0} buildings</span>
                  <span>v{project.version}</span>
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
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-2xl max-w-lg w-full p-6"
              onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                <Box className="w-5 h-5 text-primary-500" /> New BIM Design
              </h2>

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
    </div>
  );
}
