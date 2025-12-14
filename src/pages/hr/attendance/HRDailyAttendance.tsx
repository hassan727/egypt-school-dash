/**
 * صفحة سجل البصمة اليومي - نظام الموارد البشرية
 */
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, Search, Filter, Download, Calendar, UserCheck, UserX, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const HRDailyAttendance = () => {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => { fetchRecords(); }, [dateFilter]);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            // TODO: Replace with actual attendance table
            const { data, error } = await supabase.from('employees').select('id, full_name_ar, employee_code, employee_type').limit(20);
            if (error) throw error;
            // Mock attendance data
            const mockRecords = (data || []).map(emp => ({
                ...emp,
                date: dateFilter,
                check_in: `0${7 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
                check_out: `0${14 + Math.floor(Math.random() * 3)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
                status: ['حاضر', 'متأخر', 'غائب'][Math.floor(Math.random() * 3)],
                late_minutes: Math.floor(Math.random() * 30),
            }));
            setRecords(mockRecords);
        } catch (error) {
            toast.error('فشل في تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'حاضر': 'bg-green-100 text-green-800',
            'متأخر': 'bg-yellow-100 text-yellow-800',
            'غائب': 'bg-red-100 text-red-800',
        };
        return styles[status] || 'bg-gray-100';
    };

    const filtered = records.filter(r => {
        const matchSearch = r.full_name_ar?.includes(searchQuery) || r.employee_code?.includes(searchQuery);
        const matchStatus = statusFilter === 'all' || r.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const stats = {
        total: records.length,
        present: records.filter(r => r.status === 'حاضر').length,
        late: records.filter(r => r.status === 'متأخر').length,
        absent: records.filter(r => r.status === 'غائب').length,
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3"><Clock className="h-8 w-8 text-blue-600" />سجل البصمة اليومي</h1>
                    <p className="text-gray-500">متابعة حضور وانصراف الموظفين</p>
                </div>

                <div className="grid grid-cols-4 gap-4">
                    <Card className="p-4 bg-blue-50 border-blue-200"><div className="flex items-center gap-3"><UserCheck className="h-8 w-8 text-blue-600" /><div><p className="text-sm text-blue-600">إجمالي</p><p className="text-2xl font-bold text-blue-900">{stats.total}</p></div></div></Card>
                    <Card className="p-4 bg-green-50 border-green-200"><div className="flex items-center gap-3"><UserCheck className="h-8 w-8 text-green-600" /><div><p className="text-sm text-green-600">حاضر</p><p className="text-2xl font-bold text-green-900">{stats.present}</p></div></div></Card>
                    <Card className="p-4 bg-yellow-50 border-yellow-200"><div className="flex items-center gap-3"><AlertTriangle className="h-8 w-8 text-yellow-600" /><div><p className="text-sm text-yellow-600">متأخر</p><p className="text-2xl font-bold text-yellow-900">{stats.late}</p></div></div></Card>
                    <Card className="p-4 bg-red-50 border-red-200"><div className="flex items-center gap-3"><UserX className="h-8 w-8 text-red-600" /><div><p className="text-sm text-red-600">غائب</p><p className="text-2xl font-bold text-red-900">{stats.absent}</p></div></div></Card>
                </div>

                <Card className="p-4">
                    <div className="flex gap-4 flex-wrap">
                        <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-[180px]" />
                        <div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10" /></div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[150px]"><SelectValue placeholder="الحالة" /></SelectTrigger><SelectContent><SelectItem value="all">الكل</SelectItem><SelectItem value="حاضر">حاضر</SelectItem><SelectItem value="متأخر">متأخر</SelectItem><SelectItem value="غائب">غائب</SelectItem></SelectContent></Select>
                        <Button variant="outline"><Download className="h-4 w-4 ml-2" />تصدير</Button>
                    </div>
                </Card>

                <Card>
                    {loading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                        <Table>
                            <TableHeader><TableRow className="bg-gray-50"><TableHead>الكود</TableHead><TableHead>الموظف</TableHead><TableHead>النوع</TableHead><TableHead>الحضور</TableHead><TableHead>الانصراف</TableHead><TableHead>التأخير</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {filtered.map(r => (
                                    <TableRow key={r.id}>
                                        <TableCell className="font-mono">{r.employee_code}</TableCell>
                                        <TableCell className="font-semibold">{r.full_name_ar}</TableCell>
                                        <TableCell><Badge variant="outline">{r.employee_type}</Badge></TableCell>
                                        <TableCell className="font-mono">{r.check_in}</TableCell>
                                        <TableCell className="font-mono">{r.check_out}</TableCell>
                                        <TableCell>{r.late_minutes > 0 ? `${r.late_minutes} د` : '-'}</TableCell>
                                        <TableCell><Badge className={getStatusBadge(r.status)}>{r.status}</Badge></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default HRDailyAttendance;
