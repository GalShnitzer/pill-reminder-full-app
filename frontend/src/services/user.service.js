import api from './api';

export const getProfile = () =>
  api.get('/users/profile').then((r) => r.data.user);

export const updateProfile = (data) =>
  api.patch('/users/profile', data).then((r) => r.data.user);

export const saveResendKey = (apiKey) =>
  api.put('/users/resend-key', { apiKey }).then((r) => r.data);

export const deleteResendKey = () =>
  api.delete('/users/resend-key').then((r) => r.data);

export const sendTestEmail = () =>
  api.post('/users/test-email').then((r) => r.data);
