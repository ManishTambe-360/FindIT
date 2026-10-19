import api from './api';

export const getItems = (params) => api.get('/items', { params });
export const getMyItems = () => api.get('/items/mine');
export const getItem = (id) => api.get(`/items/${id}`);
export const createItem = (formData) => api.post('/items', formData);
export const updateItem = (id, formData) => api.put(`/items/${id}`, formData);
export const updateItemStatus = (id, status) => api.patch(`/items/${id}/status`, { status });
export const deleteItem = (id) => api.delete(`/items/${id}`);
export const getMapItems = (params) => api.get('/items/map', { params });