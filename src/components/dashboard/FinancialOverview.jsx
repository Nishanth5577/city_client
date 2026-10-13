import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '../../utils/helpers';

const COLORS = ['#059669', '#0D9488', '#7C3AED', '#DC2626'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--dropdown-shadow)',
      }}
    >
      <p className="text-xs font-medium" style={{ color: 'var(--t1)' }}>
        {payload[0].name}: {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
};

export default function FinancialOverview({ finance = {} }) {
  const [period, setPeriod] = useState('all');

  const totalBudget = finance.totalBudget || 0;
  const totalExpenses = finance.totalExpenses || 0;
  const remaining = finance.remainingBudget || (totalBudget - totalExpenses);

  // Format to lakhs for display
  const formatLakhs = (val) => {
    if (!val || val === 0) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val}`;
  };

  const data = useMemo(() => {
    const completedExpenses = totalExpenses || 0;
    const pendingPayments = finance.paymentPending || 0;
    const remainingBudget = Math.max(0, remaining);

    const result = [];
    if (completedExpenses > 0) result.push({ name: 'Spent', value: completedExpenses });
    if (remainingBudget > 0) result.push({ name: 'Remaining', value: remainingBudget });
    if (pendingPayments > 0) result.push({ name: 'Pending', value: pendingPayments });

    if (result.length === 0) result.push({ name: 'No Data', value: 1 });
    return result;
  }, [finance, totalExpenses, remaining]);

  const utilizationPct = totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0;

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--t1)', letterSpacing: '-0.01em' }}>Financial overview</h3>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="text-xs rounded-lg px-3 py-1.5 cursor-pointer outline-none"
          style={{
            background: 'var(--card-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--t3)',
          }}
        >
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

      <div className="flex items-center gap-4">
        {/* Donut Chart */}
        <div className="relative" style={{ width: 160, height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-lg font-bold" style={{ color: 'var(--t1)' }}>
              {formatLakhs(totalBudget)}
            </p>
            <p className="text-micro" style={{ color: 'var(--t3)', fontSize: '10px' }}>Total Budget</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2.5">
          {[
            { label: 'Spent', value: totalExpenses, color: COLORS[0], pct: utilizationPct },
            { label: 'Remaining', value: remaining, color: COLORS[1], pct: 100 - utilizationPct },
            { label: 'Pending', value: finance.paymentPending || 0, color: COLORS[2] },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                <span className="text-xs" style={{ color: 'var(--t3)' }}>{item.label}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium" style={{ color: 'var(--t1)' }}>
                  {formatLakhs(item.value)}
                </span>
                {item.pct !== undefined && (
                  <span className="text-micro ml-1.5" style={{ color: 'var(--t3)', fontSize: '10px' }}>
                    {item.pct}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
