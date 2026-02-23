import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { SmartPhoneInput } from '@/components/ui/SmartPhoneInput';
import { STUDENT_OPTIONS, LEGAL_GUARDIAN_RELATIONSHIPS } from '@/data/studentConstants';
import { LegalGuardianshipData, GuardianData, MotherData } from '@/types/student';
import { Shield, UserPlus, Phone, MessageCircle, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface LegalGuardianshipSectionProps {
    data?: LegalGuardianshipData;
    guardianData?: GuardianData;
    motherData?: MotherData;
    onSave?: (data: LegalGuardianshipData) => Promise<void>;
    isReadOnly?: boolean;
}

/**
 * قسم الوصاية القانونية للطالب
 * - يحدد من هو الوصي القانوني المخول باتخاذ القرارات
 * - يوفر خيار لتعيين الوالد/الوالدة كوصي افتراضي (يوفر الوقت)
 * - يدعم وصي ثانوي اختياري
 */
export function LegalGuardianshipSection({
    data,
    guardianData,
    motherData,
    onSave,
    isReadOnly = false
}: LegalGuardianshipSectionProps) {
    // الحالة الافتراضية: الوصاية للوالد/الوالدة
    const [formData, setFormData] = useState<LegalGuardianshipData>(
        data || {
            guardianIsLegalCustodian: true,
            primaryLegalGuardian: undefined,
            secondaryLegalGuardian: undefined,
        }
    );

    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(!isReadOnly);
    const [showSecondaryGuardian, setShowSecondaryGuardian] = useState(
        !!formData.secondaryLegalGuardian?.fullName
    );
    const [selectedParent, setSelectedParent] = useState<'father' | 'mother'>('father');

    // تحديث البيانات عند تغيير props
    useEffect(() => {
        if (data) {
            setFormData(data);
            setShowSecondaryGuardian(!!data.secondaryLegalGuardian?.fullName);
        }
    }, [data]);

    // الحصول على جنسية الوالد المحدد لكود الدولة
    const getSelectedParentNationality = () => {
        if (formData.guardianIsLegalCustodian) {
            return selectedParent === 'father'
                ? (guardianData?.nationality || 'مصري')
                : (motherData?.nationality || 'مصري');
        }
        return formData.primaryLegalGuardian?.nationality || 'مصري';
    };

    // تحديث بيانات الوصي الأساسي
    const handlePrimaryGuardianChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            primaryLegalGuardian: {
                fullName: prev.primaryLegalGuardian?.fullName || '',
                relationship: prev.primaryLegalGuardian?.relationship || '',
                nationalId: prev.primaryLegalGuardian?.nationalId || '',
                nationality: prev.primaryLegalGuardian?.nationality || 'مصري',
                phone: prev.primaryLegalGuardian?.phone || '',
                whatsappNumber: prev.primaryLegalGuardian?.whatsappNumber || '',
                ...prev.primaryLegalGuardian,
                [field]: value,
            },
        }));
    };

    // تحديث بيانات الوصي الثانوي
    const handleSecondaryGuardianChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            secondaryLegalGuardian: {
                ...prev.secondaryLegalGuardian,
                [field]: value,
            },
        }));
    };

    // عند تفعيل checkbox "الوصاية للوالد/الوالدة"
    const handleCustodianToggle = (checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            guardianIsLegalCustodian: checked,
            // إذا تم تفعيل الخيار، نمسح بيانات الوصي المخصص
            primaryLegalGuardian: checked ? undefined : prev.primaryLegalGuardian,
        }));
    };

    // حفظ البيانات
    const handleSave = async () => {
        try {
            setIsSaving(true);
            if (onSave) {
                await onSave(formData);
            }
            setIsEditing(false);
        } catch (error) {
            console.error('خطأ في حفظ بيانات الوصاية:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // الحصول على معلومات الوصي القانوني الحالي (للعرض)
    const getCurrentLegalGuardianInfo = () => {
        if (formData.guardianIsLegalCustodian) {
            const parent = selectedParent === 'father' ? guardianData : motherData;
            return {
                name: parent?.fullName || 'غير محدد',
                relationship: selectedParent === 'father' ? 'أب' : 'أم',
                phone: parent?.phone || '',
                whatsapp: parent?.whatsappNumber || parent?.phone || '',
            };
        }
        return {
            name: formData.primaryLegalGuardian?.fullName || 'غير محدد',
            relationship: formData.primaryLegalGuardian?.relationship || '',
            phone: formData.primaryLegalGuardian?.phone || '',
            whatsapp: formData.primaryLegalGuardian?.whatsappNumber || '',
        };
    };

    const currentGuardian = getCurrentLegalGuardianInfo();

    return (
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg shadow-md hover:shadow-lg transition-all">
            {/* رأس القسم مع أيقونة بارزة */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-600 rounded-lg shadow-md">
                        <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-indigo-900">
                            ⚖️ الوصاية القانونية للطالب
                        </h2>
                        <p className="text-sm text-indigo-600">
                            معلومات هامة ومطلوبة - الوصي المخول قانونياً
                        </p>
                    </div>
                </div>
                {!isReadOnly && (
                    <Button
                        onClick={() => setIsEditing(!isEditing)}
                        variant="outline"
                        size="sm"
                        className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                    >
                        {isEditing ? 'إلغاء' : 'تعديل'}
                    </Button>
                )}
            </div>

            {/* ملاحظة هامة */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-amber-800">
                            ملاحظة هامة:
                        </p>
                        <p className="text-sm text-amber-700">
                            الوصي القانوني الأساسي هو الشخص المخول قانونياً باتخاذ القرارات التعليمية والمالية والطبية نيابة عن الطالب.
                            سيتم إرسال إشعارات الواتساب للوصي القانوني عند تنفيذ أي معاملة.
                        </p>
                    </div>
                </div>
            </div>

            {/* خيار الوصاية للوالد/الوالدة (افتراضي) */}
            <div className="bg-white rounded-lg p-4 mb-6 border border-indigo-100">
                <div className="flex items-center gap-3 mb-4">
                    <Checkbox
                        id="guardianIsLegalCustodian"
                        checked={formData.guardianIsLegalCustodian}
                        onCheckedChange={handleCustodianToggle}
                        disabled={isReadOnly || !isEditing}
                        className="h-5 w-5"
                    />
                    <Label
                        htmlFor="guardianIsLegalCustodian"
                        className="text-lg font-semibold text-gray-800 cursor-pointer"
                    >
                        الوصاية القانونية للوالد/الوالدة (الافتراضي)
                    </Label>
                </div>

                {formData.guardianIsLegalCustodian && (
                    <div className="mr-8 space-y-4">
                        {/* اختيار الوالد أو الوالدة */}
                        <div className="flex gap-4">
                            <Label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="parentType"
                                    value="father"
                                    checked={selectedParent === 'father'}
                                    onChange={() => setSelectedParent('father')}
                                    disabled={isReadOnly || !isEditing}
                                    className="h-4 w-4 text-indigo-600"
                                />
                                <span className="text-gray-700">الأب (ولي الأمر)</span>
                            </Label>
                            <Label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="parentType"
                                    value="mother"
                                    checked={selectedParent === 'mother'}
                                    onChange={() => setSelectedParent('mother')}
                                    disabled={isReadOnly || !isEditing}
                                    className="h-4 w-4 text-indigo-600"
                                />
                                <span className="text-gray-700">الأم</span>
                            </Label>
                        </div>

                        {/* عرض معلومات الوالد المحدد */}
                        <div className="bg-indigo-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-indigo-600 font-semibold uppercase">الوصي القانوني</p>
                                <p className="text-lg font-bold text-indigo-900">{currentGuardian.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-indigo-600 font-semibold uppercase">صلة القرابة</p>
                                <p className="text-lg font-bold text-indigo-900">{currentGuardian.relationship}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-indigo-600" />
                                <span className="text-gray-700">{currentGuardian.phone || 'غير محدد'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MessageCircle className="h-4 w-4 text-green-600" />
                                <span className="text-gray-700">{currentGuardian.whatsapp || 'غير محدد'}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* حقول الوصي القانوني المخصص (تظهر فقط إذا تم إلغاء الخيار الافتراضي) */}
            {!formData.guardianIsLegalCustodian && (
                <div className="bg-white rounded-lg p-6 mb-6 border border-indigo-100">
                    <h3 className="text-xl font-bold text-indigo-800 mb-4">
                        بيانات الوصي القانوني الأساسي
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* الاسم الكامل */}
                        <div className="md:col-span-2">
                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                                الاسم الكامل <span className="text-red-600 font-bold">*</span>
                            </Label>
                            <Input
                                value={formData.primaryLegalGuardian?.fullName || ''}
                                onChange={(e) => handlePrimaryGuardianChange('fullName', e.target.value)}
                                placeholder="أدخل الاسم الكامل للوصي القانوني"
                                disabled={isReadOnly || !isEditing}
                                className="w-full p-3 border border-gray-300 rounded-md"
                            />
                        </div>

                        {/* صلة القرابة */}
                        <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                                صلة القرابة بالطالب <span className="text-red-600 font-bold">*</span>
                            </Label>
                            <Select
                                value={formData.primaryLegalGuardian?.relationship || ''}
                                onValueChange={(value) => handlePrimaryGuardianChange('relationship', value)}
                                disabled={isReadOnly || !isEditing}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="اختر صلة القرابة" />
                                </SelectTrigger>
                                <SelectContent>
                                    {LEGAL_GUARDIAN_RELATIONSHIPS.map((rel) => (
                                        <SelectItem key={rel} value={rel}>
                                            {rel}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* رقم الهوية القومي */}
                        <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                                رقم الهوية القومي <span className="text-red-600 font-bold">*</span>
                            </Label>
                            <Input
                                value={formData.primaryLegalGuardian?.nationalId || ''}
                                onChange={(e) => handlePrimaryGuardianChange('nationalId', e.target.value)}
                                placeholder="أدخل رقم الهوية القومي"
                                disabled={isReadOnly || !isEditing}
                                className="w-full p-3 border border-gray-300 rounded-md"
                            />
                        </div>

                        {/* الجنسية */}
                        <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                                الجنسية <span className="text-red-600 font-bold">*</span>
                            </Label>
                            <Select
                                value={formData.primaryLegalGuardian?.nationality || 'مصري'}
                                onValueChange={(value) => handlePrimaryGuardianChange('nationality', value)}
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

                        {/* رقم الهاتف المحمول */}
                        <div>
                            <SmartPhoneInput
                                id="legal_guardian_phone"
                                label="رقم الهاتف المحمول (الرئيسي)"
                                value={formData.primaryLegalGuardian?.phone || ''}
                                onChange={(val) => handlePrimaryGuardianChange('phone', val)}
                                nationality={formData.primaryLegalGuardian?.nationality || 'مصري'}
                                required
                                disabled={isReadOnly || !isEditing}
                            />
                        </div>

                        {/* رقم الواتساب */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label className="text-sm font-medium text-gray-700">
                                    رقم الواتساب <span className="text-red-600 font-bold">*</span>
                                </Label>
                                {!isReadOnly && isEditing && (
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="whatsapp_same_as_phone"
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    handlePrimaryGuardianChange(
                                                        'whatsappNumber',
                                                        formData.primaryLegalGuardian?.phone || ''
                                                    );
                                                }
                                            }}
                                            disabled={!formData.primaryLegalGuardian?.phone}
                                        />
                                        <Label htmlFor="whatsapp_same_as_phone" className="text-xs text-blue-600 cursor-pointer">
                                            نفس رقم الهاتف
                                        </Label>
                                    </div>
                                )}
                            </div>
                            <SmartPhoneInput
                                id="legal_guardian_whatsapp"
                                label=""
                                value={formData.primaryLegalGuardian?.whatsappNumber || ''}
                                onChange={(val) => handlePrimaryGuardianChange('whatsappNumber', val)}
                                nationality={formData.primaryLegalGuardian?.nationality || 'مصري'}
                                placeholder="أدخل رقم الواتساب"
                                disabled={isReadOnly || !isEditing}
                            />
                        </div>

                        {/* البريد الإلكتروني */}
                        <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                                البريد الإلكتروني
                            </Label>
                            <Input
                                type="email"
                                value={formData.primaryLegalGuardian?.email || ''}
                                onChange={(e) => handlePrimaryGuardianChange('email', e.target.value)}
                                placeholder="أدخل البريد الإلكتروني"
                                disabled={isReadOnly || !isEditing}
                                className="w-full p-3 border border-gray-300 rounded-md"
                            />
                        </div>

                        {/* جهة العمل */}
                        <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                                جهة العمل (اختياري)
                            </Label>
                            <Input
                                value={formData.primaryLegalGuardian?.workplace || ''}
                                onChange={(e) => handlePrimaryGuardianChange('workplace', e.target.value)}
                                placeholder="أدخل جهة العمل"
                                disabled={isReadOnly || !isEditing}
                                className="w-full p-3 border border-gray-300 rounded-md"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* رابط إضافة وصي ثانوي */}
            <div className="mb-6">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowSecondaryGuardian(!showSecondaryGuardian)}
                    disabled={isReadOnly || !isEditing}
                    className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 gap-2"
                >
                    {showSecondaryGuardian ? (
                        <>
                            <ChevronUp className="h-4 w-4" />
                            إخفاء الوصي الثانوي
                        </>
                    ) : (
                        <>
                            <UserPlus className="h-4 w-4" />
                            إضافة وصي آخر / جهة اتصال بديلة (اختياري)
                            <ChevronDown className="h-4 w-4" />
                        </>
                    )}
                </Button>
            </div>

            {/* حقول الوصي الثانوي */}
            {showSecondaryGuardian && (
                <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                        الوصي القانوني الثاني / جهة اتصال بديلة (اختياري)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* الاسم الكامل */}
                        <div className="md:col-span-2">
                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                                الاسم الكامل
                            </Label>
                            <Input
                                value={formData.secondaryLegalGuardian?.fullName || ''}
                                onChange={(e) => handleSecondaryGuardianChange('fullName', e.target.value)}
                                placeholder="أدخل الاسم الكامل"
                                disabled={isReadOnly || !isEditing}
                                className="w-full p-3 border border-gray-300 rounded-md"
                            />
                        </div>

                        {/* صلة القرابة */}
                        <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                                صلة القرابة بالطالب
                            </Label>
                            <Select
                                value={formData.secondaryLegalGuardian?.relationship || ''}
                                onValueChange={(value) => handleSecondaryGuardianChange('relationship', value)}
                                disabled={isReadOnly || !isEditing}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="اختر صلة القرابة" />
                                </SelectTrigger>
                                <SelectContent>
                                    {LEGAL_GUARDIAN_RELATIONSHIPS.map((rel) => (
                                        <SelectItem key={rel} value={rel}>
                                            {rel}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* الجنسية */}
                        <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                                الجنسية
                            </Label>
                            <Select
                                value={formData.secondaryLegalGuardian?.nationality || 'مصري'}
                                onValueChange={(value) => handleSecondaryGuardianChange('nationality', value)}
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

                        {/* رقم الهاتف */}
                        <div>
                            <SmartPhoneInput
                                id="secondary_guardian_phone"
                                label="رقم الهاتف المحمول"
                                value={formData.secondaryLegalGuardian?.phone || ''}
                                onChange={(val) => handleSecondaryGuardianChange('phone', val)}
                                nationality={formData.secondaryLegalGuardian?.nationality || 'مصري'}
                                disabled={isReadOnly || !isEditing}
                            />
                        </div>

                        {/* رقم الواتساب */}
                        <div>
                            <SmartPhoneInput
                                id="secondary_guardian_whatsapp"
                                label="رقم الواتساب"
                                value={formData.secondaryLegalGuardian?.whatsappNumber || ''}
                                onChange={(val) => handleSecondaryGuardianChange('whatsappNumber', val)}
                                nationality={formData.secondaryLegalGuardian?.nationality || 'مصري'}
                                disabled={isReadOnly || !isEditing}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* أزرار الحفظ */}
            {isEditing && !isReadOnly && (
                <div className="flex gap-3 justify-end">
                    <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="border-gray-300"
                    >
                        إلغاء
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                    >
                        <Shield className="h-4 w-4" />
                        {isSaving ? 'جاري الحفظ...' : 'حفظ بيانات الوصاية'}
                    </Button>
                </div>
            )}
        </Card>
    );
}
