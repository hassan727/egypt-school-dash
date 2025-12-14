import { useMemo } from 'react';

/**
 * بيانات المراحل والفصول المرجعية
 * هذا هو مصدر الحقيقة الوحيد لهذه البيانات
 */
export const STAGES_AND_CLASSES_DATA = {
    'KG1': ['KG1A', 'KG1B', 'KG1C', 'KG1D'],
    'KG2': ['KG2A', 'KG2B', 'KG2C', 'KG2D'],
    'الصف الأول الابتدائي': ['1A', '1B', '1C', '1D'],
    'الصف الثاني الابتدائي': ['2A', '2B', '2C', '2D'],
    'الصف الثالث الابتدائي': ['3A', '3B', '3C', '3D', '3E'],
    'الصف الرابع الابتدائي': ['4A', '4B', '4C', '4D'],
    'الصف الخامس الابتدائي': ['5A', '5B', '5C', '5D'],
    'الصف السادس الابتدائي': ['6A', '6B', '6C', '6D'],
    'الصف الأول الإعدادي': ['1A PRE', '1B PRE'],
    'الصف الثاني الإعدادي': ['2A PRE', '2B PRE', '2C PRE'],
    'الصف الثالث الإعدادي': ['3A PRE', '3B PRE'],
    'الصف الأول الثانوي': ['S1A', 'S1B', 'S1C', 'S1D'],
    'الصف الثاني الثانوي': ['S2A', 'S2B', 'S2C', 'S2D'],
    'الصف الثالث الثانوي': ['S3A', 'S3B', 'S3C', 'S3D'],
} as const;

export type Stage = keyof typeof STAGES_AND_CLASSES_DATA;

/**
 * Hook للحصول على قائمة المراحل
 */
export function useStages() {
    return useMemo(() => {
        return Object.keys(STAGES_AND_CLASSES_DATA) as Stage[];
    }, []);
}

/**
 * Hook للحصول على قائمة الفصول المرتبطة بمرحلة محددة
 * إذا لم يتم تحديد مرحلة، يعود array فارغ
 */
export function useClassesByStage(stage: Stage | null | undefined) {
    return useMemo(() => {
        if (!stage) return [];
        return STAGES_AND_CLASSES_DATA[stage] || [];
    }, [stage]);
}

/**
 * Hook شامل للحصول على المراحل والفصول معاً
 * مفيد عند الحاجة للعمل مع كلا البيانات معاً
 */
export function useStagesAndClassesData() {
    return useMemo(() => ({
        data: STAGES_AND_CLASSES_DATA,
        stages: Object.keys(STAGES_AND_CLASSES_DATA) as Stage[],
    }), []);
}

/**
 * دالة مساعدة للتحقق من أن المرحلة والفصل متطابقان
 */
export function isValidStageClassPair(stage: string, className: string): boolean {
    const classes = STAGES_AND_CLASSES_DATA[stage as Stage];
    return classes ? classes.includes(className) : false;
}