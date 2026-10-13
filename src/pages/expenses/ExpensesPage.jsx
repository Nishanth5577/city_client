import { useEffect, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { EXPENSE_CATEGORIES } from '../../utils/constants';
import { Receipt, Plus, Search, Check, X, Edit, Trash2, TrendingDown, Clock, CheckCircle2 } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

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
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>Track and manage expenses</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />Add Expense</button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs" style={{ color: 'var(--t3)' }}>Total Expenses</p>
            <TrendingDown className="w-4 h-4" style={{ color: '#DC2626' }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--t1)' }}>{formatCurrency(totalApproved + totalPending)}</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs" style={{ color: 'var(--t3)' }}>Approved</p>
            <CheckCircle2 className="w-4 h-4" style={{ color: '#059669' }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: '#059669' }}>{formatCurrency(totalApproved)}</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs" style={{ color: 'var(--t3)' }}>Pending Approval</p>
            <Clock className="w-4 h-4" style={{ color: '#D97706' }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: '#D97706' }}>{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--t3)' }} />
        <input type="text" placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
      </div>

      {/* Expense List */}
      <div className="space-y-3">
        {expenses.map(exp => (
          <div
            key={exp._id}
            className="cinematic-card p-4 flex items-center gap-4 transition-all duration-200"
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm truncate" style={{ color: 'var(--t1)' }}>{exp.description}</h3>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                  style={{
                    background: exp.approved_status === 'approved' ? 'rgba(16, 185, 129, 0.15)' : exp.approved_status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: exp.approved_status === 'approved' ? '#059669' : exp.approved_status === 'rejected' ? '#DC2626' : '#D97706',
                    border: `1px solid ${exp.approved_status === 'approved' ? 'rgba(16, 185, 129, 0.2)' : exp.approved_status === 'rejected' ? 'rgba(220,38,38,0.12)' : 'rgba(245, 158, 11, 0.2)'}`,
                  }}
                >
                  {exp.approved_status}
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--t3)' }}>
                {exp.category} • {exp.project_id?.project_name || 'N/A'} • {formatDate(exp.date)} • by {exp.created_by?.name || 'Unknown'}
              </p>
            </div>
            <span className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{formatCurrency(exp.amount)}</span>
            {exp.approved_status === 'pending' && (
              <div className="flex gap-1">
                <button
                  onClick={() => handleApprove(exp._id, 'approved')}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--t3)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; e.currentTarget.style.color = '#059669'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t3)'; }}
                  title="Approve"
                ><Check className="w-4 h-4" /></button>
                <button
                  onClick={() => handleApprove(exp._id, 'rejected')}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--t3)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.color = '#DC2626'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t3)'; }}
                  title="Reject"
                ><X className="w-4 h-4" /></button>
              </div>
            )}
            <button
              onClick={() => openEdit(exp)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--t3)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t3)'; }}
              title="Edit"
            ><Edit className="w-4 h-4" /></button>
            <button
              onClick={() => setDeleteId(exp._id)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--t3)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.color = '#DC2626'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t3)'; }}
              title="Delete"
            ><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {expenses.length === 0 && (
          <div className="flex flex-col items-center py-16">
            <Receipt className="w-16 h-16 mb-4" style={{ color: 'var(--t5)' }} />
            <p style={{ color: 'var(--t3)' }}>No expenses found</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }} onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg p-6 rounded-2xl animate-scale-in" style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 24px 64px rgba(0,0,0,0.1)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: 'var(--t1)' }}>{editId ? 'Edit Expense' : 'Add Expense'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg" style={{ color: 'var(--t3)' }}><X className="w-5 h-5" /></button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }} onClick={() => setDeleteId(null)}>
          <div className="w-full max-w-sm p-6 rounded-2xl animate-scale-in text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 24px 64px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <Trash2 className="w-12 h-12 mx-auto mb-3" style={{ color: '#DC2626' }} />
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--t1)' }}>Delete Expense?</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--t3)' }}>This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
