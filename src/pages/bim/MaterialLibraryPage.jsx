import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMaterials } from '../../redux/slices/bimSlice';
import bimService from '../../services/bimService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, Search, Plus, Edit3, Trash2, Loader2, Package,
  IndianRupee, Shield, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const CATEGORY_LABELS = {
  concrete: 'Concrete', steel: 'Steel', brick: 'Brick', granite: 'Granite',
  marble: 'Marble', tile: 'Tile', wood: 'Wood', glass: 'Glass', paint: 'Paint',
  pvc: 'PVC', aluminium: 'Aluminium', cement: 'Cement', sand: 'Sand',
  aggregate: 'Aggregate', plaster: 'Plaster', waterproofing: 'Waterproofing',
  insulation: 'Insulation', roofing: 'Roofing', flooring: 'Flooring', cladding: 'Cladding',
};

export default function MaterialLibraryPage() {
  const dispatch = useDispatch();
  const { materials, materialsLoading } = useSelector(s => s.bim);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [form, setForm] = useState({
    name: '', category: 'concrete', unit: 'sqm', cost_per_unit: 0,
    density: 0, compressive_strength: 0, tensile_strength: 0,
    thermal_conductivity: 0, fire_rating: 'none', color: '#808080',
    roughness: 0.5, metalness: 0, opacity: 1,
    specifications: { grade: '', standard: '', size: '', finish: '' },
  });

  useEffect(() => { dispatch(fetchMaterials({})); }, [dispatch]);

  const filtered = materials.filter(m => {
    if (categoryFilter && m.category !== categoryFilter) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const categories = [...new Set(materials.map(m => m.category))].sort();

  const handleSeed = async () => {
    setSeeding(true);
    try { await bimService.seedMaterials(); dispatch(fetchMaterials({})); toast.success('Default materials seeded successfully'); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to seed materials'); }
    setSeeding(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await bimService.updateMaterial(editing._id, form); toast.success('Material updated'); }
      else { await bimService.createMaterial(form); toast.success('Material created'); }
      dispatch(fetchMaterials({})); setShowForm(false); setEditing(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save material'); }
  };

  const handleEdit = (mat) => {
    setForm({
      name: mat.name, category: mat.category, unit: mat.unit,
      cost_per_unit: mat.cost_per_unit, density: mat.density,
      compressive_strength: mat.compressive_strength, tensile_strength: mat.tensile_strength,
      thermal_conductivity: mat.thermal_conductivity, fire_rating: mat.fire_rating,
      color: mat.color, roughness: mat.roughness, metalness: mat.metalness,
      opacity: mat.opacity ?? 1,
      specifications: mat.specifications || { grade: '', standard: '', size: '', finish: '' },
    });
    setEditing(mat); setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material?')) return;
    try { await bimService.deleteMaterial(id); dispatch(fetchMaterials({})); toast.success('Material deleted'); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ name: '', category: 'concrete', unit: 'sqm', cost_per_unit: 0, density: 0, compressive_strength: 0, tensile_strength: 0, thermal_conductivity: 0, fire_rating: 'none', color: '#808080', roughness: 0.5, metalness: 0, opacity: 1, specifications: { grade: '', standard: '', size: '', finish: '' } });
    setShowForm(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0d9488, #0891B2)', boxShadow: '0 6px 20px rgba(37,99,235, 0.3)' }}>
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="page-title">Material Library</h1>
            <p className="text-sm" style={{ color: 'var(--t3)' }}>{materials.length} materials in catalog</p>
          </div>
        </div>
        <div className="flex gap-2">
          {materials.length === 0 && (
            <button onClick={handleSeed} disabled={seeding} className="btn-secondary flex items-center gap-2">
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />} Seed Defaults
            </button>
          )}
          <button onClick={resetForm} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Material</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--t3)' }} />
          <input type="text" placeholder="Search materials..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="select-field w-48">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>)}
        </select>
      </div>

      {/* Material Grid */}
      {materialsLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((mat, i) => (
            <motion.div key={mat._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="cinematic-card p-4 group transition-all duration-200"
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              {/* Color swatch + name */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ backgroundColor: mat.color, border: '1px solid var(--border)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }} />
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--t1)' }}>{mat.name}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: 'rgba(37,99,235,0.08)', color: '#1D4ED8', border: '1px solid rgba(37,99,235,0.12)' }}>
                    {CATEGORY_LABELS[mat.category] || mat.category}
                  </span>
                </div>
              </div>

              {/* Properties */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                  <IndianRupee className="w-3 h-3" />
                  <span>{mat.cost_per_unit}/{mat.unit}</span>
                </div>
                {mat.density > 0 && <div style={{ color: 'var(--t3)' }}>ρ: {mat.density} kg/m³</div>}
                {mat.compressive_strength > 0 && <div style={{ color: 'var(--t3)' }}>σc: {mat.compressive_strength} MPa</div>}
                {mat.fire_rating && mat.fire_rating !== 'none' && (
                  <div className="flex items-center gap-1" style={{ color: '#EA580C' }}>
                    <Shield className="w-3 h-3" /> {mat.fire_rating}
                  </div>
                )}
              </div>

              {/* 3D preview bar */}
              <div className="flex items-center gap-2 text-[10px] mb-3" style={{ color: 'var(--t4)' }}>
                <span>R: {(mat.roughness ?? 0).toFixed(1)}</span>
                <span>M: {(mat.metalness ?? 0).toFixed(1)}</span>
                <span>O: {(mat.opacity ?? 1).toFixed(1)}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(mat)} className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1">
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
                {!mat.is_default && (
                  <button onClick={() => handleDelete(mat._id)} className="px-3 py-1.5 rounded-lg text-xs transition-colors" style={{ color: '#DC2626', border: '1px solid rgba(220,38,38,0.12)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="max-w-lg w-full p-6 rounded-2xl max-h-[85vh] overflow-y-auto"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 24px 64px rgba(0, 0, 0, 0.12)' }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: 'var(--t1)' }}>{editing ? 'Edit Material' : 'Add Material'}</h2>
                <button onClick={() => setShowForm(false)} className="p-1 rounded-lg" style={{ color: 'var(--t3)' }}><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className="label-text">Name *</label><input className="input-field" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div><label className="label-text">Category</label><select className="select-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                  <div><label className="label-text">Unit</label><select className="select-field" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>{['sqm','sqft','cum','cuft','nos','kg','ton','rft','bag','litre','cft'].map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                  <div><label className="label-text">Cost per unit (₹)</label><input className="input-field" type="number" min="0" step="0.01" value={form.cost_per_unit} onChange={e => setForm({ ...form, cost_per_unit: Number(e.target.value) })} /></div>
                  <div><label className="label-text">Density (kg/m³)</label><input className="input-field" type="number" min="0" value={form.density} onChange={e => setForm({ ...form, density: Number(e.target.value) })} /></div>
                  <div><label className="label-text">Compressive Str. (MPa)</label><input className="input-field" type="number" min="0" value={form.compressive_strength} onChange={e => setForm({ ...form, compressive_strength: Number(e.target.value) })} /></div>
                  <div><label className="label-text">Thermal Conductivity</label><input className="input-field" type="number" min="0" step="0.001" value={form.thermal_conductivity} onChange={e => setForm({ ...form, thermal_conductivity: Number(e.target.value) })} /></div>
                  <div><label className="label-text">Fire Rating</label><select className="select-field" value={form.fire_rating} onChange={e => setForm({ ...form, fire_rating: e.target.value })}>{['none','30min','60min','90min','120min','180min','240min'].map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                  <div>
                    <label className="label-text">Color</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-10 h-8 rounded border-0 cursor-pointer" />
                      <input className="input-field flex-1 font-mono text-xs" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* 3D Rendering Properties */}
                <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <h4 className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--t4)' }}>3D Rendering</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className="label-text">Roughness</label><input className="input-field" type="number" min="0" max="1" step="0.05" value={form.roughness} onChange={e => setForm({ ...form, roughness: Number(e.target.value) })} /></div>
                    <div><label className="label-text">Metalness</label><input className="input-field" type="number" min="0" max="1" step="0.05" value={form.metalness} onChange={e => setForm({ ...form, metalness: Number(e.target.value) })} /></div>
                    <div><label className="label-text">Opacity</label><input className="input-field" type="number" min="0" max="1" step="0.05" value={form.opacity} onChange={e => setForm({ ...form, opacity: Number(e.target.value) })} /></div>
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
