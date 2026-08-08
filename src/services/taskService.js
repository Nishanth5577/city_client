import api from './api';

const taskService = {
  getAll: (params) => api.get('/api/tasks', { params }),
  getOne: (id) => api.get(`/api/tasks/${id}`),
  create: (data) => api.post('/api/tasks', data),
  update: (id, data) => api.put(`/api/tasks/${id}`, data),
  delete: (id) => api.delete(`/api/tasks/${id}`),
  getByProject: (projectId) => api.get('/api/tasks', { params: { project_id: projectId } }),
  getGantt: (projectId) => api.get('/api/tasks/gantt', { params: { project_id: projectId } }),
};

export default taskService;
