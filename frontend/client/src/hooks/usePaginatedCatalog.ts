import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '../services/db';
import { catalogCacheGet, catalogCacheInvalidate, catalogCacheSet } from '../lib/catalogCache';
import { logger } from '../lib/logger';

export const CATALOG_PAGE_SIZE = 24;

export interface PaginatedCatalogResult {
  products: any[];
  total: number;
  filterSummary: string;
  has_more: boolean;
}

export function usePaginatedCatalog(filterParams: any, dataVersion: number) {
  const queryKey = JSON.stringify({ ...filterParams, dataVersion });
  const queryKeyRef = useRef(queryKey);
  if (queryKeyRef.current !== queryKey) {
    queryKeyRef.current = queryKey;
  }
  const currentAbortRef = useRef<AbortController | null>(null);
  const currentMoreAbortRef = useRef<AbortController | null>(null);
  const previousDataVersionRef = useRef(dataVersion);
  const pageRef = useRef(1);
  const pageOneReadyRef = useRef(false);
  const loadingRef = useRef(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<PaginatedCatalogResult>({
    products: [], total: 0, filterSummary: '', has_more: false,
  });

  const resetAndFetchPageOne = useCallback(async () => {
    currentAbortRef.current?.abort();
    currentMoreAbortRef.current?.abort();
    if (previousDataVersionRef.current !== dataVersion) {
      catalogCacheInvalidate();
      previousDataVersionRef.current = dataVersion;
    }
    const controller = new AbortController();
    currentAbortRef.current = controller;
    queryKeyRef.current = queryKey;

    pageRef.current = 1;
    pageOneReadyRef.current = false;
    loadingRef.current = false;
    setLoadingInitial(true);
    setLoadingMore(false);
    setError(null);
    setState({ products: [], total: 0, filterSummary: '', has_more: false });

    const cacheKey = `${queryKey}:1:${CATALOG_PAGE_SIZE}`;
    const cached = catalogCacheGet(cacheKey);
    if (cached) {
      setState(cached);
      pageRef.current = 1;
      pageOneReadyRef.current = true;
      setLoadingInitial(false);
    }

    try {
      const result = await db.getCatalogProducts(
        filterParams,
        1,
        CATALOG_PAGE_SIZE,
        controller.signal
      );
      if (queryKeyRef.current !== queryKey) return;
      catalogCacheSet(cacheKey, result);
      pageOneReadyRef.current = true;
      setState(result);
      setError(null);
    } catch (caught) {
      if (controller.signal.aborted || queryKeyRef.current !== queryKey) return;
      logger.error('Erreur chargement catalogue', caught);
      setError('Échec du chargement. Réessayez.');
    } finally {
      if (queryKeyRef.current === queryKey) setLoadingInitial(false);
    }
  }, [queryKey, filterParams]);

  useEffect(() => {
    void resetAndFetchPageOne();
    return () => currentAbortRef.current?.abort();
  }, [resetAndFetchPageOne]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || loadingInitial || !pageOneReadyRef.current || error || !state.has_more) return;

    loadingRef.current = true;
    setLoadingMore(true);
    setError(null);
    const keyAtStart = queryKey;
    const controller = new AbortController();
    currentMoreAbortRef.current = controller;
    const page = pageRef.current + 1;

    try {
      const cacheKey = `${keyAtStart}:${page}:${CATALOG_PAGE_SIZE}`;
      const cached = catalogCacheGet(cacheKey);
      if (cached && queryKeyRef.current === keyAtStart) {
        setState((prev) => {
          const seen = new Set(prev.products.map((product: any) => product.id));
          return {
            ...cached,
            products: [...prev.products, ...cached.products.filter((product: any) => !seen.has(product.id))],
          };
        });
        pageRef.current = page;
      } else {
        const result = await db.getCatalogProducts(
          filterParams,
          page,
          CATALOG_PAGE_SIZE,
          controller.signal
        );
        if (queryKeyRef.current !== keyAtStart) return;
        catalogCacheSet(cacheKey, result);
        setState((prev) => {
          const seen = new Set(prev.products.map((product: any) => product.id));
          return {
            ...result,
            products: [...prev.products, ...result.products.filter((product: any) => !seen.has(product.id))],
          };
        });
        pageRef.current = page;
      }
    } catch (caught) {
      if (controller.signal.aborted || queryKeyRef.current !== keyAtStart) return;
      logger.error('Erreur chargement des produits suivants', caught);
      setState((prev) => ({ ...prev, has_more: false }));
      setError('Échec du chargement. Réessayez.');
    } finally {
      if (queryKeyRef.current === keyAtStart) {
        loadingRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [filterParams, loadingInitial, error, state.has_more, queryKey]);

  const retry = useCallback(async () => {
    if (loadingRef.current || queryKeyRef.current !== queryKey) return;

    if (state.products.length === 0) {
      await resetAndFetchPageOne();
      return;
    }

    loadingRef.current = true;
    setLoadingMore(true);
    setError(null);
    setState((prev) => ({ ...prev, has_more: true }));

    const keyAtStart = queryKey;
    const controller = new AbortController();
    currentMoreAbortRef.current = controller;
    const page = pageRef.current + 1;

    try {
      const cacheKey = `${keyAtStart}:${page}:${CATALOG_PAGE_SIZE}`;
      const result = await db.getCatalogProducts(
        filterParams,
        page,
        CATALOG_PAGE_SIZE,
        controller.signal
      );
      if (queryKeyRef.current !== keyAtStart) return;
      catalogCacheSet(cacheKey, result);
      setState((prev) => {
        const seen = new Set(prev.products.map((product: any) => product.id));
        return {
          ...result,
          products: [...prev.products, ...result.products.filter((product: any) => !seen.has(product.id))],
        };
      });
      pageRef.current = page;
    } catch (caught) {
      if (controller.signal.aborted || queryKeyRef.current !== keyAtStart) return;
      logger.error('Erreur nouvelle tentative catalogue', caught);
      setState((prev) => ({ ...prev, has_more: false }));
      setError('Échec du chargement. Réessayez.');
    } finally {
      if (queryKeyRef.current === keyAtStart) {
        loadingRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [filterParams, queryKey, resetAndFetchPageOne, state.products.length]);

  return {
    ...state,
    loadingInitial,
    loadingMore,
    error,
    loadMore,
    retry,
  };
}
