/**
 * صفحة إدارة الإجازات - نظام الموارد البشرية
 */
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Search, Plus, Filter, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const mockLeaves = [
    { id: '1', employee_name: 'أحمد محمد', leave_type: 'سنوية', start_date: '2024-01-15', end_date: '2024-01-20', days: 5, status: 'موافق عليه', reason: 'إجازة عائلية' },
    { id: '2', employee_name: 'سارة أحمد', leave_type: 'مرضية', start_date: '2024-01-18', end_date: '2024-01-19', days: 2, status: 'معلق', reason: 'مرض' },
    { id: '3', employee_name: 'محمود علي', leave_type: 'عارضة', start_date: '2024-01-22', end_date: '2024-01-22', days: 1, status: 'مرفوض', reason: 'ظروف شخصية' },
];

const HRLeaves = () => {
    const [leaves, setLeaves] = useState(mockLeaves);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'معلق': 'bg-yellow-100 text-yellow-800',
            'موافق عليه': 'bg-green-100 text-green-800',
            'مرفوض': 'bg-red-100 text-red-800',
        };
        return styles[status] || 'bg-gray-100';
    };

    const getTypeBadge = (type: string) => {
        const styles: Record<string, string> = {
            'سنوية': 'bg-blue-100 text-blue-800',
            'مرضية': 'bg-orange-100 text-orange-800',
            'عارضة': 'bg-purple-100 text-purple-800',
        };
        return styles[type] || 'bg-gray-100';
    };

    const filtered = leaves.filter(l => {
        const matchSearch = l.employee_name.includes(searchQuery);
        const matchStatus = statusFilter === 'all' || l.status === statusFilter;
        const matchType = typeFilter === 'all' || l.leave_type === typeFilter;
        return matchSearch && matchStatus && matchType;
    });

    const stats = {
        total: leaves.length,
        pending: leaves.filter(l => l.status === 'معلق').length,
        approved: leaves.filter(l => l.status === 'موافق عليه').length,
        rejected: leaves.filter(l => l.status === 'مرفوض').length,
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3"><Calendar className="h-8 w-8 text-teal-600" />إدارة الإجازات</h1>
                        <p className="text-gray-500">متابعة طلبات الإجازات وأرصدتها</p>
                    </div>
                    <Button className="bg-teal-600 hover:bg-teal-700"><Plus className="h-4 w-4 ml-2" />طلب إجازة جديد</Button>
                </div>

                <div className="grid grid-cols-4 gap-4">
                    <Card className="p-4 bg-blue-50"><div className="flex items-center gap-3"><FileText className="h-8 w-8 text-blue-600" /><div><p className="text-sm text-blue-600">إجمالي الطلبات</p><p className="text-2xl font-bold">{stats.total}</p></div></div></Card>
                    <Card className="p-4 bg-yellow-50"><div className="flex items-center gap-3"><Clock className="h-8 w-8 text-yellow-600" /><div><p className="text-sm text-yellow-600">قيد الانتظار</p><p className="text-2xl font-bold">{stats.pending}</p></div></div></Card>
                    <Card className="p-4 bg-green-50"><div className="flex items-center gap-3"><CheckCircle className="h-8 w-8 text-green-600" /><div><p className="text-sm text-green-600">موافق عليها</p><p className="text-2xl font-bold">{stats.approved}</p></div></div></Card>
                    <Card className="p-4 bg-red-50"><div className="flex items-center gap-3"><XCircle className="h-8 w-8 text-red-600" /><div><p className="text-sm text-red-600">مرفوضة</p><p className="text-2xl font-bold">{stats.rejected}</p></div></div></Card>
                </div>

                <Card className="p-4">
                    <div className="flex gap-4 flex-wrap">
                        <div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10" /></div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="w-[150px]"><SelectValue placeholder="النوع" /></SelectTrigger><SelectContent><SelectItem value="all">الكل</SelectItem><SelectItem value="سنوية">سنوية</SelectItem><SelectItem value="مرضية">مرضية</SelectItem><SelectItem value="عارضة">عارضة</SelectItem></SelectContent></Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[150px]"><SelectValue placeholder="الحالة" /></SelectTrigger><SelectContent><SelectItem value="all">الكل</SelectItem><SelectItem value="معلق">معلق</SelectItem><SelectItem value="موافق عليه">موافق عليه</SelectItem><SelectItem value="مرفوض">مرفوض</SelectItem></SelectContent></Select>
                    </div>
                </Card>

                <Card>
                    <Table>
                        <TableHeader><TableRow className="bg-gray-50"><TableHead>الموظف</TableHead><TableHead>النوع</TableHead><TableHead>من</TableHead><TableHead>إلى</TableHead><TableHead>الأيام</TableHead><TableHead>السبب</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {filtered.map(l => (
                                <TableRow key={l.id}>
                                    <TableCell className="font-semibold">{l.employee_name}</TableCell>
                                    <TableCell><Badge className={getTypeBadge(l.leave_type)}>{l.leave_type}</Badge></TableCell>
                                    <TableCell>{l.start_date}</TableCell>
                                    <TableCell>{l.end_date}</TableCell>
                                    <TableCell className="font-bold">{l.days}</TableCell>
                                    <TableCell className="text-gray-500">{l.reason}</TableCell>
                                    <TableCell><Badge className={getStatusBadge(l.status)}>{l.status}</Badge></TableCell>
                                    <TableCell>
                                        {l.status === 'معلق' && (
                                            <div className="flex gap-1">
                                                <Button size="sm" variant="ghost" className="text-green-600"><CheckCircle className="h-4 w-4" /></Button>
                                                <Button size="sm" variant="ghost" className="text-red-600"><XCircle className="h-4 w-4" /></Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default HRLeaves;
