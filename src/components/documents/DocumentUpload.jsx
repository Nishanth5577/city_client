import { useState, useRef } from 'react';
import { Upload, X, FileText } from 'lucide-react';

export default function DocumentUpload({ onUpload, projects = [], loading = false }) {
  const [file, setFile] = useState(null);
  const [projectId, setProjectId] = useState('');
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer?.files?.[0];
    if (dropped) setFile(dropped);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('document', file);
    if (projectId) formData.append('project_id', projectId);
    onUpload(formData);
    setFile(null);
    setProjectId('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label-text">Project (optional)</label>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="select-field">
          <option value="">General / No project</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}
        </select>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-surface-300 dark:border-surface-700 rounded-2xl p-8 text-center cursor-pointer hover:border-primary-400 transition-colors"
      >
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="w-6 h-6 text-primary-600" />
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{file.name}</span>
            <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-surface-400 hover:text-red-500">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-surface-300 mx-auto mb-2" />
            <p className="text-sm text-surface-500">Drop a file here or click to browse</p>
            <p className="text-xs text-surface-400 mt-1">PDF, DOC, XLS, images up to 10MB</p>
          </>
        )}
        <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0])} />
      </div>

      <div className="flex gap-3 justify-end">
        <button type="submit" disabled={!file || loading} className="btn-primary">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Upload'}
        </button>
      </div>
    </form>
  );
}
