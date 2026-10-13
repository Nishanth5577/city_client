import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { PROJECT_STATUS_MAP } from '../../utils/constants';
import { ArrowLeft, FileText, Download, Users, IndianRupee, ClipboardList, Layers, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const STATUS_COLORS = {
  active: { bg: 'rgba(16, 185, 129, 0.15)', text: '#059669', border: 'rgba(16, 185, 129, 0.2)', label: 'In Progress' },
  planning: { bg: 'rgba(59, 130, 246, 0.15)', text: '#2563EB', border: 'rgba(59, 130, 246, 0.2)', label: 'Planning' },
  completed: { bg: 'rgba(16, 185, 129, 0.15)', text: '#059669', border: 'rgba(16, 185, 129, 0.2)', label: 'Completed' },
  delayed: { bg: 'rgba(239, 68, 68, 0.15)', text: '#DC2626', border: 'rgba(220,38,38,0.12)', label: 'Delayed' },
  on_hold: { bg: 'rgba(245, 158, 11, 0.15)', text: '#D97706', border: 'rgba(245, 158, 11, 0.2)', label: 'On Hold' },
  cancelled: { bg: 'rgba(107, 114, 128, 0.15)', text: '#6B7280', border: 'rgba(107, 114, 128, 0.2)', label: 'Cancelled' },
};

const TASK_STATUS_STYLE = {
  completed: { bg: 'rgba(16,185,129,0.15)', text: '#059669', label: 'Completed' },
  in_progress: { bg: 'rgba(59,130,246,0.15)', text: '#2563EB', label: 'In Progress' },
  pending: { bg: 'rgba(245,158,11,0.15)', text: '#D97706', label: 'Pending' },
  overdue: { bg: 'rgba(239,68,68,0.15)', text: '#DC2626', label: 'Overdue' },
};

function getProgressGradient(pct) {
  if (pct >= 80) return 'linear-gradient(90deg, #059669, #059669)';
  if (pct >= 50) return 'linear-gradient(90deg, #0D9488, #14B8A6)';
  if (pct >= 25) return 'linear-gradient(90deg, var(--accent), #D97706)';
  return 'linear-gradient(90deg, #DC2626, #DC2626)';
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [stages, setStages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('overview');

  const fetchProject = () => {
    setLoading(true); setError(null);
    Promise.all([api.get(`/api/projects/${id}`), api.get(`/api/stages/${id}`)]).then(([projRes, stageRes]) => {
      setProject(projRes.data); setStages(stageRes.data);
    }).catch(err => { setError(err.response?.data?.message || 'Unable to load project'); }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchProject(); }, [id]);

  // Fetch tab data on demand
  useEffect(() => {
    if (!id) return;
    if (tab === 'tasks' && tasks.length === 0) {
      api.get('/api/tasks', { params: { project_id: id, limit: 100 } })
        .then(r => setTasks(r.data.tasks || r.data || []))
        .catch(() => {});
    }
    if (tab === 'resources' && workers.length === 0) {
      api.get('/api/workers', { params: { limit: 200 } })
        .then(r => {
          const all = r.data.workers || r.data || [];
          setWorkers(all.filter(w => w.assigned_project_id === id || w.assigned_project?.id === id || w.assigned_project?._id === id));
        })
        .catch(() => {});
    }
    if (tab === 'expenses' && expenses.length === 0) {
      api.get('/api/expenses', { params: { project_id: id, limit: 200 } })
        .then(r => setExpenses(r.data.expenses || r.data || []))
        .catch(() => {});
    }
    if (tab === 'documents' && documents.length === 0) {
      api.get('/api/documents', { params: { project_id: id, limit: 100 } })
        .then(r => setDocuments(r.data.documents || r.data || []))
        .catch(() => {});
    }
  }, [tab, id]);

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="cinematic-card p-8 text-center max-w-md">
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--t1)' }}>Unable to load project</h3>
        <p className="text-sm mb-6" style={{ color: 'var(--t3)' }}>{error}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/projects')} className="btn-secondary">Back</button>
          <button onClick={fetchProject} className="btn-primary">Retry</button>
        </div>
      </div>
    </div>
  );
  if (!project) return <div className="text-center py-16" style={{ color: 'var(--t4)' }}>Project not found</div>;

  const status = STATUS_COLORS[project.project_status] || STATUS_COLORS.active;
  const tabs = ['overview', 'stages', 'tasks', 'resources', 'expenses', 'documents'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/projects')} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="page-title">{project.project_name}</h1>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: status.bg, color: status.text, border: `1px solid ${status.border}` }}>{status.label}</span>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>{project.client_name} • {project.location}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="cinematic-card p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: 'var(--t3)' }}>Overall Progress</span>
          <span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{project.progress_percentage}%</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${project.progress_percentage}%`, background: getProgressGradient(project.progress_percentage) }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-sm">
          {[
            { label: 'Budget', value: formatCurrency(project.budget) },
            { label: 'Start', value: formatDate(project.start_date) },
            { label: 'Expected End', value: formatDate(project.expected_end_date) },
            { label: 'Manager', value: project.manager_id?.name || 'Unassigned' },
          ].map(item => (
            <div key={item.label}>
              <span className="text-xs" style={{ color: 'var(--t4)' }}>{item.label}:</span>{' '}
              <span className="font-semibold text-xs" style={{ color: 'var(--t1)' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
            style={{
              background: tab === t ? 'rgba(37,99,235,0.08)' : 'transparent',
              color: tab === t ? '#D97706' : 'var(--t3)',
              border: `1px solid ${tab === t ? 'rgba(212, 136, 42, 0.2)' : 'transparent'}`,
            }}
          >
            {t.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* ═══════ OVERVIEW TAB ═══════ */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="cinematic-card p-6">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--t1)' }}>Description</h3>
            <p className="text-sm" style={{ color: 'var(--t3)' }}>{project.description || 'No description provided.'}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Contract Value', value: formatCurrency(project.contract_value), icon: IndianRupee, color: '#059669' },
              { label: 'Total Expenses', value: formatCurrency(project.total_expenses), icon: IndianRupee, color: '#DC2626' },
              { label: 'Project Type', value: (project.project_type || 'residential').replace(/\b\w/g, l => l.toUpperCase()), icon: Layers, color: '#2563EB' },
              { label: 'Risk Level', value: (project.risk_level || 'low').replace(/\b\w/g, l => l.toUpperCase()), icon: AlertCircle, color: project.risk_level === 'high' ? '#DC2626' : '#D97706' },
            ].map(c => (
              <div key={c.label} className="cinematic-card p-4">
                <c.icon className="w-5 h-5 mb-2" style={{ color: c.color }} />
                <p className="text-xs" style={{ color: 'var(--t4)' }}>{c.label}</p>
                <p className="text-lg font-bold mt-1" style={{ color: 'var(--t1)' }}>{c.value}</p>
              </div>
            ))}
          </div>
          <div className="cinematic-card p-6">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--t1)' }}>Client Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div><span style={{ color: 'var(--t4)' }}>Client:</span> <span style={{ color: 'var(--t1)' }}>{project.client_name}</span></div>
              <div><span style={{ color: 'var(--t4)' }}>Phone:</span> <span style={{ color: 'var(--t1)' }}>{project.client_phone || '—'}</span></div>
              <div><span style={{ color: 'var(--t4)' }}>Email:</span> <span style={{ color: 'var(--t1)' }}>{project.client_email || '—'}</span></div>
              <div className="md:col-span-3"><span style={{ color: 'var(--t4)' }}>Address:</span> <span style={{ color: 'var(--t1)' }}>{[project.site_street, project.site_city, project.site_state, project.site_zip].filter(Boolean).join(', ') || '—'}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ STAGES TAB ═══════ */}
      {tab === 'stages' && (
        <div className="cinematic-card p-6">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--t1)' }}>Construction Stages</h3>
          {stages.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--t4)' }} />
              <p className="text-sm" style={{ color: 'var(--t3)' }}>No construction stages defined yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stages.map((stage, index) => (
                <div key={stage._id} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{
                      background: stage.status === 'completed' ? '#059669' : stage.status === 'in_progress' ? '#0D9488' : 'var(--border)',
                      color: stage.status === 'completed' || stage.status === 'in_progress' ? '#fff' : 'var(--t3)',
                    }}>
                    {stage.status === 'completed' ? '✓' : index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm" style={{ color: 'var(--t1)' }}>{stage.stage_name}</p>
                      <span className="text-xs font-medium" style={{ color: stage.status === 'completed' ? '#059669' : stage.status === 'in_progress' ? '#2563EB' : 'var(--t4)' }}>
                        {stage.completion_percentage}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: 'var(--border)' }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${stage.completion_percentage}%`, background: stage.status === 'completed' ? '#059669' : stage.status === 'in_progress' ? '#0D9488' : 'var(--border)' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════ TASKS TAB ═══════ */}
      {tab === 'tasks' && (
        <div className="cinematic-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--t1)' }}>Tasks ({tasks.length})</h3>
          </div>
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--t4)' }} />
              <p className="text-sm" style={{ color: 'var(--t3)' }}>No tasks found for this project.</p>
              <button onClick={() => navigate('/tasks')} className="btn-primary mt-4 text-sm">Go to Tasks</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--t4)' }}>Task</th>
                    <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--t4)' }}>Assignee</th>
                    <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--t4)' }}>Priority</th>
                    <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--t4)' }}>Status</th>
                    <th className="text-right py-2 px-3 font-medium" style={{ color: 'var(--t4)' }}>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => {
                    const ts = TASK_STATUS_STYLE[task.status] || TASK_STATUS_STYLE.pending;
                    return (
                      <tr key={task._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="py-3 px-3 font-medium" style={{ color: 'var(--t1)' }}>{task.title || task.task_name}</td>
                        <td className="py-3 px-3" style={{ color: 'var(--t3)' }}>{task.assigned_to?.name || task.assignee_name || '—'}</td>
                        <td className="py-3 px-3">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                            background: task.priority === 'high' ? 'rgba(239,68,68,0.15)' : task.priority === 'medium' ? 'rgba(245,158,11,0.15)' : 'rgba(107,114,128,0.15)',
                            color: task.priority === 'high' ? '#DC2626' : task.priority === 'medium' ? '#D97706' : '#6B7280',
                          }}>{(task.priority || 'medium').charAt(0).toUpperCase() + (task.priority || 'medium').slice(1)}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: ts.bg, color: ts.text }}>{ts.label}</span>
                        </td>
                        <td className="py-3 px-3 text-right" style={{ color: 'var(--t3)' }}>{formatDate(task.due_date)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════ RESOURCES TAB ═══════ */}
      {tab === 'resources' && (
        <div className="cinematic-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--t1)' }}>Workers Assigned ({workers.length})</h3>
          </div>
          {workers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--t4)' }} />
              <p className="text-sm" style={{ color: 'var(--t3)' }}>No workers assigned to this project.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workers.map(w => (
                <div key={w._id} className="rounded-xl p-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: 'rgba(59,130,246,0.15)', color: '#2563EB' }}>
                      {(w.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: 'var(--t1)' }}>{w.name}</p>
                      <p className="text-xs" style={{ color: 'var(--t4)' }}>{w.skill || w.role || '—'}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                      background: w.availability === 'available' ? 'rgba(16,185,129,0.15)' : w.availability === 'assigned' ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)',
                      color: w.availability === 'available' ? '#059669' : w.availability === 'assigned' ? '#2563EB' : '#D97706',
                    }}>{(w.availability || 'assigned').replace('_', ' ')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div><span style={{ color: 'var(--t4)' }}>Phone:</span> <span style={{ color: 'var(--t2)' }}>{w.phone || '—'}</span></div>
                    <div><span style={{ color: 'var(--t4)' }}>Salary:</span> <span style={{ color: 'var(--t2)' }}>{w.salary ? `₹${w.salary}/${w.salary_type === 'monthly' ? 'mo' : 'day'}` : '—'}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════ EXPENSES TAB ═══════ */}
      {tab === 'expenses' && (
        <div className="cinematic-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--t1)' }}>Expenses ({expenses.length})</h3>
            <div className="text-sm font-bold" style={{ color: '#DC2626' }}>Total: {formatCurrency(expenses.reduce((s, e) => s + (e.amount || 0), 0))}</div>
          </div>
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <IndianRupee className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--t4)' }} />
              <p className="text-sm" style={{ color: 'var(--t3)' }}>No expenses recorded for this project.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--t4)' }}>Description</th>
                    <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--t4)' }}>Category</th>
                    <th className="text-right py-2 px-3 font-medium" style={{ color: 'var(--t4)' }}>Amount</th>
                    <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--t4)' }}>Vendor</th>
                    <th className="text-right py-2 px-3 font-medium" style={{ color: 'var(--t4)' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(e => (
                    <tr key={e._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-3 px-3 font-medium" style={{ color: 'var(--t1)' }}>{e.description || e.title || '—'}</td>
                      <td className="py-3 px-3">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(107,114,128,0.15)', color: '#6B7280' }}>
                          {(e.category || 'general').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium" style={{ color: '#DC2626' }}>{formatCurrency(e.amount)}</td>
                      <td className="py-3 px-3" style={{ color: 'var(--t3)' }}>{e.vendor || e.paid_to || '—'}</td>
                      <td className="py-3 px-3 text-right" style={{ color: 'var(--t3)' }}>{formatDate(e.date || e.expense_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════ DOCUMENTS TAB ═══════ */}
      {tab === 'documents' && (
        <div className="cinematic-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--t1)' }}>Documents ({documents.length})</h3>
          </div>
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--t4)' }} />
              <p className="text-sm" style={{ color: 'var(--t3)' }}>No documents uploaded for this project.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map(doc => (
                <div key={doc._id} className="flex items-center gap-3 rounded-xl p-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.12)' }}>
                    <FileText className="w-5 h-5" style={{ color: '#2563EB' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: 'var(--t1)' }}>{doc.name || doc.title || 'Untitled'}</p>
                    <p className="text-xs" style={{ color: 'var(--t4)' }}>{(doc.type || 'document').replace(/\b\w/g, l => l.toUpperCase())} • {formatDate(doc.createdAt)}</p>
                  </div>
                  <button onClick={async () => {
                      try {
                        const res = await api.get(`/api/documents/${doc._id}/download`, { responseType: 'blob' });
                        const url = window.URL.createObjectURL(new Blob([res.data]));
                        const a = document.createElement('a'); a.href = url;
                        a.download = doc.name || 'document'; document.body.appendChild(a);
                        a.click(); a.remove(); window.URL.revokeObjectURL(url);
                      } catch { import('react-hot-toast').then(m => m.default.error('File not available for download')); }
                    }} className="p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" style={{ color: 'var(--t3)' }}>
                      <Download className="w-4 h-4" />
                    </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}


    </div>
  );
}
