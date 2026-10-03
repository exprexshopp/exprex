import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
let authToken: string | null = localStorage.getItem('access_token');
let currentUser: any = null;
let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 5;

// ✅ Cache TTL
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5000;

// ✅ NOUVEAU : déduplication des requêtes en vol (évite 3x /categories)
const pendingRequests = new Map<string, Promise<any>>();

function getCached(key: string): any | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Déduplique les appels concurrents à la même clé.
 * Si un appel est déjà en cours, renvoie la même promesse au lieu d'en créer une nouvelle.
 */
function dedupedRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = pendingRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }
  const promise = fn().finally(() => pendingRequests.delete(key));
  pendingRequests.set(key, promise);
  return promise;
}

// ============================================================
// API CLIENT
// ============================================================
const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    consecutiveErrors = 0;
    return response;
  },
  (error) => {
    // 401 : token expiré
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_role');
      authToken = null;
      currentUser = null;
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    // Erreurs réseau massives
    if (error.code === 'ERR_NETWORK') {
      consecutiveErrors++;
      console.warn(`⚠️ Erreur réseau (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS})`);

      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.error('🚨 Trop d\'erreurs réseau consécutives, redirection...');
        consecutiveErrors = 0;
        if (!window.location.pathname.includes('/error')) {
          window.location.href = '/error';
        }
      }
    } else {
      consecutiveErrors = 0;
    }

    return Promise.reject(error);
  }
);

// ============================================================
// AUTH
// ============================================================
export const auth = {
  login: async (username: string, password: string, securityKey?: string) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    try {
      const response = await api.post('/auth/token', params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { access_token } = response.data;
      localStorage.setItem('access_token', access_token);
      authToken = access_token;

      const userResponse = await api.get('/users/me');
      currentUser = userResponse.data;
      return currentUser;
    } catch (error: any) {
      if (error?.response?.status === 403 && error?.response?.data?.requires_security_key) {
        throw new Error('SECURITY_KEY_REQUIRED');
      }
      throw error;
    }
  },

  register: async (data: any) => {
    const payload = {
      email: data.email,
      username: data.username || data.email,
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      password: data.password,
      role: data.role || 'CUSTOMER',
      gender: data.gender || null,
    };

    console.log('📝 Envoi inscription:', payload);

    const response = await api.post('/auth/register', payload);
    const { access_token } = response.data;
    localStorage.setItem('access_token', access_token);
    authToken = access_token;

    const userResponse = await api.get('/users/me');
    currentUser = userResponse.data;
    console.log('✅ Utilisateur créé:', currentUser);
    return currentUser;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    authToken = null;
    currentUser = null;
  },

  getCurrentUser: () => currentUser,

  refreshCurrentUser: async () => {
    if (!authToken) return null;
    try {
      const userResponse = await api.get('/users/me');
      currentUser = userResponse.data;
      return currentUser;
    } catch (error: any) {
      if (error?.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_role');
        authToken = null;
        currentUser = null;
        return null;
      }
      console.warn('refreshCurrentUser: erreur réseau, session préservée', error?.message);
      return null;
    }
  },
};

// ============================================================
// PRODUCTS
// ============================================================
export const products = {
  getAll: async (params?: any) => {
    const cacheKey = `products_${JSON.stringify(params || {})}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    return dedupedRequest(cacheKey, async () => {
      const response = await api.get('/products', { params });
      setCached(cacheKey, response.data);
      return response.data;
    });
  },

  getBySlug: async (slug: string) => {
    const response = await api.get(`/products/${slug}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/products', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/products/${id}`);
  },

  // Favoris
  getFavorites: async (userId: string) => {
    const response = await api.get(`/users/${userId}/favorites`);
    return response.data;
  },

  toggleFavorite: async (userId: string, productId: string) => {
    const response = await api.post(`/users/${userId}/favorites/${productId}`);
    return response.data;
  },

  isFavorite: async (userId: string, productId: string) => {
    const response = await api.get(`/users/${userId}/favorites/${productId}/status`);
    return response.data.isFavorite;
  },

  // Reviews
  getReviews: async (productId: string) => {
    const response = await api.get(`/products/${productId}/reviews`);
    return response.data;
  },

  saveReview: async (data: any) => {
    const response = await api.post(`/products/${data.product_id}/reviews`, data);
    return response.data;
  },

  // Analytics
  recordView: async (productId: string) => {
    await api.post(`/products/${productId}/view`);
  },

  recordWhatsAppClick: async (productId: string) => {
    await api.post(`/products/${productId}/whatsapp-click`);
  },
};

