import api from './api';

const attendanceService = {
  getAll: (params) => api.get('/api/attendance', { params }),
  mark: (data) => api.post('/api/attendance', data),
  markBulk: (data) => api.post('/api/attendance/bulk', data),
  getWorkerSummary: (workerId, params) => api.get(`/api/attendance/summary/${workerId}`, { params }),
};

export default attendanceService;
