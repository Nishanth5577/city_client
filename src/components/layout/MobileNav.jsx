import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { LayoutDashboard, FolderKanban, ClipboardList, Users, MessageSquare, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { path: '/projects', icon: FolderKanban, label: 'Projects' },
  { path: '/tasks', icon: ClipboardList, label: 'Tasks' },
  { path: '/workers', icon: Users, label: 'Workers' },
  { path: '/chat', icon: MessageSquare, label: 'Chat' },
];

export default function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useSelector((state) => state.notifications);
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-surface-900/90 backdrop-blur-xl border-t border-surface-200 dark:border-surface-800 lg:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-xl transition-all ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-surface-400 hover:text-surface-600 dark:hover:text-surface-300'
                }`}
              >
                <div className="relative">
                  <item.icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                  {item.path === '/chat' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
                {isActive && (
                  <div className="absolute bottom-1 w-6 h-0.5 bg-primary-600 dark:bg-primary-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Spacer to prevent content from being hidden by bottom nav */}
      <div className="h-16 lg:hidden" />
    </>
  );
}
