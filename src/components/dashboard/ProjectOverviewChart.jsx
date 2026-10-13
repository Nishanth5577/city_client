import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const PERIOD_OPTIONS = [
  { label: 'Last 6 Months', value: 6 },
  { label: 'Last 12 Months', value: 12 },
  { label: 'This Year', value: 'year' },
];

const CustomTooltip = ({ active, payload, label }) => {
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
      <p className="text-xs font-medium mb-2" style={{ color: 'var(--t1)' }}>{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span style={{ color: 'var(--t3)' }}>{entry.name}:</span>
          <span className="font-medium" style={{ color: 'var(--t1)' }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function ProjectOverviewChart({ projects = [] }) {
  const [period, setPeriod] = useState(6);

  // Calculate chart data from project records
  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const numMonths = period === 'year' ? 12 : period;
    const data = [];

    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${months[d.getMonth()]}`;

      let completed = 0, inProgress = 0, planned = 0;
      projects.forEach(p => {
        const startDate = p.start_date ? new Date(p.start_date) : null;
        const endDate = p.expected_end_date ? new Date(p.expected_end_date) : null;

        if (p.project_status === 'completed' && endDate && endDate <= d) {
          completed++;
        } else if (startDate && startDate <= d && (p.project_status === 'active' || p.project_status === 'delayed')) {
          inProgress++;
        } else if (startDate && startDate > d) {
          planned++;
        } else if (p.project_status === 'planning') {
          planned++;
        }
      });

      data.push({ name: monthKey, Completed: completed, 'In Progress': inProgress, Planned: planned });
    }
    return data;
  }, [projects, period]);

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
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--t1)', letterSpacing: '-0.01em' }}>Project overview</h3>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value === 'year' ? 'year' : Number(e.target.value))}
          className="text-xs rounded-lg px-3 py-1.5 cursor-pointer outline-none"
          style={{
            background: 'var(--card-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--t3)',
          }}
        >
          {PERIOD_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#059669" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorInProgress" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0D9488" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#78756E', fontSize: 11 }}
            axisLine={{ stroke: '#E8E5E0' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#78756E', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="Completed" stroke="#059669" strokeWidth={2} fill="url(#colorCompleted)" />
          <Area type="monotone" dataKey="In Progress" stroke="#0D9488" strokeWidth={2} fill="url(#colorInProgress)" />
          <Area type="monotone" dataKey="Planned" stroke="#7C3AED" strokeWidth={2} fill="url(#colorPlanned)" />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3">
        {[
          { label: 'Completed', color: '#059669' },
          { label: 'In Progress', color: '#0D9488' },
          { label: 'Planned', color: '#7C3AED' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
            <span className="text-xs" style={{ color: 'var(--t3)' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
