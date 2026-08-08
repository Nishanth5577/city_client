import { useEffect, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import api from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import { Package, Wrench, AlertTriangle, Plus, Search, Edit, Trash2, X } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const emptyMaterial = { material_name: '', category: '', supplier: '', quantity: '', unit: '', cost: '', low_stock_threshold: '10', project_id: '' };
const emptyEquipment = { equipment_name: '', type: '', condition: 'good', cost_per_day: '', availability: 'available', assigned_project: '', registration_number: '', manufacturer: '' };

export default function ResourcesPage() {
  const [tab, setTab] = useState('materials');
  const [materials, setMaterials] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, type: 'material'|'equipment' }
  const [matForm, setMatForm] = useState({ ...emptyMaterial });
  const [eqForm, setEqForm] = useState({ ...emptyEquipment });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [matRes, eqRes, projRes] = await Promise.all([
        api.get('/api/materials', { params: { search: debouncedSearch } }),
        api.get('/api/equipment', { params: { search: debouncedSearch } }),
        api.get('/api/projects', { params: { limit: 100 } }),
      ]);
      setMaterials(matRes.data.materials || []);
      setEquipment(eqRes.data.equipment || []);
      setProjects(projRes.data.projects || []);
    } catch { toast.error('Failed to load resources'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [debouncedSearch]);

  // --- MATERIAL CRUD ---
  const openCreateMaterial = () => { setEditId(null); setMatForm({ ...emptyMaterial }); setShowModal(true); };
  const openEditMaterial = (m) => {
    setEditId(m._id);
    setMatForm({
      material_name: m.material_name || '', category: m.category || '', supplier: m.supplier || '',
      quantity: m.quantity || '', unit: m.unit || '', cost: m.cost || '',
      low_stock_threshold: m.low_stock_threshold || '10', project_id: m.project_id?._id || m.project_id || '',
    });
    setShowModal(true);
  };
  const handleMaterialSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...matForm, quantity: Number(matForm.quantity), cost: Number(matForm.cost), low_stock_threshold: Number(matForm.low_stock_threshold) };
    try {
      if (editId) { await api.put(`/api/materials/${editId}`, payload); toast.success('Material updated!'); }
      else { await api.post('/api/materials', payload); toast.success('Material added!'); }
      setShowModal(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
  };

  // --- EQUIPMENT CRUD ---
  const openCreateEquipment = () => { setEditId(null); setEqForm({ ...emptyEquipment }); setShowModal(true); };
  const openEditEquipment = (eq) => {
    setEditId(eq._id);
    setEqForm({
      equipment_name: eq.equipment_name || '', type: eq.type || '', condition: eq.condition || 'good',
      cost_per_day: eq.cost_per_day || '', availability: eq.availability || 'available',
      assigned_project: eq.assigned_project?._id || eq.assigned_project || '',
      registration_number: eq.registration_number || '', manufacturer: eq.manufacturer || '',
    });
    setShowModal(true);
  };
  const handleEquipmentSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...eqForm, cost_per_day: Number(eqForm.cost_per_day) };
    if (!payload.assigned_project) delete payload.assigned_project;
    try {
      if (editId) { await api.put(`/api/equipment/${editId}`, payload); toast.success('Equipment updated!'); }
      else { await api.post('/api/equipment', payload); toast.success('Equipment added!'); }
      setShowModal(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
  };

  // --- DELETE ---
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { id, type } = deleteTarget;
    try {
      await api.delete(`/api/${type === 'material' ? 'materials' : 'equipment'}/${id}`);
      toast.success(`${type === 'material' ? 'Material' : 'Equipment'} deleted`);
      setDeleteTarget(null); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  if (loading && materials.length === 0 && equipment.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="page-title">Resources</h1><p className="text-surface-500 mt-1">Materials & Equipment Management</p></div>
        <button onClick={() => tab === 'materials' ? openCreateMaterial() : openCreateEquipment()} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />Add {tab === 'materials' ? 'Material' : 'Equipment'}</button>
      </div>

      <div className="flex gap-2">
        {[{ id: 'materials', label: `Materials (${materials.length})`, icon: Package }, { id: 'equipment', label: `Equipment (${equipment.length})`, icon: Wrench }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" /><input type="text" placeholder={`Search ${tab}...`} value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" /></div>

      {/* MATERIALS TAB */}
      {tab === 'materials' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map(mat => (
            <div key={mat._id} className="glass-card p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-surface-900 dark:text-white truncate">{mat.material_name}</h3>
                {mat.available_stock <= mat.low_stock_threshold && <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
              </div>
              <p className="text-sm text-surface-500 mb-3">{mat.category} • {mat.supplier}</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><p className="text-xs text-surface-400">Total</p><p className="font-bold text-surface-900 dark:text-white">{mat.quantity}</p></div>
                <div><p className="text-xs text-surface-400">Available</p><p className={`font-bold ${mat.available_stock <= mat.low_stock_threshold ? 'text-red-500' : 'text-emerald-600'}`}>{mat.available_stock}</p></div>
                <div><p className="text-xs text-surface-400">Used</p><p className="font-bold text-surface-900 dark:text-white">{mat.used_stock}</p></div>
              </div>
              <div className="mt-3 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full" style={{ width: `${mat.quantity > 0 ? (mat.available_stock / mat.quantity) * 100 : 0}%` }} />
              </div>
              <p className="text-xs text-surface-500 mt-2">{mat.unit} • {formatCurrency(mat.cost)} per unit</p>
              {/* Actions */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
                <p className="flex-1 text-xs text-surface-400 truncate">{mat.project_id?.project_name || 'No project'}</p>
                <button onClick={() => openEditMaterial(mat)} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 hover:text-primary-600" title="Edit"><Edit className="w-4 h-4" /></button>
                <button onClick={() => setDeleteTarget({ id: mat._id, type: 'material' })} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-500 hover:text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {materials.length === 0 && <div className="col-span-full flex flex-col items-center py-16 text-surface-400"><Package className="w-16 h-16 mb-4 opacity-30" /><p>No materials found</p></div>}
        </div>
      )}

      {/* EQUIPMENT TAB */}
      {tab === 'equipment' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipment.map(eq => (
            <div key={eq._id} className="glass-card p-5">
              <h3 className="font-semibold text-surface-900 dark:text-white">{eq.equipment_name}</h3>
              <p className="text-sm text-surface-500 mt-1">{eq.type} • {eq.condition}</p>
              <div className="flex items-center justify-between mt-3">
                <span className={`badge ${eq.availability === 'available' ? 'badge-success' : eq.availability === 'in_use' ? 'badge-info' : 'badge-warning'}`}>{eq.availability?.replace('_', ' ')}</span>
                <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{formatCurrency(eq.cost_per_day)}/day</span>
              </div>
              {eq.assigned_project && <p className="text-xs text-surface-400 mt-2">Project: {eq.assigned_project?.project_name || eq.assigned_project}</p>}
              {eq.registration_number && <p className="text-xs text-surface-400">Reg: {eq.registration_number}</p>}
              {/* Actions */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
                <div className="flex-1" />
                <button onClick={() => openEditEquipment(eq)} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 hover:text-primary-600" title="Edit"><Edit className="w-4 h-4" /></button>
                <button onClick={() => setDeleteTarget({ id: eq._id, type: 'equipment' })} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-500 hover:text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {equipment.length === 0 && <div className="col-span-full flex flex-col items-center py-16 text-surface-400"><Wrench className="w-16 h-16 mb-4 opacity-30" /><p>No equipment found</p></div>}
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-surface-900 dark:text-white">{editId ? 'Edit' : 'Add'} {tab === 'materials' ? 'Material' : 'Equipment'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"><X className="w-5 h-5" /></button>
            </div>

            {tab === 'materials' ? (
              <form onSubmit={handleMaterialSubmit} className="space-y-4">
                <div><label className="label-text">Project *</label><select value={matForm.project_id} onChange={(e) => setMatForm({ ...matForm, project_id: e.target.value })} className="select-field" required><option value="">Select project...</option>{projects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}</select></div>
                <div><label className="label-text">Material Name *</label><input type="text" value={matForm.material_name} onChange={(e) => setMatForm({ ...matForm, material_name: e.target.value })} className="input-field" required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label-text">Category</label><input type="text" value={matForm.category} onChange={(e) => setMatForm({ ...matForm, category: e.target.value })} className="input-field" placeholder="Cement, Steel..." /></div>
                  <div><label className="label-text">Supplier</label><input type="text" value={matForm.supplier} onChange={(e) => setMatForm({ ...matForm, supplier: e.target.value })} className="input-field" /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="label-text">Quantity *</label><input type="number" value={matForm.quantity} onChange={(e) => setMatForm({ ...matForm, quantity: e.target.value })} className="input-field" required min="0" /></div>
                  <div><label className="label-text">Unit</label><input type="text" value={matForm.unit} onChange={(e) => setMatForm({ ...matForm, unit: e.target.value })} className="input-field" placeholder="kg, bags..." /></div>
                  <div><label className="label-text">Cost/Unit (₹)</label><input type="number" value={matForm.cost} onChange={(e) => setMatForm({ ...matForm, cost: e.target.value })} className="input-field" min="0" /></div>
                </div>
                <div><label className="label-text">Low Stock Threshold</label><input type="number" value={matForm.low_stock_threshold} onChange={(e) => setMatForm({ ...matForm, low_stock_threshold: e.target.value })} className="input-field" min="0" /></div>
                <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editId ? 'Update' : 'Add'}</button></div>
              </form>
            ) : (
              <form onSubmit={handleEquipmentSubmit} className="space-y-4">
                <div><label className="label-text">Equipment Name *</label><input type="text" value={eqForm.equipment_name} onChange={(e) => setEqForm({ ...eqForm, equipment_name: e.target.value })} className="input-field" required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label-text">Type</label><input type="text" value={eqForm.type} onChange={(e) => setEqForm({ ...eqForm, type: e.target.value })} className="input-field" placeholder="Excavator, Crane..." /></div>
                  <div><label className="label-text">Manufacturer</label><input type="text" value={eqForm.manufacturer} onChange={(e) => setEqForm({ ...eqForm, manufacturer: e.target.value })} className="input-field" /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="label-text">Condition</label><select value={eqForm.condition} onChange={(e) => setEqForm({ ...eqForm, condition: e.target.value })} className="select-field"><option value="new">New</option><option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option></select></div>
                  <div><label className="label-text">Cost/Day (₹)</label><input type="number" value={eqForm.cost_per_day} onChange={(e) => setEqForm({ ...eqForm, cost_per_day: e.target.value })} className="input-field" min="0" /></div>
                  <div><label className="label-text">Availability</label><select value={eqForm.availability} onChange={(e) => setEqForm({ ...eqForm, availability: e.target.value })} className="select-field"><option value="available">Available</option><option value="in_use">In Use</option><option value="maintenance">Maintenance</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label-text">Assigned Project</label><select value={eqForm.assigned_project} onChange={(e) => setEqForm({ ...eqForm, assigned_project: e.target.value })} className="select-field"><option value="">-- None --</option>{projects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}</select></div>
                  <div><label className="label-text">Reg. Number</label><input type="text" value={eqForm.registration_number} onChange={(e) => setEqForm({ ...eqForm, registration_number: e.target.value })} className="input-field" /></div>
                </div>
                <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editId ? 'Update' : 'Add'}</button></div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setDeleteTarget(null)}>
          <div className="glass-card p-6 w-full max-w-sm animate-scale-in text-center" onClick={e => e.stopPropagation()}>
            <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">Delete {deleteTarget.type === 'material' ? 'Material' : 'Equipment'}?</h3>
            <p className="text-sm text-surface-500 mb-4">This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 font-medium text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
