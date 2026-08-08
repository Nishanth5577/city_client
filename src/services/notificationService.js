import api from './api';

const notificationService = {
  getAll: (params) => api.get('/api/notifications', { params }),
  markAsRead: (id) => api.put(`/api/notifications/${id}/read`),
  markAllRead: () => api.put('/api/notifications/read-all'),
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
};

export default notificationService;
