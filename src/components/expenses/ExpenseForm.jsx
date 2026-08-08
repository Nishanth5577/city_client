import { useState } from 'react';

export default function ExpenseForm({ onSubmit, projects = [], initialData = {}, loading = false, submitLabel = 'Add Expense' }) {
  const [form, setForm] = useState({
    project_id: initialData.project_id || '',
    category: initialData.category || 'material',
    description: initialData.description || '',
    amount: initialData.amount || '',
    date: initialData.date ? initialData.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, amount: Number(form.amount) });
  };

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-text">Project</label>
          <select value={form.project_id} onChange={(e) => update('project_id', e.target.value)} className="select-field" required>
            <option value="">Select Project</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}
          </select>
        </div>
        <div>
          <label className="label-text">Category</label>
          <select value={form.category} onChange={(e) => update('category', e.target.value)} className="select-field">
            <option value="material">Material</option>
            <option value="labor">Labor</option>
            <option value="equipment">Equipment</option>
            <option value="transport">Transport</option>
            <option value="overhead">Overhead</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label-text">Description</label>
        <input type="text" value={form.description} onChange={(e) => update('description', e.target.value)} className="input-field" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-text">Amount (₹)</label>
          <input type="number" value={form.amount} onChange={(e) => update('amount', e.target.value)} className="input-field" required min="0" />
        </div>
        <div>
          <label className="label-text">Date</label>
          <input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} className="input-field" />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : submitLabel}
        </button>
      </div>
    </form>
  );
}
