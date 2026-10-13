import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ICON_COLORS = { 'project-pdf': '#DC2626', 'expense-pdf': '#D97706', 'workers-excel': '#059669', 'materials-excel': '#0D9488' };

export default function ReportsPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [downloading, setDownloading] = useState('');

  useEffect(() => { api.get('/api/projects').then(r => { const p = r.data.projects || []; setProjects(p); if (p.length > 0) setSelectedProject(p[0]._id); }).catch(() => {}); }, []);

  const downloadReport = async (url, filename, key) => {
    setDownloading(key);
    try {
      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast.success(`${filename} downloaded!`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to generate report'); }
    finally { setDownloading(''); }
  };

  const reportCards = [
    { key: 'project-pdf', icon: FileText, title: 'Project Report (PDF)', desc: 'Comprehensive project report with tasks and expense summary', action: () => selectedProject && downloadReport(`/api/reports/project/${selectedProject}`, `project_report.pdf`, 'project-pdf'), disabled: !selectedProject },
    { key: 'expense-pdf', icon: FileText, title: 'Expense Report (PDF)', desc: 'Detailed expense breakdown by project and category', action: () => { let url = '/api/reports/expenses?'; if (selectedProject) url += `project_id=${selectedProject}&`; if (startDate) url += `start_date=${startDate}&`; if (endDate) url += `end_date=${endDate}&`; downloadReport(url, 'expense_report.pdf', 'expense-pdf'); }, disabled: false },
    { key: 'workers-excel', icon: FileSpreadsheet, title: 'Workers Report (Excel)', desc: 'Complete worker data with attendance and salary details', action: () => downloadReport('/api/reports/workers/excel', 'workers_report.xlsx', 'workers-excel'), disabled: false },
    { key: 'materials-excel', icon: FileSpreadsheet, title: 'Materials Report (Excel)', desc: 'Material inventory with stock levels and supplier information', action: () => downloadReport('/api/reports/materials/excel', 'materials_report.xlsx', 'materials-excel'), disabled: false },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="page-title">Reports</h1><p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>Generate and download reports with live data</p></div>

      {/* Filters */}
      <div className="cinematic-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--t4)' }}>Report Filters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><label className="label-text">Project</label><select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="select-field"><option value="">All Projects</option>{projects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}</select></div>
          <div><label className="label-text">Start Date</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field" /></div>
          <div><label className="label-text">End Date</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field" /></div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reportCards.map(card => {
          const color = ICON_COLORS[card.key];
          return (
            <div key={card.key} className="cinematic-card p-6 transition-all duration-200"
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}20` }}>
                  <card.icon className="w-5 h-5" style={{ color }} />
                </div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--t1)' }}>{card.title}</h3>
              </div>
              <p className="text-xs mb-4" style={{ color: 'var(--t3)' }}>{card.desc}</p>
              <button onClick={card.action} disabled={card.disabled || downloading === card.key} className="btn-primary flex items-center gap-2 w-full justify-center disabled:opacity-50">
                {downloading === card.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {downloading === card.key ? 'Generating...' : 'Download'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
