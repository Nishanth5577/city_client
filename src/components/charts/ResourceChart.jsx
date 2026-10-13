import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card p-3 shadow-lg !bg-white dark:!bg-surface-800 border border-surface-200 dark:border-surface-700">
        <p className="text-sm font-medium text-surface-900 dark:text-white mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs" style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ResourceChart({ materials = [], equipment = [], title = 'Resource Overview' }) {
  // Transform materials data
  const materialData = materials.slice(0, 6).map(m => ({
    name: m.material_name?.slice(0, 12) || 'Material',
    total: m.quantity || 0,
    available: m.available_stock || 0,
  }));

  // Transform equipment data
  const equipmentData = equipment.slice(0, 6).map(e => ({
    name: e.equipment_name?.slice(0, 12) || 'Equipment',
    assigned: e.status === 'assigned' ? 1 : 0,
    available: e.status === 'available' ? 1 : 0,
  }));

  const data = materialData.length > 0 ? materialData : equipmentData;
  const isMaterial = materialData.length > 0;

  return (
    <div className="glass-card p-5">
      <h3 className="section-title mb-4">{title}</h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #e5e7eb)" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              formatter={(value) => <span className="text-xs text-surface-600 dark:text-surface-400 capitalize">{value}</span>}
            />
            {isMaterial ? (
              <>
                <Bar dataKey="total" fill="#0D9488" radius={[4, 4, 0, 0]} maxBarSize={40} name="Total" />
                <Bar dataKey="available" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={40} name="Available" />
              </>
            ) : (
              <>
                <Bar dataKey="assigned" fill="#D97706" radius={[4, 4, 0, 0]} maxBarSize={40} name="Assigned" />
                <Bar dataKey="available" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={40} name="Available" />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center text-surface-400 py-12 text-sm">No resource data available</p>
      )}
    </div>
  );
}
