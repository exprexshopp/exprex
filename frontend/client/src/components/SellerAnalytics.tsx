import React, { useEffect, useState } from 'react';
import { BarChart2, Eye, MessageCircle, Package, ArrowLeft } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { db } from '../services/db';
import { formatPrice } from '../lib/format';

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

  useEffect(() => {
    let cancelled = false;

    const loadAnalytics = async () => {
      if (!currentUser?.id) {
        if (!cancelled) {
          setAnalytics(EMPTY_ANALYTICS);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const shop = await db.getShopByOwner(currentUser.id);

        if (cancelled) return;

        if (!shop) {
          setAnalytics(EMPTY_ANALYTICS);
          return;
        }

        const data = await db.getShopAnalytics(shop.id);

        if (cancelled) return;

        /*
         * IMPORTANT :
         * Les compteurs affichés dans ProductDetail sont ceux du produit
         * lui-même : product.views_count.
         *
         * On normalise ici les données retournées par getShopAnalytics()
         * afin que l'UI fonctionne même si le backend renvoie certains
         * compteurs sous une autre forme.
         */
        const rawProducts = Array.isArray(data?.products)
          ? data.products
          : [];

        const products: AnalyticsProduct[] = rawProducts.map((product: any) => ({
          ...product,

          // Source principale : les compteurs du produit.
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

        /*
         * Les totaux restent ceux fournis par getShopAnalytics().
         * On ne les recalcule pas à partir de products pour ne pas
         * changer la logique existante des analytics globaux.
         */
        setAnalytics({
          totalViews: Number(data?.totalViews ?? 0),
          totalWhatsApp: Number(data?.totalWhatsApp ?? 0),
          totalRevenue: Number(data?.totalRevenue ?? 0),
          products,
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
    };

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

  const {
    totalViews,
    totalWhatsApp,
    totalRevenue,
    products,
  } = analytics;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={handleNavigateDashboard}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Retour au tableau de bord"
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

      {/* Totaux boutique */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Vues totales',
            value: totalViews,
            icon: Eye,
            color: 'text-sky-600',
            bg: 'bg-sky-50 dark:bg-sky-900/20',
          },
          {
            label: 'Clics WhatsApp',
            value: totalWhatsApp,
            icon: MessageCircle,
            color: 'text-green-600',
            bg: 'bg-green-50 dark:bg-green-900/20',
          },
          {
            label: 'Revenus estimés',
            value: formatPrice(totalRevenue),
            icon: BarChart2,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50 dark:bg-indigo-900/20',
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className={`${bg} rounded-2xl p-4 text-center border border-slate-100 dark:border-slate-700`}
          >
            <Icon className={`w-6 h-6 ${color} mx-auto mb-2`} />

            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {value}
            </p>

            <p className="text-[10px] text-slate-500 font-medium">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Performance produits */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">

        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-indigo-600" />

          <h2 className="font-bold text-slate-900 dark:text-white">
            Performance des produits
          </h2>

          <span className="ml-auto text-xs text-slate-400">
            {products.length} produits
          </span>
        </div>

        {products.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-8">
            Aucun produit dans votre boutique
          </p>
        ) : (
          <div className="space-y-3">

            {products.map((product) => {
              const views = Number(product.views_count ?? 0);
              const whatsapp = Number(product.whatsapp_clicks ?? 0);

              const conversion =
                views > 0
                  ? Math.round((whatsapp / views) * 100)
                  : 0;

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

                    <div className="flex items-center gap-4 text-xs shrink-0">

                      <span className="flex items-center gap-1 text-slate-500">
                        <Eye className="w-3.5 h-3.5 text-sky-500" />
                        {views}
                      </span>

                      <span className="flex items-center gap-1 text-slate-500">
                        <MessageCircle className="w-3.5 h-3.5 text-green-500" />
                        {whatsapp}
                      </span>

                    </div>
                  </div>

                  {/* Conversion vue → WhatsApp */}
                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">
                      Vues → WhatsApp
                    </span>

                    <span
                      className={
                        conversion > 0
                          ? 'font-semibold text-green-600'
                          : 'text-slate-400'
                      }
                    >
                      {conversion}%
                    </span>
                  </div>

                  <div className="mt-1 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min(conversion, 100)}%`,
                      }}
                    />
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