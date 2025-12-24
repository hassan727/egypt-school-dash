import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { getEgyptianDateString } from '@/utils/helpers';

interface BehavioralSectionProps {
    data?: {
        conductRating: 'ممتاز' | 'جيد جداً' | 'جيد' | 'مقبول' | 'ضعيف';
        attendanceRate: number;
        absences: number;
        tardiness: number;
        disciplinaryIssues: boolean;
        disciplinaryDetails: string;
        participationLevel: 'عالي' | 'متوسط' | 'منخفض';
        classroomBehavior: string;
        socialInteraction: string;
        counselorNotes: string;
        lastIncidentDate: string;
    };
    onSave?: (data: any) => Promise<void>;
    isReadOnly?: boolean;
}

/**
 * قسم البيانات السلوكية
 * يحتوي على التقييم السلوكي والحضور والمشاكل التأديبية
 */
export function BehavioralSection({ data, onSave, isReadOnly = false }: BehavioralSectionProps) {
    const [formData, setFormData] = useState(
        data || {
            conductRating: 'جيد',
            attendanceRate: 95,
            absences: 0,
            tardiness: 0,
            disciplinaryIssues: false,
            disciplinaryDetails: '',
            participationLevel: 'متوسط',
            classroomBehavior: '',
            socialInteraction: '',
            counselorNotes: '',
            lastIncidentDate: getEgyptianDateString(),
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
                <h2 className="text-2xl font-bold text-gray-800">البيانات السلوكية</h2>
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
                {/* تقييم السلوك */}
                <div>
                    <Label htmlFor="conductRating" className="block text-sm font-medium text-gray-700 mb-2">
                        تقييم السلوك
                    </Label>
                    <Select value={formData.conductRating} onValueChange={(value) => handleChange('conductRating', value)} disabled={isReadOnly || !isEditing}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر التقييم" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ممتاز">ممتاز</SelectItem>
                            <SelectItem value="جيد جداً">جيد جداً</SelectItem>
                            <SelectItem value="جيد">جيد</SelectItem>
                            <SelectItem value="مقبول">مقبول</SelectItem>
                            <SelectItem value="ضعيف">ضعيف</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* نسبة الحضور */}
                <div>
                    <Label htmlFor="attendanceRate" className="block text-sm font-medium text-gray-700 mb-2">
                        نسبة الحضور (%)
                    </Label>
                    <Input
                        id="attendanceRate"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={formData.attendanceRate}
                        onChange={(e) => handleChange('attendanceRate', parseFloat(e.target.value))}
                        placeholder="أدخل نسبة الحضور"
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* عدد الغيابات */}
                <div>
                    <Label htmlFor="absences" className="block text-sm font-medium text-gray-700 mb-2">
                        عدد الغيابات
                    </Label>
                    <Input
                        id="absences"
                        type="number"
                        min="0"
                        value={formData.absences}
                        onChange={(e) => handleChange('absences', parseInt(e.target.value))}
                        placeholder="أدخل عدد الغيابات"
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* عدد التأخرات */}
                <div>
                    <Label htmlFor="tardiness" className="block text-sm font-medium text-gray-700 mb-2">
                        عدد التأخرات
                    </Label>
                    <Input
                        id="tardiness"
                        type="number"
                        min="0"
                        value={formData.tardiness}
                        onChange={(e) => handleChange('tardiness', parseInt(e.target.value))}
                        placeholder="أدخل عدد التأخرات"
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* مستوى المشاركة */}
                <div>
                    <Label htmlFor="participationLevel" className="block text-sm font-medium text-gray-700 mb-2">
                        مستوى المشاركة
                    </Label>
                    <Select value={formData.participationLevel} onValueChange={(value) => handleChange('participationLevel', value)} disabled={isReadOnly || !isEditing}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر مستوى المشاركة" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="عالي">عالي</SelectItem>
                            <SelectItem value="متوسط">متوسط</SelectItem>
                            <SelectItem value="منخفض">منخفض</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* تاريخ آخر حادثة */}
                <div>
                    <Label htmlFor="lastIncidentDate" className="block text-sm font-medium text-gray-700 mb-2">
                        تاريخ آخر حادثة
                    </Label>
                    <Input
                        id="lastIncidentDate"
                        type="date"
                        value={formData.lastIncidentDate}
                        onChange={(e) => handleChange('lastIncidentDate', e.target.value)}
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* وجود مشاكل تأديبية */}
                <div className="flex items-center gap-3 pt-6">
                    <Checkbox
                        id="disciplinaryIssues"
                        checked={formData.disciplinaryIssues}
                        onCheckedChange={(checked) => handleChange('disciplinaryIssues', checked)}
                        disabled={isReadOnly || !isEditing}
                    />
                    <Label htmlFor="disciplinaryIssues" className="text-sm font-medium text-gray-700 cursor-pointer">
                        هناك مشاكل تأديبية
                    </Label>
                </div>

                {/* تفاصيل المشاكل التأديبية */}
                {formData.disciplinaryIssues && (
                    <div className="md:col-span-2">
                        <Label htmlFor="disciplinaryDetails" className="block text-sm font-medium text-gray-700 mb-2">
                            تفاصيل المشاكل التأديبية
                        </Label>
                        <Textarea
                            id="disciplinaryDetails"
                            value={formData.disciplinaryDetails}
                            onChange={(e) => handleChange('disciplinaryDetails', e.target.value)}
                            placeholder="أدخل تفاصيل المشاكل التأديبية"
                            disabled={isReadOnly || !isEditing}
                            rows={3}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                )}

                {/* السلوك داخل الفصل */}
                <div className="md:col-span-2">
                    <Label htmlFor="classroomBehavior" className="block text-sm font-medium text-gray-700 mb-2">
                        السلوك داخل الفصل
                    </Label>
                    <Textarea
                        id="classroomBehavior"
                        value={formData.classroomBehavior}
                        onChange={(e) => handleChange('classroomBehavior', e.target.value)}
                        placeholder="أدخل ملاحظات السلوك داخل الفصل"
                        disabled={isReadOnly || !isEditing}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* التفاعل الاجتماعي */}
                <div className="md:col-span-2">
                    <Label htmlFor="socialInteraction" className="block text-sm font-medium text-gray-700 mb-2">
                        التفاعل الاجتماعي
                    </Label>
                    <Textarea
                        id="socialInteraction"
                        value={formData.socialInteraction}
                        onChange={(e) => handleChange('socialInteraction', e.target.value)}
                        placeholder="أدخل ملاحظات التفاعل الاجتماعي"
                        disabled={isReadOnly || !isEditing}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* ملاحظات المرشد */}
                <div className="md:col-span-2">
                    <Label htmlFor="counselorNotes" className="block text-sm font-medium text-gray-700 mb-2">
                        ملاحظات المرشد النفسي
                    </Label>
                    <Textarea
                        id="counselorNotes"
                        value={formData.counselorNotes}
                        onChange={(e) => handleChange('counselorNotes', e.target.value)}
                        placeholder="أدخل ملاحظات المرشد"
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