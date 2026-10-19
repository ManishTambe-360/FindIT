import api from './api';

export const submitClaim = (itemId, data) => api.post(`/claims/item/${itemId}`, data);
export const getMyClaims = () => api.get('/claims/mine');
export const getReceivedClaims = () => api.get('/claims/received');
export const getPendingCount = () => api.get('/claims/pending-count');
export const updateClaimStatus = (id, status, ownerNote = '') =>
  api.patch(`/claims/${id}/status`, { status, ownerNote });