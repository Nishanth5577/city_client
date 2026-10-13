import { useNavigate } from 'react-router-dom';
import {
  FolderPlus, UserPlus, Package, Receipt,
  FileBarChart, FileText, Box, Layers
} from 'lucide-react';

const ACTIONS = [
  { label: 'Add Project', icon: FolderPlus, path: '/projects', color: '#0D9488', action: 'new' },
  { label: 'Add Worker', icon: UserPlus, path: '/workers', color: '#059669', action: 'new' },
  { label: 'Add Material', icon: Package, path: '/resources', color: '#D97706', action: 'new' },
  { label: 'Log Expense', icon: Receipt, path: '/expenses', color: '#DC2626', action: 'new' },
  { label: 'Generate Report', icon: FileBarChart, path: '/reports', color: '#7C3AED' },
  { label: 'View Documents', icon: FileText, path: '/documents', color: '#0891B2' },
  { label: 'BIM Studio', icon: Box, path: '/bim', color: '#D97706' },
  { label: 'Design Studio', icon: Layers, path: '/bim/materials', color: '#DB2777' },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--t1)', letterSpacing: '-0.01em' }}>Quick actions</h3>

      <div className="grid grid-cols-4 gap-2.5">
        {ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="flex flex-col items-center gap-2.5 p-3 rounded-xl transition-all duration-300 group"
            style={{ background: 'var(--glass)', border: '1px solid transparent' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${action.color}08`;
              e.currentTarget.style.borderColor = `${action.color}18`;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--glass)';
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
              style={{
                background: `${action.color}0D`,
                border: `1px solid ${action.color}18`,
              }}
            >
              <action.icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" style={{ color: action.color }} strokeWidth={1.5} />
            </div>
            <span className="text-[10px] font-medium text-center leading-tight" style={{ color: 'var(--t4)' }}>
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
