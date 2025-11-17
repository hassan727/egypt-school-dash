import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AttendanceRecord } from '@/types/student';
import { Plus, Trash2 } from 'lucide-react';
import { getEgyptianDateString } from '@/utils/helpers';

interface AttendanceRecordsSectionProps {
    data?: AttendanceRecord[];
    onSave?: (data: AttendanceRecord[]) => Promise<void>;
    isReadOnly?: boolean;
}

/**
 * قسم سجل الحضور
 * يحتوي على سجل حضور وغياب الطالب
 */
export function AttendanceRecordsSection({
    data,
    onSave,
    isReadOnly = false,
}: AttendanceRecordsSectionProps) {
    const [records, setRecords] = useState<AttendanceRecord[]>(data || []);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(!isReadOnly);

    const handleAddRecord = () => {
        const newRecord: AttendanceRecord = {
            date: getEgyptianDateString(),
            status: 'حاضر',
            checkInTime: '08:00',
            checkOutTime: '14:00',
            notes: '',
        };
        setRecords([...records, newRecord]);
    };

    const handleUpdateRecord = (
        index: number,
        field: keyof AttendanceRecord,
        value: any
    ) => {
        const updated = [...records];
        updated[index] = {
            ...updated[index],
            [field]: value,
        };
        setRecords(updated);
    };

    const handleDeleteRecord = (index: number) => {
        setRecords(records.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            if (onSave) {
                await onSave(records);
            }
            setIsEditing(false);
        } catch (error) {
            console.error('خطأ في حفظ سجل الحضور:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const getAttendanceStats = () => {
        const stats = {
            present: records.filter((r) => r.status === 'حاضر').length,
            absent: records.filter((r) => r.status === 'غائب').length,
            late: records.filter((r) => r.status === 'متأخر').length,
            excused: records.filter((r) => r.status === 'معذور').length,
            total: records.length,
        };
        const attendanceRate =
            stats.total > 0
                ? (((stats.present + stats.excused) / stats.total) * 100).toFixed(1)
                : 0;
        return { ...stats, attendanceRate };
    };

    const stats = getAttendanceStats();

    return (
        <Card className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">📅 سجل الحضور والغياب</h2>
                {!isReadOnly && (
                    <Button
                        onClick={() => setIsEditing(!isEditing)}
                        variant="outline"
                        size="sm"
                    >
                        {isEditing ? 'إلغاء' : 'تعديل'}
                    </Button>
                )}
            </div>

            {/* إحصائيات الحضور */}
            {stats.total > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-700">حاضر</p>
                        <p className="text-2xl font-bold text-green-900">{stats.present}</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-700">غائب</p>
                        <p className="text-2xl font-bold text-red-900">{stats.absent}</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-700">متأخر</p>
                        <p className="text-2xl font-bold text-yellow-900">{stats.late}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-700">معذور</p>
                        <p className="text-2xl font-bold text-blue-900">{stats.excused}</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <p className="text-sm text-purple-700">نسبة الحضور</p>
                        <p className="text-2xl font-bold text-purple-900">{stats.attendanceRate}%</p>
                    </div>
                </div>
            )}

            {/* جدول السجلات */}
            <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-300 bg-gray-100">
                            <th className="text-right p-3 font-semibold">التاريخ</th>
                            <th className="text-right p-3 font-semibold">الحالة</th>
                            <th className="text-right p-3 font-semibold">وقت الحضور</th>
                            <th className="text-right p-3 font-semibold">وقت المغادرة</th>
                            <th className="text-right p-3 font-semibold">ملاحظات</th>
                            {isEditing && !isReadOnly && (
                                <th className="text-right p-3 font-semibold">إجراءات</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {records.length === 0 ? (
                            <tr>
                                <td colSpan={isEditing ? 6 : 5} className="text-center py-8 text-gray-500">
                                    لا توجد سجلات حضور مسجلة حالياً
                                </td>
                            </tr>
                        ) : (
                            records.map((record, index) => (
                                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="p-3">
                                        {isEditing && !isReadOnly ? (
                                            <Input
                                                type="date"
                                                value={record.date || ''}
                                                onChange={(e) =>
                                                    handleUpdateRecord(index, 'date', e.target.value)
                                                }
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                            />
                                        ) : (
                                            record.date
                                        )}
                                    </td>
                                    <td className="p-3">
                                        {isEditing && !isReadOnly ? (
                                            <select
                                                value={record.status || 'حاضر'}
                                                onChange={(e) =>
                                                    handleUpdateRecord(
                                                        index,
                                                        'status',
                                                        e.target.value as any
                                                    )
                                                }
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                            >
                                                <option>حاضر</option>
                                                <option>غائب</option>
                                                <option>متأخر</option>
                                                <option>معذور</option>
                                            </select>
                                        ) : (
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${record.status === 'حاضر'
                                                        ? 'bg-green-100 text-green-800'
                                                        : record.status === 'غائب'
                                                            ? 'bg-red-100 text-red-800'
                                                            : record.status === 'متأخر'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : 'bg-blue-100 text-blue-800'
                                                    }`}
                                            >
                                                {record.status}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        {isEditing && !isReadOnly ? (
                                            <Input
                                                type="time"
                                                value={record.checkInTime || ''}
                                                onChange={(e) =>
                                                    handleUpdateRecord(index, 'checkInTime', e.target.value)
                                                }
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                            />
                                        ) : (
                                            record.checkInTime || '-'
                                        )}
                                    </td>
                                    <td className="p-3">
                                        {isEditing && !isReadOnly ? (
                                            <Input
                                                type="time"
                                                value={record.checkOutTime || ''}
                                                onChange={(e) =>
                                                    handleUpdateRecord(index, 'checkOutTime', e.target.value)
                                                }
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                            />
                                        ) : (
                                            record.checkOutTime || '-'
                                        )}
                                    </td>
                                    <td className="p-3">
                                        {isEditing && !isReadOnly ? (
                                            <Input
                                                value={record.notes || ''}
                                                onChange={(e) =>
                                                    handleUpdateRecord(index, 'notes', e.target.value)
                                                }
                                                placeholder="ملاحظات"
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                            />
                                        ) : (
                                            record.notes || '-'
                                        )}
                                    </td>
                                    {isEditing && !isReadOnly && (
                                        <td className="p-3">
                                            <Button
                                                onClick={() => handleDeleteRecord(index)}
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* أزرار التحكم */}
            {isEditing && !isReadOnly && (
                <div className="flex gap-3">
                    <Button
                        onClick={handleAddRecord}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        إضافة سجل جديد
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isSaving ? 'جاري الحفظ...' : 'حفظ السجلات'}
                    </Button>
                </div>
            )}
        </Card>
    );
}