import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, Download, Search, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { fetchPlatformPayments } from '@/services/platformService';
import type { PlatformPayment } from '@/types/platform';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

export default function PlatformPayments() {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: payments, isLoading } = useQuery({
        queryKey: ['platform-payments'],
        queryFn: fetchPlatformPayments,
    });

    const filteredPayments = payments?.filter((p) =>
        p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.schoolId.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const getStatusBadge = (status: PlatformPayment['status']) => {
        switch (status) {
            case 'paid':
                return <Badge className="bg-emerald-100 text-emerald-800 border-none"><CheckCircle2 className="w-3 h-3 mr-1" /> مدفوعة</Badge>;
            case 'pending':
                return <Badge className="bg-amber-100 text-amber-800 border-none"><Clock className="w-3 h-3 mr-1" /> معلقة</Badge>;
            case 'failed':
                return <Badge className="bg-red-100 text-red-800 border-none"><AlertCircle className="w-3 h-3 mr-1" /> فشلت</Badge>;
            case 'refunded':
                return <Badge className="bg-slate-100 text-slate-800 border-none">مستردة</Badge>;
            case 'cancelled':
                return <Badge variant="outline" className="text-muted-foreground border-slate-200">ملغاة</Badge>;
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">المدفوعات والفواتير</h1>
                        <p className="text-muted-foreground mt-1">
                            إدارة اشتراكات ومدفوعات جميع المدارس على المنصة
                        </p>
                    </div>
                    <Button variant="outline" className="bg-white">
                        <Download className="w-4 h-4 ml-2" />
                        تصدير التقرير
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">إجمالي المحصل</p>
                                <h3 className="text-2xl font-bold">
                                    {(payments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0) || 0).toLocaleString('ar-EG')} ج.م
                                </h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">مدفوعات معلقة</p>
                                <h3 className="text-2xl font-bold">
                                    {(payments?.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0) || 0).toLocaleString('ar-EG')} ج.م
                                </h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">فواتير قيد الانتظار</p>
                                <h3 className="text-2xl font-bold">
                                    {payments?.filter(p => p.status === 'pending').length || 0} فاتورة
                                </h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="border-b bg-slate-50/50 pb-4">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">سجل الفواتير</CardTitle>
                            <div className="relative w-64">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="بحث برقم الفاتورة أو المدرسة..."
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
                                        <TableHead>رقم الفاتورة</TableHead>
                                        <TableHead>معرف المدرسة</TableHead>
                                        <TableHead>المبلغ</TableHead>
                                        <TableHead>الحالة</TableHead>
                                        <TableHead>تاريخ الاستحقاق</TableHead>
                                        <TableHead>تاريخ الدفع</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array(5).fill(0).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                                <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : filteredPayments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                                لا توجد مدفوعات لعرضها
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredPayments.map((payment) => (
                                            <TableRow key={payment.id} className="hover:bg-slate-50">
                                                <TableCell className="font-medium">{payment.invoiceNumber || '-'}</TableCell>
                                                <TableCell><span className="text-sm text-slate-500 font-mono">{payment.schoolId.substring(0, 8)}...</span></TableCell>
                                                <TableCell className="font-bold">{payment.amount.toLocaleString('ar-EG')} ج.م</TableCell>
                                                <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {payment.dueDate ? format(new Date(payment.dueDate), 'PPP', { locale: ar }) : '-'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {payment.paidAt ? format(new Date(payment.paidAt), 'PPP', { locale: ar }) : '-'}
                                                </TableCell>
                                                <TableCell className="text-left">
                                                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                        عرض
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
