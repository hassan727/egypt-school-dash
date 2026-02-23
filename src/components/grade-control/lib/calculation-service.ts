import {
  StudentGrade,
  StudentCategoryAverage,
  StudentTotalAverage,
  GradingCategory,
} from './types';

/**
 * Calculate the average score for a specific category across multiple weeks
 */
export function calculateCategoryAverage(
  grades: StudentGrade[],
  studentId: string,
  subjectId: string,
  categoryId: string,
  category: GradingCategory
): StudentCategoryAverage | null {
  const studentCategoryGrades = grades.filter(
    (g) =>
      g.studentId === studentId &&
      g.subjectId === subjectId &&
      g.categoryId === categoryId &&
      g.score !== null
  );

  if (studentCategoryGrades.length === 0) {
    return null;
  }

  const totalScore = studentCategoryGrades.reduce(
    (sum, g) => sum + (g.score ?? 0),
    0
  );
  const averageScore = totalScore / studentCategoryGrades.length;

  return {
    id: `avg-${studentId}-${subjectId}-${categoryId}`,
    studentId,
    subjectId,
    categoryId,
    averageScore: Math.round(averageScore * 100) / 100,
    weeksCounted: studentCategoryGrades.length,
    lastUpdated: new Date().toISOString().split('T')[0],
  };
}

/**
 * Calculate all category averages for a student and subject
 */
export function calculateAllCategoryAverages(
  grades: StudentGrade[],
  studentId: string,
  subjectId: string,
  categories: GradingCategory[]
): StudentCategoryAverage[] {
  return categories
    .map((category) =>
      calculateCategoryAverage(
        grades,
        studentId,
        subjectId,
        category.id,
        category
      )
    )
    .filter((avg) => avg !== null) as StudentCategoryAverage[];
}

/**
 * Calculate the weighted total average for a student
 * Formula: Sum(categoryAverage / categoryMax * weight) * 5
 * Where weight = categoryMax / totalMaxScore
 */
export function calculateTotalAverage(
  categoryAverages: StudentCategoryAverage[],
  categories: GradingCategory[]
): number {
  if (categoryAverages.length === 0) {
    return 0;
  }

  const totalMaxScore = categories.reduce((sum, c) => sum + c.maxScore, 0);
  let weightedSum = 0;

  categoryAverages.forEach((catAvg) => {
    const category = categories.find((c) => c.id === catAvg.categoryId);
    if (category) {
      // Weight for this category
      const weight = category.maxScore / totalMaxScore;

      // Normalize the average to 0-5 scale
      const normalizedScore = (catAvg.averageScore / category.maxScore) * 5;

      // Add to weighted sum
      weightedSum += normalizedScore * weight;
    }
  });

  return Math.round(weightedSum * 100) / 100;
}

/**
 * Calculate student total average for a subject
 */
export function calculateStudentTotalAverage(
  grades: StudentGrade[],
  studentId: string,
  subjectId: string,
  categories: GradingCategory[]
): StudentTotalAverage | null {
  const categoryAverages = calculateAllCategoryAverages(
    grades,
    studentId,
    subjectId,
    categories
  );

  if (categoryAverages.length === 0) {
    return null;
  }

  const totalAverage = calculateTotalAverage(categoryAverages, categories);

  return {
    id: `total-${studentId}-${subjectId}`,
    studentId,
    subjectId,
    totalAverage,
    lastUpdated: new Date().toISOString().split('T')[0],
  };
}

/**
 * Batch calculate all averages for multiple students
 */
export function calculateBatchAverages(
  grades: StudentGrade[],
  studentIds: string[],
  subjectId: string,
  categories: GradingCategory[]
): {
  categoryAverages: StudentCategoryAverage[];
  totalAverages: StudentTotalAverage[];
} {
  const categoryAverages: StudentCategoryAverage[] = [];
  const totalAverages: StudentTotalAverage[] = [];

  studentIds.forEach((studentId) => {
    const catAvgs = calculateAllCategoryAverages(
      grades,
      studentId,
      subjectId,
      categories
    );

    categoryAverages.push(...catAvgs);

    const totalAvg = calculateStudentTotalAverage(
      grades,
      studentId,
      subjectId,
      categories
    );

    if (totalAvg) {
      totalAverages.push(totalAvg);
    }
  });

  return { categoryAverages, totalAverages };
}

/**
 * Get statistics for a category across all students
 */
export function getCategoryStatistics(
  categoryAverages: StudentCategoryAverage[],
  categoryId: string
): {
  average: number;
  min: number;
  max: number;
  count: number;
} {
  const categoryScores = categoryAverages
    .filter((c) => c.categoryId === categoryId)
    .map((c) => c.averageScore);

  if (categoryScores.length === 0) {
    return { average: 0, min: 0, max: 0, count: 0 };
  }

  const sum = categoryScores.reduce((a, b) => a + b, 0);
  const average = sum / categoryScores.length;
  const min = Math.min(...categoryScores);
  const max = Math.max(...categoryScores);

  return {
    average: Math.round(average * 100) / 100,
    min,
    max,
    count: categoryScores.length,
  };
}

/**
 * Validate a score against category constraints
 */
export function validateScore(
  score: string | number,
  maxScore: number
): { valid: boolean; error?: string } {
  if (score === '' || score === null) {
    return { valid: true };
  }

  const numScore = typeof score === 'string' ? parseFloat(score) : score;

  if (isNaN(numScore)) {
    return { valid: false, error: 'يجب أن تكون الدرجة رقمية' };
  }

  if (numScore < 0) {
    return { valid: false, error: 'الدرجة لا يمكن أن تكون سالبة' };
  }

  if (numScore > maxScore) {
    return {
      valid: false,
      error: `الدرجة لا تزيد عن ${maxScore}`,
    };
  }

  return { valid: true };
}
