'use client';

import React, { useRef, useState } from 'react';
import { useData } from '../lib/data-context';
import { Button } from '@/components/ui/button';
import { Upload, Copy } from 'lucide-react';
import { StudentManager } from './student-manager';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StudentGrade } from '../lib/types';
import { copyGradesBetweenWeeks } from '../lib/copy-grades-utils';

interface ImportExportManagerProps {
  onGradesImported?: (count: number) => void;
}

export function ImportExportManager({
  onGradesImported,
}: ImportExportManagerProps) {
  const {
    selectedClass,
    selectedSubject,
    selectedWeek,
    weeks,
    gradesData,
    setGradesData,
    getStudentsByClass,
  } = useData();

  const [copyFromWeek, setCopyFromWeek] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [selectedEditStudent, setSelectedEditStudent] = useState<{ id: string } | null>(null);

  const students = selectedClass ? getStudentsByClass(selectedClass) : [];

  const handleCopyGrades = () => {
    if (!selectedClass || !selectedSubject || !selectedWeek || !copyFromWeek) {
      setMessage({
        type: 'error',
        text: 'يرجى تحديد الأسبوع المصدر والأسبوع الهدف',
      });
      return;
    }

    if (copyFromWeek === selectedWeek) {
      setMessage({
        type: 'error',
        text: 'يجب اختيار أسبوع مصدر مختلف عن الأسبوع الحالي',
      });
      return;
    }

    const studentIds = students.map((s) => s.id);
    const { grades, count } = copyGradesBetweenWeeks(
      gradesData,
      copyFromWeek,
      selectedWeek,
      selectedSubject,
      studentIds
    );

    const updatedGrades = gradesData.filter(
      (g) =>
        !(
          g.weekId === selectedWeek &&
          g.subjectId === selectedSubject &&
          studentIds.includes(g.studentId)
        )
    );

    setGradesData([...updatedGrades, ...grades]);
    setMessage({
      type: 'success',
      text: `تم نسخ ${count} درجة بنجاح من الأسبوع ${weeks.find((w) => w.id === copyFromWeek)?.weekNumber} إلى الأسبوع الحالي`,
    });

    setTimeout(() => setMessage(null), 4000);
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedClass || !selectedSubject || !selectedWeek) {
      setMessage({
        type: 'error',
        text: 'يرجى اختيار ملف و تحديد المرحلة والمادة والأسبوع',
      });
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter((l) => l.trim());

        // Parse CSV
        const rows = lines.map((line) => line.split(',').map((cell) => cell.trim()));

        if (rows.length < 2) {
          setMessage({
            type: 'error',
            text: 'الملف يجب أن يحتوي على رؤوس أعمدة وبيانات',
          });
          return;
        }

        const headers = rows[0];
        const nameIndex = headers.findIndex(
          (h) => h.toLowerCase().includes('اسم') || h.toLowerCase().includes('name')
        );

        if (nameIndex === -1) {
          setMessage({
            type: 'error',
            text: 'الملف يجب أن يحتوي على عمود باسم الطالب',
          });
          return;
        }

        const importedGrades: StudentGrade[] = [];
        const importedNames: { [key: number]: string } = {};

        rows.slice(1).forEach((row, rowIndex) => {
          if (row.length < 2 || !row[0].trim()) return;

          const studentName = row[nameIndex];
          importedNames[rowIndex] = studentName;

          // Find matching student
          const matchedStudent = students.find(
            (s) => s.name.toLowerCase() === studentName.toLowerCase()
          );

          if (matchedStudent) {
            // Import grades from remaining columns
            headers.forEach((header, colIndex) => {
              if (colIndex !== nameIndex && colIndex !== 0) {
                const score = parseFloat(row[colIndex]);
                if (!isNaN(score) && score >= 0) {
                  importedGrades.push({
                    id: `grade-${Date.now()}-${Math.random()}`,
                    studentId: matchedStudent.id,
                    subjectId: selectedSubject,
                    weekId: selectedWeek,
                    categoryId: `cat-${colIndex}`,
                    score,
                    enteredBy: 'teacher-1',
                    enteredAt: new Date().toISOString().split('T')[0],
                  });
                }
              }
            });
          }
        });

        if (importedGrades.length === 0) {
          setMessage({
            type: 'error',
            text: 'لم يتم العثور على بيانات صحيحة للاستيراد',
          });
        } else {
          // Merge grades
          const existingGrades = gradesData.filter(
            (g) =>
              !(
                g.weekId === selectedWeek && g.subjectId === selectedSubject
              )
          );

          setGradesData([...existingGrades, ...importedGrades]);
          setMessage({
            type: 'success',
            text: `تم استيراد ${importedGrades.length} درجة بنجاح`,
          });

          onGradesImported?.(importedGrades.length);
        }
      };

      reader.readAsText(file);
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'خطأ في قراءة الملف',
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveStudentName = (studentId: string) => {
    if (!editingName.trim()) return;

    // In a real app, this would update the database
    // For now, we'll just close the dialog
    setEditingName('');
    setSelectedEditStudent(null);
    setMessage({
      type: 'success',
      text: 'تم تحديث اسم الطالب بنجاح',
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4" dir="rtl">
      <div className="flex flex-col gap-2 sm:flex-row-reverse sm:flex-wrap">
        {/* Copy Grades Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              disabled={!selectedClass || !selectedSubject || !selectedWeek}
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
            >
              <Copy className="h-4 w-4" />
              نسخ من أسبوع آخر
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>نسخ درجات من أسبوع آخر</DialogTitle>
              <DialogDescription>
                اختر الأسبوع الذي تريد نسخ الدرجات منه إلى الأسبوع الحالي
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">الأسبوع المصدر</label>
                <Select value={copyFromWeek} onValueChange={setCopyFromWeek}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الأسبوع" />
                  </SelectTrigger>
                  <SelectContent>
                    {weeks
                      .filter((w) => w.id !== selectedWeek)
                      .map((week) => (
                        <SelectItem key={week.id} value={week.id}>
                          الأسبوع ({week.weekNumber})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {message && (
                <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleCopyGrades}
                disabled={!copyFromWeek}
                className="w-full"
              >
                نسخ الدرجات
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Import from Excel Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              disabled={!selectedClass || !selectedSubject || !selectedWeek}
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
            >
              <Upload className="h-4 w-4" />
              استيراد من Excel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>استيراد درجات من ملف Excel</DialogTitle>
              <DialogDescription>
                حمّل ملف CSV يحتوي على أسماء الطلاب والدرجات
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileImport}
                className="hidden"
              />

              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
              >
                اختر الملف
              </Button>

              {message && (
                <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              <div className="text-xs text-muted-foreground space-y-1">
                <p>صيغة الملف المتوقعة:</p>
                <code className="block bg-muted p-2 rounded">
                  اسم الطالب, مهام, واجب, ...
                </code>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Manage Students Button */}
        <StudentManager />
      </div>
    </div>
  );
}
