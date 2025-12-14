/**
 * صفحة التدريب - نظام الموارد البشرية
 */
import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GraduationCap, Search, Plus, Users, Calendar, Award, Eye } from 'lucide-react';

const mockCourses = [
    { id: '1', name: 'دورة أساليب التدريس الحديثة', provider: 'وزارة التعليم', start: '2024-02-01', end: '2024-02-05', participants: 15, status: 'مجدول' },
    { id: '2', name: 'دورة الإسعافات الأولية', provider: 'الهلال الأحمر', start: '2024-01-15', end: '2024-01-16', participants: 25, status: 'مكتمل' },
    { id: '3', name: 'تطوير المهارات الإدارية', provider: 'مركز التطوير', start: '2024-01-20', end: '2024-01-22', participants: 8, status: 'جاري' },
];

const HRTraining = () => {
    const [courses] = useState(mockCourses);
    const [searchQuery, setSearchQuery] = useState('');

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = { 'مجدول': 'bg-blue-100 text-blue-800', 'جاري': 'bg-yellow-100 text-yellow-800', 'مكتمل': 'bg-green-100 text-green-800', 'ملغى': 'bg-red-100 text-red-800' };
        return styles[status] || 'bg-gray-100';
    };

    const stats = { total: courses.length, completed: courses.filter(c => c.status === 'مكتمل').length, ongoing: courses.filter(c => c.status === 'جاري').length, scheduled: courses.filter(c => c.status === 'مجدول').length };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3"><GraduationCap className="h-8 w-8 text-cyan-600" />التدريب والتطوير</h1>
                        <p className="text-gray-500">إدارة الدورات التدريبية للموظفين</p>
                    </div>
                    <Button className="bg-cyan-600 hover:bg-cyan-700"><Plus className="h-4 w-4 ml-2" />دورة جديدة</Button>
                </div>

                <div className="grid grid-cols-4 gap-4">
                    <Card className="p-4 bg-blue-50"><div className="flex items-center gap-3"><GraduationCap className="h-8 w-8 text-blue-600" /><div><p className="text-sm text-blue-600">إجمالي الدورات</p><p className="text-2xl font-bold">{stats.total}</p></div></div></Card>
                    <Card className="p-4 bg-green-50"><div className="flex items-center gap-3"><Award className="h-8 w-8 text-green-600" /><div><p className="text-sm text-green-600">مكتملة</p><p className="text-2xl font-bold">{stats.completed}</p></div></div></Card>
                    <Card className="p-4 bg-yellow-50"><div className="flex items-center gap-3"><Users className="h-8 w-8 text-yellow-600" /><div><p className="text-sm text-yellow-600">جارية</p><p className="text-2xl font-bold">{stats.ongoing}</p></div></div></Card>
                    <Card className="p-4 bg-indigo-50"><div className="flex items-center gap-3"><Calendar className="h-8 w-8 text-indigo-600" /><div><p className="text-sm text-indigo-600">مجدولة</p><p className="text-2xl font-bold">{stats.scheduled}</p></div></div></Card>
                </div>

                <Card className="p-4"><div className="flex gap-4"><div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10" /></div></div></Card>

                <Card>
                    <Table>
                        <TableHeader><TableRow className="bg-gray-50"><TableHead>الدورة</TableHead><TableHead>المزود</TableHead><TableHead>البداية</TableHead><TableHead>النهاية</TableHead><TableHead>المشاركون</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {courses.map(c => (
                                <TableRow key={c.id}>
                                    <TableCell className="font-semibold">{c.name}</TableCell>
                                    <TableCell>{c.provider}</TableCell>
                                    <TableCell>{c.start}</TableCell>
                                    <TableCell>{c.end}</TableCell>
                                    <TableCell className="font-bold">{c.participants}</TableCell>
                                    <TableCell><Badge className={getStatusBadge(c.status)}>{c.status}</Badge></TableCell>
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

export default HRTraining;
