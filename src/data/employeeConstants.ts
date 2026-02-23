/**
 * ثوابت بيانات نظام إدارة الموظفين (HR System Constants)
 * يحتوي على التكوين الديناميكي لكل نوع وظيفة
 */

// =====================================================
// 1. أنواع الوظائف الرئيسية (Employee Roles)
// =====================================================
export const EMPLOYEE_ROLES = [
    { value: 'معلم', label: 'معلم (Teacher)', icon: '👨‍🏫' },
    { value: 'إداري', label: 'إداري (Administrative)', icon: '👔' },
    { value: 'سائق', label: 'سائق (Driver)', icon: '🚗' },
    { value: 'عامل', label: 'عامل (Worker)', icon: '👷' },
    { value: 'عامل نظافة', label: 'عامل نظافة (Janitor)', icon: '🧹' },
    { value: 'مراقب', label: 'مراقب طالب (Supervisor)', icon: '👀' },
] as const;

// =====================================================
// 2. الحقول الديناميكية حسب نوع الوظيفة
// =====================================================

export interface DynamicFieldDefinition {
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
    required?: boolean;
    options?: { value: string; label: string }[];
    placeholder?: string;
}

export const EMPLOYEE_ROLE_SPECIFIC_FIELDS: Record<string, DynamicFieldDefinition[]> = {
    // =============== معلم (Teacher) ===============
    معلم: [
        {
            name: 'subject_specialization',
            label: 'التخصص الدقيق',
            type: 'select',
            required: true,
            options: [
                { value: 'رياضيات', label: 'الرياضيات' },
                { value: 'لغة عربية', label: 'اللغة العربية' },
                { value: 'لغة انجليزية', label: 'اللغة الإنجليزية' },
                { value: 'علوم', label: 'العلوم' },
                { value: 'دراسات', label: 'الدراسات الاجتماعية' },
                { value: 'حاسوب', label: 'الحاسوب' },
                { value: 'تربية فنية', label: 'التربية الفنية' },
                { value: 'تربية موسيقية', label: 'التربية الموسيقية' },
                { value: 'تربية رياضية', label: 'التربية الرياضية' },
                { value: 'أخرى', label: 'أخرى' },
            ],
            placeholder: 'اختر التخصص',
        },
        {
            name: 'academic_qualification',
            label: 'المؤهل العلمي',
            type: 'select',
            required: true,
            options: [
                { value: 'بكالوريوس', label: 'بكالوريوس' },
                { value: 'ماجستير', label: 'ماجستير' },
                { value: 'دبلوم', label: 'دبلوم' },
                { value: 'دكتوراه', label: 'دكتوراه' },
            ],
        },
        {
            name: 'weekly_hours',
            label: 'عدد الحصص الأسبوعية',
            type: 'number',
            required: false,
            placeholder: 'مثال: 24',
        },
        {
            name: 'years_of_experience',
            label: 'سنوات الخبرة',
            type: 'number',
            required: false,
            placeholder: 'عدد السنوات',
        },
    ],

    // =============== إداري (Administrative) ===============
    إداري: [
        {
            name: 'job_title_specific',
            label: 'المسمى الوظيفي المحدد',
            type: 'select',
            required: true,
            options: [
                { value: 'سكرتير', label: 'سكرتير' },
                { value: 'أمين مستودع', label: 'أمين مستودع' },
                { value: 'محاسب', label: 'محاسب' },
                { value: 'مسؤول شؤون موظفين', label: 'مسؤول شؤون موظفين' },
                { value: 'مدير إدارة', label: 'مدير إدارة' },
                { value: 'موظف استقبال', label: 'موظف استقبال' },
                { value: 'أخرى', label: 'أخرى' },
            ],
        },
        {
            name: 'system_access',
            label: 'صلاحيات الدخول',
            type: 'select',
            required: false,
            options: [
                { value: 'نظام الحضور', label: 'نظام الحضور' },
                { value: 'الحسابات', label: 'الحسابات' },
                { value: 'الطلاب', label: 'الطلاب' },
                { value: 'الموظفين', label: 'الموظفين' },
                { value: 'الكل', label: 'الكل' },
            ],
        },
        {
            name: 'years_of_experience',
            label: 'سنوات الخبرة',
            type: 'number',
            required: false,
        },
    ],

    // =============== سائق (Driver) ===============
    سائق: [
        {
            name: 'license_number',
            label: 'رقم رخصة القيادة',
            type: 'text',
            required: true,
            placeholder: 'أدخل رقم الرخصة',
        },
        {
            name: 'license_expiry_date',
            label: 'تاريخ انتهاء الرخصة',
            type: 'date',
            required: true,
        },
        {
            name: 'vehicle_type',
            label: 'نوع المركبة',
            type: 'select',
            required: true,
            options: [
                { value: 'باص صغير', label: 'باص صغير' },
                { value: 'باص كبير', label: 'باص كبير' },
                { value: 'سيارة', label: 'سيارة' },
                { value: 'شاحنة', label: 'شاحنة' },
            ],
        },
        {
            name: 'vehicle_plate_number',
            label: 'رقم لوحة المركبة',
            type: 'text',
            required: false,
        },
        {
            name: 'years_of_experience',
            label: 'سنوات الخبرة في القيادة',
            type: 'number',
            required: false,
        },
    ],

    // =============== عامل (Worker) ===============
    عامل: [
        {
            name: 'work_area',
            label: 'منطقة العمل',
            type: 'select',
            required: true,
            options: [
                { value: 'المبنى الأول', label: 'المبنى الأول' },
                { value: 'الملاعب', label: 'الملاعب' },
                { value: 'الحديقة', label: 'الحديقة' },
                { value: 'المطبخ', label: 'المطبخ' },
                { value: 'الممرات', label: 'الممرات' },
                { value: 'أخرى', label: 'أخرى' },
            ],
        },
        {
            name: 'shift_type',
            label: 'فترات العمل',
            type: 'select',
            required: true,
            options: [
                { value: 'صباحي', label: 'صباحي' },
                { value: 'مسائي', label: 'مسائي' },
                { value: 'ورديات', label: 'ورديات' },
            ],
        },
        {
            name: 'years_of_experience',
            label: 'سنوات الخبرة',
            type: 'number',
            required: false,
        },
    ],

    // =============== عامل نظافة (Janitor) ===============
    'عامل نظافة': [
        {
            name: 'work_area',
            label: 'منطقة العمل',
            type: 'select',
            required: true,
            options: [
                { value: 'الفصول الدراسية', label: 'الفصول الدراسية' },
                { value: 'المكاتب الإدارية', label: 'المكاتب الإدارية' },
                { value: 'الممرات والدرج', label: 'الممرات والدرج' },
                { value: 'دورات المياه', label: 'دورات المياه' },
                { value: 'المقصف', label: 'المقصف' },
                { value: 'الملاعب والحديقة', label: 'الملاعب والحديقة' },
                { value: 'الكل', label: 'الكل' },
            ],
        },
        {
            name: 'shift_type',
            label: 'فترات العمل',
            type: 'select',
            required: true,
            options: [
                { value: 'صباحي', label: 'صباحي' },
                { value: 'مسائي', label: 'مسائي' },
                { value: 'ورديات', label: 'ورديات' },
            ],
        },
        {
            name: 'years_of_experience',
            label: 'سنوات الخبرة',
            type: 'number',
            required: false,
        },
    ],

    // =============== مراقب (Supervisor) ===============
    مراقب: [
        {
            name: 'supervised_area',
            label: 'المناطق المراقبة',
            type: 'select',
            required: true,
            options: [
                { value: 'الفصول الدراسية', label: 'الفصول الدراسية' },
                { value: 'الملاعب', label: 'الملاعب' },
                { value: 'الممرات', label: 'الممرات' },
                { value: 'المقصف', label: 'المقصف' },
                { value: 'الباص', label: 'الباص' },
            ],
        },
        {
            name: 'shift_type',
            label: 'فترات العمل',
            type: 'select',
            required: true,
            options: [
                { value: 'صباحي', label: 'صباحي' },
                { value: 'مسائي', label: 'مسائي' },
                { value: 'كامل اليوم', label: 'كامل اليوم' },
            ],
        },
        {
            name: 'years_of_experience',
            label: 'سنوات الخبرة',
            type: 'number',
            required: false,
        },
    ],
};

