import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuditTrailEntry } from '@/types/student';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface AuditTrailSectionProps {
    data?: AuditTrailEntry[];
    onSave?: (data: AuditTrailEntry[]) => Promise<void>;
    isReadOnly?: boolean;
}

/**
 * قسم سجل التغييرات (Audit Trail)
 * يحتوي على جميع التغييرات التي تمت على بيانات الطالب
 */
export function AuditTrailSection({
    data,
    onSave,
    isReadOnly = false,
}: AuditTrailSectionProps) {
    const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>(data || []);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(!isReadOnly);
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

    const changeTypeOptions = [
        'بيانات شخصية',
        'قيد دراسي',
        'ولي أمر',
        'أم',
        'جهات موثوقة',
        'مصروفات',
        'بيانات أكاديمية',
        'بيانات سلوكية',
        'بيانات إدارية',
    ];

    const handleAddEntry = () => {
        const newEntry: AuditTrailEntry = {
            changeType: 'بيانات شخصية',
            changedBy: '',
            changeReason: '',
            createdAt: new Date().toISOString(),
        };
        setAuditTrail([...auditTrail, newEntry]);
    };

    const handleUpdateEntry = (
        index: number,
        field: keyof AuditTrailEntry,
        value: any
    ) => {
        const updated = [...auditTrail];
        updated[index] = {
            ...updated[index],
            [field]: value,
        };
        setAuditTrail(updated);
    };

    const handleDeleteEntry = (index: number) => {
        setAuditTrail(auditTrail.filter((_, i) => i !== index));
    };

    const toggleExpand = (index: number) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedItems(newExpanded);
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            if (onSave) {
                await onSave(auditTrail);
            }
            setIsEditing(false);
        } catch (error) {
            console.error('خطأ في حفظ سجل التغييرات:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateString;
        }
    };

    return (
        <Card className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">📝 سجل التغييرات</h2>
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

            {/* التنبيه */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                    ℹ️ يتم تسجيل جميع التغييرات على بيانات الطالب تلقائياً لأغراض المراجعة والمتابعة
                </p>
            </div>

            {/* قائمة التغييرات */}
            <div className="space-y-3 mb-6">
                {auditTrail.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        لا توجد تغييرات مسجلة حالياً
                    </div>
                ) : (
                    auditTrail.map((entry, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                            {/* رأس العنصر */}
                            <div
                                onClick={() => toggleExpand(index)}
                                className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <span className="text-lg">
                                        {expandedItems.has(index) ? (
                                            <ChevronUp className="h-5 w-5" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5" />
                                        )}
                                    </span>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-800">
                                            {entry.changeType || 'تغيير'}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            بواسطة: {entry.changedBy || '-'} | {formatDate(entry.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* محتوى العنصر */}
                            {expandedItems.has(index) && (
                                <div className="border-t border-gray-200 p-4 bg-white">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* نوع التغيير */}
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                                                نوع التغيير
                                            </Label>
                                            <select
                                                value={entry.changeType || ''}
                                                onChange={(e) =>
                                                    handleUpdateEntry(index, 'changeType', e.target.value)
                                                }
                                                disabled={isReadOnly || !isEditing}
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                            >
                                                <option value="">اختر نوع التغيير</option>
                                                {changeTypeOptions.map((type) => (
                                                    <option key={type} value={type}>
                                                        {type}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* من قام بالتغيير */}
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                                                من قام بالتغيير
                                            </Label>
                                            <Input
                                                value={entry.changedBy || ''}
                                                onChange={(e) =>
                                                    handleUpdateEntry(index, 'changedBy', e.target.value)
                                                }
                                                disabled={isReadOnly || !isEditing}
                                                placeholder="اسم الموظف"
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                            />
                                        </div>

                                        {/* تاريخ التغيير */}
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                                                تاريخ التغيير
                                            </Label>
                                            <Input
                                                type="datetime-local"
                                                value={
                                                    entry.createdAt
                                                        ? new Date(entry.createdAt)
                                                            .toISOString()
                                                            .slice(0, 16)
                                                        : ''
                                                }
                                                onChange={(e) => {
                                                    const date = new Date(e.target.value);
                                                    handleUpdateEntry(index, 'createdAt', date.toISOString());
                                                }}
                                                disabled={isReadOnly || !isEditing}
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>

                                    {/* سبب التغيير */}
                                    <div className="mt-4">
                                        <Label className="block text-sm font-medium text-gray-700 mb-2">
                                            سبب التغيير
                                        </Label>
                                        <textarea
                                            value={entry.changeReason || ''}
                                            onChange={(e) =>
                                                handleUpdateEntry(index, 'changeReason', e.target.value)
                                            }
                                            disabled={isReadOnly || !isEditing}
                                            placeholder="اشرح سبب التغيير"
                                            rows={3}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                    </div>

                                    {/* الحقول المتغيرة */}
                                    {entry.changedFields && Object.keys(entry.changedFields).length > 0 && (
                                        <div className="mt-4">
                                            <h4 className="font-semibold text-gray-700 mb-3">
                                                الحقول المتغيرة:
                                            </h4>
                                            <div className="space-y-2">
                                                {Object.entries(entry.changedFields).map(
                                                    ([fieldName, values]) => (
                                                        <div
                                                            key={fieldName}
                                                            className="bg-gray-50 p-3 rounded border border-gray-200"
                                                        >
                                                            <p className="font-medium text-gray-700">
                                                                {fieldName}
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                من: <span className="font-mono">{JSON.stringify(values.oldValue)}</span>
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                إلى: <span className="font-mono">{JSON.stringify(values.newValue)}</span>
                                                            </p>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* حذف */}
                                    {isEditing && !isReadOnly && (
                                        <div className="mt-4 flex justify-end">
                                            <Button
                                                onClick={() => handleDeleteEntry(index)}
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                حذف التغيير
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* أزرار التحكم */}
            {isEditing && !isReadOnly && (
                <div className="flex gap-3">
                    <Button
                        onClick={handleAddEntry}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        إضافة تغيير جديد
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                    </Button>
                </div>
            )}
        </Card>
    );
}