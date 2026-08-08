import { useState } from 'react';

export default function TaskForm({ onSubmit, projects = [], workers = [], initialData = {}, loading = false, submitLabel = 'Create Task' }) {
  const [form, setForm] = useState({
    task_name: initialData.task_name || '',
    description: initialData.description || '',
    project_id: initialData.project_id || '',
    assigned_worker: initialData.assigned_worker || '',
    priority: initialData.priority || 'medium',
    start_date: initialData.start_date ? initialData.start_date.slice(0, 10) : '',
    end_date: initialData.end_date ? initialData.end_date.slice(0, 10) : '',
    status: initialData.status || 'pending',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label-text">Task Name</label>
        <input type="text" value={form.task_name} onChange={(e) => update('task_name', e.target.value)} className="input-field" required />
      </div>
      <div>
        <label className="label-text">Description</label>
        <textarea value={form.description} onChange={(e) => update('description', e.target.value)} className="input-field h-20 resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-text">Project</label>
          <select value={form.project_id} onChange={(e) => update('project_id', e.target.value)} className="select-field" required>
            <option value="">Select Project</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}
          </select>
        </div>
        <div>
          <label className="label-text">Priority</label>
          <select value={form.priority} onChange={(e) => update('priority', e.target.value)} className="select-field">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-text">Start Date</label>
          <input type="date" value={form.start_date} onChange={(e) => update('start_date', e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="label-text">End Date</label>
          <input type="date" value={form.end_date} onChange={(e) => update('end_date', e.target.value)} className="input-field" />
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
