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
import { useAcademicAuditLog } from '@/hooks/useAcademicAuditLog';
import { Plus, Save, Trash2, X, Clock, User, BookOpen, Calculator } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getEgyptianDateString } from '@/utils/helpers';

interface GradeManagementFormProps {
    studentId: string;
    studentName?: string;
    onSave?: (grades: Grade[]) => Promise<void>;
    initialGrades?: Grade[];
}

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
    const [currentTeacher, setCurrentTeacher] = useState('أحمد محمد');
    const [loading, setLoading] = useState(true);

    const { createAuditLog } = useAcademicAuditLog();

    const [newGrade, setNewGrade] = useState<Partial<Grade>>({
        subjectName: '',
        assessmentType: 'تقييم أسبوعي',
        originalGrade: 0,
        finalGrade: 0,
        semester: 'الفصل الأول',
    });

    const [selectedAcademicYear, setSelectedAcademicYear] = useState('2025-2026');
    const [selectedSemester, setSelectedSemester] = useState('الفصل الأول');
    const [assessmentDate, setAssessmentDate] = useState('');
    const [changeReason, setChangeReason] = useState('');
    const [seatNumber, setSeatNumber] = useState('');

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
                    academic_year_id: grade.academic_year_id,
                    semester_id: grade.semester_id,
                    subject_id: grade.subject_id,
                    assessment_type_id: grade.assessment_type_id,
                    teacherName: grade.teacher_name,
                    assessmentDate: grade.assessment_date,
                    seatNumber: grade.seat_number,
                    originalGrade: grade.original_grade,
                    finalGrade: grade.final_grade,
                    gradeLevel: grade.grade_level,
                    teacherNotes: grade.teacher_notes,
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

    const checkDateConflict = (date: string, subject: string): boolean => {
        return grades.some(grade =>
            grade.assessmentDate === date &&
            grade.subjectName === subject &&
            grade.studentId === studentId
        );
    };

    const logAuditChange = async (
        gradeId: string,
        actionType: 'CREATE' | 'UPDATE' | 'DELETE',
        fieldName?: string,
        oldValue?: string,
        newValue?: string,
        reason?: string
    ) => {
        try {
            const auditEntry = {
                grade_id: gradeId,
                student_id: studentId,
                user_id: currentTeacher,
                action_type: actionType,
                field_name: fieldName,
                old_value: oldValue,
                new_value: newValue,
                change_reason: reason,
                change_timestamp: new Date().toISOString(),
            };

            console.log('تم تسجيل التغيير في سجل التدقيق:', auditEntry);
        } catch (error) {
            console.error('خطأ في تسجيل التدقيق:', error);
        }
    };

    const resetForm = () => {
        setNewGrade({
            subjectName: '',
            assessmentType: 'تقييم أسبوعي',
            originalGrade: 0,
            finalGrade: 0,
            month: undefined,
            semester: 'الفصل الأول',
            teacherNotes: '',
        });
        setSelectedAcademicYear('2025-2026');
        setSelectedSemester('الفصل الأول');
        setAssessmentDate('');
        setChangeReason('');
        setSeatNumber('');
    };

    const handleSubjectChange = (subject: string) => {
        setNewGrade(prev => ({
            ...prev,
            subjectName: subject,
        }));
    };

    const handleAssessmentTypeChange = (type: string) => {
        const isSemesterBased = type === 'اختبار الفصل الدراسي الأول' || type === 'اختبار نهاية العام الدراسي';
        setNewGrade(prev => ({
            ...prev,
            assessmentType: type as any,
            month: undefined,
            semester: isSemesterBased ? (prev.semester || selectedSemester) : undefined,
        }));
    };

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

    const handleAddGrade = async () => {
        if (!newGrade.subjectName || newGrade.originalGrade === undefined) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        if (!assessmentDate) {
            alert('يرجى تحديد تاريخ التقييم');
            return;
        }

        if (checkDateConflict(assessmentDate, newGrade.subjectName)) {
            alert('يوجد تقييم آخر في نفس التاريخ لهذه المادة! يرجى اختيار تاريخ مختلف.');
            return;
        }

        if (newGrade.assessmentType === 'تقييم شهري' && !newGrade.month) {
            alert('يرجى اختيار الشهر');
            return;
        }

        if (
            (newGrade.assessmentType === 'اختبار الفصل الدراسي الأول' ||
                newGrade.assessmentType === 'اختبار نهاية العام الدراسي') &&
            !newGrade.semester
        ) {
            alert('يرجى اختيار الفصل');
            return;
        }

        if (
            (newGrade.assessmentType === 'اختبار الفصل الدراسي الأول' ||
                newGrade.assessmentType === 'اختبار نهاية العام الدراسي') &&
            !seatNumber.trim()
        ) {
            alert('يرجى إدخال رقم الجلوس');
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
            const { data: academicYearData, error: yearError } = await supabase
                .from('academic_years')
                .select('id')
                .eq('year_code', selectedAcademicYear)
                .single();

            if (yearError || !academicYearData) {
                alert('لم يتم العثور على السنة الدراسية. يرجى إنشاء السنة الدراسية أولاً.');
                return;
            }

            const { data: semesterData, error: semesterError } = await supabase
                .from('semesters')
                .select('id')
                .eq('semester_name_ar', newGrade.semester)
                .eq('academic_year_id', academicYearData.id)
                .single();

            if (semesterError || !semesterData) {
                alert('لم يتم العثور على الفصل الدراسي. يرجى إنشاء الفصل أولاً.');
                return;
            }

            const { data: subjectData, error: subjectError } = await supabase
                .from('subjects')
                .select('id')
                .eq('subject_name_ar', newGrade.subjectName)
                .single();

            if (subjectError || !subjectData) {
                alert('لم يتم العثور على المادة. يرجى إنشاء المادة أولاً.');
                return;
            }

            const { data: assessmentTypeData, error: assessmentError } = await supabase
                .from('assessment_types')
                .select('id')
                .eq('assessment_name_ar', newGrade.assessmentType)
                .single();

            if (assessmentError || !assessmentTypeData) {
                alert('لم يتم العثور على نوع التقييم. يرجى إنشاء نوع التقييم أولاً.');
                return;
            }

            const { data, error } = await supabase
                .from('grades')
                .insert([{
                    student_id: studentId,
                    academic_year_id: academicYearData.id,
                    semester_id: semesterData.id,
                    subject_id: subjectData.id,
                    assessment_type_id: assessmentTypeData.id,
                    teacher_name: currentTeacher,
                    assessment_date: assessmentDate,
                    seat_number: (newGrade.assessmentType === 'اختبار الفصل الدراسي الأول' ||
                                 newGrade.assessmentType === 'اختبار نهاية العام الدراسي') ? seatNumber : null,
                    original_grade: newGrade.originalGrade,
                    final_grade: newGrade.originalGrade,
                    grade_level: newGrade.gradeLevel,
                    teacher_notes: newGrade.teacherNotes,
                    created_by: currentTeacher,
                }])
                .select();

            if (error) throw error;

            const gradeEntry: Grade = {
                id: data[0].id,
                studentId: data[0].student_id,
                academic_year_id: data[0].academic_year_id,
                semester_id: data[0].semester_id,
                subject_id: data[0].subject_id,
                assessment_type_id: data[0].assessment_type_id,
                subjectName: newGrade.subjectName,
                assessmentType: newGrade.assessmentType as any,
                teacherName: data[0].teacher_name,
                assessmentDate: data[0].assessment_date,
                seatNumber: data[0].seat_number,
                originalGrade: data[0].original_grade,
                finalGrade: data[0].final_grade,
                gradeLevel: data[0].grade_level as 'ممتاز' | 'جيد جدًّا' | 'جيد' | 'مقبول' | 'ضعيف' | undefined,
                teacherNotes: data[0].teacher_notes,
                createdAt: data[0].created_at,
                updatedAt: data[0].updated_at,
                createdBy: data[0].created_by,
            };

            await createAuditLog(
                studentId,
                gradeEntry.id || '',
                currentTeacher,
                'CREATE',
                undefined,
                undefined,
                gradeEntry.finalGrade.toString(),
                'إنشاء تقييم جديد'
            );

            const auditEntry: GradeAuditLog = {
                id: `audit_${Date.now()}`,
                gradeId: gradeEntry.id || '',
                studentId,
                subjectName: newGrade.subjectName,
                actionType: 'إضافة',
                teacherName: currentTeacher,
                newValue: gradeEntry.finalGrade,
                timestamp: formattedDate,
                notes: `أضاف درجة ${newGrade.assessmentType}${newGrade.month ? ` (${newGrade.month})` : ''}${newGrade.semester ? ` (${newGrade.semester})` : ''} بقيمة ${gradeEntry.finalGrade}/100`,
            };

            const updatedGrades = [...grades, gradeEntry];
            const updatedAuditLogs = [...auditLogs, auditEntry];

            setGrades(updatedGrades);
            setAuditLogs(updatedAuditLogs);

            await updateStudentAcademicRecord(studentId, updatedGrades);

            resetForm();
            setShowForm(false);
        } catch (error) {
            console.error('خطأ في حفظ الدرجة:', error);
            alert('حدث خطأ في حفظ الدرجة');
        }
    };

    const updateStudentAcademicRecord = async (studentId: string, studentGrades: Grade[]) => {
        try {
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
            const currentGPA = Math.min(4.0, Math.max(0, (averageMarks / 100) * 4));

            const passingStatus = averageMarks >= 60 ? 'ناجح' : 'راسب';

            const { error: academicError } = await supabase
                .from('academic_records')
                .upsert({
                    student_id: studentId,
                    current_gpa: parseFloat(currentGPA.toFixed(2)),
                    average_marks: parseFloat(averageMarks.toFixed(2)),
                    total_marks: parseFloat(totalFinalGrade.toFixed(2)),
                    passing_status: passingStatus,
                    last_exam_date: getEgyptianDateString(),
                });

            if (academicError) throw academicError;

            if (passingStatus === 'ناجح' && subjectCount >= 3) {
                await generateCertificateIfNeeded(studentId, selectedAcademicYear, averageMarks, currentGPA, passingStatus);
            }
        } catch (err) {
            console.error('خطأ في تحديث السجل الأكاديمي:', err);
        }
    };

    const generateCertificateIfNeeded = async (
        studentId: string,
        academicYear: string,
        averageMarks: number,
        gpa: number,
        passingStatus: string
    ) => {
        try {
            const { data: existingCertificate, error: checkError } = await supabase
                .from('certificates')
                .select('id')
                .eq('student_id', studentId)
                .eq('academic_year', academicYear)
                .eq('certificate_type', 'تقدير نهائي')
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                console.error('خطأ في التحقق من الشهادة الموجودة:', checkError);
                return;
            }

            if (existingCertificate) {
                console.log('الشهادة موجودة بالفعل لهذا العام الدراسي');
                return;
            }

            const { data: studentData, error: studentError } = await supabase
                .from('students')
                .select('full_name_ar, stage, class')
                .eq('student_id', studentId)
                .single();

            if (studentError) throw studentError;

            let gradeLevel = 'ضعيف';
            if (averageMarks >= 90) gradeLevel = 'ممتاز';
            else if (averageMarks >= 80) gradeLevel = 'جيد جدًّا';
            else if (averageMarks >= 70) gradeLevel = 'جيد';
            else if (averageMarks >= 60) gradeLevel = 'مقبول';

            const certificateNumber = `CERT-${studentId}-${academicYear.replace('/', '-')}-${Date.now().toString().slice(-4)}`;

            const { error: certError } = await supabase
                .from('certificates')
                .insert({
                    student_id: studentId,
                    certificate_type: 'تقدير نهائي',
                    academic_year: academicYear,
                    stage: studentData.stage,
                    class: studentData.class,
                    issue_date: getEgyptianDateString(),
                    overall_grade: parseFloat(averageMarks.toFixed(2)),
                    overall_gpa: parseFloat(gpa.toFixed(2)),
                    grade_level: gradeLevel,
                    status: 'صالح',
                    issued_by: currentTeacher,
                    certificate_number: certificateNumber,
                    notes: `شهادة تقدير نهائي للعام الدراسي ${academicYear} - ${studentData.full_name_ar}`
                });

            if (certError) {
                console.error('خطأ في إنشاء الشهادة:', certError);
            } else {
                console.log('تم إنشاء الشهادة بنجاح:', certificateNumber);
            }
        } catch (err) {
            console.error('خطأ في إنشاء الشهادة:', err);
        }
    };

    const handleDeleteGrade = async (gradeId: string | undefined) => {
        if (!gradeId) return;

        try {
            const { error } = await supabase
                .from('grades')
                .delete()
                .eq('id', gradeId);

            if (error) throw error;

            const gradeToDelete = grades.find(g => g.id === gradeId);
            const updatedGrades = grades.filter(g => g.id !== gradeId);

            if (gradeToDelete) {
                await createAuditLog(
                    studentId,
                    gradeId,
                    currentTeacher,
                    'DELETE',
                    undefined,
                    gradeToDelete.finalGrade.toString(),
                    undefined,
                    `حذف تقييم ${gradeToDelete.assessmentType}`
                );

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

            await updateStudentAcademicRecord(studentId, updatedGrades);
        } catch (error) {
            console.error('خطأ في حذف الدرجة:', error);
            alert('حدث خطأ في حذف الدرجة');
        }
    };

    const gradesBySubject = grades.reduce((acc, grade) => {
        const subject = grade.subjectName;
        if (!acc[subject]) {
            acc[subject] = [];
        }
        acc[subject].push(grade);
        return acc;
    }, {} as Record<string, Grade[]>);

    const calculateSubjectFinalGrade = (subjectGrades: Grade[]): number => {
        return calculateWeightedFinalGrade(subjectGrades);
    };

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

    const getAssessmentDescription = (grade: Grade): string => {
        let desc = grade.assessmentType || 'تقييم';
        if (grade.month) desc += ` (${grade.month})`;
        return desc;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="text-gray-500">جاري تحميل الدرجات...</div>
            </div>
        );
    }

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

            {!showForm && (
                <Button
                    onClick={() => setShowForm(true)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                >
                    <Plus className="h-5 w-5" />
                    إضافة درجة جديدة
                </Button>
            )}

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
                        <div>
                            <Label className="block text-sm font-semibold text-gray-700 mb-3">
                                📅 السنة الدراسية
                            </Label>
                            <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="اختر السنة الدراسية..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="2024-2025">2024-2025</SelectItem>
                                    <SelectItem value="2025-2026">2025-2026</SelectItem>
                                    <SelectItem value="2026-2027">2026-2027</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="block text-sm font-semibold text-gray-700 mb-3">
                                📆 الفصل الدراسي
                            </Label>
                            <Select value={selectedSemester} onValueChange={(value) => {
                                setSelectedSemester(value);
                                setNewGrade(prev => ({ ...prev, semester: value as 'الفصل الأول' | 'الفصل الثاني' }));
                            }}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="اختر الفصل الدراسي..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="الفصل الأول">الفصل الأول</SelectItem>
                                    <SelectItem value="الفصل الثاني">الفصل الثاني</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

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
                            (newGrade.assessmentType === 'اختبار الفصل الدراسي الأول' ||
                                newGrade.assessmentType === 'اختبار نهاية العام الدراسي') && (
                                <>
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

                                    <div>
                                        <Label htmlFor="seatNumber" className="block text-sm font-semibold text-gray-700 mb-3">
                                            🪑 رقم الجلوس
                                        </Label>
                                        <Input
                                            id="seatNumber"
                                            type="text"
                                            value={seatNumber}
                                            onChange={(e) => setSeatNumber(e.target.value)}
                                            placeholder="أدخل رقم جلوس الطالب"
                                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            رقم الجلوس ثابت للطالب في الفصلين الدراسيين
                                        </p>
                                    </div>
                                </>
                            )}

                        {newGrade.subjectName && (
                            <div>
                                <Label htmlFor="assessmentDate" className="block text-sm font-semibold text-gray-700 mb-3">
                                    📅 تاريخ التقييم
                                </Label>
                                <Input
                                    id="assessmentDate"
                                    type="date"
                                    value={assessmentDate}
                                    onChange={(e) => setAssessmentDate(e.target.value)}
                                    min={selectedAcademicYear === '2025-2026' ? '2025-09-01' : '2024-09-01'}
                                    max={selectedAcademicYear === '2025-2026' ? '2026-06-30' : '2025-06-30'}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                                {assessmentDate && checkDateConflict(assessmentDate, newGrade.subjectName) && (
                                    <p className="text-red-500 text-sm mt-1">
                                        ⚠️ يوجد تقييم آخر في نفس التاريخ لهذه المادة!
                                    </p>
                                )}
                            </div>
                        )}

                        {newGrade.subjectName && assessmentDate && (
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

                        {newGrade.subjectName && assessmentDate && (
                            <div>
                            </div>
                        )}

                        {newGrade.subjectName && assessmentDate && (
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

                        {newGrade.subjectName && assessmentDate && (
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

            {Object.keys(gradesBySubject).length > 0 ? (
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">📚 الدرجات حسب المادة</h3>

                    {Object.entries(gradesBySubject).map(([subjectName, subjectGrades]) => {
                        const finalGrade = calculateSubjectFinalGrade(subjectGrades);
                        const gradeLevel = calculateGradeLevel(finalGrade);
                        const teacherName = subjectGrades[0]?.teacherName;

                        return (
                            <Card key={subjectName} className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
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
                                                        {grade.seatNumber && <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">جلوس: {grade.seatNumber}</span>}
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
