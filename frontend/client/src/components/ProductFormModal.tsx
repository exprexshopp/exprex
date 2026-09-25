// Design: Afrique Moderne — formulaire ajout/édition produit
import React, { useState, useEffect } from 'react';
import { X, Package, Upload, Store } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { db } from '../services/db';
import { SafeImage } from './SafeImage';
import { getImageUrl } from '@/lib/imageUrl';

export function ProductFormModal() {
  const { productModalData, setProductModalData, currentUser, handleSaveProduct, dataVersion } = useApp();
  const { isOpen, product } = productModalData;

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [subcategories, setSubcategories] = useState<any[]>([]);

  const [shopId, setShopId] = useState<string | null>(null);
  const [loadingShop, setLoadingShop] = useState(true);

  const [form, setForm] = useState({
    name: '', description: '', price: '', image: '',
    category: '', subcategory_id: '', subcategory_name: '',
    in_stock: true
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Charger la boutique du vendeur à l'ouverture
  useEffect(() => {
    const fetchShop = async () => {
      if (!currentUser) return;
      try {
        setLoadingShop(true);
        // Assurez-vous d'attendre la réponse si getShopByOwner est asynchrone
        // const shop = await db.getShopByOwner(currentUser.id);
        const [shop, setShop] = useState<any>(null);

        useEffect(() => {
          const loadShop = async () => {
            if (currentUser) {
              const shopData = await db.getShopByOwner(currentUser.id);
              setShop(shopData);
            }
          };
          loadShop();
        }, [currentUser]);

        
        if (shop) {
          setShopId(shop.id);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de la boutique", error);
      } finally {
        setLoadingShop(false);
      }
    };

    if (isOpen) {
      fetchShop();
    }
  }, [isOpen, currentUser]);

  // ✅ Charger les catégories
  // useEffect(() => {
  //   const loadCategories = async () => {
  //     try {
  //       const data = await db.getCategories();
  //       setCategories(Array.isArray(data) ? data : []);
  //     } catch (error) {
  //       console.error('Erreur chargement catégories:', error);
  //       setCategories([]);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   loadCategories();
  // }, []);
  useEffect(() => {
  // ✅ Si déjà chargé, ne pas recharger
  if (categories.length > 0 || loading === false) return;
  
  const loadCategories = async () => {
    try {
      const data = await db.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };
  loadCategories();
}, []);

  // ✅ Charger les sous-catégories quand une catégorie est sélectionnée
  useEffect(() => {
    const loadSubcategories = async () => {
      if (!selectedCatId) {
        setSubcategories([]);
        return;
      }
      try {
        const data = await db.getSubcategories(selectedCatId);
        setSubcategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Erreur chargement sous-catégories:', error);
        setSubcategories([]);
      }
    };
    loadSubcategories();
  }, [selectedCatId]);

  // ✅ Remplir le formulaire quand on modifie un produit
  useEffect(() => {
    if (product) {
      const cat = categories.find(c => c.name === product.category);
      setSelectedCatId(cat?.id || '');
      setForm({
        name: product.name,
        description: product.description,
        price: String(product.price),
        image: product.image || '',
        category: product.category,
        subcategory_id: product.subcategory_id || '',
        subcategory_name: product.subcategory_name || '',
        in_stock: product.in_stock
      });
    } else {
      setForm({
        name: '', description: '', price: '', image: '',
        category: '', subcategory_id: '', subcategory_name: '',
        in_stock: true
      });
      setSelectedCatId('');
    }
  }, [product, categories]);

  if (!isOpen || !currentUser) return null;

  // const shop = db.getShopByOwner(currentUser.id);
  // if (!shop) return null;

  if (!isOpen || !currentUser) return null;

  if (loadingShop) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-slate-500 mt-4 text-sm">Chargement de votre boutique...</p>
        </div>
      </div>
    );
  }

  // const handleSubmit = () => {
  //   if (!form.name || !form.price || !form.category) return;
  //   handleSaveProduct({
  //     ...form,
  //     price: parseFloat(form.price),
  //     shop_id: shop.id,
  //     ...(product ? { id: product.id } : {})
  //   });
  //   setProductModalData({ isOpen: false, product: null });
  // };

//   const handleSubmit = async () => {
//   if (!form.name || !form.price || !form.category) return;

//   try {
//     // ✅ Utiliser await pour obtenir la boutique
//     const shop = await db.getShopByOwner(currentUser.id);
    
//     if (!shop) {
//       console.error('❌ Aucune boutique trouvée pour cet utilisateur');
//       alert('Vous devez créer une boutique avant d\'ajouter des produits.');
//       return;
//     }

//     console.log('🏪 Boutique trouvée:', shop);
//     console.log('📦 Données produit envoyées:', {
//       ...form,
//       price: parseFloat(form.price),
//       shop_id: shop.id,
//       ...(product ? { id: product.id } : {})
//     });

//     await handleSaveProduct({
//       ...form,
//       price: parseFloat(form.price),
//       shop_id: shop.id,
//       ...(product ? { id: product.id } : {})
//     });
    
//     setProductModalData({ isOpen: false, product: null });
//   } catch (error) {
//     console.error('❌ Erreur lors de la sauvegarde du produit:', error);
//     alert('Erreur lors de la sauvegarde du produit. Veuillez réessayer.');
//   }
// };

// Dans ProductFormModal.tsx - handleSubmit
const handleSubmit = async () => {
  if (!form.name || !form.price || !form.category) return;

  try {
    const shop = await db.getShopByOwner(currentUser.id);
    if (!shop) {
      alert('Vous devez créer une boutique.');
      return;
    }

    // ✅ Construction des données
    const productData: any = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      image: form.image,
      category: form.category,
      subcategory_id: form.subcategory_id || null,
      subcategory_name: form.subcategory_name || null,
      in_stock: form.in_stock,
      shop_id: shop.id,
    };

    // ✅ SI C'EST UNE MODIFICATION, AJOUTER L'ID
    if (product && product.id) {
      productData.id = product.id;
      console.log('🔄 MODIFICATION - ID:', product.id);
    } else {
      console.log('➕ NOUVEAU PRODUIT');
    }

    console.log('📦 Envoi:', productData);
    await handleSaveProduct(productData);
    setProductModalData({ isOpen: false, product: null });
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
};

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-slate-500 mt-4 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setProductModalData({ isOpen: false, product: null })} />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-white" />
            <h2 className="text-white font-bold text-lg">{product ? 'Modifier le produit' : 'Ajouter un produit'}</h2>
          </div>
          <button onClick={() => setProductModalData({ isOpen: false, product: null })} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nom du produit *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex: iPhone 15 Pro Max"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Décrivez le produit..."
              className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-300 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Prix (FCFA) *</label>
              <input
                type="number"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="Ex: 850000"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Stock</label>
              <button
                onClick={() => setForm(f => ({ ...f, in_stock: !f.in_stock }))}
                className={`w-full py-2.5 text-sm font-semibold rounded-xl border-2 transition-all ${form.in_stock ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}
              >
                {form.in_stock ? '✓ En stock' : '✗ Épuisé'}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Catégorie *</label>
            <select
              value={selectedCatId}
              onChange={e => {
                const cat = categories.find(c => c.id === e.target.value);
                setSelectedCatId(e.target.value);
                setForm(f => ({ ...f, category: cat?.name || '', subcategory_id: '', subcategory_name: '' }));
              }}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-300"
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {subcategories.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Sous-catégorie</label>
              <select
                value={form.subcategory_id}
                onChange={e => {
                  const sub = subcategories.find(s => s.id === e.target.value);
                  setForm(f => ({ ...f, subcategory_id: e.target.value, subcategory_name: sub?.name || '' }));
                }}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-300"
              >
                <option value="">Toutes</option>
                {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Image du produit</label>
            <div className="space-y-2">
              {/* <input
                value={form.image}
                onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                type="url"
                placeholder="https://..."
                className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-300"
              /> */}
              <label className="flex items-center justify-center gap-2 w-full px-3 py-2.5 border border-dashed border-indigo-300 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-sm font-semibold text-indigo-700 dark:text-indigo-200 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>{uploadingImage ? 'Téléchargement...' : 'Téléverser une image locale'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingImage(true);
                    try {
                      const url = await db.uploadImage(file);
                      setForm(f => ({ ...f, image: url }));
                    } catch (error) {
                      console.error('Erreur upload image:', error);
                    } finally {
                      setUploadingImage(false);
                      e.target.value = '';
                    }
                  }}
                />
              </label>
            </div>
            {form.image && (
  <SafeImage
    src={getImageUrl(form.image)}
    alt="preview"
    className="mt-2 w-full h-32 object-cover rounded-xl"
    fallbackIcon={<Package className="w-8 h-8 text-slate-400" />}
  />
)}
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 dark:border-slate-700 flex gap-3 shrink-0">
          <button
            onClick={() => setProductModalData({ isOpen: false, product: null })}
            className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 font-semibold rounded-2xl hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.name || !form.price || !form.category}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl transition-all active:scale-95"
          >
            {product ? 'Enregistrer' : 'Ajouter le produit'}
          </button>
        </div>
      </div>
    </div>
  );
}