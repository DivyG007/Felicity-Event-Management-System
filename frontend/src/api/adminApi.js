import API from './axiosInstance';

export const createOrganizer = (data) => API.post('/admin/organizers', data);
export const listOrganizers = () => API.get('/admin/organizers');
export const removeOrganizer = (id) => API.delete(`/admin/organizers/${id}`);
export const manageOrganizerAction = (id, action) => API.delete(`/admin/organizers/${id}`, { params: { action } });
export const getPasswordResetRequests = () => API.get('/admin/password-reset-requests');
export const handlePasswordResetRequest = (id, data) => API.put(`/admin/password-reset-requests/${id}`, data);
