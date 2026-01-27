import {
  EducationalStage,
  Class,
  Subject,
  Teacher,
  TeacherAssignment,
  AcademicWeek,
  Student,
  GradingCategory,
  StudentGrade,
  StudentCategoryAverage,
  StudentTotalAverage,
} from './types';

// Educational Stages
export const educationalStages: EducationalStage[] = [
  { id: 'stage-1', name: 'الابتدائي', order: 1 },
  { id: 'stage-2', name: 'الإعدادي', order: 2 },
  { id: 'stage-3', name: 'الثانوي', order: 3 },
];

// Classes
export const classes: Class[] = [
  { id: 'class-1', stageId: 'stage-1', name: 'الأول أ', gradeLevel: 1 },
  { id: 'class-2', stageId: 'stage-1', name: 'الأول ب', gradeLevel: 1 },
  { id: 'class-3', stageId: 'stage-1', name: 'الثاني أ', gradeLevel: 2 },
  { id: 'class-4', stageId: 'stage-2', name: 'الأول أ', gradeLevel: 1 },
  { id: 'class-5', stageId: 'stage-2', name: 'الأول ب', gradeLevel: 1 },
];

// Subjects
export const subjects: Subject[] = [
  { id: 'subj-1', name: 'الرياضيات', code: 'MATH' },
  { id: 'subj-2', name: 'العلوم', code: 'SCI' },
  { id: 'subj-3', name: 'اللغة العربية', code: 'AR' },
  { id: 'subj-4', name: 'اللغة الإنجليزية', code: 'EN' },
];

// Teachers
export const teachers: Teacher[] = [
  { id: 'teacher-1', name: 'أحمد محمود', email: 'ahmad@school.com' },
  { id: 'teacher-2', name: 'فاطمة علي', email: 'fatima@school.com' },
  { id: 'teacher-3', name: 'محمد حسن', email: 'mohammed@school.com' },
];

// Teacher Assignments
export const teacherAssignments: TeacherAssignment[] = [
  { id: 'assign-1', teacherId: 'teacher-1', subjectId: 'subj-1', stageId: 'stage-1', classId: 'class-1' },
  { id: 'assign-2', teacherId: 'teacher-1', subjectId: 'subj-1', stageId: 'stage-1', classId: 'class-2' },
  { id: 'assign-3', teacherId: 'teacher-2', subjectId: 'subj-2', stageId: 'stage-1', classId: 'class-1' },
];

// Academic Weeks
export const academicWeeks: AcademicWeek[] = [
  {
    id: 'week-1',
    weekNumber: 1,
    academicYear: '2024-2025',
    startDate: '2024-09-01',
    endDate: '2024-09-05',
  },
  {
    id: 'week-2',
    weekNumber: 2,
    academicYear: '2024-2025',
    startDate: '2024-09-08',
    endDate: '2024-09-12',
  },
  {
    id: 'week-3',
    weekNumber: 3,
    academicYear: '2024-2025',
    startDate: '2024-09-15',
    endDate: '2024-09-19',
  },
  {
    id: 'week-4',
    weekNumber: 4,
    academicYear: '2024-2025',
    startDate: '2024-09-22',
    endDate: '2024-09-26',
  },
];

// Grading Categories
export const gradingCategories: GradingCategory[] = [
  { id: 'cat-1', name: 'مهام أدائية', maxScore: 10, order: 1 },
  { id: 'cat-2', name: 'كراسة واجب', maxScore: 5, order: 2 },
  { id: 'cat-3', name: 'كراسة نشاط', maxScore: 5, order: 3 },
  { id: 'cat-5', name: 'المواظبة والسلوك', maxScore: 5, order: 4 },
  { id: 'cat-6', name: 'التقييمات الأسبوعية', maxScore: 5, order: 5 },
  { id: 'cat-7', name: 'التقييمات الشهرية', maxScore: 5, order: 6 },
];

