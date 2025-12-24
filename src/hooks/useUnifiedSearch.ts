import { useState, useCallback, useMemo } from 'react';
import { Stage, isValidStageClassPair } from './useStagesAndClasses';

/**
 * واجهة معايير البحث والفلترة الموحدة
 */
export interface UnifiedSearchFilters {
    studentName: string;
    stage: Stage | null;
    class: string | null;
}

/**
 * واجهة الطالب المبسطة للبحث والفلترة
 */
export interface StudentForSearch {
    studentId: string;
    fullNameAr: string;
    stage?: string;
    class?: string;
    academicYear?: string;
}

/**
 * Hook موحد للبحث والفلترة
 * يوفر منطق بحث ثابت قابل لإعادة الاستخدام في جميع الصفحات
 */
export function useUnifiedSearch(students: StudentForSearch[]) {
    const [filters, setFilters] = useState<UnifiedSearchFilters>({
        studentName: '',
        stage: null,
        class: null,
    });

    /**
     * تحديث اسم الطالب للبحث
     */
    const setStudentName = useCallback((name: string) => {
        setFilters(prev => ({
            ...prev,
            studentName: name.trim(),
        }));
    }, []);

    /**
     * تحديث المرحلة (عند التغيير، يتم مسح الفصل تلقائياً)
     */
    const setStage = useCallback((stage: Stage | null) => {
        setFilters(prev => ({
            ...prev,
            stage,
            class: null, // مسح الفصل عند تغيير المرحلة
        }));
    }, []);

    /**
     * تحديث الفصل (يتم التحقق من أنه يطابق المرحلة الحالية)
     */
    const setClass = useCallback((className: string | null) => {
        setFilters(prev => {
            if (!className) {
                return { ...prev, class: null };
            }
            // التحقق من أن الفصل متطابق مع المرحلة المختارة
            if (prev.stage && isValidStageClassPair(prev.stage, className)) {
                return { ...prev, class: className };
            }
            return prev;
        });
    }, []);

    /**
     * مسح جميع الفلاتر
     */
    const clearFilters = useCallback(() => {
        setFilters({
            studentName: '',
            stage: null,
            class: null,
        });
    }, []);

    /**
     * تطبيق الفلاتر على قائمة الطلاب
     */
    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            // البحث عن اسم الطالب (بحث نصي حقيقي)
            if (filters.studentName) {
                const searchTerm = filters.studentName.toLowerCase();
                const studentName = student.fullNameAr.toLowerCase();
                if (!studentName.includes(searchTerm)) {
                    return false;
                }
            }

            // فلترة المرحلة
            if (filters.stage && student.stage !== filters.stage) {
                return false;
            }

            // فلترة الفصل
            if (filters.class && student.class !== filters.class) {
                return false;
            }

            return true;
        });
    }, [students, filters]);

    return {
        // الفلاتر الحالية
        filters,

        // دوال تحديث الفلاتر
        setStudentName,
        setStage,
        setClass,
        clearFilters,

        // النتائج المفلترة
        filteredStudents,

        // عدد النتائج
        resultsCount: filteredStudents.length,

        // معلومات عن حالة الفلاتر
        hasActiveFilters: filters.studentName !== '' || filters.stage !== null || filters.class !== null,
    };
}