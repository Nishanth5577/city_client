import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import siteProgressService from '../../services/siteProgressService';
import projectService from '../../services/projectService';
import {
  Camera, Upload, Calendar, MapPin, Clock, Image as ImageIcon,
  ChevronDown, ChevronLeft, ChevronRight, Loader2, Plus, X,
  Filter, Eye, Trash2, User, CloudSun, HardHat, Building2,
  CheckCircle2, AlertCircle, FileText, Maximize2, ZoomIn,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function SiteProgressPage() {
  const { user } = useSelector(s => s.auth);
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [showLightbox, setShowLightbox] = useState(null); // { reportIdx, imgIdx }
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState(null);

  // Upload form
  const [uploadForm, setUploadForm] = useState({
    project_id: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    completed_work: '',
    percentage: 0,
    workers_present: 0,
    problems: '',
  });
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadPreviews, setUploadPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Fetch projects
  useEffect(() => {
    projectService.getAll().then(res => {
      const list = res.data.projects || res.data || [];
      setProjects(list);
    }).catch(() => {});
  }, []);

  // Fetch reports
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (selectedProject) params.project_id = selectedProject;
      const res = await siteProgressService.getAll(params);
      setReports(res.data.reports || []);
      setTotalPages(res.data.pages || 1);
    } catch {
      toast.error('Failed to load progress reports');
    }
    setLoading(false);
  }, [page, selectedProject]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + uploadFiles.length > 10) {
      toast.error('Maximum 10 photos per report');
      return;
    }
    setUploadFiles(prev => [...prev, ...files]);
    // Generate previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setUploadPreviews(prev => [...prev, ev.target.result]);
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (idx) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== idx));
    setUploadPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  // Handle upload submit
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.project_id) return toast.error('Please select a project');
    if (uploadFiles.length === 0) return toast.error('Please add at least one photo');

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('project_id', uploadForm.project_id);
      formData.append('date', uploadForm.date);
      formData.append('description', uploadForm.description);
      formData.append('completed_work', uploadForm.completed_work);
      formData.append('percentage', uploadForm.percentage);
      formData.append('workers_present', uploadForm.workers_present);
      formData.append('problems', uploadForm.problems);

      // Image metadata
      const imagesMeta = uploadFiles.map((f, i) => ({
        url: '', // Will be set server-side
        caption: '',
        type: 'progress',
      }));
      formData.append('images', JSON.stringify(imagesMeta));

      uploadFiles.forEach(file => formData.append('images', file));

      await siteProgressService.create(formData);
      toast.success('Progress report uploaded successfully!');
      setShowUpload(false);
      setUploadFiles([]);
      setUploadPreviews([]);
      setUploadForm({
        project_id: '', date: new Date().toISOString().split('T')[0],
        description: '', completed_work: '', percentage: 0,
        workers_present: 0, problems: '',
      });
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload report');
    }
    setUploading(false);
  };

  // Delete report
  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await siteProgressService.delete(id);
      toast.success('Report deleted');
      fetchReports();
    } catch {
      toast.error('Failed to delete report');
    }
    setDeleting(null);
  };

  // Format date
  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  const formatTime = (d) => new Date(d).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  });

  // Check if user can upload (builders/supervisors/managers/admins)
  const canUpload = ['admin', 'project_manager', 'engineer', 'supervisor'].includes(user?.role);

  return (
    <div className="space-y-6">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-600/30">
              <Camera className="w-5 h-5 text-white" />
            </div>
            Site Progress
          </h1>
          <p style={{ color: 'var(--t4)' }} className="mt-1 text-sm">
            Daily construction progress photos & reports
          </p>
        </div>
        {canUpload && (
          <button onClick={() => setShowUpload(true)} className="btn-primary flex items-center gap-2">
            <Upload className="w-4 h-4" /> Upload Progress
          </button>
        )}
      </div>

      {/* ═══ Filter Bar ═══ */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="w-4 h-4" style={{ color: 'var(--t4)' }} />
            <select
              className="select-field"
              style={{ minWidth: 220 }}
              value={selectedProject}
              onChange={e => { setSelectedProject(e.target.value); setPage(1); }}
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p._id} value={p._id}>{p.project_name}</option>
              ))}
            </select>
          </div>
          <p className="text-xs font-medium" style={{ color: 'var(--t5)' }}>
            {reports.length} reports found
          </p>
        </div>
      </div>

      {/* ═══ Timeline ═══ */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 glass-card rounded-2xl">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--accent-wash)' }}>
            <Camera className="w-8 h-8" style={{ color: 'var(--accent)' }} />
          </div>
          <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--t1)' }}>No progress reports yet</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--t4)', maxWidth: 360, textAlign: 'center' }}>
            {canUpload ? 'Start by uploading your first site progress photos.' : 'No progress updates have been shared yet.'}
          </p>
          {canUpload && (
            <button onClick={() => setShowUpload(true)} className="btn-primary flex items-center gap-2">
              <Upload className="w-4 h-4" /> Upload First Report
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {reports.map((report, ri) => {
            const projName = report.project_id?.project_name || 'Unknown Project';
            const creator = report.created_by?.name || 'Unknown';
            const imgs = report.images || [];
            const serverBase = import.meta.env.VITE_API_URL?.replace('/api', '') || (import.meta.env.PROD ? 'https://city-server-nwwr.onrender.com' : 'http://localhost:5000');

            return (
              <motion.div
                key={report._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: ri * 0.05 }}
                className="glass-card overflow-hidden"
              >
                {/* Report Header */}
                <div className="p-5 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg"
                          style={{ background: 'rgba(13,148,136,0.1)', color: '#0D9488' }}>
                          <Building2 className="w-3 h-3" /> {projName}
                        </span>
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--t4)' }}>
                          <Calendar className="w-3 h-3" /> {formatDate(report.date)}
                        </span>
                        {report.weather?.condition && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--t5)' }}>
                            <CloudSun className="w-3 h-3" />
                            {report.weather.condition}
                            {report.weather.temperature && ` · ${report.weather.temperature}°C`}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium" style={{ color: 'var(--t1)' }}>
                        {report.description || 'Daily progress update'}
                      </p>
                    </div>

                    {/* Progress badge */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 rounded-full overflow-hidden" style={{ background: 'var(--glass)' }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${report.percentage || 0}%`,
                              background: (report.percentage || 0) >= 75 ? '#10B981' : (report.percentage || 0) >= 40 ? '#F59E0B' : '#3B82F6',
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold" style={{ color: 'var(--t2)' }}>
                          {report.percentage || 0}%
                        </span>
                      </div>
                      {canUpload && (
                        <button
                          onClick={() => handleDelete(report._id)}
                          disabled={deleting === report._id}
                          className="p-1 rounded-lg transition-colors"
                          style={{ color: 'var(--t5)' }}
                          title="Delete report"
                        >
                          {deleting === report._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details Row */}
                <div className="px-5 py-3 flex items-center gap-6 flex-wrap text-xs" style={{ color: 'var(--t4)', borderBottom: imgs.length > 0 ? '1px solid var(--border-subtle)' : 'none' }}>
                  {report.completed_work && (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" style={{ color: '#10B981' }} />
                      {report.completed_work}
                    </span>
                  )}
                  {report.workers_present > 0 && (
                    <span className="flex items-center gap-1">
                      <HardHat className="w-3 h-3" /> {report.workers_present} workers
                    </span>
                  )}
                  {report.problems && (
                    <span className="flex items-center gap-1" style={{ color: '#F59E0B' }}>
                      <AlertCircle className="w-3 h-3" /> {report.problems}
                    </span>
                  )}
                  <span className="flex items-center gap-1 ml-auto">
                    <User className="w-3 h-3" /> {creator}
                    <span style={{ color: 'var(--t5)' }}>· {formatTime(report.createdAt)}</span>
                  </span>
                </div>

                {/* Photo Grid */}
                {imgs.length > 0 && (
                  <div className="p-4">
                    <div className={`grid gap-2 ${
                      imgs.length === 1 ? 'grid-cols-1' :
                      imgs.length === 2 ? 'grid-cols-2' :
                      imgs.length <= 4 ? 'grid-cols-2 md:grid-cols-4' :
                      'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
                    }`}>
                      {imgs.map((img, ii) => (
                        <div
                          key={ii}
                          className="relative group cursor-pointer rounded-xl overflow-hidden"
                          style={{
                            aspectRatio: imgs.length === 1 ? '16/9' : '4/3',
                            background: 'var(--glass)',
                          }}
                          onClick={() => setShowLightbox({ reportIdx: ri, imgIdx: ii })}
                        >
                          <img
                            src={img.url?.startsWith('http') ? img.url : `${serverBase}${img.url}`}
                            alt={img.caption || `Progress photo ${ii + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          {img.caption && (
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                              <p className="text-xs text-white truncate">{img.caption}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-sm font-medium" style={{ color: 'var(--t3)' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary flex items-center gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ Upload Modal ═══ */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowUpload(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--t1)' }}>
                  <Camera className="w-5 h-5" style={{ color: 'var(--accent)' }} /> Upload Site Progress
                </h2>
                <button onClick={() => setShowUpload(false)} className="p-1 rounded-lg" style={{ color: 'var(--t4)' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="p-5 space-y-4">
                {/* Project + Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Project *</label>
                    <select
                      className="select-field"
                      required
                      value={uploadForm.project_id}
                      onChange={e => setUploadForm({ ...uploadForm, project_id: e.target.value })}
                    >
                      <option value="">Select Project</option>
                      {projects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label-text">Date *</label>
                    <input
                      type="date"
                      className="input-field"
                      required
                      value={uploadForm.date}
                      onChange={e => setUploadForm({ ...uploadForm, date: e.target.value })}
                    />
                  </div>
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="label-text">Site Photos * (max 10)</label>
                  <div
                    className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
                    style={{ borderColor: 'var(--border)', background: 'var(--glass)' }}
                    onClick={() => document.getElementById('photo-input').click()}
                    onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent)'; }}
                    onDragLeave={e => { e.currentTarget.style.borderColor = ''; }}
                    onDrop={e => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = '';
                      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                      if (files.length) {
                        const fakeEvent = { target: { files } };
                        handleFileChange(fakeEvent);
                      }
                    }}
                  >
                    <Camera className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--t5)' }} />
                    <p className="text-sm font-medium" style={{ color: 'var(--t3)' }}>
                      Click or drag photos here
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--t5)' }}>
                      JPG, PNG, WebP — up to 5MB each
                    </p>
                  </div>
                  <input
                    id="photo-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {/* Photo Previews */}
                  {uploadPreviews.length > 0 && (
                    <div className="grid grid-cols-5 gap-2 mt-3">
                      {uploadPreviews.map((preview, i) => (
                        <div key={i} className="relative group rounded-lg overflow-hidden" style={{ aspectRatio: '1' }}>
                          <img src={preview} className="w-full h-full object-cover" alt="" />
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="label-text">Description</label>
                  <textarea
                    className="input-field"
                    rows={2}
                    placeholder="What work was done today..."
                    value={uploadForm.description}
                    onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                  />
                </div>

                {/* Completed Work */}
                <div>
                  <label className="label-text">Completed Work</label>
                  <textarea
                    className="input-field"
                    rows={2}
                    placeholder="e.g., Foundation casting for Block A completed"
                    value={uploadForm.completed_work}
                    onChange={e => setUploadForm({ ...uploadForm, completed_work: e.target.value })}
                  />
                </div>

                {/* Progress + Workers + Weather */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Progress %</label>
                    <input
                      type="number"
                      className="input-field"
                      min="0" max="100"
                      value={uploadForm.percentage}
                      onChange={e => setUploadForm({ ...uploadForm, percentage: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="label-text">Workers Present</label>
                    <input
                      type="number"
                      className="input-field"
                      min="0"
                      value={uploadForm.workers_present}
                      onChange={e => setUploadForm({ ...uploadForm, workers_present: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                {/* Problems */}
                <div>
                  <label className="label-text">Issues / Problems (if any)</label>
                  <textarea
                    className="input-field"
                    rows={2}
                    placeholder="Any delays, material shortages, weather issues..."
                    value={uploadForm.problems}
                    onChange={e => setUploadForm({ ...uploadForm, problems: e.target.value })}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowUpload(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={uploading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? 'Uploading...' : 'Upload Report'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Lightbox ═══ */}
      <AnimatePresence>
        {showLightbox && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setShowLightbox(null)}
          >
            <button
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              onClick={() => setShowLightbox(null)}
            >
              <X className="w-5 h-5" />
            </button>

            {(() => {
              const report = reports[showLightbox.reportIdx];
              const imgs = report?.images || [];
              const img = imgs[showLightbox.imgIdx];
              if (!img) return null;
              const serverBase = import.meta.env.VITE_API_URL?.replace('/api', '') || (import.meta.env.PROD ? 'https://city-server-nwwr.onrender.com' : 'http://localhost:5000');
              const src = img.url?.startsWith('http') ? img.url : `${serverBase}${img.url}`;

              return (
                <div className="flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
                  <img
                    src={src}
                    alt={img.caption || 'Progress photo'}
                    className="max-h-[80vh] max-w-[90vw] rounded-xl object-contain"
                  />
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setShowLightbox(prev => ({
                        ...prev,
                        imgIdx: Math.max(0, prev.imgIdx - 1),
                      }))}
                      disabled={showLightbox.imgIdx === 0}
                      className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-30"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-white/80 text-sm">
                      {showLightbox.imgIdx + 1} / {imgs.length}
                    </span>
                    <button
                      onClick={() => setShowLightbox(prev => ({
                        ...prev,
                        imgIdx: Math.min(imgs.length - 1, prev.imgIdx + 1),
                      }))}
                      disabled={showLightbox.imgIdx === imgs.length - 1}
                      className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-30"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
