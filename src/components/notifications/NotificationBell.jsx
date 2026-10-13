import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { fetchNotifications, markAsRead, markAllRead } from '../../redux/slices/notificationSlice';
import NotificationItem from './NotificationItem';

export default function NotificationBell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, unreadCount } = useSelector(s => s.notifications);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => { dispatch(fetchNotifications({ limit: 10 })); }, [dispatch]);
  useEffect(() => { const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color:'var(--t3)' }} id="notification-bell">
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center px-1"
            style={{ fontSize:'10px', fontWeight:700, background:'#DC2626', color:'#fff', boxShadow:'0 0 8px rgba(220,38,38,0.3)' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-9 w-80 sm:w-96 rounded-xl z-50 animate-scale-in overflow-hidden"
          style={{ background:'var(--dropdown-bg)', border:'1px solid var(--dropdown-border)', boxShadow:'var(--dropdown-shadow)' }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom:'1px solid var(--dropdown-divider)' }}>
            <span style={{ fontSize:'13px', fontWeight:600, color:'var(--t1)' }}>Notifications</span>
            {unreadCount > 0 && <button onClick={() => dispatch(markAllRead())} style={{ fontSize:'12px', fontWeight:500, color:'#0D9488' }} className="hover:text-teal-700 transition-colors">Mark all read</button>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {list.slice(0,10).map(n => <div key={n._id} style={{ borderBottom:'1px solid var(--dropdown-divider)' }}><NotificationItem notification={n} onMarkRead={id => dispatch(markAsRead(id))} /></div>)}
            {list.length === 0 && <p className="text-center py-8" style={{ fontSize:'13px', color:'var(--t5)' }}>No notifications</p>}
          </div>
          <div className="p-2" style={{ borderTop:'1px solid var(--dropdown-divider)' }}>
            <button onClick={() => { setOpen(false); navigate('/notifications'); }}
              className="w-full py-1.5 text-center rounded-lg hover:bg-black/4 dark:hover:bg-white/4 transition-colors"
              style={{ fontSize:'13px', fontWeight:500, color:'#0D9488' }}>View all</button>
          </div>
        </div>
      )}
    </div>
  );
}
