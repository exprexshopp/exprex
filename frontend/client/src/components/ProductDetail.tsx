// Design: Afrique Moderne — fiche produit détaillée avec avis et CTA WhatsApp
import React, { useEffect, useState } from 'react';
import {

  ArrowLeft, Heart, Share2, Star, Eye, MessageCircle,
  Store, MapPin, ShoppingBag, Clock, CheckCircle, XCircle
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { db } from '../services/db';
import { formatPrice, formatDate, isShopOpenNow } from '../lib/format';
import { ImageGallery } from './ImageGallery';
import { SafeImage } from './SafeImage';
import { getImageUrl } from '@/lib/imageUrl';
import { logger } from "../lib/logger";
import { openExprexChat } from './ChatAssistModal';

export function ProductDetail() {
  const {
    currentUser, selectedProductSlug, handleNavigateHome,
    handleSelectShopVitrine, handleQuickWhatsApp,
    handleOpenAuthModal, favoriteIds, toggleFavorite
  } = useApp();

  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  // ✅ Lecture directe depuis le Set global
  const isFav = product ? favoriteIds.has(product.id) : false;

  // ✅ Charger les données du produit (UNE SEULE FOIS par slug)
  useEffect(() => {
    if (!selectedProductSlug) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const loadProductData = async () => {
      setLoading(true);
      try {
        const productData = await db.getProductBySlug(selectedProductSlug);
        if (cancelled) return;
        setProduct(productData);

        if (productData) {
          const reviewsData = await db.getProductReviews(productData.id);
          if (cancelled) return;
          setReviews(Array.isArray(reviewsData) ? reviewsData : []);

          const shopData = await db.getShopBySlug(productData.shop_slug);
          if (cancelled) return;
          setShop(shopData);

          if (shopData && shopData.hours) {
            try {
              const hoursData = typeof shopData.hours === 'string'
                ? JSON.parse(shopData.hours)
                : shopData.hours;
              if (!cancelled) setIsShopOpen(isShopOpenNow(hoursData));
            } catch {
              if (!cancelled) setIsShopOpen(false);
            }
          } else {
            setIsShopOpen(false);
          }

          // Analytics : enregistrer la vue sans modifier l'état global React
          void db.recordView(productData.id).catch((error) => {
            logger.warn("Impossible d'enregistrer la vue du produit:", error);
          });
        }
      } catch (error) {
        logger.error('Erreur chargement produit:', error);
        if (!cancelled) {
          setProduct(null);
          setReviews([]);
          setShop(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProductData();
    return () => { cancelled = true; };
  }, [selectedProductSlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Produit introuvable.</p>
        <button onClick={handleNavigateHome} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold">
          Retour
        </button>
      </div>
    );
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;

  const handleFav = async () => {
    if (!currentUser) {
      handleOpenAuthModal('Connectez-vous pour ajouter aux favoris');
      return;
    }
    if (favLoading) return;
    setFavLoading(true);
    try {
      await toggleFavorite(product.id);
    } finally {
      setFavLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!currentUser) {
      handleOpenAuthModal('Connectez-vous pour laisser un avis');
      return;
    }
    if (!reviewText.trim()) return;

    try {
      await db.saveReview({
        user_id: currentUser.id,
        user_name: `${currentUser.first_name} ${currentUser.last_name}`,
        product_id: product.id,
        rating: reviewRating,
        comment: reviewText
      });
      setReviewText('');

      const reviewsData = await db.getProductReviews(product.id);
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
    } catch (error) {
      logger.error('Erreur sauvegarde avis:', error);
    }
  };

  // ✅ Collection d'images pour la galerie
  const productImages = [product.image].filter(Boolean);

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={handleNavigateHome}
        className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors mb-4 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Retour au catalogue</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="lg:sticky lg:top-4 self-start">
          <ImageGallery
            images={productImages}
            mainImage={product.image || ''}
            productName={product.name}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
              {product.category} {product.subcategory_name && `· ${product.subcategory_name}`}
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              product.in_stock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {product.in_stock ? '✅ En stock' : '❌ Épuisé'}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
            {product.name}
          </h1>

          <div className="flex items-center gap-4 text-sm">
            {avgRating && (
              <span className="flex items-center gap-1 text-amber-500 font-semibold">
                <Star className="w-4 h-4 fill-current" />
                {avgRating.toFixed(1)} ({reviews.length} avis)
              </span>
            )}
            <span className="flex items-center gap-1 text-slate-400">
              <Eye className="w-4 h-4" /> {product.views_count || 0} vues
            </span>
          </div>

          <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
            {formatPrice(product.price)}
          </div>

          {shop && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <SafeImage
                  src={getImageUrl(shop.logo)}
                  alt={shop.name}
                  className="w-12 h-12 rounded-xl object-cover"
                  fallbackIcon={<Store className="w-6 h-6 text-indigo-600" />}
                />
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => handleSelectShopVitrine(shop.slug)}
                    className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 transition-colors text-left"
                  >
                    {shop.name}
                  </button>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="w-3 h-3" />
                    <span>{shop.city}</span>
                    <span className="flex items-center gap-1">
                      {isShopOpen ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <XCircle className="w-3 h-3 text-red-500" />
                      )}
                      <span className={isShopOpen ? 'text-green-600' : 'text-red-600'}>
                        {isShopOpen ? 'Ouvert' : 'Fermé'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => openExprexChat(product)}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
            >
              <MessageCircle className="w-6 h-6" />
              Assistant chat
            </button>
            <button
              onClick={() => handleQuickWhatsApp(product)}
              disabled={!product.in_stock}
              className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-lg rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-green-200"
            >
              <MessageCircle className="w-6 h-6" />
              WhatsApp
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleFav}
              disabled={favLoading}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                isFav
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              } ${favLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
              {isFav ? 'Favori' : 'Ajouter aux favoris'}
            </button>
            <button
              onClick={() => navigator.share?.({ title: product.name, url: window.location.href })}
              className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-current" />
          Avis clients ({reviews.length})
        </h2>

        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Laisser un avis</p>
          <div className="flex gap-1 mb-3">
            {[1,2,3,4,5].map(n => (
              <button key={n} onMouseEnter={() => setHoverRating(n)} onMouseLeave={() => setHoverRating(0)} onClick={() => setReviewRating(n)}>
                <Star className={`w-6 h-6 transition-colors ${n <= (hoverRating || reviewRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
              </button>
            ))}
          </div>
          <textarea
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            placeholder="Partagez votre expérience..."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:border-indigo-300 resize-none mb-2"
          />
          <button
            onClick={handleSubmitReview}
            disabled={!reviewText.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold rounded-xl transition-colors active:scale-95"
          >
            Publier l'avis
          </button>
        </div>

        {reviews.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-4">Soyez le premier à laisser un avis !</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {reviews.map((r: any) => (
              <div key={r.id} className="border-b border-slate-100 dark:border-slate-700 last:border-0 pb-3 last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{r.user_name}</p>
                  <span className="text-xs text-slate-400">{formatDate(r.created_at)}</span>
                </div>
                <div className="flex gap-0.5 mb-1">
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} className={`w-3.5 h-3.5 ${n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                  ))}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
