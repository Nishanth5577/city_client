import { useNavigate } from 'react-router-dom';
import { Box, ArrowRight, MapPin } from 'lucide-react';

export default function ProjectPreview3D({ project }) {
  const navigate = useNavigate();

  const projectName = project?.project_name || 'No project selected';
  const location = project?.location || project?.site_address?.city || 'N/A';

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      {/* 3D label */}
      <div className="absolute top-3 left-3 z-10">
        <span
          className="px-2.5 py-1 rounded-lg text-xs font-bold"
          style={{
            background: 'var(--card)',
            color: 'var(--accent)',
            border: '1px solid rgba(13,148,136,0.15)',
            backdropFilter: 'blur(10px)',
          }}
        >
          3D
        </span>
      </div>

      {/* Expand button */}
      <div className="absolute top-3 right-3 z-10 flex gap-1.5">
        <button
          className="p-1.5 rounded-lg transition-colors"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            color: 'var(--t3)',
          }}
        >
          <Box className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3D Preview Area */}
      <div
        className="relative"
        style={{
          height: '200px',
          background: `
            radial-gradient(ellipse at 50% 50%, rgba(13,148,136,0.06) 0%, transparent 60%),
            linear-gradient(180deg, #F0FDFA 0%, #CCFBF1 100%)
          `,
        }}
      >
        {/* Architectural placeholder visualization */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 200 140" className="w-48 h-auto opacity-40">
            {/* Building shape */}
            <rect x="60" y="20" width="80" height="100" fill="#99F6E4" rx="2" />
            <rect x="50" y="30" width="20" height="90" fill="#CCFBF1" rx="1" />
            <rect x="130" y="40" width="25" height="80" fill="#CCFBF1" rx="1" />
            {/* Windows */}
            {[30, 45, 60, 75, 90].map((y, i) =>
              [70, 85, 100, 115].map((x, j) => (
                <rect key={`${i}-${j}`} x={x} y={y} width="8" height="8" fill="#0D9488" opacity={0.15 + Math.random() * 0.15} rx="1" />
              ))
            )}
            {/* Ground */}
            <rect x="30" y="120" width="150" height="4" fill="#99F6E4" rx="2" />
            {/* Trees */}
            <circle cx="35" cy="112" r="8" fill="#059669" opacity="0.2" />
            <rect x="34" y="112" width="2" height="8" fill="#059669" opacity="0.15" />
            <circle cx="170" cy="112" r="6" fill="#059669" opacity="0.18" />
            <rect x="169" y="112" width="2" height="8" fill="#059669" opacity="0.12" />
          </svg>
        </div>

        {/* Atmospheric glow */}
        <div
          className="absolute bottom-0 left-0 right-0 h-20"
          style={{
            background: 'linear-gradient(to top, var(--card), transparent)',
          }}
        />
      </div>

      {/* Bottom info */}
      <div className="px-4 pb-4 -mt-6 relative z-10">
        <div className="flex items-center gap-1.5 mb-2">
          <MapPin className="w-3 h-3" style={{ color: 'var(--accent)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--t1)' }}>{projectName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-micro" style={{ color: 'var(--t4)', fontSize: '10px' }}>{location}</span>
          <button
            onClick={() => project?._id && navigate(`/bim/studio/${project._id}`)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: 'rgba(13,148,136,0.1)',
              color: 'var(--accent)',
              border: '1px solid rgba(13,148,136,0.15)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(13,148,136,0.18)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(13,148,136,0.1)';
            }}
          >
            View in 3D <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
