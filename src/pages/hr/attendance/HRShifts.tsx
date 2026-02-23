/**
 * صفحة ضبط الورديات - نظام الموارد البشرية
 */
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Clock, Plus, Edit, Trash2, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useSystemSchoolId } from '@/context/SystemContext';

const HRShifts = () => {
    const schoolId = useSystemSchoolId();
    const [shifts, setShifts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<any>(null);
    const [form, setForm] = useState({
        name: '',
        start_time: '',
        end_time: '',
        grace_period_minutes: 15,
        break_duration_minutes: 30
    });

    useEffect(() => {
        if (schoolId) fetchShifts();
    }, [schoolId]);

    const fetchShifts = async () => {
        if (!schoolId) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('hr_shifts')
            .select('*')
            .eq('school_id', schoolId)
            .order('created_at', { ascending: true });

        if (error) {
            toast.error('حدث خطأ أثناء جلب الورديات');
        } else {
            setShifts(data || []);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!form.name || !form.start_time || !form.end_time) {
            toast.error('يرجى ملء جميع الحقول');
            return;
        }

        const shiftData = {
            name: form.name,
            start_time: form.start_time,
            end_time: form.end_time,
            grace_period_minutes: form.grace_period_minutes,
            end_time: form.end_time,
            grace_period_minutes: form.grace_period_minutes,
            break_duration_minutes: form.break_duration_minutes,
            school_id: schoolId
        };

        if (editingShift) {
            const { error } = await supabase
                .from('hr_shifts')
                .update(shiftData)
                .from('hr_shifts')
                .update(shiftData)
                .eq('id', editingShift.id)
                .eq('school_id', schoolId);

            if (error) {
                toast.error('حدث خطأ أثناء التحديث');
            } else {
                toast.success('تم تحديث الوردية بنجاح');
                fetchShifts();
                setIsDialogOpen(false);
            }
        } else {
            const { error } = await supabase
                .from('hr_shifts')
                .insert([shiftData]);

            if (error) {
                toast.error('حدث خطأ أثناء الإضافة');
            } else {
                toast.success('تم إضافة الوردية بنجاح');
                fetchShifts();
                setIsDialogOpen(false);
            }
        }

        setForm({ name: '', start_time: '', end_time: '', grace_period_minutes: 15, break_duration_minutes: 30 });
        setEditingShift(null);
    };

    const handleEdit = (shift: any) => {
        setEditingShift(shift);
        setForm({
            name: shift.name,
            start_time: shift.start_time,
            end_time: shift.end_time,
            grace_period_minutes: shift.grace_period_minutes,
            break_duration_minutes: shift.break_duration_minutes
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه الوردية؟')) return;

        const { error } = await supabase
            .from('hr_shifts')
            .delete()
            .from('hr_shifts')
            .delete()
            .eq('id', id)
            .eq('school_id', schoolId);

        if (error) {
            toast.error('حدث خطأ أثناء الحذف');
        } else {
            toast.success('تم حذف الوردية');
            fetchShifts();
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Clock className="h-8 w-8 text-purple-600" />
                            ضبط الورديات
                        </h1>
                        <p className="text-gray-500">إدارة أوقات العمل والورديات</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-purple-600 hover:bg-purple-700">
                                <Plus className="h-4 w-4 ml-2" />
                                إضافة وردية
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingShift ? 'تعديل وردية' : 'إضافة وردية جديدة'}</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div>
                                    <Label>اسم الوردية</Label>
                                    <Input
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="مثال: الوردية الصباحية"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>وقت البداية</Label>
                                        <Input
                                            type="time"
                                            value={form.start_time}
                                            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>وقت النهاية</Label>
                                        <Input
                                            type="time"
                                            value={form.end_time}
                                            onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>فترة السماح (دقيقة)</Label>
                                        <Input
                                            type="number"
                                            value={form.grace_period_minutes}
                                            onChange={(e) => setForm({ ...form, grace_period_minutes: +e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>فترة الراحة (دقيقة)</Label>
                                        <Input
                                            type="number"
                                            value={form.break_duration_minutes}
                                            onChange={(e) => setForm({ ...form, break_duration_minutes: +e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSave}>
                                    <Save className="h-4 w-4 ml-2" />
                                    حفظ
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead>الوردية</TableHead>
                                    <TableHead>البداية</TableHead>
                                    <TableHead>النهاية</TableHead>
                                    <TableHead>السماح</TableHead>
                                    <TableHead>الراحة</TableHead>
                                    <TableHead>إجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {shifts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                            لا توجد ورديات معرفة حالياً
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    shifts.map(s => (
                                        <TableRow key={s.id}>
                                            <TableCell className="font-semibold">{s.name}</TableCell>
                                            <TableCell><Badge variant="outline">{s.start_time}</Badge></TableCell>
                                            <TableCell><Badge variant="outline">{s.end_time}</Badge></TableCell>
                                            <TableCell>{s.grace_period_minutes} دقيقة</TableCell>
                                            <TableCell>{s.break_duration_minutes} دقيقة</TableCell>
                                            <TableCell className="flex gap-2">
                                                <Button size="sm" variant="ghost" onClick={() => handleEdit(s)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(s.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default HRShifts;
