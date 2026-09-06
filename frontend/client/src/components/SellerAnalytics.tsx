import React, { useState, useEffect } from 'react';
import { BarChart2, Eye, MessageCircle, Package, ArrowLeft } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { db } from '../services/db';
import { formatPrice } from '../lib/format';

export function SellerAnalytics() {
  const { currentUser, setViewMode, dataVersion } = useApp();
  const [analytics, setAnalytics] = useState<any>({ 
    totalViews: 0, 
    totalWhatsApp: 0, 
    totalRevenue: 0, 
    products: [] 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const shop = await db.getShopByOwner(currentUser.id);
        if (shop) {
          const data = await db.getShopAnalytics(shop.id);
          // ✅ S'assurer que products est toujours un tableau
          setAnalytics({
            ...data,
            products: Array.isArray(data?.products) ? data.products : []
          });
        } else {
          setAnalytics({ totalViews: 0, totalWhatsApp: 0, totalRevenue: 0, products: [] });
        }
      } catch (error) {
        console.error('Erreur chargement analytics:', error);
        setAnalytics({ totalViews: 0, totalWhatsApp: 0, totalRevenue: 0, products: [] });
      } finally {
        setLoading(false);
      }
    };
    
    loadAnalytics();
  }, [currentUser, dataVersion]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const { totalViews, totalWhatsApp, totalRevenue, products } = analytics;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button 
          onClick={() => setViewMode('dashboard')} 
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-slate-500">Statistiques de votre boutique</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Vues totales', value: totalViews || 0, icon: Eye, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-900/20' },
          { label: 'Clics WhatsApp', value: totalWhatsApp || 0, icon: MessageCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Revenus estimés', value: `${formatPrice(totalRevenue || 0)}`, icon: BarChart2, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 text-center border border-slate-100 dark:border-slate-700`}>
            <Icon className={`w-6 h-6 ${color} mx-auto mb-2`} />
            <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
            <p className="text-[10px] text-slate-500 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Products performance */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-slate-900 dark:text-white">Performance des produits</h2>
          <span className="ml-auto text-xs text-slate-400">{products.length} produits</span>
        </div>
        
        {products.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-8">Aucun produit dans votre boutique</p>
        ) : (
          <div className="space-y-3">
            {products.map((product: any) => (
              <div key={product.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{product.name}</p>
                  <p className="text-xs text-slate-500">{formatPrice(product.price)}</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1 text-slate-500">
                    <Eye className="w-3.5 h-3.5" /> {product.views_count || 0}
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <MessageCircle className="w-3.5 h-3.5 text-green-500" /> {product.whatsapp_clicks || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}