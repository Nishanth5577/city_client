import api from './api';

const documentService = {
  getAll: (params) => api.get('/api/documents', { params }),
  upload: (formData) => api.post('/api/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  download: (id) => api.get(`/api/documents/${id}/download`, { responseType: 'blob' }),
  delete: (id) => api.delete(`/api/documents/${id}`),
};

export default documentService;
