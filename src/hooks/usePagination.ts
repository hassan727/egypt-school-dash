import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface PaginationState {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

interface PaginationOptions {
    initialPage?: number;
    initialPageSize?: number;
    enabled?: boolean;
}

export function usePagination<T>(
    fetchFn: (offset: number, limit: number) => Promise<{ data: T[]; total: number }>,
    options: PaginationOptions = {}
) {
    const {
        initialPage = 1,
        initialPageSize = 20,
        enabled = true,
    } = options;

    const [items, setItems] = useState<T[]>([]);
    const [state, setState] = useState<PaginationState>({
        currentPage: initialPage,
        pageSize: initialPageSize,
        totalItems: 0,
        totalPages: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // حساب الـ offset
    const getOffset = useCallback((page: number, pageSize: number) => {
        return (page - 1) * pageSize;
    }, []);

    // جلب البيانات
    const fetchPage = useCallback(
        async (page: number) => {
            if (!enabled) return;

            try {
                setLoading(true);
                setError(null);

                const offset = getOffset(page, state.pageSize);
                const { data, total } = await fetchFn(offset, state.pageSize);

                setItems(data);
                setState(prev => ({
                    ...prev,
                    currentPage: page,
                    totalItems: total,
                    totalPages: Math.ceil(total / prev.pageSize),
                }));
            } catch (err) {
                const error = err instanceof Error ? err : new Error('خطأ في تحميل البيانات');
                setError(error);
                console.error('خطأ في جلب البيانات:', err);
            } finally {
                setLoading(false);
            }
        },
        [enabled, state.pageSize, getOffset, fetchFn]
    );

    // تحميل الصفحة الأولى عند البداية
    useEffect(() => {
        fetchPage(state.currentPage);
    }, []);

    // الذهاب للصفحة التالية
    const nextPage = useCallback(() => {
        if (state.currentPage < state.totalPages) {
            fetchPage(state.currentPage + 1);
        }
    }, [state.currentPage, state.totalPages, fetchPage]);

    // الذهاب للصفحة السابقة
    const prevPage = useCallback(() => {
        if (state.currentPage > 1) {
            fetchPage(state.currentPage - 1);
        }
    }, [state.currentPage, fetchPage]);

    // الذهاب لصفحة معينة
    const goToPage = useCallback(
        (page: number) => {
            const validPage = Math.max(1, Math.min(page, state.totalPages));
            fetchPage(validPage);
        },
        [state.totalPages, fetchPage]
    );

    // تغيير حجم الصفحة
    const setPageSize = useCallback(
        (newPageSize: number) => {
            setState(prev => ({
                ...prev,
                pageSize: newPageSize,
                totalPages: Math.ceil(prev.totalItems / newPageSize),
                currentPage: 1,
            }));
            fetchPage(1);
        },
        [fetchPage]
    );

    // الحصول على معلومات الصفحة الحالية
    const getPageInfo = useCallback(() => {
        const startItem = getOffset(state.currentPage, state.pageSize) + 1;
        const endItem = Math.min(
            startItem + state.pageSize - 1,
            state.totalItems
        );

        return {
            current: state.currentPage,
            total: state.totalPages,
            size: state.pageSize,
            startItem,
            endItem,
            totalItems: state.totalItems,
        };
    }, [state, getOffset]);

    // إعادة تحميل الصفحة الحالية
    const refresh = useCallback(() => {
        fetchPage(state.currentPage);
    }, [state.currentPage, fetchPage]);

    return {
        items,
        loading,
        error,
        ...state,
        nextPage,
        prevPage,
        goToPage,
        setPageSize,
        getPageInfo,
        refresh,
        hasNextPage: state.currentPage < state.totalPages,
        hasPrevPage: state.currentPage > 1,
    };
}

// hook لتحميل البيانات ديناميكياً (infinite scroll)
export function useInfiniteScroll<T>(
    fetchFn: (offset: number, limit: number) => Promise<{ data: T[]; total: number }>,
    pageSize: number = 20
) {
    const [items, setItems] = useState<T[]>([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [total, setTotal] = useState(0);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        try {
            setLoading(true);
            setError(null);

            const { data, total: newTotal } = await fetchFn(offset, pageSize);

            setItems(prev => [...prev, ...data]);
            setTotal(newTotal);
            setOffset(prev => prev + pageSize);
            setHasMore(offset + pageSize < newTotal);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('خطأ في تحميل البيانات');
            setError(error);
            console.error('خطأ في تحميل البيانات الإضافية:', err);
        } finally {
            setLoading(false);
        }
    }, [offset, pageSize, loading, hasMore, fetchFn]);

    const reset = useCallback(() => {
        setItems([]);
        setOffset(0);
        setHasMore(true);
        setError(null);
    }, []);

    return {
        items,
        loading,
        error,
        hasMore,
        total,
        loadMore,
        reset,
    };
}

// hook لتحميل البيانات مع فلترة وترتيب
export function usePaginatedSearch<T>(
    table: string,
    columns: string[] = ['*'],
    options: {
        initialPageSize?: number;
        filters?: Record<string, any>;
        orderBy?: { column: string; ascending?: boolean };
    } = {}
) {
    const { initialPageSize = 20, filters = {}, orderBy } = options;

    const fetchData = useCallback(
        async (offset: number, limit: number) => {
            let query = supabase
                .from(table)
                .select(columns.join(', '), { count: 'exact' });

            // تطبيق الفلاتر
            for (const [key, value] of Object.entries(filters)) {
                if (value !== undefined && value !== null) {
                    query = query.eq(key, value);
                }
            }

            // تطبيق الترتيب
            if (orderBy) {
                query = query.order(orderBy.column, {
                    ascending: orderBy.ascending ?? true,
                });
            }

            const { data, count, error } = await query.range(offset, offset + limit - 1);

            if (error) throw error;

            return {
                data: data || [],
                total: count || 0,
            };
        },
        [table, columns, filters, orderBy]
    );

    return usePagination(fetchData, {
        initialPageSize,
    });
}