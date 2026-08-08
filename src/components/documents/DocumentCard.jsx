import { formatDate } from '../../utils/helpers';
import { FileText, Download, Trash2, Image, FileSpreadsheet, File } from 'lucide-react';

const typeIcons = {
  'image/png': Image, 'image/jpeg': Image, 'image/jpg': Image, 'image/gif': Image, 'image/webp': Image,
  'application/pdf': FileText,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileSpreadsheet,
  'application/vnd.ms-excel': FileSpreadsheet,
};

export default function DocumentCard({ document: doc, onDownload, onDelete, canDelete = false }) {
  const IconComp = typeIcons[doc.mime_type] || File;
  const fileSize = doc.size ? (doc.size / 1024 > 1024 ? `${(doc.size / 1048576).toFixed(1)} MB` : `${(doc.size / 1024).toFixed(0)} KB`) : '';

  return (
    <div className="glass-card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
        <IconComp className="w-5 h-5 text-primary-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-surface-900 dark:text-white text-sm truncate">{doc.original_name || doc.filename}</p>
        <p className="text-xs text-surface-400">{fileSize} • {formatDate(doc.createdAt)} • {doc.uploaded_by?.name || 'Unknown'}</p>
      </div>
      <div className="flex items-center gap-2">
        {onDownload && (
          <button onClick={() => onDownload(doc._id)} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-primary-600 transition-colors">
            <Download className="w-4 h-4" />
          </button>
        )}
        {canDelete && onDelete && (
          <button onClick={() => onDelete(doc._id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
