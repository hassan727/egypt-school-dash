/**
 * صفحة المخالفات والإنذارات - نظام الموارد البشرية
 */
import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Search, Plus, Eye, FileWarning, AlertCircle, Ban } from 'lucide-react';

const mockViolations = [
    { id: '1', employee: 'محمود علي', type: 'تأخير', date: '2024-01-15', description: 'تأخير متكرر عن الدوام', status: 'مؤكد' },
    { id: '2', employee: 'خالد إبراهيم', type: 'غياب', date: '2024-01-10', description: 'غياب بدون إذن', status: 'قيد المراجعة' },
];

const mockWarnings = [
    { id: '1', employee: 'محمود علي', level: 'إنذار كتابي أول', date: '2024-01-16', reason: 'تأخير متكرر', acknowledged: true },
    { id: '2', employee: 'خالد إبراهيم', level: 'إنذار شفهي', date: '2024-01-12', reason: 'غياب بدون إذن', acknowledged: false },
];

const HRViolations = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = { 'مؤكد': 'bg-red-100 text-red-800', 'قيد المراجعة': 'bg-yellow-100 text-yellow-800', 'مرفوض': 'bg-gray-100 text-gray-800' };
        return styles[status] || 'bg-gray-100';
    };

    const getLevelBadge = (level: string) => {
        if (level.includes('شفهي')) return 'bg-yellow-100 text-yellow-800';
        if (level.includes('أول')) return 'bg-orange-100 text-orange-800';
        if (level.includes('ثاني')) return 'bg-red-100 text-red-800';
        if (level.includes('نهائي')) return 'bg-red-200 text-red-900';
        return 'bg-gray-100';
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3"><AlertTriangle className="h-8 w-8 text-red-600" />المخالفات والإنذارات</h1>
                        <p className="text-gray-500">متابعة المخالفات وإصدار الإنذارات</p>
                    </div>
                    <Button className="bg-red-600 hover:bg-red-700"><Plus className="h-4 w-4 ml-2" />تسجيل مخالفة</Button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <Card className="p-4 bg-red-50"><div className="flex items-center gap-3"><AlertCircle className="h-8 w-8 text-red-600" /><div><p className="text-sm text-red-600">المخالفات</p><p className="text-2xl font-bold">{mockViolations.length}</p></div></div></Card>
                    <Card className="p-4 bg-orange-50"><div className="flex items-center gap-3"><FileWarning className="h-8 w-8 text-orange-600" /><div><p className="text-sm text-orange-600">الإنذارات</p><p className="text-2xl font-bold">{mockWarnings.length}</p></div></div></Card>
                    <Card className="p-4 bg-gray-50"><div className="flex items-center gap-3"><Ban className="h-8 w-8 text-gray-600" /><div><p className="text-sm text-gray-600">الجزاءات</p><p className="text-2xl font-bold">0</p></div></div></Card>
                </div>

                <Card className="p-4"><div className="flex gap-4"><div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10" /></div></div></Card>

                <Tabs defaultValue="violations">
                    <TabsList><TabsTrigger value="violations">المخالفات</TabsTrigger><TabsTrigger value="warnings">الإنذارات</TabsTrigger></TabsList>

                    <TabsContent value="violations">
                        <Card>
                            <Table>
                                <TableHeader><TableRow className="bg-gray-50"><TableHead>الموظف</TableHead><TableHead>النوع</TableHead><TableHead>التاريخ</TableHead><TableHead>الوصف</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {mockViolations.map(v => (
                                        <TableRow key={v.id}>
                                            <TableCell className="font-semibold">{v.employee}</TableCell>
                                            <TableCell><Badge variant="outline">{v.type}</Badge></TableCell>
                                            <TableCell>{v.date}</TableCell>
                                            <TableCell className="text-gray-600">{v.description}</TableCell>
                                            <TableCell><Badge className={getStatusBadge(v.status)}>{v.status}</Badge></TableCell>
                                            <TableCell><Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    </TabsContent>

                    <TabsContent value="warnings">
                        <Card>
                            <Table>
                                <TableHeader><TableRow className="bg-gray-50"><TableHead>الموظف</TableHead><TableHead>المستوى</TableHead><TableHead>التاريخ</TableHead><TableHead>السبب</TableHead><TableHead>الاستلام</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {mockWarnings.map(w => (
                                        <TableRow key={w.id}>
                                            <TableCell className="font-semibold">{w.employee}</TableCell>
                                            <TableCell><Badge className={getLevelBadge(w.level)}>{w.level}</Badge></TableCell>
                                            <TableCell>{w.date}</TableCell>
                                            <TableCell className="text-gray-600">{w.reason}</TableCell>
                                            <TableCell>{w.acknowledged ? <Badge className="bg-green-100 text-green-800">تم الاستلام</Badge> : <Badge variant="outline">لم يستلم</Badge>}</TableCell>
                                            <TableCell><Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
};

export default HRViolations;
