import api from './api';

const paymentService = {
  getAll: (params) => api.get('/api/payments', { params }),
  getSummary: (params) => api.get('/api/payments/summary', { params }),
  create: (data) => api.post('/api/payments', data),
  update: (id, data) => api.put(`/api/payments/${id}`, data),
  delete: (id) => api.delete(`/api/payments/${id}`),
};

export default paymentService;
