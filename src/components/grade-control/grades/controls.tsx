'use client';

import { useData } from '../lib/data-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronDown, Download, Save } from 'lucide-react';
import { useState } from 'react';

interface ControlsProps {
  onExport: (type: 'grades' | 'averages') => void;
  onSave: () => void;
  isSaving: boolean;
}

export function GradeControls({
  onExport,
  onSave,
  isSaving,
}: ControlsProps) {
  const {
    stages,
    subjects,
    weeks,
    selectedStage,
    selectedClass,
    selectedSubject,
    selectedWeek,
    setSelectedStage,
    setSelectedClass,
    setSelectedSubject,
    setSelectedWeek,
    getClassesByStage,
  } = useData();

  const [isExporting, setIsExporting] = useState(false);

  const availableClasses = selectedStage
    ? getClassesByStage(selectedStage)
    : [];

  const handleExport = async (type: 'grades' | 'averages') => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      onExport(type);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4" dir="rtl">
      {/* Dropdowns Row 1 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            المرحلة
          </label>
          <Select value={selectedStage || ''} onValueChange={setSelectedStage}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="اختر المرحلة" />
            </SelectTrigger>
            <SelectContent>
              {stages.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            الفصل
          </label>
          <Select
            value={selectedClass || ''}
            onValueChange={setSelectedClass}
            disabled={!selectedStage}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="اختر الفصل" />
            </SelectTrigger>
            <SelectContent>
              {availableClasses.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dropdowns Row 2 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            المادة
          </label>
          <Select
            value={selectedSubject || ''}
            onValueChange={setSelectedSubject}
            disabled={!selectedClass}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="اختر المادة" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            الأسبوع
          </label>
          <Select
            value={selectedWeek || ''}
            onValueChange={setSelectedWeek}
            disabled={!selectedSubject}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="اختر الأسبوع" />
            </SelectTrigger>
            <SelectContent>
              {weeks.map((week) => (
                <SelectItem key={week.id} value={week.id}>
                  الأسبوع ({week.weekNumber}) - من {week.startDate} إلى{' '}
                  {week.endDate}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button
          onClick={onSave}
          disabled={isSaving || !selectedWeek}
          variant="default"
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'جاري الحفظ...' : 'حفظ البيانات'}
        </Button>

        <Button
          onClick={() => handleExport('grades')}
          disabled={isExporting || !selectedWeek}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'جاري التصدير...' : 'تصدير الدرجات'}
        </Button>

        <Button
          onClick={() => handleExport('averages')}
          disabled={isExporting || !selectedSubject}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'جاري التصدير...' : 'تصدير المتوسطات'}
        </Button>
      </div>
    </div>
  );
}
