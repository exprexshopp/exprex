// Design: Afrique Moderne — bottom nav mobile-first, indigo active state
import { Home, LayoutDashboard, Shield, Store } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export function BottomNav() {
  const { currentUser, viewMode, handleNavigateHome, handleNavigateDashboard, handleNavigateModeration, setIsShopsDrawerOpen } = useApp();

  const items = [
    { icon: Home, label: 'Accueil', action: handleNavigateHome, active: viewMode === 'catalog' || viewMode === 'shop_vitrine' || viewMode === 'product_detail' },
    { icon: Store, label: 'Boutiques', action: () => { handleNavigateHome(); setTimeout(() => setIsShopsDrawerOpen(true), 50); }, active: false },
    { icon: LayoutDashboard, label: 'Mon Espace', action: handleNavigateDashboard, active: viewMode === 'dashboard' || viewMode === 'analytics' },
    ...(currentUser?.role === 'ADMIN' || currentUser?.is_staff ? [{ icon: Shield, label: 'Admin', action: handleNavigateModeration, active: viewMode === 'moderation' }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map(({ icon: Icon, label, action, active }) => (
          <button
            key={label}
            onClick={action}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all active:scale-95 min-w-[56px] ${
              active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${active ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

