/**
 * أنواع البيانات للنظام الأكاديمي الهرمي الجديد
 * يعكس هيكل البيانات الأكاديمية كما هو مطلوب:
 * السنة الدراسية ↔ الفصل ↔ المادة ↔ نوع التقييم ↔ التاريخ ↔ الدرجة
 */

// السنة الدراسية (المستوى الأعلى)
export interface AcademicYear {
    id: string;
    year: string; // مثل "2025-2026"
    semesters: Semester[];
    createdAt: string;
    updatedAt: string;
}

// الفصل الدراسي (الترم)
export interface Semester {
    id: string;
    name: 'الفصل الأول' | 'الفصل الثاني';
    academicYearId: string;
    subjects: Subject[];
    startDate: string;
    endDate: string;
    createdAt: string;
    updatedAt: string;
}

// المادة الدراسية
export interface Subject {
    id: string;
    name: string;
    semesterId: string;
    teacherName: string;
    assessments: Assessment[];
    finalGrade?: number;
    gradeLevel?: 'ممتاز' | 'جيد جدًّا' | 'جيد' | 'مقبول' | 'ضعيف';
    createdAt: string;
    updatedAt: string;
}

// نوع التقييم مع التاريخ
export interface Assessment {
    id: string;
    subjectId: string;
    type: AssessmentType;
    date: string; // تاريخ التقييم
    grade: number; // الدرجة من 100
    weight: number; // وزن التقييم في الحساب
    teacherName: string;
    teacherNotes?: string;
    createdAt: string;
    updatedAt: string;
}

// أنواع التقييمات المحدثة
export type AssessmentType =
    | 'تقييم يومي'
    | 'تقييم أسبوعي'
    | 'تقييم شهري'
    | 'امتحان نص سنوي'
    | 'نهائي'
    | 'مشروع'
    | 'عرض شفهي';

// ملخص الأداء الأكاديمي للطالب
export interface AcademicPerformanceSummary {
    studentId: string;
    totalAcademicYears: number;
    totalSemesters: number;
    totalSubjects: number;
    totalAssessments: number;
    overallGPA: number;
    overallAverage: number;
    passingStatus: 'ناجح' | 'راسب' | 'معلق';
    strengths?: string[];
    weaknesses?: string[];
    lastUpdated: string;
}

// إحصائيات تفصيلية للعرض
export interface AcademicStats {
    academicYearsCount: number;
    semestersCount: number;
    subjectsCount: number;
    assessmentsCount: number;
    averageGrade: number;
    highestGrade: number;
    lowestGrade: number;
    gradeDistribution: {
        excellent: number; // ممتاز
        veryGood: number;  // جيد جداً
        good: number;      // جيد
        acceptable: number; // مقبول
        weak: number;      // ضعيف
    };
}