import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Bell,
    Check,
    Mail,
    MessageSquare,
    AlertCircle,
    Clock,
    CheckCheck
} from 'lucide-react';
import { TeacherNotification } from '@/types/teacher';

interface NotificationsSectionProps {
    notifications: TeacherNotification[];
}

export function NotificationsSection({ notifications }: NotificationsSectionProps) {
    // تصنيف الإشعارات
    const unreadNotifications = notifications.filter(n => !n.isRead);
    const recentNotifications = notifications.slice(0, 20);

    // إحصائيات
    const byType = {
        internal: notifications.filter(n => n.deliveryMethod === 'internal').length,
        whatsapp: notifications.filter(n => n.deliveryMethod === 'whatsapp').length,
        email: notifications.filter(n => n.deliveryMethod === 'email').length,
        sms: notifications.filter(n => n.deliveryMethod === 'sms').length,
    };

    return (
        <div className="space-y-6">
            {/* بطاقات الملخص */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-blue-200">
                            <Bell className="h-6 w-6 text-blue-700" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-blue-700">{notifications.length}</p>
                            <p className="text-sm text-blue-600">إجمالي الإشعارات</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-5 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-red-200">
                            <AlertCircle className="h-6 w-6 text-red-700" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-red-700">{unreadNotifications.length}</p>
                            <p className="text-sm text-red-600">غير مقروء</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-5 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-green-200">
                            <MessageSquare className="h-6 w-6 text-green-700" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-green-700">{byType.whatsapp}</p>
                            <p className="text-sm text-green-600">واتساب</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-purple-200">
                            <Mail className="h-6 w-6 text-purple-700" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-purple-700">{byType.email}</p>
                            <p className="text-sm text-purple-600">بريد إلكتروني</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* الإشعارات غير المقروءة */}
            {unreadNotifications.length > 0 && (
                <Card className="p-6 border-r-4 border-r-red-500">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        إشعارات غير مقروءة
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
                            {unreadNotifications.length}
                        </span>
                    </h3>
                    <div className="space-y-3">
                        {unreadNotifications.slice(0, 5).map((notification, index) => (
                            <NotificationCard key={index} notification={notification} />
                        ))}
                    </div>
                </Card>
            )}

            {/* جميع الإشعارات */}
            <Card className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-600" />
                    سجل الإشعارات
                </h3>

                {recentNotifications.length > 0 ? (
                    <div className="space-y-3">
                        {recentNotifications.map((notification, index) => (
                            <NotificationCard key={index} notification={notification} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>لا توجد إشعارات</p>
                    </div>
                )}
            </Card>
        </div>
    );
}

function NotificationCard({ notification }: { notification: TeacherNotification }) {
    const getDeliveryIcon = () => {
        switch (notification.deliveryMethod) {
            case 'whatsapp': return <MessageSquare className="h-4 w-4 text-green-600" />;
            case 'email': return <Mail className="h-4 w-4 text-purple-600" />;
            case 'sms': return <MessageSquare className="h-4 w-4 text-blue-600" />;
            default: return <Bell className="h-4 w-4 text-gray-600" />;
        }
    };

    const getPriorityColor = () => {
        switch (notification.priority) {
            case 'urgent': return 'border-r-red-500 bg-red-50';
            case 'high': return 'border-r-orange-500 bg-orange-50';
            case 'normal': return 'border-r-blue-500 bg-blue-50';
            default: return 'border-r-gray-300 bg-gray-50';
        }
    };

    const getStatusIcon = () => {
        switch (notification.deliveryStatus) {
            case 'delivered': return <CheckCheck className="h-4 w-4 text-green-600" />;
            case 'sent': return <Check className="h-4 w-4 text-blue-600" />;
            case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />;
            default: return <Clock className="h-4 w-4 text-yellow-600" />;
        }
    };

    return (
        <div className={`p-4 rounded-lg border-r-4 ${getPriorityColor()}`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        {getDeliveryIcon()}
                        <span className="font-semibold">{notification.title}</span>
                        {!notification.isRead && (
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(notification.createdAt).toLocaleDateString('ar-EG')}
                        </span>
                        <span className="flex items-center gap-1">
                            {getStatusIcon()}
                            {notification.deliveryStatus === 'delivered' ? 'تم التوصيل' :
                                notification.deliveryStatus === 'sent' ? 'تم الإرسال' :
                                    notification.deliveryStatus === 'failed' ? 'فشل الإرسال' : 'قيد الانتظار'}
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${notification.notificationType === 'تنبيه' ? 'bg-red-100 text-red-700' :
                            notification.notificationType === 'تذكير' ? 'bg-yellow-100 text-yellow-700' :
                                notification.notificationType === 'إعلان' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-600'
                        }`}>
                        {notification.notificationType}
                    </span>
                </div>
            </div>
        </div>
    );
}
