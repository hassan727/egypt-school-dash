/**
 * صفحة العقود - نظام الموارد البشرية
 */
import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Search, Plus, Eye, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

const mockContracts = [
    { id: '1', employee: 'أحمد محمد', type: 'دائم', start: '2022-09-01', end: null, salary: 8000, status: 'نشط' },
    { id: '2', employee: 'سارة أحمد', type: 'مؤقت', start: '2023-09-01', end: '2024-08-31', salary: 6000, status: 'نشط' },
    { id: '3', employee: 'محمود علي', type: 'مؤقت', start: '2023-01-01', end: '2024-01-31', salary: 7500, status: 'قريب الانتهاء' },
];

const HRContracts = () => {
    const [contracts] = useState(mockContracts);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = { 'نشط': 'bg-green-100 text-green-800', 'قريب الانتهاء': 'bg-yellow-100 text-yellow-800', 'منتهي': 'bg-red-100 text-red-800' };
        return styles[status] || 'bg-gray-100';
    };

    const filtered = contracts.filter(c => {
        const matchSearch = c.employee.includes(searchQuery);
        const matchStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const stats = { total: contracts.length, active: contracts.filter(c => c.status === 'نشط').length, expiring: contracts.filter(c => c.status === 'قريب الانتهاء').length };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3"><FileText className="h-8 w-8 text-violet-600" />إدارة العقود</h1>
                        <p className="text-gray-500">متابعة عقود الموظفين</p>
                    </div>
                    <Button className="bg-violet-600 hover:bg-violet-700"><Plus className="h-4 w-4 ml-2" />عقد جديد</Button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <Card className="p-4 bg-blue-50"><div className="flex items-center gap-3"><FileText className="h-8 w-8 text-blue-600" /><div><p className="text-sm text-blue-600">إجمالي العقود</p><p className="text-2xl font-bold">{stats.total}</p></div></div></Card>
                    <Card className="p-4 bg-green-50"><div className="flex items-center gap-3"><CheckCircle className="h-8 w-8 text-green-600" /><div><p className="text-sm text-green-600">نشطة</p><p className="text-2xl font-bold">{stats.active}</p></div></div></Card>
                    <Card className="p-4 bg-yellow-50"><div className="flex items-center gap-3"><AlertTriangle className="h-8 w-8 text-yellow-600" /><div><p className="text-sm text-yellow-600">قريبة الانتهاء</p><p className="text-2xl font-bold">{stats.expiring}</p></div></div></Card>
                </div>

                <Card className="p-4">
                    <div className="flex gap-4">
                        <div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10" /></div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[150px]"><SelectValue placeholder="الحالة" /></SelectTrigger><SelectContent><SelectItem value="all">الكل</SelectItem><SelectItem value="نشط">نشط</SelectItem><SelectItem value="قريب الانتهاء">قريب الانتهاء</SelectItem></SelectContent></Select>
                    </div>
                </Card>

                <Card>
                    <Table>
                        <TableHeader><TableRow className="bg-gray-50"><TableHead>الموظف</TableHead><TableHead>النوع</TableHead><TableHead>البداية</TableHead><TableHead>النهاية</TableHead><TableHead>الراتب</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {filtered.map(c => (
                                <TableRow key={c.id}>
                                    <TableCell className="font-semibold">{c.employee}</TableCell>
                                    <TableCell><Badge variant="outline">{c.type}</Badge></TableCell>
                                    <TableCell>{c.start}</TableCell>
                                    <TableCell>{c.end || 'غير محدد'}</TableCell>
                                    <TableCell className="font-bold">{c.salary.toLocaleString()} ج.م</TableCell>
                                    <TableCell><Badge className={getStatusBadge(c.status)}>{c.status}</Badge></TableCell>
                                    <TableCell className="flex gap-1">
                                        <Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button>
                                        <Button size="sm" variant="ghost" className="text-blue-600"><RefreshCw className="h-4 w-4" /></Button>
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

export default HRContracts;
