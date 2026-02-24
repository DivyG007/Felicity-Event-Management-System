import API from './axiosInstance';

export const getAllOrganizers = () => API.get('/organizers');
export const getOrganizerById = (id) => API.get(`/organizers/${id}`);
export const updateOrganizerProfile = (data) => API.put('/organizers/profile', data);
export const followOrganizer = (id) => API.post(`/organizers/follow/${id}`);
export const unfollowOrganizer = (id) => API.delete(`/organizers/follow/${id}`);
export const requestPasswordReset = (data) => API.post('/organizers/password-reset-request', data);
export const getPasswordResetStatus = () => API.get('/organizers/password-reset-status');
export const testDiscordWebhook = () => API.post('/organizers/test-webhook');
