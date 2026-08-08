import api from './api';

const projectService = {
  getAll: (params) => api.get('/api/projects', { params }),
  getOne: (id) => api.get(`/api/projects/${id}`),
  create: (data) => api.post('/api/projects', data),
  update: (id, data) => api.put(`/api/projects/${id}`, data),
  delete: (id) => api.delete(`/api/projects/${id}`),
  getStats: () => api.get('/api/projects/stats/overview'),
  getPublic: (id) => api.get(`/api/projects/public/${id}`),
};

export default projectService;
