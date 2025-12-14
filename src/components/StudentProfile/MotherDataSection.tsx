import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MotherData } from '@/types/student';
import { STUDENT_OPTIONS } from '@/data/studentConstants';
import { SmartPhoneInput } from '@/components/ui/SmartPhoneInput';

interface MotherDataSectionProps {
    data?: MotherData;
    onSave?: (data: MotherData) => Promise<void>;
    isReadOnly?: boolean;
}

/**
 * قسم بيانات الأم
 * يحتوي على معلومات الأم الكاملة
 */
export function MotherDataSection({ data, onSave, isReadOnly = false }: MotherDataSectionProps) {
    const [formData, setFormData] = useState<MotherData>(
        data || {
            studentId: '',
            fullName: '',
            nationalId: '',
            job: '',
            workplace: '',
            phone: '',
            email: '',
            educationLevel: '',
            address: '',
            relationship: '',
        }
    );

    const [isSaving, setIsSaving] = useState(false);
    // في وضع الإضافة (isReadOnly = false)، الحقول مفعّلة بشكل افتراضي
    const [isEditing, setIsEditing] = useState(!isReadOnly);

    const handleChange = (field: keyof MotherData, value: string) => {
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
                <h2 className="text-2xl font-bold text-gray-800">بيانات الأم</h2>
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
                {/* الاسم الكامل */}
                <div className="md:col-span-2">
                    <Label htmlFor="mother_fullName" className="block text-sm font-medium text-gray-700 mb-2">
                        الاسم الكامل
                    </Label>
                    <Input
                        id="mother_fullName"
                        value={formData.fullName}
                        onChange={(e) => handleChange('fullName', e.target.value)}
                        placeholder="أدخل الاسم الكامل"
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* الرقم القومي */}
                <div>
                    <Label htmlFor="mother_nationalId" className="block text-sm font-medium text-gray-700 mb-2">
                        الرقم القومي
                    </Label>
                    <Input
                        id="mother_nationalId"
                        value={formData.nationalId}
                        onChange={(e) => handleChange('nationalId', e.target.value)}
                        placeholder="أدخل الرقم القومي"
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* الجنسية */}
                <div>
                    <Label htmlFor="mother_nationality" className="block text-sm font-medium text-gray-700 mb-2">
                        الجنسية
                    </Label>
                    <Select
                        value={formData.nationality || 'مصري'}
                        onValueChange={(value) => handleChange('nationality', value)}
                        disabled={isReadOnly || !isEditing}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر الجنسية" />
                        </SelectTrigger>
                        <SelectContent>
                            {STUDENT_OPTIONS.nationality.map((nat) => (
                                <SelectItem key={nat} value={nat}>
                                    {nat}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* الوظيفة */}
                <div>
                    <Label htmlFor="mother_job" className="block text-sm font-medium text-gray-700 mb-2">
                        الوظيفة
                    </Label>
                    <Input
                        id="mother_job"
                        value={formData.job}
                        onChange={(e) => handleChange('job', e.target.value)}
                        placeholder="أدخل الوظيفة"
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* جهة العمل */}
                <div>
                    <Label htmlFor="mother_workplace" className="block text-sm font-medium text-gray-700 mb-2">
                        جهة العمل
                    </Label>
                    <Input
                        id="mother_workplace"
                        value={formData.workplace}
                        onChange={(e) => handleChange('workplace', e.target.value)}
                        placeholder="أدخل جهة العمل"
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* رقم الهاتف */}
                {/* رقم الهاتف */}
                <div className="space-y-4">
                    <SmartPhoneInput
                        id="mother_phone"
                        label="رقم الهاتف المحمول"
                        value={formData.phone}
                        onChange={(val) => handleChange('phone', val)}
                        nationality={formData.nationality || 'مصري'}
                        required
                        disabled={isReadOnly || !isEditing}
                    />

                    {/* رقم الواتساب */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label htmlFor="mother_whatsapp" className="text-sm font-medium text-gray-700">
                                رقم الواتساب
                            </Label>
                            {!isReadOnly && isEditing && (
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="mother_whatsapp_same"
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                handleChange('whatsappNumber', formData.phone);
                                            }
                                        }}
                                        disabled={!formData.phone}
                                    />
                                    <Label htmlFor="mother_whatsapp_same" className="text-xs text-blue-600 cursor-pointer">
                                        نفس رقم الهاتف
                                    </Label>
                                </div>
                            )}
                        </div>
                        <SmartPhoneInput
                            id="mother_whatsapp"
                            label=""
                            value={formData.whatsappNumber || ''}
                            onChange={(val) => handleChange('whatsappNumber', val)}
                            placeholder="أدخل رقم الواتساب"
                            nationality={formData.nationality || 'مصري'}
                            disabled={isReadOnly || !isEditing}
                        />
                    </div>
                </div>

                {/* البريد الإلكتروني */}
                <div>
                    <Label htmlFor="mother_email" className="block text-sm font-medium text-gray-700 mb-2">
                        البريد الإلكتروني
                    </Label>
                    <Input
                        id="mother_email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="أدخل البريد الإلكتروني"
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* المؤهل الدراسي */}
                <div>
                    <Label htmlFor="mother_educationLevel" className="block text-sm font-medium text-gray-700 mb-2">
                        المؤهل الدراسي
                    </Label>
                    <Select value={formData.educationLevel} onValueChange={(value) => handleChange('educationLevel', value)} disabled={isReadOnly || !isEditing}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر المؤهل" />
                        </SelectTrigger>
                        <SelectContent>
                            {STUDENT_OPTIONS.academicDegrees.map((degree) => (
                                <SelectItem key={degree} value={degree}>
                                    {degree}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* العنوان الحالي */}
                <div className="md:col-span-2">
                    <Label htmlFor="mother_address" className="block text-sm font-medium text-gray-700 mb-2">
                        العنوان الحالي
                    </Label>
                    <Input
                        id="mother_address"
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        placeholder="أدخل العنوان الحالي"
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* صلة الأم بالطالب */}
                <div className="md:col-span-2">
                    <Label htmlFor="mother_relationship" className="block text-sm font-medium text-gray-700 mb-2">
                        صلة الأم بالطالب
                    </Label>
                    <Select value={formData.relationship} onValueChange={(value) => handleChange('relationship', value)} disabled={isReadOnly || !isEditing}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر الصلة" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="أم">أم</SelectItem>
                            <SelectItem value="زوجة الأب">زوجة الأب</SelectItem>
                            <SelectItem value="أخرى">أخرى</SelectItem>
                        </SelectContent>
                    </Select>
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