
import { DataProvider, useData } from "@/components/grade-control/lib/data-context";
import { GradeControls } from "@/components/grade-control/grades/controls";
import { GradesGrid } from "@/components/grade-control/grades/grades-grid";
import { StatusBar } from "@/components/grade-control/grades/status-bar";
import { Statistics } from "@/components/grade-control/grades/statistics";
import { HelpGuide } from "@/components/grade-control/grades/help-guide";
import { ImportExportManager } from "@/components/grade-control/grades/import-export-manager";
import { exportGradesToCSV, exportAveragesToCSV } from "@/components/grade-control/lib/export-utils";
import { classes, subjects } from "@/components/grade-control/lib/mock-data";
import { useCallback, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";

function SchoolControlContent() {
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);

  const {
    selectedClass,
    selectedSubject,
    selectedWeek,
    weeks,
    categories,
    getStudentsByClass,
    getGradesByWeekAndSubject,
    getCategoryAverages,
    getTotalAverage,
    saveGrades,
    isSaving,
    error,
  } = useData();

  const handleSave = useCallback(async () => {
    await saveGrades();
    setLastSaved(new Date().toLocaleTimeString('ar-SA'));
  }, [saveGrades]);

  const handleExport = useCallback(
    (type: 'grades' | 'averages') => {
      if (!selectedClass || !selectedSubject || !selectedWeek) {
        return;
      }

      const currentClass = classes.find((c) => c.id === selectedClass);
      const currentSubject = subjects.find((s) => s.id === selectedSubject);
      const currentWeek = weeks.find((w) => w.id === selectedWeek);
      const students = getStudentsByClass(selectedClass);

      if (!currentClass || !currentSubject || !currentWeek) return;

      if (type === 'grades') {
        const grades = getGradesByWeekAndSubject(
          selectedWeek,
          selectedSubject,
          selectedClass
        );
        exportGradesToCSV(
          students,
          grades,
          currentWeek,
          currentSubject,
          currentClass,
          categories
        );
      } else {
        const categoryAvgs = students.flatMap((student) =>
          getCategoryAverages(student.id, selectedSubject)
        );
        const totalAvgs = students.map((student) => {
          const avg = getTotalAverage(student.id, selectedSubject);
          return avg || {
            id: '',
            studentId: student.id,
            subjectId: selectedSubject,
            totalAverage: 0,
            lastUpdated: new Date().toISOString().split('T')[0],
          };
        });

        exportAveragesToCSV(
          students,
          categoryAvgs,
          totalAvgs,
          currentSubject,
          currentClass,
          categories
        );
      }
    },
    [
      selectedClass,
      selectedSubject,
      selectedWeek,
      weeks,
      categories,
      getStudentsByClass,
      getGradesByWeekAndSubject,
      getCategoryAverages,
      getTotalAverage,
    ]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-right">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          نظام رصد الدرجات والامتحانات (الكنترول)
        </h1>
        <p className="text-muted-foreground">
          إدارة ومراقبة درجات الطلاب بكفاءة وسهولة من داخل النظام الرئيسي
        </p>
      </div>

      {/* Controls */}
      <GradeControls
        onExport={handleExport}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {/* Import/Export Manager */}
      <ImportExportManager />

      {/* Grades Grid */}
      <GradesGrid onSave={handleSave} />

      {/* Statistics Section */}
      {selectedSubject && selectedClass && (
        <div className="space-y-4">
          <button
            onClick={() => setShowStats(!showStats)}
            className="text-sm font-medium text-primary hover:underline"
          >
            {showStats ? 'إخفاء الإحصائيات' : 'عرض الإحصائيات والرسوم البيانية'}
          </button>
          {showStats && <Statistics />}
        </div>
      )}

      {/* Status Bar */}
      <StatusBar isSaving={isSaving} error={error} lastSaved={lastSaved} />

      {/* Help Guide */}
      <HelpGuide />
    </div>
  );
}

export default function SchoolControl() {
  return (
    <DashboardLayout>
      <DataProvider>
        <div className="mx-auto max-w-7xl px-4 py-8" dir="rtl">
          <SchoolControlContent />
        </div>
      </DataProvider>
    </DashboardLayout>
  );
}
