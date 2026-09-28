import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CustomUser, Shop, Product, CatalogFilterParams, UserRole } from '../types';
import { db } from '../services/db';
import { useLocation } from 'wouter';

export type ViewMode = 'catalog' | 'shop_vitrine' | 'product_detail' | 'dashboard' | 'analytics' | 'moderation';

interface AppContextValue {
  navigateTo: (path: string) => void;
  currentUser: CustomUser | null;
  setCurrentUser: (u: CustomUser | null) => void;
  themeMode: 'light' | 'dark' | 'system';
  setThemeMode: (m: 'light' | 'dark' | 'system') => void;
  viewMode: ViewMode;
  selectedShopSlug: string | null;
  selectedProductSlug: string | null;
  filterParams: CatalogFilterParams;
  dataVersion: number;
  bumpData: () => void;
  isCategoryDrawerOpen: boolean;
  setIsCategoryDrawerOpen: (v: boolean) => void;
  isShopsDrawerOpen: boolean;
  setIsShopsDrawerOpen: (v: boolean) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (v: boolean) => void;
  isDjangoAdminAuthOpen: boolean;
  setIsDjangoAdminAuthOpen: (v: boolean) => void;
  isOrmDocsOpen: boolean;
  setIsOrmDocsOpen: (v: boolean) => void;
  authModalState: { isOpen: boolean; actionReason?: string; initialRole?: UserRole };
  setAuthModalState: (v: { isOpen: boolean; actionReason?: string; initialRole?: UserRole }) => void;
  shopModalData: { isOpen: boolean; shop: Shop | null };
  setShopModalData: (v: { isOpen: boolean; shop: Shop | null }) => void;
  productModalData: { isOpen: boolean; product: Product | null };
  setProductModalData: (v: { isOpen: boolean; product: Product | null }) => void;
  whatsAppModalData: { isOpen: boolean; product: Product | null };
  setWhatsAppModalData: (v: { isOpen: boolean; product: Product | null }) => void;
  handleNavigateHome: () => void;
  handleSelectShopVitrine: (slug: string) => void;
  handleSelectProductDetail: (slug: string) => void;
  handleNavigateDashboard: () => void;
  handleNavigateModeration: () => void;
  handleOpenAuthModal: (reason?: string, role?: UserRole) => void;
  handleLogout: () => void;
  handleChangeRole: (role: UserRole) => void;
  handleResetData: () => void;
  handleFilterChange: (p: Partial<CatalogFilterParams>) => void;
  handleClearFilters: () => void;
  handleQuickWhatsApp: (product: Product) => void;
  handleSaveShop: (data: Partial<Shop> & { owner_id: string }) => void;
  handleSaveProduct: (data: Partial<Product> & { shop_id: string }) => void;
  handleAuthenticateStaff: (user: CustomUser) => void;
  setViewMode: (v: ViewMode) => void;
  refreshUser: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CustomUser | null>(null);
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('light');
  const [viewMode, setViewMode] = useState<ViewMode>('catalog');
  const [selectedShopSlug, setSelectedShopSlug] = useState<string | null>(null);
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null);
  const [filterParams, setFilterParams] = useState<CatalogFilterParams>({ city: '', q: '', category: '', subcategory: '', price_min: null, price_max: null });
  const [dataVersion, setDataVersion] = useState(0);
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [isShopsDrawerOpen, setIsShopsDrawerOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDjangoAdminAuthOpen, setIsDjangoAdminAuthOpen] = useState(false);
  const [isOrmDocsOpen, setIsOrmDocsOpen] = useState(false);
  const [authModalState, setAuthModalState] = useState<{ isOpen: boolean; actionReason?: string; initialRole?: UserRole }>({ isOpen: false });
  const [shopModalData, setShopModalData] = useState<{ isOpen: boolean; shop: Shop | null }>({ isOpen: false, shop: null });
  const [productModalData, setProductModalData] = useState<{ isOpen: boolean; product: Product | null }>({ isOpen: false, product: null });
  const [whatsAppModalData, setWhatsAppModalData] = useState<{ isOpen: boolean; product: Product | null }>({ isOpen: false, product: null });

  const bumpData = useCallback(() => setDataVersion(v => v + 1), []);

  const [location, setLocation] = useLocation();

  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentUser(null);
      handleOpenAuthModal('Votre session a expiré. Veuillez vous reconnecter.');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  // Chargement initial de l'utilisateur
  useEffect(() => {
  const loadUser = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;  // Pas de token, pas la peine d'appeler

    // Essayer 2 fois (avec 1s de délai) avant d'abandonner
    for (let i = 0; i < 2; i++) {
      const user = await db.refreshCurrentUser();
      if (user) {
        setCurrentUser(user);
        return;
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  };
  loadUser();
}, []);

  // Rafraîchissement de l'utilisateur
  const refreshUser = useCallback(async () => {
    const user = await db.refreshCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    return user;
  }, []);

  useEffect(() => {
    const handler = () => bumpData();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [bumpData]);

  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'dark') root.classList.add('dark');
    else if (themeMode === 'light') root.classList.remove('dark');
    else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
  }, [themeMode]);

  const handleOpenAuthModal = (reason?: string, role?: UserRole) =>
    setAuthModalState({ isOpen: true, actionReason: reason, initialRole: role || 'CUSTOMER' });

  const handleLogout = () => {
    db.logout();
    setCurrentUser(null);
    setViewMode('catalog');
    bumpData();
  };

  const handleChangeRole = async (role: UserRole) => {
    db.setCurrentUserRole(role);
    const user = await db.refreshCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    bumpData();
  };

  const handleResetData = () => {
    db.resetToDefaults();
    setCurrentUser(null);
    bumpData();
  };

  const handleFilterChange = (newParams: Partial<CatalogFilterParams>) =>
    setFilterParams(prev => ({ ...prev, ...newParams }));

  const handleClearFilters = () =>
    setFilterParams({ city: '', q: '', category: '', subcategory: '', price_min: null, price_max: null });

  const handleNavigateHome = () => {
    setViewMode('catalog');
    setSelectedShopSlug(null);
    setSelectedProductSlug(null);
  };

  const handleSelectShopVitrine = (slug: string) => {
    setSelectedShopSlug(slug);
    setViewMode('shop_vitrine');
  };

  const handleSelectProductDetail = (slug: string) => {
    setSelectedProductSlug(slug);
    setViewMode('product_detail');
  };

  const handleNavigateDashboard = () => {
    if (!currentUser) {
      handleOpenAuthModal('Connectez-vous pour accéder à votre espace.');
      return;
    }
    setViewMode('dashboard');
  };

  const handleNavigateModeration = () => {
    if (!currentUser) {
      handleOpenAuthModal('Connectez-vous en tant qu\'admin pour accéder à la console.', 'ADMIN');
      return;
    }
    if (currentUser.role !== 'ADMIN' && !currentUser.is_staff) return;
    setViewMode('moderation');
  };

  const handleQuickWhatsApp = (product: Product) => setWhatsAppModalData({ isOpen: true, product });

  const handleSaveShop = async (data: Partial<Shop> & { owner_id: string }) => {
    try {
      await db.saveShop(data);
      bumpData();
    } catch (error) {
      console.error('Erreur sauvegarde boutique:', error);
    }
  };

  // const handleSaveProduct = async (data: Partial<Product> & { shop_id: string }) => {
  //   try {
  //     await db.saveProduct(data);
  //     bumpData();
  //     setProductModalData({ isOpen: false, product: null });
  //   } catch (error: any) {
  //     console.error('Erreur sauvegarde produit:', error);
  //     // Si l'erreur est 401 Unauthorized, le token a expiré ou l'utilisateur n'est plus connecté
  //     if (error?.response?.status === 401 || error?.status === 401) {
  //       handleOpenAuthModal('Votre session a expiré. Veuillez vous reconnecter.', currentUser?.role);
  //     }
  //   }
  // };


  const navigateTo = useCallback((path: string) => {
    // Si wouter est utilisé
    setLocation(path);

    // OU utiliser window.history
    // window.history.pushState(null, '', path);
    // Déclencher un événement pour que les composants réagissent
    // window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  const handleSaveProduct = async (data: Partial<Product> & { shop_id: string }) => {
    try {
      await db.saveProduct(data);
      bumpData();
      setProductModalData({ isOpen: false, product: null });
    } catch (error: any) {
      console.error('Erreur sauvegarde produit:', error);

      // 1. Si la session a expiré (401)
      if (error?.response?.status === 401 || error?.status === 401) {
        handleOpenAuthModal('Votre session a expiré. Veuillez vous reconnecter.', currentUser?.role);
        return;
      }

      // 2. Pour toutes les autres erreurs (422, 400, 500...) : afficher le message du backend
      const errorMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error.message ||
        'Une erreur est survenue lors de l\'enregistrement du produit.';

      alert(`Erreur : ${errorMessage}`); // Remplacez par votre composant de Toast/Notification si vous en avez un
    }
  };

  const handleAuthenticateStaff = async (staffUser: CustomUser) => {
    db.setCurrentUserRole('ADMIN');
    const user = await db.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setViewMode('moderation');
      bumpData();
    }
  };

  return (
    <AppContext.Provider value={{
      navigateTo, currentUser, setCurrentUser, themeMode, setThemeMode,
      viewMode, setViewMode, selectedShopSlug, selectedProductSlug,
      filterParams, dataVersion, bumpData,
      isCategoryDrawerOpen, setIsCategoryDrawerOpen,
      isShopsDrawerOpen, setIsShopsDrawerOpen,
      isSettingsModalOpen, setIsSettingsModalOpen,
      isDjangoAdminAuthOpen, setIsDjangoAdminAuthOpen,
      isOrmDocsOpen, setIsOrmDocsOpen,
      authModalState, setAuthModalState,
      shopModalData, setShopModalData,
      productModalData, setProductModalData,
      whatsAppModalData, setWhatsAppModalData,
      handleNavigateHome, handleSelectShopVitrine, handleSelectProductDetail,
      handleNavigateDashboard, handleNavigateModeration, handleOpenAuthModal,
      handleLogout, handleChangeRole, handleResetData,
      handleFilterChange, handleClearFilters,
      handleQuickWhatsApp, handleSaveShop, handleSaveProduct, handleAuthenticateStaff,
      refreshUser,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}