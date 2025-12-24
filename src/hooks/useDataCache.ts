import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
}

interface CacheStats {
    hits: number;
    misses: number;
    size: number;
}

const CACHE_STORAGE_KEY = 'school-dash-cache';

export function useDataCache<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    options: {
        ttl?: number; // Default: 5 minutes
        storage?: 'memory' | 'localStorage' | 'both';
        refreshInterval?: number;
    } = {}
) {
    const {
        ttl = 5 * 60 * 1000,
        storage = 'memory',
        refreshInterval,
    } = options;

    const memoryCache = useRef<Map<string, CacheEntry<T>>>(new Map());
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [cacheStats, setCacheStats] = useState<CacheStats>({ hits: 0, misses: 0, size: 0 });

    const getCachedData = useCallback((): T | null => {
        // محاولة الحصول من الذاكرة
        if (storage === 'memory' || storage === 'both') {
            const cached = memoryCache.current.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < cached.ttl) {
                setCacheStats(prev => ({ ...prev, hits: prev.hits + 1 }));
                return cached.data;
            }
        }

        // محاولة الحصول من localStorage
        if (storage === 'localStorage' || storage === 'both') {
            try {
                const cached = localStorage.getItem(`${CACHE_STORAGE_KEY}-${cacheKey}`);
                if (cached) {
                    const entry: CacheEntry<T> = JSON.parse(cached);
                    if (Date.now() - entry.timestamp < entry.ttl) {
                        setCacheStats(prev => ({ ...prev, hits: prev.hits + 1 }));
                        return entry.data;
                    }
                }
            } catch (err) {
                console.error('خطأ في قراءة الكاش من localStorage:', err);
            }
        }

        setCacheStats(prev => ({ ...prev, misses: prev.misses + 1 }));
        return null;
    }, [cacheKey, storage]);

    const setCachedData = useCallback((value: T) => {
        const entry: CacheEntry<T> = {
            data: value,
            timestamp: Date.now(),
            ttl,
        };

        // حفظ في الذاكرة
        if (storage === 'memory' || storage === 'both') {
            memoryCache.current.set(cacheKey, entry);
        }

        // حفظ في localStorage
        if (storage === 'localStorage' || storage === 'both') {
            try {
                localStorage.setItem(
                    `${CACHE_STORAGE_KEY}-${cacheKey}`,
                    JSON.stringify(entry)
                );
            } catch (err) {
                console.error('خطأ في كتابة الكاش إلى localStorage:', err);
            }
        }

        setCacheStats(prev => ({
            ...prev,
            size: memoryCache.current.size,
        }));
    }, [cacheKey, ttl, storage]);

    const invalidateCache = useCallback(() => {
        // حذف من الذاكرة
        memoryCache.current.delete(cacheKey);

        // حذف من localStorage
        try {
            localStorage.removeItem(`${CACHE_STORAGE_KEY}-${cacheKey}`);
        } catch (err) {
            console.error('خطأ في حذف الكاش:', err);
        }
    }, [cacheKey]);

    const refreshData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            invalidateCache();

            const newData = await fetchFn();
            setCachedData(newData);
            setData(newData);

            return newData;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('خطأ في تحميل البيانات');
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchFn, setCachedData, invalidateCache]);

    // جلب البيانات في البداية
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                // محاولة الحصول من الكاش
                const cachedData = getCachedData();
                if (cachedData) {
                    setData(cachedData);
                    setLoading(false);
                    return;
                }

                // جلب من الخادم
                const newData = await fetchFn();
                setCachedData(newData);
                setData(newData);
                setError(null);
            } catch (err) {
                const error = err instanceof Error ? err : new Error('خطأ في تحميل البيانات');
                setError(error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [cacheKey, fetchFn, getCachedData, setCachedData]);

    // تحديث دوري
    useEffect(() => {
        if (!refreshInterval) return;

        const interval = setInterval(() => {
            refreshData();
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [refreshInterval, refreshData]);

    const clearAllCache = useCallback(() => {
        memoryCache.current.clear();
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(CACHE_STORAGE_KEY)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (err) {
            console.error('خطأ في مسح جميع الكاش:', err);
        }
        setCacheStats({ hits: 0, misses: 0, size: 0 });
    }, []);

    const getCacheHitRate = useCallback(() => {
        const total = cacheStats.hits + cacheStats.misses;
        return total > 0 ? (cacheStats.hits / total) * 100 : 0;
    }, [cacheStats]);

    return {
        data,
        loading,
        error,
        cacheStats,
        refreshData,
        invalidateCache,
        clearAllCache,
        getCacheHitRate,
    };
}

// سياق عام للكاش
export class CacheManager {
    private static cache = new Map<string, CacheEntry<any>>();

    static set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
        });

        try {
            localStorage.setItem(
                `${CACHE_STORAGE_KEY}-${key}`,
                JSON.stringify({ data, timestamp: Date.now(), ttl })
            );
        } catch (err) {
            console.error('خطأ في حفظ البيانات في الكاش:', err);
        }
    }

    static get<T>(key: string): T | null {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
            return cached.data;
        }

        try {
            const stored = localStorage.getItem(`${CACHE_STORAGE_KEY}-${key}`);
            if (stored) {
                const entry: CacheEntry<T> = JSON.parse(stored);
                if (Date.now() - entry.timestamp < entry.ttl) {
                    this.cache.set(key, entry);
                    return entry.data;
                }
            }
        } catch (err) {
            console.error('خطأ في قراءة الكاش:', err);
        }

        return null;
    }

    static invalidate(key: string) {
        this.cache.delete(key);
        try {
            localStorage.removeItem(`${CACHE_STORAGE_KEY}-${key}`);
        } catch (err) {
            console.error('خطأ في حذف الكاش:', err);
        }
    }

    static clear() {
        this.cache.clear();
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(CACHE_STORAGE_KEY)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (err) {
            console.error('خطأ في مسح الكاش:', err);
        }
    }

    static getSize(): number {
        return this.cache.size;
    }
}