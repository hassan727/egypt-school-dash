import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Headphones, Search, MessageSquare, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { fetchPlatformSupportTickets } from '@/services/platformService';
import type { SupportTicket } from '@/types/platform';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

export default function PlatformSupport() {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: tickets, isLoading } = useQuery({
        queryKey: ['platform-tickets'],
        queryFn: fetchPlatformSupportTickets,
    });

    const filteredTickets = tickets?.filter((t) =>
        t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.schoolName.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const getStatusBadge = (status: SupportTicket['status']) => {
        switch (status) {
            case 'open':
                return <Badge className="bg-red-100 text-red-800 border-none"><AlertTriangle className="w-3 h-3 mr-1" /> مفتوحة</Badge>;
            case 'in_progress':
                return <Badge className="bg-amber-100 text-amber-800 border-none"><Clock className="w-3 h-3 mr-1" /> قيد المعالجة</Badge>;
            case 'resolved':
                return <Badge className="bg-emerald-100 text-emerald-800 border-none"><CheckCircle className="w-3 h-3 mr-1" /> تم الحل</Badge>;
            case 'closed':
                return <Badge variant="outline" className="text-muted-foreground border-slate-200">مغلقة</Badge>;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'critical':
                return <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">حرج</span>;
            case 'high':
                return <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-md">عالي</span>;
            case 'normal':
                return <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">عادي</span>;
            case 'low':
                return <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-md border">منخفض</span>;
            default:
                return <span className="text-xs text-slate-500">{priority}</span>;
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">الدعم الفني للمنصة</h1>
                        <p className="text-muted-foreground mt-1">
                            إدارة طلبات الدعم وتذاكر المساعدة من كافة المدارس
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">تذاكر مفتوحة</p>
                                <h3 className="text-2xl font-bold">
                                    {tickets?.filter(t => t.status === 'open').length || 0}
                                </h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">تم حلها</p>
                                <h3 className="text-2xl font-bold">
                                    {tickets?.filter(t => t.status === 'resolved' || t.status === 'closed').length || 0}
                                </h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="border-b bg-slate-50/50 pb-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-lg">سجل التذاكر</CardTitle>
                                <CardDescription>قائمة بجميع تذاكر الدعم المرفوعة للمنصة</CardDescription>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="بحث في التذاكر..."
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
                                        <TableHead>الموضوع</TableHead>
                                        <TableHead>المدرسة</TableHead>
                                        <TableHead>التصنيف</TableHead>
                                        <TableHead>الأولوية</TableHead>
                                        <TableHead>الحالة</TableHead>
                                        <TableHead>التاريخ</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array(5).fill(0).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                <TableCell><Skeleton className="h-6 w-16 rounded-md" /></TableCell>
                                                <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-8 w-10" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : filteredTickets.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                                لا توجد تذاكر حالياً
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredTickets.map((ticket) => (
                                            <TableRow key={ticket.id} className="hover:bg-slate-50 cursor-pointer">
                                                <TableCell className="font-medium">{ticket.subject}</TableCell>
                                                <TableCell>{ticket.schoolName}</TableCell>
                                                <TableCell><span className="text-sm text-slate-500">{ticket.category}</span></TableCell>
                                                <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                                                <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {ticket.createdAt ? format(new Date(ticket.createdAt), 'PPP', { locale: ar }) : '-'}
                                                </TableCell>
                                                <TableCell className="text-left">
                                                    <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                        <MessageSquare className="w-4 h-4" />
                                                    </Button>
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
