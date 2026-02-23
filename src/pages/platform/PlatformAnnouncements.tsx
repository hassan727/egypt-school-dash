import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Megaphone, Search, PlusCircle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { fetchAllPlatformNotifications } from '@/services/platformService';
import type { PlatformAlert } from '@/types/platform';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

export default function PlatformAnnouncements() {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: notifications, isLoading } = useQuery({
        queryKey: ['platform-notifications-all'],
        queryFn: fetchAllPlatformNotifications,
    });

    const filteredNotifications = notifications?.filter((n) =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const getTypeBadge = (type: PlatformAlert['type']) => {
        switch (type) {
            case 'success':
                return <Badge className="bg-emerald-100 text-emerald-800 border-none"><CheckCircle2 className="w-3 h-3 mr-1" /> نجاح</Badge>;
            case 'warning':
                return <Badge className="bg-amber-100 text-amber-800 border-none"><AlertCircle className="w-3 h-3 mr-1" /> تحذير</Badge>;
            case 'error':
                return <Badge className="bg-red-100 text-red-800 border-none"><AlertCircle className="w-3 h-3 mr-1" /> خطأ</Badge>;
            case 'info':
                return <Badge className="bg-blue-100 text-blue-800 border-none"><Info className="w-3 h-3 mr-1" /> معلومات</Badge>;
            case 'announcement':
                return <Badge className="bg-purple-100 text-purple-800 border-none"><Megaphone className="w-3 h-3 mr-1" /> إعلان عام</Badge>;
            default:
                return <Badge variant="outline">{type}</Badge>;
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">إدارة التنبيهات والإعلانات</h1>
                        <p className="text-muted-foreground mt-1">
                            إرسال وتتبع الإشعارات والإعلانات الموجهة لجميع المدارس على المنصة
                        </p>
                    </div>
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                        <PlusCircle className="w-4 h-4 ml-2" />
                        إرسال إعلان جديد
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                                <Megaphone className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">إجمالي الإعلانات</p>
                                <h3 className="text-2xl font-bold">
                                    {notifications?.length || 0}
                                </h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="border-b bg-slate-50/50 pb-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-lg">سجل الإرسال</CardTitle>
                                <CardDescription>جميع الإعلانات والتنبيهات التي تم إرسالها من المنصة</CardDescription>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="بحث بالكتابة أو العنوان..."
                                    className="pr-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead>النوع</TableHead>
                                        <TableHead>تاريخ الإرسال</TableHead>
                                        <TableHead className="w-1/3">العنوان</TableHead>
                                        <TableHead className="w-1/3">المحتوى</TableHead>
                                        <TableHead>الأولوية</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array(5).fill(0).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-full max-w-[200px]" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : filteredNotifications.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                                لا توجد إشعارات مسجلة
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredNotifications.map((notif) => (
                                            <TableRow key={notif.id} className="hover:bg-slate-50">
                                                <TableCell>{getTypeBadge(notif.type)}</TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {notif.createdAt ? format(new Date(notif.createdAt), 'PPP', { locale: ar }) : '-'}
                                                </TableCell>
                                                <TableCell className="font-medium text-slate-900">{notif.title}</TableCell>
                                                <TableCell className="text-muted-foreground truncate max-w-xs">{notif.message}</TableCell>
                                                <TableCell>
                                                    {notif.priority > 0 ? (
                                                        <span className="text-xs font-bold text-red-600">عالية</span>
                                                    ) : (
                                                        <span className="text-xs text-slate-500">عادية</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
