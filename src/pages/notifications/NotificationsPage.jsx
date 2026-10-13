import { useEffect, useState } from 'react';
import api from '../../services/api';
import { formatRelative } from '../../utils/helpers';
import { Bell, Check, CheckCheck, Trash2, AlertTriangle, Info, CheckCircle2, Clock } from 'lucide-react';

const NOTIF_ICONS = {
  warning: { icon: AlertTriangle, color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
  error: { icon: AlertTriangle, color: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
  success: { icon: CheckCircle2, color: '#059669', bg: 'rgba(5,150,105,0.08)' },
  info: { icon: Info, color: '#0D9488', bg: 'rgba(13,148,136,0.08)' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    api.get('/api/notifications')
      .then(r => setNotifications(r.data.notifications || []))
      .finally(() => setLoading(false));
  }, []);

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

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch { /* ignore */ }
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.status === filter);

  if (loading) return (
    <div className="space-y-4">
      <div className="skeleton rounded-2xl" style={{ height: '60px' }} />
      {[...Array(5)].map((_, i) => <div key={i} className="skeleton rounded-2xl" style={{ height: '72px' }} />)}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--t1)' }}>Notifications</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200"
            style={{ background: 'rgba(37,99,235,0.08)', color: 'var(--accent)', border: '1px solid rgba(212, 136, 42, 0.2)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(212, 136, 42, 0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(37,99,235,0.08)'}
          >
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['all', 'unread', 'read'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 capitalize"
            style={{
              background: filter === f ? 'rgba(37,99,235,0.08)' : 'transparent',
              color: filter === f ? 'var(--accent)' : 'var(--t3)',
              border: `1px solid ${filter === f ? 'rgba(212, 136, 42, 0.3)' : 'var(--glass-hover)'}`,
            }}
          >
            {f} {f === 'unread' && unreadCount > 0 ? `(${unreadCount})` : ''}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      <div className="space-y-2">
        {filtered.map(notif => {
          const type = notif.type || 'info';
          const config = NOTIF_ICONS[type] || NOTIF_ICONS.info;
          const IconComponent = config.icon;

          return (
            <div key={notif._id}
              className="group flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200"
              style={{
                background: notif.status === 'unread' ? 'rgba(17, 27, 36, 0.5)' : 'transparent',
                border: `1px solid ${notif.status === 'unread' ? 'rgba(37,99,235,0.08)' : 'var(--glass)'}`,
                opacity: notif.status === 'read' ? 0.7 : 1,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = notif.status === 'unread' ? 'rgba(17, 27, 36, 0.5)' : 'transparent'}
              onClick={() => notif.status === 'unread' && markAsRead(notif._id)}
            >
              {/* Icon */}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: config.bg }}>
                <IconComponent className="w-4 h-4" style={{ color: config.color }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed" style={{ color: notif.status === 'unread' ? 'var(--t1)' : 'var(--t3)', fontWeight: notif.status === 'unread' ? 500 : 400 }}>
                  {notif.message}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--t4)' }}>{formatRelative(notif.createdAt)}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                {notif.status === 'unread' && (
                  <button onClick={(e) => { e.stopPropagation(); markAsRead(notif._id); }} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--t3)' }} title="Mark as read">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); deleteNotification(notif._id); }} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--t4)' }} title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Unread dot */}
              {notif.status === 'unread' && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2" style={{ background: 'var(--accent)' }} />}
            </div>
          );
        })}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--glass)' }}>
              <Bell className="w-8 h-8" style={{ color: 'var(--t5)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--t3)' }}>
              {filter === 'unread' ? 'No unread notifications' : filter === 'read' ? 'No read notifications' : 'No notifications yet'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--t4)' }}>
              {filter === 'unread' ? 'You\'re all caught up!' : 'Notifications will appear here'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
