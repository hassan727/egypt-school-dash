'use client';

import React, { useState } from 'react';
import { useData } from '../lib/data-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, Trash2, Edit2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Student } from '../lib/types';

interface StudentManagerProps {
  onStudentsChanged?: () => void;
}

export function StudentManager({ onStudentsChanged }: StudentManagerProps) {
  const { selectedClass, getStudentsByClass } = useData();
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentNumber, setNewStudentNumber] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editName, setEditName] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const students = selectedClass ? getStudentsByClass(selectedClass) : [];

  const handleAddStudent = () => {
    if (!newStudentName.trim() || !selectedClass) {
      setMessage({
        type: 'error',
        text: 'يرجى إدخال اسم الطالب واختيار الفصل',
      });
      return;
    }

    // In a real app, this would add to database
    setMessage({
      type: 'success',
      text: `تم إضافة الطالب "${newStudentName}" بنجاح`,
    });

    setNewStudentName('');
    setNewStudentNumber('');
    onStudentsChanged?.();

    setTimeout(() => setMessage(null), 3000);
  };

  const handleEditStudent = () => {
    if (!editingStudent || !editName.trim()) {
      setMessage({
        type: 'error',
        text: 'يرجى إدخال اسم صحيح',
      });
      return;
    }

    // In a real app, this would update database
    setMessage({
      type: 'success',
      text: `تم تحديث بيانات الطالب بنجاح`,
    });

    setEditingStudent(null);
    setEditName('');
    setEditNumber('');
    onStudentsChanged?.();

    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteStudent = (studentId: string) => {
    // In a real app, this would delete from database
    setMessage({
      type: 'success',
      text: 'تم حذف الطالب بنجاح',
    });

    onStudentsChanged?.();
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 bg-transparent"
          disabled={!selectedClass}
        >
          <Users className="h-4 w-4" />
          إدارة الطلاب
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-96 overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>إدارة الطلاب</DialogTitle>
          <DialogDescription>
            أضف أو عدّل أو احذف أسماء الطلاب في الفصل
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Add New Student */}
          <div className="space-y-3 rounded-lg border p-4 bg-muted/50" dir="rtl">
            <h3 className="font-medium">إضافة طالب جديد</h3>
            <div className="space-y-2">
              <Input
                placeholder="اسم الطالب"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                className="text-right"
              />
              <Input
                placeholder="الرقم الجامعي (اختياري)"
                value={newStudentNumber}
                onChange={(e) => setNewStudentNumber(e.target.value)}
                className="text-right"
              />
              <Button onClick={handleAddStudent} className="w-full">
                <Plus className="h-4 w-4 ml-2" />
                إضافة الطالب
              </Button>
            </div>
          </div>

          {/* Students List */}
          <div className="space-y-2">
            <h3 className="font-medium">قائمة الطلاب ({students.length})</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 rounded border bg-card hover:bg-muted/50 transition"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{student.name}</p>
                    {student.studentNumber && (
                      <p className="text-xs text-muted-foreground">
                        {student.studentNumber}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-row-reverse">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteStudent(student.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingStudent(student);
                            setEditName(student.name);
                            setEditNumber(student.studentNumber || '');
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-sm" dir="rtl">
                        <DialogHeader>
                          <DialogTitle>تعديل الطالب</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <Input
                            placeholder="اسم الطالب"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="text-right"
                          />
                          <Input
                            placeholder="الرقم الجامعي"
                            value={editNumber}
                            onChange={(e) => setEditNumber(e.target.value)}
                            className="text-right"
                          />
                          <Button
                            onClick={handleEditStudent}
                            className="w-full"
                          >
                            حفظ التعديلات
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            ملاحظة: التعديلات المباشرة هنا ستؤثر على جميع البيانات المتعلقة بالطالب.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
