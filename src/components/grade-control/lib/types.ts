// Educational Structure Types
export interface EducationalStage {
  id: string;
  name: string;
  order: number;
}

export interface Class {
  id: string;
  stageId: string;
  name: string;
  gradeLevel: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface TeacherAssignment {
  id: string;
  teacherId: string;
  subjectId: string;
  stageId: string;
  classId: string;
}

export interface AcademicWeek {
  id: string;
  weekNumber: number;
  academicYear: string;
  startDate: string; // Sunday
  endDate: string; // Thursday
}

export interface Student {
  id: string;
  name: string;
  studentNumber: string;
  classId: string;
  academicYear: string;
  status: 'active' | 'inactive';
}

export interface GradingCategory {
  id: string;
  name: string;
  maxScore: number;
  order: number;
}

export interface StudentGrade {
  id: string;
  studentId: string;
  subjectId: string;
  weekId: string;
  categoryId: string;
  score: number | null;
  enteredBy: string;
  enteredAt: string;
}

export interface StudentCategoryAverage {
  id: string;
  studentId: string;
  subjectId: string;
  categoryId: string;
  averageScore: number;
  weeksCounted: number;
  lastUpdated: string;
}

export interface StudentTotalAverage {
  id: string;
  studentId: string;
  subjectId: string;
  totalAverage: number;
  lastUpdated: string;
}

// UI State Types
export interface GradesGridState {
  selectedStage: string | null;
  selectedClass: string | null;
  selectedSubject: string | null;
  selectedWeek: string | null;
  grades: StudentGrade[];
  students: Student[];
  categoryAverages: StudentCategoryAverage[];
  totalAverages: StudentTotalAverage[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

export interface EditingCell {
  studentId: string;
  categoryId: string;
  value: string;
}
