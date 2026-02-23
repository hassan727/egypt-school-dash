// =============================================
// USE NOTIFICATIONS HOOK
// React Hook for Notification Management
// =============================================

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Notification, NotificationFilter } from '@/types/notification';
import { getNotifications, markAsRead } from '@/services/notificationService';

export function useNotifications(filter: NotificationFilter = {}) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchNotifications();

        // Subscribe to real-time updates
        const subscription = supabase
            .channel('notifications_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                },
                () => {
                    fetchNotifications();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [JSON.stringify(filter)]);

    async function fetchNotifications() {
        try {
            setLoading(true);
            const data = await getNotifications(filter);
            setNotifications(data);
            setError(null);
        } catch (err) {
            setError('فشل تحميل الإشعارات');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleMarkAsRead(notificationId: string, studentId: string) {
        const success = await markAsRead(notificationId, studentId);
        if (success) {
            await fetchNotifications();
        }
        return success;
    }

    return {
        notifications,
        loading,
        error,
        refetch: fetchNotifications,
        markAsRead: handleMarkAsRead,
    };
}

/**
 * Hook for notification types
 */
export function useNotificationTypes() {
    const [types, setTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTypes() {
            const { data } = await supabase
                .from('notification_types')
                .select('*')
                .eq('is_active', true)
                .order('type_name_ar');
            setTypes(data || []);
            setLoading(false);
        }
        fetchTypes();
    }, []);

    return { types, loading };
}

/**
 * Hook for notification channels
 */
export function useNotificationChannels() {
    const [channels, setChannels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchChannels() {
            const { data } = await supabase
                .from('notification_channels')
                .select('*')
                .eq('is_active', true)
                .order('channel_name_ar');
            setChannels(data || []);
            setLoading(false);
        }
        fetchChannels();
    }, []);

    return { channels, loading };
}

/**
 * Hook for notification templates
 */
export function useNotificationTemplates(typeId?: string) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTemplates() {
            let query = supabase
                .from('notification_templates')
                .select('*')
                .eq('is_active', true)
                .order('template_name_ar');

            if (typeId) {
                query = query.eq('notification_type_id', typeId);
            }

            const { data } = await query;
            setTemplates(data || []);
            setLoading(false);
        }
        fetchTemplates();
    }, [typeId]);

    return { templates, loading };
}
