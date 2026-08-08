import api from './api';

const reportService = {
  getProjectPDF: (projectId) => api.get(`/api/reports/project/${projectId}/pdf`, { responseType: 'blob' }),
  getExpensePDF: (projectId) => api.get(`/api/reports/expense/${projectId}/pdf`, { responseType: 'blob' }),
  getWorkerExcel: (params) => api.get('/api/reports/workers/excel', { params, responseType: 'blob' }),
  getMaterialExcel: (params) => api.get('/api/reports/materials/excel', { params, responseType: 'blob' }),
};

export default reportService;
