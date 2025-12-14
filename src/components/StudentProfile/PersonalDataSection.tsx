import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PersonalData } from '@/types/student';
import { STUDENT_OPTIONS } from '@/data/studentConstants';

interface PersonalDataSectionProps {
    data?: PersonalData;
    onSave?: (data: PersonalData) => Promise<void>;
    isReadOnly?: boolean;
}

/**
 * قسم البيانات الشخصية
 * يحتوي على الاسم، الرقم القومي، تاريخ الميلاد، والجنسية والدين والنوع
 */
export function PersonalDataSection({ data, onSave, isReadOnly = false }: PersonalDataSectionProps) {
    const [formData, setFormData] = useState<PersonalData>(
        data || {
            fullNameAr: '',
            nationalId: '',
            dateOfBirth: '',
            placeOfBirth: '',
            nationality: '',
            gender: '',
            religion: '',
            specialNeeds: '',
        }
    );

    const [isSaving, setIsSaving] = useState(false);
    // في وضع الإضافة (isReadOnly = false)، الحقول مفعّلة بشكل افتراضي
    const [isEditing, setIsEditing] = useState(!isReadOnly);

    const handleChange = (field: keyof PersonalData, value: string) => {
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
                <h2 className="text-2xl font-bold text-gray-800">البيانات الشخصية</h2>
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
                    <Label htmlFor="fullNameAr" className="block text-sm font-medium text-gray-700 mb-2">
                        الاسم الكامل بالعربية <span className="text-red-600 font-bold">*</span>
                    </Label>
                    <Input
                        id="fullNameAr"
                        value={formData.fullNameAr}
                        onChange={(e) => handleChange('fullNameAr', e.target.value)}
                        placeholder="أدخل الاسم الكامل"
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* الرقم القومي */}
                <div>
                    <Label htmlFor="nationalId" className="block text-sm font-medium text-gray-700 mb-2">
                        الرقم القومي <span className="text-red-600 font-bold">*</span>
                    </Label>
                    <Input
                        id="nationalId"
                        value={formData.nationalId}
                        onChange={(e) => handleChange('nationalId', e.target.value)}
                        placeholder="أدخل الرقم القومي"
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* تاريخ الميلاد */}
                <div>
                    <Label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                        تاريخ الميلاد <span className="text-red-600 font-bold">*</span>
                    </Label>
                    <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* مكان الميلاد */}
                <div>
                    <Label htmlFor="placeOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                        مكان الميلاد
                    </Label>
                    <Input
                        id="placeOfBirth"
                        value={formData.placeOfBirth}
                        onChange={(e) => handleChange('placeOfBirth', e.target.value)}
                        placeholder="أدخل مكان الميلاد"
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* الجنسية */}
                <div>
                    <Label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-2">
                        الجنسية
                    </Label>
                    <Select value={formData.nationality} onValueChange={(value) => handleChange('nationality', value)} disabled={isReadOnly || !isEditing}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر الجنسية" />
                        </SelectTrigger>
                        <SelectContent>
                            {STUDENT_OPTIONS.nationality.map((option) => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* النوع */}
                <div>
                    <Label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                        النوع <span className="text-red-600 font-bold">*</span>
                    </Label>
                    <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)} disabled={isReadOnly || !isEditing}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر النوع" />
                        </SelectTrigger>
                        <SelectContent>
                            {STUDENT_OPTIONS.gender.map((option) => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* الديانة */}
                <div>
                    <Label htmlFor="religion" className="block text-sm font-medium text-gray-700 mb-2">
                        الديانة
                    </Label>
                    <Select value={formData.religion} onValueChange={(value) => handleChange('religion', value)} disabled={isReadOnly || !isEditing}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر الديانة" />
                        </SelectTrigger>
                        <SelectContent>
                            {STUDENT_OPTIONS.religion.map((option) => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* الاحتياجات الخاصة */}
                <div className="md:col-span-2">
                    <Label htmlFor="specialNeeds" className="block text-sm font-medium text-gray-700 mb-2">
                        الاحتياجات الخاصة (اختياري)
                    </Label>
                    <Input
                        id="specialNeeds"
                        value={formData.specialNeeds || ''}
                        onChange={(e) => handleChange('specialNeeds', e.target.value)}
                        placeholder="أدخل الاحتياجات الخاصة إن وجدت"
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