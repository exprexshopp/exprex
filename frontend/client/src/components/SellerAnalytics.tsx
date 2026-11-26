import React, { useEffect, useMemo, useState } from 'react';
import {

  ArrowLeft,
  BarChart3,
  Eye,
  MessageCircle,
  Package,
  TrendingUp,
  MousePointerClick,
  ShoppingBag,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { db } from '../services/db';
import { formatPrice } from '../lib/format';
import { logger } from "../lib/logger";

type AnalyticsProduct = {
  id: string;
  name: string;
  price: number;
  views_count?: number;
  whatsapp_clicks?: number;
  views?: number;
  whatsappClicks?: number;
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

  const [analytics, setAnalytics] = useState<AnalyticsData>(EMPTY_ANALYTICS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = async (isRefresh = false) => {
    if (!currentUser?.id) {
      setAnalytics(EMPTY_ANALYTICS);
      setLoading(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const shop = await db.getShopByOwner(currentUser.id);

      if (!shop) {
        setAnalytics(EMPTY_ANALYTICS);
        return;
      }

      const data = await db.getShopAnalytics(shop.id);

      const rawProducts = Array.isArray(data?.products)
        ? data.products
        : [];

      const products: AnalyticsProduct[] = rawProducts.map((product: any) => ({
        ...product,
        views_count: Number(
          product.views_count ??
          product.views ??
          0
        ),
        whatsapp_clicks: Number(
          product.whatsapp_clicks ??
          product.whatsappClicks ??
          0
        ),
      }));

      setAnalytics({
        totalViews: Number(data?.totalViews ?? 0),
        totalWhatsApp: Number(data?.totalWhatsApp ?? 0),
        totalRevenue: Number(data?.totalRevenue ?? 0),
        products,
      });
    } catch (error) {
      logger.error('Erreur chargement analytics:', error);

      if (!isRefresh) {
        setAnalytics(EMPTY_ANALYTICS);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [currentUser?.id, dataVersion]);

  /*
   * Cette page est privée/authentifiée.
   * On améliore le titre du document pour l'accessibilité,
   * les favoris navigateur et les outils d'assistance,
   * sans chercher à indexer les données privées par les moteurs.
   */
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Analytics vendeur | eXpress Shop';

    return () => {
      document.title = previousTitle;
    };
  }, []);

  const {
    totalViews,
    totalWhatsApp,
    totalRevenue,
    products,
  } = analytics;

  const shopConversion = useMemo(() => {
    if (totalViews <= 0) return 0;
    return Math.round((totalWhatsApp / totalViews) * 100);
  }, [totalViews, totalWhatsApp]);

  const productsWithStats = useMemo(() => {
    return products
      .map((product) => {
        const views = Number(product.views_count ?? 0);
        const whatsapp = Number(product.whatsapp_clicks ?? 0);
        const conversion = views > 0
          ? Math.round((whatsapp / views) * 100)
          : 0;

        return {
          ...product,
          views,
          whatsapp,
          conversion,
        };
      })
      .sort((a, b) => {
        if (b.views !== a.views) {
          return b.views - a.views;
        }

        return b.whatsapp - a.whatsapp;
      });
  }, [products]);

  const topProduct = productsWithStats[0];

  if (loading) {
    return (
      <main
        className="max-w-6xl mx-auto"
        aria-label="Chargement des analytics"
      >
        <div className="flex flex-col items-center justify-center py-24">
          <div
            className="w-9 h-9 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"
            aria-hidden="true"
          />

          <p className="mt-4 text-sm text-slate-500">
            Chargement de vos statistiques...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="max-w-6xl mx-auto pb-10"
      aria-labelledby="analytics-title"
    >

      {/* =========================================================
          HEADER
      ========================================================= */}
      <header className="mb-6">
        <div className="flex items-start justify-between gap-4">

          <div className="flex items-start gap-3">

            <button
              onClick={handleNavigateDashboard}
              type="button"
              aria-label="Retour au tableau de bord vendeur"
              className="
                mt-1
                w-10 h-10
                flex items-center justify-center
                rounded-xl
                bg-white dark:bg-slate-800
                border border-slate-200 dark:border-slate-700
                text-slate-500
                hover:text-indigo-600
                hover:border-indigo-200
                dark:hover:border-indigo-800
                transition-all
              "
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-5 h-5 text-indigo-600" />

                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  Tableau de bord
                </span>
              </div>

              <h1
                id="analytics-title"
                className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
              >
                Analytics
              </h1>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Comprenez les performances de votre boutique et de vos produits.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadAnalytics(true)}
            disabled={refreshing}
            aria-label="Actualiser les statistiques"
            className="
              flex items-center gap-2
              px-3 py-2
              rounded-xl
              bg-white dark:bg-slate-800
              border border-slate-200 dark:border-slate-700
              text-sm font-semibold
              text-slate-600 dark:text-slate-300
              hover:border-indigo-200
              hover:text-indigo-600
              disabled:opacity-50
              transition-all
            "
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            />

            <span className="hidden sm:inline">
              Actualiser
            </span>
          </button>

        </div>
      </header>

      {/* =========================================================
          KPI PRINCIPAUX
      ========================================================= */}
      <section
        aria-labelledby="overview-title"
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <h2
            id="overview-title"
            className="text-sm font-bold text-slate-900 dark:text-white"
          >
            Vue d'ensemble
          </h2>

          <span className="text-xs text-slate-400">
            {products.length} produit{products.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

          {/* Vues */}
          <div
            className="
              relative overflow-hidden
              rounded-2xl
              bg-white dark:bg-slate-800
              border border-slate-200 dark:border-slate-700
              p-4
            "
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Vues
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {totalViews.toLocaleString('fr-FR')}
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center">
                <Eye className="w-5 h-5 text-sky-600" />
              </div>
            </div>

            <p className="mt-3 text-[11px] text-slate-400">
              Visites de vos produits
            </p>
          </div>

          {/* WhatsApp */}
          <div
            className="
              relative overflow-hidden
              rounded-2xl
              bg-white dark:bg-slate-800
              border border-slate-200 dark:border-slate-700
              p-4
            "
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Contacts WhatsApp
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {totalWhatsApp.toLocaleString('fr-FR')}
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>

            <p className="mt-3 text-[11px] text-slate-400">
              Intentions de contact
            </p>
          </div>

          {/* Conversion */}
          <div
            className="
              relative overflow-hidden
              rounded-2xl
              bg-white dark:bg-slate-800
              border border-slate-200 dark:border-slate-700
              p-4
            "
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Conversion
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {shopConversion}%
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
            </div>

            <div className="mt-3 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{
                  width: `${Math.min(shopConversion, 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Revenus */}
          <div
            className="
              relative overflow-hidden
              rounded-2xl
              bg-gradient-to-br from-indigo-600 to-violet-600
              p-4 text-white
            "
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-indigo-100">
                  Revenus estimés
                </p>

                <p className="mt-1 text-xl md:text-2xl font-bold">
                  {formatPrice(totalRevenue)}
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
            </div>

            <p className="mt-3 text-[11px] text-indigo-100">
              Estimation basée sur les données disponibles
            </p>
          </div>

        </div>
      </section>

      {/* =========================================================
          INSIGHT RAPIDE
      ========================================================= */}
      {topProduct && (
        <section
          aria-labelledby="insight-title"
          className="
            mb-6
            rounded-2xl
            border border-indigo-100 dark:border-indigo-900/40
            bg-indigo-50/70 dark:bg-indigo-900/10
            p-4
          "
        >
          <div className="flex items-start gap-3">

            <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>

            <div className="min-w-0">
              <h2
                id="insight-title"
                className="text-sm font-bold text-slate-900 dark:text-white"
              >
                Produit le plus consulté
              </h2>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                <strong>{topProduct.name}</strong> a généré{' '}
                <strong>{topProduct.views.toLocaleString('fr-FR')}</strong>{' '}
                vue{topProduct.views > 1 ? 's' : ''}.
              </p>
            </div>

          </div>
        </section>
      )}

      {/* =========================================================
          PERFORMANCE PRODUITS
      ========================================================= */}
      <section
        aria-labelledby="products-performance-title"
        className="
          bg-white dark:bg-slate-800
          rounded-2xl
          border border-slate-200 dark:border-slate-700
          shadow-sm
          overflow-hidden
        "
      >

        <div className="p-5 border-b border-slate-100 dark:border-slate-700">

          <div className="flex items-center justify-between gap-3">

            <div>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />

                <h2
                  id="products-performance-title"
                  className="font-bold text-slate-900 dark:text-white"
                >
                  Performance des produits
                </h2>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Comparez les vues et les contacts générés par chaque produit.
              </p>
            </div>

            <span className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-300">
              {products.length}
            </span>

          </div>

        </div>

        {products.length === 0 ? (

          <div className="text-center py-14 px-5">

            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <Package className="w-7 h-7 text-slate-400" />
            </div>

            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Aucun produit à analyser
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Les statistiques apparaîtront dès que votre boutique aura des produits.
            </p>

          </div>

        ) : (

          <div className="divide-y divide-slate-100 dark:divide-slate-700">

            {productsWithStats.map((product, index) => (

              <article
                key={product.id}
                className="
                  p-4 md:p-5
                  hover:bg-slate-50 dark:hover:bg-slate-700/30
                  transition-colors
                "
              >

                {/* Produit */}
                <div className="flex items-start gap-3">

                  {/* Rang */}
                  <div className="
                    hidden sm:flex
                    w-8 h-8
                    shrink-0
                    items-center justify-center
                    rounded-lg
                    bg-slate-100 dark:bg-slate-700
                    text-xs font-bold
                    text-slate-500
                  ">
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">

                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {product.name}
                        </h3>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatPrice(product.price)}
                        </p>
                      </div>

                      <span className="
                        hidden sm:inline-flex
                        items-center gap-1
                        shrink-0
                        text-xs
                        font-semibold
                        text-slate-500
                      ">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {product.conversion}%
                      </span>

                    </div>

                    {/* Statistiques */}
                    <div className="grid grid-cols-2 gap-2 mt-4">

                      <div className="
                        flex items-center gap-2
                        px-3 py-2
                        rounded-xl
                        bg-sky-50 dark:bg-sky-900/10
                      ">
                        <Eye className="w-4 h-4 text-sky-600 shrink-0" />

                        <div>
                          <p className="text-[10px] text-slate-400">
                            Vues
                          </p>

                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            {product.views.toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>

                      <div className="
                        flex items-center gap-2
                        px-3 py-2
                        rounded-xl
                        bg-green-50 dark:bg-green-900/10
                      ">
                        <MessageCircle className="w-4 h-4 text-green-600 shrink-0" />

                        <div>
                          <p className="text-[10px] text-slate-400">
                            WhatsApp
                          </p>

                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            {product.whatsapp.toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>

                    </div>

                    {/* Conversion */}
                    <div className="mt-4">

                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <MousePointerClick className="w-3.5 h-3.5 text-indigo-500" />

                          <span className="text-[11px] font-medium text-slate-500">
                            Vues → WhatsApp
                          </span>
                        </div>

                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          {product.conversion}%
                        </span>
                      </div>

                      <div
                        className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden"
                        role="progressbar"
                        aria-valuenow={product.conversion}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Conversion de ${product.name}`}
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-green-500 transition-all duration-500"
                          style={{
                            width: `${Math.min(product.conversion, 100)}%`,
                          }}
                        />
                      </div>

                    </div>

                  </div>

                  <ChevronRight className="hidden md:block w-4 h-4 text-slate-300 mt-1" />

                </div>

              </article>

            ))}

          </div>

        )}

      </section>

      {/* =========================================================
          NOTE ANALYTICS
      ========================================================= */}
      <footer className="mt-4 text-center">
        <p className="text-[11px] text-slate-400">
          Les statistiques sont mises à jour lorsque les données de votre boutique sont actualisées.
        </p>
      </footer>

    </main>
  );
}
