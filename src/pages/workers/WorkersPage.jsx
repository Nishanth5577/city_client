import { useEffect, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import api from '../../services/api';
import { formatCurrency, formatDate, getInitials } from '../../utils/helpers';
import { Users, Plus, Search, Edit, Trash2, X, ChevronLeft, ChevronRight, Filter, Phone, MapPin, Calendar, Briefcase } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const SKILLS = ['General', 'Mason', 'Carpenter', 'Electrician', 'Plumber', 'Welder', 'Painter', 'Fitter', 'Supervisor', 'Helper', 'Operator', 'Driver', 'Other'];
const AVAILABILITY_OPTIONS = ['available', 'assigned', 'on_leave', 'inactive'];

const emptyForm = {
  name: '', skill: 'General', specialization: '', experience: '', salary: '', salary_type: 'daily',
  phone: '', emergency_contact: '', address: '', aadhar_number: '', bank_account: '', ifsc_code: '',
  assigned_project: '', availability: 'available', joining_date: new Date().toISOString().split('T')[0],
};

export default function WorkersPage() {
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  // Filters
  const [skillFilter, setSkillFilter] = useState('');
  const [availFilter, setAvailFilter] = useState('');
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const params = { search: debouncedSearch, page, limit };
      if (skillFilter) params.skill = skillFilter;
      if (availFilter) params.availability = availFilter;
      const { data } = await api.get('/api/workers', { params });
      setWorkers(data.workers || []);
      setTotal(data.total || 0);
      setTotalPages(data.pages || 1);
    } catch { toast.error('Failed to load workers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWorkers(); }, [debouncedSearch, page, skillFilter, availFilter]);
  useEffect(() => { api.get('/api/projects', { params: { limit: 100 } }).then(r => setProjects(r.data.projects || [])).catch(() => {}); }, []);
  useEffect(() => { setPage(1); }, [debouncedSearch, skillFilter, availFilter]);

  const openCreate = () => { setEditId(null); setForm({ ...emptyForm }); setShowModal(true); };
  const openEdit = (w) => {
    setEditId(w._id);
    setForm({
      name: w.name || '', skill: w.skill || 'General', specialization: w.specialization || '',
      experience: w.experience || '', salary: w.salary || '', salary_type: w.salary_type || 'daily',
      phone: w.phone || '', emergency_contact: w.emergency_contact || '', address: w.address || '',
      aadhar_number: w.aadhar_number || '', bank_account: w.bank_account || '', ifsc_code: w.ifsc_code || '',
      assigned_project: w.assigned_project?._id || w.assigned_project || '', availability: w.availability || 'available',
      joining_date: w.joining_date ? new Date(w.joining_date).toISOString().split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, experience: Number(form.experience) || 0, salary: Number(form.salary) || 0 };
    if (!payload.assigned_project) delete payload.assigned_project;
    try {
      if (editId) {
        await api.put(`/api/workers/${editId}`, payload);
        toast.success('Worker updated!');
      } else {
        await api.post('/api/workers', payload);
        toast.success('Worker added!');
      }
      setShowModal(false);
      fetchWorkers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save worker'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/workers/${deleteId}`);
      toast.success('Worker deleted');
      setDeleteId(null);
      fetchWorkers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  if (loading && workers.length === 0) return <LoadingSpinner />;

  const availColors = {
    available: 'badge-success', assigned: 'badge-info', on_leave: 'badge-warning', inactive: 'badge-danger',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="page-title">Workers</h1><p className="text-surface-500 mt-1">{total} workers total</p></div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />Add Worker</button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" /><input type="text" placeholder="Search workers..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" /></div>
        <select value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} className="select-field w-auto">
          <option value="">All Skills</option>
          {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={availFilter} onChange={(e) => setAvailFilter(e.target.value)} className="select-field w-auto">
          <option value="">All Status</option>
          {AVAILABILITY_OPTIONS.map(a => <option key={a} value={a}>{a.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
        </select>
      </div>

      {/* Worker Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {workers.map(w => (
          <div key={w._id} className="glass-card-hover p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold">{getInitials(w.name)}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-surface-900 dark:text-white truncate">{w.name}</h3>
                <p className="text-sm text-surface-500">{w.skill}{w.worker_id ? ` • ${w.worker_id}` : ''}</p>
              </div>
              <span className={`badge ${availColors[w.availability] || 'badge-info'}`}>{w.availability?.replace('_', ' ')}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-sm mb-3">
              <div><p className="text-xs text-surface-400">Experience</p><p className="font-bold text-surface-900 dark:text-white">{w.experience || 0}yr</p></div>
              <div><p className="text-xs text-surface-400">Salary</p><p className="font-bold text-surface-900 dark:text-white">{formatCurrency(w.salary)}</p></div>
              <div><p className="text-xs text-surface-400">Rating</p><p className="font-bold text-surface-900 dark:text-white">{w.performance_rating || 0}/5</p></div>
            </div>

            {w.assigned_project && <p className="text-xs text-surface-400 mb-2 truncate">📋 {w.assigned_project?.project_name || 'Assigned'}</p>}

            {/* Expanded Details */}
            {expandedId === w._id && (
              <div className="border-t border-surface-200 dark:border-surface-700 pt-3 mt-2 space-y-1 text-sm animate-fade-in">
                {w.phone && <p className="flex items-center gap-2 text-surface-600 dark:text-surface-400"><Phone className="w-3 h-3" /> {w.phone}</p>}
                {w.emergency_contact && <p className="flex items-center gap-2 text-surface-600 dark:text-surface-400"><Phone className="w-3 h-3 text-red-400" /> Emergency: {w.emergency_contact}</p>}
                {w.address && <p className="flex items-center gap-2 text-surface-600 dark:text-surface-400"><MapPin className="w-3 h-3" /> {w.address}</p>}
                {w.joining_date && <p className="flex items-center gap-2 text-surface-600 dark:text-surface-400"><Calendar className="w-3 h-3" /> Joined: {formatDate(w.joining_date)}</p>}
                {w.aadhar_number && <p className="text-surface-500">Aadhar: {w.aadhar_number}</p>}
                {w.bank_account && <p className="text-surface-500">Bank A/C: {w.bank_account} {w.ifsc_code ? `(${w.ifsc_code})` : ''}</p>}
                <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                  <div><p className="text-[10px] text-surface-400">Tasks Done</p><p className="font-bold text-sm">{w.tasks_completed || 0}</p></div>
                  <div><p className="text-[10px] text-surface-400">Days Present</p><p className="font-bold text-sm">{w.total_days_present || 0}</p></div>
                  <div><p className="text-[10px] text-surface-400">Total Earned</p><p className="font-bold text-sm">{formatCurrency(w.total_earnings || 0)}</p></div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
              <button onClick={() => setExpandedId(expandedId === w._id ? null : w._id)} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                {expandedId === w._id ? 'Less' : 'More Details'}
              </button>
              <div className="flex-1" />
              <button onClick={() => openEdit(w)} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 hover:text-primary-600 transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
              <button onClick={() => setDeleteId(w._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-500 hover:text-red-600 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {workers.length === 0 && !loading && <div className="col-span-full flex flex-col items-center py-16 text-surface-400"><Users className="w-16 h-16 mb-4 opacity-30" /><p>No workers found</p></div>}
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
          <div className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-surface-900 dark:text-white">{editId ? 'Edit Worker' : 'Add Worker'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Info */}
              <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wider">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-text">Full Name *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required /></div>
                <div><label className="label-text">Skill *</label><select value={form.skill} onChange={(e) => setForm({ ...form, skill: e.target.value })} className="select-field">{SKILLS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="label-text">Experience (yrs)</label><input type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} className="input-field" min="0" /></div>
                <div><label className="label-text">Salary (₹)</label><input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className="input-field" min="0" /></div>
                <div><label className="label-text">Salary Type</label><select value={form.salary_type} onChange={(e) => setForm({ ...form, salary_type: e.target.value })} className="select-field"><option value="daily">Daily</option><option value="monthly">Monthly</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-text">Specialization</label><input type="text" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className="input-field" placeholder="e.g., RCC, Shuttering" /></div>
                <div><label className="label-text">Joining Date</label><input type="date" value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} className="input-field" /></div>
              </div>

              {/* Assignment */}
              <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wider pt-2">Assignment</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-text">Assigned Project</label><select value={form.assigned_project} onChange={(e) => setForm({ ...form, assigned_project: e.target.value })} className="select-field"><option value="">-- Unassigned --</option>{projects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}</select></div>
                <div><label className="label-text">Availability</label><select value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} className="select-field">{AVAILABILITY_OPTIONS.map(a => <option key={a} value={a}>{a.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}</select></div>
              </div>

              {/* Contact */}
              <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wider pt-2">Contact Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-text">Phone</label><input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="10-digit number" /></div>
                <div><label className="label-text">Emergency Contact</label><input type="tel" value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} className="input-field" /></div>
              </div>
              <div><label className="label-text">Address</label><input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" /></div>

              {/* ID & Bank */}
              <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wider pt-2">ID & Bank Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="label-text">Aadhar Number</label><input type="text" value={form.aadhar_number} onChange={(e) => setForm({ ...form, aadhar_number: e.target.value })} className="input-field" maxLength="12" /></div>
                <div><label className="label-text">Bank Account</label><input type="text" value={form.bank_account} onChange={(e) => setForm({ ...form, bank_account: e.target.value })} className="input-field" /></div>
                <div><label className="label-text">IFSC Code</label><input type="text" value={form.ifsc_code} onChange={(e) => setForm({ ...form, ifsc_code: e.target.value })} className="input-field" /></div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editId ? 'Update Worker' : 'Add Worker'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setDeleteId(null)}>
          <div className="glass-card p-6 w-full max-w-sm animate-scale-in text-center" onClick={e => e.stopPropagation()}>
            <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">Delete Worker?</h3>
            <p className="text-sm text-surface-500 mb-4">This action cannot be undone. All associated data will be removed.</p>
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
