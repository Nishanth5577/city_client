import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ClipboardCheck, Users, Calendar, CheckCircle, XCircle, Clock, Filter,
  ChevronLeft, ChevronRight, IndianRupee, Download, BarChart3, Loader2,
  CalendarDays, CalendarRange, Eye, TrendingUp, UserCheck,
} from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import workerService from '../../services/workerService';
import api from '../../services/api';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_STYLES = {
  present: { bg: 'rgba(16,185,129,0.15)', text: '#059669', border: 'rgba(16,185,129,0.2)', label: 'Present', short: 'P' },
  absent: { bg: 'rgba(239,68,68,0.15)', text: '#DC2626', border: 'rgba(220,38,38,0.12)', label: 'Absent', short: 'A' },
  half_day: { bg: 'rgba(245,158,11,0.15)', text: '#D97706', border: 'rgba(245,158,11,0.2)', label: 'Half Day', short: 'H' },
  overtime: { bg: 'rgba(59,130,246,0.15)', text: '#2563EB', border: 'rgba(59,130,246,0.2)', label: 'Overtime', short: 'OT' },
  leave: { bg: 'rgba(139,92,246,0.15)', text: '#c084fc', border: 'rgba(139,92,246,0.2)', label: 'Leave', short: 'L' },
};

const TABS = [
  { id: 'mark', label: 'Mark Attendance', icon: ClipboardCheck },
  { id: 'reports', label: 'Attendance Reports', icon: BarChart3 },
  { id: 'salary', label: 'Salary Report', icon: IndianRupee },
];

