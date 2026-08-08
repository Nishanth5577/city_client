import api from './api';

const supplierService = {
  getAll: (params) => api.get('/api/suppliers', { params }),
  getById: (id) => api.get(`/api/suppliers/${id}`),
  create: (data) => api.post('/api/suppliers', data),
  update: (id, data) => api.put(`/api/suppliers/${id}`, data),
  delete: (id) => api.delete(`/api/suppliers/${id}`),
};

export default supplierService;
