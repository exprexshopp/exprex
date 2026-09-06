// Design: Afrique Moderne — drawer latéral avec catégories et sous-catégories
import React, { useState, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { db } from '../services/db';

export function CategoryDrawer() {
  const { isCategoryDrawerOpen, setIsCategoryDrawerOpen, filterParams, handleFilterChange, dataVersion } = useApp();
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<Record<string, any[]>>({});
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Charger les catégories
  useEffect(() => {
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
}, []); // ✅ Dépendance vide

  // ✅ Charger les sous-catégories quand une catégorie est expansée
  useEffect(() => {
    const loadSubcategories = async () => {
      if (!expandedCat) return;
      
      // Éviter de recharger si déjà chargé
      if (subcategories[expandedCat]) return;
      
      try {
        const data = await db.getSubcategories(expandedCat);
        setSubcategories(prev => ({
          ...prev,
          [expandedCat]: Array.isArray(data) ? data : []
        }));
      } catch (error) {
        console.error('Erreur chargement sous-catégories:', error);
        setSubcategories(prev => ({
          ...prev,
          [expandedCat]: []
        }));
      }
    };
    loadSubcategories();
  }, [expandedCat]);

  const handleSelectCategory = (catSlug: string, subSlug?: string) => {
    handleFilterChange({ category: catSlug, subcategory: subSlug || '' });
    setIsCategoryDrawerOpen(false);
  };

  const toggleExpand = (catId: string) => {
    setExpandedCat(expandedCat === catId ? null : catId);
  };

  if (!isCategoryDrawerOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCategoryDrawerOpen(false)} />
        <div className="relative ml-auto w-80 max-w-full h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Catégories</h2>
            <button onClick={() => setIsCategoryDrawerOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCategoryDrawerOpen(false)} />
      <div className="relative ml-auto w-80 max-w-full h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Catégories</h2>
          <button onClick={() => setIsCategoryDrawerOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <button
            onClick={() => { handleFilterChange({ category: '', subcategory: '' }); setIsCategoryDrawerOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${!filterParams.category ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            Toutes les catégories
          </button>
          {categories.map((cat: any) => {
            const subs = subcategories[cat.id] || [];
            const isExpanded = expandedCat === cat.id;
            const isActive = filterParams.category === cat.slug;
            return (
              <div key={cat.id}>
                <button
                  onClick={() => {
                    if (subs.length > 0) toggleExpand(cat.id);
                    else handleSelectCategory(cat.slug);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-between ${isActive ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  <span>{cat.name}</span>
                  {subs.length > 0 && <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />}
                </button>
                {isExpanded && subs.length > 0 && (
                  <div className="ml-4 mt-1 space-y-0.5">
                    <button
                      onClick={() => handleSelectCategory(cat.slug)}
                      className="w-full text-left px-4 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Tout — {cat.name}
                    </button>
                    {subs.map((sub: any) => (
                      <button
                        key={sub.id}
                        onClick={() => handleSelectCategory(cat.slug, sub.slug)}
                        className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-colors ${filterParams.subcategory === sub.slug ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}