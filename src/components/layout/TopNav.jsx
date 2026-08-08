import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleSidebar } from '../../redux/slices/uiSlice';
import { useTheme } from '../../context/ThemeContext';
import { Menu, Search, Sun, Moon, User } from 'lucide-react';
import { getInitials } from '../../utils/helpers';
import { useState, useRef, useEffect } from 'react';
import { logout } from '../../redux/slices/authSlice';
import NotificationBell from '../notifications/NotificationBell';

export default function TopNav() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user } = useSelector((state) => state.auth);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-surface-200 dark:border-surface-800">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button onClick={() => dispatch(toggleSidebar())} className="lg:hidden p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors" id="menu-toggle">
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:flex items-center gap-2 bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-2 w-64 lg:w-80">
            <Search className="w-4 h-4 text-surface-400" />
            <input type="text" placeholder="Search projects, tasks..." className="bg-transparent text-sm outline-none w-full text-surface-900 dark:text-surface-100 placeholder-surface-400" id="global-search" />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button onClick={toggleTheme} className="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200" id="theme-toggle">
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-surface-600" />}
          </button>

          {/* Notifications */}
          <NotificationBell />

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button onClick={() => setShowMenu(!showMenu)} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-all" id="user-menu">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold">
                {getInitials(user?.name)}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-surface-900 dark:text-white">{user?.name}</p>
                <p className="text-[10px] text-surface-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-surface-800 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 py-2 animate-slide-down">
                <button onClick={() => { navigate('/settings'); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
                  <User className="w-4 h-4 inline mr-2" />Profile & Settings
                </button>
                <hr className="my-1 border-surface-200 dark:border-surface-700" />
                <button onClick={() => { dispatch(logout()); navigate('/login'); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
