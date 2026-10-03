// Design: palette de catégories avec icônes + sous-catégories en dessous
import React, { useEffect, useMemo, useState } from 'react';
import {
  X, Smartphone, Shirt, Home, Gamepad2, Car, Sparkles,
  UtensilsCrossed, Heart, BookOpen, Dumbbell, Baby, Briefcase,
  Grid3X3, ChevronRight,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { db } from '../services/db';

type Category = { id: string | number; name: string; slug: string };
type Subcategory = { id: string | number; name: string; slug: string };

// Associe un slug/nom à une icône + couleur
const ICONS: Record<string, { Icon: any; color: string }> = {
  telephone:  { Icon: Smartphone,      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' },
  phone:      { Icon: Smartphone,      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' },
  mode:       { Icon: Shirt,           color: 'text-pink-600   bg-pink-50   dark:bg-pink-900/30'   },
  vetement:   { Icon: Shirt,           color: 'text-pink-600   bg-pink-50   dark:bg-pink-900/30'   },
  maison:     { Icon: Home,            color: 'text-amber-600  bg-amber-50  dark:bg-amber-900/30'  },
  gaming:     { Icon: Gamepad2,        color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30' },
  auto:       { Icon: Car,             color: 'text-slate-600  bg-slate-50  dark:bg-slate-900/30'  },
  beaute:     { Icon: Sparkles,        color: 'text-rose-600   bg-rose-50   dark:bg-rose-900/30'   },
  food:       { Icon: UtensilsCrossed, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30' },
  sante:      { Icon: Heart,           color: 'text-red-600    bg-red-50    dark:bg-red-900/30'    },
  livre:      { Icon: BookOpen,        color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
  sport:      { Icon: Dumbbell,        color: 'text-cyan-600   bg-cyan-50   dark:bg-cyan-900/30'   },
  bebe:       { Icon: Baby,            color: 'text-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-900/30' },
  service:    { Icon: Briefcase,       color: 'text-blue-600   bg-blue-50   dark:bg-blue-900/30'   },
};

function pickIcon(cat: Category) {
  const key = (cat.slug || cat.name || '').toLowerCase();
  for (const k of Object.keys(ICONS)) {
    if (key.includes(k)) return ICONS[k];
  }
  return { Icon: Grid3X3, color: 'text-slate-600 bg-slate-50 dark:bg-slate-800' };
}

export function CategoryDrawer() {
  const {
    isCategoryDrawerOpen, setIsCategoryDrawerOpen,
    filterParams, handleFilterChange, dataVersion,
  } = useApp();

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Record<string, Subcategory[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingSub, setLoadingSub] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState<Category | null>(null);

  // Chargement des catégories
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    db.getCategories()
      .then((data) => {
        if (cancelled) return;
        setCategories(Array.isArray(data)
          ? data.filter((c: any) => c && c.id != null && c.slug && c.name)
          : []);
      })
      .catch(() => !cancelled && setCategories([]))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [dataVersion]);

  // Ouverture auto si une catégorie est déjà sélectionnée
  useEffect(() => {
    if (!isCategoryDrawerOpen) return;
    if (!filterParams.category) { setActiveCat(null); return; }
    const found = categories.find(c => c.slug === filterParams.category);
    if (found) setActiveCat(found);
  }, [isCategoryDrawerOpen, filterParams.category, categories]);

  // Chargement des sous-catégories quand une catégorie est active
  useEffect(() => {
  if (!activeCat) return;
  const id = String(activeCat.id);
  const existing = subcategories[id];
  // ✅ Ne skip QUE si on a déjà des sous-catégories non vides
  if (existing && existing.length > 0) return;

  setLoadingSub(id);
  db.getSubcategories(activeCat.id)
    .then(data => setSubcategories(prev => ({
      ...prev,
      [id]: Array.isArray(data) ? data : [],
    })))
    .catch(() => setSubcategories(prev => ({ ...prev, [id]: [] })))
    .finally(() => setLoadingSub(null));
}, [activeCat]);   // ← retire subcategories des deps pour éviter les boucles
  
  const activeSubs = useMemo(() => {
    if (!activeCat) return [];
    return subcategories[String(activeCat.id)] || [];
  }, [activeCat, subcategories]);

  const selectCategory = (cat: Category, subSlug?: string) => {
    handleFilterChange({ category: cat.slug, subcategory: subSlug || '' });
    setIsCategoryDrawerOpen(false);
  };

  if (!isCategoryDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCategoryDrawerOpen(false)} />

      <div className="relative ml-auto w-full sm:w-[420px] h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Catégories</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Trouvez rapidement ce que vous recherchez
            </p>
          </div>
          <button onClick={() => setIsCategoryDrawerOpen(false)} aria-label="Fermer"
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Corps scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
              <p className="text-sm text-slate-500">Chargement...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="py-16 text-center">
              <Grid3X3 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Aucune catégorie</p>
            </div>
          ) : (
            <>
              {/* Bouton "Toutes" */}
              <button
                onClick={() => { handleFilterChange({ category: '', subcategory: '' }); setIsCategoryDrawerOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  !filterParams.category
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                Toutes les catégories
              </button>

              {/* PALETTE */}
              <div className="grid grid-cols-2 gap-3">
                {categories.map(cat => {
                  const { Icon, color } = pickIcon(cat);
                  const isActive = filterParams.category === cat.slug;
                  const isOpen   = activeCat?.id === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        if (isActive || isOpen) {
                          setActiveCat(isOpen ? null : cat);
                          if (!isOpen) return;
                        } else {
                          setActiveCat(cat);
                        }
                      }}
                      className={`flex flex-col items-start gap-2 p-3 rounded-2xl border text-left transition-all ${
                        isActive || isOpen
                          ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                      }`}
                    >
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* SOUS-CATÉGORIES DE LA CATÉGORIE ACTIVE */}
              {activeCat && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {activeCat.name}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>

                  {loadingSub === String(activeCat.id) ? (
                    <div className="py-4 text-center text-xs text-slate-400">Chargement...</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => selectCategory(activeCat)}
                        className={`px-3 py-2 text-sm rounded-xl border transition-colors ${
                          filterParams.category === activeCat.slug && !filterParams.subcategory
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                        }`}
                      >
                        Toutes
                      </button>

                      {activeSubs.map(sub => {
                        const isSub = filterParams.category === activeCat.slug
                                   && filterParams.subcategory === sub.slug;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => selectCategory(activeCat, sub.slug)}
                            className={`px-3 py-2 text-sm rounded-xl border transition-colors ${
                              isSub
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                            }`}
                          >
                            {sub.name}
                          </button>
                        );
                      })}

                      {activeSubs.length === 0 && (
                        <p className="text-xs text-slate-400 italic">
                          Aucune sous-catégorie
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}