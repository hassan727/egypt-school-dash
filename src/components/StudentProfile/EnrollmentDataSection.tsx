import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { EnrollmentData } from '@/types/student';
import { STUDENT_OPTIONS } from '@/data/studentConstants';
import { supabase } from '@/lib/supabase';

interface EnrollmentDataSectionProps {
    data?: EnrollmentData;
    onSave?: (data: EnrollmentData) => Promise<void>;
    isReadOnly?: boolean;
}

/**
 * قسم بيانات القيد الدراسي
 * يحتوي على المرحلة والفصل والعام الدراسي ونوع القيد
 * الفصول تتغير ديناميكياً حسب المرحلة المختارة
 */
export function EnrollmentDataSection({ data, onSave, isReadOnly = false }: EnrollmentDataSectionProps) {
    const [formData, setFormData] = useState<EnrollmentData>(
        data || {
            studentId: '',
            academicYear: '',
            stage: '',
            class: '',
            enrollmentType: '',
            enrollmentDate: '',
            previousSchool: '',
            transferReason: '',
            previousLevel: '',
            secondLanguage: '',
            curriculumType: '',
            hasRepeated: false,
            orderAmongSiblings: 1,
            isRegular: true,
        }
    );

    const [isSaving, setIsSaving] = useState(false);
    // في وضع الإضافة (isReadOnly = false)، الحقول مفعّلة بشكل افتراضي
    const [isEditing, setIsEditing] = useState(!isReadOnly);

    // Dynamic stage-class data from Supabase
    const [stagesData, setStagesData] = useState<Record<string, string[]>>({});
    const [availableClasses, setAvailableClasses] = useState<string[]>([]);

    // Fetch stage-class data from Supabase
    useEffect(() => {
        const fetchStagesClasses = async () => {
            try {
                const { data, error } = await supabase
                    .from('stages_classes')
                    .select('stage_name, class_name')
                    .order('stage_name', { ascending: true })
                    .order('class_name', { ascending: true });

                if (error) throw error;

                // Group classes by stage
                const groupedData: Record<string, string[]> = {};
                data.forEach(item => {
                    if (!groupedData[item.stage_name]) {
                        groupedData[item.stage_name] = [];
                    }
                    groupedData[item.stage_name].push(item.class_name);
                });

                setStagesData(groupedData);

                // Set available classes if stage is already selected
                if (formData.stage && groupedData[formData.stage]) {
                    setAvailableClasses(groupedData[formData.stage]);
                }
            } catch (error) {
                console.error('Error fetching stages and classes:', error);
                // Fallback to static data if Supabase fails
                import('@/data/studentConstants').then(constants => {
                    setStagesData(constants.STAGES_DATA);
                    if (formData.stage && constants.STAGES_DATA[formData.stage as keyof typeof constants.STAGES_DATA]) {
                        setAvailableClasses(constants.STAGES_DATA[formData.stage as keyof typeof constants.STAGES_DATA]);
                    }
                });
            }
        };

        fetchStagesClasses();
    }, []);

    // Update available classes when stage changes
    useEffect(() => {
        if (formData.stage && stagesData[formData.stage]) {
            setAvailableClasses(stagesData[formData.stage]);
        } else {
            setAvailableClasses([]);
        }

        // Reset class when stage changes
        if (formData.stage !== formData.stage) {
            setFormData(prev => ({
                ...prev,
                class: ''
            }));
        }
    }, [formData.stage, stagesData]);

    // إعادة تعيين الفصل عند تغيير المرحلة
    const handleStageChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            stage: value,
            class: '', // إعادة تعيين الفصل
        }));
    };

    const handleChange = (field: keyof EnrollmentData, value: any) => {
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
                <h2 className="text-2xl font-bold text-gray-800">بيانات القيد الدراسي</h2>
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
                {/* العام الدراسي */}
                <div>
                    <Label htmlFor="academicYear" className="block text-sm font-medium text-gray-700 mb-2">
                        العام الدراسي
                    </Label>
                    <Select value={formData.academicYear} onValueChange={(value) => handleChange('academicYear', value)} disabled={isReadOnly || !isEditing}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر العام الدراسي" />
                        </SelectTrigger>
                        <SelectContent>
                            {STUDENT_OPTIONS.academicYears.map((year) => (
                                <SelectItem key={year} value={year}>
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* المرحلة */}
                <div>
                    <Label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-2">
                        المرحلة <span className="text-red-600 font-bold">*</span>
                    </Label>
                    <Select value={formData.stage} onValueChange={handleStageChange} disabled={isReadOnly || !isEditing}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر المرحلة" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.keys(stagesData).map((stage) => (
                                <SelectItem key={stage} value={stage}>
                                    {stage}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* الفصل - ديناميكي حسب المرحلة */}
                <div>
                    <Label htmlFor="class" className="block text-sm font-medium text-gray-700 mb-2">
                        الفصل <span className="text-red-600 font-bold">*</span>
                    </Label>
                    <Select value={formData.class} onValueChange={(value) => handleChange('class', value)} disabled={isReadOnly || !isEditing || availableClasses.length === 0}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={availableClasses.length === 0 ? "اختر المرحلة أولاً" : "اختر الفصل"} />
                        </SelectTrigger>
                        <SelectContent>
                            {availableClasses.map((cls) => (
                                <SelectItem key={cls} value={cls}>
                                    {cls}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* نوع القيد */}
                <div>
                    <Label htmlFor="enrollmentType" className="block text-sm font-medium text-gray-700 mb-2">
                        نوع القيد
                    </Label>
                    <Select value={formData.enrollmentType} onValueChange={(value) => handleChange('enrollmentType', value)} disabled={isReadOnly || !isEditing}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر نوع القيد" />
                        </SelectTrigger>
                        <SelectContent>
                            {STUDENT_OPTIONS.enrollmentType.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* تاريخ الالتحاق */}
                <div>
                    <Label htmlFor="enrollmentDate" className="block text-sm font-medium text-gray-700 mb-2">
                        تاريخ الالتحاق بالمدرسة
                    </Label>
                    <Input
                        id="enrollmentDate"
                        type="date"
                        value={formData.enrollmentDate}
                        onChange={(e) => handleChange('enrollmentDate', e.target.value)}
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* اسم المدرسة السابقة - يظهر فقط إذا كان نوع القيد = تحويل */}
                {formData.enrollmentType === 'تحويل' && (
                    <>
                        <div>
                            <Label htmlFor="previousSchool" className="block text-sm font-medium text-gray-700 mb-2">
                                اسم المدرسة السابقة
                            </Label>
                            <Input
                                id="previousSchool"
                                value={formData.previousSchool}
                                onChange={(e) => handleChange('previousSchool', e.target.value)}
                                placeholder="أدخل اسم المدرسة السابقة"
                                disabled={isReadOnly || !isEditing}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* سبب التحويل */}
                        <div>
                            <Label htmlFor="transferReason" className="block text-sm font-medium text-gray-700 mb-2">
                                سبب التحويل
                            </Label>
                            <Input
                                id="transferReason"
                                value={formData.transferReason}
                                onChange={(e) => handleChange('transferReason', e.target.value)}
                                placeholder="أدخل سبب التحويل"
                                disabled={isReadOnly || !isEditing}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </>
                )}

                {/* مستوى الطالب السابق */}
                <div>
                    <Label htmlFor="previousLevel" className="block text-sm font-medium text-gray-700 mb-2">
                        مستوى الطالب السابق
                    </Label>
                    <Select value={formData.previousLevel} onValueChange={(value) => handleChange('previousLevel', value)} disabled={isReadOnly || !isEditing}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر المستوى السابق" />
                        </SelectTrigger>
                        <SelectContent>
                            {STUDENT_OPTIONS.academicLevel.map((level) => (
                                <SelectItem key={level} value={level}>
                                    {level}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* اللغة الثانية */}
                <div>
                    <Label htmlFor="secondLanguage" className="block text-sm font-medium text-gray-700 mb-2">
                        اللغة الثانية
                    </Label>
                    <Select value={formData.secondLanguage} onValueChange={(value) => handleChange('secondLanguage', value)} disabled={isReadOnly || !isEditing}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر اللغة الثانية" />
                        </SelectTrigger>
                        <SelectContent>
                            {STUDENT_OPTIONS.secondLanguage.map((lang) => (
                                <SelectItem key={lang} value={lang}>
                                    {lang}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* نوع المنهج */}
                <div>
                    <Label htmlFor="curriculumType" className="block text-sm font-medium text-gray-700 mb-2">
                        نوع المنهج
                    </Label>
                    <Select value={formData.curriculumType} onValueChange={(value) => handleChange('curriculumType', value)} disabled={isReadOnly || !isEditing}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر نوع المنهج" />
                        </SelectTrigger>
                        <SelectContent>
                            {STUDENT_OPTIONS.curriculumType.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* هل سبق للطالب الرسوب؟ */}
                <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                        id="hasRepeated"
                        checked={formData.hasRepeated}
                        onCheckedChange={(checked) => handleChange('hasRepeated', checked)}
                        disabled={isReadOnly || !isEditing}
                    />
                    <Label htmlFor="hasRepeated" className="text-sm font-medium text-gray-700">
                        هل سبق للطالب الرسوب؟
                    </Label>
                </div>

                {/* ترتيب الطالب بين إخوته */}
                <div>
                    <Label htmlFor="orderAmongSiblings" className="block text-sm font-medium text-gray-700 mb-2">
                        ترتيب الطالب بين إخوته
                    </Label>
                    <Input
                        id="orderAmongSiblings"
                        type="number"
                        min="1"
                        max="10"
                        value={formData.orderAmongSiblings}
                        onChange={(e) => handleChange('orderAmongSiblings', parseInt(e.target.value))}
                        disabled={isReadOnly || !isEditing}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* هل الطالب منتظم أم مستمع؟ */}
                <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                        id="isRegular"
                        checked={formData.isRegular}
                        onCheckedChange={(checked) => handleChange('isRegular', checked)}
                        disabled={isReadOnly || !isEditing}
                    />
                    <Label htmlFor="isRegular" className="text-sm font-medium text-gray-700">
                        الطالب منتظم
                    </Label>
                </div>
            </div>

            {/* أزرار الحفظ والإلغاء في وضع التعديل */}
            {isEditing && !isReadOnly && (
                <div className="flex gap-3 mt-6">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isSaving ? 'جاري الحفظ...' : 'حفظ البيانات'}
                    </Button>
                </div>
            )}
        </Card>
    );
}