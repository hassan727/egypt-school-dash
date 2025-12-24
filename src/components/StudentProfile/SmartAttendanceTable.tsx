import { useState } from 'react';
import { format, getDaysInMonth, isSameDay, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AttendanceRecord } from '@/types/student';
import {
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    Edit2,
    Paperclip,
    AlertTriangle
} from 'lucide-react';

interface SmartAttendanceTableProps {
    year: number;
    month: number; // 0-11
    records: AttendanceRecord[];
    onUpdateRecord: (date: string, data: Partial<AttendanceRecord>) => Promise<void>;
    isLoading?: boolean;
}

export function SmartAttendanceTable({
    year,
    month,
    records,
    onUpdateRecord,
    isLoading = false
}: SmartAttendanceTableProps) {
    const [editingDate, setEditingDate] = useState<Date | null>(null);
    const [editForm, setEditForm] = useState<Partial<AttendanceRecord>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Generate days for the month
    const daysInMonth = getDaysInMonth(new Date(year, month));
    const days = Array.from({ length: daysInMonth }, (_, i) => {
        return new Date(year, month, i + 1);
    });

    const getRecordForDay = (date: Date) => {
        return records.find(r => isSameDay(parseISO(r.date), date));
    };

    const handleEditClick = (date: Date, record?: AttendanceRecord) => {
        setEditingDate(date);
        setEditForm(record || {
            status: 'حاضر',
            notes: '',
            attachment_url: ''
        });
    };

    const handleSave = async () => {
        if (!editingDate) return;

        try {
            setIsSaving(true);
            const dateStr = format(editingDate, 'yyyy-MM-dd');
            await onUpdateRecord(dateStr, editForm);
            setEditingDate(null);
        } catch (error) {
            console.error('Failed to save record', error);
        } finally {
            setIsSaving(false);
        }
    };

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'حاضر': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'غائب': return <XCircle className="h-5 w-5 text-red-500" />;
            case 'متأخر': return <Clock className="h-5 w-5 text-yellow-500" />;
            case 'معذور': return <FileText className="h-5 w-5 text-purple-500" />;
            default: return <span className="text-gray-300">-</span>;
        }
    };

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case 'حاضر': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">حاضر</Badge>;
            case 'غائب': return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">غائب</Badge>;
            case 'متأخر': return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">متأخر</Badge>;
            case 'معذور': return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">معذور</Badge>;
            default: return <span className="text-gray-400 text-sm">لم يسجل</span>;
        }
    };

    return (
        <>
            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-blue-100">
                            <tr>
                                <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">التاريخ</th>
                                <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">اليوم</th>
                                <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">الحالة</th>
                                <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">ملاحظات / مرفقات</th>
                                <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">الإجراء</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {days.map((date) => {
                                const record = getRecordForDay(date);
                                const isWeekend = date.getDay() === 5 || date.getDay() === 6; // Fri/Sat

                                return (
                                    <tr
                                        key={date.toISOString()}
                                        className={`hover:bg-blue-50 transition-colors ${isWeekend ? 'bg-gray-50/50' : 'bg-white'}`}
                                    >
                                        <td className="px-4 py-3 border border-gray-200 font-medium text-gray-900">
                                            {format(date, 'd MMMM', { locale: ar })}
                                        </td>
                                        <td className="px-4 py-3 border border-gray-200 text-gray-600">
                                            {format(date, 'EEEE', { locale: ar })}
                                        </td>
                                        <td className="px-4 py-3 border border-gray-200">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(record?.status)}
                                                {getStatusBadge(record?.status)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 border border-gray-200">
                                            <div className="flex items-center gap-2 text-gray-500">
                                                {record?.notes && (
                                                    <span className="truncate max-w-[150px]" title={record.notes}>
                                                        {record.notes}
                                                    </span>
                                                )}
                                                {record?.attachment_url && (
                                                    <Paperclip className="h-4 w-4 text-blue-500" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 border border-gray-200">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEditClick(date, record)}
                                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                            >
                                                <Edit2 className="h-4 w-4 ml-1" />
                                                تعديل
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Dialog open={!!editingDate} onOpenChange={(open) => !open && setEditingDate(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>تعديل حالة الحضور</DialogTitle>
                        <DialogDescription>
                            {editingDate && format(editingDate, 'EEEE, d MMMM yyyy', { locale: ar })}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>الحالة</Label>
                            <Select
                                value={editForm.status}
                                onValueChange={(val) => setEditForm({ ...editForm, status: val as any })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر الحالة" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="حاضر">✅ حاضر</SelectItem>
                                    <SelectItem value="غائب">❌ غائب</SelectItem>
                                    <SelectItem value="متأخر">⏱️ متأخر</SelectItem>
                                    <SelectItem value="معذور">🏥 معذور</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {editForm.status === 'معذور' && (
                            <div className="p-3 bg-blue-50 rounded-md flex gap-2 text-sm text-blue-700">
                                <AlertTriangle className="h-4 w-4" />
                                <span>سيتم طلب إرفاق مستند للعذر الطبي/القهري</span>
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label>ملاحظات</Label>
                            <Textarea
                                value={editForm.notes || ''}
                                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                placeholder="أضف ملاحظات..."
                            />
                        </div>

                        {editForm.status === 'معذور' && (
                            <div className="grid gap-2">
                                <Label>رابط المستند (اختياري)</Label>
                                <Input
                                    value={editForm.attachment_url || ''}
                                    onChange={(e) => setEditForm({ ...editForm, attachment_url: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingDate(null)}>إلغاء</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
