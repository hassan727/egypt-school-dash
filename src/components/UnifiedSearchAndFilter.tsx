import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import { useStages, useClassesByStage, Stage } from '@/hooks/useStagesAndClasses';

interface UnifiedSearchAndFilterProps {
    studentName: string;
    onStudentNameChange: (name: string) => void;

    stage: Stage | null;
    onStageChange: (stage: Stage | null) => void;

    class: string | null;
    onClassChange: (className: string | null) => void;

    onClearFilters: () => void;

    hasActiveFilters: boolean;
    resultsCount: number;

    showStudentName?: boolean;
    showStage?: boolean;
    showClass?: boolean;
}

/**
 * مكون البحث والفلترة الموحد
 * يتم استخدامه في جميع الصفحات التي تحتاج إلى البحث والفلترة
 * 
 * المميزات:
 * - Dependent Dropdowns: الفصول تتغير ديناميكياً حسب المرحلة
 * - منطق موحد: نفس الفلتر يعمل في كل الصفحات
 * - سهل الاستخدام: معاملات واضحة وبسيطة
 */
export function UnifiedSearchAndFilter({
    studentName,
    onStudentNameChange,
    stage,
    onStageChange,
    class: selectedClass,
    onClassChange,
    onClearFilters,
    hasActiveFilters,
    resultsCount,
    showStudentName = true,
    showStage = true,
    showClass = true,
}: UnifiedSearchAndFilterProps) {
    const stages = useStages();
    const classes = useClassesByStage(stage);

    return (
        <div className="w-full space-y-4">
            {/* شريط الفلاتر الرئيسي */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* حقل البحث عن اسم الطالب */}
                {showStudentName && (
                    <div>
                        <label className="text-sm font-medium mb-2 block">البحث عن الطالب</label>
                        <Input
                            type="text"
                            placeholder="أدخل اسم الطالب..."
                            value={studentName}
                            onChange={(e) => onStudentNameChange(e.target.value)}
                            className="text-right"
                            dir="rtl"
                        />
                    </div>
                )}

                {/* قائمة المرحلة الدراسية */}
                {showStage && (
                    <div>
                        <label className="text-sm font-medium mb-2 block">المرحلة الدراسية</label>
                        <Select
                            value={stage || ''}
                            onValueChange={(value) => onStageChange(value ? (value as Stage) : null)}
                        >
                            <SelectTrigger className="text-right" dir="rtl">
                                <SelectValue placeholder="اختر المرحلة..." />
                            </SelectTrigger>
                            <SelectContent>
                                {stages.map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {s}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* قائمة الفصل (Dependent على المرحلة) */}
                {showClass && (
                    <div>
                        <label className="text-sm font-medium mb-2 block">الفصل</label>
                        <Select
                            value={selectedClass || ''}
                            onValueChange={(value) => onClassChange(value || null)}
                            disabled={!stage || classes.length === 0}
                        >
                            <SelectTrigger
                                className="text-right disabled:opacity-50"
                                dir="rtl"
                            >
                                <SelectValue
                                    placeholder={!stage ? 'اختر المرحلة أولاً...' : 'اختر الفصل...'}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map((cls) => (
                                    <SelectItem key={cls} value={cls}>
                                        {cls}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* زر مسح الفلاتر */}
                <div className="flex items-end">
                    <Button
                        variant="outline"
                        onClick={onClearFilters}
                        disabled={!hasActiveFilters}
                        className="w-full"
                    >
                        <X className="w-4 h-4 ml-2" />
                        مسح الفلاتر
                    </Button>
                </div>
            </div>

            {/* معلومات النتائج */}
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <span>
                    {hasActiveFilters
                        ? `تم العثور على ${resultsCount} من الطلاب المطابقين`
                        : `إجمالي الطلاب: ${resultsCount}`
                    }
                </span>
            </div>
        </div>
    );
}

export default UnifiedSearchAndFilter;