/**
 * صفحة الرواتب HR - نظام الموارد البشرية
 */
import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, Search, Download, Send, Calculator, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const mockPayroll = [
    { id: '1', employee: 'أحمد محمد', type: 'معلم', basic: 8000, allowances: 2000, deductions: 500, net: 9500, status: 'محسوب' },
    { id: '2', employee: 'سارة أحمد', type: 'إداري', basic: 6000, allowances: 1500, deductions: 300, net: 7200, status: 'معتمد' },
    { id: '3', employee: 'محمود علي', type: 'معلم', basic: 7500, allowances: 1800, deductions: 400, net: 8900, status: 'محسوب' },
];

const HRPayroll = () => {
    const [payroll] = useState(mockPayroll);
    const [searchQuery, setSearchQuery] = useState('');
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

    const stats = {
        totalGross: payroll.reduce((s, p) => s + p.basic + p.allowances, 0),
        totalDeductions: payroll.reduce((s, p) => s + p.deductions, 0),
        totalNet: payroll.reduce((s, p) => s + p.net, 0),
        count: payroll.length,
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = { 'محسوب': 'bg-yellow-100 text-yellow-800', 'معتمد': 'bg-green-100 text-green-800', 'مرسل': 'bg-blue-100 text-blue-800' };
        return styles[status] || 'bg-gray-100';
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3"><Wallet className="h-8 w-8 text-emerald-600" />رواتب HR</h1>
                        <p className="text-gray-500">إدارة رواتب ومستحقات الموظفين</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline"><Calculator className="h-4 w-4 ml-2" />حساب الرواتب</Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-700"><Send className="h-4 w-4 ml-2" />إرسال للمالية</Button>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                    <Card className="p-4 bg-blue-50"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-blue-600" /><div><p className="text-sm text-blue-600">إجمالي الرواتب</p><p className="text-2xl font-bold text-blue-900">{stats.totalGross.toLocaleString()}</p></div></div></Card>
                    <Card className="p-4 bg-green-50"><div className="flex items-center gap-3"><TrendingUp className="h-8 w-8 text-green-600" /><div><p className="text-sm text-green-600">البدلات</p><p className="text-2xl font-bold text-green-900">{(stats.totalGross - payroll.reduce((s, p) => s + p.basic, 0)).toLocaleString()}</p></div></div></Card>
                    <Card className="p-4 bg-red-50"><div className="flex items-center gap-3"><TrendingDown className="h-8 w-8 text-red-600" /><div><p className="text-sm text-red-600">الخصومات</p><p className="text-2xl font-bold text-red-900">{stats.totalDeductions.toLocaleString()}</p></div></div></Card>
                    <Card className="p-4 bg-emerald-50"><div className="flex items-center gap-3"><Wallet className="h-8 w-8 text-emerald-600" /><div><p className="text-sm text-emerald-600">صافي المستحق</p><p className="text-2xl font-bold text-emerald-900">{stats.totalNet.toLocaleString()}</p></div></div></Card>
                </div>

                <Card className="p-4">
                    <div className="flex gap-4">
                        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-[200px]" />
                        <div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10" /></div>
                        <Button variant="outline"><Download className="h-4 w-4 ml-2" />تصدير</Button>
                    </div>
                </Card>

                <Card>
                    <Table>
                        <TableHeader><TableRow className="bg-gray-50"><TableHead>الموظف</TableHead><TableHead>النوع</TableHead><TableHead>الأساسي</TableHead><TableHead>البدلات</TableHead><TableHead>الخصومات</TableHead><TableHead>الصافي</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {payroll.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-semibold">{p.employee}</TableCell>
                                    <TableCell><Badge variant="outline">{p.type}</Badge></TableCell>
                                    <TableCell>{p.basic.toLocaleString()}</TableCell>
                                    <TableCell className="text-green-600">+{p.allowances.toLocaleString()}</TableCell>
                                    <TableCell className="text-red-600">-{p.deductions.toLocaleString()}</TableCell>
                                    <TableCell className="font-bold text-emerald-600">{p.net.toLocaleString()}</TableCell>
                                    <TableCell><Badge className={getStatusBadge(p.status)}>{p.status}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default HRPayroll;
