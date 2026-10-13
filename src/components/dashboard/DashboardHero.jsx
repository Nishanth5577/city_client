import { useSelector } from 'react-redux';
import { Calendar, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardHero() {
  const { user } = useSelector((state) => state.auth);
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName = user?.name?.split(' ')[0] || 'User';

  return (
    <div className="dashboard-hero relative overflow-hidden rounded-2xl" style={{ minHeight: '180px' }}>
      {/* Warm gradient background — adapts to theme */}
      <div
        className="absolute inset-0"
        style={{
          background: 'var(--hero-gradient, linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 30%, #E0F2FE 65%, #F0F9FF 100%))',
        }}
      />

      {/* Soft mesh gradient accents */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[400px] h-[300px] rounded-full blur-[120px]" style={{ background: 'rgba(13,148,136,0.10)' }} />
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[200px] rounded-full blur-[100px]" style={{ background: 'rgba(124,58,237,0.05)' }} />
      </div>

      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: 'radial-gradient(var(--hero-dot, rgba(13,148,136,0.25)) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top edge highlight */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(13,148,136,0.3), rgba(124,58,237,0.15), transparent)' }} />

      {/* Content */}
      <div className="relative z-10 px-6 sm:px-8 py-7 sm:py-9">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--hero-sub, #57534E)', letterSpacing: '0.01em' }}>
              {greeting},
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter mb-2" style={{ color: 'var(--hero-title, #1C1917)' }}>
              {firstName}
            </h1>
            <p className="text-sm" style={{ color: 'var(--hero-desc, #78756E)', maxWidth: '380px' }}>
              Here's what's happening with your construction projects today.
            </p>

            <div className="flex items-center gap-2 mt-5">
              <div
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  background: 'var(--hero-chip-bg, rgba(255,255,255,0.7))',
                  border: '1px solid rgba(13,148,136,0.15)',
                  color: 'var(--hero-sub, #57534E)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                {format(now, 'EEE, dd MMM yyyy')}
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center animate-float"
              style={{
                background: 'rgba(13,148,136,0.10)',
                border: '1px solid rgba(13,148,136,0.15)',
                boxShadow: '0 4px 20px rgba(13,148,136,0.10)',
              }}
            >
              <Sparkles className="w-7 h-7" style={{ color: 'var(--accent)' }} strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

