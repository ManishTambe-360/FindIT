import api from './api';

export const getNotifications = (params) => api.get('/notifications', { params });
export const getUnreadNotificationCount = () => api.get('/notifications/unread-count');
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.patch('/notifications/read-all');
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);
export const clearReadNotifications = () => api.delete('/notifications');
