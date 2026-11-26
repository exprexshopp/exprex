// Design: Afrique Moderne — formulaire création/édition boutique
import React, { useState, useEffect, useMemo } from 'react';
import { X, Store, MapPin, Phone, Palette } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { db } from '../services/db';
import { Shop, ShopThemePreset } from '../types';
import { logger } from "../lib/logger";


const THEMES: { value: ShopThemePreset; label: string; color: string }[] = [
  { value: 'modern', label: 'Moderne', color: '#0284C7' },
  { value: 'elegant', label: 'Élégant', color: '#1e293b' },
  { value: 'nature', label: 'Nature', color: '#166534' },
  { value: 'vif', label: 'Vif', color: '#EA580C' },
  { value: 'classic', label: 'Classique', color: '#334155' },
];

export function ShopFormModal() {
  const { shopModalData, setShopModalData, currentUser, handleSaveShop, dataVersion } = useApp();
  const { isOpen, shop } = shopModalData;
  // const cities = useMemo(() => db.getCities(), [dataVersion]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: '', description: '', city: 'Douala', location: '',
    phone: '', whatsapp_number: '', logo: '',
    theme: 'modern' as ShopThemePreset, custom_theme_color: '#0284C7',
    facebook: '', instagram: '',
  });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);


  useEffect(() => {
    const loadCities = async () => {
      setLoading(true);
      try {
        const result = await db.getCities();
        setCities(Array.isArray(result) ? result : ['Douala', 'Yaounde', 'Bafoussam', 'Bamenda']);
      } catch (error) {
        logger.error('Erreur chargement villes:', error);
        setCities(['Douala', 'Yaounde', 'Bafoussam', 'Bamenda']);
      } finally {
        setLoading(false);
      }
    };
    if (isOpen) {
      loadCities();
    }
  }, [isOpen, dataVersion]);

  useEffect(() => {
    if (shop) {
      setForm({
        name: shop.name, description: shop.description, city: shop.city, location: shop.location,
        phone: shop.phone, whatsapp_number: shop.whatsapp_number, logo: shop.logo || '',
        theme: shop.theme, custom_theme_color: shop.custom_theme_color,
        facebook: shop.facebook || '', instagram: shop.instagram || '',
      });
    } else {
      setForm({ name: '', description: '', city: 'Douala', location: '', phone: '', whatsapp_number: '', logo: '', theme: 'modern', custom_theme_color: '#0284C7', facebook: '', instagram: '' });
    }
  }, [shop, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleLogoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingLogo(true);
      // ✅ uploadImage retourne maintenant directement une string (le chemin)
      const url = await db.uploadImage(file);
      setForm(f => ({ ...f, logo: url }));
    } catch (error) {
      logger.error('Erreur upload logo:', error);
    } finally {
      setIsUploadingLogo(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async () => {
  if (!form.name || !form.city || !form.whatsapp_number) return;
  
  try {
    // ✅ Si shop existe, inclure l'ID pour la mise à jour
    const shopData = {
      ...form,
      owner_id: currentUser.id,
      ...(shop ? { id: shop.id } : {}), // ← Important pour la mise à jour
    };
    
    await handleSaveShop(shopData);
    setShopModalData({ isOpen: false, shop: null });
  } catch (error) {
    logger.error('Erreur sauvegarde boutique:', error);
  }
};

  const field = (label: string, key: keyof typeof form, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{label}</label>
      <input
        type={type} value={form[key] as string} placeholder={placeholder}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-300"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShopModalData({ isOpen: false, shop: null })} />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-white" />
            <h2 className="text-white font-bold text-lg">{shop ? 'Modifier la boutique' : 'Créer ma boutique'}</h2>
          </div>
          <button onClick={() => setShopModalData({ isOpen: false, shop: null })} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {field('Nom de la boutique *', 'name', 'text', 'Ex: Tek Empire Douala')}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Décrivez votre boutique..." className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-300 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Ville *</label>
              <select value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-300">
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {field('WhatsApp * (sans +)', 'whatsapp_number', 'text', '237699001122')}
          </div>
          {field('Adresse précise', 'location', 'text', 'Ex: Akwa, Boulevard de la Liberté')}
          {field('Téléphone', 'phone', 'tel', '+237699001122')}
          {/* {field('URL Logo (image)', 'logo', 'url', 'https://...')} */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Logo local (upload)</label>
            <input type="file" accept="image/*" onChange={handleLogoFileChange} className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-300" />
            {isUploadingLogo && <p className="mt-1 text-xs text-indigo-600">Téléchargement en cours…</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field('Facebook', 'facebook', 'url', 'https://facebook.com/...')}
            {field('Instagram', 'instagram', 'url', 'https://instagram.com/...')}
          </div>
          {/* Theme */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Thème de la boutique</label>
            <div className="flex gap-2 flex-wrap">
              {THEMES.map(t => (
                <button key={t.value} onClick={() => setForm(f => ({ ...f, theme: t.value, custom_theme_color: t.color }))} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border-2 transition-all ${form.theme === t.value ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-700 flex gap-3 shrink-0">
          <button onClick={() => setShopModalData({ isOpen: false, shop: null })} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 font-semibold rounded-2xl hover:bg-slate-50 transition-colors">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={!form.name || !form.whatsapp_number} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl transition-all active:scale-95">
            {shop ? 'Enregistrer' : 'Créer la boutique'}
          </button>
        </div>
      </div>
    </div>
  );
}
