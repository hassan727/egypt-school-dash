import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { GuardianData } from '@/types/student';
import { STUDENT_OPTIONS } from '@/data/studentConstants';
import { SmartPhoneInput } from '@/components/ui/SmartPhoneInput';

interface GuardianDataSectionProps {
    data?: GuardianData;
    onSave?: (data: GuardianData) => Promise<void>;
    isReadOnly?: boolean;
}

/**
 * قسم بيانات ولي الأمر
 * يحتوي على معلومات ولي الأمر والوصي القانوني
 */
export function GuardianDataSection({ data, onSave, isReadOnly = false }: GuardianDataSectionProps) {
    const [formData, setFormData] = useState<GuardianData>(
        data || {
            studentId: '',
            fullName: '',
            relationship: '',
            nationalId: '',
            job: '',
            workplace: '',
            educationLevel: '',
            phone: '',
            email: '',
            address: '',
            maritalStatus: '',
            hasLegalGuardian: false,
            socialMedia: '',
        }
    );

    const [isSaving, setIsSaving] = useState(false);
    // في وضع الإضافة (isReadOnly = false)، الحقول مفعّلة بشكل افتراضي
    const [isEditing, setIsEditing] = useState(!isReadOnly);

    const handleChange = (field: keyof GuardianData, value: any) => {
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
                <h2 className="text-2xl font-bold text-gray-800">بيانات ولي الأمر</h2>
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
                    <Label htmlFor="guardian_fullName" className="block text-sm font-medium text-gray-700 mb-2">
                        الاسم الكامل <span className="text-red-600 font-bold">*</span>
                    </Label>
                    <Input
                        id="guardian_fullName"
                        value={formData.fullName}
                        onChange={(e) => handleChange('fullName', e.target.value)}
                        placeholder="أدخل الاسم الكامل"
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* صلة القرابة */}
                <div>
                    <Label htmlFor="guardian_relationship" className="block text-sm font-medium text-gray-700 mb-2">
                        صلة القرابة
                    </Label>
                    <Select value={formData.relationship} onValueChange={(value) => handleChange('relationship', value)} disabled={isReadOnly || !isEditing}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر صلة القرابة" />
                        </SelectTrigger>
                        <SelectContent>
                            {STUDENT_OPTIONS.relationshipTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* الرقم القومي */}
                {/* الرقم القومي */}
                <div>
                    <Label htmlFor="guardian_nationalId" className="block text-sm font-medium text-gray-700 mb-2">
                        الرقم القومي
                    </Label>
                    <Input
                        id="guardian_nationalId"
                        value={formData.nationalId}
                        onChange={(e) => handleChange('nationalId', e.target.value)}
                        placeholder="أدخل الرقم القومي"
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* الجنسية */}
                <div>
                    <Label htmlFor="guardian_nationality" className="block text-sm font-medium text-gray-700 mb-2">
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
                    <Label htmlFor="guardian_job" className="block text-sm font-medium text-gray-700 mb-2">
                        الوظيفة
                    </Label>
                    <Input
                        id="guardian_job"
                        value={formData.job}
                        onChange={(e) => handleChange('job', e.target.value)}
                        placeholder="أدخل الوظيفة"
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* جهة العمل */}
                <div>
                    <Label htmlFor="guardian_workplace" className="block text-sm font-medium text-gray-700 mb-2">
                        جهة العمل
                    </Label>
                    <Input
                        id="guardian_workplace"
                        value={formData.workplace}
                        onChange={(e) => handleChange('workplace', e.target.value)}
                        placeholder="أدخل جهة العمل"
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* المؤهل الدراسي */}
                <div>
                    <Label htmlFor="guardian_educationLevel" className="block text-sm font-medium text-gray-700 mb-2">
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

                {/* رقم الهاتف */}
                <div className="space-y-4">
                    <SmartPhoneInput
                        id="guardian_phone"
                        label="رقم الهاتف المحمول"
                        value={formData.phone}
                        onChange={(val) => {
                            handleChange('phone', val);
                            // If WhatsApp is empty or was same as phone, update it too if checked? 
                            // Easier to just let user click the checkbox or manual enter.
                        }}
                        nationality={formData.nationality || 'مصري'}
                        required
                        disabled={isReadOnly || !isEditing}
                    />

                    {/* رقم الواتساب */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label htmlFor="guardian_whatsapp" className="text-sm font-medium text-gray-700">
                                رقم الواتساب
                            </Label>
                            {!isReadOnly && isEditing && (
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="whatsapp_same"
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                handleChange('whatsappNumber', formData.phone);
                                            }
                                        }}
                                        disabled={!formData.phone}
                                    />
                                    <Label htmlFor="whatsapp_same" className="text-xs text-blue-600 cursor-pointer">
                                        نفس رقم الهاتف
                                    </Label>
                                </div>
                            )}
                        </div>
                        <SmartPhoneInput
                            id="guardian_whatsapp"
                            label=""
                            value={formData.whatsappNumber || ''}
                            onChange={(val) => handleChange('whatsappNumber', val)}
                            nationality={formData.nationality || 'مصري'}
                            placeholder="أدخل رقم الواتساب"
                            disabled={isReadOnly || !isEditing}
                        />
                    </div>
                </div>

                {/* البريد الإلكتروني */}
                <div>
                    <Label htmlFor="guardian_email" className="block text-sm font-medium text-gray-700 mb-2">
                        البريد الإلكتروني
                    </Label>
                    <Input
                        id="guardian_email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="أدخل البريد الإلكتروني"
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* عنوان السكن */}
                <div className="md:col-span-2">
                    <Label htmlFor="guardian_address" className="block text-sm font-medium text-gray-700 mb-2">
                        عنوان السكن
                    </Label>
                    <Input
                        id="guardian_address"
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        placeholder="أدخل عنوان السكن"
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* الحالة الاجتماعية */}
                <div>
                    <Label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700 mb-2">
                        الحالة الاجتماعية
                    </Label>
                    <Select value={formData.maritalStatus} onValueChange={(value) => handleChange('maritalStatus', value)} disabled={isReadOnly || !isEditing}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر الحالة الاجتماعية" />
                        </SelectTrigger>
                        <SelectContent>
                            {STUDENT_OPTIONS.maritalStatus.map((status) => (
                                <SelectItem key={status} value={status}>
                                    {status}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* هل يوجد وصي قانوني */}
                <div className="flex items-end">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="hasLegalGuardian"
                            checked={formData.hasLegalGuardian}
                            onCheckedChange={(checked) => handleChange('hasLegalGuardian', checked)}
                            disabled={isReadOnly || !isEditing}
                        />
                        <Label htmlFor="hasLegalGuardian" className="text-sm font-medium text-gray-700 cursor-pointer">
                            هل يوجد وصي قانوني؟
                        </Label>
                    </div>
                </div>

                {/* حسابات التواصل الاجتماعي */}
                <div className="md:col-span-2">
                    <Label htmlFor="socialMedia" className="block text-sm font-medium text-gray-700 mb-2">
                        حسابات التواصل الاجتماعي (اختياري)
                    </Label>
                    <Input
                        id="socialMedia"
                        value={formData.socialMedia || ''}
                        onChange={(e) => handleChange('socialMedia', e.target.value)}
                        placeholder="أدخل حسابات التواصل الاجتماعي"
                        disabled={isReadOnly || !isEditing}
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