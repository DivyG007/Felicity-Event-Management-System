import API from './axiosInstance';

export const getEvents = (params) => API.get('/events', { params });
export const getTrendingEvents = () => API.get('/events/trending');
export const getEventById = (id) => API.get(`/events/${id}`);
export const createEvent = (data) => API.post('/events', data);
export const updateEvent = (id, data) => API.put(`/events/${id}`, data);
export const changeEventStatus = (id, data) => API.put(`/events/${id}/status`, data);
export const getEventParticipants = (id, params) => API.get(`/events/${id}/participants`, { params });
export const getEventAnalytics = (id) => API.get(`/events/${id}/analytics`);
