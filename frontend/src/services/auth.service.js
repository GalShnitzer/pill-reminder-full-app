import api from './api';

export const googleSignIn = (idToken) => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return api.post('/auth/google', { idToken, timezone }).then((r) => r.data);
};

export const getMe = () =>
  api.get('/auth/me').then((r) => r.data);

export const signOut = () =>
  api.post('/auth/signout').then((r) => r.data);
