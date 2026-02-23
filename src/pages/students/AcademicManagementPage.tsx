import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GradeManagementForm } from '@/components/StudentProfile/GradeManagementForm';
import { CertificateList } from '@/components/StudentProfile/CertificateList';
import { useStudentData } from '@/hooks/useStudentData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader, BookOpen, TrendingUp, Award, BarChart3, RotateCcw, AlertCircle, ChevronDown, ChevronRight, Calendar, GraduationCap, Search, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import { Grade } from '@/types/student';

/**
 * مكون العرض الهرمي للبيانات الأكاديمية
 */
interface HierarchicalAcademicDisplayProps {
    grades: Grade[];
    expandedYears: Set<string>;
    expandedSemesters: Set<string>;
    expandedSubjects: Set<string>;
    onToggleYear: (yearId: string) => void;
    onToggleSemester: (semesterId: string) => void;
    onToggleSubject: (subjectId: string) => void;
    formatDate: (date: string) => string;
    getGradeColor: (grade: number) => string;
    getGradeLevel: (grade: number) => string;
}

function HierarchicalAcademicDisplay({
    grades,
    expandedYears,
    expandedSemesters,
    expandedSubjects,
    onToggleYear,
    onToggleSemester,
    onToggleSubject,
    formatDate,
    getGradeColor,
    getGradeLevel,
}: HierarchicalAcademicDisplayProps) {
    // تنظيم الدرجات في هيكل هرمي
    const organizeGradesByHierarchy = () => {
        const hierarchy: Record<string, {
            semesters: Record<string, {
                subjects: Record<string, Grade[]>
            }>
        }> = {};

        grades.forEach(grade => {
            // استخدام السنة الدراسية من الدرجة أو افتراض سنة افتراضية
            const academicYear = grade.academicYear || '2025-2026';
            const semester = grade.semester || 'الفصل الأول';
            const subject = grade.subjectName;

            if (!hierarchy[academicYear]) {
                hierarchy[academicYear] = { semesters: {} };
            }
            if (!hierarchy[academicYear].semesters[semester]) {
                hierarchy[academicYear].semesters[semester] = { subjects: {} };
            }
            if (!hierarchy[academicYear].semesters[semester].subjects[subject]) {
                hierarchy[academicYear].semesters[semester].subjects[subject] = [];
            }
            hierarchy[academicYear].semesters[semester].subjects[subject].push(grade);
        });

        return hierarchy;
    };

    const hierarchy = organizeGradesByHierarchy();

    if (Object.keys(hierarchy).length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>لا توجد درجات مسجلة بعد</p>
                <p className="text-sm mt-2">ابدأ بإضافة درجة جديدة باستخدام النموذج أدناه</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {Object.entries(hierarchy).map(([year, yearData]) => (
                <div key={year} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* السنة الدراسية */}
                    <div
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 cursor-pointer hover:bg-blue-800 transition-colors"
                        onClick={() => onToggleYear(year)}
                    >
                        <div className="flex items-center gap-3">
                            {expandedYears.has(year) ? (
                                <ChevronDown className="h-5 w-5" />
                            ) : (
                                <ChevronRight className="h-5 w-5" />
                            )}
                            <Calendar className="h-6 w-6" />
                            <div>
                                <h4 className="text-xl font-bold">📅 السنة الدراسية: {year}</h4>
                                <p className="text-blue-100 text-sm">
                                    {Object.keys(yearData.semesters).length} فصل • {Object.values(yearData.semesters).reduce((total, sem) => total + Object.keys(sem.subjects).length, 0)} مادة
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* الفصول الدراسية */}
                    {expandedYears.has(year) && (
                        <div className="bg-blue-50">
                            {Object.entries(yearData.semesters).map(([semester, semesterData]) => (
                                <div key={semester} className="border-l-4 border-blue-300 ml-4">
                                    <div
                                        className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-4 cursor-pointer hover:bg-indigo-700 transition-colors"
                                        onClick={() => onToggleSemester(semester)}
                                    >
                                        <div className="flex items-center gap-3">
                                            {expandedSemesters.has(semester) ? (
                                                <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4" />
                                            )}
                                            <div>
                                                <h5 className="text-lg font-bold">📆 {semester}</h5>
                                                <p className="text-indigo-100 text-sm">
                                                    {Object.keys(semesterData.subjects).length} مادة • {Object.values(semesterData.subjects).reduce((total, grades) => total + grades.length, 0)} تقييم
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* المواد الدراسية */}
                                    {expandedSemesters.has(semester) && (
                                        <div className="bg-indigo-50">
                                            {Object.entries(semesterData.subjects).map(([subject, subjectGrades]) => {
                                                const finalGrade = subjectGrades.reduce((sum, g) => sum + g.finalGrade, 0) / subjectGrades.length;
                                                return (
                                                    <div key={subject} className="border-l-4 border-indigo-300 ml-4">
                                                        <div
                                                            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 cursor-pointer hover:bg-purple-700 transition-colors"
                                                            onClick={() => onToggleSubject(subject)}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    {expandedSubjects.has(subject) ? (
                                                                        <ChevronDown className="h-4 w-4" />
                                                                    ) : (
                                                                        <ChevronRight className="h-4 w-4" />
                                                                    )}
                                                                    <BookOpen className="h-5 w-5" />
                                                                    <div>
                                                                        <h6 className="text-lg font-bold">📚 {subject}</h6>
                                                                        <p className="text-purple-100 text-sm">
                                                                            {subjectGrades.length} تقييم • متوسط الدرجة: {finalGrade.toFixed(1)}/100
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className={`px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(finalGrade)}`}>
                                                                    {finalGrade.toFixed(1)}/100
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* التقييمات */}
                                                        {expandedSubjects.has(subject) && (
                                                            <div className="bg-purple-50 p-4">
                                                                <div className="space-y-3">
                                                                    {subjectGrades.map((assessment) => (
                                                                        <div key={assessment.id} className="bg-white border border-purple-200 rounded-lg p-4 shadow-sm">
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                                                                    <div>
                                                                                        <h6 className="font-bold text-gray-800">
                                                                                            📌 {assessment.assessmentType}
                                                                                        </h6>
                                                                                        <p className="text-sm text-gray-600">
                                                                                            📅 {assessment.assessmentDate ? formatDate(assessment.assessmentDate) : 'غير محدد'} • 👨‍🏫 {assessment.teacherName || 'غير محدد'}
                                                                                        </p>
                                                                                        {assessment.teacherNotes && (
                                                                                            <p className="text-sm text-gray-500 mt-1">
                                                                                                💬 {assessment.teacherNotes}
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                <div className={`px-4 py-2 rounded-lg font-bold text-lg ${getGradeColor(assessment.finalGrade)}`}>
                                                                                    {assessment.finalGrade}/100
                                                                                    <span className="block text-xs text-center mt-1">
                                                                                        {getGradeLevel(assessment.finalGrade)}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

/**
 * صفحة الإدارة الأكاديمية
 * تركز على قسم البيانات الأكاديمية
 *
 * هذه صفحة جماعية تدعم:
 * - التعديل على درجات الطلاب
 * - إضافة تقييمات
 * - الفلترة حسب المادة والفصل الدراسي
 * - حفظ جميع التعديلات دفعة واحدة
 */
export default function AcademicManagementPage() {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const {
        studentProfile,
        loading,
        error,
        updateAcademicData,
        refreshStudentData,
        saveAuditTrail,
        undoLastChange,
    } = useStudentData(studentId || '');

    // حالة إدارة التوسيع في الهيكل الهرمي
    const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set(['2025-2026']));
    const [expandedSemesters, setExpandedSemesters] = useState<Set<string>>(new Set());
    const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());



    if (!studentId) {
        return (
            <DashboardLayout>
                <div className="text-center py-10">
                    <p className="text-red-500">لم يتم تحديد معرّف الطالب</p>
                </div>
            </DashboardLayout>
        );
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="text-center py-16">
                    <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-500">جاري تحميل البيانات...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="text-center py-10">
                    <p className="text-red-500">حدث خطأ: {error}</p>
                </div>
            </DashboardLayout>
        );
    }

    const handleUpdateAcademicData = async (data: Record<string, unknown>) => {
        try {
            await saveAuditTrail('Academic Data', studentProfile?.academicRecords, data);
            await updateAcademicData(data);
            await refreshStudentData();
        } catch (err) {
            console.error('خطأ في تحديث البيانات الأكاديمية:', err);
        }
    };

    const handleUndoLastChange = async () => {
        try {
            await undoLastChange();
            await refreshStudentData();
        } catch (err) {
            console.error('خطأ في التراجع عن آخر تغيير:', err);
        }
    };

    // دوال إدارة التوسيع في الهيكل الهرمي
    const toggleYear = (yearId: string) => {
        const newExpanded = new Set(expandedYears);
        if (newExpanded.has(yearId)) {
            newExpanded.delete(yearId);
        } else {
            newExpanded.add(yearId);
        }
        setExpandedYears(newExpanded);
    };

    const toggleSemester = (semesterId: string) => {
        const newExpanded = new Set(expandedSemesters);
        if (newExpanded.has(semesterId)) {
            newExpanded.delete(semesterId);
        } else {
            newExpanded.add(semesterId);
        }
        setExpandedSemesters(newExpanded);
    };

    const toggleSubject = (subjectId: string) => {
        const newExpanded = new Set(expandedSubjects);
        if (newExpanded.has(subjectId)) {
            newExpanded.delete(subjectId);
        } else {
            newExpanded.add(subjectId);
        }
        setExpandedSubjects(newExpanded);
    };

    // تنسيق التاريخ
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // تحديد لون الدرجة
    const getGradeColor = (grade: number) => {
        if (grade >= 90) return 'text-green-600 bg-green-100';
        if (grade >= 80) return 'text-blue-600 bg-blue-100';
        if (grade >= 70) return 'text-yellow-600 bg-yellow-100';
        if (grade >= 60) return 'text-orange-600 bg-orange-100';
        return 'text-red-600 bg-red-100';
    };

    // تحديد مستوى الدرجة
    const getGradeLevel = (grade: number) => {
        if (grade >= 90) return 'ممتاز';
        if (grade >= 80) return 'جيد جداً';
        if (grade >= 70) return 'جيد';
        if (grade >= 60) return 'مقبول';
        return 'ضعيف';
    };

    // حساب الإحصائيات الأكاديمية
    const academicRecords = studentProfile?.academicRecords || [];
    const currentGPA = academicRecords.length > 0 ? academicRecords[0].currentGPA || 0 : 0;
    const averageMarks = academicRecords.length > 0 ? academicRecords[0].averageMarks || 0 : 0;
    const passingStatus = academicRecords.length > 0 ? academicRecords[0].passingStatus || 'غير محدد' : 'غير محدد';

    // إعداد بيانات الرسم البياني
    const chartData = [
        { name: 'المعدل التراكمي', value: currentGPA, fill: '#10b981' },
        { name: 'متوسط الدرجات', value: averageMarks, fill: '#3b82f6' },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-6xl mx-auto py-6 px-4">
                {/* رأس محسّن */}
                <div className="bg-gradient-to-r from-green-600 to-green-800 text-white rounded-lg p-8 shadow-lg flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <BookOpen className="h-8 w-8" />
                            <h1 className="text-4xl font-bold">الإدارة الأكاديمية</h1>
                        </div>
                        <p className="text-green-100">معرّف الطالب: {studentId}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => navigate('/academic/search')}
                            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                        >
                            <Search className="h-4 w-4" />
                            البحث الأكاديمي
                        </Button>

                        <Button
                            onClick={handleUndoLastChange}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white flex items-center gap-2"
                        >
                            <RotateCcw className="h-4 w-4" />
                            التراجع
                        </Button>
                        <Button
                            onClick={() => navigate(`/student/${studentId}/dashboard`)}
                            className="bg-green-700 hover:bg-green-900 text-white flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            العودة
                        </Button>
                    </div>
                </div>

                {/* شبكة الإحصائيات السريعة */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-600 text-sm mb-1">المعدل التراكمي</p>
                                <p className="text-3xl font-bold text-green-600">{currentGPA.toFixed(2)}</p>
                                <p className="text-xs text-gray-500 mt-1">{academicRecords.length} مادة</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-400" />
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-600 text-sm mb-1">متوسط الدرجات</p>
                                <p className="text-3xl font-bold text-blue-600">{averageMarks.toFixed(1)}</p>
                                <p className="text-xs text-gray-500 mt-1">من 100</p>
                            </div>
                            <BarChart3 className="h-8 w-8 text-blue-400" />
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-600 text-sm mb-1">حالة النجاح</p>
                                <p className={`text-3xl font-bold ${passingStatus === 'ناجح' ? 'text-green-600' : 'text-red-600'}`}>
                                    {passingStatus}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">الفصل الحالي</p>
                            </div>
                            <Award className="h-8 w-8 text-purple-400" />
                        </div>
                    </Card>
                </div>

                {/* رسم بياني الأداء الأكاديمي */}
                <Card className="p-8 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6">رسم بياني الأداء الأكاديمي</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* الهيكل الأكاديمي الهرمي */}
                <Card className="p-8 bg-white border border-gray-200 rounded-lg shadow-md">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-green-600" />
                        الهيكل الأكاديمي الهرمي
                    </h3>

                    <HierarchicalAcademicDisplay
                        grades={studentProfile?.grades || []}
                        expandedYears={expandedYears}
                        expandedSemesters={expandedSemesters}
                        expandedSubjects={expandedSubjects}
                        onToggleYear={toggleYear}
                        onToggleSemester={toggleSemester}
                        onToggleSubject={toggleSubject}
                        formatDate={formatDate}
                        getGradeColor={getGradeColor}
                        getGradeLevel={getGradeLevel}
                    />
                </Card>

                {/* قائمة الشهادات المنفصلة */}
                <Card className="p-8 bg-white border border-gray-200 rounded-lg shadow-md">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <FileText className="h-6 w-6 text-purple-600" />
                        الشهادات الأكاديمية
                    </h3>
                    <CertificateList
                        studentId={studentId || ''}
                        studentPersonalData={studentProfile?.personalData}
                        studentEnrollmentData={studentProfile?.enrollmentData}
                        grades={studentProfile?.grades || []}
                    />
                </Card>

                {/* معلومات مهمة */}
                <Card className="p-6 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
                        <div>
                            <p className="font-semibold text-amber-900 mb-1">ملاحظة مهمة جداً</p>
                            <p className="text-amber-800 text-sm">
                                ✅ استخدم هذه الواجهة لإضافة درجات جديدة للطالب<br />
                                ✅ اختر المادة أولاً، ثم اختر نوع التقييم<br />
                                ✅ بناءً على نوع التقييم، ستظهر حقول إضافية (الشهر أو الترم)<br />
                                ✅ أدخل الدرجة والملاحظات ثم احفظ<br />
                                ✅ يتم حساب الدرجة النهائية والتقدير تلقائياً
                            </p>
                        </div>
                    </div>
                </Card>

                {/* نموذج إدارة الدرجات - المنطق الصحيح */}
                <Card className="p-8 bg-white border border-gray-200 rounded-lg shadow-md">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <BookOpen className="h-5 w-5 text-green-600" />
                        </div>
                        إدارة الدرجات والتقييمات
                    </h3>
                    <GradeManagementForm
                        studentId={studentId || ''}
                        studentName={studentProfile?.personalData?.fullNameAr || 'الطالب'}
                    />
                </Card>

                {/* Footer Navigation */}
                <div className="flex justify-between pt-6 border-t">
                    <Button
                        onClick={() => navigate(`/student/${studentId}/dashboard`)}
                        variant="outline"
                    >
                        العودة
                    </Button>
                    <div className="text-sm text-gray-500">
                        آخر تحديث: الآن
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}