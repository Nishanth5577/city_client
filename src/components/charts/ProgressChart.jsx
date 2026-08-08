import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const GRADIENT_COLORS = [
  { start: '#3b82f6', end: '#2563eb' },
  { start: '#06b6d4', end: '#0891b2' },
  { start: '#10b981', end: '#059669' },
  { start: '#f59e0b', end: '#d97706' },
  { start: '#8b5cf6', end: '#7c3aed' },
  { start: '#ef4444', end: '#dc2626' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card p-3 shadow-lg !bg-white dark:!bg-surface-800 border border-surface-200 dark:border-surface-700">
        <p className="text-sm font-medium text-surface-900 dark:text-white">{label}</p>
        <p className="text-sm text-primary-600 font-bold">{payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

export default function ProgressChart({ data = [], title = 'Project Progress' }) {
  const chartData = data.map((item, i) => ({
    name: item.project_name || item.name || `Project ${i + 1}`,
    progress: item.progress_percentage || item.progress || 0,
  }));

  return (
    <div className="glass-card p-5">
      <h3 className="section-title mb-4">{title}</h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #e5e7eb)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="progress" radius={[6, 6, 0, 0]} maxBarSize={50}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={GRADIENT_COLORS[i % GRADIENT_COLORS.length].start} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center text-surface-400 py-12 text-sm">No progress data available</p>
      )}
    </div>
  );
}
