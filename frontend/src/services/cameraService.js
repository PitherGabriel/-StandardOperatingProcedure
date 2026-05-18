import { api } from '../api/client';

export async function analyzePhoto(imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);
  const res = await api.postForm('/analyze-picture', formData);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error del servidor: ${res.status} - ${text}`);
  }
  return res.json();
}
