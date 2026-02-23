// =============================================
// NOTIFICATION SERVICE - Core Business Logic
// خدمة الإشعارات - المنطق الأساسي
// =============================================

import { supabase } from '@/lib/supabase';
import type {
    Notification,
    CreateNotificationRequest,
    NotificationFilter,
    NotificationStats,
    NotificationDelivery,
    SendMode,
    NotificationStatus,
    DeliveryStatus,
} from '@/types/notification';

// =============================================
// Core Notification Functions
// =============================================

/**
 * Create a single notification
 */
export async function createNotification(data: CreateNotificationRequest): Promise<Notification | null> {
    try {
        const { error, data: notification } = await supabase
            .from('notifications')
            .insert({
                notification_type_id: data.notification_type_id,
                recipient_type_id: data.recipient_type_id,
                title: data.title,
                content: data.content,
                link_url: data.link_url,
                attachments: data.attachments,
                student_id: data.student_id,
                academic_year_id: data.academic_year_id,
                class_id: data.class_id,
                stage_id: data.stage_id,
                send_mode: data.send_mode || 'manual',
                priority: data.priority || 'normal',
                scheduled_at: data.scheduled_at,
                related_entity_type: data.related_entity_type,
                related_entity_id: data.related_entity_id,
                metadata: data.metadata,
                status: data.scheduled_at ? 'scheduled' : 'draft',
                created_by: 'System', // TODO: Get from auth context
            })
            .select()
            .single();

        if (error) throw error;

        // Log creation
        await logNotificationAction(notification.id, 'created', 'Notification created');

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
}

/**
 * Create bulk notifications for multiple students
 */
export async function createBulkNotifications(
    data: CreateNotificationRequest
): Promise<{ success: number; failed: number }> {
    const { student_ids = [], channel_ids = [] } = data;
    let success = 0;
    let failed = 0;

    try {
        // Create one notification record
        const notification = await createNotification({
            ...data,
            send_mode: 'bulk',
            student_id: undefined, // Bulk doesn't have single student_id
        });

        if (!notification) {
            return { success: 0, failed: student_ids.length };
        }

        // Create delivery records for each student and channel
        for (const studentId of student_ids) {
            for (const channelId of channel_ids) {
                const { error } = await supabase.from('notification_delivery').insert({
                    notification_id: notification.id,
                    student_id: studentId,
                    channel_id: channelId,
                    delivery_status: 'pending',
                });

                if (error) {
                    console.error(`Failed to create delivery record for student ${studentId}:`, error);
                    failed++;
                } else {
                    success++;
                }
            }
        }

        // Update notification status
        await supabase
            .from('notifications')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', notification.id);

        return { success, failed };
    } catch (error) {
        console.error('Error creating bulk notifications:', error);
        return { success, failed: student_ids.length };
    }
}

/**
 * Send notification via specified channels
 */
export async function sendNotification(notificationId: string, channelIds: string[]): Promise<boolean> {
    try {
        // Get notification details
        const { data: notification, error: fetchError } = await supabase
            .from('notifications')
            .select('*, students(*)')
            .eq('id', notificationId)
            .single();

        if (fetchError || !notification) {
            throw new Error('Notification not found');
        }

        // Create delivery records
        for (const channelId of channelIds) {
            const { error } = await supabase.from('notification_delivery').insert({
                notification_id: notificationId,
                student_id: notification.student_id,
                channel_id: channelId,
                delivery_status: 'pending',
            });

            if (error) {
                console.error(`Failed to create delivery record for channel ${channelId}:`, error);
            }
        }

        // Update notification status
        await supabase
            .from('notifications')
            .update({
                status: 'sent',
                sent_at: new Date().toISOString(),
            })
            .eq('id', notificationId);

        // Log action
        await logNotificationAction(notificationId, 'sent', `Sent via ${channelIds.length} channels`);

        return true;
    } catch (error) {
        console.error('Error sending notification:', error);
        return false;
    }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string, studentId: string): Promise<boolean> {
    try {
        // Update notification status directly
        const { error } = await supabase
            .from('notifications')
            .update({
                status: 'read',
            })
            .eq('id', notificationId)
            .eq('student_id', studentId);

        if (error) throw error;

        // Also try to update delivery record if exists (for bulk notifications)
        await supabase
            .from('notification_delivery')
            .update({
                delivery_status: 'read',
                read_at: new Date().toISOString(),
            })
            .eq('notification_id', notificationId)
            .eq('student_id', studentId);

        // Log action
        await logNotificationAction(notificationId, 'read', `Read by student ${studentId}`);

        return true;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return false;
    }
}

/**
 * Get notifications with filters
 */
export async function getNotifications(filter: NotificationFilter = {}): Promise<Notification[]> {
    try {
        let query = supabase
            .from('notifications')
            .select(`
        *,
        notification_type:notification_types(*),
        students(full_name_ar, guardian_full_name, guardian_phone, guardian_email)
      `)
            .order('created_at', { ascending: false });

        // Apply filters
        if (filter.notification_type_id) {
            query = query.eq('notification_type_id', filter.notification_type_id);
        }
        if (filter.student_id) {
            query = query.eq('student_id', filter.student_id);
        }
        if (filter.class_id) {
            query = query.eq('class_id', filter.class_id);
        }
        if (filter.stage_id) {
            query = query.eq('stage_id', filter.stage_id);
        }
        if (filter.academic_year_id) {
            query = query.eq('academic_year_id', filter.academic_year_id);
        }
        if (filter.status) {
            query = query.eq('status', filter.status);
        }
        if (filter.priority) {
            query = query.eq('priority', filter.priority);
        }
        if (filter.send_mode) {
            query = query.eq('send_mode', filter.send_mode);
        }
        if (filter.date_from) {
            query = query.gte('created_at', filter.date_from);
        }
        if (filter.date_to) {
            query = query.lte('created_at', filter.date_to);
        }
        if (filter.search_query) {
            query = query.or(`title.ilike.%${filter.search_query}%,content.ilike.%${filter.search_query}%`);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
}

/**
 * Get notification statistics
 */
export async function getNotificationStats(): Promise<NotificationStats> {
    try {
        // Get total counts
        const { count: totalSent } = await supabase
            .from('notification_delivery')
            .select('*', { count: 'exact', head: true })
            .eq('delivery_status', 'sent');

        const { count: totalDelivered } = await supabase
            .from('notification_delivery')
            .select('*', { count: 'exact', head: true })
            .eq('delivery_status', 'delivered');

        const { count: totalRead } = await supabase
            .from('notification_delivery')
            .select('*', { count: 'exact', head: true })
            .eq('delivery_status', 'read');

        const { count: totalFailed } = await supabase
            .from('notification_delivery')
            .select('*', { count: 'exact', head: true })
            .eq('delivery_status', 'failed');

        // Calculate rates
        const deliveryRate = totalSent ? (totalDelivered || 0) / totalSent : 0;
        const readRate = totalDelivered ? (totalRead || 0) / totalDelivered : 0;

        // Get by type
        const { data: byTypeData } = await supabase
            .from('notifications')
            .select('notification_type_id, notification_types(type_name_ar)')
            .not('notification_type_id', 'is', null);

        const byType: Record<string, number> = {};
        byTypeData?.forEach((item: any) => {
            const typeName = item.notification_types?.type_name_ar || 'Unknown';
            byType[typeName] = (byType[typeName] || 0) + 1;
        });

        // Get by channel
        const { data: byChannelData } = await supabase
            .from('notification_delivery')
            .select('channel_id, notification_channels(channel_name_ar)')
            .not('channel_id', 'is', null);

        const byChannel: Record<string, number> = {};
        byChannelData?.forEach((item: any) => {
            const channelName = item.notification_channels?.channel_name_ar || 'Unknown';
            byChannel[channelName] = (byChannel[channelName] || 0) + 1;
        });

        // Get recent notifications
        const recentNotifications = await getNotifications({});

        return {
            total_sent: totalSent || 0,
            total_delivered: totalDelivered || 0,
            total_read: totalRead || 0,
            total_failed: totalFailed || 0,
            delivery_rate: deliveryRate,
            read_rate: readRate,
            by_type: byType,
            by_channel: byChannel,
            recent_notifications: recentNotifications.slice(0, 10),
        };
    } catch (error) {
        console.error('Error fetching notification stats:', error);
        return {
            total_sent: 0,
            total_delivered: 0,
            total_read: 0,
            total_failed: 0,
            delivery_rate: 0,
            read_rate: 0,
            by_type: {},
            by_channel: {},
            recent_notifications: [],
        };
    }
}

/**
 * Log notification action
 */
async function logNotificationAction(
    notificationId: string,
    actionType: string,
    description?: string
): Promise<void> {
    try {
        await supabase.from('notification_logs').insert({
            notification_id: notificationId,
            action_type: actionType,
            action_description: description,
            performed_by: 'System', // TODO: Get from auth context
            details: {},
        });
    } catch (error) {
        console.error('Error logging notification action:', error);
    }
}

/**
 * Get notification templates
 */
export async function getNotificationTemplates(typeId?: string) {
    try {
        let query = supabase
            .from('notification_templates')
            .select('*')
            .eq('is_active', true)
            .order('template_name_ar');

        if (typeId) {
            query = query.eq('notification_type_id', typeId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching templates:', error);
        return [];
    }
}

/**
 * Apply template variables
 */
export function applyTemplateVariables(
    template: string,
    variables: Record<string, string>
): string {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return result;
}
