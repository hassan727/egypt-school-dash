import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { STUDENT_OPTIONS } from '@/data/studentConstants';
import { getEgyptianDateString } from '@/utils/helpers';

interface AcademicSectionProps {
    data?: {
        currentGPA: number;
        totalMarks: number;
        averageMarks: number;
        passingStatus: 'ناجح' | 'راسب' | 'معلق';
        academicNotes: string;
        strengths: string;
        weaknesses: string;
        lastExamDate: string;
    };
    onSave?: (data: any) => Promise<void>;
    isReadOnly?: boolean;
}

/**
 * قسم البيانات الأكاديمية
 * يحتوي على المعدل التراكمي، الدرجات، والملاحظات الأكاديمية
 */
export function AcademicSection({ data, onSave, isReadOnly = false }: AcademicSectionProps) {
    const [formData, setFormData] = useState(
        data || {
            currentGPA: 0,
            totalMarks: 0,
            averageMarks: 0,
            passingStatus: 'ناجح',
            academicNotes: '',
            strengths: '',
            weaknesses: '',
            lastExamDate: getEgyptianDateString(),
        }
    );

    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(!isReadOnly);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            if (onSave) {
                await onSave(formData);
            }
            setIsEditing(false);
        } catch (error) {
            console.error('خطأ في حفظ البيانات:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            {/* رأس القسم */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">البيانات الأكاديمية</h2>
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

            {/* شبكة الحقول */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* المعدل التراكمي */}
                <div>
                    <Label htmlFor="currentGPA" className="block text-sm font-medium text-gray-700 mb-2">
                        المعدل التراكمي (GPA)
                    </Label>
                    <Input
                        id="currentGPA"
                        type="number"
                        step="0.01"
                        min="0"
                        max="4"
                        value={formData.currentGPA}
                        onChange={(e) => handleChange('currentGPA', parseFloat(e.target.value))}
                        placeholder="أدخل المعدل التراكمي"
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* إجمالي الدرجات */}
                <div>
                    <Label htmlFor="totalMarks" className="block text-sm font-medium text-gray-700 mb-2">
                        إجمالي الدرجات
                    </Label>
                    <Input
                        id="totalMarks"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.totalMarks}
                        onChange={(e) => handleChange('totalMarks', parseFloat(e.target.value))}
                        placeholder="أدخل إجمالي الدرجات"
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* متوسط الدرجات */}
                <div>
                    <Label htmlFor="averageMarks" className="block text-sm font-medium text-gray-700 mb-2">
                        متوسط الدرجات
                    </Label>
                    <Input
                        id="averageMarks"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.averageMarks}
                        onChange={(e) => handleChange('averageMarks', parseFloat(e.target.value))}
                        placeholder="أدخل متوسط الدرجات"
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* حالة النجاح */}
                <div>
                    <Label htmlFor="passingStatus" className="block text-sm font-medium text-gray-700 mb-2">
                        حالة النجاح
                    </Label>
                    <Select value={formData.passingStatus} onValueChange={(value) => handleChange('passingStatus', value)} disabled={isReadOnly || !isEditing}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر حالة النجاح" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ناجح">ناجح</SelectItem>
                            <SelectItem value="راسب">راسب</SelectItem>
                            <SelectItem value="معلق">معلق</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* تاريخ آخر امتحان */}
                <div>
                    <Label htmlFor="lastExamDate" className="block text-sm font-medium text-gray-700 mb-2">
                        تاريخ آخر امتحان
                    </Label>
                    <Input
                        id="lastExamDate"
                        type="date"
                        value={formData.lastExamDate}
                        onChange={(e) => handleChange('lastExamDate', e.target.value)}
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* المميزات الأكاديمية */}
                <div className="md:col-span-2">
                    <Label htmlFor="strengths" className="block text-sm font-medium text-gray-700 mb-2">
                        المميزات الأكاديمية
                    </Label>
                    <Textarea
                        id="strengths"
                        value={formData.strengths}
                        onChange={(e) => handleChange('strengths', e.target.value)}
                        placeholder="أدخل المميزات الأكاديمية"
                        disabled={isReadOnly || !isEditing}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* نقاط الضعف الأكاديمية */}
                <div className="md:col-span-2">
                    <Label htmlFor="weaknesses" className="block text-sm font-medium text-gray-700 mb-2">
                        نقاط الضعف الأكاديمية
                    </Label>
                    <Textarea
                        id="weaknesses"
                        value={formData.weaknesses}
                        onChange={(e) => handleChange('weaknesses', e.target.value)}
                        placeholder="أدخل نقاط الضعف الأكاديمية"
                        disabled={isReadOnly || !isEditing}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* الملاحظات الأكاديمية */}
                <div className="md:col-span-2">
                    <Label htmlFor="academicNotes" className="block text-sm font-medium text-gray-700 mb-2">
                        الملاحظات الأكاديمية
                    </Label>
                    <Textarea
                        id="academicNotes"
                        value={formData.academicNotes}
                        onChange={(e) => handleChange('academicNotes', e.target.value)}
                        placeholder="أدخل الملاحظات الأكاديمية"
                        disabled={isReadOnly || !isEditing}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* أزرار الحفظ */}
            {isEditing && !isReadOnly && (
                <div className="flex gap-3 mt-6 justify-end">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                        إلغاء
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                        {isSaving ? 'جاري الحفظ...' : 'حفظ البيانات'}
                    </Button>
                </div>
            )}
        </Card>
    );
}