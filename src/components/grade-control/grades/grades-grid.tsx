'use client';

import React from "react"

import { useData } from '../lib/data-context';
import { StudentGrade } from '../lib/types';
import { useEffect, useRef, useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GradesGridProps {
  onSave: () => void;
}

interface CellPosition {
  studentIndex: number;
  categoryIndex: number;
}

export function GradesGrid({ onSave }: GradesGridProps) {
  const {
    categories,
    selectedSubject,
    selectedWeek,
    selectedClass,
    getStudentsByClass,
    getGradesByWeekAndSubject,
    updateGrade,
    error,
  } = useData();

  const [focusCell, setFocusCell] = useState<CellPosition | null>(null);
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [editValue, setEditValue] = useState('');
  const [cellStatus, setCellStatus] = useState<Record<string, 'valid' | 'invalid'>>({});
  const gridRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const students = selectedClass ? getStudentsByClass(selectedClass) : [];
  const existingGrades = selectedClass && selectedSubject && selectedWeek 
    ? getGradesByWeekAndSubject(selectedWeek, selectedSubject, selectedClass) 
    : [];

  const getGradeValue = (studentId: string, categoryId: string): number | null => {
    const grade = existingGrades.find(
      (g) => g.studentId === studentId && g.categoryId === categoryId
    );
    return grade?.score ?? null;
  };

  const getCellKey = (studentId: string, categoryId: string) =>
    `${studentId}-${categoryId}`;

  const handleCellClick = (studentIndex: number, categoryIndex: number) => {
    const studentId = students[studentIndex].id;
    const categoryId = categories[categoryIndex].id;
    const currentValue = getGradeValue(studentId, categoryId);

    setFocusCell({ studentIndex, categoryIndex });
    setEditingCell({ studentIndex, categoryIndex });
    setEditValue(currentValue?.toString() ?? '');
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const validateScore = (score: string, maxScore: number): boolean => {
    if (score === '') return true;
    const num = parseFloat(score);
    return !isNaN(num) && num >= 0 && num <= maxScore;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditValue(value);

    if (editingCell) {
      const category = categories[editingCell.categoryIndex];
      const cellKey = getCellKey(
        students[editingCell.studentIndex].id,
        category.id
      );

      if (validateScore(value, category.maxScore)) {
        setCellStatus((prev) => ({ ...prev, [cellKey]: 'valid' }));
      } else {
        setCellStatus((prev) => ({ ...prev, [cellKey]: 'invalid' }));
      }
    }
  };

  const handleSaveCell = useCallback(() => {
    if (editingCell && selectedSubject && selectedWeek) {
      const student = students[editingCell.studentIndex];
      const category = categories[editingCell.categoryIndex];
      const cellKey = getCellKey(student.id, category.id);

      const trimmedValue = editValue.trim();

      if (trimmedValue === '') {
        // Clear the grade
        const existing = existingGrades.find(
          (g) => g.studentId === student.id && g.categoryId === category.id
        );
        if (existing) {
          updateGrade({ ...existing, score: null });
        }
        setCellStatus((prev) => ({ ...prev, [cellKey]: 'valid' }));
      } else {
        const score = parseFloat(trimmedValue);
        if (validateScore(trimmedValue, category.maxScore)) {
          const existing = existingGrades.find(
            (g) => g.studentId === student.id && g.categoryId === category.id
          );

          const newGrade: StudentGrade = {
            id: existing?.id ?? `grade-${Date.now()}`,
            studentId: student.id,
            subjectId: selectedSubject,
            weekId: selectedWeek,
            categoryId: category.id,
            score,
            enteredBy: 'teacher-1',
            enteredAt: new Date().toISOString().split('T')[0],
          };

          updateGrade(newGrade);
          setCellStatus((prev) => ({ ...prev, [cellKey]: 'valid' }));
        }
      }

      setEditingCell(null);
      setEditValue('');
    }
  }, [
    editingCell,
    selectedSubject,
    selectedWeek,
    students,
    categories,
    existingGrades,
    updateGrade,
  ]);

  const moveToCell = useCallback(
    (newPos: CellPosition) => {
      if (
        newPos.studentIndex >= 0 &&
        newPos.studentIndex < students.length &&
        newPos.categoryIndex >= 0 &&
        newPos.categoryIndex < categories.length
      ) {
        handleSaveCell();
        setFocusCell(newPos);
        setEditingCell(newPos);
        const student = students[newPos.studentIndex];
        const category = categories[newPos.categoryIndex];
        const currentValue = getGradeValue(student.id, category.id);
        setEditValue(currentValue?.toString() ?? '');
        setTimeout(() => inputRef.current?.select(), 0);
      }
    },
    [students.length, categories.length, handleSaveCell, students, categories]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!focusCell) return;

      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          handleSaveCell();
          moveToCell({
            studentIndex: focusCell.studentIndex + 1,
            categoryIndex: focusCell.categoryIndex,
          });
          break;
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            // Shift+Tab: move left
            moveToCell({
              studentIndex: focusCell.studentIndex,
              categoryIndex: focusCell.categoryIndex - 1,
            });
          } else {
            // Tab: move right
            moveToCell({
              studentIndex: focusCell.studentIndex,
              categoryIndex: focusCell.categoryIndex + 1,
            });
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleSaveCell();
          moveToCell({
            studentIndex: focusCell.studentIndex - 1,
            categoryIndex: focusCell.categoryIndex,
          });
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleSaveCell();
          moveToCell({
            studentIndex: focusCell.studentIndex + 1,
            categoryIndex: focusCell.categoryIndex,
          });
          break;
        case 'ArrowLeft':
          e.preventDefault();
          moveToCell({
            studentIndex: focusCell.studentIndex,
            categoryIndex: focusCell.categoryIndex - 1,
          });
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveToCell({
            studentIndex: focusCell.studentIndex,
            categoryIndex: focusCell.categoryIndex + 1,
          });
          break;
        case 'Escape':
          e.preventDefault();
          setEditingCell(null);
          setEditValue('');
          break;
        case 'Delete':
          e.preventDefault();
          setEditValue('');
          break;
      }
    },
    [focusCell, handleSaveCell, moveToCell]
  );

  const handleBlur = () => {
    handleSaveCell();
  };

  useEffect(() => {
    if (!selectedSubject || !selectedWeek || !selectedClass) {
      setFocusCell(null);
      setEditingCell(null);
      setEditValue('');
      setCellStatus({});
    }
  }, [selectedSubject, selectedWeek, selectedClass]);

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!selectedSubject || !selectedWeek || !selectedClass ? (
        <Alert className="bg-muted/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            الرجاء تحديد المرحلة والفصل والمادة والأسبوع لبدء إدخال الدرجات
          </AlertDescription>
        </Alert>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <ScrollArea className="h-[600px]" ref={gridRef}>
            <table className="w-full text-sm" dir="rtl">
              {/* Header */}
              <thead>
                <tr className="sticky top-0 z-10 border-b border-border bg-muted">
                  <th className="min-w-32 px-4 py-2 text-right font-medium text-foreground">
                    اسم الطالب
                  </th>
                  {categories.map((cat) => (
                    <th
                      key={cat.id}
                      className="min-w-16 px-2 py-2 text-center font-medium text-foreground"
                      title={cat.name}
                    >
                      <div className="text-xs">
                        {cat.name.substring(0, 8)}
                        <br />
                        ({cat.maxScore})
                      </div>
                    </th>
                  ))}
                  <th className="w-12 px-4 py-2 text-center font-medium text-foreground">
                    #
                  </th>
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {students.map((student, studentIndex) => (
                  <tr
                    key={student.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="min-w-32 px-4 py-2 text-right font-medium">
                      {student.name}
                    </td>

                    {categories.map((category, categoryIndex) => {
                      const cellKey = getCellKey(student.id, category.id);
                      const gradeValue = getGradeValue(student.id, category.id);
                      const isEditing = editingCell?.studentIndex === studentIndex &&
                        editingCell?.categoryIndex === categoryIndex;
                      const isFocused = focusCell?.studentIndex === studentIndex &&
                        focusCell?.categoryIndex === categoryIndex;
                      const status = cellStatus[cellKey];

                      return (
                        <td
                          key={`${student.id}-${category.id}`}
                          className={`min-w-16 px-2 py-2 text-center cursor-cell border transition-colors ${
                            isEditing ? 'bg-blue-50 dark:bg-blue-950' : ''
                          } ${
                            isFocused
                              ? 'ring-2 ring-ring outline-none'
                              : ''
                          } ${
                            status === 'valid' && gradeValue !== null
                              ? 'bg-green-50 dark:bg-green-950'
                              : status === 'invalid'
                              ? 'bg-red-50 dark:bg-red-950'
                              : gradeValue !== null
                              ? 'bg-green-50 dark:bg-green-950'
                              : ''
                          }`}
                          onClick={() =>
                            handleCellClick(studentIndex, categoryIndex)
                          }
                        >
                          {isEditing ? (
                            <input
                              ref={inputRef}
                              type="number"
                              min="0"
                              max={category.maxScore}
                              value={editValue}
                              onChange={handleInputChange}
                              onKeyDown={handleKeyDown}
                              onBlur={handleBlur}
                              className="w-full bg-transparent text-center px-1 py-0 border-b-2 border-ring outline-none font-medium"
                              autoFocus
                            />
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              {gradeValue !== null ? (
                                <>
                                  <span>{gradeValue}</span>
                                  {status === 'valid' && (
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                  )}
                                </>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="w-12 px-4 py-2 text-center text-muted-foreground">
                      {studentIndex + 1}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </div>
      )}

      <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
        <p className="font-medium mb-2">اختصارات لوحة المفاتيح:</p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <div>
            <kbd className="bg-background px-2 py-1 rounded text-xs">Tab</kbd>
            {' '}
            اليمين
          </div>
          <div>
            <kbd className="bg-background px-2 py-1 rounded text-xs">Shift+Tab</kbd>
            {' '}
            اليسار
          </div>
          <div>
            <kbd className="bg-background px-2 py-1 rounded text-xs">↑/↓</kbd>
            {' '}
            أعلى/أسفل
          </div>
          <div>
            <kbd className="bg-background px-2 py-1 rounded text-xs">Enter</kbd>
            {' '}
            حفظ و أسفل
          </div>
          <div>
            <kbd className="bg-background px-2 py-1 rounded text-xs">Esc</kbd>
            {' '}
            إلغاء
          </div>
          <div>
            <kbd className="bg-background px-2 py-1 rounded text-xs">Del</kbd>
            {' '}
            حذف
          </div>
        </div>
      </div>
    </div>
  );
}
