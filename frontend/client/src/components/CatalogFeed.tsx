// Design: Afrique Moderne — catalogue avec hero gradient, filtres pill, grille responsive
import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, MapPin, Grid3X3, List, X, ChevronDown, Store, TrendingUp, Search, ShieldCheck, MessageCircle, Star, Zap } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { db } from '../services/db';
import { ProductCard } from './ProductCard';
import { formatPrice } from '../lib/format';

export function CatalogFeed() {
  const {
    currentUser, filterParams, dataVersion,
    handleFilterChange, handleClearFilters,
    handleSelectProductDetail, handleQuickWhatsApp,
    handleNavigateDashboard, handleNavigateModeration,
    handleOpenAuthModal, setIsCategoryDrawerOpen, setIsShopsDrawerOpen,
  } = useApp();

  const [gridCols, setGridCols] = useState<2 | 3>(2);
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<any[]>([]);
  const [catalogData, setCatalogData] = useState({ products: [], total: 0, filterSummary: '' });
  const [activeShops, setActiveShops] = useState<any[]>([]);
  const [cityOptions, setCityOptions] = useState<string[]>([]);

  useEffect(() => {
    const abortController = new AbortController();

    const currentFilters = {
      city: filterParams.city,
      q: filterParams.q,
      category: filterParams.category,
      subcategory: filterParams.subcategory,
      price_min: filterParams.price_min,
      price_max: filterParams.price_max,
    };

    const loadAllData = async () => {
      setLoading(true);
      try {
        const [categoriesData, catalogDataRes, shopsData] = await Promise.all([
          db.getCategories().catch(() => []),
          db.getCatalogProducts(currentFilters).catch(() => ({ products: [], total: 0, filterSummary: '' })),
          db.getActiveShops(currentFilters.city).catch(() => [])
        ]);

        if (!abortController.signal.aborted) {
          setCategories(categoriesData || []);
          setCatalogData(catalogDataRes || { products: [], total: 0, filterSummary: '' });
          setActiveShops(shopsData || []);

          const cities = (shopsData || [])
            .filter((shop: any) => shop.is_active && shop.status === 'ACTIVE' && shop.city)
            .map((shop: any) => shop.city as string);
          const unique = Array.from(new Set(cities)).sort((a, b) => String(a).localeCompare(String(b)));
          setCityOptions(unique as string[]);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('Erreur chargement données:', error);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadAllData();
    return () => { abortController.abort(); };
  }, [
    filterParams.city,
    filterParams.q,
    filterParams.category,
    filterParams.subcategory,
    filterParams.price_min,
    filterParams.price_max,
    dataVersion
  ]);

  const hasFilters = filterParams.city || filterParams.q || filterParams.category || filterParams.price_min || filterParams.price_max;

  const applyPriceFilter = () => {
    handleFilterChange({
      price_min: priceMin ? parseInt(priceMin) : null,
      price_max: priceMax ? parseInt(priceMax) : null,
    });
    setShowPriceFilter(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-800 to-indigo-600 min-h-[240px]">
        <div className="absolute inset-0">
          <img src="/storage/app/hero.webp" alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/90 via-indigo-900/70 to-transparent" />
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden md:block pointer-events-none">
          <div className="absolute top-4 right-4 w-24 h-24 border border-white/10 rounded-full" />
          <div className="absolute top-12 right-16 w-16 h-16 border border-green-400/20 rounded-full" />
          <div className="absolute bottom-4 right-8 w-20 h-20 border border-indigo-300/10 rounded-full" />
        </div>
        <div className="relative z-10 p-6 md:p-8">
          {currentUser ? (
            <div>
              <span className="inline-block text-xs font-bold bg-white/20 text-white px-2.5 py-1 rounded-full mb-2">
                {currentUser.role === 'SELLER' ? '🏪 Vendeur' : currentUser.role === 'ADMIN' ? '🛡️ Admin' : '👤 Client'}
              </span>
              <h1 className="text-white text-2xl font-bold mb-1">{currentUser.first_name} {currentUser.last_name}</h1>
              <p className="text-indigo-200 text-sm mb-4">{currentUser.email}</p>
              <div className="flex gap-2 flex-wrap">
                {currentUser.role === 'SELLER' && (
                  <button onClick={handleNavigateDashboard} className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-indigo-700 text-sm font-bold rounded-xl hover:bg-indigo-50 transition-all active:scale-95 shadow-lg">
                    <Zap className="w-4 h-4" /> Gérer ma boutique
                  </button>
                )}
                {(currentUser.role === 'ADMIN' || currentUser.is_staff) && (
                  <button onClick={handleNavigateModeration} className="flex items-center gap-1.5 px-4 py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-all active:scale-95">
                    Console Admin
                  </button>
                )}
                <button onClick={handleNavigateDashboard} className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-500/50 border border-indigo-400/50 text-white text-sm font-semibold rounded-xl hover:bg-indigo-500/70 transition-all">
                  Mon espace →
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-lg">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-lg">🇨🇲</span>
                <span className="text-indigo-200 text-xs font-semibold tracking-wide uppercase">Marketplace Cameroun</span>
                <span className="flex items-center gap-1 bg-green-500/20 border border-green-500/30 text-green-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" /> Boutiques vérifiées
                </span>
              </div>
              <h1 className="text-white text-3xl md:text-4xl font-extrabold mb-3 leading-tight tracking-tight">
                Trouvez. Contactez.<br />
                <span className="text-green-400">Recevez.</span>
              </h1>
              <p className="text-indigo-200 text-sm mb-2">
                <strong className="text-white">{activeShops.length} boutiques</strong> vérifiées dans <strong className="text-white">{new Set(activeShops.map(s => s.city)).size} villes</strong>
              </p>
              <div className="flex gap-3 mb-5 flex-wrap">
                <span className="flex items-center gap-1 text-green-300 text-xs font-medium"><MessageCircle className="w-3.5 h-3.5" /> Commande via WhatsApp</span>
                <span className="flex items-center gap-1 text-amber-300 text-xs font-medium"><Star className="w-3.5 h-3.5 fill-current" /> Avis clients vérifiés</span>
                <span className="flex items-center gap-1 text-indigo-300 text-xs font-medium"><ShieldCheck className="w-3.5 h-3.5" /> Vendeurs validés</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => handleOpenAuthModal(undefined, 'SELLER')} className="flex items-center gap-1.5 px-5 py-2.5 bg-white text-indigo-700 text-sm font-bold rounded-xl hover:bg-indigo-50 transition-all active:scale-95 shadow-lg">
                  <Store className="w-4 h-4" /> Ouvrir ma boutique
                </button>
                <button onClick={() => handleOpenAuthModal()} className="flex items-center gap-1.5 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl transition-all active:scale-95">
                  <MessageCircle className="w-4 h-4" /> Se connecter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Boutiques', value: activeShops.length, icon: Store, color: 'text-indigo-600' },
          { label: 'Produits', value: catalogData.total, icon: Grid3X3, color: 'text-green-600' },
          { label: 'Villes', value: new Set(activeShops.map(s => s.city)).size, icon: MapPin, color: 'text-amber-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700 text-center shadow-sm">
            <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
            <p className="text-lg font-bold text-slate-900 dark:text-white">{value}</p>
            <p className="text-[11px] text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <div className="relative shrink-0">
            <select
              value={filterParams.city}
              onChange={e => handleFilterChange({ city: e.target.value })}
              className="pl-7 pr-8 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl appearance-none font-medium text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:border-indigo-300"
            >
              <option value="">Toutes les villes</option>
              {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          <button
            onClick={() => setIsCategoryDrawerOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border transition-colors shrink-0 ${filterParams.category ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300'}`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            {filterParams.category ? filterParams.category.split(' ')[0] : 'Catégories'}
          </button>

          <button
            onClick={() => setIsShopsDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 transition-colors shrink-0"
          >
            <Store className="w-3.5 h-3.5" /> Boutiques
          </button>

          <button
            onClick={() => setShowPriceFilter(!showPriceFilter)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border transition-colors shrink-0 ${filterParams.price_min || filterParams.price_max ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300'}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> Prix
          </button>

          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl border border-red-200 hover:bg-red-100 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" /> Effacer
            </button>
          )}
        </div>

        {showPriceFilter && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-lg">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Fourchette de prix (FCFA)</p>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="flex-1 min-w-0">
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 sm:hidden">Minimum</label>
                <input type="number" placeholder="Min" value={priceMin} onChange={e => setPriceMin(e.target.value)} className="w-full px-3 py-2.5 sm:py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20 transition-all" min="0" />
              </div>
              <div className="flex items-center justify-center sm:px-1">
                <span className="text-slate-400 font-medium text-sm">—</span>
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 sm:hidden">Maximum</label>
                <input type="number" placeholder="Max" value={priceMax} onChange={e => setPriceMax(e.target.value)} className="w-full px-3 py-2.5 sm:py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20 transition-all" min="0" />
              </div>
              <button onClick={applyPriceFilter} className="sm:flex-shrink-0 px-6 py-2.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl transition-all active:scale-95 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed" disabled={!priceMin && !priceMax}>
                Appliquer
              </button>
            </div>
            {(priceMin || priceMax) && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                {priceMin && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-full">
                    Min: {parseInt(priceMin).toLocaleString()} FCFA
                    <button onClick={() => { setPriceMin(''); applyPriceFilter(); }} className="ml-1 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200">✕</button>
                  </span>
                )}
                {priceMax && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-full">
                    Max: {parseInt(priceMax).toLocaleString()} FCFA
                    <button onClick={() => { setPriceMax(''); applyPriceFilter(); }} className="ml-1 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200">✕</button>
                  </span>
                )}
                <button onClick={() => { setPriceMin(''); setPriceMax(''); applyPriceFilter(); }} className="text-xs text-slate-400 hover:text-red-500 transition-colors">Tout effacer</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {hasFilters ? `${catalogData.total} produit${catalogData.total !== 1 ? 's' : ''}` : 'Tendances du moment'}
          </h2>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setGridCols(2)} className={`p-1.5 rounded-lg transition-colors ${gridCols === 2 ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:bg-slate-100'}`}>
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button onClick={() => setGridCols(3)} className={`p-1.5 rounded-lg transition-colors ${gridCols === 3 ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:bg-slate-100'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Products grid */}
      {catalogData.products.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium mb-1">Aucun produit trouvé</p>
          <p className="text-slate-400 text-sm mb-4">Essayez d'autres filtres ou une autre ville</p>
          <button onClick={handleClearFilters} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className={`grid gap-3 ${gridCols === 2 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
          {catalogData.products.map((product: any) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={handleSelectProductDetail}
              onWhatsApp={handleQuickWhatsApp}
            />
          ))}
        </div>
      )}
    </div>
  );
}
