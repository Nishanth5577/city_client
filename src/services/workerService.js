import api from './api';

const workerService = {
  getAll: (params) => api.get('/api/workers', { params }),
  getOne: (id) => api.get(`/api/workers/${id}`),
  create: (data) => api.post('/api/workers', data),
  update: (id, data) => api.put(`/api/workers/${id}`, data),
  delete: (id) => api.delete(`/api/workers/${id}`),
  markAttendance: (id, data) => api.post(`/api/workers/${id}/attendance`, data),
  getProductivity: () => api.get('/api/workers/productivity'),
};

export default workerService;
