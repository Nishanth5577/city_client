import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card p-3 shadow-lg !bg-white dark:!bg-surface-800 border border-surface-200 dark:border-surface-700">
        <p className="text-sm font-medium text-surface-900 dark:text-white">{payload[0].name}</p>
        <p className="text-sm text-primary-600 font-bold">₹{payload[0].value.toLocaleString('en-IN')}</p>
      </div>
    );
  }
  return null;
};

const renderCustomLabel = ({ name, percent }) => {
  if (percent < 0.05) return null;
  return `${(percent * 100).toFixed(0)}%`;
};

export default function ExpenseChart({ data = [], title = 'Expense Breakdown' }) {
  const chartData = data.map((item) => ({
    name: item.category || item.name || 'Other',
    value: item.amount || item.total || 0,
  })).filter(d => d.value > 0);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title">{title}</h3>
        <span className="text-sm font-bold text-surface-900 dark:text-white">₹{total.toLocaleString('en-IN')}</span>
      </div>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              dataKey="value"
              label={renderCustomLabel}
              labelLine={false}
              stroke="none"
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              formatter={(value) => <span className="text-xs text-surface-600 dark:text-surface-400">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center text-surface-400 py-12 text-sm">No expense data available</p>
      )}
    </div>
  );
}
