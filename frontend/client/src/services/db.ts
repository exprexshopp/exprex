import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
let authToken: string | null = localStorage.getItem('access_token');
let currentUser: any = null;
let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 5;


// ✅ Cache pour éviter les appels redondants
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5000; // 5 secondes

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





// ✅ Compteur d'erreurs consécutives pour éviter les faux positifs

api.interceptors.response.use(
  (response) => {
    consecutiveErrors = 0;
    return response;
  },
  (error) => {
    // ✅ Gestion 401 (déjà existant)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_role');
      authToken = null;
      currentUser = null;
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    // ✅ Détection des erreurs réseau massives
    if (error.code === 'ERR_NETWORK') {
      consecutiveErrors++;
      console.warn(`⚠️ Erreur réseau (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS})`);

      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.error('🚨 Trop d\'erreurs réseau consécutives, redirection...');
        consecutiveErrors = 0;
        // Éviter la boucle infinie
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



// AUTH
// ============================================================
export const auth = {
  login: async (username: string, password: string, securityKey?: string) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    try {
      const response = await api.post('/auth/token', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token } = response.data;
      localStorage.setItem('access_token', access_token);
      authToken = access_token;

      const userResponse = await api.get('/users/me');
      currentUser = userResponse.data;
      return currentUser;
    } catch (error: any) {
      // Gestion des erreurs spécifiques
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

  // Recharger l'utilisateur depuis le backend
  refreshCurrentUser: async () => {
  if (!authToken) return null;
  try {
    const userResponse = await api.get('/users/me');
    currentUser = userResponse.data;
    return currentUser;
  } catch (error: any) {
    // ✅ Ne supprimer le token QUE sur un vrai 401 (session invalide)
    // Pas sur ERR_NETWORK, timeout, 500, etc.
    if (error?.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_role');
      authToken = null;
      currentUser = null;
      return null;
    }
    // Erreur réseau/backend : garder le token, retourner null sans déconnecter
    console.warn('refreshCurrentUser: erreur réseau, session préservée', error?.message);
    return null;
  }
},
};

// ============================================================
// PRODUCTS
// ============================================================
export const products = {
  // getAll: async (params?: any) => {
  //   const response = await api.get('/products', { params });
  //   return response.data;
  // },
  getAll: async (params?: any) => {
  const cacheKey = `products_${JSON.stringify(params || {})}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;
  
  const response = await api.get('/products', { params });
  setCached(cacheKey, response.data);
  return response.data;
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
    const response = await api.get('/categories');
    return response.data;
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
        // Ignorer les erreurs de localStorage
      }
    }
  },

  updateShopHours: async (shopId: string, hours: any) => {
    return await shops.updateHours(shopId, hours);
  },

  // Products
  getCatalogProducts: async (filters: any) => {
    // Récupération avec paramètres de filtrage si le backend le supporte
    const params: any = {};
    if (filters.city) params.city = filters.city;
    if (filters.q) params.search = filters.q;
    if (filters.category) params.category = filters.category;
    if (filters.subcategory) params.subcategory = filters.subcategory;
    if (filters.price_min !== null && filters.price_min !== undefined) params.price_min = filters.price_min;
    if (filters.price_max !== null && filters.price_max !== undefined) params.price_max = filters.price_max;
    if (filters.sort_by) params.sort_by = filters.sort_by;

    let all = await products.getAll(params);

    // Si le backend ne supporte pas les filtres, on filtre côté frontend
    let filterSummary = 'Tous les produits';

    // Normalisation des données
    if (!Array.isArray(all)) {
      all = [];
    }

    // Filtrage supplémentaire si nécessaire
    if (filters.city && !params.city) {
      all = all.filter((p: any) => p.shop_city === filters.city);
      filterSummary = `Ville: ${filters.city}`;
    }

    if (filters.q && !params.search) {
      const query = filters.q.toLowerCase();
      all = all.filter((p: any) =>
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.shop_name && p.shop_name.toLowerCase().includes(query))
      );
      filterSummary = `Recherche: "${filters.q}"`;
    }

    if (filters.category && !params.category) {
      all = all.filter((p: any) => p.category === filters.category);
      filterSummary = `Catégorie: ${filters.category}`;
    }

    if (filters.subcategory && !params.subcategory) {
      all = all.filter((p: any) => p.subcategory_name === filters.subcategory);
      filterSummary = `Sous-catégorie: ${filters.subcategory}`;
    }

    if (!params.price_min && filters.price_min !== null && filters.price_min !== undefined) {
      all = all.filter((p: any) => p.price >= filters.price_min);
    }
    if (!params.price_max && filters.price_max !== null && filters.price_max !== undefined) {
      all = all.filter((p: any) => p.price <= filters.price_max);
    }

    if (!params.sort_by && filters.sort_by) {
      switch (filters.sort_by) {
        case 'price_asc':
          all.sort((a: any, b: any) => a.price - b.price);
          break;
        case 'price_desc':
          all.sort((a: any, b: any) => b.price - a.price);
          break;
        case 'newest':
          all.sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          break;
        case 'rating':
          all.sort((a: any, b: any) => (b.reviews_count || 0) - (a.reviews_count || 0));
          break;
        case 'favorites':
          all.sort((a: any, b: any) => (b.favorites_count || 0) - (a.favorites_count || 0));
          break;
      }
    }

    return {
      products: all,
      total: all.length,
      filterSummary
    };
  },

  getProductBySlug: products.getBySlug,
  getProductsForShop: async (shopId: string) => {
    const all = await products.getAll();
    return all.filter((p: any) => p.shop_id === shopId);
  },
  // saveProduct: products.create,
  deleteProduct: products.delete,

  saveProduct: async (data: any) => {
  console.log('📦 saveProduct reçu:', data);
  
  // ✅ Vérifier si l'ID existe et n'est pas vide
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
  // getAllShops: shops.getAll,
  // getAllShops: async (city?: string) => {
  //   const all = await shops.getAll(city);
  //   // ✅ Retourner toutes les boutiques (pour admin), mais filtrer les PENDING
  //   // pour le catalogue client, on utilise getActiveShops
  //   return all;
  // },

  getAllShops: async (city?: string) => {
  const cacheKey = `shops_${city || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;
  
  const response = await api.get('/shops', { params: { city } });
  setCached(cacheKey, response.data);
  return response.data;
},

  getAdminShops: shops.getAllForAdmin,
  // getActiveShops: async (city?: string) => {
  //   const all = await shops.getAll(city);
  //   return all.filter((s: any) => s.is_active && s.status === 'ACTIVE');
  // },
  getActiveShops: async (city?: string) => {
    try {
      const all = await shops.getAll(city);
      // ✅ Filtrer strictement : seulement ACTIVE ET is_active = true
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

  // getShopByOwner: async (ownerId: string) => {
  //   const all = await shops.getAll();
  //   return all.find((s: any) => s.owner_id === ownerId) || null;
  // },

  getShopByOwner: async (ownerId: string) => {
    try {
      // ✅ Utiliser getAllForAdmin (qui ajoute ?all=true) pour voir toutes les boutiques, y compris non validées
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
  // getShopBySlug: async (slug: string) => {
  //   try {
  //     const all = await shops.getAllForAdmin(); // Utilise ?all=true pour être sûr de la trouver
  //     return (all || []).find((s: any) => s.slug === slug) || null;
  //   } catch (error) {
  //     console.error('Erreur récupération boutique par slug:', error);
  //     return null;
  //   }
  // },

  // saveShop: shops.create,
  saveShop: async (data: any) => {
    // ✅ Si un ID est fourni, c'est une mise à jour
    if (data.id) {
      // Mettre à jour la boutique existante
      const response = await api.put(`/shops/${data.id}`, data);
      return response.data;
    } else {
      // Créer une nouvelle boutique
      const response = await api.post('/shops', data);
      return response.data;
    }
  },


  updateShop: shops.update,
  approveShop: async (id: string, email: string, note: string) => shops.approve(id, note),
  rejectShop: async (id: string, email: string, note: string) => shops.reject(id, note),

  // Upload
  // uploadImage: upload.image,
  uploadImage: async (file: File) => {
    // ✅ Appeler upload.image et retourner directement le chemin
    return await upload.image(file);
  },

  // Categories
  // getCategories: categories.getAll,
  getCategories: async () => {
  const cacheKey = 'categories';
  const cached = getCached(cacheKey);
  if (cached) return cached;
  
  const response = await api.get('/categories');
  setCached(cacheKey, response.data);
  return response.data;
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
      // S'assurer que c'est un tableau
      if (!Array.isArray(all)) {
        return [];
      }
      return all.map((c: any) => c.name || '');
    } catch (error) {
      console.error('Erreur chargement villes:', error);
      return [];
    }
  },


  getShopAnalytics: async (shopId: string) => {
    try {
      const response = await api.get(`/shops/${shopId}/analytics`);
      // ✅ S'assurer que products est un tableau
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

  // Favorites
  getUserFavorites: async (userId: string) => {
    try {
      return await products.getFavorites(userId);
    } catch (error) {
      console.error('Erreur chargement favoris:', error);
      return [];
    }
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
      // Ignorer les erreurs de tracking
    }
  },
  recordWhatsAppClick: async (productId: string) => {
    try {
      await products.recordWhatsAppClick(productId);
    } catch (error) {
      // Ignorer les erreurs de tracking
    }
  },
  resetToDefaults: () => {
    // Réinitialiser le cache si nécessaire
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
  },
};

// Export par défaut
export default db;
