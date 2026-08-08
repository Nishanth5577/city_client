import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formatCurrency, formatDate, getProgressColor } from '../../utils/helpers';
import { PROJECT_STATUS_MAP, CONSTRUCTION_STAGES } from '../../utils/constants';
import { ArrowLeft, Edit2, Trash2, QrCode, Download } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    Promise.all([
      api.get(`/api/projects/${id}`),
      api.get(`/api/stages/${id}`),
    ]).then(([projRes, stageRes]) => {
      setProject(projRes.data);
      setStages(stageRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!project) return <div className="text-center py-16 text-surface-400">Project not found</div>;

  const statusInfo = PROJECT_STATUS_MAP[project.project_status] || { label: project.project_status, color: 'badge-neutral' };
  const tabs = ['overview', 'stages', 'tasks', 'resources', 'expenses', 'documents', 'qr-code'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/projects')} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="page-title">{project.project_name}</h1>
            <span className={statusInfo.color}>{statusInfo.label}</span>
          </div>
          <p className="text-surface-500 mt-1">{project.client_name} • {project.location}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Overall Progress</span>
          <span className="text-2xl font-bold text-gradient">{project.progress_percentage}%</span>
        </div>
        <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(project.progress_percentage)} transition-all duration-700`} style={{ width: `${project.progress_percentage}%` }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-sm">
          <div><span className="text-surface-500">Budget:</span> <span className="font-semibold text-surface-900 dark:text-white">{formatCurrency(project.budget)}</span></div>
          <div><span className="text-surface-500">Start:</span> <span className="font-semibold text-surface-900 dark:text-white">{formatDate(project.start_date)}</span></div>
          <div><span className="text-surface-500">Expected End:</span> <span className="font-semibold text-surface-900 dark:text-white">{formatDate(project.expected_end_date)}</span></div>
          <div><span className="text-surface-500">Manager:</span> <span className="font-semibold text-surface-900 dark:text-white">{project.manager_id?.name || 'Unassigned'}</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${tab === t ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800'}`}>
            {t.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="glass-card p-6">
          <h3 className="section-title mb-3">Description</h3>
          <p className="text-surface-600 dark:text-surface-400">{project.description || 'No description provided.'}</p>
        </div>
      )}

      {tab === 'stages' && (
        <div className="glass-card p-6">
          <h3 className="section-title mb-4">Construction Stages</h3>
          <div className="space-y-4">
            {stages.map((stage, index) => (
              <div key={stage._id} className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  stage.status === 'completed' ? 'bg-emerald-500 text-white' :
                  stage.status === 'in_progress' ? 'bg-blue-500 text-white' :
                  'bg-surface-200 dark:bg-surface-700 text-surface-500'
                }`}>
                  {stage.status === 'completed' ? '✓' : index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-surface-900 dark:text-white">{stage.stage_name}</p>
                    <span className={`text-xs font-medium ${stage.status === 'completed' ? 'text-emerald-600' : stage.status === 'in_progress' ? 'text-blue-600' : 'text-surface-400'}`}>
                      {stage.completion_percentage}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full mt-1 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${stage.status === 'completed' ? 'bg-emerald-500' : stage.status === 'in_progress' ? 'bg-blue-500' : 'bg-surface-300'}`} style={{ width: `${stage.completion_percentage}%` }} />
                  </div>
                </div>
                {index < stages.length - 1 && <div className="w-px h-8 bg-surface-200 dark:bg-surface-700 ml-5 -mb-4 hidden sm:block" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'qr-code' && project.qr_code && (
        <div className="glass-card p-6 text-center">
          <h3 className="section-title mb-4">Project QR Code</h3>
          <img src={project.qr_code} alt="QR Code" className="w-64 h-64 mx-auto rounded-xl shadow-lg" />
          <p className="text-sm text-surface-500 mt-4">Scan to view project progress publicly</p>
        </div>
      )}

      {!['overview', 'stages', 'qr-code'].includes(tab) && (
        <div className="glass-card p-12 text-center text-surface-400">
          <p className="text-lg font-medium">Navigate to the dedicated {tab} section</p>
          <button onClick={() => navigate(`/${tab === 'resources' ? 'resources' : tab}`)} className="btn-primary mt-4">Go to {tab.replace(/\b\w/g, l => l.toUpperCase())}</button>
        </div>
      )}
    </div>
  );
}
