import {
  Student,
  StudentGrade,
  GradingCategory,
  AcademicWeek,
  Class,
  Subject,
  StudentCategoryAverage,
  StudentTotalAverage,
} from './types';
import { gradingCategories } from './mock-data';

// Simple CSV export (can be opened in Excel)
export function exportGradesToCSV(
  students: Student[],
  grades: StudentGrade[],
  week: AcademicWeek,
  subject: Subject,
  classs: Class,
  categories: GradingCategory[]
) {
  const headers = [
    '#',
    'اسم الطالب',
    ...categories.map((c) => `${c.name} (${c.maxScore})`),
    'الإجمالي',
  ];

  const rows = students.map((student, index) => {
    const studentGrades = grades.filter((g) => g.studentId === student.id);
    const categoryScores = categories.map((cat) => {
      const grade = studentGrades.find((g) => g.categoryId === cat.id);
      return grade?.score ?? '';
    });
    const total = categoryScores.reduce((sum, score) => {
      return sum + (typeof score === 'number' ? score : 0);
    }, 0);

    return [
      index + 1,
      student.name,
      ...categoryScores,
      total > 0 ? total : '',
    ];
  });

  const csvContent = [
    `نظام رصد الدرجات - أسبوعي`,
    `الأسبوع: ${week.weekNumber}`,
    `المادة: ${subject.name}`,
    `الفصل: ${classs.name}`,
    `الفترة: من ${week.startDate} إلى ${week.endDate}`,
    '',
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `Grades_${classs.name}_${subject.name}_Week${week.weekNumber}.csv`
  );
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportAveragesToCSV(
  students: Student[],
  categoryAverages: StudentCategoryAverage[],
  totalAverages: StudentTotalAverage[],
  subject: Subject,
  classs: Class,
  categories: GradingCategory[]
) {
  const headers = [
    '#',
    'اسم الطالب',
    ...categories.map((c) => `${c.name}`),
    'المتوسط الكلي',
  ];

  const rows = students.map((student, index) => {
    const studentCategoryAvgs = categoryAverages.filter(
      (avg) => avg.studentId === student.id
    );
    const studentTotalAvg = totalAverages.find(
      (avg) => avg.studentId === student.id
    );

    const categoryScores = categories.map((cat) => {
      const avg = studentCategoryAvgs.find((a) => a.categoryId === cat.id);
      return avg ? avg.averageScore.toFixed(2) : '-';
    });

    return [
      index + 1,
      student.name,
      ...categoryScores,
      studentTotalAvg ? studentTotalAvg.totalAverage.toFixed(2) : '-',
    ];
  });

  const csvContent = [
    `نظام رصد الدرجات - المتوسطات`,
    `المادة: ${subject.name}`,
    `الفصل: ${classs.name}`,
    `السنة الأكاديمية: 2024-2025`,
    '',
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `Averages_${classs.name}_${subject.name}_2024-2025.csv`
  );
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Create a simple HTML table for printing
export function generateGradesHTML(
  students: Student[],
  grades: StudentGrade[],
  week: AcademicWeek,
  subject: Subject,
  classs: Class,
  categories: GradingCategory[]
): string {
  const rows = students
    .map((student, index) => {
      const studentGrades = grades.filter((g) => g.studentId === student.id);
      const categoryScores = categories.map((cat) => {
        const grade = studentGrades.find((g) => g.categoryId === cat.id);
        return `<td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${
          grade?.score ?? '-'
        }</td>`;
      });
      const total = studentGrades.reduce((sum, g) => sum + (g.score ?? 0), 0);

      return `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${
            index + 1
          }</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${
            student.name
          }</td>
          ${categoryScores.join('')}
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">${
            total > 0 ? total : '-'
          }</td>
        </tr>
      `;
    })
    .join('');

  const headers = categories
    .map(
      (c) =>
        `<th style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #f5f5f5;">${c.name}<br/>(${c.maxScore})</th>`
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>جدول الدرجات</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; direction: rtl; }
        h1, h2 { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { border: 1px solid #ddd; padding: 10px; text-align: center; background-color: #f5f5f5; }
        td { border: 1px solid #ddd; padding: 8px; }
      </style>
    </head>
    <body>
      <h1>نظام رصد الدرجات</h1>
      <h2>جدول درجات الأسبوع ${week.weekNumber}</h2>
      <p><strong>المادة:</strong> ${subject.name}</p>
      <p><strong>الفصل:</strong> ${classs.name}</p>
      <p><strong>الفترة:</strong> من ${week.startDate} إلى ${week.endDate}</p>
      
      <table>
        <thead>
          <tr>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: center; background-color: #f5f5f5;">#</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: center; background-color: #f5f5f5;">اسم الطالب</th>
            ${headers}
            <th style="border: 1px solid #ddd; padding: 10px; text-align: center; background-color: #f5f5f5;">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </body>
    </html>
  `;
}
