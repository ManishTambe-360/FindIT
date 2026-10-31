import api from './api';

export const getItemMatches = (itemId) => api.get(`/matches/item/${itemId}`);
export const refreshItemMatches = (itemId) => api.post(`/matches/item/${itemId}/refresh`);
export const getMyMatchCounts = () => api.get('/matches/mine');
export const dismissMatch = (id) => api.patch(`/matches/${id}/dismiss`);
