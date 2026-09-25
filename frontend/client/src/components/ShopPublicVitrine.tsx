import React, { useState, useEffect } from 'react';
import { ArrowLeft, Store, MapPin, Phone, MessageCircle, Star, Package, Clock } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { db } from '../services/db';
import { ProductCard } from './ProductCard';
import { formatPrice, isShopOpenNow } from '../lib/format';
import { Product } from '../types';
import { SafeImage } from './SafeImage';
import { getImageUrl } from '@/lib/imageUrl';

export function ShopPublicVitrine() {
  const { 
    selectedShopSlug, 
    handleNavigateHome, 
    handleSelectProductDetail, 
    handleQuickWhatsApp
  } = useApp();
  
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadShopData = async () => {
      if (!selectedShopSlug) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const shopData = await db.getShopBySlug(selectedShopSlug);
        setShop(shopData);
        
        // ✅ Parser les horaires
        if (shopData) {
          try {
            const hoursData = typeof shopData.hours === 'string' 
              ? JSON.parse(shopData.hours) 
              : shopData.hours;
            setIsOpen(hoursData ? isShopOpenNow(hoursData) : false);
          } catch (e) {
            console.warn('Erreur parsing horaires:', e);
            setIsOpen(false);
          }
          
          const allProducts = await db.getProductsForShop(shopData.id);
          setProducts(Array.isArray(allProducts) ? allProducts : []);
        } else {
          setProducts([]);
          setIsOpen(false);
        }
      } catch (error) {
        console.error('Erreur chargement boutique:', error);
        setShop(null);
        setProducts([]);
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    };
    
    loadShopData();
  }, [selectedShopSlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="text-center py-16">
        <Store className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">Boutique non trouvée</p>
        <button onClick={handleNavigateHome} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold">
          Retour au catalogue
        </button>
      </div>
    );
  }

  const trendingProducts = products.slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button onClick={handleNavigateHome} className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Retour au catalogue</span>
      </button>

      {/* Shop header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm">
        {shop.logo && (
  <div className="w-full h-32 bg-slate-100 dark:bg-slate-700 overflow-hidden">
    <SafeImage src={getImageUrl(shop.logo)} alt={shop.name} className="w-full h-full object-cover" />
  </div>
)}
        <div className="p-5">
          <div className="flex items-start gap-4">
            <SafeImage
  src={getImageUrl(shop.logo)}
  alt={shop.name}
  className="w-16 h-16 rounded-xl object-cover shrink-0 -mt-8 border-4 border-white dark:border-slate-800 shadow-md"
  fallbackIcon={<Store className="w-8 h-8 text-indigo-600" />}
/>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{shop.name}</h1>
              <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{shop.city}</span>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full shrink-0 ${
              isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              {isOpen ? 'Ouvert' : 'Fermé'}
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">{shop.description}</p>

          <div className="flex flex-wrap gap-2 mt-4">
            {shop.whatsapp_number && (
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-xl hover:bg-green-600 transition-colors">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </button>
            )}
            {shop.phone && (
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors">
                <Phone className="w-3.5 h-3.5" /> {shop.phone}
              </button>
            )}
          </div>

          {(shop.facebook || shop.instagram) && (
            <div className="flex gap-2 mt-3">
              {shop.facebook && (
                <a href={shop.facebook} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">Facebook</a>
              )}
              {shop.instagram && (
                <a href={shop.instagram} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">Instagram</a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Products */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-indigo-600" />
          Produits ({products.length})
        </h2>
        
        {products.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-8">Aucun produit disponible</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
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

      {/* Trending products */}
      {trendingProducts.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-amber-500 fill-current" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tendances</h2>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {trendingProducts.map((product) => (
              <div key={product.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => handleSelectProductDetail(product.slug)}>
                <SafeImage
  src={getImageUrl(product.image)}
  alt={product.name}
  className="w-16 h-16 rounded-xl object-cover shrink-0"
  fallbackIcon={<Package className="w-6 h-6 text-slate-400" />}
/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{product.name}</p>
                  <p className="text-sm font-bold text-indigo-600">{formatPrice(product.price)}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleQuickWhatsApp(product); }} className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}