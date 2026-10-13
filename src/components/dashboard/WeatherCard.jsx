import { CloudSun, CloudRain, Sun, Cloud, CloudSnow, CloudLightning, Thermometer } from 'lucide-react';

const WEATHER_ICONS = {
  sunny: Sun,
  clear: Sun,
  'partly cloudy': CloudSun,
  cloudy: Cloud,
  rain: CloudRain,
  thunderstorm: CloudLightning,
  snow: CloudSnow,
  default: CloudSun,
};

export default function WeatherCard({ weather }) {
  // Weather data from API or fallback
  const data = weather || {
    location: 'Coimbatore',
    condition: 'Partly Cloudy',
    temperature: null,
    high: null,
    low: null,
    configured: false,
  };

  const WeatherIcon = WEATHER_ICONS[data.condition?.toLowerCase()] || WEATHER_ICONS.default;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 h-full"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      {/* Atmospheric glow */}
      <div
        className="absolute -top-8 -right-8 w-28 h-28 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(13,148,136,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--t2)' }}>{data.location}</p>
            <p className="text-xs" style={{ color: 'var(--t5)' }}>{data.condition}</p>
          </div>
          <WeatherIcon className="w-8 h-8" style={{ color: 'var(--accent)' }} strokeWidth={1.5} />
        </div>

        {data.configured !== false && data.temperature !== null ? (
          <>
            <p className="text-3xl font-bold tracking-tight font-mono" style={{ color: 'var(--t1)' }}>
              {data.temperature}°C
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs font-mono" style={{ color: 'var(--t3)' }}>
                H {data.high}°
              </span>
              <span className="text-xs font-mono" style={{ color: 'var(--t5)' }}>
                L {data.low}°
              </span>
            </div>
          </>
        ) : (
          <div className="mt-2">
            <p className="text-xs" style={{ color: 'var(--t4)' }}>
              Weather data unavailable
            </p>
            <p className="text-xs font-mono mt-1" style={{ color: 'var(--t5)', fontSize: '10px' }}>
              Configure WEATHER_API_KEY
            </p>
          </div>
        )}
      </div>

      {/* Quote */}
      <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <p className="text-xs italic" style={{ color: 'var(--t5)' }}>
          "Progress is impossible without change."
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--t5)', fontSize: '10px' }}>
          — George Bernard Shaw
        </p>
      </div>
    </div>
  );
}
