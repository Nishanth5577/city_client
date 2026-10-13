import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Users, Box, Receipt } from 'lucide-react';

const NAV = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { path: '/projects', icon: FolderKanban, label: 'Projects' },
  { path: '/bim', icon: Box, label: 'Design' },
  { path: '/workers', icon: Users, label: 'Team' },
  { path: '/expenses', icon: Receipt, label: 'Finance' },
];

export default function MobileNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden" style={{
      background: 'var(--mobile-nav-bg)',
      backdropFilter: 'blur(16px) saturate(180%)',
      borderTop: '1px solid var(--mobile-nav-border)',
    }}>
      <div className="flex items-center justify-around h-14 px-1">
        {NAV.map(item => {
          const active = pathname === item.path || pathname.startsWith(item.path + '/');
          return (
            <button key={item.path} onClick={() => navigate(item.path)} className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors">
              <div className="relative">
                <item.icon className="w-[18px] h-[18px] transition-colors" strokeWidth={active ? 2 : 1.5} style={{ color: active ? '#0D9488' : 'var(--t5)' }} />
                {active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: '#0D9488', boxShadow: '0 0 6px rgba(13,148,136,0.4)' }} />}
              </div>
              <span style={{ fontSize: '10px', fontWeight: 600, color: active ? '#0D9488' : 'var(--t5)' }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
