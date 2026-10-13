import { useState, useEffect } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { Truck, Plus, Search, Star, Phone, Mail, MapPin, Edit, Trash2, X, Package } from 'lucide-react';
import supplierService from '../../services/supplierService';
import toast from 'react-hot-toast';

const RATING_LABELS = ['Not Rated', 'Bad', 'Moderate', 'Good'];
const RATING_COLORS = [
  'text-surface-400',
  'text-red-500',
  'text-amber-500',
  'text-emerald-500',
];
const RATING_BG = [
  '',
  'bg-red-50 dark:bg-red-900/20',
  'bg-amber-50 dark:bg-amber-900/20',
  'bg-emerald-50 dark:bg-emerald-900/20',
];
const RATING_FILL_COLORS = [
  'text-surface-300',
  'text-red-400 fill-red-400',
  'text-amber-400 fill-amber-400',
  'text-emerald-400 fill-emerald-400',
];

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ company_name: '', contact_person: '', phone: '', email: '', materials_supplied: '', gst_number: '', rating: 0, address: { street: '', city: '', state: '', zip: '' }, notes: '' });

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const { data } = await supplierService.getAll({ search: debouncedSearch, limit: 50 });
      setSuppliers(data.suppliers);
    } catch (err) { toast.error('Failed to load suppliers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSuppliers(); }, [debouncedSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, materials_supplied: typeof form.materials_supplied === 'string' ? form.materials_supplied.split(',').map(s => s.trim()).filter(Boolean) : form.materials_supplied };
      if (editId) { await supplierService.update(editId, payload); toast.success('Supplier updated'); }
      else { await supplierService.create(payload); toast.success('Supplier added'); }
      setShowForm(false); setEditId(null); resetForm(); fetchSuppliers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
  };

  const handleEdit = (s) => {
    setForm({ company_name: s.company_name, contact_person: s.contact_person || '', phone: s.phone || '', email: s.email || '', materials_supplied: (s.materials_supplied || []).join(', '), gst_number: s.gst_number || '', rating: s.rating || 0, address: s.address || { street: '', city: '', state: '', zip: '' }, notes: s.notes || '' });
    setEditId(s._id); setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this supplier?')) return;
    try { await supplierService.delete(id); toast.success('Deleted'); fetchSuppliers(); }
    catch (err) { toast.error('Failed to delete'); }
  };

  const resetForm = () => setForm({ company_name: '', contact_person: '', phone: '', email: '', materials_supplied: '', gst_number: '', rating: 0, address: { street: '', city: '', state: '', zip: '' }, notes: '' });

  const renderStars = (rating) => {
    const r = Math.round(rating);
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 3 }, (_, i) => (
            <Star key={i} className={`w-3.5 h-3.5 ${i < r ? RATING_FILL_COLORS[r] : 'text-surface-300 dark:text-surface-600'}`} />
          ))}
        </div>
        {r > 0 && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${RATING_BG[r]} ${RATING_COLORS[r]}`}>
            {RATING_LABELS[r]}
          </span>
        )}
      </div>
    );
  };

  const RatingPicker = ({ value, onChange }) => (
    <div className="space-y-2">
      <label className="label-text">Rating</label>
      <div className="flex items-center gap-3">
        {[1, 2, 3].map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onChange(value === level ? 0 : level)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 transition-all text-xs font-semibold ${
              value === level
                ? level === 1
                  ? 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 shadow-sm'
                  : level === 2
                  ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'border-surface-200 dark:border-surface-700 text-surface-500 hover:border-surface-300 dark:hover:border-surface-600'
            }`}
          >
            <div className="flex items-center gap-0.5">
              {Array.from({ length: level }, (_, i) => (
                <Star key={i} className={`w-3 h-3 ${
                  value === level
                    ? level === 1 ? 'text-red-400 fill-red-400' : level === 2 ? 'text-amber-400 fill-amber-400' : 'text-emerald-400 fill-emerald-400'
                    : 'text-surface-400'
                }`} />
              ))}
            </div>
            {RATING_LABELS[level]}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2"><Truck className="w-7 h-7 text-primary-600" /> Supplier Management</h1>
          <p className="text-sm text-surface-500 mt-1">{suppliers.length} suppliers registered</p>
        </div>
        <button onClick={() => { resetForm(); setEditId(null); setShowForm(true); }} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Supplier</button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input type="text" placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
      </div>

      {/* Supplier Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-16 text-surface-500"><Truck className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>No suppliers found</p></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {suppliers.map(s => (
            <div key={s._id} className="glass-card p-5 hover:shadow-lg transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center"><Truck className="w-5 h-5 text-primary-600" /></div>
                  <div>
                    <h3 className="font-semibold text-surface-900 dark:text-white text-sm">{s.company_name}</h3>
                    {s.contact_person && <p className="text-xs text-surface-500">{s.contact_person}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(s)} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"><Edit className="w-3.5 h-3.5 text-surface-500" /></button>
                  <button onClick={() => handleDelete(s._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-surface-600 dark:text-surface-400">
                {s.phone && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {s.phone}</p>}
                {s.email && <p className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {s.email}</p>}
                {s.address?.city && <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {s.address.city}, {s.address.state}</p>}
              </div>
              {s.materials_supplied?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {s.materials_supplied.map((m, i) => <span key={i} className="px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-[10px] rounded-full font-medium flex items-center gap-1"><Package className="w-2.5 h-2.5" />{m}</span>)}
                </div>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-100 dark:border-surface-800">
                {renderStars(s.rating)}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : s.status === 'blacklisted' ? 'bg-red-100 text-red-700' : 'bg-surface-100 text-surface-600'}`}>{s.status?.toUpperCase()}</span>
              </div> 
              {s.gst_number && <p className="text-[10px] text-surface-400 mt-1">GST: {s.gst_number}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-surface-200 dark:border-surface-800">
              <h2 className="text-lg font-bold text-surface-900 dark:text-white">{editId ? 'Edit' : 'Add'} Supplier</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div><label className="label-text">Company Name *</label><input type="text" value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} className="input-field" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-text">Contact Person</label><input type="text" value={form.contact_person} onChange={e => setForm({...form, contact_person: e.target.value})} className="input-field" /></div>
                <div><label className="label-text">Phone</label><input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input-field" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-text">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field" /></div>
                <div><label className="label-text">GST Number</label><input type="text" value={form.gst_number} onChange={e => setForm({...form, gst_number: e.target.value})} className="input-field" /></div>
              </div>
              <div><label className="label-text">Materials Supplied (comma separated)</label><input type="text" value={form.materials_supplied} onChange={e => setForm({...form, materials_supplied: e.target.value})} className="input-field" placeholder="Cement, Steel, Sand" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-text">City</label><input type="text" value={form.address.city} onChange={e => setForm({...form, address: {...form.address, city: e.target.value}})} className="input-field" /></div>
                <div><label className="label-text">State</label><input type="text" value={form.address.state} onChange={e => setForm({...form, address: {...form.address, state: e.target.value}})} className="input-field" /></div>
              </div>
              <RatingPicker value={form.rating} onChange={(val) => setForm({...form, rating: val})} />
              <div><label className="label-text">Notes</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="input-field" rows={2} /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800">Cancel</button>
                <button type="submit" className="btn-primary">{editId ? 'Update' : 'Add'} Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