// ─── Helper: get days in month ───
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getWeekDates(date) {
  const d = new Date(date);
  const day = d.getDay();
  const start = new Date(d); start.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(start); dd.setDate(start.getDate() + i); return dd;
  });
}
function fmtShort(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}
function toYMD(d) { return new Date(d).toISOString().split('T')[0]; }

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState('mark');
  const [records, setRecords] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [markMode, setMarkMode] = useState(false);
  const [attendance, setAttendance] = useState({});
  const [workerFilter, setWorkerFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Report tab state
  const [reportView, setReportView] = useState('monthly'); // monthly | weekly | date | range
  const [reportMonth, setReportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [reportStartDate, setReportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportRecords, setReportRecords] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  // Salary tab state
  const [salaryMonth, setSalaryMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [salaryLoading, setSalaryLoading] = useState(false);

  // ─── Fetch workers & projects ───
  useEffect(() => {
    workerService.getAll({ limit: 200 }).then(r => setWorkers(r.data.workers || [])).catch(() => {});
    api.get('/api/projects', { params: { limit: 100 } }).then(r => setProjects(r.data.projects || [])).catch(() => {});
  }, []);

  // ─── Mark Tab: Fetch attendance for selected date ───
  const fetchMarkData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 500, date };
      if (workerFilter) params.worker_id = workerFilter;
      if (projectFilter) params.project_id = projectFilter;
      const res = await attendanceService.getAll(params);
      let recs = res.data.attendance || res.data.records || [];
      if (statusFilter) recs = recs.filter(r => r.status === statusFilter);
      setRecords(recs);
      const existing = {};
      recs.forEach(r => { existing[r.worker_id?._id || r.worker_id] = r.status; });
      setAttendance(existing);
    } catch { toast.error('Failed to load attendance'); }
    setLoading(false);
  }, [date, workerFilter, projectFilter, statusFilter]);

  useEffect(() => { if (activeTab === 'mark') fetchMarkData(); }, [fetchMarkData, activeTab]);

  // ─── Reports Tab: Fetch data based on view ───
  const fetchReportData = useCallback(async () => {
    setReportLoading(true);
    try {
      const params = { limit: 5000 };
      if (reportView === 'monthly') {
        const [y, m] = reportMonth.split('-');
        params.start_date = `${y}-${m}-01`;
        params.end_date = `${y}-${m}-${getDaysInMonth(parseInt(y), parseInt(m) - 1)}`;
      } else if (reportView === 'weekly') {
        const weekDates = getWeekDates(reportDate);
        params.start_date = toYMD(weekDates[0]);
        params.end_date = toYMD(weekDates[6]);
      } else if (reportView === 'date') {
        params.date = reportDate;
      } else if (reportView === 'range') {
        params.start_date = reportStartDate;
        params.end_date = reportEndDate;
      }
      if (workerFilter) params.worker_id = workerFilter;
      if (projectFilter) params.project_id = projectFilter;
      const res = await attendanceService.getAll(params);
      setReportRecords(res.data.attendance || res.data.records || []);
    } catch { toast.error('Failed to load report'); }
    setReportLoading(false);
  }, [reportView, reportMonth, reportDate, reportStartDate, reportEndDate, workerFilter, projectFilter]);

  useEffect(() => { if (activeTab === 'reports') fetchReportData(); }, [fetchReportData, activeTab]);

  // ─── Salary Tab: Fetch monthly data ───
  const fetchSalaryData = useCallback(async () => {
    setSalaryLoading(true);
    try {
      const [y, m] = salaryMonth.split('-');
      const params = {
        limit: 5000,
        start_date: `${y}-${m}-01`,
        end_date: `${y}-${m}-${getDaysInMonth(parseInt(y), parseInt(m) - 1)}`,
      };
      const res = await attendanceService.getAll(params);
      setSalaryRecords(res.data.attendance || res.data.records || []);
    } catch { toast.error('Failed to load salary data'); }
    setSalaryLoading(false);
  }, [salaryMonth]);

  useEffect(() => { if (activeTab === 'salary') fetchSalaryData(); }, [fetchSalaryData, activeTab]);

  // ─── Mark all attendance ───
  const handleMarkAll = async () => {
    try {
      const bulk = workers.filter(w => w.availability !== 'inactive').map(w => ({
        worker_id: w._id, status: attendance[w._id] || 'present',
        daily_wage: w.salary || 0,
        hours_worked: attendance[w._id] === 'half_day' ? 4 : attendance[w._id] === 'absent' || attendance[w._id] === 'leave' ? 0 : 8,
      }));
      await attendanceService.markBulk({ records: bulk, project_id: projectFilter || workers[0]?.assigned_project?._id || workers[0]?.assigned_project || null, date });
      toast.success(`Attendance marked for ${bulk.length} workers`);
      setMarkMode(false);
      fetchMarkData();
    } catch { toast.error('Failed to mark attendance'); }
  };

  // ─── Computed: Mark tab stats ───
  const presentCount = records.filter(r => r.status === 'present' || r.status === 'overtime').length;
  const absentCount = records.filter(r => r.status === 'absent').length;
  const halfDayCount = records.filter(r => r.status === 'half_day').length;
  const leaveCount = records.filter(r => r.status === 'leave').length;
  const totalWage = records.reduce((s, r) => s + (r.daily_wage || 0), 0);

  // ─── Computed: Reports — group by worker for calendar ───
  const reportByWorkerDate = useMemo(() => {
    const map = {};
    reportRecords.forEach(r => {
      const wId = r.worker_id?._id || r.worker_id;
      const wName = r.worker_id?.name || 'Unknown';
      const wSkill = r.worker_id?.skill || '';
      const dateKey = toYMD(r.date);
      if (!map[wId]) map[wId] = { name: wName, skill: wSkill, dates: {} };
      map[wId].dates[dateKey] = r.status;
    });
    return map;
  }, [reportRecords]);

  // ─── Computed: Salary — group by worker ───
  const salaryByWorker = useMemo(() => {
    const map = {};
    salaryRecords.forEach(r => {
      const wId = r.worker_id?._id || r.worker_id;
      const wName = r.worker_id?.name || 'Unknown';
      const wSkill = r.worker_id?.skill || '';
      if (!map[wId]) map[wId] = {
        name: wName, skill: wSkill, present: 0, absent: 0, half_day: 0, leave: 0, overtime: 0,
        totalHours: 0, totalWage: 0, dailyRate: 0,
      };
      const entry = map[wId];
      entry[r.status] = (entry[r.status] || 0) + 1;
      entry.totalHours += r.hours_worked || 0;
      entry.totalWage += r.daily_wage || 0;
      if (r.daily_wage > entry.dailyRate) entry.dailyRate = r.daily_wage;
    });
    // Calculate effective working days and salary
    Object.values(map).forEach(w => {
      w.workingDays = w.present + w.overtime;
      w.effectiveDays = w.workingDays + (w.half_day * 0.5);
      w.calculatedSalary = w.totalWage;
      w.totalDays = w.present + w.absent + w.half_day + w.leave + w.overtime;
    });
    return Object.entries(map).sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [salaryRecords]);

  const grandTotalSalary = salaryByWorker.reduce((s, [, w]) => s + w.calculatedSalary, 0);

  // ─── Export CSV ───
  const exportCSV = (data, filename) => {
    const csv = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportSalaryCSV = () => {
    const rows = [['Worker', 'Skill', 'Present', 'Absent', 'Half Day', 'Leave', 'OT', 'Working Days', 'Total Hours', 'Daily Rate', 'Total Salary']];
    salaryByWorker.forEach(([, w]) => {
      rows.push([w.name, w.skill, w.present, w.absent, w.half_day, w.leave, w.overtime, w.effectiveDays, w.totalHours, w.dailyRate, w.calculatedSalary]);
    });
    rows.push(['', '', '', '', '', '', '', '', '', 'GRAND TOTAL', grandTotalSalary]);
    exportCSV(rows, `salary_report_${salaryMonth}.csv`);
    toast.success('Salary report exported');
  };

  const exportReportCSV = () => {
    const rows = [['Worker', 'Skill', 'Date', 'Status', 'Hours', 'Wage']];
    reportRecords.forEach(r => {
      rows.push([r.worker_id?.name || '', r.worker_id?.skill || '', toYMD(r.date), r.status, r.hours_worked || 0, r.daily_wage || 0]);
    });
    exportCSV(rows, `attendance_report.csv`);
    toast.success('Report exported');
  };

  // ─── Month calendar dates ───
  const monthDates = useMemo(() => {
    if (reportView !== 'monthly') return [];
    const [y, m] = reportMonth.split('-').map(Number);
    const days = getDaysInMonth(y, m - 1);
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(y, m - 1, i + 1);
      return { date: toYMD(d), day: i + 1, dayName: d.toLocaleDateString('en-IN', { weekday: 'short' }), isSunday: d.getDay() === 0 };
    });
  }, [reportMonth, reportView]);

  // ─── Week dates ───
  const weekDates = useMemo(() => {
    if (reportView !== 'weekly') return [];
    return getWeekDates(reportDate).map(d => ({
      date: toYMD(d), day: d.getDate(),
      dayName: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      isSunday: d.getDay() === 0,
    }));
  }, [reportDate, reportView]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-600/30">
              <ClipboardCheck className="w-5 h-5 text-white" />
            </div>
            Attendance Management
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>Track, review, and manage workforce attendance & salary</p>
        </div>
      </div>

      {/* ═══ Tabs ═══ */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--glass)' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center"
              style={{
                background: active ? 'var(--accent)' : 'transparent',
                color: active ? '#fff' : 'var(--t3)',
                boxShadow: active ? '0 4px 12px rgba(13,148,136,0.3)' : 'none',
              }}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TAB 1: MARK ATTENDANCE                                 */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'mark' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* Date + Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field" style={{ width: 180 }} />
            <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="select-field" style={{ minWidth: 180 }}>
              <option value="">All Projects</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}
            </select>
            <div className="ml-auto flex gap-2">
              {!markMode ? (
                <button onClick={() => setMarkMode(true)} className="btn-primary flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4" /> Mark Attendance
                </button>
              ) : (
                <>
                  <button onClick={handleMarkAll} className="btn-primary flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Save All
                  </button>
                  <button onClick={() => setMarkMode(false)} className="btn-secondary">Cancel</button>
                </>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
            {[
              { label: 'Total', value: records.length, color: '#0D9488', icon: Users },
              { label: 'Present', value: presentCount, color: '#059669', icon: CheckCircle },
              { label: 'Absent', value: absentCount, color: '#DC2626', icon: XCircle },
              { label: 'Half Day', value: halfDayCount, color: '#D97706', icon: Clock },
              { label: 'Leave', value: leaveCount, color: '#7C3AED', icon: Calendar },
            ].map(s => (
              <div key={s.label} className="metric-card flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                  <s.icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--t4)' }}>{s.label}</p>
                  <p className="text-xl font-bold" style={{ color: 'var(--t1)' }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Wage Banner */}
          {totalWage > 0 && (
            <div className="cinematic-card p-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.08), rgba(10,17,24,0.8))' }}>
              <div>
                <p className="text-xs" style={{ color: 'var(--t4)' }}>Total Daily Wages</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>₹{totalWage.toLocaleString('en-IN')}</p>
              </div>
              <IndianRupee className="w-8 h-8" style={{ color: 'var(--accent)', opacity: 0.2 }} />
            </div>
          )}

          {/* Attendance Table */}
          <div className="cinematic-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <th className="text-left p-3 text-xs font-semibold" style={{ color: 'var(--t4)' }}>Worker</th>
                    <th className="text-left p-3 text-xs font-semibold" style={{ color: 'var(--t4)' }}>Skill</th>
                    <th className="text-left p-3 text-xs font-semibold" style={{ color: 'var(--t4)' }}>Project</th>
                    <th className="text-center p-3 text-xs font-semibold" style={{ color: 'var(--t4)' }}>Status</th>
                    {!markMode && <th className="text-center p-3 text-xs font-semibold" style={{ color: 'var(--t4)' }}>Hours</th>}
                    {!markMode && <th className="text-right p-3 text-xs font-semibold" style={{ color: 'var(--t4)' }}>Wage</th>}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: 'var(--accent)' }} /></td></tr>
                  ) : markMode ? (
                    workers.filter(w => w.availability !== 'inactive').map(w => (
                      <tr key={w._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td className="p-3 font-medium text-sm" style={{ color: 'var(--t1)' }}>{w.name}</td>
                        <td className="p-3 text-xs" style={{ color: 'var(--t3)' }}>{w.skill}</td>
                        <td className="p-3 text-xs" style={{ color: 'var(--t3)' }}>{w.assigned_project?.project_name || '-'}</td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            {['present', 'absent', 'half_day', 'leave'].map(status => {
                              const isActive = attendance[w._id] === status;
                              const s = STATUS_STYLES[status];
                              return (
                                <button key={status} onClick={() => setAttendance(prev => ({ ...prev, [w._id]: status }))}
                                  className="px-2 py-1 rounded-lg text-[10px] font-semibold transition-all"
                                  style={{
                                    background: isActive ? s.bg : 'var(--glass)',
                                    color: isActive ? s.text : 'var(--t3)',
                                    border: `1px solid ${isActive ? s.border : 'var(--glass-hover)'}`,
                                  }}
                                >
                                  {s.label.toUpperCase()}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : records.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10" style={{ color: 'var(--t4)' }}>No attendance records for {formatDate(date)}</td></tr>
                  ) : records.map(r => {
                    const s = STATUS_STYLES[r.status] || STATUS_STYLES.present;
                    return (
                      <tr key={r._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td className="p-3 font-medium text-sm" style={{ color: 'var(--t1)' }}>{r.worker_id?.name || '-'}</td>
                        <td className="p-3 text-xs" style={{ color: 'var(--t3)' }}>{r.worker_id?.skill || '-'}</td>
                        <td className="p-3 text-xs" style={{ color: 'var(--t3)' }}>{r.project_id?.project_name || '-'}</td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
                            {s.label.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-center text-xs" style={{ color: 'var(--t3)' }}>{r.hours_worked}h</td>
                        <td className="p-3 text-right font-medium text-xs" style={{ color: 'var(--accent)' }}>₹{r.daily_wage?.toLocaleString('en-IN') || 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TAB 2: ATTENDANCE REPORTS                               */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'reports' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* View Switcher + Filters */}
          <div className="cinematic-card p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
              {/* View mode buttons */}
              <div>
                <label className="label-text">View</label>
                <div className="flex gap-1">
                  {[
                    { id: 'monthly', label: 'Monthly', icon: CalendarDays },
                    { id: 'weekly', label: 'Weekly', icon: CalendarRange },
                    { id: 'date', label: 'Date', icon: Calendar },
                    { id: 'range', label: 'Date Range', icon: CalendarRange },
                  ].map(v => (
                    <button key={v.id} onClick={() => setReportView(v.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: reportView === v.id ? 'var(--accent)' : 'var(--glass)',
                        color: reportView === v.id ? '#fff' : 'var(--t3)',
                      }}
                    >
                      <v.icon className="w-3.5 h-3.5" /> {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date inputs based on view */}
              <div className="flex gap-3 flex-wrap">
                {reportView === 'monthly' && (
                  <div>
                    <label className="label-text">Month</label>
                    <input type="month" value={reportMonth} onChange={e => setReportMonth(e.target.value)} className="input-field" />
                  </div>
                )}
                {reportView === 'weekly' && (
                  <div>
                    <label className="label-text">Week of</label>
                    <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="input-field" />
                  </div>
                )}
                {reportView === 'date' && (
                  <div>
                    <label className="label-text">Date</label>
                    <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="input-field" />
                  </div>
                )}
                {reportView === 'range' && (
                  <>
                    <div>
                      <label className="label-text">From</label>
                      <input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="label-text">To</label>
                      <input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} className="input-field" />
                    </div>
                  </>
                )}
                <div>
                  <label className="label-text">Worker</label>
                  <select value={workerFilter} onChange={e => setWorkerFilter(e.target.value)} className="select-field" style={{ minWidth: 160 }}>
                    <option value="">All Workers</option>
                    {workers.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                  </select>
                </div>
              </div>

              <button onClick={exportReportCSV} className="btn-secondary flex items-center gap-2 ml-auto">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>

          {/* Report Content */}
          {reportLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} /></div>
          ) : reportRecords.length === 0 ? (
            <div className="cinematic-card p-12 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--t5)' }} />
              <p className="text-sm" style={{ color: 'var(--t4)' }}>No attendance records found for the selected period</p>
            </div>
          ) : (reportView === 'monthly' || reportView === 'weekly') ? (
            /* ── Calendar Grid View ── */
            <div className="cinematic-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <th className="text-left p-2 font-semibold sticky left-0" style={{ color: 'var(--t4)', background: 'var(--card)', minWidth: 140, zIndex: 2 }}>Worker</th>
                      {(reportView === 'monthly' ? monthDates : weekDates).map(d => (
                        <th key={d.date} className="text-center p-1.5 font-medium" style={{
                          color: d.isSunday ? '#DC2626' : 'var(--t4)', minWidth: 36,
                          background: d.isSunday ? 'rgba(220,38,38,0.04)' : undefined,
                        }}>
                          <div>{d.dayName}</div>
                          <div className="font-bold">{d.day}</div>
                        </th>
                      ))}
                      <th className="text-center p-2 font-semibold" style={{ color: '#059669', minWidth: 32 }}>P</th>
                      <th className="text-center p-2 font-semibold" style={{ color: '#DC2626', minWidth: 32 }}>A</th>
                      <th className="text-center p-2 font-semibold" style={{ color: '#D97706', minWidth: 32 }}>H</th>
                      <th className="text-center p-2 font-semibold" style={{ color: '#7C3AED', minWidth: 32 }}>L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(reportByWorkerDate).map(([wId, w]) => {
                      const dates = reportView === 'monthly' ? monthDates : weekDates;
                      let pCount = 0, aCount = 0, hCount = 0, lCount = 0;
                      dates.forEach(d => {
                        const st = w.dates[d.date];
                        if (st === 'present' || st === 'overtime') pCount++;
                        else if (st === 'absent') aCount++;
                        else if (st === 'half_day') hCount++;
                        else if (st === 'leave') lCount++;
                      });
                      return (
                        <tr key={wId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td className="p-2 font-medium sticky left-0" style={{ color: 'var(--t1)', background: 'var(--card)', zIndex: 1 }}>
                            <div>{w.name}</div>
                            <div className="text-[10px]" style={{ color: 'var(--t5)' }}>{w.skill}</div>
                          </td>
                          {dates.map(d => {
                            const st = w.dates[d.date];
                            const s = st ? STATUS_STYLES[st] : null;
                            return (
                              <td key={d.date} className="text-center p-1" style={{ background: d.isSunday ? 'rgba(220,38,38,0.04)' : undefined }}>
                                {s ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md text-[9px] font-bold"
                                    style={{ background: s.bg, color: s.text }}
                                    title={`${w.name} - ${d.date} - ${s.label}`}
                                  >
                                    {s.short}
                                  </span>
                                ) : d.isSunday ? (
                                  <span className="text-[9px]" style={{ color: 'var(--t5)' }}>—</span>
                                ) : null}
                              </td>
                            );
                          })}
                          <td className="text-center p-1 font-bold" style={{ color: '#059669' }}>{pCount}</td>
                          <td className="text-center p-1 font-bold" style={{ color: '#DC2626' }}>{aCount}</td>
                          <td className="text-center p-1 font-bold" style={{ color: '#D97706' }}>{hCount}</td>
                          <td className="text-center p-1 font-bold" style={{ color: '#7C3AED' }}>{lCount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ── List View (for date / range) ── */
            <div className="cinematic-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <th className="text-left p-3 text-xs font-semibold" style={{ color: 'var(--t4)' }}>Worker</th>
                      <th className="text-left p-3 text-xs font-semibold" style={{ color: 'var(--t4)' }}>Skill</th>
                      <th className="text-left p-3 text-xs font-semibold" style={{ color: 'var(--t4)' }}>Project</th>
                      <th className="text-left p-3 text-xs font-semibold" style={{ color: 'var(--t4)' }}>Date</th>
                      <th className="text-center p-3 text-xs font-semibold" style={{ color: 'var(--t4)' }}>Status</th>
                      <th className="text-center p-3 text-xs font-semibold" style={{ color: 'var(--t4)' }}>Hours</th>
                      <th className="text-right p-3 text-xs font-semibold" style={{ color: 'var(--t4)' }}>Wage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportRecords.map(r => {
                      const s = STATUS_STYLES[r.status] || STATUS_STYLES.present;
                      return (
                        <tr key={r._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td className="p-3 font-medium" style={{ color: 'var(--t1)' }}>{r.worker_id?.name || '-'}</td>
                          <td className="p-3 text-xs" style={{ color: 'var(--t3)' }}>{r.worker_id?.skill || '-'}</td>
                          <td className="p-3 text-xs" style={{ color: 'var(--t3)' }}>{r.project_id?.project_name || '-'}</td>
                          <td className="p-3 text-xs" style={{ color: 'var(--t3)' }}>{formatDate(r.date)}</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: s.bg, color: s.text }}>{s.label}</span>
                          </td>
                          <td className="p-3 text-center text-xs" style={{ color: 'var(--t3)' }}>{r.hours_worked}h</td>
                          <td className="p-3 text-right text-xs font-medium" style={{ color: 'var(--accent)' }}>₹{(r.daily_wage || 0).toLocaleString('en-IN')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Summary stats for report */}
          {reportRecords.length > 0 && (
            <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
              {[
                { label: 'Total Records', value: reportRecords.length, color: '#0D9488' },
                { label: 'Present', value: reportRecords.filter(r => r.status === 'present' || r.status === 'overtime').length, color: '#059669' },
                { label: 'Absent', value: reportRecords.filter(r => r.status === 'absent').length, color: '#DC2626' },
                { label: 'Half Day', value: reportRecords.filter(r => r.status === 'half_day').length, color: '#D97706' },
                { label: 'Total Wages', value: `₹${reportRecords.reduce((s, r) => s + (r.daily_wage || 0), 0).toLocaleString('en-IN')}`, color: '#0D9488', isCurrency: true },
              ].map(s => (
                <div key={s.label} className="metric-card p-3 text-center">
                  <p className="text-xs mb-1" style={{ color: 'var(--t4)' }}>{s.label}</p>
                  <p className={`font-bold ${s.isCurrency ? 'text-lg' : 'text-2xl'}`} style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TAB 3: SALARY REPORT                                   */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'salary' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* Month Selector */}
          <div className="cinematic-card p-4 flex flex-col sm:flex-row items-start sm:items-end gap-4 justify-between">
            <div className="flex gap-4 items-end">
              <div>
                <label className="label-text">Salary Month</label>
                <input type="month" value={salaryMonth} onChange={e => setSalaryMonth(e.target.value)} className="input-field" />
              </div>
              <div className="flex items-center gap-2 pb-1">
                <span className="text-xs font-medium" style={{ color: 'var(--t4)' }}>{salaryByWorker.length} workers</span>
              </div>
            </div>
            <button onClick={exportSalaryCSV} className="btn-primary flex items-center gap-2">
              <Download className="w-4 h-4" /> Export Salary CSV
            </button>
          </div>

          {/* Grand Total Banner */}
          {grandTotalSalary > 0 && (
            <div className="cinematic-card p-5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.1), rgba(10,17,24,0.9))' }}>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--t4)' }}>Total Salary Payable — {reportMonth || salaryMonth}</p>
                <p className="text-3xl font-bold mt-1" style={{ color: 'var(--accent)' }}>₹{grandTotalSalary.toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: 'var(--t5)' }}>{salaryByWorker.length} workers</p>
                <p className="text-xs" style={{ color: 'var(--t5)' }}>{salaryRecords.length} attendance records</p>
              </div>
            </div>
          )}

          {/* Salary Table */}
          {salaryLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} /></div>
          ) : salaryByWorker.length === 0 ? (
            <div className="cinematic-card p-12 text-center">
              <IndianRupee className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--t5)' }} />
              <p className="text-sm" style={{ color: 'var(--t4)' }}>No salary data for the selected month</p>
            </div>
          ) : (
            <div className="cinematic-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <th className="text-left p-3 text-xs font-semibold" style={{ color: 'var(--t4)' }}>Worker</th>
                      <th className="text-left p-3 text-xs font-semibold" style={{ color: 'var(--t4)' }}>Skill</th>
                      <th className="text-center p-3 text-xs font-semibold" style={{ color: '#059669' }}>Present</th>
                      <th className="text-center p-3 text-xs font-semibold" style={{ color: '#DC2626' }}>Absent</th>
                      <th className="text-center p-3 text-xs font-semibold" style={{ color: '#D97706' }}>Half Day</th>
                      <th className="text-center p-3 text-xs font-semibold" style={{ color: '#7C3AED' }}>Leave</th>
                      <th className="text-center p-3 text-xs font-semibold" style={{ color: 'var(--t4)' }}>Effective Days</th>
                      <th className="text-center p-3 text-xs font-semibold" style={{ color: 'var(--t4)' }}>Total Hours</th>
                      <th className="text-right p-3 text-xs font-semibold" style={{ color: 'var(--t4)' }}>Daily Rate</th>
                      <th className="text-right p-3 text-xs font-semibold" style={{ color: 'var(--accent)' }}>Total Salary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryByWorker.map(([wId, w]) => (
                      <tr key={wId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td className="p-3 font-medium" style={{ color: 'var(--t1)' }}>{w.name}</td>
                        <td className="p-3 text-xs" style={{ color: 'var(--t3)' }}>{w.skill}</td>
                        <td className="p-3 text-center font-medium" style={{ color: '#059669' }}>{w.present}</td>
                        <td className="p-3 text-center font-medium" style={{ color: '#DC2626' }}>{w.absent}</td>
                        <td className="p-3 text-center font-medium" style={{ color: '#D97706' }}>{w.half_day}</td>
                        <td className="p-3 text-center font-medium" style={{ color: '#7C3AED' }}>{w.leave}</td>
                        <td className="p-3 text-center font-medium" style={{ color: 'var(--t2)' }}>{w.effectiveDays}</td>
                        <td className="p-3 text-center text-xs" style={{ color: 'var(--t3)' }}>{w.totalHours}h</td>
                        <td className="p-3 text-right text-xs" style={{ color: 'var(--t3)' }}>₹{w.dailyRate.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right font-bold" style={{ color: 'var(--accent)' }}>₹{w.calculatedSalary.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {/* Grand Total Row */}
                    <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--glass)' }}>
                      <td colSpan={6} className="p-3 font-bold text-right" style={{ color: 'var(--t2)' }}>GRAND TOTAL</td>
                      <td className="p-3 text-center font-bold" style={{ color: 'var(--t2)' }}>
                        {salaryByWorker.reduce((s, [, w]) => s + w.effectiveDays, 0)}
                      </td>
                      <td className="p-3 text-center font-bold" style={{ color: 'var(--t2)' }}>
                        {salaryByWorker.reduce((s, [, w]) => s + w.totalHours, 0)}h
                      </td>
                      <td className="p-3"></td>
                      <td className="p-3 text-right font-bold text-lg" style={{ color: 'var(--accent)' }}>
                        ₹{grandTotalSalary.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
