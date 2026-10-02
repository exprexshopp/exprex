// Source 4 (Correction dans SellerDashboard.tsx)
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, ToggleLeft, ToggleRight, BarChart2, Store, Package, AlertTriangle, CheckCircle, Clock, ExternalLink, AlertCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { db } from '../services/db';
import { formatPrice } from '../lib/format';
import { ShopHoursEditor } from './ShopHoursEditor';
import { SafeImage } from './SafeImage';
import { getImageUrl } from '@/lib/imageUrl';

export function SellerDashboard() {
  const { currentUser, setShopModalData, setProductModalData, setViewMode, handleSelectShopVitrine, handleSelectProductDetail, bumpData, dataVersion } = useApp();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [showHoursEditor, setShowHoursEditor] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      if (!currentUser?.id) {
        if (!cancelled) setLoading(false);
        return;
      }
      if (!cancelled) setLoading(true);
      try {
        const shopData = await db.getShopByOwner(currentUser.id);
        if (cancelled) return;
        setShop(shopData);

        if (shopData) {
          const [productsData, analyticsData] = await Promise.all([
            db.getProductsForShop(shopData.id),
            db.getShopAnalytics(shopData.id),
          ]);
          if (!cancelled) {
            setProducts(productsData || []);
            setAnalytics(analyticsData);
          }
        } else {
          if (!cancelled) {
            setProducts([]);
            setAnalytics(null);
          }
        }
      } catch (error) {
        console.error('Erreur chargement données vendeur:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, [currentUser?.id, dataVersion]);

  const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    PENDING: { label: 'En attente', color: 'bg-amber-100 text-amber-700', icon: Clock },
    DRAFT: { label: 'Brouillon', color: 'bg-slate-100 text-slate-600', icon: Edit2 },
    REJECTED: { label: 'Rejetée', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status] || {
      label: status || 'Inconnu',
      color: 'bg-slate-100 text-slate-600',
      icon: AlertCircle
    };
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await db.deleteProduct(productId);
    } catch (error) {
      console.warn(`Impossible de supprimer le produit ${productId}.`, error);
    } finally {
      setDeleteConfirm(null);
      bumpData();
    }
  };

  const handleToggleStock = async (product: any) => {
    if (!product || !product.id) return;
    try {
      await db.saveProduct({ ...product, in_stock: !product.in_stock, id: product.id });
      bumpData();
    } catch (error) {
      console.error('Erreur mise à jour du stock:', error);
    }
  };

  if (!currentUser) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-700 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src="/storage/app/visuel.webp" alt="" className="w-full h-full object-cover" />
        </div>
        <p className="text-indigo-200 text-sm mb-1">Espace Vendeur</p>
        <h1 className="text-2xl font-bold mb-1">{currentUser.first_name} {currentUser.last_name}</h1>
        <p className="text-indigo-200 text-sm">{currentUser.email}</p>
      </div>

      {!shop ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm text-center">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Créez votre boutique</h2>
          <p className="text-slate-500 text-sm mb-6">Commencez à vendre sur eXpress Shop en quelques minutes.</p>
          <button onClick={() => setShopModalData({ isOpen: true, shop: null })} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-md shadow-indigo-200">
            Créer ma boutique
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <SafeImage
                  src={getImageUrl(shop.logo)}
                  alt={shop.name}
                  square
                  className="w-14 h-14 rounded-xl shrink-0"
                  fallbackIcon={<Store className="w-7 h-7 text-indigo-600" />}
                />
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">{shop.name}</h2>
                  <p className="text-sm text-slate-500">{shop.city}</p>
                </div>
              </div>
              {(() => {
                const cfg = getStatusConfig(shop.status);
                const Icon = cfg.icon;
                return (
                  <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${cfg.color}`}>
                    <Icon className="w-3.5 h-3.5" /> {cfg.label}
                  </span>
                );
              })()}
            </div>

            {shop.status === 'REJECTED' && shop.rejection_reason && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl mb-4">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{shop.rejection_reason}</p>
              </div>
            )}

            {analytics && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Produits', value: products.length, icon: Package, color: 'text-indigo-600' },
                  { label: 'Vues totales', value: analytics.totalViews || 0, icon: Eye, color: 'text-sky-600' },
                  { label: 'Clics WA', value: analytics.totalWhatsApp || 0, icon: BarChart2, color: 'text-green-600' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                    <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
                    <p className="text-[10px] text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setShopModalData({ isOpen: true, shop })} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-sm font-semibold rounded-xl hover:bg-indigo-100 transition-colors">
                <Edit2 className="w-3.5 h-3.5" /> Modifier
              </button>
              {shop.is_active && (
                <button onClick={() => handleSelectShopVitrine(shop.slug)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> Voir la vitrine
                </button>
              )}
              <button onClick={() => setShowHoursEditor(true)} className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm font-semibold rounded-xl hover:bg-amber-100 transition-colors">
                <Clock className="w-3.5 h-3.5" /> Horaires
              </button>
              {showHoursEditor && shop && (
                <ShopHoursEditor
                  shop={shop}
                  onClose={() => setShowHoursEditor(false)}
                  onSave={(updatedHours) => {
                    // Met à jour localement pour un retour visuel immédiat
                    setShop({ ...shop, hours: JSON.stringify(updatedHours) });
                    bumpData();
                    setShowHoursEditor(false);
                  }}
                />
              )}
              <button onClick={() => setViewMode('analytics')} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors">
                <BarChart2 className="w-3.5 h-3.5" /> Analytics
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-bold text-slate-900 dark:text-white">Mes produits ({products.length})</h2>
              <button onClick={() => setProductModalData({ isOpen: true, product: null })} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95">
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            </div>
            {products.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Aucun produit. Ajoutez votre premier produit !</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {products.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <SafeImage
                      src={getImageUrl(p.image)}
                      alt={p.name}
                      square
                      className="w-12 h-12 rounded-xl shrink-0"
                      fallbackIcon={<Package className="w-6 h-6 text-slate-400" />}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{p.name}</p>
                      <p className="text-sm font-bold text-indigo-600">{formatPrice(p.price)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggleStock(p)}
                        className={`p-1.5 rounded-lg transition-colors ${p.in_stock ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
                        title={p.in_stock ? 'Marquer épuisé' : 'Marquer en stock'}
                      >
                        {p.in_stock ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button onClick={() => setProductModalData({ isOpen: true, product: p })} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {deleteConfirm === p.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleDeleteProduct(p.id)} className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-lg">Oui</button>
                          <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg">Non</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