// Students
export const students: Student[] = [
  { id: 'std-1', name: 'أحمد علي', studentNumber: 'S001', classId: 'class-1', academicYear: '2024-2025', status: 'active' },
  { id: 'std-2', name: 'فاطمة سالم', studentNumber: 'S002', classId: 'class-1', academicYear: '2024-2025', status: 'active' },
  { id: 'std-3', name: 'محمد حسن', studentNumber: 'S003', classId: 'class-1', academicYear: '2024-2025', status: 'active' },
  { id: 'std-4', name: 'نور خالد', studentNumber: 'S004', classId: 'class-1', academicYear: '2024-2025', status: 'active' },
  { id: 'std-5', name: 'سارة أحمد', studentNumber: 'S005', classId: 'class-1', academicYear: '2024-2025', status: 'active' },
  { id: 'std-6', name: 'عمر محمود', studentNumber: 'S006', classId: 'class-1', academicYear: '2024-2025', status: 'active' },
  { id: 'std-7', name: 'لينا فايز', studentNumber: 'S007', classId: 'class-1', academicYear: '2024-2025', status: 'active' },
  { id: 'std-8', name: 'يوسف علاء', studentNumber: 'S008', classId: 'class-1', academicYear: '2024-2025', status: 'active' },
];

// Student Grades (sample data)
export const studentGrades: StudentGrade[] = [
  // Week 1 grades
  { id: 'grade-1', studentId: 'std-1', subjectId: 'subj-1', weekId: 'week-1', categoryId: 'cat-1', score: 8, enteredBy: 'teacher-1', enteredAt: '2024-09-05' },
  { id: 'grade-2', studentId: 'std-1', subjectId: 'subj-1', weekId: 'week-1', categoryId: 'cat-2', score: 4, enteredBy: 'teacher-1', enteredAt: '2024-09-05' },
  { id: 'grade-3', studentId: 'std-1', subjectId: 'subj-1', weekId: 'week-1', categoryId: 'cat-3', score: 3, enteredBy: 'teacher-1', enteredAt: '2024-09-05' },
  { id: 'grade-4', studentId: 'std-1', subjectId: 'subj-1', weekId: 'week-1', categoryId: 'cat-4', score: 5, enteredBy: 'teacher-1', enteredAt: '2024-09-05' },
  { id: 'grade-5', studentId: 'std-1', subjectId: 'subj-1', weekId: 'week-1', categoryId: 'cat-5', score: 5, enteredBy: 'teacher-1', enteredAt: '2024-09-05' },
  { id: 'grade-6', studentId: 'std-1', subjectId: 'subj-1', weekId: 'week-1', categoryId: 'cat-6', score: 4, enteredBy: 'teacher-1', enteredAt: '2024-09-05' },
  { id: 'grade-7', studentId: 'std-1', subjectId: 'subj-1', weekId: 'week-1', categoryId: 'cat-7', score: 3, enteredBy: 'teacher-1', enteredAt: '2024-09-05' },

  { id: 'grade-8', studentId: 'std-2', subjectId: 'subj-1', weekId: 'week-1', categoryId: 'cat-1', score: 9, enteredBy: 'teacher-1', enteredAt: '2024-09-05' },
  { id: 'grade-9', studentId: 'std-2', subjectId: 'subj-1', weekId: 'week-1', categoryId: 'cat-2', score: 5, enteredBy: 'teacher-1', enteredAt: '2024-09-05' },
  { id: 'grade-10', studentId: 'std-2', subjectId: 'subj-1', weekId: 'week-1', categoryId: 'cat-3', score: 4, enteredBy: 'teacher-1', enteredAt: '2024-09-05' },

  // Week 2 grades
  { id: 'grade-11', studentId: 'std-1', subjectId: 'subj-1', weekId: 'week-2', categoryId: 'cat-1', score: 9, enteredBy: 'teacher-1', enteredAt: '2024-09-12' },
  { id: 'grade-12', studentId: 'std-1', subjectId: 'subj-1', weekId: 'week-2', categoryId: 'cat-2', score: 4, enteredBy: 'teacher-1', enteredAt: '2024-09-12' },
];

// Category Averages
export const studentCategoryAverages: StudentCategoryAverage[] = [
  { id: 'avg-1', studentId: 'std-1', subjectId: 'subj-1', categoryId: 'cat-1', averageScore: 8.5, weeksCounted: 2, lastUpdated: '2024-09-12' },
  { id: 'avg-2', studentId: 'std-1', subjectId: 'subj-1', categoryId: 'cat-2', averageScore: 4, weeksCounted: 2, lastUpdated: '2024-09-12' },
];

// Total Averages
export const studentTotalAverages: StudentTotalAverage[] = [
  { id: 'total-1', studentId: 'std-1', subjectId: 'subj-1', totalAverage: 4.0, lastUpdated: '2024-09-12' },
  { id: 'total-2', studentId: 'std-2', subjectId: 'subj-1', totalAverage: 4.5, lastUpdated: '2024-09-12' },
];
