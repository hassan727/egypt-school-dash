import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    SUBJECTS_LIST,
    ASSESSMENT_TYPES,
    MONTHS,
    SEMESTERS,
    calculateGradeLevel,
    calculateWeightedFinalGrade,
    ASSESSMENT_WEIGHTS
} from '@/data/studentConstants';
import { Grade, GradeAuditLog } from '@/types/student';
import { Plus, Save, Trash2, X, Clock, User, BookOpen, Calculator } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface GradeManagementFormProps {
    studentId: string;
    studentName?: string;
    onSave?: (grades: Grade[]) => Promise<void>;
    initialGrades?: Grade[];
}

/**
 * مكون إدارة الدرجات - المنطق الصحيح
 * 
 * سير العمل:
 * 1. المعلم يختار المادة من القائمة
 * 2. يختار نوع التقييم
 * 3. بناءً على النوع، تظهر dropdowns إضافية (شهر/ترم)
 * 4. يدخل الدرجة والملاحظات
 * 5. عند الحفظ، يتم:
 *    - تسجيل المعلم واسمه وتاريخ الإضافة
 *    - حساب الدرجة النهائية مع الأوزان
 *    - تحديث سجل التعديلات (Audit Log)
 *    - عرض منظم بالتواريخ والأوقات
 */
