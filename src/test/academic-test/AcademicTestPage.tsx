import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, BookOpen, Calendar, GraduationCap, TrendingUp, Award, BarChart3 } from 'lucide-react';
import { AcademicYear, Semester, Subject, Assessment, AcademicPerformanceSummary } from './types';
import { sampleAcademicData } from './sampleData';

/**
 * صفحة اختبار النظام الأكاديمي الهرمي الجديد
 * تعرض البيانات الأكاديمية بهيكل هرمي منظم:
 * السنة الدراسية → الفصل → المادة → نوع التقييم + التاريخ → الدرجة
 */
export default function AcademicTestPage() {
    const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set(['2025-2026']));
    const [expandedSemesters, setExpandedSemesters] = useState<Set<string>>(new Set());
    const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

    // بيانات تجريبية للعرض
    const academicData: AcademicYear[] = sampleAcademicData.academicYears;
    const summary: AcademicPerformanceSummary = sampleAcademicData.summary;

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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getGradeColor = (grade: number) => {
        if (grade >= 90) return 'text-green-600 bg-green-100';
        if (grade >= 80) return 'text-blue-600 bg-blue-100';
        if (grade >= 70) return 'text-yellow-600 bg-yellow-100';
        if (grade >= 60) return 'text-orange-600 bg-orange-100';
        return 'text-red-600 bg-red-100';
    };

    const getGradeLevel = (grade: number) => {
        if (grade >= 90) return 'ممتاز';
        if (grade >= 80) return 'جيد جداً';
        if (grade >= 70) return 'جيد';
        if (grade >= 60) return 'مقبول';
        return 'ضعيف';
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto py-6 px-4">
                {/* رأس الصفحة */}
                <div className="bg-gradient-to-r from-green-600 to-green-800 text-white rounded-lg p-8 shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="h-8 w-8" />
                        <h1 className="text-4xl font-bold">🧪 نظام البيانات الأكاديمية الجديد (نسخة تجريبية)</h1>
                    </div>
                    <p className="text-green-100">عرض هرمي للبيانات الأكاديمية: السنة الدراسية ← الفصل ← المادة ← التقييم</p>
                    <div className="mt-4 text-sm text-green-200">
                        هذه نسخة تجريبية منفصلة لا تؤثر على النظام الأساسي
                    </div>
                </div>

                {/* ملخص الأداء */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm mb-1">المعدل العام</p>
                                <p className="text-3xl font-bold text-green-600">{summary.overallAverage.toFixed(1)}%</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-400" />
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm mb-1">المعدل التراكمي</p>
                                <p className="text-3xl font-bold text-blue-600">{summary.overallGPA.toFixed(2)}/4.0</p>
                            </div>
                            <GraduationCap className="h-8 w-8 text-blue-400" />
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm mb-1">عدد المواد</p>
                                <p className="text-3xl font-bold text-purple-600">{summary.totalSubjects}</p>
                            </div>
                            <BookOpen className="h-8 w-8 text-purple-400" />
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm mb-1">حالة النجاح</p>
                                <p className={`text-3xl font-bold ${summary.passingStatus === 'ناجح' ? 'text-green-600' : 'text-red-600'}`}>
                                    {summary.passingStatus}
                                </p>
                            </div>
                            <Award className="h-8 w-8 text-orange-400" />
                        </div>
                    </Card>
                </div>

                {/* الهيكل الهرمي الأكاديمي */}
                <Card className="p-8 bg-white border border-gray-200 rounded-lg shadow-md">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-green-600" />
                        الهيكل الأكاديمي الهرمي
                    </h3>

                    <div className="space-y-4">
                        {academicData.map((year) => (
                            <div key={year.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                {/* السنة الدراسية */}
                                <div
                                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 cursor-pointer hover:bg-blue-800 transition-colors"
                                    onClick={() => toggleYear(year.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        {expandedYears.has(year.id) ? (
                                            <ChevronDown className="h-5 w-5" />
                                        ) : (
                                            <ChevronRight className="h-5 w-5" />
                                        )}
                                        <Calendar className="h-6 w-6" />
                                        <div>
                                            <h4 className="text-xl font-bold">📅 السنة الدراسية: {year.year}</h4>
                                            <p className="text-blue-100 text-sm">
                                                {year.semesters.length} فصل دراسي • {year.semesters.reduce((total, sem) => total + sem.subjects.length, 0)} مادة
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* الفصول الدراسية */}
                                {expandedYears.has(year.id) && (
                                    <div className="bg-blue-50">
                                        {year.semesters.map((semester) => (
                                            <div key={semester.id} className="border-l-4 border-blue-300 ml-4">
                                                <div
                                                    className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-4 cursor-pointer hover:bg-indigo-700 transition-colors"
                                                    onClick={() => toggleSemester(semester.id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {expandedSemesters.has(semester.id) ? (
                                                            <ChevronDown className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4" />
                                                        )}
                                                        <div>
                                                            <h5 className="text-lg font-bold">📆 {semester.name}</h5>
                                                            <p className="text-indigo-100 text-sm">
                                                                {semester.subjects.length} مادة • من {formatDate(semester.startDate)} إلى {formatDate(semester.endDate)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* المواد الدراسية */}
                                                {expandedSemesters.has(semester.id) && (
                                                    <div className="bg-indigo-50">
                                                        {semester.subjects.map((subject) => (
                                                            <div key={subject.id} className="border-l-4 border-indigo-300 ml-4">
                                                                <div
                                                                    className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 cursor-pointer hover:bg-purple-700 transition-colors"
                                                                    onClick={() => toggleSubject(subject.id)}
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-3">
                                                                            {expandedSubjects.has(subject.id) ? (
                                                                                <ChevronDown className="h-4 w-4" />
                                                                            ) : (
                                                                                <ChevronRight className="h-4 w-4" />
                                                                            )}
                                                                            <BookOpen className="h-5 w-5" />
                                                                            <div>
                                                                                <h6 className="text-lg font-bold">📚 {subject.name}</h6>
                                                                                <p className="text-purple-100 text-sm">
                                                                                    👨‍🏫 {subject.teacherName} • {subject.assessments.length} تقييم
                                                                                    {subject.finalGrade && (
                                                                                        <span className="mr-2">• الدرجة النهائية: {subject.finalGrade}/100 ({subject.gradeLevel})</span>
                                                                                    )}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        {subject.finalGrade && (
                                                                            <div className={`px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(subject.finalGrade)}`}>
                                                                                {subject.finalGrade}/100
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* التقييمات */}
                                                                {expandedSubjects.has(subject.id) && (
                                                                    <div className="bg-purple-50 p-4">
                                                                        <div className="space-y-3">
                                                                            {subject.assessments.map((assessment) => (
                                                                                <div key={assessment.id} className="bg-white border border-purple-200 rounded-lg p-4 shadow-sm">
                                                                                    <div className="flex items-center justify-between">
                                                                                        <div className="flex items-center gap-3">
                                                                                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                                                                            <div>
                                                                                                <h6 className="font-bold text-gray-800">
                                                                                                    📌 {assessment.type}
                                                                                                </h6>
                                                                                                <p className="text-sm text-gray-600">
                                                                                                    📅 {formatDate(assessment.date)} • 👨‍🏫 {assessment.teacherName}
                                                                                                </p>
                                                                                                {assessment.teacherNotes && (
                                                                                                    <p className="text-sm text-gray-500 mt-1">
                                                                                                        💬 {assessment.teacherNotes}
                                                                                                    </p>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className={`px-4 py-2 rounded-lg font-bold text-lg ${getGradeColor(assessment.grade)}`}>
                                                                                            {assessment.grade}/100
                                                                                            <span className="block text-xs text-center mt-1">
                                                                                                {getGradeLevel(assessment.grade)}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>

                {/* معلومات التنفيذ */}
                <Card className="p-6 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <BookOpen className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-amber-900 mb-2">معلومات النسخة التجريبية</p>
                            <p className="text-amber-800 text-sm">
                                ✅ هذا النظام يعرض البيانات الأكاديمية بهيكل هرمي منظم كما هو مطلوب<br />
                                ✅ السنة الدراسية ← الفصل ← المادة ← نوع التقييم + التاريخ ← الدرجة<br />
                                ✅ البيانات المعروضة هي بيانات تجريبية للاختبار فقط<br />
                                ✅ النظام منفصل تماماً عن النظام الأساسي ولن يؤثر عليه<br />
                                ✅ يمكن توسيع أو طي كل مستوى في الهرم لتسهيل التصفح
                            </p>
                        </div>
                    </div>
                </Card>

                {/* أزرار التنقل */}
                <div className="flex justify-between pt-6 border-t">
                    <Button
                        onClick={() => window.history.back()}
                        variant="outline"
                    >
                        العودة
                    </Button>
                    <div className="text-sm text-gray-500">
                        آخر تحديث: {new Date().toLocaleString('ar-EG')}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}