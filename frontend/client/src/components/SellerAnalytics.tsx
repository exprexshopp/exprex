import React, { useEffect, useState } from 'react';
import {
  BarChart2,
  Eye,
  MessageCircle,
  Package,
  ArrowLeft,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { db } from '../services/db';
import { formatPrice } from '../lib/format';

type AnalyticsProduct = {
  id: string;
  name: string;
  price: number;
  views_count?: number;
  whatsapp_clicks?: number;
};

type AnalyticsData = {
  totalViews: number;
  totalWhatsApp: number;
  totalRevenue: number;
  products: AnalyticsProduct[];
};

const EMPTY_ANALYTICS: AnalyticsData = {
  totalViews: 0,
  totalWhatsApp: 0,
  totalRevenue: 0,
  products: [],
};

export function SellerAnalytics() {
  const {
    currentUser,
    handleNavigateDashboard,
    dataVersion,
  } = useApp();

  const [analytics, setAnalytics] =
    useState<AnalyticsData>(EMPTY_ANALYTICS);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      if (!currentUser?.id) {
        setAnalytics(EMPTY_ANALYTICS);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const shop = await db.getShopByOwner(currentUser.id);

        if (cancelled) return;

        if (!shop?.id) {
          setAnalytics(EMPTY_ANALYTICS);
          return;
        }

        const data = await db.getShopAnalytics(shop.id);

        if (cancelled) return;

        setAnalytics({
          totalViews: Number(data?.totalViews ?? 0),
          totalWhatsApp: Number(data?.totalWhatsApp ?? 0),
          totalRevenue: Number(data?.totalRevenue ?? 0),
          products: Array.isArray(data?.products)
            ? data.products
            : [],
        });
      } catch (error) {
        console.error('Erreur chargement analytics:', error);

        if (!cancelled) {
          setAnalytics(EMPTY_ANALYTICS);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, dataVersion]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const views = analytics.totalViews;
  const whatsapp = analytics.totalWhatsApp;
  const revenue = analytics.totalRevenue;
  const products = analytics.products;

  const whatsappRate =
    views > 0
      ? ((whatsapp / views) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={handleNavigateDashboard}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Retour au dashboard"
        >
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Analytics
          </h1>

          <p className="text-sm text-slate-500">
            Statistiques de votre boutique
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        <div className="bg-sky-50 dark:bg-sky-900/20 rounded-2xl p-4 text-center border border-sky-100 dark:border-sky-800">
          <Eye className="w-6 h-6 text-sky-600 mx-auto mb-2" />

          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {views}
          </p>

          <p className="text-[10px] text-slate-500 font-medium">
            Vues totales
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 text-center border border-green-100 dark:border-green-800">
          <MessageCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />

          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {whatsapp}
          </p>

          <p className="text-[10px] text-slate-500 font-medium">
            Clics WhatsApp
          </p>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 text-center border border-indigo-100 dark:border-indigo-800">
          <BarChart2 className="w-6 h-6 text-indigo-600 mx-auto mb-2" />

          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {formatPrice(revenue)}
          </p>

          <p className="text-[10px] text-slate-500 font-medium">
            Revenus estimés
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 text-center border border-amber-100 dark:border-amber-800">
          <MessageCircle className="w-6 h-6 text-amber-600 mx-auto mb-2" />

          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {whatsappRate}%
          </p>

          <p className="text-[10px] text-slate-500 font-medium">
            Taux de contact
          </p>
        </div>

      </div>

      {/* Produits */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">

        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-indigo-600" />

          <h2 className="font-bold text-slate-900 dark:text-white">
            Performance des produits
          </h2>

          <span className="ml-auto text-xs text-slate-400">
            {products.length} produit{products.length > 1 ? 's' : ''}
          </span>
        </div>

        {products.length === 0 ? (

          <div className="text-center py-8">
            <Package className="w-10 h-10 mx-auto mb-3 text-slate-300" />

            <p className="text-sm text-slate-400">
              Aucun produit dans votre boutique
            </p>
          </div>

        ) : (

          <div className="space-y-3">

            {products.map((product) => {
              const productViews =
                Number(product.views_count) || 0;

              const productWhatsApp =
                Number(product.whatsapp_clicks) || 0;

              return (
                <div
                  key={product.id}
                  className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                >

                  <div className="flex items-center gap-3">

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {product.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {formatPrice(product.price)}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs">

                      <span className="flex items-center gap-1 text-slate-500">
                        <Eye className="w-3.5 h-3.5 text-sky-500" />
                        {productViews}
                      </span>

                      <span className="flex items-center gap-1 text-slate-500">
                        <MessageCircle className="w-3.5 h-3.5 text-green-500" />
                        {productWhatsApp}
                      </span>

                    </div>

                  </div>

                  {/* Mini indicateur visuel */}
                  <div className="mt-3">

                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Vues → WhatsApp</span>

                      <span>
                        {productViews > 0
                          ? `${(
                              (productWhatsApp / productViews) *
                              100
                            ).toFixed(1)}%`
                          : '0%'}
                      </span>
                    </div>

                    <div className="h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{
                          width: `${
                            productViews > 0
                              ? Math.min(
                                  (productWhatsApp / productViews) *
                                    100,
                                  100
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>

                  </div>

                </div>
              );
            })}

          </div>

        )}

      </div>

    </div>
  );
}
