// Design: Afrique Moderne — carte produit avec image carrée, favoris via contexte global
import React, { useState } from 'react';
import { Heart, MessageCircle, Eye, Star, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { formatPrice } from '../lib/format';
import { useApp } from '../contexts/AppContext';
import { SafeImage } from './SafeImage';
import { getImageUrl } from '@/lib/imageUrl';
import { logger } from "../lib/logger";


interface ProductCardProps {
  product: Product;
  onSelect?: (slug: string) => void;
  onClick?: (slug: string) => void;
  onWhatsApp: (product: Product) => void;
}

export function ProductCard({ product, onSelect, onClick, onWhatsApp }: ProductCardProps) {
  const { currentUser, favoriteIds, toggleFavorite } = useApp();
  const [loadingFav, setLoadingFav] = useState(false);

  // ✅ Lecture directe depuis le Set global — AUCUN appel API
  const isFav = favoriteIds.has(product.id);

  const handleFav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser || loadingFav) return;

    setLoadingFav(true);
    try {
      await toggleFavorite(product.id);
    } catch (error) {
      logger.error('Erreur toggle favori:', error);
    } finally {
      setLoadingFav(false);
    }
  };

  const handleClick = () => {
    if (onSelect) onSelect(product.slug);
    else if (onClick) onClick(product.slug);
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    onWhatsApp(product);
  };

  const avgRating = product.reviews_count && product.reviews_count > 0 ? 4.5 : null;

  return (
    <div
      onClick={handleClick}
      className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      <div className="relative aspect-square bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <SafeImage
          src={getImageUrl(product.image)}
          alt={product.name}
          className="w-full h-full group-hover:scale-105 transition-transform duration-300"
          fallbackIcon={<ShoppingBag className="w-12 h-12 text-slate-300" />}
        />
        <div className="absolute top-2 right-2 flex gap-1.5">
          {currentUser && (
            <button
              onClick={handleFav}
              disabled={loadingFav}
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 ${
                isFav ? 'bg-red-500 text-white' : 'bg-white/90 text-slate-500 hover:bg-white hover:text-red-500'
              } ${loadingFav ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
        {!product.in_stock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-slate-800 text-xs font-bold px-3 py-1 rounded-full">Rupture de stock</span>
          </div>
        )}
        <div className="absolute bottom-2 left-2">
          <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
            {product.subcategory_name || product.category}
          </span>
        </div>
      </div>

      <div className="p-3">
        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium truncate mb-0.5">{product.shop_name}</p>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug mb-2">{product.name}</h3>

        <div className="flex items-center gap-2 mb-2">
          {avgRating && (
            <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-medium">
              <Star className="w-3 h-3 fill-current" /> {avgRating}
            </span>
          )}
          {(product.views_count || 0) > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
              <Eye className="w-3 h-3" /> {product.views_count}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-base font-bold text-slate-900 dark:text-white">{formatPrice(product.price)}</span>
          <button
            onClick={handleWhatsApp}
            disabled={!product.in_stock}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500 hover:bg-green-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-sm shadow-green-200"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WA</span>
          </button>
        </div>
      </div>
    </div>
  );
}
