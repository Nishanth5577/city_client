import api from './api';

const resourceService = {
  // Materials
  getMaterials: (params) => api.get('/api/materials', { params }),
  createMaterial: (data) => api.post('/api/materials', data),
  updateMaterial: (id, data) => api.put(`/api/materials/${id}`, data),
  deleteMaterial: (id) => api.delete(`/api/materials/${id}`),
  getLowStock: () => api.get('/api/materials/low-stock'),

  // Equipment
  getEquipment: (params) => api.get('/api/equipment', { params }),
  createEquipment: (data) => api.post('/api/equipment', data),
  updateEquipment: (id, data) => api.put(`/api/equipment/${id}`, data),
  deleteEquipment: (id) => api.delete(`/api/equipment/${id}`),
  getMaintenanceDue: () => api.get('/api/equipment/maintenance-due'),
};

export default resourceService;
