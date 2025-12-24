/**
 * صفحة نهاية الخدمة - نظام الموارد البشرية
 */
import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LogOut, Search, Plus, Eye, CheckCircle, Clock, DollarSign } from 'lucide-react';

const mockTerminations = [
    { id: '1', employee: 'عمر سعيد', reason: 'استقالة', date: '2024-01-31', lastDay: '2024-02-28', status: 'قيد التسليم', settlement: 45000 },
    { id: '2', employee: 'هند محمد', reason: 'انتهاء العقد', date: '2024-01-15', lastDay: '2024-01-31', status: 'مكتمل', settlement: 32000 },
];

const HROffboarding = () => {
    const [terminations] = useState(mockTerminations);
    const [searchQuery, setSearchQuery] = useState('');

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = { 'معلق': 'bg-yellow-100 text-yellow-800', 'قيد التسليم': 'bg-blue-100 text-blue-800', 'مكتمل': 'bg-green-100 text-green-800' };
        return styles[status] || 'bg-gray-100';
    };

    const getReasonBadge = (reason: string) => {
        const styles: Record<string, string> = { 'استقالة': 'bg-blue-100 text-blue-800', 'انتهاء العقد': 'bg-gray-100 text-gray-800', 'فصل': 'bg-red-100 text-red-800', 'تقاعد': 'bg-green-100 text-green-800' };
        return styles[reason] || 'bg-gray-100';
    };

    const stats = { total: terminations.length, pending: terminations.filter(t => t.status === 'قيد التسليم').length, completed: terminations.filter(t => t.status === 'مكتمل').length, totalSettlement: terminations.reduce((s, t) => s + t.settlement, 0) };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3"><LogOut className="h-8 w-8 text-rose-600" />نهاية الخدمة</h1>
                        <p className="text-gray-500">إدارة إجراءات إنهاء الخدمة والتسوية</p>
                    </div>
                    <Button className="bg-rose-600 hover:bg-rose-700"><Plus className="h-4 w-4 ml-2" />إنهاء خدمة</Button>
                </div>

                <div className="grid grid-cols-4 gap-4">
                    <Card className="p-4 bg-gray-50"><div className="flex items-center gap-3"><LogOut className="h-8 w-8 text-gray-600" /><div><p className="text-sm text-gray-600">إجمالي الحالات</p><p className="text-2xl font-bold">{stats.total}</p></div></div></Card>
                    <Card className="p-4 bg-blue-50"><div className="flex items-center gap-3"><Clock className="h-8 w-8 text-blue-600" /><div><p className="text-sm text-blue-600">قيد التسليم</p><p className="text-2xl font-bold">{stats.pending}</p></div></div></Card>
                    <Card className="p-4 bg-green-50"><div className="flex items-center gap-3"><CheckCircle className="h-8 w-8 text-green-600" /><div><p className="text-sm text-green-600">مكتملة</p><p className="text-2xl font-bold">{stats.completed}</p></div></div></Card>
                    <Card className="p-4 bg-amber-50"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-amber-600" /><div><p className="text-sm text-amber-600">المستحقات</p><p className="text-2xl font-bold">{stats.totalSettlement.toLocaleString()}</p></div></div></Card>
                </div>

                <Card className="p-4"><div className="flex gap-4"><div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10" /></div></div></Card>

                <Card>
                    <Table>
                        <TableHeader><TableRow className="bg-gray-50"><TableHead>الموظف</TableHead><TableHead>السبب</TableHead><TableHead>تاريخ الإنهاء</TableHead><TableHead>آخر يوم</TableHead><TableHead>المستحقات</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {terminations.map(t => (
                                <TableRow key={t.id}>
                                    <TableCell className="font-semibold">{t.employee}</TableCell>
                                    <TableCell><Badge className={getReasonBadge(t.reason)}>{t.reason}</Badge></TableCell>
                                    <TableCell>{t.date}</TableCell>
                                    <TableCell>{t.lastDay}</TableCell>
                                    <TableCell className="font-bold text-amber-600">{t.settlement.toLocaleString()} ج.م</TableCell>
                                    <TableCell><Badge className={getStatusBadge(t.status)}>{t.status}</Badge></TableCell>
                                    <TableCell><Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default HROffboarding;
