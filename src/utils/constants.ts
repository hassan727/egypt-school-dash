// الثوابت المستخدمة عبر التطبيق

export const GENDER_OPTIONS = [
    { value: 'ذكر', label: 'ذكر' },
    { value: 'أنثى', label: 'أنثى' },
];

export const ATTENDANCE_STATUS = [
    { value: 'حاضر', label: 'حاضر' },
    { value: 'غائب', label: 'غائب' },
    { value: 'متأخر', label: 'متأخر' },
    { value: 'معذور', label: 'معذور' },
];

export const CONDUCT_RATINGS = [
    { value: 'ممتاز', label: 'ممتاز' },
    { value: 'جيد جداً', label: 'جيد جداً' },
    { value: 'جيد', label: 'جيد' },
    { value: 'مقبول', label: 'مقبول' },
    { value: 'ضعيف', label: 'ضعيف' },
];

export const FILE_STATUS = [
    { value: 'نشط', label: 'نشط' },
    { value: 'مُيقف', label: 'مُيقف' },
    { value: 'متقاعد', label: 'متقاعد' },
    { value: 'محذوف', label: 'محذوف' },
];

export const TRANSPORTATION_STATUS = [
    { value: 'يستخدم', label: 'يستخدم' },
    { value: 'لا يستخدم', label: 'لا يستخدم' },
];

export const ENROLLMENT_TYPES = [
    { value: 'جديد', label: 'جديد' },
    { value: 'مستمر', label: 'مستمر' },
    { value: 'محول', label: 'محول' },
    { value: 'منقطع ثم عاد', label: 'منقطع ثم عاد' },
];

export const PASSING_STATUS = [
    { value: 'ناجح', label: 'ناجح' },
    { value: 'راسب', label: 'راسب' },
    { value: 'محمول', label: 'محمول' },
];

export const RELATIONSHIPS = [
    { value: 'أب', label: 'أب' },
    { value: 'أم', label: 'أم' },
    { value: 'أخ', label: 'أخ' },
    { value: 'أخت', label: 'أخت' },
    { value: 'جد', label: 'جد' },
    { value: 'جدة', label: 'جدة' },
    { value: 'عم', label: 'عم' },
    { value: 'عمة', label: 'عمة' },
    { value: 'خال', label: 'خال' },
    { value: 'خالة', label: 'خالة' },
    { value: 'كفيل', label: 'كفيل' },
    { value: 'أخرى', label: 'أخرى' },
];

export const EDUCATION_LEVELS = [
    { value: 'بدون تعليم', label: 'بدون تعليم' },
    { value: 'ابتدائي', label: 'ابتدائي' },
    { value: 'إعدادي', label: 'إعدادي' },
    { value: 'ثانوي', label: 'ثانوي' },
    { value: 'دبلوم', label: 'دبلوم' },
    { value: 'بكالوريوس', label: 'بكالوريوس' },
    { value: 'ماجستير', label: 'ماجستير' },
    { value: 'دكتوراه', label: 'دكتوراه' },
];

export const STAGES = [
    { value: 'كي جي 1', label: 'كي جي 1' },
    { value: 'كي جي 2', label: 'كي جي 2' },
    { value: 'الأول الابتدائي', label: 'الأول الابتدائي' },
    { value: 'الثاني الابتدائي', label: 'الثاني الابتدائي' },
    { value: 'الثالث الابتدائي', label: 'الثالث الابتدائي' },
    { value: 'الرابع الابتدائي', label: 'الرابع الابتدائي' },
    { value: 'الخامس الابتدائي', label: 'الخامس الابتدائي' },
    { value: 'السادس الابتدائي', label: 'السادس الابتدائي' },
    { value: 'الأول الإعدادي', label: 'الأول الإعدادي' },
    { value: 'الثاني الإعدادي', label: 'الثاني الإعدادي' },
    { value: 'الثالث الإعدادي', label: 'الثالث الإعدادي' },
    { value: 'الأول الثانوي', label: 'الأول الثانوي' },
    { value: 'الثاني الثانوي', label: 'الثاني الثانوي' },
    { value: 'الثالث الثانوي', label: 'الثالث الثانوي' },
];

export const MARITAL_STATUS = [
    { value: 'متزوج', label: 'متزوج' },
    { value: 'أعزب', label: 'أعزب' },
    { value: 'مطلق', label: 'مطلق' },
    { value: 'أرمل', label: 'أرمل' },
];

export const TRANSACTION_TYPES = [
    { value: 'دفع', label: 'دفع' },
    { value: 'استرجاع', label: 'استرجاع' },
    { value: 'تعديل', label: 'تعديل' },
];

export const PAYMENT_METHODS = [
    { value: 'نقدي', label: 'نقدي' },
    { value: 'شيك', label: 'شيك' },
    { value: 'تحويل بنكي', label: 'تحويل بنكي' },
    { value: 'بطاقة ائتمان', label: 'بطاقة ائتمان' },
];

export const SEMESTERS = [
    { value: 'الفصل الأول', label: 'الفصل الأول' },
    { value: 'الفصل الثاني', label: 'الفصل الثاني' },
];

export const ACADEMIC_YEARS = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - 5 + i;
    return {
        value: `${year}-${year + 1}`,
        label: `${year}-${year + 1}`,
    };
});

export const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
} as const;

export const PAGE_SIZES = [10, 20, 50, 100];

export const DATE_FORMAT = 'YYYY-MM-DD';
export const TIME_FORMAT = 'HH:mm';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm';

export const API_TIMEOUT = 30000; // 30 seconds
export const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
export const AUTO_REFRESH_INTERVAL = 1 * 60 * 1000; // 1 minute