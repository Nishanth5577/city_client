import api from './api';

const BIM_BASE = '/api/bim';

const bimService = {
  // Projects
  getProjects: (params) => api.get(`${BIM_BASE}/projects`, { params }),
  getProject: (id) => api.get(`${BIM_BASE}/projects/${id}`),
  createProject: (data) => api.post(`${BIM_BASE}/projects`, data),
  updateProject: (id, data) => api.put(`${BIM_BASE}/projects/${id}`, data),
  deleteProject: (id) => api.delete(`${BIM_BASE}/projects/${id}`),
  addCollaborator: (id, data) => api.post(`${BIM_BASE}/projects/${id}/collaborators`, data),

  // Buildings
  getBuildings: (bim_project_id) => api.get(`${BIM_BASE}/buildings`, { params: { bim_project_id } }),
  getBuilding: (id) => api.get(`${BIM_BASE}/buildings/${id}`),
  createBuilding: (data) => api.post(`${BIM_BASE}/buildings`, data),
  updateBuilding: (id, data) => api.put(`${BIM_BASE}/buildings/${id}`, data),
  deleteBuilding: (id) => api.delete(`${BIM_BASE}/buildings/${id}`),

  // Floors
  getFloors: (params) => api.get(`${BIM_BASE}/floors`, { params }),
  getFloor: (id) => api.get(`${BIM_BASE}/floors/${id}`),
  updateFloor: (id, data) => api.put(`${BIM_BASE}/floors/${id}`, data),
  saveCanvas: (id, data) => api.put(`${BIM_BASE}/floors/${id}/canvas`, data),
  duplicateFloor: (id, data) => api.post(`${BIM_BASE}/floors/${id}/duplicate`, data),

  // Elements (unified)
  getElements: (params) => api.get(`${BIM_BASE}/elements`, { params }),
  getElement: (type, id) => api.get(`${BIM_BASE}/elements/${type}/${id}`),
  createElement: (data) => api.post(`${BIM_BASE}/elements`, data),
  updateElement: (type, id, data) => api.put(`${BIM_BASE}/elements/${type}/${id}`, data),
  deleteElement: (type, id) => api.delete(`${BIM_BASE}/elements/${type}/${id}`),
  batchCreate: (data) => api.post(`${BIM_BASE}/elements/batch`, data),
  batchUpdate: (data) => api.put(`${BIM_BASE}/elements/batch`, data),

  // Materials
  getMaterials: (params) => api.get(`${BIM_BASE}/materials`, { params }),
  getMaterial: (id) => api.get(`${BIM_BASE}/materials/${id}`),
  createMaterial: (data) => api.post(`${BIM_BASE}/materials`, data),
  updateMaterial: (id, data) => api.put(`${BIM_BASE}/materials/${id}`, data),
  deleteMaterial: (id) => api.delete(`${BIM_BASE}/materials/${id}`),
  seedMaterials: () => api.post(`${BIM_BASE}/materials/seed`),

  // Cost Estimation
  getCostEstimations: (bim_project_id) => api.get(`${BIM_BASE}/cost-estimation`, { params: { bim_project_id } }),
  getCostEstimation: (id) => api.get(`${BIM_BASE}/cost-estimation/${id}`),
  generateBOQ: (data) => api.post(`${BIM_BASE}/cost-estimation/generate`, data),
  updateCostEstimation: (id, data) => api.put(`${BIM_BASE}/cost-estimation/${id}`, data),
  deleteCostEstimation: (id) => api.delete(`${BIM_BASE}/cost-estimation/${id}`),

  // Collaboration
  joinSession: (data) => api.post(`${BIM_BASE}/collab/join`, data),
  leaveSession: (data) => api.post(`${BIM_BASE}/collab/leave`, data),
  getActiveCollaborators: (bim_project_id) => api.get(`${BIM_BASE}/collab/active`, { params: { bim_project_id } }),
  updateCursor: (data) => api.put(`${BIM_BASE}/collab/cursor`, data),
  getComments: (params) => api.get(`${BIM_BASE}/collab/comments`, { params }),
  addComment: (data) => api.post(`${BIM_BASE}/collab/comments`, data),
  getApprovals: (bim_project_id) => api.get(`${BIM_BASE}/collab/approvals`, { params: { bim_project_id } }),
  submitApproval: (data) => api.post(`${BIM_BASE}/collab/approvals`, data),
  reviewApproval: (id, data) => api.put(`${BIM_BASE}/collab/approvals/${id}`, data),
  getRevisions: (bim_project_id) => api.get(`${BIM_BASE}/collab/revisions`, { params: { bim_project_id } }),
  saveRevision: (data) => api.post(`${BIM_BASE}/collab/revisions`, data),

  // Exports
  exportProject: (projectId, format) => api.get(`${BIM_BASE}/exports/${projectId}`, { params: { format } }),
  exportFloor: (floorId) => api.get(`${BIM_BASE}/exports/floor/${floorId}`),

  // Analytics
  getAnalytics: () => api.get(`${BIM_BASE}/analytics`),

  // Structural
  generateStructural: (data) => api.post(`${BIM_BASE}/structural/generate`, data),
  getStructural: (projectId) => api.get(`${BIM_BASE}/structural/${projectId}`),
  updateStructural: (id, data) => api.put(`${BIM_BASE}/structural/${id}`, data),
  getColumnSchedule: (projectId) => api.get(`${BIM_BASE}/structural/schedule/${projectId}/columns`),
  getBeamSchedule: (projectId) => api.get(`${BIM_BASE}/structural/schedule/${projectId}/beams`),

  // MEP
  createMEPElement: (type, data) => api.post(`${BIM_BASE}/mep/${type}`, data),
  getMEPElements: (type, floorId) => api.get(`${BIM_BASE}/mep/${type}/floor/${floorId}`),
  updateMEPElement: (type, id, data) => api.put(`${BIM_BASE}/mep/${type}/${id}`, data),
  deleteMEPElement: (type, id) => api.delete(`${BIM_BASE}/mep/${type}/${id}`),

  // MEP Analysis
  electricalLoadAnalysis: (floorId) => api.get(`${BIM_BASE}/mep/analysis/electrical/${floorId}`),
  plumbingPipeSchedule: (floorId) => api.get(`${BIM_BASE}/mep/analysis/plumbing/${floorId}`),
  hvacCoolingLoad: (floorId) => api.get(`${BIM_BASE}/mep/analysis/hvac/${floorId}`),
  solarEstimate: (projectId) => api.get(`${BIM_BASE}/mep/analysis/solar/${projectId}`),

  // Imports
  uploadCAD: (formData) => api.post(`${BIM_BASE}/import/cad`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getCADImports: (projectId) => api.get(`${BIM_BASE}/import/cad/${projectId}`),
  deleteCADImport: (id) => api.delete(`${BIM_BASE}/import/cad/${id}`),
  uploadPDF: (formData) => api.post(`${BIM_BASE}/import/pdf`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getPDFImports: (projectId) => api.get(`${BIM_BASE}/import/pdf/${projectId}`),
  saveTracedGeometry: (id, data) => api.put(`${BIM_BASE}/import/pdf/${id}/trace`, data),
  deletePDFImport: (id) => api.delete(`${BIM_BASE}/import/pdf/${id}`),
  uploadIFC: (formData) => api.post(`${BIM_BASE}/import/ifc`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getIFCImports: (projectId) => api.get(`${BIM_BASE}/import/ifc/${projectId}`),
  deleteIFCImport: (id) => api.delete(`${BIM_BASE}/import/ifc/${id}`),
  getImportSummary: (projectId) => api.get(`${BIM_BASE}/import/summary/${projectId}`),

  // AI Architect
  generateFloorPlan: (data) => api.post(`${BIM_BASE}/ai/generate-plan`, data),
  getAISuggestions: (projectId) => api.get(`${BIM_BASE}/ai/suggestions/${projectId}`),
  getVastuAnalysis: (projectId, facing) => api.get(`${BIM_BASE}/ai/vastu/${projectId}`, { params: { facing } }),

  // Virtual Tour
  createTour: (data) => api.post(`${BIM_BASE}/virtual-tour`, data),
  getTours: (projectId) => api.get(`${BIM_BASE}/virtual-tour/${projectId}`),
  getTour: (idOrToken) => api.get(`${BIM_BASE}/virtual-tour/view/${idOrToken}`),
  updateTour: (id, data) => api.put(`${BIM_BASE}/virtual-tour/${id}`, data),
  deleteTour: (id) => api.delete(`${BIM_BASE}/virtual-tour/${id}`),
  addWaypoint: (id, data) => api.post(`${BIM_BASE}/virtual-tour/${id}/waypoints`, data),
  updateWaypoint: (id, idx, data) => api.put(`${BIM_BASE}/virtual-tour/${id}/waypoints/${idx}`, data),
  removeWaypoint: (id, idx) => api.delete(`${BIM_BASE}/virtual-tour/${id}/waypoints/${idx}`),
  addHotspot: (id, data) => api.post(`${BIM_BASE}/virtual-tour/${id}/hotspots`, data),
  togglePublishTour: (id) => api.put(`${BIM_BASE}/virtual-tour/${id}/publish`),

  // Collaboration
  joinCollabSession: (data) => api.post(`${BIM_BASE}/collab/join`, data),
  leaveCollabSession: (data) => api.post(`${BIM_BASE}/collab/leave`, data),
  getActiveCollaborators: (projectId) => api.get(`${BIM_BASE}/collab/active`, { params: { bim_project_id: projectId } }),
  updateCursorPosition: (data) => api.put(`${BIM_BASE}/collab/cursor`, data),

  // Exports (existing)
  exportProject: (projectId, format) => api.get(`${BIM_BASE}/exports/${projectId}`, { params: { format } }),
  exportFloor: (floorId) => api.get(`${BIM_BASE}/exports/floor/${floorId}`),

  // ═══════ Bonsai / IFC Integration ═══════
  // Service status
  getBonsaiStatus: () => api.get(`${BIM_BASE}/bonsai/status`),
  getIFCSchemaInfo: () => api.get(`${BIM_BASE}/bonsai/schema`),

  // Export to IFC
  exportToIFC: (projectId, config = {}) => api.post(`${BIM_BASE}/bonsai/export/${projectId}`, config),
  getIFCExports: (projectId) => api.get(`${BIM_BASE}/bonsai/exports/${projectId}`),
  deleteIFCExport: (id) => api.delete(`${BIM_BASE}/bonsai/exports/${id}`),
  downloadIFC: (filename) => api.get(`${BIM_BASE}/bonsai/download/${filename}`, { responseType: 'blob' }),

  // Import IFC
  importIFC: (formData) => api.post(`${BIM_BASE}/bonsai/import`, formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }),
  parseIFC: (formData) => api.post(`${BIM_BASE}/bonsai/parse`, formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }),

  // Validate IFC
  validateIFC: (exportId) => api.post(`${BIM_BASE}/bonsai/validate/${exportId}`),
};

export default bimService;
