import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleSidebar } from '../../redux/slices/uiSlice';
import { useTheme } from '../../context/ThemeContext';
import { Menu, Search, Sun, Moon, User, ChevronDown, LogOut } from 'lucide-react';
import { getInitials } from '../../utils/helpers';
import { useState, useRef, useEffect } from 'react';
import { logout } from '../../redux/slices/authSlice';
import NotificationBell from '../notifications/NotificationBell';

export default function TopNav() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user } = useSelector(s => s.auth);
  const [showMenu, setShowMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => { const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  useEffect(() => { const h = e => { if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); searchRef.current?.focus(); } }; document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h); }, []);

  return (
    <header className="sticky top-0 z-20 h-[56px]" style={{
      background: 'var(--topnav-bg)',
      backdropFilter: 'blur(16px) saturate(180%)',
      borderBottom: '1px solid var(--topnav-border)',
    }}>
      <div className="flex items-center justify-between h-full px-4 sm:px-5">
        <div className="flex items-center gap-3">
          <button onClick={() => dispatch(toggleSidebar())} className="lg:hidden p-1.5 rounded-lg transition-colors" style={{ color: 'var(--t3)' }} id="menu-toggle">
            <Menu className="w-5 h-5" />
          </button>
          <div className={`hidden sm:flex items-center gap-2 rounded-xl px-3.5 py-[8px] transition-all duration-300 ${searchFocused ? 'w-80' : 'w-64'}`}
            style={{
              background: searchFocused ? 'var(--topnav-search-bg-focus)' : 'var(--topnav-search-bg)',
              border: `1px solid ${searchFocused ? 'var(--topnav-search-border-focus)' : 'var(--topnav-search-border)'}`,
              boxShadow: searchFocused ? 'var(--topnav-search-shadow)' : 'none',
            }}>
            <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: searchFocused ? '#0D9488' : 'var(--t5)' }} />
            <input ref={searchRef} type="text" placeholder="Search..." className="bg-transparent outline-none w-full" style={{ fontSize: '13px', color: 'var(--t1)' }}
              onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} id="global-search" />
            {!searchFocused && <kbd className="flex-shrink-0 px-1.5 py-0.5 rounded-md" style={{ fontSize: '10px', fontWeight: 600, background: 'var(--topnav-kbd-bg)', color: 'var(--t5)', border: '1px solid var(--topnav-kbd-border)' }}>⌘K</kbd>}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={toggleTheme} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--t3)' }} id="theme-toggle">
            {theme === 'dark' ? <Sun className="w-4 h-4" style={{ color: '#D97706' }} /> : <Moon className="w-4 h-4" />}
          </button>
          <NotificationBell />
          <div className="relative ml-1.5" ref={menuRef}>
            <button onClick={() => setShowMenu(!showMenu)} className="flex items-center gap-2 px-1.5 py-1 rounded-lg transition-colors" id="user-menu">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ fontSize: '11px', fontWeight: 700, background: 'linear-gradient(135deg, #0D9488, #0F766E)', color: '#fff', boxShadow: 'var(--avatar-shadow)' }}>{getInitials(user?.name)}</div>
              <div className="hidden md:block text-left">
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)', lineHeight: 1.2 }}>{user?.name}</p>
                <p style={{ fontSize: '10px', color: 'var(--t5)', textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ')}</p>
              </div>
              <ChevronDown className="w-3 h-3 hidden md:block" style={{ color: 'var(--t5)' }} />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1.5 w-52 rounded-xl py-1.5 animate-scale-in" style={{
                background: 'var(--dropdown-bg)',
                border: '1px solid var(--dropdown-border)',
                boxShadow: 'var(--dropdown-shadow)',
              }}>
                <div className="px-3.5 py-2.5" style={{ borderBottom: '1px solid var(--dropdown-divider)' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)' }}>{user?.name}</p>
                  <p style={{ fontSize: '11px', color: 'var(--t5)', textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ')}</p>
                </div>
                <button onClick={() => { navigate('/settings'); setShowMenu(false); }}
                  className="w-full text-left px-3.5 py-2 transition-colors flex items-center gap-2.5"
                  style={{ fontSize: '13px', color: 'var(--t2)' }}><User className="w-3.5 h-3.5" style={{ color: 'var(--t4)' }} /> Settings</button>
                <div className="mx-3 my-0.5" style={{ height: '1px', background: 'var(--dropdown-divider)' }} />
                <button onClick={() => { dispatch(logout()); navigate('/login'); setShowMenu(false); }}
                  className="w-full text-left px-3.5 py-2 transition-colors flex items-center gap-2.5"
                  style={{ fontSize: '13px', color: '#DC2626' }}><LogOut className="w-3.5 h-3.5" /> Sign out</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
