import { useEffect, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { EXPENSE_CATEGORIES } from '../../utils/constants';
import { Receipt, Plus, Search, Check, X, Edit, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
const emptyForm = { project_id: '', category: 'Material', description: '', amount: '', date: new Date().toISOString().split('T')[0] };

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });

  const fetchData = () => {
    api.get('/api/expenses', { params: { search: debouncedSearch } }).then(r => { setExpenses(r.data.expenses || []); setStats(r.data.stats || []); }).finally(() => setLoading(false));
    api.get('/api/projects').then(r => setProjects(r.data.projects || [])).catch(() => {});
  };

  useEffect(() => { fetchData(); }, [debouncedSearch]);

  const openCreate = () => { setEditId(null); setForm({ ...emptyForm }); setShowModal(true); };
  const openEdit = (exp) => {
    setEditId(exp._id);
    setForm({
      project_id: exp.project_id?._id || exp.project_id || '', category: exp.category || 'Material',
      description: exp.description || '', amount: exp.amount || '',
      date: exp.date ? new Date(exp.date).toISOString().split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, amount: Number(form.amount) };
    try {
      if (editId) { await api.put(`/api/expenses/${editId}`, payload); toast.success('Expense updated!'); }
      else { await api.post('/api/expenses', payload); toast.success('Expense recorded!'); }
      setShowModal(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/expenses/${deleteId}`);
      toast.success('Expense deleted');
      setDeleteId(null); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const handleApprove = async (id, status) => {
    try {
      await api.patch(`/api/expenses/${id}/approve`, { status });
      toast.success(`Expense ${status}`);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <LoadingSpinner />;

  const totalApproved = expenses.filter(e => e.approved_status === 'approved').reduce((s, e) => s + e.amount, 0);
  const totalPending = expenses.filter(e => e.approved_status === 'pending').reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="page-title">Expenses</h1><p className="text-surface-500 mt-1">Track and manage expenses</p></div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />Add Expense</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5"><p className="text-sm text-surface-500">Total Expenses</p><p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{formatCurrency(totalApproved + totalPending)}</p></div>
        <div className="glass-card p-5"><p className="text-sm text-surface-500">Approved</p><p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalApproved)}</p></div>
        <div className="glass-card p-5"><p className="text-sm text-surface-500">Pending Approval</p><p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalPending)}</p></div>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" /><input type="text" placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" /></div>

      <div className="space-y-3">
        {expenses.map(exp => (
          <div key={exp._id} className="glass-card p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2"><h3 className="font-medium text-surface-900 dark:text-white truncate">{exp.description}</h3><span className={`badge ${exp.approved_status === 'approved' ? 'badge-success' : exp.approved_status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>{exp.approved_status}</span></div>
              <p className="text-sm text-surface-500">{exp.category} • {exp.project_id?.project_name || 'N/A'} • {formatDate(exp.date)} • by {exp.created_by?.name || 'Unknown'}</p>
            </div>
            <span className="text-lg font-bold text-surface-900 dark:text-white">{formatCurrency(exp.amount)}</span>
            {exp.approved_status === 'pending' && (
              <div className="flex gap-1">
                <button onClick={() => handleApprove(exp._id, 'approved')} className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-surface-400 hover:text-emerald-600" title="Approve"><Check className="w-4 h-4" /></button>
                <button onClick={() => handleApprove(exp._id, 'rejected')} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-600" title="Reject"><X className="w-4 h-4" /></button>
              </div>
            )}
            <button onClick={() => openEdit(exp)} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 hover:text-primary-600" title="Edit"><Edit className="w-4 h-4" /></button>
            <button onClick={() => setDeleteId(exp._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-500 hover:text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {expenses.length === 0 && <div className="flex flex-col items-center py-16 text-surface-400"><Receipt className="w-16 h-16 mb-4 opacity-30" /><p>No expenses found</p></div>}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="glass-card p-6 w-full max-w-lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-surface-900 dark:text-white">{editId ? 'Edit Expense' : 'Add Expense'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="label-text">Project</label><select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} className="select-field" required><option value="">Select project</option>{projects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-text">Category</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="select-field">{EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="label-text">Amount (₹)</label><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input-field" required min="0" /></div>
              </div>
              <div><label className="label-text">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field h-20 resize-none" required /></div>
              <div><label className="label-text">Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" /></div>
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editId ? 'Update' : 'Add'} Expense</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setDeleteId(null)}>
          <div className="glass-card p-6 w-full max-w-sm animate-scale-in text-center" onClick={e => e.stopPropagation()}>
            <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">Delete Expense?</h3>
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
