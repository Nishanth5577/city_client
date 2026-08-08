import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchBIMProjects } from '../../redux/slices/bimSlice';
import {
  ArrowLeft, Upload, FileType, FileText, Box, Trash2, Download,
  FolderOpen, RefreshCw, File, HardDrive, Eye, AlertCircle, Check, X
} from 'lucide-react';
import api from '../../services/api';

const FILE_TYPES = [
  { id: 'cad', label: 'AutoCAD (DWG/DXF)', icon: FileType, accept: '.dwg,.dxf', color: 'blue', desc: 'Import AutoCAD drawings — walls, rooms, and entities extracted from DXF' },
  { id: 'pdf', label: 'PDF Floor Plan', icon: FileText, accept: '.pdf', color: 'red', desc: 'Upload architectural PDF drawings for tracing and digitization' },
  { id: 'ifc', label: 'IFC Model', icon: Box, accept: '.ifc', color: 'green', desc: 'Import Industry Foundation Classes (IFC 2x3/4) building models' },
];

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function ImportExportPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { projects } = useSelector(s => s.bim);
  const [selectedProject, setSelectedProject] = useState('');
  const [activeTab, setActiveTab] = useState('cad');
  const [imports, setImports] = useState({ cad: [], pdf: [], ifc: [] });
  const [summary, setSummary] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => { dispatch(fetchBIMProjects()); }, [dispatch]);

  const fetchData = async (projectId) => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [cadRes, pdfRes, ifcRes, sumRes] = await Promise.all([
        api.get(`/api/bim/import/cad/${projectId}`),
        api.get(`/api/bim/import/pdf/${projectId}`),
        api.get(`/api/bim/import/ifc/${projectId}`),
        api.get(`/api/bim/import/summary/${projectId}`),
      ]);
      setImports({ cad: cadRes.data || [], pdf: pdfRes.data || [], ifc: ifcRes.data || [] });
      setSummary(sumRes.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { if (selectedProject) fetchData(selectedProject); }, [selectedProject]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProject) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bim_project_id', selectedProject);

    try {
      await api.post(`/api/bim/import/${activeTab}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchData(selectedProject);
    } catch (err) { alert(err.response?.data?.message || 'Upload failed'); }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (type, id) => {
    if (!confirm('Delete this import?')) return;
    try {
      await api.delete(`/api/bim/import/${type}/${id}`);
      fetchData(selectedProject);
    } catch (err) { console.error(err); }
  };

  const activeType = FILE_TYPES.find(t => t.id === activeTab);
  const currentImports = imports[activeTab] || [];

  const statusBadge = (status) => {
    const map = {
      completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: Check },
      processing: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: RefreshCw },
      failed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: X },
      pending: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', icon: AlertCircle },
    };
    const s = map[status] || map.pending;
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
        <Icon className="w-3 h-3" /> {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/bim')} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-900/30">
            <FolderOpen className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Import / Export Manager</h1>
            <p className="text-sm text-surface-500">AutoCAD · PDF · IFC</p>
          </div>
        </div>
      </div>

      {/* Project selector */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Select BIM Project</label>
          <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white">
            <option value="">Choose project...</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'CAD Files', value: summary.cad?.count || 0, color: 'blue', icon: FileType },
            { label: 'PDF Plans', value: summary.pdf?.count || 0, color: 'red', icon: FileText },
            { label: 'IFC Models', value: summary.ifc?.count || 0, color: 'green', icon: Box },
            { label: 'Total Size', value: formatBytes(summary.totalSize), color: 'purple', icon: HardDrive },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className={`bg-${color}-50 dark:bg-${color}-900/20 rounded-xl p-4 border border-${color}-200 dark:border-${color}-800/50`}>
              <Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400 mb-2`} />
              <p className="text-xs text-surface-500">{label}</p>
              <p className="text-xl font-bold text-surface-900 dark:text-white">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-xl">
        {FILE_TYPES.map(type => (
          <button key={type.id} onClick={() => setActiveTab(type.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
              ${activeTab === type.id
                ? 'bg-white dark:bg-surface-900 shadow-sm text-surface-900 dark:text-white'
                : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}`}>
            <type.icon className="w-4 h-4" /> {type.label}
          </button>
        ))}
      </div>

      {/* Upload area */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border-2 border-dashed border-surface-300 dark:border-surface-700 p-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className={`p-4 rounded-2xl bg-${activeType?.color}-100 dark:bg-${activeType?.color}-900/30`}>
            <Upload className={`w-8 h-8 text-${activeType?.color}-600 dark:text-${activeType?.color}-400`} />
          </div>
          <div>
            <p className="text-lg font-semibold text-surface-900 dark:text-white">Upload {activeType?.label} File</p>
            <p className="text-sm text-surface-500 mt-1">{activeType?.desc}</p>
          </div>
          <input ref={fileInputRef} type="file" accept={activeType?.accept} onChange={handleUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} disabled={!selectedProject || uploading}
            className={`px-6 py-2.5 bg-${activeType?.color}-600 hover:bg-${activeType?.color}-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center gap-2 transition-colors`}>
            {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading...' : 'Choose File'}
          </button>
          {!selectedProject && <p className="text-xs text-amber-600">⚠ Select a project first</p>}
        </div>
      </div>

      {/* Import List */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm">
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
            {activeType?.label} Imports ({currentImports.length})
          </h3>
        </div>

        {currentImports.length === 0 ? (
          <div className="p-12 text-center text-surface-400">
            <File className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No {activeType?.label} files imported yet</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100 dark:divide-surface-800">
            {currentImports.map(item => (
              <div key={item._id} className="p-4 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg bg-${activeType?.color}-100 dark:bg-${activeType?.color}-900/30`}>
                    <activeType.icon className={`w-5 h-5 text-${activeType?.color}-600 dark:text-${activeType?.color}-400`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-surface-900 dark:text-white truncate">{item.file_name}</p>
                    <div className="flex items-center gap-3 text-xs text-surface-500 mt-0.5">
                      <span>{formatBytes(item.file_size)}</span>
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{item.uploaded_by?.name || 'Unknown'}</span>
                      {item.file_type && <><span>•</span><span className="uppercase">{item.file_type}</span></>}
                    </div>
                    {/* DXF entity info */}
                    {item.parsed_entities && !item.parsed_entities.error && activeTab === 'cad' && (
                      <div className="flex gap-2 mt-1">
                        {item.recognized_walls > 0 && <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">{item.recognized_walls} lines</span>}
                        {item.recognized_rooms > 0 && <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">{item.recognized_rooms} polylines</span>}
                      </div>
                    )}
                    {/* IFC entity info */}
                    {item.entity_count > 0 && activeTab === 'ifc' && (
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded mt-1 inline-block">{item.entity_count} entities</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {statusBadge(item.import_status)}
                  <button onClick={() => setPreviewItem(previewItem?._id === item._id ? null : item)}
                    className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(activeTab, item._id)}
                    className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Panel */}
      {previewItem && (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white">File Details — {previewItem.file_name}</h3>
            <button onClick={() => setPreviewItem(null)} className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-surface-500">File Size</span><p className="font-medium">{formatBytes(previewItem.file_size)}</p></div>
            <div><span className="text-surface-500">Type</span><p className="font-medium uppercase">{previewItem.file_type || activeTab}</p></div>
            <div><span className="text-surface-500">Status</span><p className="font-medium capitalize">{previewItem.import_status}</p></div>
            <div><span className="text-surface-500">Uploaded</span><p className="font-medium">{new Date(previewItem.createdAt).toLocaleString()}</p></div>
          </div>
          {/* DXF parsed entities */}
          {previewItem.parsed_entities && activeTab === 'cad' && !previewItem.parsed_entities.error && (
            <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
              <h4 className="font-medium text-surface-700 dark:text-surface-300 mb-2">Parsed Entities</h4>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {Object.entries(previewItem.parsed_entities).map(([type, arr]) => (
                  <div key={type} className="bg-surface-50 dark:bg-surface-800 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-surface-900 dark:text-white">{Array.isArray(arr) ? arr.length : 0}</p>
                    <p className="text-xs text-surface-500 capitalize">{type}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* IFC entities */}
          {previewItem.entities && activeTab === 'ifc' && !previewItem.entities.error && (
            <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
              <h4 className="font-medium text-surface-700 dark:text-surface-300 mb-2">IFC Entity Summary ({previewItem.entity_count} total)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {Object.entries(previewItem.entities).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([type, count]) => (
                  <div key={type} className="flex justify-between px-3 py-1 rounded-lg bg-surface-50 dark:bg-surface-800 text-xs">
                    <span className="text-surface-600 dark:text-surface-400 truncate">{type}</span>
                    <span className="font-mono font-bold text-surface-900 dark:text-white ml-2">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
