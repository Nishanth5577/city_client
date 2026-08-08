import { useState, useEffect } from 'react';
import api from '../../services/api';
import { IndianRupee, Plus, ArrowUpRight, ArrowDownRight, TrendingUp, Search, X, Filter, Edit, Trash2 } from 'lucide-react';
import paymentService from '../../services/paymentService';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function FinancePage() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, profit: 0, byCategory: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ project_id: '', type: 'income', category: '', description: '', amount: '', date: new Date().toISOString().split('T')[0], payment_mode: 'bank_transfer', reference_number: '', party_name: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [payRes, sumRes] = await Promise.all([
        paymentService.getAll({ type: filter === 'all' ? undefined : filter, limit: 100 }),
        paymentService.getSummary(),
      ]);
      setPayments(payRes.data.payments);
      setSummary(sumRes.data);
    } catch (err) { toast.error('Failed to load finance data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filter]);
  useEffect(() => { api.get('/api/projects', { params: { limit: 100 } }).then(r => setProjects(r.data.projects || [])).catch(() => {}); }, []);

  const openCreate = () => { setEditId(null); setForm({ project_id: '', type: 'income', category: '', description: '', amount: '', date: new Date().toISOString().split('T')[0], payment_mode: 'bank_transfer', reference_number: '', party_name: '' }); setShowForm(true); };
  const openEdit = (p) => {
    setEditId(p._id);
    setForm({
      project_id: p.project_id?._id || p.project_id || '', type: p.type || 'income', category: p.category || '',
      description: p.description || '', amount: p.amount || '',
      date: p.date ? new Date(p.date).toISOString().split('T')[0] : '',
      payment_mode: p.payment_mode || 'bank_transfer', reference_number: p.reference_number || '', party_name: p.party_name || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await paymentService.update(editId, { ...form, amount: parseFloat(form.amount) });
        toast.success('Payment updated');
      } else {
        await paymentService.create({ ...form, amount: parseFloat(form.amount) });
        toast.success('Payment recorded');
      }
      setShowForm(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
  };

  const handleDelete = async () => {
    try {
      await paymentService.delete(deleteId);
      toast.success('Payment deleted');
      setDeleteId(null); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const statCards = [
    { label: 'Total Income', value: summary.totalIncome, icon: ArrowUpRight, color: 'emerald', prefix: '₹' },
    { label: 'Total Expenses', value: summary.totalExpense, icon: ArrowDownRight, color: 'red', prefix: '₹' },
    { label: 'Net Profit', value: summary.profit, icon: TrendingUp, color: summary.profit >= 0 ? 'blue' : 'red', prefix: '₹' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2"><IndianRupee className="w-7 h-7 text-primary-600" /> Finance Dashboard</h1>
          <p className="text-sm text-surface-500 mt-1">Income, expenses, and profit tracking</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />Record Payment</button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map(card => (
          <div key={card.label} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-surface-500">{card.label}</p>
              <div className={`w-9 h-9 rounded-xl bg-${card.color}-100 dark:bg-${card.color}-900/20 flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 text-${card.color}-600`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${card.value < 0 ? 'text-red-600' : 'text-surface-900 dark:text-white'}`}>
              {card.prefix}{Math.abs(card.value).toLocaleString('en-IN')}
            </p>
          </div>
        ))}
      </div>

      {/* Category Breakdown */}
      {summary.byCategory?.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Category Breakdown</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {summary.byCategory.map((cat, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                <div>
                  <p className="text-xs text-surface-500">{cat._id?.category || 'Other'}</p>
                  <p className="text-xs text-surface-400">{cat._id?.type === 'income' ? 'Income' : 'Expense'}</p>
                </div>
                <p className={`text-sm font-bold ${cat._id?.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>₹{cat.total.toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter + Transactions */}
      <div className="flex items-center gap-2 mb-2">
        <Filter className="w-4 h-4 text-surface-400" />
        {['all', 'income', 'expense'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? 'bg-primary-600 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Transaction Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 dark:bg-surface-800/50">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-surface-500">Date</th>
                <th className="text-left p-3 text-xs font-semibold text-surface-500">Type</th>
                <th className="text-left p-3 text-xs font-semibold text-surface-500">Category</th>
                <th className="text-left p-3 text-xs font-semibold text-surface-500">Description</th>
                <th className="text-left p-3 text-xs font-semibold text-surface-500">Project</th>
                <th className="text-left p-3 text-xs font-semibold text-surface-500">Party</th>
                <th className="text-left p-3 text-xs font-semibold text-surface-500">Mode</th>
                <th className="text-right p-3 text-xs font-semibold text-surface-500">Amount</th>
                <th className="text-center p-3 text-xs font-semibold text-surface-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-8"><div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" /></td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-surface-500">No payments found</td></tr>
              ) : payments.map(p => (
                <tr key={p._id} className="hover:bg-surface-50 dark:hover:bg-surface-800/30">
                  <td className="p-3 text-surface-600 dark:text-surface-400">{formatDate(p.date)}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${p.type === 'income' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                      {p.type === 'income' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {p.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-surface-700 dark:text-surface-300">{p.category}</td>
                  <td className="p-3 text-surface-600 dark:text-surface-400 max-w-[200px] truncate">{p.description}</td>
                  <td className="p-3 text-surface-600 dark:text-surface-400">{p.project_id?.project_name || '-'}</td>
                  <td className="p-3 text-surface-600 dark:text-surface-400">{p.party_name || '-'}</td>
                  <td className="p-3 text-surface-500 text-xs">{p.payment_mode?.replace('_', ' ')}</td>
                  <td className={`p-3 text-right font-bold ${p.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {p.type === 'income' ? '+' : '-'}₹{p.amount?.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(p)} className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-primary-600" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteId(p._id)} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-600" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-surface-200 dark:border-surface-800">
              <h2 className="text-lg font-bold text-surface-900 dark:text-white">{editId ? 'Edit Payment' : 'Record Payment'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">Type *</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="input-field">
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div><label className="label-text">Date *</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="input-field" required /></div>
              </div>
              <div>
                <label className="label-text">Project</label>
                <select value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})} className="input-field">
                  <option value="">-- No Project --</option>
                  {projects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-text">Category *</label><input type="text" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input-field" required placeholder={form.type === 'income' ? 'Client Payment, Advance' : 'Material, Labour'} /></div>
                <div><label className="label-text">Amount (₹) *</label><input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="input-field" required min="0" step="0.01" /></div>
              </div>
              <div><label className="label-text">Description</label><input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-text">Party Name</label><input type="text" value={form.party_name} onChange={e => setForm({...form, party_name: e.target.value})} className="input-field" /></div>
                <div>
                  <label className="label-text">Payment Mode</label>
                  <select value={form.payment_mode} onChange={e => setForm({...form, payment_mode: e.target.value})} className="input-field">
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div><label className="label-text">Reference Number</label><input type="text" value={form.reference_number} onChange={e => setForm({...form, reference_number: e.target.value})} className="input-field" /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800">Cancel</button>
                <button type="submit" className="btn-primary">{editId ? 'Update Payment' : 'Record Payment'}</button>
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
            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">Delete Payment?</h3>
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
