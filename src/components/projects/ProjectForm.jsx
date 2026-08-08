import { useState } from 'react';

export default function ProjectForm({ onSubmit, initialData = {}, loading = false, submitLabel = 'Create Project' }) {
  const [form, setForm] = useState({
    project_name: initialData.project_name || '',
    client_name: initialData.client_name || '',
    location: initialData.location || '',
    description: initialData.description || '',
    budget: initialData.budget || '',
    start_date: initialData.start_date ? initialData.start_date.slice(0, 10) : '',
    expected_end_date: initialData.expected_end_date ? initialData.expected_end_date.slice(0, 10) : '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, budget: Number(form.budget) });
  };

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label-text">Project Name</label>
        <input type="text" value={form.project_name} onChange={(e) => update('project_name', e.target.value)} className="input-field" required id="project-name-input" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-text">Client Name</label>
          <input type="text" value={form.client_name} onChange={(e) => update('client_name', e.target.value)} className="input-field" required />
        </div>
        <div>
          <label className="label-text">Location</label>
          <input type="text" value={form.location} onChange={(e) => update('location', e.target.value)} className="input-field" />
        </div>
      </div>
      <div>
        <label className="label-text">Description</label>
        <textarea value={form.description} onChange={(e) => update('description', e.target.value)} className="input-field h-20 resize-none" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label-text">Budget (₹)</label>
          <input type="number" value={form.budget} onChange={(e) => update('budget', e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="label-text">Start Date</label>
          <input type="date" value={form.start_date} onChange={(e) => update('start_date', e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="label-text">Expected End</label>
          <input type="date" value={form.expected_end_date} onChange={(e) => update('expected_end_date', e.target.value)} className="input-field" />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="submit" disabled={loading} className="btn-primary" id="submit-project-form">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : submitLabel}
        </button>
      </div>
    </form>
  );
}
