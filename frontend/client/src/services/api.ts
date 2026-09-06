// frontend/client/src/services/api.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs 403
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      // Rediriger vers la page de connexion
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================
// AUTH
// ============================================================
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/token', new URLSearchParams({ username, password })),

  register: (data: any) => api.post('/auth/register', data),

  getCurrentUser: () => api.get('/users/me'),
};

// ============================================================
// PRODUCTS
// ============================================================
export const productApi = {
  getAll: () => api.get('/products'),
  getBySlug: (slug: string) => api.get(`/products/${slug}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// ============================================================
// SHOPS
// ============================================================
export const shopApi = {
  getAll: (city?: string) => api.get('/shops', { params: { city } }),
  create: (data: any) => api.post('/shops', data),
  approve: (id: string) => api.patch(`/shops/${id}/approve`, {}),
  reject: (id: string, reason: string) => 
    api.patch(`/shops/${id}/reject`, { rejection_reason: reason }),
};

// ============================================================
// UPLOAD
// ============================================================
export const uploadApi = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ============================================================
// CATEGORIES
// ============================================================
export const categoryApi = {
  getAll: () => api.get('/categories'),
  create: (data: any) => api.post('/categories', data),
};

// ============================================================
// CITIES
// ============================================================
export const cityApi = {
  getAll: () => api.get('/cities'),
  create: (data: any) => api.post('/cities', data),
};

// ============================================================
// USERS (Admin)
// ============================================================
export const userApi = {
  getAll: () => api.get('/users'),
};

export default api;