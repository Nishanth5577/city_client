import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { fetchNotifications, markAsRead, markAllRead } from '../../redux/slices/notificationSlice';
import NotificationItem from './NotificationItem';

export default function NotificationBell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, unreadCount } = useSelector((state) => state.notifications);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    dispatch(fetchNotifications({ limit: 10 }));
  }, [dispatch]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkRead = (id) => {
    dispatch(markAsRead(id));
  };

  const handleMarkAll = () => {
    dispatch(markAllRead());
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        id="notification-bell"
      >
        <Bell className="w-5 h-5 text-surface-500 dark:text-surface-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 glass-card shadow-2xl z-50 animate-scale-in overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
            <h3 className="font-semibold text-surface-900 dark:text-white text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-surface-100 dark:divide-surface-800">
            {list.slice(0, 10).map((n) => (
              <NotificationItem key={n._id} notification={n} onMarkRead={handleMarkRead} />
            ))}
            {list.length === 0 && (
              <p className="text-center text-surface-400 py-8 text-sm">No notifications</p>
            )}
          </div>
          <div className="p-3 border-t border-surface-200 dark:border-surface-700">
            <button
              onClick={() => { setOpen(false); navigate('/notifications'); }}
              className="w-full py-2 text-sm text-primary-600 hover:text-primary-700 font-medium text-center rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
