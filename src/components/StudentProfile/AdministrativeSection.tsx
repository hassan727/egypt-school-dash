import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { getEgyptianDateString } from '@/utils/helpers';

interface AdministrativeSectionProps {
    data?: {
        admissionDate: string;
        studentIdNumber: string;
        fileStatus: 'نشط' | 'معطل' | 'مغلق' | 'معلق';
        infoUpdateDate: string;
        transportationStatus: 'يستخدم' | 'لا يستخدم';
        busNumber: string;
        pickupPoint: string;
        schoolDocumentsComplete: boolean;
        documentsNotes: string;
        healthInsurance: boolean;
        healthInsuranceNumber: string;
        administrativeNotes: string;
        emergencyContactUpdated: string;
    };
    onSave?: (data: any) => Promise<void>;
    isReadOnly?: boolean;
}

/**
 * قسم البيانات الإدارية
 * يحتوي على البيانات الإدارية والوثائق والتأمين الصحي والمواصلات
 */
export function AdministrativeSection({ data, onSave, isReadOnly = false }: AdministrativeSectionProps) {
    const [formData, setFormData] = useState(
        data || {
            admissionDate: getEgyptianDateString(),
            studentIdNumber: '',
            fileStatus: 'نشط',
            infoUpdateDate: getEgyptianDateString(),
            transportationStatus: 'لا يستخدم',
            busNumber: '',
            pickupPoint: '',
            schoolDocumentsComplete: false,
            documentsNotes: '',
            healthInsurance: false,
            healthInsuranceNumber: '',
            administrativeNotes: '',
            emergencyContactUpdated: getEgyptianDateString(),
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
                <h2 className="text-2xl font-bold text-gray-800">البيانات الإدارية</h2>
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
                {/* تاريخ الالتحاق */}
                <div>
                    <Label htmlFor="admissionDate" className="block text-sm font-medium text-gray-700 mb-2">
                        تاريخ الالتحاق
                    </Label>
                    <Input
                        id="admissionDate"
                        type="date"
                        value={formData.admissionDate}
                        onChange={(e) => handleChange('admissionDate', e.target.value)}
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* رقم الملف المدرسي */}
                <div>
                    <Label htmlFor="studentIdNumber" className="block text-sm font-medium text-gray-700 mb-2">
                        رقم الملف المدرسي
                    </Label>
                    <Input
                        id="studentIdNumber"
                        value={formData.studentIdNumber}
                        onChange={(e) => handleChange('studentIdNumber', e.target.value)}
                        placeholder="أدخل رقم الملف"
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* حالة الملف */}
                <div>
                    <Label htmlFor="fileStatus" className="block text-sm font-medium text-gray-700 mb-2">
                        حالة الملف
                    </Label>
                    <Select value={formData.fileStatus} onValueChange={(value) => handleChange('fileStatus', value)} disabled={isReadOnly || !isEditing}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر حالة الملف" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="نشط">نشط</SelectItem>
                            <SelectItem value="معطل">معطل</SelectItem>
                            <SelectItem value="مغلق">مغلق</SelectItem>
                            <SelectItem value="معلق">معلق</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* تاريخ آخر تحديث للبيانات */}
                <div>
                    <Label htmlFor="infoUpdateDate" className="block text-sm font-medium text-gray-700 mb-2">
                        تاريخ آخر تحديث للبيانات
                    </Label>
                    <Input
                        id="infoUpdateDate"
                        type="date"
                        value={formData.infoUpdateDate}
                        onChange={(e) => handleChange('infoUpdateDate', e.target.value)}
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* حالة المواصلات */}
                <div>
                    <Label htmlFor="transportationStatus" className="block text-sm font-medium text-gray-700 mb-2">
                        حالة المواصلات
                    </Label>
                    <Select value={formData.transportationStatus} onValueChange={(value) => handleChange('transportationStatus', value)} disabled={isReadOnly || !isEditing}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="يستخدم">يستخدم</SelectItem>
                            <SelectItem value="لا يستخدم">لا يستخدم</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* رقم الحافلة */}
                {formData.transportationStatus === 'يستخدم' && (
                    <div>
                        <Label htmlFor="busNumber" className="block text-sm font-medium text-gray-700 mb-2">
                            رقم الحافلة
                        </Label>
                        <Input
                            id="busNumber"
                            value={formData.busNumber}
                            onChange={(e) => handleChange('busNumber', e.target.value)}
                            placeholder="أدخل رقم الحافلة"
                            disabled={isReadOnly || !isEditing}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                )}

                {/* نقطة الانتظار */}
                {formData.transportationStatus === 'يستخدم' && (
                    <div>
                        <Label htmlFor="pickupPoint" className="block text-sm font-medium text-gray-700 mb-2">
                            نقطة الانتظار
                        </Label>
                        <Input
                            id="pickupPoint"
                            value={formData.pickupPoint}
                            onChange={(e) => handleChange('pickupPoint', e.target.value)}
                            placeholder="أدخل نقطة الانتظار"
                            disabled={isReadOnly || !isEditing}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                )}

                {/* وثائق المدرسة كاملة */}
                <div className="flex items-center gap-3 pt-6">
                    <Checkbox
                        id="schoolDocumentsComplete"
                        checked={formData.schoolDocumentsComplete}
                        onCheckedChange={(checked) => handleChange('schoolDocumentsComplete', checked)}
                        disabled={isReadOnly || !isEditing}
                    />
                    <Label htmlFor="schoolDocumentsComplete" className="text-sm font-medium text-gray-700 cursor-pointer">
                        وثائق المدرسة كاملة
                    </Label>
                </div>

                {/* ملاحظات الوثائق */}
                <div className="md:col-span-2">
                    <Label htmlFor="documentsNotes" className="block text-sm font-medium text-gray-700 mb-2">
                        ملاحظات الوثائق
                    </Label>
                    <Textarea
                        id="documentsNotes"
                        value={formData.documentsNotes}
                        onChange={(e) => handleChange('documentsNotes', e.target.value)}
                        placeholder="أدخل ملاحظات الوثائق"
                        disabled={isReadOnly || !isEditing}
                        rows={2}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* التأمين الصحي */}
                <div className="flex items-center gap-3 pt-3">
                    <Checkbox
                        id="healthInsurance"
                        checked={formData.healthInsurance}
                        onCheckedChange={(checked) => handleChange('healthInsurance', checked)}
                        disabled={isReadOnly || !isEditing}
                    />
                    <Label htmlFor="healthInsurance" className="text-sm font-medium text-gray-700 cursor-pointer">
                        يوجد تأمين صحي
                    </Label>
                </div>

                {/* رقم التأمين الصحي */}
                {formData.healthInsurance && (
                    <div>
                        <Label htmlFor="healthInsuranceNumber" className="block text-sm font-medium text-gray-700 mb-2">
                            رقم التأمين الصحي
                        </Label>
                        <Input
                            id="healthInsuranceNumber"
                            value={formData.healthInsuranceNumber}
                            onChange={(e) => handleChange('healthInsuranceNumber', e.target.value)}
                            placeholder="أدخل رقم التأمين"
                            disabled={isReadOnly || !isEditing}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                )}

                {/* تاريخ تحديث بيانات الطوارئ */}
                <div>
                    <Label htmlFor="emergencyContactUpdated" className="block text-sm font-medium text-gray-700 mb-2">
                        تاريخ تحديث بيانات الطوارئ
                    </Label>
                    <Input
                        id="emergencyContactUpdated"
                        type="date"
                        value={formData.emergencyContactUpdated}
                        onChange={(e) => handleChange('emergencyContactUpdated', e.target.value)}
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* الملاحظات الإدارية */}
                <div className="md:col-span-2">
                    <Label htmlFor="administrativeNotes" className="block text-sm font-medium text-gray-700 mb-2">
                        الملاحظات الإدارية
                    </Label>
                    <Textarea
                        id="administrativeNotes"
                        value={formData.administrativeNotes}
                        onChange={(e) => handleChange('administrativeNotes', e.target.value)}
                        placeholder="أدخل الملاحظات الإدارية"
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