import api from './api';

export const getAdminStats = () => api.get('/admin/stats');
export const getAdminUsers = (params) => api.get('/admin/users', { params });
export const setUserBlocked = (id, blocked) => api.patch(`/admin/users/${id}/block`, { blocked });
export const setUserRole = (id, role) => api.patch(`/admin/users/${id}/role`, { role });
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);
export const getAdminItems = (params) => api.get('/admin/items', { params });
