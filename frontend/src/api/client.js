const BASE = (import.meta.env.VITE_BACKEND_API_URL || '').replace(/\/$/, '');

async function request(path, options = {}) {
  return fetch(`${BASE}${path}`, { credentials: 'include', ...options });
}

export const api = {
  get: (path) => request(path),
  post: (path, body) =>
    request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  postForm: (path, formData) =>
    request(path, { method: 'POST', body: formData }),
};