export function GradeManagementForm({
    studentId,
    studentName = 'الطالب',
    onSave,
    initialGrades = []
}: GradeManagementFormProps) {
    const [grades, setGrades] = useState<Grade[]>(initialGrades);
    const [auditLogs, setAuditLogs] = useState<GradeAuditLog[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [currentTeacher, setCurrentTeacher] = useState('أحمد محمد'); // اسم المعلم الحالي (يمكن تغييره)
    const [loading, setLoading] = useState(true);

    // حالة النموذج الجديد
    const [newGrade, setNewGrade] = useState<Partial<Grade>>({
        subjectName: '',
        assessmentType: 'تقييم أسبوعي',
        originalGrade: 0,
        finalGrade: 0,
    });

    // تحميل الدرجات من قاعدة البيانات عند تحميل المكون
    useEffect(() => {
        const fetchGrades = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('grades')
                    .select('*')
                    .eq('student_id', studentId)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                
                const formattedGrades: Grade[] = (data || []).map(grade => ({
                    id: grade.id,
                    studentId: grade.student_id,
                    subjectName: grade.subject_name,
                    teacherName: grade.teacher_name,
                    assessmentType: grade.assessment_type as any,
                    month: grade.month,
                    semester: grade.semester as 'الترم الأول' | 'الترم الثاني' | undefined,
                    originalGrade: grade.original_grade,
                    finalGrade: grade.final_grade,
                    gradeLevel: grade.grade_level as 'ممتاز' | 'جيد جدًّا' | 'جيد' | 'مقبول' | 'ضعيف' | undefined,
                    teacherNotes: grade.teacher_notes,
                    weight: grade.weight,
                    createdAt: grade.created_at,
                    updatedAt: grade.updated_at,
                    createdBy: grade.created_by,
                }));

                setGrades(formattedGrades);
            } catch (err) {
                console.error('خطأ في تحميل الدرجات:', err);
            } finally {
                setLoading(false);
            }
        };

        if (studentId) {
            fetchGrades();
        }
    }, [studentId]);

    // إعادة تعيين النموذج
    const resetForm = () => {
        setNewGrade({
            subjectName: '',
            assessmentType: 'تقييم أسبوعي',
            originalGrade: 0,
            finalGrade: 0,
            month: undefined,
            semester: undefined,
            teacherNotes: '',
        });
    };

    // معالجة تغيير المادة
    const handleSubjectChange = (subject: string) => {
        setNewGrade(prev => ({
            ...prev,
            subjectName: subject,
        }));
    };

    // معالجة تغيير نوع التقييم
    const handleAssessmentTypeChange = (type: string) => {
        setNewGrade(prev => ({
            ...prev,
            assessmentType: type as any,
            month: undefined,
            semester: undefined,
        }));
    };

    // معالجة تغيير الدرجة
    const handleGradeChange = (grade: number) => {
        const gradeLevel = calculateGradeLevel(grade);
        setNewGrade(prev => ({
            ...prev,
            originalGrade: grade,
            finalGrade: grade,
            gradeLevel,
            weight: ASSESSMENT_WEIGHTS[prev.assessmentType as string] || 0.1,
        }));
    };

    // إضافة درجة جديدة
    const handleAddGrade = async () => {
        if (!newGrade.subjectName || newGrade.originalGrade === undefined) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        // التحقق من الحقول التفاعلية
        if (newGrade.assessmentType === 'تقييم شهري' && !newGrade.month) {
            alert('يرجى اختيار الشهر');
            return;
        }

        if (
            (newGrade.assessmentType === 'امتحان منتصف الفصل' ||
                newGrade.assessmentType === 'امتحان نهاية الفصل') &&
            !newGrade.semester
        ) {
            alert('يرجى اختيار الترم');
            return;
        }

        const now = new Date();
        const formattedDate = now.toLocaleString('ar-EG', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });

        try {
            // حفظ الدرجة في قاعدة البيانات
            const { data, error } = await supabase
                .from('grades')
                .insert([{
                    student_id: studentId,
                    subject_name: newGrade.subjectName,
                    teacher_name: currentTeacher,
                    assessment_type: newGrade.assessmentType,
                    month: newGrade.month,
                    semester: newGrade.semester,
                    original_grade: newGrade.originalGrade,
                    final_grade: newGrade.originalGrade, // الدرجة النهائية تساوي الأصلية عند الإدخال
                    grade_level: newGrade.gradeLevel,
                    teacher_notes: newGrade.teacherNotes,
                    weight: ASSESSMENT_WEIGHTS[newGrade.assessmentType as string] || 0.1,
                    created_by: currentTeacher,
                }])
                .select();

            if (error) throw error;

            // تنسيق الدرجة المُدخلة
            const gradeEntry: Grade = {
                id: data[0].id,
                studentId: data[0].student_id,
                subjectName: data[0].subject_name,
                teacherName: data[0].teacher_name,
                assessmentType: data[0].assessment_type as any,
                month: data[0].month,
                semester: data[0].semester as 'الترم الأول' | 'الترم الثاني' | undefined,
                originalGrade: data[0].original_grade,
                finalGrade: data[0].final_grade,
                gradeLevel: data[0].grade_level as 'ممتاز' | 'جيد جدًّا' | 'جيد' | 'مقبول' | 'ضعيف' | undefined,
                teacherNotes: data[0].teacher_notes,
                weight: data[0].weight,
                createdAt: data[0].created_at,
                updatedAt: data[0].updated_at,
                createdBy: data[0].created_by,
            };

            // إنشاء سجل تعديل (Audit Log)
            const auditEntry: GradeAuditLog = {
                id: `audit_${Date.now()}`,
                gradeId: gradeEntry.id || '',
                studentId,
                subjectName: gradeEntry.subjectName,
                actionType: 'إضافة',
                teacherName: currentTeacher,
                newValue: gradeEntry.finalGrade,
                timestamp: formattedDate,
                notes: `أضاف درجة ${gradeEntry.assessmentType}${gradeEntry.month ? ` (${gradeEntry.month})` : ''}${gradeEntry.semester ? ` (${gradeEntry.semester})` : ''} بقيمة ${gradeEntry.finalGrade}/100`,
            };

            const updatedGrades = [...grades, gradeEntry];
            const updatedAuditLogs = [...auditLogs, auditEntry];

            setGrades(updatedGrades);
            setAuditLogs(updatedAuditLogs);

            // تحديث السجلات الأكاديمية للطالب
            await updateStudentAcademicRecord(studentId, updatedGrades);

            resetForm();
            setShowForm(false);
        } catch (error) {
            console.error('خطأ في حفظ الدرجة:', error);
            alert('حدث خطأ في حفظ الدرجة');
        }
    };

    // تحديث السجلات الأكاديمية للطالب بناءً على الدرجات
    const updateStudentAcademicRecord = async (studentId: string, studentGrades: Grade[]) => {
        try {
            // حساب متوسط الدرجات وGPA
            const subjects = [...new Set(studentGrades.map(g => g.subjectName))];
            let totalFinalGrade = 0;
            let subjectCount = 0;

            subjects.forEach(subject => {
                const subjectGrades = studentGrades.filter(g => g.subjectName === subject);
                if (subjectGrades.length > 0) {
                    const finalGrade = calculateWeightedFinalGrade(subjectGrades);
                    totalFinalGrade += finalGrade;
                    subjectCount++;
                }
            });

            const averageMarks = subjectCount > 0 ? totalFinalGrade / subjectCount : 0;
            const currentGPA = Math.min(4.0, Math.max(0, (averageMarks / 100) * 4)); // تحويل إلى نظام 4.0
            
            // تحديد حالة النجاح
            const passingStatus = averageMarks >= 60 ? 'ناجح' : 'راسب';

            // تحديث السجل الأكاديمي
            const { error: academicError } = await supabase
                .from('academic_records')
                .upsert({
                    student_id: studentId,
                    current_gpa: parseFloat(currentGPA.toFixed(2)),
                    average_marks: parseFloat(averageMarks.toFixed(2)),
                    total_marks: parseFloat(totalFinalGrade.toFixed(2)),
                    passing_status: passingStatus,
                    last_exam_date: new Date().toISOString().split('T')[0],
                });

            if (academicError) throw academicError;
        } catch (err) {
            console.error('خطأ في تحديث السجل الأكاديمي:', err);
        }
    };

    // حذف درجة
    const handleDeleteGrade = async (gradeId: string | undefined) => {
        if (!gradeId) return;

        try {
            // حذف الدرجة من قاعدة البيانات
            const { error } = await supabase
                .from('grades')
                .delete()
                .eq('id', gradeId);

            if (error) throw error;

            const gradeToDelete = grades.find(g => g.id === gradeId);
            const updatedGrades = grades.filter(g => g.id !== gradeId);

            // إنشاء سجل حذف
            if (gradeToDelete) {
                const now = new Date();
                const formattedDate = now.toLocaleString('ar-EG', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                });

                const deleteAuditEntry: GradeAuditLog = {
                    id: `audit_${Date.now()}`,
                    gradeId,
                    studentId,
                    subjectName: gradeToDelete.subjectName,
                    actionType: 'حذف',
                    teacherName: currentTeacher,
                    oldValue: gradeToDelete.finalGrade,
                    timestamp: formattedDate,
                    notes: `حذف درجة ${gradeToDelete.assessmentType}`,
                };

                setAuditLogs([...auditLogs, deleteAuditEntry]);
            }

            setGrades(updatedGrades);

            // تحديث السجلات الأكاديمية للطالب
            await updateStudentAcademicRecord(studentId, updatedGrades);
        } catch (error) {
            console.error('خطأ في حذف الدرجة:', error);
            alert('حدث خطأ في حذف الدرجة');
        }
    };

    // تجميع الدرجات حسب المادة
    const gradesBySubject = grades.reduce((acc, grade) => {
        const subject = grade.subjectName;
        if (!acc[subject]) {
            acc[subject] = [];
        }
        acc[subject].push(grade);
        return acc;
    }, {} as Record<string, Grade[]>);

    // حساب الدرجة النهائية لكل مادة مع الأوزان
    const calculateSubjectFinalGrade = (subjectGrades: Grade[]): number => {
        return calculateWeightedFinalGrade(subjectGrades);
    };

    // تنسيق التاريخ والوقت للعرض
    const formatDateTime = (isoString?: string): string => {
        if (!isoString) return '-';
        try {
            const date = new Date(isoString);
            return date.toLocaleString('ar-EG', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
        } catch {
            return '-';
        }
    };

    // بناء وصف نوع التقييم مع التفاصيل
    const getAssessmentDescription = (grade: Grade): string => {
        let desc = grade.assessmentType;
        if (grade.month) desc += ` (${grade.month})`;
        if (grade.semester) desc += ` (${grade.semester})`;
        return desc;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="text-gray-500">جاري تحميل الدرجات...</div>
            </div>
        );
    }

    // حساب الإحصائيات العامة
    const subjects = Object.keys(gradesBySubject);
    const totalSubjects = subjects.length;
    let totalAverage = 0;
    let gpaSum = 0;
    
    subjects.forEach(subject => {
        const subjectGrades = gradesBySubject[subject];
        const finalGrade = calculateSubjectFinalGrade(subjectGrades);
        totalAverage += finalGrade;
        gpaSum += Math.min(4.0, Math.max(0, (finalGrade / 100) * 4));
    });
    
    const overallAverage = totalSubjects > 0 ? totalAverage / totalSubjects : 0;
    const overallGPA = totalSubjects > 0 ? gpaSum / totalSubjects : 0;
    const overallGradeLevel = calculateGradeLevel(overallAverage);

    return (
        <div className="space-y-6">
            {/* معلومات الطالب الحالية */}
            <Card className="p-4 bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <p className="text-sm text-gray-600">الطالب:</p>
                        <p className="font-bold text-lg text-gray-800">{studentName}</p>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-gray-600">معرف الطالب:</p>
                        <p className="font-bold text-lg text-gray-800">{studentId}</p>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-gray-600">المعلم الحالي:</p>
                        <Input
                            type="text"
                            value={currentTeacher}
                            onChange={(e) => setCurrentTeacher(e.target.value)}
                            className="text-sm"
                            placeholder="أدخل اسم المعلم"
                        />
                    </div>
                </div>
            </Card>

            {/* ملخص الأداء الأكاديمي */}
            {totalSubjects > 0 && (
                <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-green-600" />
                        ملخص الأداء الأكاديمي
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <p className="text-sm text-gray-600">عدد المواد</p>
                            <p className="text-2xl font-bold text-green-600">{totalSubjects}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <p className="text-sm text-gray-600">المعدل العام</p>
                            <p className="text-2xl font-bold text-blue-600">{overallAverage.toFixed(2)}%</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <p className="text-sm text-gray-600">المعدل التراكمي</p>
                            <p className="text-2xl font-bold text-purple-600">{overallGPA.toFixed(2)}/4.0</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <p className="text-sm text-gray-600">التقدير العام</p>
                            <p className="text-2xl font-bold text-indigo-600">{overallGradeLevel}</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* زر إضافة درجة جديدة */}
            {!showForm && (
                <Button
                    onClick={() => setShowForm(true)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                >
                    <Plus className="h-5 w-5" />
                    إضافة درجة جديدة
                </Button>
            )}

            {/* نموذج إضافة درجة جديدة */}
            {showForm && (
                <Card className="p-6 bg-white border border-green-200 shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800">إضافة درجة جديدة</h3>
                        <button
                            onClick={() => {
                                setShowForm(false);
                                resetForm();
                            }}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* الخطوة 1: اختيار المادة */}
                        <div>
                            <Label className="block text-sm font-semibold text-gray-700 mb-3">
                                🎓 المادة الدراسية
                            </Label>
                            <Select value={newGrade.subjectName || ''} onValueChange={handleSubjectChange}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="اختر المادة الدراسية..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {SUBJECTS_LIST.map(subject => (
                                        <SelectItem key={subject} value={subject}>
                                            {subject}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                        </div>

                        {/* الخطوة 2: اختيار نوع التقييم */}
                        {newGrade.subjectName && (
                            <div>
                                <Label className="block text-sm font-semibold text-gray-700 mb-3">
                                    📋 نوع التقييم
                                </Label>
                                <Select
                                    value={newGrade.assessmentType || 'تقييم أسبوعي'}
                                    onValueChange={handleAssessmentTypeChange}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="اختر نوع التقييم..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ASSESSMENT_TYPES.map(type => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* الخطوة 3: الحقول التفاعلية بناءً على نوع التقييم */}
                        {newGrade.subjectName && newGrade.assessmentType === 'تقييم شهري' && (
                            <div>
                                <Label className="block text-sm font-semibold text-gray-700 mb-3">
                                    📅 الشهر
                                </Label>
                                <Select value={newGrade.month || ''} onValueChange={(month) =>
                                    setNewGrade(prev => ({ ...prev, month }))
                                }>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="اختر الشهر..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MONTHS.map(month => (
                                            <SelectItem key={month} value={month}>
                                                {month}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {newGrade.subjectName &&
                            (newGrade.assessmentType === 'امتحان منتصف الفصل' ||
                                newGrade.assessmentType === 'امتحان نهاية الفصل') && (
                                <div>
                                    <Label className="block text-sm font-semibold text-gray-700 mb-3">
                                        📅 الترم الدراسي
                                    </Label>
                                    <Select value={newGrade.semester || ''} onValueChange={(semester) =>
                                        setNewGrade(prev => ({
                                            ...prev,
                                            semester: semester as 'الترم الأول' | 'الترم الثاني',
                                        }))
                                    }>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="اختر الترم..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SEMESTERS.map(semester => (
                                                <SelectItem key={semester} value={semester}>
                                                    {semester}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                        {/* الخطوة 4: إدخال الدرجة */}
                        {newGrade.subjectName && (
                            <div>
                                <Label htmlFor="grade" className="block text-sm font-semibold text-gray-700 mb-3">
                                    📊 الدرجة (من 100)
                                </Label>
                                <Input
                                    id="grade"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={newGrade.originalGrade || ''}
                                    onChange={(e) => handleGradeChange(parseFloat(e.target.value))}
                                    placeholder="أدخل الدرجة من 100"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                                {newGrade.gradeLevel && (
                                    <div className="mt-3 space-y-2">
                                        <p className="text-sm font-semibold">
                                            التقدير: <span className="text-green-600 text-lg">{newGrade.gradeLevel}</span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ملاحظات المعلم */}
                        {newGrade.subjectName && (
                            <div>
                                <Label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-3">
                                    💬 ملاحظات المعلم (اختيارية)
                                </Label>
                                <Textarea
                                    id="notes"
                                    value={newGrade.teacherNotes || ''}
                                    onChange={(e) => setNewGrade(prev => ({ ...prev, teacherNotes: e.target.value }))}
                                    placeholder="أضف ملاحظات عن أداء الطالب في هذه المادة..."
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    rows={3}
                                />
                            </div>
                        )}

                        {/* أزرار الحفظ والإلغاء */}
                        {newGrade.subjectName && (
                            <div className="flex gap-3 justify-end">
                                <Button
                                    onClick={() => {
                                        setShowForm(false);
                                        resetForm();
                                    }}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800"
                                >
                                    إلغاء
                                </Button>
                                <Button
                                    onClick={handleAddGrade}
                                    disabled={isSaving}
                                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    {isSaving ? 'جاري الحفظ...' : 'حفظ الدرجة'}
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* عرض الدرجات مجمعة حسب المادة */}
            {Object.keys(gradesBySubject).length > 0 ? (
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">📚 الدرجات حسب المادة</h3>

                    {Object.entries(gradesBySubject).map(([subjectName, subjectGrades]) => {
                        const finalGrade = calculateSubjectFinalGrade(subjectGrades);
                        const gradeLevel = calculateGradeLevel(finalGrade);
                        const teacherName = subjectGrades[0]?.teacherName;

                        return (
                            <Card key={subjectName} className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                                {/* رأس المادة */}
                                <div className="mb-6 pb-4 border-b border-blue-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600">المادة الدراسية</p>
                                            <p className="text-xl font-bold text-gray-800">{subjectName}</p>
                                            {teacherName && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    👨‍🏫 {teacherName}
                                                </p>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-600">الدرجة النهائية</p>
                                                <p className="text-2xl font-bold text-green-600">
                                                    {finalGrade.toFixed(2)}/100
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">التقدير</p>
                                                <p className="text-2xl font-bold text-indigo-600">{gradeLevel}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-3">
                                        عدد التقييمات: {subjectGrades.length}
                                    </p>
                                </div>

                                {/* جدول الدرجات الفردية */}
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-right">نوع التقييم</TableHead>
                                                <TableHead className="text-right">التفاصيل</TableHead>
                                                <TableHead className="text-right">الدرجة الأصلية</TableHead>
                                                <TableHead className="text-right">الدرجة النهائية</TableHead>
                                                <TableHead className="text-right">التقدير</TableHead>
                                                <TableHead className="text-right">المعلم</TableHead>
                                                <TableHead className="text-right">التاريخ</TableHead>
                                                <TableHead className="text-right">إجراءات</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {subjectGrades.map((grade) => (
                                                <TableRow key={grade.id} className="hover:bg-blue-50">
                                                    <TableCell className="font-medium">{grade.assessmentType}</TableCell>
                                                    <TableCell>
                                                        {grade.month && <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">شهر: {grade.month}</span>}
                                                        {grade.semester && <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">ترم: {grade.semester}</span>}
                                                    </TableCell>
                                                    <TableCell className="font-bold">{grade.originalGrade}/100</TableCell>
                                                    <TableCell className="font-bold text-green-600">{grade.finalGrade}/100</TableCell>
                                                    <TableCell>
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            {grade.gradeLevel}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>{grade.createdBy}</TableCell>
                                                    <TableCell>{formatDateTime(grade.createdAt)}</TableCell>
                                                    <TableCell>
                                                        <Button
                                                            onClick={() => handleDeleteGrade(grade.id)}
                                                            size="sm"
                                                            variant="destructive"
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* ملاحظات المعلم */}
                                {subjectGrades.some(grade => grade.teacherNotes) && (
                                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                        <h4 className="font-semibold text-yellow-800 mb-2">ملاحظات المعلم:</h4>
                                        {subjectGrades
                                            .filter(grade => grade.teacherNotes)
                                            .map(grade => (
                                                <div key={grade.id} className="text-sm text-yellow-700 mb-1">
                                                    <span className="font-medium">{grade.assessmentType}:</span> {grade.teacherNotes}
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            ) : (
                !showForm && !loading && (
                    <Card className="p-8 text-center bg-gray-50 border border-gray-200">
                        <p className="text-gray-600 text-lg">لم تتم إضافة أي درجات بعد.</p>
                        <p className="text-gray-500 text-sm mt-2">ابدأ بإضافة درجة جديدة للطالب</p>
                    </Card>
                )
            )}

            {/* سجل التعديلات (Audit Log) */}
            {auditLogs.length > 0 && (
                <Card className="p-6 bg-gray-50 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">📋 سجل التعديلات</h3>
                    <div className="space-y-2">
                        {[...auditLogs].reverse().map((log) => (
                            <div key={log.id} className="p-3 bg-white border border-gray-200 rounded text-sm">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold mr-2 ${log.actionType === 'إضافة' ? 'bg-green-100 text-green-700' :
                                            log.actionType === 'تعديل' ? 'bg-blue-100 text-blue-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {log.actionType}
                                        </span>
                                        <span className="font-semibold">{log.subjectName}</span>
                                    </div>
                                    <span className="text-xs text-gray-600">{log.timestamp}</span>
                                </div>
                                <p className="text-gray-700 mt-1">👤 {log.teacherName} - {log.notes}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}