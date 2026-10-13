import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function StatsCard({ label, value, icon: Icon, trend, trendLabel, color = '#0D9488', delay = 0 }) {
  const trendUp = trend > 0;
  const trendDown = trend < 0;
  const trendNeutral = !trend || trend === 0;

  return (
    <div
      className="metric-card group cursor-pointer animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Colored top edge */}
      <div className="absolute top-0 left-6 right-6 h-[2px] rounded-full" style={{
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        opacity: 0.25,
      }} />

      {/* Top row: icon + arrow */}
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: `${color}0D`,
            border: `1px solid ${color}18`,
          }}
        >
          {Icon && <Icon className="w-5 h-5" style={{ color }} strokeWidth={1.5} />}
        </div>
        <ArrowUpRight
          className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          style={{ color: 'var(--t5)' }}
        />
      </div>

      {/* Label */}
      <p className="text-xs mb-1" style={{ color: 'var(--t4)', letterSpacing: '0.01em' }}>{label}</p>

      {/* Value */}
      <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--t1)', fontVariantNumeric: 'tabular-nums' }}>{value}</p>

      {/* Trend */}
      <div className="flex items-center gap-1.5 mt-2">
        {trendUp && (
          <>
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(5,150,105,0.1)' }}>
              <ArrowUpRight className="w-3 h-3" style={{ color: '#059669' }} />
              <span className="font-medium font-mono" style={{ color: '#059669', fontSize: '10px' }}>
                {Math.abs(trend)}%
              </span>
            </div>
          </>
        )}
        {trendDown && (
          <>
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(220,38,38,0.1)' }}>
              <ArrowDownRight className="w-3 h-3" style={{ color: '#DC2626' }} />
              <span className="font-medium font-mono" style={{ color: '#DC2626', fontSize: '10px' }}>
                {Math.abs(trend)}%
              </span>
            </div>
          </>
        )}
        {trendNeutral && (
          <>
            <Minus className="w-3 h-3" style={{ color: 'var(--t5)' }} />
          </>
        )}
        {trendLabel && (
          <span className="font-mono" style={{ color: 'var(--t5)', fontSize: '10px' }}>
            {trendLabel}
          </span>
        )}
      </div>
    </div>
  );
}
