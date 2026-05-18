import { api } from '../api/client';

export async function checkAuth() {
  const res = await api.get('/auth/check');
  return res.json();
}

export async function login(credentials) {
  const res = await api.post('/auth/login', credentials);
  return res.json();
}

export async function logout() {
  await api.post('/auth/logout', {});
}
