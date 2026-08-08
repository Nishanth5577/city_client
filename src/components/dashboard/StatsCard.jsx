import { ArrowUpRight } from 'lucide-react';

export default function StatsCard({ label, value, icon: Icon, color = 'from-blue-500 to-blue-600', bg = 'bg-blue-50 dark:bg-blue-900/20', iconColor = '#3b82f6', trend, onClick }) {
  return (
    <div className="glass-card-hover p-5 cursor-pointer" onClick={onClick}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            <ArrowUpRight className={`w-3 h-3 ${trend < 0 ? 'rotate-90' : ''}`} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-sm text-surface-500 dark:text-surface-400">{label}</p>
      <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{value}</p>
    </div>
  );
}
