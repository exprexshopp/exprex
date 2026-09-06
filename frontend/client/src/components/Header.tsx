// Design: Afrique Moderne — header compact mobile-first, indigo brand, search inline
import React, { useState } from 'react';
import { Search, Settings, User, Shield, Home, LayoutDashboard, Menu, X, Bell } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { getInitials } from '../lib/format';

export function Header() {
  const {
    currentUser, viewMode,
    handleNavigateHome, handleNavigateDashboard, handleNavigateModeration,
    handleOpenAuthModal, setIsSettingsModalOpen,
    filterParams, handleFilterChange,
  } = useApp();

  const [searchVal, setSearchVal] = useState(filterParams.q);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange({ q: searchVal });
    if (viewMode !== 'catalog') handleNavigateHome();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
        {/* Logo */}
        <button onClick={handleNavigateHome} className="flex items-center gap-2 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-md group-hover:shadow-indigo-300 transition-all group-hover:scale-105">
            <img src="/storage/app/logo.webp" alt="eXpress Shop" className="w-6 h-6 object-contain" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">e<span className="text-indigo-600">X</span>press</span>
            <span className="text-[9px] text-slate-400 font-medium tracking-widest uppercase">Shop · 🇨🇲</span>
          </div>
        </button>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="Rechercher produits, boutiques..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-300 focus:bg-white dark:focus:bg-slate-700 rounded-xl outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </form>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={handleNavigateHome}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'catalog' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}
          >
            <Home className="w-4 h-4" /> Accueil
          </button>
          <button
            onClick={handleNavigateDashboard}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'dashboard' || viewMode === 'analytics' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}
          >
            <LayoutDashboard className="w-4 h-4" /> Espace
          </button>
          {(currentUser?.role === 'ADMIN' || currentUser?.is_staff) && (
            <button
              onClick={handleNavigateModeration}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'moderation' ? 'bg-red-50 text-red-700' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}
            >
              <Shield className="w-4 h-4" /> Admin
            </button>
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          {currentUser ? (
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-xs font-bold">
                {getInitials(currentUser.first_name, currentUser.last_name)}
              </div>
              <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[80px] truncate">
                {currentUser.first_name}
              </span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenAuthModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all active:scale-95 shadow-sm"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:block">Connexion</span>
            </button>
          )}
          {/* <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Paramètres"
          >
            <Settings className="w-4 h-4" />
          </button> */}
        </div>
      </div>
    </header>
  );
}
