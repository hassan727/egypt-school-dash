import { AcademicYear, AcademicPerformanceSummary } from './types';

/**
 * بيانات تجريبية لاختبار النظام الأكاديمي الهرمي الجديد
 * تعكس الهيكل المطلوب: السنة الدراسية ← الفصل ← المادة ← التقييم
 */

export const sampleAcademicData: {
    academicYears: AcademicYear[];
    summary: AcademicPerformanceSummary;
} = {
    academicYears: [
        {
            id: 'year-2025-2026',
            year: '2025-2026',
            createdAt: '2025-09-01T00:00:00Z',
            updatedAt: '2025-11-13T00:00:00Z',
            semesters: [
                {
                    id: 'semester-1-2025',
                    name: 'الفصل الأول',
                    academicYearId: 'year-2025-2026',
                    startDate: '2025-09-01',
                    endDate: '2025-12-31',
                    createdAt: '2025-09-01T00:00:00Z',
                    updatedAt: '2025-11-13T00:00:00Z',
                    subjects: [
                        {
                            id: 'subject-arabic-1',
                            name: 'اللغة العربية',
                            semesterId: 'semester-1-2025',
                            teacherName: 'أحمد محمد علي',
                            finalGrade: 85,
                            gradeLevel: 'جيد جداً',
                            createdAt: '2025-09-01T00:00:00Z',
                            updatedAt: '2025-11-13T00:00:00Z',
                            assessments: [
                                {
                                    id: 'assessment-1',
                                    subjectId: 'subject-arabic-1',
                                    type: 'تقييم شهري',
                                    date: '2025-10-10',
                                    grade: 85,
                                    weight: 0.3,
                                    teacherName: 'أحمد محمد علي',
                                    teacherNotes: 'أداء جيد في القراءة والكتابة',
                                    createdAt: '2025-10-10T00:00:00Z',
                                    updatedAt: '2025-10-10T00:00:00Z'
                                },
                                {
                                    id: 'assessment-2',
                                    subjectId: 'subject-arabic-1',
                                    type: 'تقييم أسبوعي',
                                    date: '2025-09-25',
                                    grade: 18,
                                    weight: 0.2,
                                    teacherName: 'أحمد محمد علي',
                                    teacherNotes: 'ممتاز في الإملاء',
                                    createdAt: '2025-09-25T00:00:00Z',
                                    updatedAt: '2025-09-25T00:00:00Z'
                                },
                                {
                                    id: 'assessment-3',
                                    subjectId: 'subject-arabic-1',
                                    type: 'امتحان نص سنوي',
                                    date: '2025-12-15',
                                    grade: 170,
                                    weight: 0.5,
                                    teacherName: 'أحمد محمد علي',
                                    teacherNotes: 'يحتاج تحسين في التعبير الكتابي',
                                    createdAt: '2025-12-15T00:00:00Z',
                                    updatedAt: '2025-12-15T00:00:00Z'
                                }
                            ]
                        },
                        {
                            id: 'subject-math-1',
                            name: 'الرياضيات',
                            semesterId: 'semester-1-2025',
                            teacherName: 'فاطمة أحمد حسن',
                            finalGrade: 92,
                            gradeLevel: 'ممتاز',
                            createdAt: '2025-09-01T00:00:00Z',
                            updatedAt: '2025-11-13T00:00:00Z',
                            assessments: [
                                {
                                    id: 'assessment-4',
                                    subjectId: 'subject-math-1',
                                    type: 'تقييم يومي',
                                    date: '2025-09-08',
                                    grade: 9,
                                    weight: 0.1,
                                    teacherName: 'فاطمة أحمد حسن',
                                    teacherNotes: 'ممتاز في حل المسائل',
                                    createdAt: '2025-09-08T00:00:00Z',
                                    updatedAt: '2025-09-08T00:00:00Z'
                                },
                                {
                                    id: 'assessment-5',
                                    subjectId: 'subject-math-1',
                                    type: 'مشروع',
                                    date: '2025-09-30',
                                    grade: 95,
                                    weight: 0.4,
                                    teacherName: 'فاطمة أحمد حسن',
                                    teacherNotes: 'مشروع رائع عن الكسور',
                                    createdAt: '2025-09-30T00:00:00Z',
                                    updatedAt: '2025-09-30T00:00:00Z'
                                },
                                {
                                    id: 'assessment-6',
                                    subjectId: 'subject-math-1',
                                    type: 'تقييم شهري',
                                    date: '2025-10-15',
                                    grade: 88,
                                    weight: 0.3,
                                    teacherName: 'فاطمة أحمد حسن',
                                    teacherNotes: 'جيد جداً في الأعداد الصحيحة',
                                    createdAt: '2025-10-15T00:00:00Z',
                                    updatedAt: '2025-10-15T00:00:00Z'
                                },
                                {
                                    id: 'assessment-7',
                                    subjectId: 'subject-math-1',
                                    type: 'امتحان نص سنوي',
                                    date: '2025-12-10',
                                    grade: 185,
                                    weight: 0.5,
                                    teacherName: 'فاطمة أحمد حسن',
                                    teacherNotes: 'أداء متميز في الهندسة',
                                    createdAt: '2025-12-10T00:00:00Z',
                                    updatedAt: '2025-12-10T00:00:00Z'
                                }
                            ]
                        },
                        {
                            id: 'subject-science-1',
                            name: 'العلوم',
                            semesterId: 'semester-1-2025',
                            teacherName: 'محمد عبدالله سالم',
                            finalGrade: 78,
                            gradeLevel: 'جيد',
                            createdAt: '2025-09-01T00:00:00Z',
                            updatedAt: '2025-11-13T00:00:00Z',
                            assessments: [
                                {
                                    id: 'assessment-8',
                                    subjectId: 'subject-science-1',
                                    type: 'تقييم أسبوعي',
                                    date: '2025-09-20',
                                    grade: 15,
                                    weight: 0.2,
                                    teacherName: 'محمد عبدالله سالم',
                                    teacherNotes: 'يحتاج مراجعة في الفيزياء',
                                    createdAt: '2025-09-20T00:00:00Z',
                                    updatedAt: '2025-09-20T00:00:00Z'
                                },
                                {
                                    id: 'assessment-9',
                                    subjectId: 'subject-science-1',
                                    type: 'عرض شفهي',
                                    date: '2025-10-05',
                                    grade: 80,
                                    weight: 0.3,
                                    teacherName: 'محمد عبدالله سالم',
                                    teacherNotes: 'عرض جيد عن النباتات',
                                    createdAt: '2025-10-05T00:00:00Z',
                                    updatedAt: '2025-10-05T00:00:00Z'
                                },
                                {
                                    id: 'assessment-10',
                                    subjectId: 'subject-science-1',
                                    type: 'تقييم شهري',
                                    date: '2025-11-10',
                                    grade: 75,
                                    weight: 0.3,
                                    teacherName: 'محمد عبدالله سالم',
                                    teacherNotes: 'تحسن في الأحياء',
                                    createdAt: '2025-11-10T00:00:00Z',
                                    updatedAt: '2025-11-10T00:00:00Z'
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 'semester-2-2025',
                    name: 'الفصل الثاني',
                    academicYearId: 'year-2025-2026',
                    startDate: '2026-01-01',
                    endDate: '2026-06-30',
                    createdAt: '2026-01-01T00:00:00Z',
                    updatedAt: '2026-01-15T00:00:00Z',
                    subjects: [
                        {
                            id: 'subject-english-2',
                            name: 'اللغة الإنجليزية',
                            semesterId: 'semester-2-2025',
                            teacherName: 'سارة محمد أحمد',
                            finalGrade: 88,
                            gradeLevel: 'جيد جداً',
                            createdAt: '2026-01-01T00:00:00Z',
                            updatedAt: '2026-01-15T00:00:00Z',
                            assessments: [
                                {
                                    id: 'assessment-11',
                                    subjectId: 'subject-english-2',
                                    type: 'تقييم أسبوعي',
                                    date: '2026-01-10',
                                    grade: 20,
                                    weight: 0.2,
                                    teacherName: 'سارة محمد أحمد',
                                    teacherNotes: 'ممتاز في القراءة',
                                    createdAt: '2026-01-10T00:00:00Z',
                                    updatedAt: '2026-01-10T00:00:00Z'
                                },
                                {
                                    id: 'assessment-12',
                                    subjectId: 'subject-english-2',
                                    type: 'مشروع',
                                    date: '2026-02-15',
                                    grade: 90,
                                    weight: 0.4,
                                    teacherName: 'سارة محمد أحمد',
                                    teacherNotes: 'مشروع إبداعي عن الحيوانات',
                                    createdAt: '2026-02-15T00:00:00Z',
                                    updatedAt: '2026-02-15T00:00:00Z'
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ],
    summary: {
        studentId: 'STU20259262',
        totalAcademicYears: 1,
        totalSemesters: 2,
        totalSubjects: 4,
        totalAssessments: 12,
        overallGPA: 3.67,
        overallAverage: 85.8,
        passingStatus: 'ناجح',
        strengths: ['الرياضيات', 'اللغة الإنجليزية'],
        weaknesses: ['العلوم (الفيزياء)'],
        lastUpdated: '2025-11-13T15:31:59Z'
    }
};