import api from './api';

const expenseService = {
  getAll: (params) => api.get('/api/expenses', { params }),
  getOne: (id) => api.get(`/api/expenses/${id}`),
  create: (data) => api.post('/api/expenses', data),
  update: (id, data) => api.put(`/api/expenses/${id}`, data),
  delete: (id) => api.delete(`/api/expenses/${id}`),
  approve: (id) => api.put(`/api/expenses/${id}/approve`),
  reject: (id) => api.put(`/api/expenses/${id}/reject`),
};

export default expenseService;
