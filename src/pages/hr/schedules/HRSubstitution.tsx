/**
 * صفحة بدائل الحصص - نظام الموارد البشرية
 */
import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RefreshCw, Plus, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';

const mockSubstitutions = [
    { id: '1', date: '2024-01-18', period: 'الثانية', class: '4أ', subject: 'رياضيات', original: 'أحمد محمد', substitute: 'محمود علي', reason: 'إجازة مرضية' },
    { id: '2', date: '2024-01-18', period: 'الرابعة', class: '5ب', subject: 'علوم', original: 'سارة أحمد', substitute: 'فاطمة حسن', reason: 'مأمورية' },
];

const HRSubstitution = () => {
    const [substitutions, setSubstitutions] = useState(mockSubstitutions);
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3"><RefreshCw className="h-8 w-8 text-amber-600" />بدائل الحصص</h1>
                        <p className="text-gray-500">إدارة الاستبدالات في حالة غياب المعلم</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild><Button className="bg-amber-600 hover:bg-amber-700"><Plus className="h-4 w-4 ml-2" />إضافة بديل</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>إضافة بديل حصة</DialogTitle></DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div><Label>التاريخ</Label><Input type="date" defaultValue={dateFilter} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><Label>الحصة</Label><Select><SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger><SelectContent><SelectItem value="1">الأولى</SelectItem><SelectItem value="2">الثانية</SelectItem><SelectItem value="3">الثالثة</SelectItem></SelectContent></Select></div>
                                    <div><Label>الفصل</Label><Select><SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger><SelectContent><SelectItem value="4a">4أ</SelectItem><SelectItem value="5b">5ب</SelectItem></SelectContent></Select></div>
                                </div>
                                <div><Label>المعلم الأصلي</Label><Select><SelectTrigger><SelectValue placeholder="اختر المعلم" /></SelectTrigger><SelectContent><SelectItem value="1">أحمد محمد</SelectItem><SelectItem value="2">سارة أحمد</SelectItem></SelectContent></Select></div>
                                <div><Label>المعلم البديل</Label><Select><SelectTrigger><SelectValue placeholder="اختر البديل" /></SelectTrigger><SelectContent><SelectItem value="3">محمود علي</SelectItem><SelectItem value="4">فاطمة حسن</SelectItem></SelectContent></Select></div>
                                <div><Label>السبب</Label><Input placeholder="سبب الاستبدال" /></div>
                            </div>
                            <DialogFooter><Button onClick={() => { setIsDialogOpen(false); toast.success('تم إضافة البديل'); }}>حفظ</Button></DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card className="p-4">
                    <div className="flex gap-4">
                        <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-[200px]" />
                    </div>
                </Card>

                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                                <TableHead>التاريخ</TableHead><TableHead>الحصة</TableHead><TableHead>الفصل</TableHead><TableHead>المادة</TableHead><TableHead>المعلم الأصلي</TableHead><TableHead>البديل</TableHead><TableHead>السبب</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {substitutions.map(s => (
                                <TableRow key={s.id}>
                                    <TableCell>{s.date}</TableCell>
                                    <TableCell><Badge variant="outline">{s.period}</Badge></TableCell>
                                    <TableCell className="font-bold">{s.class}</TableCell>
                                    <TableCell>{s.subject}</TableCell>
                                    <TableCell className="text-red-600">{s.original}</TableCell>
                                    <TableCell className="text-green-600 font-semibold">{s.substitute}</TableCell>
                                    <TableCell><Badge className="bg-amber-100 text-amber-800">{s.reason}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default HRSubstitution;
