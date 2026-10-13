import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/helpers';
import { TrendingUp, ArrowRight } from 'lucide-react';

export default function BudgetUtilization({ finance = {} }) {
  const navigate = useNavigate();
  const totalBudget = finance.totalBudget || 0;
  const totalExpenses = finance.totalExpenses || 0;
  const remaining = Math.max(0, totalBudget - totalExpenses);
  const utilization = totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0;

  const isOverBudget = utilization > 90;

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--t1)' }}>Budget Utilization</h3>
        <div
          className="px-2 py-1 rounded-lg text-xs font-bold"
          style={{
            background: isOverBudget ? '#FEF2F2' : '#F0FDFA',
            color: isOverBudget ? '#DC2626' : '#0D9488',
            border: `1px solid ${isOverBudget ? '#FECACA' : '#CCFBF1'}`,
          }}
        >
          {utilization}%
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#EEECE8' }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${Math.min(100, utilization)}%`,
              background: isOverBudget
                ? 'linear-gradient(90deg, #DC2626, #DC2626)'
                : 'linear-gradient(90deg, #0D9488, #14b8a6)',
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--t3)' }}>Spent</span>
          <span className="text-xs font-medium" style={{ color: 'var(--t1)' }}>{formatCurrency(totalExpenses)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--t3)' }}>Budget</span>
          <span className="text-xs font-medium" style={{ color: 'var(--t1)' }}>{formatCurrency(totalBudget)}</span>
        </div>
        <div style={{ height: '1px', background: '#EEECE8', margin: '8px 0' }} />
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: 'var(--t3)' }}>Remaining</span>
          <span className="text-xs font-bold font-mono" style={{ color: remaining > 0 ? '#059669' : '#DC2626' }}>
            {formatCurrency(remaining)}
          </span>
        </div>
      </div>

      {/* View Details */}
      <button
        onClick={() => navigate('/finance')}
        className="w-full mt-4 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all"
        style={{
          background: 'rgba(13,148,136,0.1)',
          color: 'var(--accent)',
          border: '1px solid rgba(13,148,136,0.15)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(13,148,136,0.18)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(13,148,136,0.1)'; }}
      >
        View Details <ArrowRight className="w-3.5 h-3.5" />
      </button>

      {/* Inspirational quote */}
      <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <p className="text-xs italic" style={{ color: 'var(--t4)' }}>
          "Every great construction project starts with a great plan."
        </p>
      </div>
    </div>
  );
}