// =====================================================
// 3. خيارات الصلات في حالة الطوارئ
// =====================================================
export const EMERGENCY_CONTACT_RELATIONS = [
    'أب',
    'أم',
    'أخ',
    'أخت',
    'زوج',
    'زوجة',
    'ابن',
    'ابنة',
    'صديق',
    'جار',
    'آخر',
];

// =====================================================
// 4. خيارات حالة الموظف (Employee Status)
// =====================================================
export const EMPLOYEE_STATUS_OPTIONS = [
    { value: 'active', label: 'نشط / على رأس العمل' },
    { value: 'vacation', label: 'في إجازة' },
    { value: 'suspended', label: 'موقف مؤقتاً' },
    { value: 'terminated', label: 'منتهي خدماته' },
];

// =====================================================
// 5. نوع العقد (Contract Type)
// =====================================================
export const CONTRACT_TYPES = [
    { value: 'permanent', label: 'عقد دائم' },
    { value: 'annual', label: 'عقد سنوي' },
    { value: 'temporary', label: 'عقد مؤقت' },
    { value: 'hourly', label: 'بالساعة' },
];

// =====================================================
// 6. نوع العمل (Work Type / Employment Type)
// =====================================================
export const WORK_TYPES = [
    { value: 'full_time', label: 'دوام كامل' },
    { value: 'part_time', label: 'دوام جزئي' },
    { value: 'contract', label: 'عقد مؤقت' },
];

// =====================================================
// 7. الجنسيات (Arab Nationalities Only)
// =====================================================
export const NATIONALITIES = [
    { value: 'مصري', label: 'مصري' },
    { value: 'سعودي', label: 'سعودي' },
    { value: 'إماراتي', label: 'إماراتي' },
    { value: 'كويتي', label: 'كويتي' },
    { value: 'قطري', label: 'قطري' },
    { value: 'بحريني', label: 'بحريني' },
    { value: 'عماني', label: 'عماني' },
    { value: 'يمني', label: 'يمني' },
    { value: 'عراقي', label: 'عراقي' },
    { value: 'أردني', label: 'أردني' },
    { value: 'فلسطيني', label: 'فلسطيني' },
    { value: 'لبناني', label: 'لبناني' },
    { value: 'سوري', label: 'سوري' },
    { value: 'سوداني', label: 'سوداني' },
    { value: 'ليبي', label: 'ليبي' },
    { value: 'تونسي', label: 'تونسي' },
    { value: 'جزائري', label: 'جزائري' },
    { value: 'مغربي', label: 'مغربي' },
    { value: 'موريتاني', label: 'موريتاني' },
    { value: 'جيبوتي', label: 'جيبوتي' },
    { value: 'قمري', label: 'قمري' },
    { value: 'صومالي', label: 'صومالي' },
];
