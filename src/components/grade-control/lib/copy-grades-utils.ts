import { StudentGrade } from './types';

export interface CopyGradesResult {
  success: boolean;
  message: string;
  copiedCount: number;
}

/**
 * Copy grades from one week to another
 */
export function copyGradesBetweenWeeks(
  gradesData: StudentGrade[],
  fromWeekId: string,
  toWeekId: string,
  subjectId: string,
  classStudentIds: string[]
): { grades: StudentGrade[]; count: number } {
  const sourceGrades = gradesData.filter(
    (g) =>
      g.weekId === fromWeekId &&
      g.subjectId === subjectId &&
      classStudentIds.includes(g.studentId)
  );

  const copiedGrades: StudentGrade[] = sourceGrades.map((grade) => ({
    ...grade,
    id: `grade-${Date.now()}-${Math.random()}`,
    weekId: toWeekId,
    enteredAt: new Date().toISOString().split('T')[0],
  }));

  return {
    grades: copiedGrades,
    count: copiedGrades.length,
  };
}
