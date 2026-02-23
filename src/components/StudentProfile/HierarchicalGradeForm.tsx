import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Save, Trash2, ChevronDown, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Grade, AcademicYear, Semester, SubjectHierarchy, AssessmentTypeHierarchy } from '@/types/student';

interface HierarchicalGradeFormProps {
    studentId: string;
    studentName?: string;
    onSave?: (grades: Grade[]) => Promise<void>;
}

/**
 * مكون إدخال الدرجات - الهيكل الشجري المحسّن
 * 
 * الخطوات الإجبارية الستة:
 * 1. اختيار السنة الدراسية
 * 2. اختيار الفصل الدراسي
 * 3. اختيار المادة الدراسية
 * 4. اختيار نوع التقييم
 * 5. تحديد التاريخ
 * 6. إدخال الدرجة والملاحظة
 */
export function HierarchicalGradeForm({
    studentId,
    studentName = 'الطالب',
    onSave
}: HierarchicalGradeFormProps) {
    // حالة البيانات الهرمية
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [subjects, setSubjects] = useState<SubjectHierarchy[]>([]);
    const [assessmentTypes, setAssessmentTypes] = useState<AssessmentTypeHierarchy[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);

    // الحقول الإجبارية الستة
    const [step1_academicYear, setStep1_academicYear] = useState('');
    const [step2_semester, setStep2_semester] = useState('');
    const [step3_subject, setStep3_subject] = useState('');
    const [step4_assessmentType, setStep4_assessmentType] = useState('');
    const [step5_date, setStep5_date] = useState('');
    const [step6_grade, setStep6_grade] = useState('');
    const [step6_notes, setStep6_notes] = useState('');
    const [step6_teacherName, setStep6_teacherName] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // تحميل السنوات الدراسية عند تحميل المكون
    useEffect(() => {
        const loadHierarchyData = async () => {
            try {
                // تحميل السنوات الدراسية
                const { data: years, error: yearsError } = await supabase
                    .from('academic_years')
                    .select('*')
                    .eq('is_active', true);

                if (yearsError) throw yearsError;
                setAcademicYears(years || []);

                // تحميل الدرجات الموجودة
                const { data: existingGrades, error: gradesError } = await supabase
                    .from('grades')
                    .select('*')
                    .eq('student_id', studentId)
                    .order('assessment_date', { ascending: false });

                if (gradesError) throw gradesError;
                setGrades(existingGrades || []);
            } catch (error) {
                console.error('خطأ في تحميل البيانات:', error);
            }
        };

        loadHierarchyData();
    }, [studentId]);

    // تحميل الفصول عند تغيير السنة الدراسية
    useEffect(() => {
        const loadSemesters = async () => {
            if (!step1_academicYear) {
                setSemesters([]);
                setStep2_semester('');
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('semesters')
                    .select('*')
                    .eq('academic_year_id', step1_academicYear)
                    .eq('is_active', true)
                    .order('order_number');

                if (error) throw error;
                setSemesters(data || []);
            } catch (error) {
                console.error('خطأ في تحميل الفصول:', error);
            }
        };

        loadSemesters();
    }, [step1_academicYear]);

    // تحميل المواد عند تغيير الفصل
    useEffect(() => {
        const loadSubjects = async () => {
            if (!step2_semester) {
                setSubjects([]);
                setStep3_subject('');
                return;
            }

            try {
                // تحميل جميع المواد النشطة
                const { data, error } = await supabase
                    .from('subjects')
                    .select('*')
                    .eq('is_active', true)
                    .order('subject_name_ar');

                if (error) throw error;
                setSubjects(data || []);
            } catch (error) {
                console.error('خطأ في تحميل المواد:', error);
            }
        };

        loadSubjects();
    }, [step2_semester]);

    // تحميل أنواع التقييم عند تغيير المادة
    useEffect(() => {
        const loadAssessmentTypes = async () => {
            if (!step3_subject) {
                setAssessmentTypes([]);
                setStep4_assessmentType('');
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('assessment_types')
                    .select('*')
                    .eq('is_active', true)
                    .order('weight', { ascending: false });

                if (error) throw error;
                setAssessmentTypes(data || []);
            } catch (error) {
                console.error('خطأ في تحميل أنواع التقييم:', error);
            }
        };

        loadAssessmentTypes();
    }, [step3_subject]);

    // التحقق من صحة البيانات
    const validateStep = (stepNumber: number): boolean => {
        const errors: string[] = [];

        switch (stepNumber) {
            case 1:
                if (!step1_academicYear) errors.push('يجب اختيار السنة الدراسية');
                break;
            case 2:
                if (!step2_semester) errors.push('يجب اختيار الفصل الدراسي');
                break;
            case 3:
                if (!step3_subject) errors.push('يجب اختيار المادة الدراسية');
                break;
            case 4:
                if (!step4_assessmentType) errors.push('يجب اختيار نوع التقييم');
                break;
            case 5:
                if (!step5_date) errors.push('يجب تحديد تاريخ التقييم');
                break;
            case 6:
                if (!step6_grade) errors.push('يجب إدخال الدرجة');
                if (isNaN(parseFloat(step6_grade))) errors.push('الدرجة يجب أن تكون رقم');
                if (parseFloat(step6_grade) < 0 || parseFloat(step6_grade) > 100) 
                    errors.push('الدرجة يجب أن تكون بين 0 و 100');
                if (!step6_teacherName) errors.push('يجب إدخال اسم المعلم');
                break;
        }

        setValidationErrors(errors);
        return errors.length === 0;
    };

    // الانتقال للخطوة التالية
    const goToNextStep = () => {
        if (validateStep(currentStep)) {
            if (currentStep < 6) {
                setCurrentStep(currentStep + 1);
                setValidationErrors([]);
            }
        }
    };

    // الرجوع للخطوة السابقة
    const goToPreviousStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setValidationErrors([]);
        }
    };

    // إضافة الدرجة الجديدة
    const handleAddGrade = async () => {
        if (!validateStep(6)) return;

        try {
            setIsSaving(true);

            // إدراج الدرجة الجديدة
            const { data, error } = await supabase
                .from('grades')
                .insert([{
                    student_id: studentId,
                    academic_year_id: step1_academicYear,
                    semester_id: step2_semester,
                    subject_id: step3_subject,
                    assessment_type_id: step4_assessmentType,
                    assessment_date: step5_date,
                    original_grade: parseFloat(step6_grade),
                    final_grade: parseFloat(step6_grade),
                    teacher_name: step6_teacherName,
                    teacher_notes: step6_notes,
                    created_by: step6_teacherName,
                }])
                .select();

            if (error) throw error;

            // تحديث قائمة الدرجات
            setGrades([...(data || []), ...grades]);

            // إعادة تعيين النموذج
            setStep1_academicYear('');
            setStep2_semester('');
            setStep3_subject('');
            setStep4_assessmentType('');
            setStep5_date('');
            setStep6_grade('');
            setStep6_notes('');
            setStep6_teacherName('');
            setCurrentStep(1);

            // استدعاء دالة الحفظ إن وجدت
            if (onSave) {
                await onSave([...(data || []), ...grades]);
            }
        } catch (error) {
            console.error('خطأ في إضافة الدرجة:', error);
            setValidationErrors(['حدث خطأ عند إضافة الدرجة']);
        } finally {
            setIsSaving(false);
        }
    };

    // حذف درجة
    const handleDeleteGrade = async (gradeId: string) => {
        try {
            const { error } = await supabase
                .from('grades')
                .delete()
                .eq('id', gradeId);

            if (error) throw error;

            setGrades(grades.filter(g => g.id !== gradeId));
        } catch (error) {
            console.error('خطأ في حذف الدرجة:', error);
        }
    };

    // الحصول على أسماء العناصر المختارة
    const getSelectedNames = () => {
        const year = academicYears.find(y => y.id === step1_academicYear);
        const semester = semesters.find(s => s.id === step2_semester);
        const subject = subjects.find(s => s.id === step3_subject);
        const assessment = assessmentTypes.find(a => a.id === step4_assessmentType);

        return { year, semester, subject, assessment };
    };

    const { year, semester, subject, assessment } = getSelectedNames();

    return (
        <div className="space-y-6">
            {/* عرض المسار الهرمي */}
            {step1_academicYear && (
                <Card className="p-4 bg-blue-50 border-blue-200">
                    <div className="text-sm font-medium text-gray-700 space-y-1">
                        <div>📅 السنة: {year?.year_name_ar}</div>
                        {semester && <div>📆 الفصل: {semester.semester_name_ar}</div>}
                        {subject && <div>📚 المادة: {subject.subject_name_ar}</div>}
                        {assessment && <div>📌 النوع: {assessment.assessment_name_ar}</div>}
                        {step5_date && <div>📅 التاريخ: {step5_date}</div>}
                    </div>
                </Card>
            )}

            {/* رسائل الخطأ */}
            {validationErrors.length > 0 && (
                <Card className="p-4 bg-red-50 border-red-200">
                    <div className="flex gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            {validationErrors.map((error, i) => (
                                <div key={i} className="text-sm text-red-700">{error}</div>
                            ))}
                        </div>
                    </div>
                </Card>
            )}

            {/* النموذج بالخطوات */}
            <Card className="p-6">
                <h3 className="text-lg font-bold mb-6">الخطوة {currentStep} من 6</h3>

                {currentStep === 1 && (
                    <div>
                        <Label htmlFor="academic-year" className="mb-2">اختر السنة الدراسية *</Label>
                        <Select value={step1_academicYear} onValueChange={setStep1_academicYear}>
                            <SelectTrigger id="academic-year">
                                <SelectValue placeholder="اختر السنة الدراسية" />
                            </SelectTrigger>
                            <SelectContent>
                                {academicYears.map(year => (
                                    <SelectItem key={year.id} value={year.id}>
                                        {year.year_name_ar}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {currentStep === 2 && (
                    <div>
                        <Label htmlFor="semester" className="mb-2">اختر الفصل الدراسي *</Label>
                        <Select value={step2_semester} onValueChange={setStep2_semester}>
                            <SelectTrigger id="semester">
                                <SelectValue placeholder="اختر الفصل الدراسي" />
                            </SelectTrigger>
                            <SelectContent>
                                {semesters.map(sem => (
                                    <SelectItem key={sem.id} value={sem.id}>
                                        {sem.semester_name_ar}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {currentStep === 3 && (
                    <div>
                        <Label htmlFor="subject" className="mb-2">اختر المادة الدراسية *</Label>
                        <Select value={step3_subject} onValueChange={setStep3_subject}>
                            <SelectTrigger id="subject">
                                <SelectValue placeholder="اختر المادة الدراسية" />
                            </SelectTrigger>
                            <SelectContent>
                                {subjects.map(subj => (
                                    <SelectItem key={subj.id} value={subj.id}>
                                        {subj.subject_name_ar}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {currentStep === 4 && (
                    <div>
                        <Label htmlFor="assessment" className="mb-2">اختر نوع التقييم *</Label>
                        <Select value={step4_assessmentType} onValueChange={setStep4_assessmentType}>
                            <SelectTrigger id="assessment">
                                <SelectValue placeholder="اختر نوع التقييم" />
                            </SelectTrigger>
                            <SelectContent>
                                {assessmentTypes.map(type => (
                                    <SelectItem key={type.id} value={type.id}>
                                        {type.assessment_name_ar}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {currentStep === 5 && (
                    <div>
                        <Label htmlFor="date" className="mb-2">تاريخ التقييم *</Label>
                        <Input
                            id="date"
                            type="date"
                            value={step5_date}
                            onChange={(e) => setStep5_date(e.target.value)}
                            className="w-full"
                        />
                    </div>
                )}

                {currentStep === 6 && (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="teacher" className="mb-2">اسم المعلم *</Label>
                            <Input
                                id="teacher"
                                value={step6_teacherName}
                                onChange={(e) => setStep6_teacherName(e.target.value)}
                                placeholder="أدخل اسم المعلم"
                            />
                        </div>

                        <div>
                            <Label htmlFor="grade" className="mb-2">الدرجة (0-100) *</Label>
                            <Input
                                id="grade"
                                type="number"
                                min="0"
                                max="100"
                                value={step6_grade}
                                onChange={(e) => setStep6_grade(e.target.value)}
                                placeholder="أدخل الدرجة"
                            />
                        </div>

                        <div>
                            <Label htmlFor="notes" className="mb-2">ملاحظات المعلم (اختياري)</Label>
                            <Textarea
                                id="notes"
                                value={step6_notes}
                                onChange={(e) => setStep6_notes(e.target.value)}
                                placeholder="أدخل ملاحظات إضافية"
                                rows={3}
                            />
                        </div>
                    </div>
                )}

                {/* أزرار التنقل */}
                <div className="flex gap-3 mt-8 justify-end">
                    {currentStep > 1 && (
                        <Button variant="outline" onClick={goToPreviousStep}>
                            السابق
                        </Button>
                    )}

                    {currentStep < 6 ? (
                        <Button onClick={goToNextStep} className="bg-blue-600 hover:bg-blue-700">
                            التالي
                        </Button>
                    ) : (
                        <Button onClick={handleAddGrade} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                            {isSaving ? 'جاري الحفظ...' : 'حفظ الدرجة'}
                        </Button>
                    )}
                </div>
            </Card>

            {/* جدول الدرجات */}
            {grades.length > 0 && (
                <Card className="p-6">
                    <h3 className="text-lg font-bold mb-4">الدرجات المسجلة</h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>المادة</TableHead>
                                <TableHead>نوع التقييم</TableHead>
                                <TableHead>التاريخ</TableHead>
                                <TableHead>الدرجة</TableHead>
                                <TableHead>المعلم</TableHead>
                                <TableHead>الإجراء</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {grades.map(grade => (
                                <TableRow key={grade.id}>
                                    <TableCell>{grade.subjectName}</TableCell>
                                    <TableCell>{grade.assessmentType}</TableCell>
                                    <TableCell>{grade.assessmentDate}</TableCell>
                                    <TableCell className="font-bold">{grade.finalGrade}/100</TableCell>
                                    <TableCell>{grade.teacherName}</TableCell>
                                    <TableCell>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => grade.id && handleDeleteGrade(grade.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </div>
    );
}