// ============================================================
// SHOPS
// ============================================================
export const shops = {
  getAll: async (city?: string) => {
    const response = await api.get('/shops', { params: { city } });
    return response.data;
  },

  getAllForAdmin: async () => {
    const response = await api.get('/shops', { params: { all: true } });
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/shops', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/shops/${id}`, data);
    return response.data;
  },

  approve: async (id: string, note: string = '') => {
    await api.patch(`/shops/${id}/approve`, { note });
  },

  reject: async (id: string, note: string = '') => {
    await api.patch(`/shops/${id}/reject`, { rejection_reason: note });
  },

  getAnalytics: async (shopId: string) => {
    const response = await api.get(`/shops/${shopId}/analytics`);
    return response.data;
  },

  updateHours: async (shopId: string, hours: any) => {
    const response = await api.patch(`/shops/${shopId}/hours`, { hours });
    return response.data;
  },
};

// ============================================================
// UPLOAD
// ============================================================
export const upload = {
  image: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.path;
  },
};

// ============================================================
// SUB-CATEGORIES
// ============================================================
export const subcategories = {
  getAll: async (categoryId?: string) => {
    const params: any = {};
    if (categoryId) params.category_id = categoryId;
    const response = await api.get('/subcategories', { params });
    return response.data;
  },

  getAllForAdmin: async () => {
    const response = await api.get('/subcategories', { params: { all: true } });
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/subcategories', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/subcategories/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/subcategories/${id}`);
  },
};

// ============================================================
// CATEGORIES
// ============================================================
export const categories = {
  getAll: async () => {
    const cacheKey = 'categories';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    return dedupedRequest(cacheKey, async () => {
      const response = await api.get('/categories');
      setCached(cacheKey, response.data);
      return response.data;
    });
  },

  getAllForAdmin: async () => {
    const response = await api.get('/categories', { params: { all: true } });
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/categories', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/categories/${id}`);
  },
};

// ============================================================
// CITIES
// ============================================================
export const cities = {
  getAll: async () => {
    const response = await api.get('/cities');
    return response.data;
  },

  getAllForAdmin: async () => {
    const response = await api.get('/cities', { params: { all: true } });
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/cities', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/cities/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/cities/${id}`);
  },
};

// ============================================================
// USERS (Admin)
// ============================================================
export const users = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/users', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/users/${id}`);
  },
};

// ============================================================
// MODERATION LOGS
// ============================================================
export const moderationLogs = {
  getAll: async () => {
    const response = await api.get('/moderation-logs');
    return response.data;
  },
};

