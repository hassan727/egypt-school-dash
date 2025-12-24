import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Bell,
    Send,
    Eye,
    CheckCircle,
    XCircle,
    TrendingUp,
    Users,
    MessageSquare,
    Plus,
} from 'lucide-react';
import { getNotificationStats } from '@/services/notificationService';
import type { NotificationStats } from '@/types/notification';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const NotificationDashboard = () => {
    const [stats, setStats] = useState<NotificationStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        setLoading(true);
        const data = await getNotificationStats();
        setStats(data);
        setLoading(false);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const deliveryRatePercent = Math.round((stats?.delivery_rate || 0) * 100);
    const readRatePercent = Math.round((stats?.read_rate || 0) * 100);

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">لوحة إدارة الإشعارات</h1>
                    <p className="text-muted-foreground mt-1">
                        إدارة شاملة لجميع إشعارات المدرسة
                    </p>
                </div>
                <Link to="/notifications/create">
                    <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        إنشاء إشعار جديد
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">إجمالي المرسل</p>
                                <p className="text-3xl font-bold mt-2">{stats?.total_sent || 0}</p>
                                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    نشط
                                </p>
                            </div>
                            <div className="p-4 bg-blue-100 rounded-full">
                                <Send className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">تم التسليم</p>
                                <p className="text-3xl font-bold mt-2">{stats?.total_delivered || 0}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {deliveryRatePercent}% معدل التسليم
                                </p>
                            </div>
                            <div className="p-4 bg-green-100 rounded-full">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">تمت القراءة</p>
                                <p className="text-3xl font-bold mt-2">{stats?.total_read || 0}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {readRatePercent}% معدل القراءة
                                </p>
                            </div>
                            <div className="p-4 bg-purple-100 rounded-full">
                                <Eye className="w-8 h-8 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">فشل الإرسال</p>
                                <p className="text-3xl font-bold mt-2">{stats?.total_failed || 0}</p>
                                <p className="text-xs text-red-600 mt-1">يحتاج متابعة</p>
                            </div>
                            <div className="p-4 bg-red-100 rounded-full">
                                <XCircle className="w-8 h-8 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* By Type */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            الإشعارات حسب النوع
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Object.entries(stats?.by_type || {}).map(([type, count]) => (
                                <div key={type} className="flex items-center justify-between">
                                    <span className="text-sm">{type}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        (count / Math.max(...Object.values(stats?.by_type || {}))) * 100
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                        <Badge variant="secondary">{count}</Badge>
                                    </div>
                                </div>
                            ))}
                            {Object.keys(stats?.by_type || {}).length === 0 && (
                                <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* By Channel */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            الإشعارات حسب القناة
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Object.entries(stats?.by_channel || {}).map(([channel, count]) => (
                                <div key={channel} className="flex items-center justify-between">
                                    <span className="text-sm">{channel}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-green-600 h-2 rounded-full"
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        (count / Math.max(...Object.values(stats?.by_channel || {}))) * 100
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                        <Badge variant="secondary">{count}</Badge>
                                    </div>
                                </div>
                            ))}
                            {Object.keys(stats?.by_channel || {}).length === 0 && (
                                <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Notifications */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="w-5 h-5" />
                            الإشعارات الأخيرة
                        </CardTitle>
                        <Link to="/notifications/history">
                            <Button variant="outline" size="sm">
                                عرض الكل
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {stats?.recent_notifications.slice(0, 5).map((notification) => (
                            <div
                                key={notification.id}
                                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Bell className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="font-medium">{notification.title || 'بدون عنوان'}</p>
                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                {notification.content}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {format(new Date(notification.created_at), 'dd MMM yyyy - HH:mm', {
                                                    locale: ar,
                                                })}
                                            </p>
                                        </div>
                                        <Badge variant="outline">
                                            {notification.notification_type?.type_name_ar || 'عام'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!stats?.recent_notifications || stats.recent_notifications.length === 0) && (
                            <p className="text-center text-muted-foreground py-8">لا توجد إشعارات حديثة</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/notifications/create">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <Plus className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-semibold">إنشاء إشعار جديد</p>
                                    <p className="text-sm text-muted-foreground">إرسال إشعار فردي أو جماعي</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link to="/notifications/history">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <Bell className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="font-semibold">سجل الإشعارات</p>
                                    <p className="text-sm text-muted-foreground">عرض جميع الإشعارات السابقة</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link to="/students/batch/notifications">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <Users className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-semibold">إشعارات جماعية</p>
                                    <p className="text-sm text-muted-foreground">إرسال لفصل أو مرحلة كاملة</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
};

export default NotificationDashboard;
