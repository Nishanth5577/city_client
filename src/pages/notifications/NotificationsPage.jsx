import { useEffect, useState } from 'react';
import api from '../../services/api';
import { formatRelative } from '../../utils/helpers';
import { Bell, Check, CheckCheck } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/api/notifications').then(r => setNotifications(r.data.notifications || [])).finally(() => setLoading(false)); }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, status: 'read' } : n));
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Notifications</h1><p className="text-surface-500 mt-1">{notifications.filter(n => n.status === 'unread').length} unread</p></div>
        <button onClick={markAllRead} className="btn-secondary flex items-center gap-2"><CheckCheck className="w-4 h-4" />Mark All Read</button>
      </div>

      <div className="space-y-2">
        {notifications.map(notif => (
          <div key={notif._id} className={`glass-card p-4 flex items-start gap-3 cursor-pointer transition-all ${notif.status === 'unread' ? 'border-l-4 border-l-primary-500' : 'opacity-75'}`} onClick={() => markAsRead(notif._id)}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${notif.status === 'unread' ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-surface-100 dark:bg-surface-800'}`}>
              <Bell className={`w-4 h-4 ${notif.status === 'unread' ? 'text-primary-600' : 'text-surface-400'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${notif.status === 'unread' ? 'font-medium text-surface-900 dark:text-white' : 'text-surface-600 dark:text-surface-400'}`}>{notif.message}</p>
              <p className="text-xs text-surface-400 mt-1">{formatRelative(notif.createdAt)}</p>
            </div>
            {notif.status === 'unread' && <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-2" />}
          </div>
        ))}
        {notifications.length === 0 && <div className="flex flex-col items-center py-16 text-surface-400"><Bell className="w-16 h-16 mb-4 opacity-30" /><p>No notifications</p></div>}
      </div>
    </div>
  );
}
