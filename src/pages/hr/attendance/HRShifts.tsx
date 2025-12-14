/**
 * صفحة ضبط الورديات - نظام الموارد البشرية
 */
import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Clock, Plus, Edit, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

const defaultShifts = [
    { id: '1', name: 'الوردية الصباحية', start_time: '07:30', end_time: '14:30', grace_period: 15, break_duration: 30 },
    { id: '2', name: 'الوردية المسائية', start_time: '13:00', end_time: '20:00', grace_period: 10, break_duration: 30 },
    { id: '3', name: 'الدوام المرن', start_time: '08:00', end_time: '16:00', grace_period: 30, break_duration: 60 },
];

const HRShifts = () => {
    const [shifts, setShifts] = useState(defaultShifts);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<any>(null);
    const [form, setForm] = useState({ name: '', start_time: '', end_time: '', grace_period: 15, break_duration: 30 });

    const handleSave = () => {
        if (!form.name || !form.start_time || !form.end_time) {
            toast.error('يرجى ملء جميع الحقول');
            return;
        }
        if (editingShift) {
            setShifts(shifts.map(s => s.id === editingShift.id ? { ...s, ...form } : s));
            toast.success('تم تحديث الوردية');
        } else {
            setShifts([...shifts, { id: Date.now().toString(), ...form }]);
            toast.success('تم إضافة الوردية');
        }
        setIsDialogOpen(false);
        setForm({ name: '', start_time: '', end_time: '', grace_period: 15, break_duration: 30 });
        setEditingShift(null);
    };

    const handleEdit = (shift: any) => {
        setEditingShift(shift);
        setForm(shift);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        setShifts(shifts.filter(s => s.id !== id));
        toast.success('تم حذف الوردية');
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3"><Clock className="h-8 w-8 text-purple-600" />ضبط الورديات</h1>
                        <p className="text-gray-500">إدارة أوقات العمل والورديات</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild><Button className="bg-purple-600 hover:bg-purple-700"><Plus className="h-4 w-4 ml-2" />إضافة وردية</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>{editingShift ? 'تعديل وردية' : 'إضافة وردية جديدة'}</DialogTitle></DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div><Label>اسم الوردية</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: الوردية الصباحية" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><Label>وقت البداية</Label><Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
                                    <div><Label>وقت النهاية</Label><Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><Label>فترة السماح (دقيقة)</Label><Input type="number" value={form.grace_period} onChange={(e) => setForm({ ...form, grace_period: +e.target.value })} /></div>
                                    <div><Label>فترة الراحة (دقيقة)</Label><Input type="number" value={form.break_duration} onChange={(e) => setForm({ ...form, break_duration: +e.target.value })} /></div>
                                </div>
                            </div>
                            <DialogFooter><Button onClick={handleSave}><Save className="h-4 w-4 ml-2" />حفظ</Button></DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <Table>
                        <TableHeader><TableRow className="bg-gray-50"><TableHead>الوردية</TableHead><TableHead>البداية</TableHead><TableHead>النهاية</TableHead><TableHead>السماح</TableHead><TableHead>الراحة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {shifts.map(s => (
                                <TableRow key={s.id}>
                                    <TableCell className="font-semibold">{s.name}</TableCell>
                                    <TableCell><Badge variant="outline">{s.start_time}</Badge></TableCell>
                                    <TableCell><Badge variant="outline">{s.end_time}</Badge></TableCell>
                                    <TableCell>{s.grace_period} دقيقة</TableCell>
                                    <TableCell>{s.break_duration} دقيقة</TableCell>
                                    <TableCell className="flex gap-2">
                                        <Button size="sm" variant="ghost" onClick={() => handleEdit(s)}><Edit className="h-4 w-4" /></Button>
                                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4" /></Button>
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

export default HRShifts;
