import api from './api';

export const getPills = () =>
  api.get('/pills').then((r) => r.data.pills);

export const createPill = (data) =>
  api.post('/pills', data).then((r) => r.data.pill);

export const updatePill = (id, data) =>
  api.patch(`/pills/${id}`, data).then((r) => r.data.pill);

export const deletePill = (id) =>
  api.delete(`/pills/${id}`).then((r) => r.data);

export const takePill = (id, scheduledHour) =>
  api.post(`/pills/${id}/take`, { scheduledHour }).then((r) => r.data);

export const untakePill = (id, scheduledHour) =>
  api.delete(`/pills/${id}/take`, { data: { scheduledHour } }).then((r) => r.data);

export const getPillHistory = (id) =>
  api.get(`/pills/${id}/history`).then((r) => r.data);
