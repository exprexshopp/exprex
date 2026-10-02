// Design: Afrique Moderne — drawer latéral avec catégories et sous-catégories

import React, { useEffect, useState } from 'react';
import { X, ChevronRight, Grid3X3 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { db } from '../services/db';

type Category = {
  id: string | number;
  name: string;
  slug: string;
};

type Subcategory = {
  id: string | number;
  name: string;
  slug: string;
};

export function CategoryDrawer() {
  const {
    isCategoryDrawerOpen,
    setIsCategoryDrawerOpen,
    filterParams,
    handleFilterChange,
    dataVersion,
  } = useApp();

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<
    Record<string, Subcategory[]>
  >({});
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSubcategory, setLoadingSubcategory] = useState<string | null>(
    null
  );

  /**
   * Chargement des catégories
   */
  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      setLoading(true);

      try {
        const data = await db.getCategories();

        if (!cancelled) {
          const normalized = Array.isArray(data)
            ? data.filter(
                (cat: any) =>
                  cat &&
                  cat.id != null &&
                  cat.slug &&
                  cat.name
              )
            : [];

          setCategories(normalized);
        }
      } catch (error) {
        console.error('Erreur chargement catégories:', error);

        if (!cancelled) {
          setCategories([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, [dataVersion]);

  /**
   * Réinitialiser le cache des sous-catégories
   * lorsqu'une nouvelle version des données est disponible.
   */
  useEffect(() => {
    setSubcategories({});
  }, [dataVersion]);

  /**
   * Si une catégorie est actuellement sélectionnée,
   * on peut automatiquement l'ouvrir lorsque le drawer s'ouvre.
   */
  useEffect(() => {
    if (!isCategoryDrawerOpen) return;

    if (!filterParams.category) {
      setExpandedCat(null);
      return;
    }

    const selectedCategory = categories.find(
      (cat) => cat.slug === filterParams.category
    );

    if (selectedCategory) {
      setExpandedCat(String(selectedCategory.id));
    }
  }, [
    isCategoryDrawerOpen,
    filterParams.category,
    categories,
  ]);

  /**
   * Chargement des sous-catégories de la catégorie ouverte.
   */
  useEffect(() => {
    let cancelled = false;

    const loadSubcategories = async () => {
      if (!expandedCat) return;

      // Déjà chargées
      if (Object.prototype.hasOwnProperty.call(subcategories, expandedCat)) {
        return;
      }

      setLoadingSubcategory(expandedCat);

      try {
        const category = categories.find(
          (cat) => String(cat.id) === expandedCat
        );

        if (!category) {
          if (!cancelled) {
            setSubcategories((prev) => ({
              ...prev,
              [expandedCat]: [],
            }));
          }
          return;
        }

        const data = await db.getSubcategories(category.id);

        if (!cancelled) {
          setSubcategories((prev) => ({
            ...prev,
            [expandedCat]: Array.isArray(data) ? data : [],
          }));
        }
      } catch (error) {
        console.error(
          'Erreur chargement sous-catégories:',
          error
        );

        if (!cancelled) {
          setSubcategories((prev) => ({
            ...prev,
            [expandedCat]: [],
          }));
        }
      } finally {
        if (!cancelled) {
          setLoadingSubcategory(null);
        }
      }
    };

    loadSubcategories();

    return () => {
      cancelled = true;
    };
  }, [expandedCat, categories, subcategories]);

  /**
   * Sélection d'une catégorie / sous-catégorie.
   */
  const handleSelectCategory = (
    catSlug: string,
    subSlug?: string
  ) => {
    handleFilterChange({
      category: catSlug,
      subcategory: subSlug || '',
    });

    setIsCategoryDrawerOpen(false);
  };

  /**
   * Réinitialisation complète du filtre catégorie.
   */
  const handleSelectAll = () => {
    handleFilterChange({
      category: '',
      subcategory: '',
    });

    setExpandedCat(null);
    setIsCategoryDrawerOpen(false);
  };

  /**
   * Ouvre / ferme une catégorie.
   */
  const toggleExpand = (categoryId: string | number) => {
    const id = String(categoryId);

    setExpandedCat((current) =>
      current === id ? null : id
    );
  };

  /**
   * Ferme le drawer.
   */
  const closeDrawer = () => {
    setIsCategoryDrawerOpen(false);
  };

  if (!isCategoryDrawerOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div className="relative ml-auto w-80 max-w-full h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Catégories
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Filtrer les produits
            </p>
          </div>

          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Fermer les catégories"
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Chargement des catégories...
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {/* Toutes les catégories */}
            <button
              type="button"
              onClick={handleSelectAll}
              className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                !filterParams.category
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Grid3X3 className="w-4 h-4 shrink-0" />

              <span>Toutes les catégories</span>
            </button>

            {/* Aucun résultat */}
            {categories.length === 0 && (
              <div className="py-12 text-center">
                <Grid3X3 className="w-8 h-8 text-slate-300 mx-auto mb-3" />

                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Aucune catégorie
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Les catégories seront disponibles prochainement.
                </p>
              </div>
            )}

            {/* Catégories */}
            {categories.map((cat) => {
              const categoryId = String(cat.id);
              const subs = subcategories[categoryId] || [];

              const isExpanded =
                expandedCat === categoryId;

              const isActive =
                filterParams.category === cat.slug;

              const isSubcategoryActive =
                isActive && Boolean(filterParams.subcategory);

              const isLoadingSubcategory =
                loadingSubcategory === categoryId;

              return (
                <div key={cat.id}>
                  {/* Catégorie */}
                  <button
                    type="button"
                    onClick={() => {
                      /*
                       * Si les sous-catégories sont déjà chargées,
                       * on sait immédiatement s'il faut ouvrir ou sélectionner.
                       */
                      if (
                        Object.prototype.hasOwnProperty.call(
                          subcategories,
                          categoryId
                        )
                      ) {
                        if (subs.length > 0) {
                          toggleExpand(categoryId);
                        } else {
                          handleSelectCategory(cat.slug);
                        }

                        return;
                      }

                      /*
                       * Première ouverture :
                       * on ouvre d'abord pour déclencher le chargement.
                       */
                      toggleExpand(categoryId);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-between ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">
                      {cat.name}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSubcategoryActive && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      )}

                      {isLoadingSubcategory ? (
                        <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        /*
                         * Si les sous-catégories sont connues et qu'il
                         * n'y en a aucune, on n'affiche pas la flèche.
                         */
                        (subs.length > 0 ||
                          !Object.prototype.hasOwnProperty.call(
                            subcategories,
                            categoryId
                          )) && (
                          <ChevronRight
                            className={`w-4 h-4 transition-transform ${
                              isExpanded
                                ? 'rotate-90'
                                : ''
                            }`}
                          />
                        )
                      )}
                    </div>
                  </button>

                  {/* Sous-catégories */}
                  {isExpanded && (
                    <div className="ml-4 mt-1 mb-1 space-y-0.5 border-l border-slate-200 dark:border-slate-700 pl-2">
                      {isLoadingSubcategory && subs.length === 0 ? (
                        <div className="px-4 py-3 text-xs text-slate-400">
                          Chargement...
                        </div>
                      ) : subs.length > 0 ? (
                        <>
                          {/* Tous les produits de la catégorie */}
                          <button
                            type="button"
                            onClick={() =>
                              handleSelectCategory(cat.slug)
                            }
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors ${
                              isActive &&
                              !filterParams.subcategory
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-medium'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            Tout — {cat.name}
                          </button>

                          {/* Sous-catégories */}
                          {subs.map((sub) => {
                            const isSubActive =
                              filterParams.category ===
                                cat.slug &&
                              filterParams.subcategory ===
                                sub.slug;

                            return (
                              <button
                                type="button"
                                key={sub.id}
                                onClick={() =>
                                  handleSelectCategory(
                                    cat.slug,
                                    sub.slug
                                  )
                                }
                                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors ${
                                  isSubActive
                                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-medium'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                              >
                                {sub.name}
                              </button>
                            );
                          })}
                        </>
                      ) : (
                        /*
                         * Une catégorie sans sous-catégorie
                         * reste sélectionnable.
                         */
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectCategory(cat.slug)
                          }
                          className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors ${
                            isActive
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-medium'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          Tous les produits
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
