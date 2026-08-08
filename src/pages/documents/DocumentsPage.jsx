import { useEffect, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import api from '../../services/api';
import { formatRelative } from '../../utils/helpers';
import { FileText, Upload, Download, Trash2, Search } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => { api.get('/api/documents', { params: { search: debouncedSearch } }).then(r => setDocuments(r.data.documents || [])).finally(() => setLoading(false)); }, [debouncedSearch]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    try {
      const { data } = await api.post('/api/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setDocuments(prev => [data, ...prev]);
      toast.success('Document uploaded!');
    } catch (err) { toast.error('Upload failed'); }
    e.target.value = '';
  };

  const handleDownload = async (doc) => {
    try {
      const res = await api.get(`/api/documents/${doc._id}/download`, { responseType: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([res.data]));
      link.download = doc.name || 'document';
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch { toast.error('Download failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/api/documents/${deleteId}`); setDocuments(prev => prev.filter(d => d._id !== deleteId)); toast.success('Deleted'); setDeleteId(null); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to delete document'); }
  };

  const getFileIcon = (mime) => { if (mime?.includes('pdf')) return '📄'; if (mime?.includes('image')) return '🖼️'; if (mime?.includes('spreadsheet') || mime?.includes('excel')) return '📊'; return '📎'; };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="page-title">Documents</h1><p className="text-surface-500 mt-1">{documents.length} documents</p></div>
        <label className="btn-primary flex items-center gap-2 cursor-pointer"><Upload className="w-4 h-4" />Upload Document<input type="file" className="hidden" onChange={handleUpload} /></label>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" /><input type="text" placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" /></div>

      <div className="space-y-3">
        {documents.map(doc => (
          <div key={doc._id} className="glass-card p-4 flex items-center gap-4">
            <span className="text-2xl">{getFileIcon(doc.mime_type)}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-surface-900 dark:text-white truncate">{doc.name}</h3>
              <p className="text-sm text-surface-500">{doc.type} • {(doc.file_size / 1024).toFixed(1)}KB • {doc.uploaded_by?.name} • {formatRelative(doc.createdAt)}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleDownload(doc)} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 hover:text-primary-600" title="Download"><Download className="w-4 h-4" /></button>
              <button onClick={() => setDeleteId(doc._id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 text-surface-500 hover:text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {documents.length === 0 && <div className="flex flex-col items-center py-16 text-surface-400"><FileText className="w-16 h-16 mb-4 opacity-30" /><p>No documents yet</p></div>}
      </div>

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setDeleteId(null)}>
          <div className="glass-card p-6 w-full max-w-sm animate-scale-in text-center" onClick={e => e.stopPropagation()}>
            <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">Delete Document?</h3>
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
