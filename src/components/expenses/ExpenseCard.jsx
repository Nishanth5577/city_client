import { formatCurrency, formatDate } from '../../utils/helpers';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

const statusConfig = {
  pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'Pending' },
  approved: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Rejected' },
};

export default function ExpenseCard({ expense, onApprove, onReject, canApprove = false }) {
  const status = statusConfig[expense.approved_status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-surface-400 capitalize">{expense.category || 'General'}</span>
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-lg ${status.bg} ${status.color}`}>
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </div>
      </div>
      <p className="font-medium text-surface-900 dark:text-white text-sm mb-1">{expense.description}</p>
      <div className="flex items-center justify-between text-xs text-surface-400 mb-3">
        <span>{formatDate(expense.date)}</span>
        <span className="text-lg font-bold text-surface-900 dark:text-white">{formatCurrency(expense.amount)}</span>
      </div>
      {canApprove && expense.approved_status === 'pending' && (
        <div className="flex gap-2 pt-2 border-t border-surface-100 dark:border-surface-800">
          <button onClick={() => onApprove(expense._id)} className="flex-1 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg hover:bg-emerald-100 transition-colors">
            Approve
          </button>
          <button onClick={() => onReject(expense._id)} className="flex-1 py-1.5 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 transition-colors">
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
