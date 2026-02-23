import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getDayConfig, CalendarOverride } from '@/utils/attendanceUtils';

export type { CalendarOverride };

export const useCalendarSettings = () => {
    const queryClient = useQueryClient();
    const [overrides, setOverrides] = useState<CalendarOverride[]>([]);
    const [loading, setLoading] = useState(false);

    // 1. Fetch Overrides for a specific month range
    const fetchOverrides = async (start: string, end: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('hr_calendar_overrides')
                .select('*')
                .gte('date', start)
                .lte('date', end);

            if (error) throw error;
            setOverrides(data as CalendarOverride[]);
            return data as CalendarOverride[];
        } catch (error) {
            console.error(error);
            toast.error('فشل في تحميل التقويم');
            return [];
        } finally {
            setLoading(false);
        }
    };

    // 2. Save (Upsert) an Override
    const saveOverrideMutation = useMutation({
        mutationFn: async (override: Partial<CalendarOverride>) => {
            const { data, error } = await supabase
                .from('hr_calendar_overrides')
                .upsert({
                    ...override,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar_overrides'] });
            // Optionally refresh local state if needed, but fetchOverrides handles view
        },
        onError: (err) => {
            console.error(err);
            toast.error('حدث خطأ أثناء حفظ الإعدادات');
        }
    });

    // 3. Delete an Override
    const deleteOverrideMutation = useMutation({
        mutationFn: async (date: string) => {
            const { error } = await supabase
                .from('hr_calendar_overrides')
                .delete()
                .eq('date', date);

            if (error) throw error;
        },
        onSuccess: (_, date) => {
            queryClient.invalidateQueries({ queryKey: ['calendar_overrides'] });
            toast.success('تم حذف الإعدادات بنجاح');
            // Optimistic update or re-fetch would be ideal here
            setOverrides(prev => prev.filter(o => o.date !== date));
        },
        onError: (err) => {
            console.error(err);
            toast.error('حدث خطأ أثناء الحذف');
        }
    });

    return {
        overrides, // Now checks out
        loading,
        fetchOverrides,
        saveOverride: saveOverrideMutation.mutateAsync,
        deleteOverride: deleteOverrideMutation.mutateAsync,
        getDayConfig
    };
};
