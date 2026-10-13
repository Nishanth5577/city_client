import { useState, useEffect } from 'react';
import api from '../../services/api';
import { IndianRupee, Plus, ArrowUpRight, ArrowDownRight, TrendingUp, Filter, X, Edit, Trash2 } from 'lucide-react';
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

  const STAT_CARDS = [
    { label: 'Total Income', value: summary.totalIncome, icon: ArrowUpRight, color: '#059669' },
    { label: 'Total Expenses', value: summary.totalExpense, icon: ArrowDownRight, color: '#DC2626' },
    { label: 'Net Profit', value: summary.profit, icon: TrendingUp, color: summary.profit >= 0 ? '#0D9488' : '#DC2626' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2"><IndianRupee className="w-7 h-7" style={{ color: 'var(--accent)' }} /> Finance Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>Income, expenses, and profit tracking</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />Record Payment</button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {STAT_CARDS.map(card => (
          <div key={card.label} className="metric-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs" style={{ color: 'var(--t3)' }}>{card.label}</p>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${card.color}15`, border: `1px solid ${card.color}20` }}>
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: card.value < 0 ? '#DC2626' : 'var(--t1)' }}>
              ₹{Math.abs(card.value).toLocaleString('en-IN')}
            </p>
          </div>
        ))}
      </div>

      {/* Category Breakdown */}
      {summary.byCategory?.length > 0 && (
        <div className="cinematic-card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--t1)' }}>Category Breakdown</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {summary.byCategory.map((cat, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--glass-hover)' }}>
                <div>
                  <p className="text-xs" style={{ color: 'var(--t3)' }}>{cat._id?.category || 'Other'}</p>
                  <p className="text-xs" style={{ color: 'var(--t4)' }}>{cat._id?.type === 'income' ? 'Income' : 'Expense'}</p>
                </div>
                <p className="text-sm font-bold" style={{ color: cat._id?.type === 'income' ? '#059669' : '#DC2626' }}>₹{cat.total.toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2 mb-2">
        <Filter className="w-4 h-4" style={{ color: 'var(--t4)' }} />
        {['all', 'income', 'expense'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: filter === f ? 'rgba(37,99,235,0.08)' : 'var(--glass)',
              color: filter === f ? '#D97706' : 'var(--t3)',
              border: `1px solid ${filter === f ? 'rgba(212, 136, 42, 0.2)' : 'var(--glass-hover)'}`,
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Transaction Table */}
      <div className="cinematic-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Date', 'Type', 'Category', 'Description', 'Project', 'Party', 'Mode', 'Amount', ''].map((h, i) => (
                  <th key={i} className={`${i === 7 ? 'text-right' : i === 8 ? 'text-center' : 'text-left'} p-3 text-xs font-semibold`} style={{ color: 'var(--t4)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-8"><div className="w-6 h-6 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} /></td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8" style={{ color: 'var(--t4)' }}>No payments found</td></tr>
              ) : payments.map(p => (
                <tr
                  key={p._id}
                  className="transition-colors"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--glass)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td className="p-3 text-xs" style={{ color: 'var(--t3)' }}>{formatDate(p.date)}</td>
                  <td className="p-3">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{
                        background: p.type === 'income' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: p.type === 'income' ? '#059669' : '#DC2626',
                        border: `1px solid ${p.type === 'income' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(220,38,38,0.12)'}`,
                      }}
                    >
                      {p.type === 'income' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {p.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-xs" style={{ color: 'var(--t3)' }}>{p.category}</td>
                  <td className="p-3 text-xs max-w-[200px] truncate" style={{ color: 'var(--t3)' }}>{p.description}</td>
                  <td className="p-3 text-xs" style={{ color: 'var(--t3)' }}>{p.project_id?.project_name || '-'}</td>
                  <td className="p-3 text-xs" style={{ color: 'var(--t3)' }}>{p.party_name || '-'}</td>
                  <td className="p-3 text-xs capitalize" style={{ color: 'var(--t4)' }}>{p.payment_mode?.replace('_', ' ')}</td>
                  <td className="p-3 text-right font-bold text-xs" style={{ color: p.type === 'income' ? '#059669' : '#DC2626' }}>
                    {p.type === 'income' ? '+' : '-'}₹{p.amount?.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(p)} className="p-1 rounded-lg transition-colors" style={{ color: 'var(--t3)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.color = 'var(--accent)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t3)'; }}
                        title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteId(p._id)} className="p-1 rounded-lg transition-colors" style={{ color: 'var(--t3)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.color = '#DC2626'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t3)'; }}
                        title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }} onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 24px 64px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--t1)' }}>{editId ? 'Edit Payment' : 'Record Payment'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg" style={{ color: 'var(--t3)' }}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-text">Type *</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="select-field"><option value="income">Income</option><option value="expense">Expense</option></select></div>
                <div><label className="label-text">Date *</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="input-field" required /></div>
              </div>
              <div><label className="label-text">Project</label><select value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})} className="select-field"><option value="">-- No Project --</option>{projects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-text">Category *</label><input type="text" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input-field" required placeholder={form.type === 'income' ? 'Client Payment, Advance' : 'Material, Labour'} /></div>
                <div><label className="label-text">Amount (₹) *</label><input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="input-field" required min="0" step="0.01" /></div>
              </div>
              <div><label className="label-text">Description</label><input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-text">Party Name</label><input type="text" value={form.party_name} onChange={e => setForm({...form, party_name: e.target.value})} className="input-field" /></div>
                <div><label className="label-text">Payment Mode</label><select value={form.payment_mode} onChange={e => setForm({...form, payment_mode: e.target.value})} className="select-field"><option value="bank_transfer">Bank Transfer</option><option value="cheque">Cheque</option><option value="cash">Cash</option><option value="upi">UPI</option><option value="other">Other</option></select></div>
              </div>
              <div><label className="label-text">Reference Number</label><input type="text" value={form.reference_number} onChange={e => setForm({...form, reference_number: e.target.value})} className="input-field" /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editId ? 'Update Payment' : 'Record Payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }} onClick={() => setDeleteId(null)}>
          <div className="w-full max-w-sm p-6 rounded-2xl animate-scale-in text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 24px 64px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <Trash2 className="w-12 h-12 mx-auto mb-3" style={{ color: '#DC2626' }} />
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--t1)' }}>Delete Payment?</h3>
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
