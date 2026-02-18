import API from './axiosInstance';

export const getProfile = () => API.get('/users/profile');
export const updateProfile = (data) => API.put('/users/profile', data);
export const completeOnboarding = (data) => API.put('/users/onboarding', data);
export const changePassword = (data) => API.put('/users/password', data);
