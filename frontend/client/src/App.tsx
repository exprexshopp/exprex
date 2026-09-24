import React, { useEffect, useRef } from 'react';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "./contexts/AppContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { useLocation } from "wouter";

// Main views
import { Header } from "./components/Header";
import { BottomNav } from "./components/BottomNav";
import { CatalogFeed } from "./components/CatalogFeed";
import { ShopPublicVitrine } from "./components/ShopPublicVitrine";
import { ProductDetail } from "./components/ProductDetail";
import { SellerDashboard } from "./components/SellerDashboard";
import { CustomerDashboard } from "./components/CustomerDashboard";
import { SellerAnalytics } from "./components/SellerAnalytics";
import { AdminModeration } from "./components/AdminModeration";

// Drawers & Modals
import { CategoryDrawer } from "./components/CategoryDrawer";
import { ShopsDrawer } from "./components/ShopsDrawer";
import { AuthModal } from "./components/AuthModal";
import { WhatsAppModal } from "./components/WhatsAppModal";
import { ShopFormModal } from "./components/ShopFormModal";
import { ProductFormModal } from "./components/ProductFormModal";
import { PlatformSettingsModal } from "./components/PlatformSettingsModal";
import { DjangoAdminAuthModal } from "./components/DjangoAdminAuthModal";

function AppContent() {
  const { 
    viewMode, 
    currentUser, 
    whatsAppModalData, 
    setWhatsAppModalData,
    selectedShopSlug,
    selectedProductSlug,
    setViewMode,
    handleNavigateHome,
    handleSelectShopVitrine,
    handleSelectProductDetail
  } = useApp();
  const [location, setLocation] = useLocation();
  const isUpdatingFromUrl = useRef(false);
  const isUpdatingViewMode = useRef(false);

  // route d'erreur
  if (location === '/error') {
    return <ErrorPage />;
  }


  // ✅ Synchroniser l'URL avec viewMode (quand l'URL change)
  useEffect(() => {
    // Éviter les boucles
    if (isUpdatingViewMode.current) return;
    isUpdatingFromUrl.current = true;

    const path = location.split('?')[0];
    
    if (path === '/' && viewMode !== 'catalog') {
      handleNavigateHome();
    } else if (path.startsWith('/shop/') && viewMode !== 'shop_vitrine') {
      const slug = path.replace('/shop/', '');
      handleSelectShopVitrine(slug);
    } else if (path.startsWith('/product/') && viewMode !== 'product_detail') {
      const slug = path.replace('/product/', '');
      handleSelectProductDetail(slug);
    } else if (path === '/dashboard' && viewMode !== 'dashboard') {
      setViewMode('dashboard');
    } else if (path === '/moderation' && viewMode !== 'moderation') {
      setViewMode('moderation');
    }

    isUpdatingFromUrl.current = false;
  }, [location]); // ✅ Pas de dépendance à viewMode

  // ✅ Mettre à jour l'URL quand viewMode change
  useEffect(() => {
    // Éviter les boucles
    if (isUpdatingFromUrl.current) return;
    isUpdatingViewMode.current = true;

    let newPath = '/';
    if (viewMode === 'catalog') {
      newPath = '/';
    } else if (viewMode === 'shop_vitrine' && selectedShopSlug) {
      newPath = `/shop/${selectedShopSlug}`;
    } else if (viewMode === 'product_detail' && selectedProductSlug) {
      newPath = `/product/${selectedProductSlug}`;
    } else if (viewMode === 'dashboard') {
      newPath = '/dashboard';
    } else if (viewMode === 'moderation') {
      newPath = '/moderation';
    }

    if (location !== newPath) {
      setLocation(newPath);
    }

    isUpdatingViewMode.current = false;
  }, [viewMode, selectedShopSlug, selectedProductSlug]); // ✅ Pas de dépendance à location

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Header />
      <main className="max-w-6xl w-full mx-auto px-4 py-4 flex-1 pb-24 md:pb-8">
        {viewMode === 'catalog' && <CatalogFeed />}
        {viewMode === 'shop_vitrine' && <ShopPublicVitrine />}
        {viewMode === 'product_detail' && <ProductDetail />}
        {viewMode === 'dashboard' && currentUser && (
          currentUser.role === 'SELLER' ? <SellerDashboard /> : <CustomerDashboard />
        )}
        {viewMode === 'analytics' && currentUser && <SellerAnalytics />}
        {viewMode === 'moderation' && currentUser && (currentUser.role === 'ADMIN' || currentUser.is_staff) && <AdminModeration />}
      </main>
      <BottomNav />

      <CategoryDrawer />
      <ShopsDrawer />

      <AuthModal />
      <WhatsAppModal
        isOpen={whatsAppModalData.isOpen}
        product={whatsAppModalData.product}
        onClose={() => setWhatsAppModalData({ isOpen: false, product: null })}
      />
      <ShopFormModal />
      <ProductFormModal />
      <PlatformSettingsModal />
      <DjangoAdminAuthModal />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AppProvider>
          <TooltipProvider>
            <Toaster />
            <AppContent />
          </TooltipProvider>
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
