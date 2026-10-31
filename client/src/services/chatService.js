import api from './api';

export const getConversations = () => api.get('/chats');
export const getUnreadChatCount = () => api.get('/chats/unread-count');
export const startConversation = (itemId, userId) => api.post(`/chats/item/${itemId}`, userId ? { userId } : {});
export const getMessages = (conversationId, before) =>
  api.get(`/chats/${conversationId}/messages`, { params: before ? { before } : {} });
export const sendMessage = (conversationId, text) => api.post(`/chats/${conversationId}/messages`, { text });
export const markConversationRead = (conversationId) => api.patch(`/chats/${conversationId}/read`);
