import { useEffect, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import api from '../../services/api';
import { TASK_STATUS_MAP, PRIORITY_MAP } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';
import { Plus, Search, ListChecks, Edit, Trash2, X, ChevronLeft, ChevronRight, User, Calendar } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const emptyForm = { task_name: '', description: '', project_id: '', assigned_worker: '', priority: 'medium', start_date: '', end_date: '', completion_percentage: 0 };

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = { search: debouncedSearch, page, limit };
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const { data } = await api.get('/api/tasks', { params });
      setTasks(data.tasks || []);
      setTotal(data.total || 0);
      setTotalPages(data.pages || 1);
    } catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTasks(); }, [debouncedSearch, page, statusFilter, priorityFilter]);
  useEffect(() => {
    Promise.all([
      api.get('/api/projects', { params: { limit: 100 } }),
      api.get('/api/workers', { params: { limit: 200 } }),
    ]).then(([pRes, wRes]) => {
      setProjects(pRes.data.projects || []);
      setWorkers(wRes.data.workers || []);
    }).catch(() => {});
  }, []);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, priorityFilter]);

  const openCreate = () => { setEditId(null); setForm({ ...emptyForm }); setShowModal(true); };
  const openEdit = (t) => {
    setEditId(t._id);
    setForm({
      task_name: t.task_name || '', description: t.description || '',
      project_id: t.project_id?._id || t.project_id || '',
      assigned_worker: t.assigned_worker?._id || t.assigned_worker || '',
      priority: t.priority || 'medium',
      start_date: t.start_date ? new Date(t.start_date).toISOString().split('T')[0] : '',
      end_date: t.end_date ? new Date(t.end_date).toISOString().split('T')[0] : '',
      completion_percentage: t.completion_percentage || 0,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, completion_percentage: Number(form.completion_percentage) || 0 };
    if (!payload.assigned_worker) delete payload.assigned_worker;
    try {
      if (editId) {
        await api.put(`/api/tasks/${editId}`, payload);
        toast.success('Task updated!');
      } else {
        await api.post('/api/tasks', payload);
        toast.success('Task created!');
      }
      setShowModal(false);
      fetchTasks();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save task'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/tasks/${deleteId}`);
      toast.success('Task deleted');
      setDeleteId(null);
      fetchTasks();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/api/tasks/${id}/status`, { status });
      fetchTasks();
      toast.success('Status updated');
    } catch { toast.error('Failed to update'); }
  };

  if (loading && tasks.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="page-title">Tasks</h1><p className="text-surface-500 mt-1">{total} tasks total</p></div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />New Task</button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" /><input type="text" placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" /></div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select-field w-auto">
          <option value="">All Status</option>
          {Object.entries(TASK_STATUS_MAP).map(([val, { label }]) => (<option key={val} value={val}>{label}</option>))}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="select-field w-auto">
          <option value="">All Priority</option>
          {Object.entries(PRIORITY_MAP).map(([val, { label }]) => (<option key={val} value={val}>{label}</option>))}
        </select>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.map(task => {
          const statusInfo = TASK_STATUS_MAP[task.status] || {};
          const priorityInfo = PRIORITY_MAP[task.priority] || {};
          return (
            <div key={task._id} className="glass-card p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-medium text-surface-900 dark:text-white truncate">{task.task_name}</h3>
                  <span className={statusInfo.color}>{statusInfo.label}</span>
                  <span className={`text-xs font-medium ${priorityInfo.color}`}>{priorityInfo.label}</span>
                </div>
                <p className="text-sm text-surface-500">
                  {task.project_id?.project_name || 'No project'} • <User className="w-3 h-3 inline" /> {task.assigned_worker?.name || 'Unassigned'} • <Calendar className="w-3 h-3 inline" /> {task.end_date ? formatDate(task.end_date) : 'No deadline'}
                </p>
                {task.description && <p className="text-xs text-surface-400 mt-1 truncate max-w-lg">{task.description}</p>}
              </div>
              {/* Progress Bar */}
              <div className="w-24 hidden sm:block">
                <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all" style={{ width: `${task.completion_percentage}%` }} />
                </div>
                <p className="text-xs text-surface-400 text-right mt-1">{task.completion_percentage}%</p>
              </div>
              {/* Status Dropdown */}
              <select value={task.status} onChange={(e) => updateStatus(task._id, e.target.value)} className="select-field w-auto text-xs py-1.5">
                {Object.entries(TASK_STATUS_MAP).map(([val, { label }]) => (<option key={val} value={val}>{label}</option>))}
              </select>
              {/* Action Buttons */}
              <div className="flex gap-1">
                <button onClick={() => openEdit(task)} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 hover:text-primary-600 transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                <button onClick={() => setDeleteId(task._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-500 hover:text-red-600 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          );
        })}
        {tasks.length === 0 && !loading && <div className="flex flex-col items-center py-16 text-surface-400"><ListChecks className="w-16 h-16 mb-4 opacity-30" /><p>No tasks found</p></div>}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost p-2 disabled:opacity-30"><ChevronLeft className="w-5 h-5" /></button>
          <span className="text-sm font-medium text-surface-600 dark:text-surface-400">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ghost p-2 disabled:opacity-30"><ChevronRight className="w-5 h-5" /></button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-surface-900 dark:text-white">{editId ? 'Edit Task' : 'Create Task'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="label-text">Task Name *</label><input type="text" value={form.task_name} onChange={(e) => setForm({ ...form, task_name: e.target.value })} className="input-field" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-text">Project *</label><select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} className="select-field" required><option value="">Select project</option>{projects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}</select></div>
                <div><label className="label-text">Assign Worker</label><select value={form.assigned_worker} onChange={(e) => setForm({ ...form, assigned_worker: e.target.value })} className="select-field"><option value="">Unassigned</option>{workers.map(w => <option key={w._id} value={w._id}>{w.name} ({w.skill})</option>)}</select></div>
              </div>
              <div><label className="label-text">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field h-20 resize-none" /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="label-text">Priority</label><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="select-field"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div>
                <div><label className="label-text">Start Date</label><input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="input-field" /></div>
                <div><label className="label-text">End Date</label><input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="input-field" /></div>
              </div>
              {editId && (
                <div>
                  <label className="label-text">Completion: {form.completion_percentage}%</label>
                  <input type="range" min="0" max="100" step="5" value={form.completion_percentage} onChange={(e) => setForm({ ...form, completion_percentage: e.target.value })} className="w-full accent-primary-600" />
                </div>
              )}
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editId ? 'Update' : 'Create'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setDeleteId(null)}>
          <div className="glass-card p-6 w-full max-w-sm animate-scale-in text-center" onClick={e => e.stopPropagation()}>
            <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">Delete Task?</h3>
            <p className="text-sm text-surface-500 mb-4">This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 font-medium text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
