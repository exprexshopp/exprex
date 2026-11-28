import React from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppProvider, useApp } from './contexts/AppContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import { useLocation } from 'wouter';

// Main views
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { CatalogFeed } from './components/CatalogFeed';
import { ShopPublicVitrine } from './components/ShopPublicVitrine';
import { ProductDetail } from './components/ProductDetail';
import { SellerDashboard } from './components/SellerDashboard';
import { CustomerDashboard } from './components/CustomerDashboard';
import { SellerAnalytics } from './components/SellerAnalytics';
import { AdminModeration } from './components/AdminModeration';

// Drawers & Modals
import { CategoryDrawer } from './components/CategoryDrawer';
import { ShopsDrawer } from './components/ShopsDrawer';
import { AuthModal } from './components/AuthModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { ChatAssistModal } from './components/ChatAssistModal';
import { ExprexChatWidget } from './components/ExprexChatWidget';
import { ShopFormModal } from './components/ShopFormModal';
import { ProductFormModal } from './components/ProductFormModal';
import { PlatformSettingsModal } from './components/PlatformSettingsModal';
import { DjangoAdminAuthModal } from './components/DjangoAdminAuthModal';
import { ErrorPage } from './pages/ErrorPage';

function AppContent() {
  const {
    viewMode,
    currentUser,
    whatsAppModalData,
    setWhatsAppModalData,
  } = useApp();

  // IMPORTANT : ce hook doit être appelé avant tout return conditionnel.
  // La synchronisation URL <-> viewMode est désormais gérée dans AppContext.
  const [location] = useLocation();

  if (location.split('?')[0] === '/error') {
    return <ErrorPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Header />

      <main className="max-w-6xl w-full mx-auto px-4 py-4 flex-1 pb-24 md:pb-8">
        {viewMode === 'catalog' && <CatalogFeed />}

        {viewMode === 'shop_vitrine' && <ShopPublicVitrine />}

        {viewMode === 'product_detail' && <ProductDetail />}

        {viewMode === 'dashboard' && currentUser && (
          currentUser.role === 'SELLER'
            ? <SellerDashboard />
            : <CustomerDashboard />
        )}

        {viewMode === 'analytics' && <SellerAnalytics />}

        {viewMode === 'moderation' && currentUser && (
          (currentUser.role === 'ADMIN' || currentUser.is_staff) && (
            <AdminModeration />
          )
        )}
      </main>

      <BottomNav />

      <CategoryDrawer />
      <ShopsDrawer />

      <AuthModal />

      {/* Commande vendeur — inchangé */}
      <WhatsAppModal
        isOpen={whatsAppModalData.isOpen}
        product={whatsAppModalData.product}
        onClose={() =>
          setWhatsAppModalData({
            isOpen: false,
            product: null,
          })
        }
      />

      {/* Assistant IA plateforme (en plus de WhatsApp) */}
      <ChatAssistModal />
      <ExprexChatWidget userId={currentUser?.id ?? null} />

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
