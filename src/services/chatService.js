import api from './api';

const chatService = {
  getConversations: () => api.get('/api/chat/conversations'),
  getConversation: (userId) => api.get(`/api/chat/conversation/${userId}`),
  sendMessage: (data) => api.post('/api/chat/message', data),
};

export default chatService;
