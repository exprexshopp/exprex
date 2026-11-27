// Design: Afrique Moderne — bottom nav mobile + side rail tablette/PC
import { Home, LayoutDashboard, Shield, Store } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export function BottomNav() {
  const {
    currentUser,
    viewMode,
    handleNavigateHome,
    handleNavigateDashboard,
    handleNavigateModeration,
    setIsShopsDrawerOpen,
  } = useApp();

  const items = [
    {
      icon: Home,
      label: 'Accueil',
      action: handleNavigateHome,
      active: viewMode === 'catalog' || viewMode === 'shop_vitrine' || viewMode === 'product_detail',
    },
    {
      icon: Store,
      label: 'Boutiques',
      action: () => {
        handleNavigateHome();
        setTimeout(() => setIsShopsDrawerOpen(true), 50);
      },
      active: false,
    },
    {
      icon: LayoutDashboard,
      label: 'Mon Espace',
      action: handleNavigateDashboard,
      active: viewMode === 'dashboard' || viewMode === 'analytics',
    },
    ...(currentUser?.role === 'ADMIN' || currentUser?.is_staff
      ? [
          {
            icon: Shield,
            label: 'Admin',
            action: handleNavigateModeration,
            active: viewMode === 'moderation',
          },
        ]
      : []),
  ];

  return (
    <>
      {/* ===== MOBILE : Bottom Navigation ===== */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 safe-area-pb">
        <div className="flex items-center justify-around px-1 py-1.5">
          {items.map(({ icon: Icon, label, action, active }) => (
            <button
              key={label}
              onClick={action}
              className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 active:scale-95 min-w-[64px] ${
                active
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {/* Active indicator */}
              {active && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-indigo-500" />
              )}

              <div
                className={`p-1.5 rounded-xl transition-colors duration-200 ${
                  active ? 'bg-indigo-50 dark:bg-indigo-950/50' : ''
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-medium tracking-tight leading-none">
                {label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* ===== TABLETTE + DESKTOP : Side Rail ===== */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 z-40 w-[72px] lg:w-20 flex-col items-center py-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/80">
        {/* Logo / Brand (optionnel) */}
        <div className="mb-8 flex items-center justify-center">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Store className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 flex-1">
          {items.map(({ icon: Icon, label, action, active }) => (
            <button
              key={label}
              onClick={action}
              title={label}
              className={`group relative flex flex-col items-center gap-1.5 p-2.5 rounded-2xl transition-all duration-200 ${
                active
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              {/* Active vertical bar */}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-indigo-500" />
              )}

              <Icon className="w-5 h-5 lg:w-6 lg:h-6" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium opacity-90 group-hover:opacity-100">
                {label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}