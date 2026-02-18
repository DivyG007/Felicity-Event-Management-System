import API from './axiosInstance';

export const registerForEvent = (data) => API.post('/registrations', data);
export const getMyRegistrations = (params) => API.get('/registrations/my', { params });
export const getTicket = (id) => API.get(`/registrations/${id}/ticket`);
export const uploadPaymentProof = (id, formData) => API.post(`/registrations/${id}/payment-proof`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updatePaymentStatus = (id, data) => API.put(`/registrations/${id}/payment-status`, data);
export const markAttendance = (id, data) => API.post(`/registrations/${id}/attendance`, data);
export const getAttendanceReport = (eventId, params) => API.get(`/registrations/event/${eventId}/attendance`, { params });
