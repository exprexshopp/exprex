import React, { useState, useEffect } from 'react';
import { X, Store, MapPin, Search } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { db } from '../services/db';

export function ShopsDrawer() {
  const { isShopsDrawerOpen, setIsShopsDrawerOpen, handleSelectShopVitrine } = useApp();
  const [shops, setShops] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShops = async () => {
      setLoading(true);
      try {
        const data = await db.getAllShops();
        // ✅ S'assurer que data est un tableau
        setShops(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Erreur chargement boutiques:', error);
        setShops([]);
      } finally {
        setLoading(false);
      }
    };

    if (isShopsDrawerOpen) {
      loadShops();
    }
  }, [isShopsDrawerOpen]);

  const filteredShops = Array.isArray(shops)
    ? shops.filter(s =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.city?.toLowerCase().includes(search.toLowerCase())
    )
    : [];

  if (!isShopsDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsShopsDrawerOpen(false)} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-indigo-600" />
            Boutiques
          </h2>
          <button onClick={() => setIsShopsDrawerOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une boutique..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-300"
            />
          </div>
        </div>

        {/* Shops list */}
        <div className="p-4 overflow-y-auto max-h-[calc(100%-180px)]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-slate-500 text-sm">Chargement...</p>
            </div>
          ) : filteredShops.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">Aucune boutique trouvée</p>
          ) : (
            <div className="space-y-2">
              {filteredShops.map((shop: any) => (
                <button
                  key={shop.id}
                  onClick={() => {
                    handleSelectShopVitrine(shop.slug);
                    setIsShopsDrawerOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  {shop.is_active && shop.status === 'ACTIVE' && (
                    <div className='flex items-center gap-4 rounded-2xl'>
                      {shop.logo ? (
                        <img src={shop.logo} alt={shop.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                          <Store className="w-6 h-6 text-indigo-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{shop.name}</p>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="w-3 h-3" />
                          {shop.city}
                          {shop.is_active && shop.status === 'ACTIVE' && (
                            <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded-full">✓ Active</span>
                          )}
                        </div>
                      </div>
                    </div>)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}