import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Calendar, BookOpen, AlertCircle, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Grade } from '@/types/student';

interface HierarchicalAcademicDisplayProps {
    studentId: string;
}

interface OrganizedGrades {
    [yearCode: string]: {
        yearName: string;
        startDate: string;
        endDate: string;
        semesters: {
            [semesterCode: string]: {
                semesterName: string;
                subjects: {
                    [subjectCode: string]: {
                        subjectName: string;
                        grades: Grade[];
                        average: number;
                    }
                }
            }
        }
    }
}

/**
 * عرض البيانات الأكاديمية - الشجرة الزمنية المحسّنة
 * 
 * الهيكل:
 * 📅 السنة الدراسية (قابلة للتوسيع)
 *    📆 الفصل الدراسي (قابل للتوسيع)
 *       📚 المادة الدراسية (قابلة للتوسيع)
 *          📌 التقييمات الفردية
 */
export function HierarchicalAcademicDisplay({ studentId }: HierarchicalAcademicDisplayProps) {
    const [organizedGrades, setOrganizedGrades] = useState<OrganizedGrades>({});
    const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
    const [expandedSemesters, setExpandedSemesters] = useState<Set<string>>(new Set());
    const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    // تحميل البيانات من قاعدة البيانات
    useEffect(() => {
        const loadAcademicData = async () => {
            try {
                setLoading(true);

                const { data, error } = await supabase
                    .from('grades')
                    .select(`
                        *,
                        academic_years:academic_year_id (id, year_code, year_name_ar, start_date, end_date),
                        semesters:semester_id (id, semester_code, semester_name_ar),
                        subjects:subject_id (id, subject_code, subject_name_ar),
                        assessment_types:assessment_type_id (id, assessment_code, assessment_name_ar)
                    `)
                    .eq('student_id', studentId)
                    .order('assessment_date', { ascending: false });

                if (error) throw error;

                // تنظيم البيانات بالهيكل الشجري
                const organized: OrganizedGrades = {};

                (data || []).forEach(grade => {
                    const yearCode = grade.academic_years?.year_code || 'unknown';
                    const yearName = grade.academic_years?.year_name_ar || 'سنة غير معروفة';
                    const startDate = grade.academic_years?.start_date;
                    const endDate = grade.academic_years?.end_date;
                    
                    const semesterCode = grade.semesters?.semester_code || 'unknown';
                    const semesterName = grade.semesters?.semester_name_ar || 'فصل غير معروف';
                    
                    const subjectCode = grade.subjects?.subject_code || 'unknown';
                    const subjectName = grade.subjects?.subject_name_ar || 'مادة غير معروفة';

                    // تهيئة البنية الهرمية
                    if (!organized[yearCode]) {
                        organized[yearCode] = {
                            yearName,
                            startDate: startDate || '',
                            endDate: endDate || '',
                            semesters: {}
                        };
                    }

                    if (!organized[yearCode].semesters[semesterCode]) {
                        organized[yearCode].semesters[semesterCode] = {
                            semesterName,
                            subjects: {}
                        };
                    }

                    if (!organized[yearCode].semesters[semesterCode].subjects[subjectCode]) {
                        organized[yearCode].semesters[semesterCode].subjects[subjectCode] = {
                            subjectName,
                            grades: [],
                            average: 0
                        };
                    }

                    organized[yearCode].semesters[semesterCode].subjects[subjectCode].grades.push({
                        id: grade.id,
                        studentId: grade.student_id,
                        subjectName: subjectName,
                        assessmentType: grade.assessment_types?.assessment_name_ar,
                        originalGrade: grade.original_grade,
                        finalGrade: grade.final_grade,
                        gradeLevel: grade.grade_level,
                        assessmentDate: grade.assessment_date,
                        teacherName: grade.teacher_name,
                        teacherNotes: grade.teacher_notes,
                        createdAt: grade.created_at
                    });
                });

                // حساب المتوسطات
                Object.values(organized).forEach(year => {
                    Object.values(year.semesters).forEach(semester => {
                        Object.values(semester.subjects).forEach(subject => {
                            if (subject.grades.length > 0) {
                                subject.average = 
                                    subject.grades.reduce((sum, g) => sum + g.finalGrade, 0) / 
                                    subject.grades.length;
                            }
                        });
                    });
                });

                setOrganizedGrades(organized);

                // توسيع السنة الأولى افتراضياً
                const firstYear = Object.keys(organized)[0];
                if (firstYear) {
                    setExpandedYears(new Set([firstYear]));
                }
            } catch (error) {
                console.error('خطأ في تحميل البيانات الأكاديمية:', error);
            } finally {
                setLoading(false);
            }
        };

        if (studentId) {
            loadAcademicData();
        }
    }, [studentId]);

    // معالجات التوسيع/الطي
    const toggleYear = (yearCode: string) => {
        const newExpanded = new Set(expandedYears);
        if (newExpanded.has(yearCode)) {
            newExpanded.delete(yearCode);
        } else {
            newExpanded.add(yearCode);
        }
        setExpandedYears(newExpanded);
    };

    const toggleSemester = (semesterCode: string) => {
        const newExpanded = new Set(expandedSemesters);
        if (newExpanded.has(semesterCode)) {
            newExpanded.delete(semesterCode);
        } else {
            newExpanded.add(semesterCode);
        }
        setExpandedSemesters(newExpanded);
    };

    const toggleSubject = (subjectCode: string) => {
        const newExpanded = new Set(expandedSubjects);
        if (newExpanded.has(subjectCode)) {
            newExpanded.delete(subjectCode);
        } else {
            newExpanded.add(subjectCode);
        }
        setExpandedSubjects(newExpanded);
    };

    // دالة لتحديد لون الدرجة
    const getGradeColor = (grade: number): string => {
        if (grade >= 90) return 'text-green-700 bg-green-50';
        if (grade >= 80) return 'text-blue-700 bg-blue-50';
        if (grade >= 70) return 'text-yellow-700 bg-yellow-50';
        if (grade >= 60) return 'text-orange-700 bg-orange-50';
        return 'text-red-700 bg-red-50';
    };

    if (loading) {
        return (
            <Card className="p-8 text-center">
                <p className="text-gray-500">جاري تحميل البيانات الأكاديمية...</p>
            </Card>
        );
    }

    if (Object.keys(organizedGrades).length === 0) {
        return (
            <Card className="p-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">لا توجد بيانات أكاديمية مسجلة بعد</p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {Object.entries(organizedGrades).map(([yearCode, yearData]) => (
                <div key={yearCode} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* السنة الدراسية */}
                    <button
                        onClick={() => toggleYear(yearCode)}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 hover:from-blue-700 hover:to-blue-800 transition-colors"
                    >
                        <div className="flex items-center gap-3 justify-between">
                            <div className="flex items-center gap-3">
                                {expandedYears.has(yearCode) ? (
                                    <ChevronDown className="h-5 w-5" />
                                ) : (
                                    <ChevronRight className="h-5 w-5" />
                                )}
                                <Calendar className="h-6 w-6" />
                                <div className="text-left">
                                    <h4 className="text-xl font-bold">📅 السنة الدراسية: {yearData.yearName}</h4>
                                    <p className="text-blue-100 text-sm">
                                        {Object.keys(yearData.semesters).length} فصول
                                    </p>
                                </div>
                            </div>
                        </div>
                    </button>

                    {/* الفصول الدراسية */}
                    {expandedYears.has(yearCode) && (
                        <div className="bg-blue-50 space-y-0">
                            {Object.entries(yearData.semesters).map(([semesterCode, semesterData], semesterIndex, semesterArray) => (
                                <div 
                                    key={semesterCode}
                                    className={`border-l-4 border-blue-300 ${
                                        semesterIndex < semesterArray.length - 1 ? 'border-b' : ''
                                    } border-gray-200`}
                                >
                                    <button
                                        onClick={() => toggleSemester(semesterCode)}
                                        className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-4 hover:from-indigo-600 hover:to-indigo-700 transition-colors mx-4 my-2 rounded"
                                    >
                                        <div className="flex items-center gap-3 justify-between">
                                            <div className="flex items-center gap-3">
                                                {expandedSemesters.has(semesterCode) ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                                <div className="text-left">
                                                    <h5 className="text-lg font-bold">📆 {semesterData.semesterName}</h5>
                                                    <p className="text-indigo-100 text-sm">
                                                        {Object.keys(semesterData.subjects).length} مادة
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </button>

                                    {/* المواد الدراسية */}
                                    {expandedSemesters.has(semesterCode) && (
                                        <div className="bg-indigo-50 space-y-0 ml-4">
                                            {Object.entries(semesterData.subjects).map(([subjectCode, subjectData]) => (
                                                <div 
                                                    key={subjectCode}
                                                    className="border-l-4 border-indigo-300 border-b border-gray-200"
                                                >
                                                    <button
                                                        onClick={() => toggleSubject(subjectCode)}
                                                        className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 hover:from-purple-600 hover:to-purple-700 transition-colors m-2 rounded"
                                                    >
                                                        <div className="flex items-center gap-3 justify-between">
                                                            <div className="flex items-center gap-3">
                                                                {expandedSubjects.has(subjectCode) ? (
                                                                    <ChevronDown className="h-4 w-4" />
                                                                ) : (
                                                                    <ChevronRight className="h-4 w-4" />
                                                                )}
                                                                <BookOpen className="h-5 w-5" />
                                                                <div className="text-left">
                                                                    <h6 className="text-base font-bold">📚 {subjectData.subjectName}</h6>
                                                                </div>
                                                            </div>
                                                            <div className={`px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(subjectData.average)}`}>
                                                                {subjectData.average.toFixed(1)}/100
                                                            </div>
                                                        </div>
                                                    </button>

                                                    {/* التقييمات الفردية */}
                                                    {expandedSubjects.has(subjectCode) && (
                                                        <div className="bg-purple-50 p-4 ml-4 space-y-3">
                                                            {subjectData.grades.map((grade, index) => (
                                                                <Card key={index} className="p-3 bg-white border-l-4 border-purple-300">
                                                                    <div className="flex justify-between items-start">
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <span className="font-semibold text-gray-800">📌 {grade.assessmentType}</span>
                                                                                <span className="text-sm text-gray-600">{grade.assessmentDate}</span>
                                                                            </div>
                                                                            {grade.teacherName && (
                                                                                <p className="text-sm text-gray-700">
                                                                                    <span className="font-medium">المعلم:</span> {grade.teacherName}
                                                                                </p>
                                                                            )}
                                                                            {grade.teacherNotes && (
                                                                                <p className="text-sm text-gray-600 mt-2">
                                                                                    <span className="font-medium">ملاحظات:</span> {grade.teacherNotes}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        <div className={`px-4 py-2 rounded-lg text-lg font-bold whitespace-nowrap ml-4 ${getGradeColor(grade.finalGrade)}`}>
                                                                            {grade.finalGrade}/100
                                                                        </div>
                                                                    </div>
                                                                </Card>
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
                    )}
                </div>
            ))}
        </div>
    );
}
