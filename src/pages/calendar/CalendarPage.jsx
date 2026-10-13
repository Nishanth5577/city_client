import { useEffect, useState } from 'react';
import api from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Edit, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const EVENT_TYPES = ['meeting', 'deadline', 'holiday', 'reminder', 'milestone', 'other'];
const EVENT_COLORS = { meeting: '#0D9488', deadline: '#DC2626', holiday: '#7C3AED', reminder: '#D97706', milestone: '#059669', other: '#6b7280' };
const emptyForm = { title: '', description: '', start: '', end: '', type: 'meeting', color: '#0D9488', project_id: '' };

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });

  const fetchEvents = () => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();
    api.get('/api/calendar', { params: { start, end } }).then(r => setEvents(r.data || [])).catch(console.error);
  };

  useEffect(() => { fetchEvents(); }, [currentDate]);
  useEffect(() => { api.get('/api/projects', { params: { limit: 100 } }).then(r => setProjects(r.data.projects || [])).catch(() => {}); }, []);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  const goToday = () => setCurrentDate(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getEventsForDay = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(e => {
      const eventDate = new Date(e.start);
      return eventDate.getDate() === day && eventDate.getMonth() === date.getMonth() && eventDate.getFullYear() === date.getFullYear();
    });
  };

  const openCreate = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setEditId(null);
    setForm({ ...emptyForm, start: dateStr, end: dateStr });
    setShowModal(true);
  };

  const openEdit = (event) => {
    if (!event.editable) return;
    setEditId(event.id);
    setForm({
      title: event.title || '', description: event.description || '',
      start: event.start ? new Date(event.start).toISOString().split('T')[0] : '',
      end: event.end ? new Date(event.end).toISOString().split('T')[0] : '',
      type: event.type || 'other', color: event.color || '#0D9488',
      project_id: event.meta?.project_id || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.project_id) delete payload.project_id;
    try {
      if (editId) { await api.put(`/api/calendar/${editId}`, payload); toast.success('Event updated!'); }
      else { await api.post('/api/calendar', payload); toast.success('Event added!'); }
      setShowModal(false); fetchEvents();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/calendar/${deleteId}`);
      toast.success('Event deleted'); setDeleteId(null); fetchEvents();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Calendar</h1><p className="text-surface-500 mt-1">Project deadlines, task schedules & events</p></div>
        <div className="flex items-center gap-2">
          <button onClick={goToday} className="btn-ghost text-xs px-3 py-1.5">Today</button>
          <button onClick={prevMonth} className="btn-ghost p-2"><ChevronLeft className="w-5 h-5" /></button>
          <span className="text-lg font-semibold text-surface-900 dark:text-white min-w-[180px] text-center">{monthName}</span>
          <button onClick={nextMonth} className="btn-ghost p-2"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {[{ label: 'Project', color: '#0D9488' }, { label: 'Task', color: '#059669' }, { label: 'Deadline', color: '#DC2626' }, { label: 'Meeting', color: '#0D9488' }, { label: 'Holiday', color: '#7C3AED' }].map(l => (
          <span key={l.label} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />{l.label}</span>
        ))}
      </div>

      <div className="glass-card p-4">
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-surface-500 p-2">{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
          {days.map(day => {
            const dayEvents = getEventsForDay(day);
            const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
            const isSelected = selectedDay === day;
            return (
              <div
                key={day}
                onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                className={`min-h-[80px] p-1.5 rounded-xl border transition-colors cursor-pointer ${isToday ? 'border-primary-400 bg-primary-50/50 dark:bg-primary-900/10' : isSelected ? 'border-accent-400 bg-accent-50/50 dark:bg-accent-900/10' : 'border-transparent hover:bg-surface-100 dark:hover:bg-surface-800'}`}
              >
                <div className="flex items-center justify-between">
                  <p className={`text-xs font-medium ${isToday ? 'text-primary-600 font-bold' : 'text-surface-700 dark:text-surface-300'}`}>{day}</p>
                  <button onClick={(e) => { e.stopPropagation(); openCreate(day); }} className="p-0.5 rounded hover:bg-surface-200 dark:hover:bg-surface-700 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"><Plus className="w-3 h-3 text-surface-400" /></button>
                </div>
                {dayEvents.slice(0, 3).map(event => (
                  <div key={event.id} onClick={(e) => { e.stopPropagation(); if (event.editable) openEdit(event); }} className={`text-[10px] px-1.5 py-0.5 rounded mb-0.5 truncate ${event.editable ? 'cursor-pointer hover:opacity-80' : ''}`} style={{ backgroundColor: `${event.color}20`, color: event.color }} title={event.title}>
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && <p className="text-[10px] text-surface-400">+{dayEvents.length - 3} more</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Detail Panel */}
      {selectedDay && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-surface-900 dark:text-white">{currentDate.toLocaleString('default', { month: 'long' })} {selectedDay}, {currentDate.getFullYear()}</h3>
            <button onClick={() => openCreate(selectedDay)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"><Plus className="w-3 h-3" />Add Event</button>
          </div>
          {getEventsForDay(selectedDay).length === 0 ? (
            <p className="text-sm text-surface-400">No events on this day</p>
          ) : (
            <div className="space-y-2">
              {getEventsForDay(selectedDay).map(event => (
                <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800/50">
                  <div className="w-1 h-8 rounded-full" style={{ backgroundColor: event.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{event.title}</p>
                    <p className="text-xs text-surface-400">{event.type}{event.meta?.project ? ` • ${event.meta.project}` : ''}</p>
                  </div>
                  {event.editable && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(event)} className="p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-400 hover:text-primary-600"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteId(event.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="glass-card p-6 w-full max-w-md animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-surface-900 dark:text-white">{editId ? 'Edit Event' : 'Add Event'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="label-text">Title *</label><input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input-field" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-text">Start Date *</label><input type="date" value={form.start} onChange={e => setForm({...form, start: e.target.value})} className="input-field" required /></div>
                <div><label className="label-text">End Date</label><input type="date" value={form.end} onChange={e => setForm({...form, end: e.target.value})} className="input-field" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-text">Type</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value, color: EVENT_COLORS[e.target.value] || form.color})} className="select-field">{EVENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}</select></div>
                <div><label className="label-text">Color</label><input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="input-field h-10" /></div>
              </div>
              <div><label className="label-text">Project</label><select value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})} className="select-field"><option value="">-- None --</option>{projects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}</select></div>
              <div><label className="label-text">Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field h-16 resize-none" /></div>
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editId ? 'Update' : 'Add'} Event</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setDeleteId(null)}>
          <div className="glass-card p-6 w-full max-w-sm animate-scale-in text-center" onClick={e => e.stopPropagation()}>
            <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">Delete Event?</h3>
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
