// CustomerDashboard.tsx - Version corrigée
import React, { useState, useEffect, useMemo } from 'react';
import { Heart, ShoppingBag, Star, Eye, MessageCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { db } from '../services/db';
import { formatPrice, formatDate } from '../lib/format';

import { logger } from "../lib/logger";

export function CustomerDashboard() {
  const { currentUser, handleSelectProductDetail, handleQuickWhatsApp } = useApp();
  
  const [favorites, setFavorites] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const favs = await db.getUserFavorites(currentUser.id);
        setFavorites(Array.isArray(favs) ? favs : []);
        
        // Pour les reviews, on peut les charger depuis le contexte ou l'API
        // Pour l'instant, on simule
        setReviews([]);
      } catch (error) {
        logger.error('Erreur chargement données client:', error);
        setFavorites([]);
        setReviews([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Veuillez vous connecter</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-slate-500 mt-4">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-700 to-indigo-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">Mon espace client</h1>
        <p className="text-indigo-200 text-sm">{currentUser.email}</p>
      </div>

      {/* Favorites */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-red-500" />
          <h2 className="font-bold text-slate-900 dark:text-white">Mes favoris ({favorites.length})</h2>
        </div>
        {favorites.length === 0 ? (
          <p className="text-slate-400 text-sm">Aucun favori pour l'instant</p>
        ) : (
          <div className="space-y-3">
            {favorites.map((fav: any) => (
              <div key={fav.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {fav.product_name || 'Produit'}
                  </p>
                  <p className="text-xs text-slate-500">{formatDate(fav.created_at)}</p>
                </div>
                <button className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-amber-500" />
          <h2 className="font-bold text-slate-900 dark:text-white">Mes avis ({reviews.length})</h2>
        </div>
        {reviews.length === 0 ? (
          <p className="text-slate-400 text-sm">Vous n'avez pas encore laissé d'avis</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review: any) => (
              <div key={review.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {review.product_name || 'Produit'}
                  </p>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} className={`w-3.5 h-3.5 ${n <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{review.comment}</p>
                <p className="text-xs text-slate-400 mt-1">{formatDate(review.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm hover:border-indigo-200 transition-colors text-center">
          <ShoppingBag className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Mes commandes</p>
        </button>
        <button className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm hover:border-indigo-200 transition-colors text-center">
          <MessageCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Contacter</p>
        </button>
      </div>
    </div>
  );
}