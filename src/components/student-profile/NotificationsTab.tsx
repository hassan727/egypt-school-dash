import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Bell,
    Search,
    Filter,
} from 'lucide-react';
import { useNotifications, useNotificationTypes } from '@/hooks/useNotifications';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface NotificationsTabProps {
    studentId: string;
    studentName: string;
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({ studentId, studentName }) => {
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const { notifications, loading, markAsRead } = useNotifications({ student_id: studentId });
    const { types } = useNotificationTypes();

    // Filter notifications
    const filteredNotifications = notifications.filter((notif) => {
        if (activeCategory !== 'all') {
            const typeCode = notif.notification_type?.type_code;
            const legacyType = (notif as any).type;
            // Handle both new notification_type and legacy type fields
            if (typeCode !== activeCategory && legacyType !== activeCategory) return false;
        }
        if (statusFilter === 'unread' && notif.status === 'read') return false;
        if (statusFilter === 'read' && notif.status !== 'read') return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const titleMatch = notif.title?.toLowerCase().includes(query);
            const contentMatch = notif.content.toLowerCase().includes(query);
            if (!titleMatch && !contentMatch) return false;
        }
        return true;
    });

    const stats = {
        total: notifications.length,
        unread: notifications.filter(n => n.status !== 'read').length,
        urgent: notifications.filter(n => n.priority === 'urgent').length,
        thisWeek: notifications.filter(n => {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return new Date(n.created_at) > weekAgo;
        }).length,
    };

    return (
        <div className="space-y-6">
            {/* Filters & Stats Bar */}
            <Card className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center mb-4">
                    <div className="flex flex-wrap gap-3 flex-1">
                        {/* Category Filter */}
                        <div className="w-40">
                            <label className="text-xs text-gray-500 mb-1 block">النوع</label>
                            <Select value={activeCategory} onValueChange={setActiveCategory}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="الكل" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">الكل ({notifications.length})</SelectItem>
                                    {types.map((type) => {
                                        const count = notifications.filter(n => n.notification_type?.type_code === type.type_code).length;
                                        return (
                                            <SelectItem key={type.id} value={type.type_code}>
                                                {type.type_name_ar} ({count})
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status Filter */}
                        <div className="w-40">
                            <label className="text-xs text-gray-500 mb-1 block">الحالة</label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="الكل" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">جميع الحالات</SelectItem>
                                    <SelectItem value="unread">غير مقروءة</SelectItem>
                                    <SelectItem value="read">مقروءة</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setSearchQuery('');
                                setStatusFilter('all');
                                setActiveCategory('all');
                            }}
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            إعادة تعيين
                        </Button>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="بحث في الإشعارات..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10"
                    />
                </div>
            </Card>

            {/* Notifications Table */}
            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <p className="text-gray-500">جاري تحميل البيانات...</p>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <Bell className="h-12 w-12 text-gray-300 mb-2" />
                        <p className="text-gray-500">لا توجد إشعارات</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse border border-gray-300">
                            <thead className="bg-blue-100">
                                <tr>
                                    <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">النوع</th>
                                    <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">العنوان</th>
                                    <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">المحتوى</th>
                                    <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">التاريخ</th>
                                    <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">الحالة</th>
                                    <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredNotifications.map((notification) => {
                                    const isUnread = notification.status !== 'read';
                                    return (
                                        <tr key={notification.id} className="hover:bg-blue-50 transition-colors">
                                            <td className="px-4 py-3 border border-gray-200">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${(notification as any).type === 'whatsapp'
                                                    ? 'bg-green-100 text-green-800 border-green-200'
                                                    : 'bg-blue-100 text-blue-800 border-blue-200'
                                                    }`}>
                                                    {notification.notification_type?.type_name_ar ||
                                                        ((notification as any).type === 'whatsapp' ? 'واتساب' :
                                                            (notification as any).type === 'internal' ? 'داخلي' : 'عام')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 border border-gray-200">
                                                <span className="font-bold text-gray-800 text-base">
                                                    {notification.title || '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm border border-gray-200 font-medium max-w-md">
                                                <p className="line-clamp-2">{notification.content}</p>
                                            </td>
                                            <td className="px-4 py-3 text-sm border border-gray-200">
                                                {format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                                            </td>
                                            <td className="px-4 py-3 border border-gray-200">
                                                {isUnread ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
                                                        جديد
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                                                        مقروء
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 border border-gray-200">
                                                {isUnread && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => markAsRead(notification.id, studentId)}
                                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    >
                                                        تعليم كمقروء
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Live Statistics Footer */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-blue-50 border-blue-100 text-center">
                    <p className="text-xs text-blue-600 font-medium mb-1">إجمالي الإشعارات</p>
                    <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
                </Card>
                <Card className="p-4 bg-orange-50 border-orange-100 text-center">
                    <p className="text-xs text-orange-600 font-medium mb-1">غير مقروءة</p>
                    <p className="text-2xl font-bold text-orange-800">{stats.unread}</p>
                </Card>
                <Card className="p-4 bg-red-50 border-red-100 text-center">
                    <p className="text-xs text-red-600 font-medium mb-1">عاجلة</p>
                    <p className="text-2xl font-bold text-red-800">{stats.urgent}</p>
                </Card>
                <Card className="p-4 bg-green-50 border-green-100 text-center">
                    <p className="text-xs text-green-600 font-medium mb-1">هذا الأسبوع</p>
                    <p className="text-2xl font-bold text-green-800">{stats.thisWeek}</p>
                </Card>
            </div>
        </div>
    );
};

export default NotificationsTab;