// ============================================================
// EXPORT PRINCIPAL
// ============================================================
export const db = {
  // Auth
  getCurrentUser: () => auth.getCurrentUser(),
  refreshCurrentUser: () => auth.refreshCurrentUser(),
  authenticateUser: auth.login,
  registerUser: auth.register,
  logout: auth.logout,
  setCurrentUserRole: (role: string) => {
    if (currentUser) {
      currentUser.role = role;
      try {
        localStorage.setItem('user_role', role);
      } catch (e) {
        // Ignorer
      }
    }
  },

  updateShopHours: async (shopId: string, hours: any) => {
    return await shops.updateHours(shopId, hours);
  },

  // Products
  getCatalogProducts: async (filters: any) => {
  const params: any = {};
  if (filters.city)          params.city        = filters.city;
  if (filters.q)             params.search      = filters.q;
  if (filters.category)      params.category    = filters.category;
  if (filters.subcategory)   params.subcategory = filters.subcategory;
  if (filters.price_min != null) params.price_min = filters.price_min;
  if (filters.price_max != null) params.price_max = filters.price_max;
  if (filters.sort_by)       params.sort_by     = filters.sort_by;

  const all = await products.getAll(params);
  return {
    products: Array.isArray(all) ? all : [],
    total:    Array.isArray(all) ? all.length : 0,
    filterSummary: filters.q
      ? `Recherche: "${filters.q}"`
      : filters.city
        ? `Ville: ${filters.city}`
        : 'Tous les produits',
  };
},

  getProductBySlug: products.getBySlug,
  getProductsForShop: async (shopId: string) => {
    const all = await products.getAll();
    return all.filter((p: any) => p.shop_id === shopId);
  },
  deleteProduct: products.delete,

  saveProduct: async (data: any) => {
    console.log('📦 saveProduct reçu:', data);
    if (data.id && data.id !== 'undefined' && data.id !== '' && data.id !== null) {
      console.log('🔄 MISE À JOUR du produit ID:', data.id);
      const response = await api.put(`/products/${data.id}`, data);
      return response.data;
    } else {
      console.log('➕ CRÉATION d\'un nouveau produit');
      const response = await api.post('/products', data);
      return response.data;
    }
  },

  // Shops
  getAllShops: async (city?: string) => {
    const cacheKey = `shops_${city || 'all'}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    return dedupedRequest(cacheKey, async () => {
      const response = await api.get('/shops', { params: { city } });
      setCached(cacheKey, response.data);
      return response.data;
    });
  },

  getAdminShops: shops.getAllForAdmin,

  getActiveShops: async (city?: string) => {
    try {
      const all = await shops.getAll(city);
      return (all || []).filter((s: any) => s.status === 'ACTIVE' && s.is_active === true);
    } catch (error) {
      console.error('Erreur chargement boutiques actives:', error);
      return [];
    }
  },

  getSubcategories: async (categoryId: string) => {
    try {
      const response = await api.get('/subcategories', { params: { category_id: categoryId } });
      return response.data || [];
    } catch (error) {
      console.error('Erreur chargement sous-catégories:', error);
      return [];
    }
  },

  getShopBySlug: async (slug: string) => {
    const all = await shops.getAll();
    return all.find((s: any) => s.slug === slug) || null;
  },

  getShopByOwner: async (ownerId: string) => {
    try {
      const all = await shops.getAllForAdmin();
      return (all || []).find((s: any) =>
        s.owner_id === ownerId ||
        s.user_id === ownerId ||
        s.owner?.id === ownerId
      ) || null;
    } catch (error) {
      console.error('Erreur récupération boutique par propriétaire:', error);
      return null;
    }
  },

  saveShop: async (data: any) => {
    if (data.id) {
      const response = await api.put(`/shops/${data.id}`, data);
      return response.data;
    } else {
      const response = await api.post('/shops', data);
      return response.data;
    }
  },

  updateShop: shops.update,
  approveShop: async (id: string, email: string, note: string) => shops.approve(id, note),
  rejectShop: async (id: string, email: string, note: string) => shops.reject(id, note),

  // Upload
  uploadImage: async (file: File) => {
    return await upload.image(file);
  },

  // Categories
  getCategories: async () => {
    const cacheKey = 'categories';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    return dedupedRequest(cacheKey, async () => {
      const response = await api.get('/categories');
      setCached(cacheKey, response.data);
      return response.data;
    });
  },

  getAdminCategories: categories.getAllForAdmin,
  createCategory: categories.create,
  updateCategory: categories.update,
  deleteCategory: categories.delete,

  // Sub-categories
  getAdminSubcategories: subcategories.getAllForAdmin,
  createSubcategory: subcategories.create,
  updateSubcategory: subcategories.update,
  deleteSubcategory: subcategories.delete,

  // Cities
  getCities: async () => {
    try {
      const all = await cities.getAll();
      if (!Array.isArray(all)) return [];
      return all.map((c: any) => c.name || '');
    } catch (error) {
      console.error('Erreur chargement villes:', error);
      return [];
    }
  },

  getShopAnalytics: async (shopId: string) => {
    try {
      const response = await api.get(`/shops/${shopId}/analytics`);
      return {
        ...response.data,
        products: Array.isArray(response.data?.products) ? response.data.products : []
      };
    } catch (error) {
      console.error('Erreur chargement analytics:', error);
      return { totalViews: 0, totalWhatsApp: 0, totalRevenue: 0, products: [] };
    }
  },

  getAdminCities: cities.getAllForAdmin,
  createCity: cities.create,
  updateCity: cities.update,
  deleteCity: cities.delete,

  // Users (Admin)
  getUsers: users.getAll,
  deleteUser: users.delete,
  updateUser: users.update,
  createUser: users.create,

  // Moderation logs
  getModerationLogs: moderationLogs.getAll,

  // Favorites — VERSION OPTIMISÉE
  getUserFavorites: async (userId: string) => {
    const response = await api.get(`/users/${userId}/favorites`);
    return response.data;  // { product_ids: string[] }
  },

  toggleFavorite: async (userId: string, productId: string) => {
    try {
      const result = await products.toggleFavorite(userId, productId);
      return result.isFavorite || false;
    } catch (error) {
      console.error('Erreur toggle favori:', error);
      return false;
    }
  },

  // isFavorite conservé pour compatibilité (mais plus utilisé par ProductCard)
  isFavorite: async (userId: string, productId: string) => {
    try {
      const result = await products.isFavorite(userId, productId);
      return result || false;
    } catch (error) {
      return false;
    }
  },

  // Reviews
  getProductReviews: async (productId: string) => {
    try {
      return await products.getReviews(productId);
    } catch (error) {
      console.error('Erreur chargement avis:', error);
      return [];
    }
  },
  saveReview: async (data: any) => {
    try {
      return await products.saveReview(data);
    } catch (error) {
      console.error('Erreur sauvegarde avis:', error);
      return null;
    }
  },

  recordView: async (productId: string) => {
    try {
      await products.recordView(productId);
    } catch (error) {
      // Ignorer
    }
  },
  recordWhatsAppClick: async (productId: string) => {
    try {
      await products.recordWhatsAppClick(productId);
    } catch (error) {
      // Ignorer
    }
  },
  resetToDefaults: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
  },
};

export default db;