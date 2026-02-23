/**
 * صفحة الرواتب HR - نظام الموارد البشرية
 */
import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, Search, Download, Send, Calculator, TrendingUp, TrendingDown, DollarSign, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useFinanceData } from '@/hooks/useFinanceData';

const HRPayroll = () => {
    const { 
        loading, 
        salaries, 
        generateMonthlySalaries, 
        refreshData 
    } = useFinanceData();

    const [searchQuery, setSearchQuery] = useState('');
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [isGenerating, setIsGenerating] = useState(false);

    // تصفية الرواتب حسب الشهر والبحث
    const filteredPayroll = useMemo(() => {
        return salaries.filter(s => {
            const matchesMonth = s.month === month;
            const matchesSearch = s.employee?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 s.employee?.employeeId?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesMonth && matchesSearch;
        });
    }, [salaries, month, searchQuery]);

    const stats = useMemo(() => ({
        totalGross: filteredPayroll.reduce((s, p) => s + p.baseSalary + p.totalAllowances, 0),
        totalDeductions: filteredPayroll.reduce((s, p) => s + p.totalDeductions, 0),
        totalNet: filteredPayroll.reduce((s, p) => s + p.netSalary, 0),
        count: filteredPayroll.length,
    }), [filteredPayroll]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const count = await generateMonthlySalaries(month);
            if (count > 0) {
                toast.success(`تم إنشاء وتحديث ${count} راتب بناءً على سجلات البصمة`);
            } else {
                toast.info('تم تحديث البيانات الحالية أو لا توجد سجلات جديدة');
            }
            await refreshData();
        } catch (error) {
            toast.error('فشل في حساب الرواتب');
        } finally {
            setIsGenerating(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = { 
            'مستحق': 'bg-yellow-100 text-yellow-800 border-yellow-200', 
            'معتمد': 'bg-green-100 text-green-800 border-green-200', 
            'تم الصرف': 'bg-blue-100 text-blue-800 border-blue-200' 
        };
        return styles[status] || 'bg-gray-100';
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3"><Wallet className="h-8 w-8 text-emerald-600" />رواتب HR</h1>
                        <p className="text-gray-500">إدارة رواتب ومستحقات الموظفين بناءً على سجلات الحضور</p>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            onClick={handleGenerate}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                            ) : (
                                <Calculator className="h-4 w-4 ml-2" />
                            )}
                            حساب الرواتب من البصمة
                        </Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                            <Send className="h-4 w-4 ml-2" />
                            إرسال للمالية
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-4 bg-blue-50 border-blue-100">
                        <div className="flex items-center gap-3">
                            <DollarSign className="h-8 w-8 text-blue-600" />
                            <div>
                                <p className="text-sm text-blue-600">إجمالي الرواتب</p>
                                <p className="text-2xl font-bold text-blue-900">{stats.totalGross.toLocaleString()} ج.م</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 bg-green-50 border-green-100">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="h-8 w-8 text-green-600" />
                            <div>
                                <p className="text-sm text-green-600">البدلات والإضافي</p>
                                <p className="text-2xl font-bold text-green-900">
                                    {(filteredPayroll.reduce((s, p) => s + p.totalAllowances, 0)).toLocaleString()} ج.م
                                </p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 bg-red-50 border-red-100">
                        <div className="flex items-center gap-3">
                            <TrendingDown className="h-8 w-8 text-red-600" />
                            <div>
                                <p className="text-sm text-red-600">الخصومات (تأخير/غياب)</p>
                                <p className="text-2xl font-bold text-red-900">{stats.totalDeductions.toLocaleString()} ج.م</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 bg-emerald-50 border-emerald-100">
                        <div className="flex items-center gap-3">
                            <Wallet className="h-8 w-8 text-emerald-600" />
                            <div>
                                <p className="text-sm text-emerald-600">صافي المستحق</p>
                                <p className="text-2xl font-bold text-emerald-900">{stats.totalNet.toLocaleString()} ج.م</p>
                            </div>
                        </div>
                    </Card>
                </div>

                <Card className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex items-center gap-2">
                            <RefreshCw 
                                className={`h-4 w-4 cursor-pointer text-gray-400 hover:text-emerald-600 ${loading ? 'animate-spin' : ''}`} 
                                onClick={() => refreshData()}
                            />
                            <Input 
                                type="month" 
                                value={month} 
                                onChange={(e) => setMonth(e.target.value)} 
                                className="w-[200px]" 
                            />
                        </div>
                        <div className="relative flex-1">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                                placeholder="بحث باسم الموظف أو الكود..." 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                                className="pr-10" 
                            />
                        </div>
                        <Button variant="outline"><Download className="h-4 w-4 ml-2" />تصدير تقرير</Button>
                    </div>
                </Card>

                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="text-right">الموظف</TableHead>
                                    <TableHead className="text-center">الوظيفة</TableHead>
                                    <TableHead className="text-center">الأساسي</TableHead>
                                    <TableHead className="text-center">البدلات</TableHead>
                                    <TableHead className="text-center">الخصومات</TableHead>
                                    <TableHead className="text-center">الصافي</TableHead>
                                    <TableHead className="text-center">الحالة</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPayroll.length > 0 ? (
                                    filteredPayroll.map(p => (
                                        <TableRow key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-900">{p.employee?.fullName}</span>
                                                    <span className="text-xs text-gray-500">{p.employee?.employeeId}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary" className="font-normal">{p.employee?.position}</Badge>
                                            </TableCell>
                                            <TableCell className="text-center font-medium">{p.baseSalary.toLocaleString()}</TableCell>
                                            <TableCell className="text-center text-green-600 font-medium">
                                                +{p.totalAllowances.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-center text-red-600 font-medium">
                                                -{p.totalDeductions.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                                                    {p.netSalary.toLocaleString()}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={`${getStatusBadge(p.status)} border shadow-sm`}>
                                                    {p.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                                            {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد رواتب مسجلة لهذا الشهر. اضغط على "حساب الرواتب" للبدء.'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default HRPayroll;
