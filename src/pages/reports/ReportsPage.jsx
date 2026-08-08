import { useEffect, useState } from 'react';
import api from '../../services/api';
import { BarChart3, Download, FileSpreadsheet, FileText, Calendar, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

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
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast.success(`${filename} downloaded!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate report');
    } finally { setDownloading(''); }
  };

  const reportCards = [
    {
      key: 'project-pdf', icon: FileText, iconColor: 'text-red-500', title: 'Project Report (PDF)',
      desc: 'Comprehensive project report with tasks and expense summary',
      hasProject: true, hasDate: false,
      action: () => selectedProject && downloadReport(`/api/reports/project/${selectedProject}`, `project_report_${selectedProject}.pdf`, 'project-pdf'),
      disabled: !selectedProject,
    },
    {
      key: 'expense-pdf', icon: FileText, iconColor: 'text-amber-500', title: 'Expense Report (PDF)',
      desc: 'Detailed expense breakdown by project and category',
      hasProject: false, hasDate: true,
      action: () => {
        let url = '/api/reports/expenses?';
        if (selectedProject) url += `project_id=${selectedProject}&`;
        if (startDate) url += `start_date=${startDate}&`;
        if (endDate) url += `end_date=${endDate}&`;
        downloadReport(url, 'expense_report.pdf', 'expense-pdf');
      },
      disabled: false,
    },
    {
      key: 'workers-excel', icon: FileSpreadsheet, iconColor: 'text-emerald-500', title: 'Workers Report (Excel)',
      desc: 'Complete worker data with attendance and salary details',
      hasProject: false, hasDate: false,
      action: () => downloadReport('/api/reports/workers/excel', 'workers_report.xlsx', 'workers-excel'),
      disabled: false,
    },
    {
      key: 'materials-excel', icon: FileSpreadsheet, iconColor: 'text-blue-500', title: 'Materials Report (Excel)',
      desc: 'Material inventory with stock levels and supplier information',
      hasProject: false, hasDate: false,
      action: () => downloadReport('/api/reports/materials/excel', 'materials_report.xlsx', 'materials-excel'),
      disabled: false,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="page-title">Reports</h1><p className="text-surface-500 mt-1">Generate and download reports with live data</p></div>

      {/* Filters */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wider mb-3">Report Filters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label-text">Project</label>
            <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="select-field">
              <option value="">All Projects</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label-text">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label-text">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field" />
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reportCards.map(card => (
          <div key={card.key} className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <card.icon className={`w-6 h-6 ${card.iconColor}`} />
              <h3 className="section-title">{card.title}</h3>
            </div>
            <p className="text-sm text-surface-500 mb-4">{card.desc}</p>
            <button
              onClick={card.action}
              disabled={card.disabled || downloading === card.key}
              className="btn-primary flex items-center gap-2 w-full justify-center disabled:opacity-50"
            >
              {downloading === card.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloading === card.key ? 'Generating...' : 'Download'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
