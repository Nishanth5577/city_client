import { useState } from 'react';

export default function WorkerForm({ onSubmit, projects = [], initialData = {}, loading = false, submitLabel = 'Add Worker' }) {
  const [form, setForm] = useState({
    name: initialData.name || '',
    skill: initialData.skill || '',
    experience: initialData.experience || '',
    salary: initialData.salary || '',
    phone: initialData.phone || '',
    assigned_project: initialData.assigned_project || '',
    availability: initialData.availability || 'available',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, experience: Number(form.experience), salary: Number(form.salary) });
  };

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label-text">Full Name</label>
        <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} className="input-field" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-text">Skill / Trade</label>
          <input type="text" value={form.skill} onChange={(e) => update('skill', e.target.value)} className="input-field" placeholder="e.g., Mason, Electrician" />
        </div>
        <div>
          <label className="label-text">Experience (years)</label>
          <input type="number" value={form.experience} onChange={(e) => update('experience', e.target.value)} className="input-field" min="0" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-text">Salary (₹)</label>
          <input type="number" value={form.salary} onChange={(e) => update('salary', e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="label-text">Phone</label>
          <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} className="input-field" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-text">Assign to Project</label>
          <select value={form.assigned_project} onChange={(e) => update('assigned_project', e.target.value)} className="select-field">
            <option value="">Unassigned</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}
          </select>
        </div>
        <div>
          <label className="label-text">Availability</label>
          <select value={form.availability} onChange={(e) => update('availability', e.target.value)} className="select-field">
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
            <option value="on_leave">On Leave</option>
          </select>
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
