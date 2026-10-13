import api from './api';

const siteProgressService = {
  getAll: (params) => api.get('/api/dpr', { params }),
  getOne: (id) => api.get(`/api/dpr/${id}`),
  create: (data) => api.post('/api/dpr', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.put(`/api/dpr/${id}`, data),
  delete: (id) => api.delete(`/api/dpr/${id}`),
};

export default siteProgressService;
