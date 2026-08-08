import { useState, useEffect } from 'react';
import { ClipboardCheck, Users, Calendar, CheckCircle, XCircle, Clock, Search, Filter, Download } from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import workerService from '../../services/workerService';
import api from '../../services/api';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function AttendancePage() {
  const [records, setRecords] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [markMode, setMarkMode] = useState(false);
  const [attendance, setAttendance] = useState({});
  // Filters
  const [workerFilter, setWorkerFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = { limit: 200 };
      // Use either date or month filter
      if (monthFilter) {
        const [y, m] = monthFilter.split('-');
        params.month = m; params.year = y;
      } else {
        params.date = date;
      }
      if (workerFilter) params.worker_id = workerFilter;
      if (projectFilter) params.project_id = projectFilter;

      const [attRes, workRes] = await Promise.all([
        attendanceService.getAll(params),
        workerService.getAll({ limit: 200 }),
      ]);
      let recs = attRes.data.records || [];
      if (statusFilter) recs = recs.filter(r => r.status === statusFilter);
      setRecords(recs);
      setWorkers(workRes.data.workers || []);
      // Pre-fill attendance from existing records
      const existing = {};
      recs.forEach(r => { existing[r.worker_id?._id || r.worker_id] = r.status; });
      setAttendance(existing);
    } catch (err) { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [date, workerFilter, projectFilter, monthFilter, statusFilter]);
  useEffect(() => { api.get('/api/projects', { params: { limit: 100 } }).then(r => setProjects(r.data.projects || [])).catch(() => {}); }, []);

  const handleMarkAll = async () => {
    try {
      const bulk = workers.filter(w => w.availability !== 'inactive').map(w => ({
        worker_id: w._id,
        status: attendance[w._id] || 'present',
        daily_wage: w.salary || 0,
        hours_worked: attendance[w._id] === 'half_day' ? 4 : attendance[w._id] === 'absent' ? 0 : 8,
      }));
      await attendanceService.markBulk({ records: bulk, project_id: projectFilter || workers[0]?.assigned_project || null, date });
      toast.success(`Attendance marked for ${bulk.length} workers`);
      setMarkMode(false);
      fetchData();
    } catch (err) { toast.error('Failed to mark attendance'); }
  };

  const statusColors = {
    present: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    absent: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    half_day: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    overtime: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    leave: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  };

  const statusIcons = { present: CheckCircle, absent: XCircle, half_day: Clock, overtime: Clock, leave: Calendar };

  // Summary stats
  const presentCount = records.filter(r => r.status === 'present' || r.status === 'overtime').length;
  const absentCount = records.filter(r => r.status === 'absent').length;
  const halfDayCount = records.filter(r => r.status === 'half_day').length;
  const leaveCount = records.filter(r => r.status === 'leave').length;
  const totalWage = records.reduce((s, r) => s + (r.daily_wage || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2"><ClipboardCheck className="w-7 h-7 text-primary-600" /> Attendance Management</h1>
          <p className="text-sm text-surface-500 mt-1">Daily workforce attendance tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={date} onChange={e => { setDate(e.target.value); setMonthFilter(''); }} className="input-field" />
          {!markMode ? (
            <button onClick={() => setMarkMode(true)} className="btn-primary flex items-center gap-2"><ClipboardCheck className="w-4 h-4" /> Mark Attendance</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleMarkAll} className="btn-primary flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Save All</button>
              <button onClick={() => setMarkMode(false)} className="px-3 py-2 rounded-xl text-sm bg-surface-100 dark:bg-surface-800 hover:bg-surface-200">Cancel</button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3"><Filter className="w-4 h-4 text-surface-400" /><span className="text-sm font-semibold text-surface-500 uppercase tracking-wider">Filters</span></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="label-text">Worker</label>
            <select value={workerFilter} onChange={e => setWorkerFilter(e.target.value)} className="select-field">
              <option value="">All Workers</option>
              {workers.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label-text">Project</label>
            <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="select-field">
              <option value="">All Projects</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label-text">Month</label>
            <input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label-text">Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select-field">
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="half_day">Half Day</option>
              <option value="leave">Leave</option>
              <option value="overtime">Overtime</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <div className="glass-card p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div><div><p className="text-xs text-surface-500">Records</p><p className="text-xl font-bold text-surface-900 dark:text-white">{records.length}</p></div></div>
        <div className="glass-card p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-emerald-600" /></div><div><p className="text-xs text-surface-500">Present</p><p className="text-xl font-bold text-emerald-600">{presentCount}</p></div></div>
        <div className="glass-card p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center"><XCircle className="w-5 h-5 text-red-600" /></div><div><p className="text-xs text-surface-500">Absent</p><p className="text-xl font-bold text-red-600">{absentCount}</p></div></div>
        <div className="glass-card p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center"><Clock className="w-5 h-5 text-amber-600" /></div><div><p className="text-xs text-surface-500">Half Day</p><p className="text-xl font-bold text-amber-600">{halfDayCount}</p></div></div>
        <div className="glass-card p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center"><Calendar className="w-5 h-5 text-purple-600" /></div><div><p className="text-xs text-surface-500">Leave</p><p className="text-xl font-bold text-purple-600">{leaveCount}</p></div></div>
      </div>

      {/* Total Wage Banner */}
      {totalWage > 0 && (
        <div className="glass-card p-4 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/10 dark:to-accent-900/10">
          <p className="text-sm text-surface-500">Total Daily Wages</p>
          <p className="text-2xl font-bold text-surface-900 dark:text-white">₹{totalWage.toLocaleString('en-IN')}</p>
        </div>
      )}

      {/* Attendance Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 dark:bg-surface-800/50">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-surface-500">Worker</th>
                <th className="text-left p-3 text-xs font-semibold text-surface-500">Skill</th>
                <th className="text-left p-3 text-xs font-semibold text-surface-500">Project</th>
                <th className="text-center p-3 text-xs font-semibold text-surface-500">Status</th>
                {!markMode && <th className="text-center p-3 text-xs font-semibold text-surface-500">Hours</th>}
                {!markMode && <th className="text-right p-3 text-xs font-semibold text-surface-500">Wage</th>}
                {!markMode && <th className="text-left p-3 text-xs font-semibold text-surface-500">Date</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8"><div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" /></td></tr>
              ) : markMode ? (
                workers.filter(w => w.availability !== 'inactive').map(w => (
                  <tr key={w._id} className="hover:bg-surface-50 dark:hover:bg-surface-800/30">
                    <td className="p-3 font-medium text-surface-900 dark:text-white">{w.name}</td>
                    <td className="p-3 text-surface-500">{w.skill}</td>
                    <td className="p-3 text-surface-500">{w.assigned_project?.project_name || '-'}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        {['present', 'absent', 'half_day', 'leave'].map(status => (
                          <button key={status} onClick={() => setAttendance(prev => ({...prev, [w._id]: status}))}
                            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${attendance[w._id] === status ? statusColors[status] : 'bg-surface-100 dark:bg-surface-800 text-surface-500'}`}>
                            {status.replace('_', ' ').toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-surface-500">No attendance records for {monthFilter || formatDate(date)}</td></tr>
              ) : records.map(r => {
                const StatusIcon = statusIcons[r.status] || Clock;
                return (
                  <tr key={r._id} className="hover:bg-surface-50 dark:hover:bg-surface-800/30">
                    <td className="p-3 font-medium text-surface-900 dark:text-white">{r.worker_id?.name || '-'}</td>
                    <td className="p-3 text-surface-500">{r.worker_id?.skill || '-'}</td>
                    <td className="p-3 text-surface-500">{r.project_id?.project_name || '-'}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[r.status]}`}>
                        <StatusIcon className="w-3 h-3" /> {r.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-center text-surface-600 dark:text-surface-400">{r.hours_worked}h</td>
                    <td className="p-3 text-right font-medium text-surface-700 dark:text-surface-300">₹{r.daily_wage?.toLocaleString('en-IN') || 0}</td>
                    <td className="p-3 text-surface-500 text-xs">{formatDate(r.date)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
