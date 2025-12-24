import { useEffect, useState, useCallback } from 'react';

interface SyncMessage {
    type: 'data-update' | 'data-delete' | 'refresh' | 'notification';
    studentId?: string;
    dataType?: string;
    timestamp: number;
    source: string;
    data?: any;
}

interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
    read: boolean;
}

const STORAGE_KEY = 'school-dash-sync';
const NOTIFICATIONS_KEY = 'school-dash-notifications';
const TAB_ID = Math.random().toString(36).substr(2, 9);

export function useCrossTabSync() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [lastUpdate, setLastUpdate] = useState<SyncMessage | null>(null);
    const [isLeader, setIsLeader] = useState(false);

    // تسجيل علامة تبويب جديدة
    useEffect(() => {
        const registerTab = () => {
            const existingTabs = JSON.parse(localStorage.getItem(`${STORAGE_KEY}-tabs`) || '[]');
            if (!existingTabs.includes(TAB_ID)) {
                existingTabs.push(TAB_ID);
                localStorage.setItem(`${STORAGE_KEY}-tabs`, JSON.stringify(existingTabs));
            }

            // تحديد علامة التبويب الرئيسية
            const leader = existingTabs[0];
            setIsLeader(leader === TAB_ID);
        };

        registerTab();

        // تنظيف عند إغلاق التبويب
        const handleBeforeUnload = () => {
            const existingTabs = JSON.parse(localStorage.getItem(`${STORAGE_KEY}-tabs`) || '[]');
            const updatedTabs = existingTabs.filter((id: string) => id !== TAB_ID);
            localStorage.setItem(`${STORAGE_KEY}-tabs`, JSON.stringify(updatedTabs));
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    // الاستماع للتحديثات من علامات التبويب الأخرى
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === `${STORAGE_KEY}-message` && event.newValue) {
                try {
                    const message: SyncMessage = JSON.parse(event.newValue);
                    if (message.source !== TAB_ID) {
                        setLastUpdate(message);

                        // تحديث الإشعارات
                        if (message.type === 'notification') {
                            addNotification({
                                type: message.data?.type || 'info',
                                message: message.data?.message || 'تم التحديث',
                            });
                        }

                        // إرسال حدث مخصص
                        window.dispatchEvent(new CustomEvent('tab-sync', { detail: message }));
                    }
                } catch (err) {
                    console.error('خطأ في معالجة رسالة المزامنة:', err);
                }
            }

            if (event.key === NOTIFICATIONS_KEY && event.newValue) {
                try {
                    const newNotifications: Notification[] = JSON.parse(event.newValue);
                    setNotifications(newNotifications);
                } catch (err) {
                    console.error('خطأ في تحديث الإشعارات:', err);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // إرسال رسالة تحديث إلى علامات التبويب الأخرى
    const broadcastUpdate = useCallback((
        type: SyncMessage['type'],
        studentId?: string,
        dataType?: string,
        data?: any
    ) => {
        const message: SyncMessage = {
            type,
            studentId,
            dataType,
            timestamp: Date.now(),
            source: TAB_ID,
            data,
        };

        localStorage.setItem(
            `${STORAGE_KEY}-message`,
            JSON.stringify(message)
        );

        setLastUpdate(message);
    }, []);

    // إضافة إشعار
    const addNotification = useCallback((
        notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
    ) => {
        const newNotification: Notification = {
            id: Math.random().toString(36).substr(2, 9),
            ...notification,
            timestamp: Date.now(),
            read: false,
        };

        setNotifications(prev => [newNotification, ...prev]);

        // حفظ الإشعارات في localStorage لمزامنة علامات التبويب الأخرى
        const allNotifications = [newNotification, ...notifications];
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(allNotifications));

        // إزالة الإشعار تلقائياً بعد 5 ثوان للإشعارات الناجحة
        if (notification.type === 'success') {
            setTimeout(() => {
                removeNotification(newNotification.id);
            }, 5000);
        }

        return newNotification.id;
    }, [notifications]);

    // إزالة إشعار
    const removeNotification = useCallback((notificationId: string) => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));

        const updated = notifications.filter(n => n.id !== notificationId);
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    }, [notifications]);

    // تحديث حالة قراءة الإشعار
    const markAsRead = useCallback((notificationId: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );

        const updated = notifications.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
        );
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    }, [notifications]);

    // الحصول على عدد الإشعارات غير المقروءة
    const unreadCount = notifications.filter(n => !n.read).length;

    // مسح جميع الإشعارات
    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
    }, []);

    return {
        notifications,
        lastUpdate,
        isLeader,
        TAB_ID,
        broadcastUpdate,
        addNotification,
        removeNotification,
        markAsRead,
        unreadCount,
        clearAllNotifications,
    };
}