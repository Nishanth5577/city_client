import api from './api';

const authService = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (data) => api.post('/api/auth/register', data),
  logout: () => api.post('/api/auth/logout'),
  refresh: (refreshToken) => api.post('/api/auth/refresh', { refreshToken }),
  getMe: () => api.get('/api/auth/me'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
  changePassword: (data) => api.put('/api/auth/change-password', data),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/api/auth/reset-password/${token}`, { password }),
  getUsers: (params) => api.get('/api/auth/users', { params }),
  updateUser: (id, data) => api.put(`/api/auth/users/${id}`, data),
};

export default authService;
