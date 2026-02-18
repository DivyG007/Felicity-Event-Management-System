import API from './axiosInstance';

export const submitFeedback = (data) => API.post('/feedback', data);
export const getEventFeedback = (eventId) => API.get(`/feedback/event/${eventId}`);
