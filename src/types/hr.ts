/**
 * أنواع TypeScript لنظام الموارد البشرية (HR System)
 * Enterprise Human Resources Management Types
 */

// =============================================
// الأنواع الأساسية للموظفين
// =============================================

export type EmployeeType = 'معلم' | 'إداري' | 'أمن' | 'سائق' | 'عامل' | 'مشرف' | 'منسق';
export type EmployeeStatus = 'نشط' | 'متوقف' | 'إجازة' | 'منتهي الخدمة';
export type Gender = 'ذكر' | 'أنثى';
export type MaritalStatus = 'أعزب' | 'متزوج' | 'مطلق' | 'أرمل';
export type ContractType = 'دائم' | 'مؤقت' | 'جزئي' | 'تعاقد';

export interface HREmployee {
    id: string;
    employee_code: string;

    // البيانات الشخصية
    full_name_ar: string;
    full_name_en?: string;
    national_id: string;
    birth_date: string;
    gender: Gender;
    marital_status: MaritalStatus;
    nationality: string;
    religion?: string;

    // بيانات الاتصال
    phone: string;
    phone_secondary?: string;
    email?: string;
    address: string;

    // البيانات الوظيفية
    employee_type: EmployeeType;
    job_title: string;
    department_id: string;
    branch_id?: string;
    hire_date: string;
    contract_type: ContractType;
    contract_start_date?: string;
    contract_end_date?: string;
    direct_manager_id?: string;

    // البيانات المالية
    base_salary: number;
    bank_name?: string;
    bank_account?: string;

    // الحالة
    status: EmployeeStatus;

    // بيانات إنهاء الخدمة
    termination_date?: string;
    termination_reason?: string;
    termination_status?: 'مكتمل' | 'معلق';
    termination_details?: any;

    // الصورة والملفات
    photo_url?: string;

    // التتبع
    created_at: string;
    updated_at: string;
    created_by?: string;
}

// =============================================
// الأقسام والفروع
// =============================================

export interface HRDepartment {
    id: string;
    name: string;
    description?: string;
    manager_id?: string;
    parent_department_id?: string;
    created_at: string;
}

export interface HRBranch {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    manager_id?: string;
    created_at: string;
}

// =============================================
// المسميات الوظيفية
// =============================================

export interface HRJobTitle {
    id: string;
    title: string;
    description?: string;
    department_id?: string;
    min_salary?: number;
    max_salary?: number;
    created_at: string;
}

// =============================================
// الحضور والانصراف
// =============================================

export type AttendanceStatus = 'حاضر' | 'غائب' | 'متأخر' | 'إجازة' | 'مأمورية';

export interface HRShift {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
    break_duration_minutes: number;
    working_days: number[];  // 0-6 الأحد للسبت
    grace_period_minutes: number;
    created_at: string;
}

export interface HRAttendanceRecord {
    id: string;
    employee_id: string;
    date: string;
    check_in_time?: string;
    check_out_time?: string;
    status: AttendanceStatus;
    late_minutes?: number;
    early_leave_minutes?: number;
    overtime_minutes?: number;
    notes?: string;
    created_at: string;
}

export interface HRAttendanceRequest {
    id: string;
    employee_id: string;
    date: string;
    request_type: 'تعديل حضور' | 'تعديل انصراف' | 'إضافة يوم';
    old_value?: string;
    new_value: string;
    reason: string;
    status: 'معلق' | 'موافق' | 'مرفوض';
    approved_by?: string;
    approved_at?: string;
    created_at: string;
}

// =============================================
// الإجازات
// =============================================

export type LeaveType = 'سنوية' | 'مرضية' | 'عارضة' | 'بدون راتب' | 'أمومة' | 'أبوة' | 'زواج' | 'وفاة' | 'حج' | 'أخرى';
export type LeaveStatus = 'معلق' | 'موافق عليه من المدير' | 'موافق عليه من HR' | 'مرفوض' | 'ملغى';

export interface HRLeaveTypeConfig {
    id: string;
    name: LeaveType;
    max_days_per_year: number;
    requires_attachment: boolean;
    is_paid: boolean;
    gender_specific?: Gender;
    min_service_months?: number;
    description?: string;
    created_at: string;
}

export interface HRLeaveRequest {
    id: string;
    employee_id: string;
    leave_type: LeaveType;
    start_date: string;
    end_date: string;
    total_days: number;
    reason: string;
    attachment_url?: string;
    status: LeaveStatus;
    manager_approval?: boolean;
    manager_approval_date?: string;
    hr_approval?: boolean;
    hr_approval_date?: string;
    rejected_reason?: string;
    created_at: string;
}

export interface HRLeaveBalance {
    id: string;
    employee_id: string;
    leave_type: LeaveType;
    year: number;
    total_days: number;
    used_days: number;
    remaining_days: number;
    created_at: string;
}

// =============================================
// الرواتب
// =============================================

export type SalaryComponentType = 'أساسي' | 'بدل' | 'خصم' | 'مكافأة';

export interface HRSalaryComponent {
    id: string;
    name: string;
    type: SalaryComponentType;
    is_fixed: boolean;
    default_amount?: number;
    percentage_of_basic?: number;
    is_taxable: boolean;
    description?: string;
    created_at: string;
}

export interface HREmployeeSalary {
    id: string;
    employee_id: string;
    component_id: string;
    amount: number;
    effective_date: string;
    end_date?: string;
    created_at: string;
}

export interface HRPayrollCycle {
    id: string;
    month: number;
    year: number;
    status: 'مفتوح' | 'محسوب' | 'مراجع' | 'معتمد' | 'مرسل للمالية';
    total_gross: number;
    total_deductions: number;
    total_net: number;
    processed_by?: string;
    processed_at?: string;
    sent_to_finance_at?: string;
    created_at: string;
}

export interface HRPayrollRecord {
    id: string;
    cycle_id: string;
    employee_id: string;
    basic_salary: number;
    total_allowances: number;
    total_deductions: number;
    absence_deduction: number;
    lateness_deduction: number;
    net_salary: number;
    notes?: string;
    created_at: string;
}

// =============================================
// العقود
// =============================================

export interface HRContract {
    id: string;
    employee_id: string;
    contract_number: string;
    contract_type: ContractType;
    start_date: string;
    end_date?: string;
    salary: number;
    terms?: string;
    document_url?: string;
    status: 'نشط' | 'منتهي' | 'ملغى';
    renewed_from_id?: string;
    created_at: string;
}

// =============================================
// التقييم
// =============================================

export interface HREvaluationForm {
    id: string;
    name: string;
    description?: string;
    criteria: HREvaluationCriteria[];
    applicable_to: EmployeeType[];
    is_active: boolean;
    created_at: string;
}

export interface HREvaluationCriteria {
    id: string;
    form_id: string;
    name: string;
    description?: string;
    max_score: number;
    weight: number;
    order: number;
}

export interface HREmployeeEvaluation {
    id: string;
    employee_id: string;
    form_id: string;
    evaluator_id: string;
    period_start: string;
    period_end: string;
    scores: { criteria_id: string; score: number; comment?: string }[];
    total_score: number;
    weighted_score: number;
    overall_rating: 'ممتاز' | 'جيد جداً' | 'جيد' | 'مقبول' | 'ضعيف';
    strengths?: string;
    weaknesses?: string;
    recommendations?: string;
    status: 'مسودة' | 'مكتمل' | 'معتمد';
    created_at: string;
}

// =============================================
// التدريب
// =============================================

export interface HRTrainingCourse {
    id: string;
    name: string;
    description?: string;
    provider?: string;
    start_date: string;
    end_date: string;
    location?: string;
    is_mandatory: boolean;
    max_participants?: number;
    cost?: number;
    status: 'مجدول' | 'جاري' | 'مكتمل' | 'ملغى';
    created_at: string;
}

export interface HRTrainingAttendance {
    id: string;
    course_id: string;
    employee_id: string;
    attendance_status: 'مسجل' | 'حاضر' | 'غائب' | 'اجتاز' | 'لم يجتز';
    score?: number;
    certificate_url?: string;
    created_at: string;
}

export interface HRCertificate {
    id: string;
    employee_id: string;
    name: string;
    issuer: string;
    issue_date: string;
    expiry_date?: string;
    document_url?: string;
    created_at: string;
}

// =============================================
// المخالفات والإنذارات
// =============================================

export type ViolationType = 'غياب' | 'تأخير' | 'سلوك' | 'إهمال' | 'مخالفة إدارية' | 'أخرى';
export type WarningLevel = 'إنذار شفهي' | 'إنذار كتابي أول' | 'إنذار كتابي ثاني' | 'إنذار نهائي';
export type PenaltyType = 'إنذار' | 'خصم من الراتب' | 'حرمان من المكافأة' | 'إيقاف مؤقت' | 'فصل';

export interface HRViolation {
    id: string;
    employee_id: string;
    type: ViolationType;
    date: string;
    description: string;
    reported_by: string;
    evidence_url?: string;
    status: 'قيد المراجعة' | 'مؤكد' | 'مرفوض';
    created_at: string;
}

export interface HRWarning {
    id: string;
    employee_id: string;
    violation_id?: string;
    level: WarningLevel;
    date: string;
    reason: string;
    document_url?: string;
    acknowledged: boolean;
    acknowledged_at?: string;
    created_at: string;
}

export interface HRPenalty {
    id: string;
    employee_id: string;
    violation_id?: string;
    warning_id?: string;
    type: PenaltyType;
    amount?: number;
    days?: number;
    effective_date: string;
    reason: string;
    approved_by: string;
    created_at: string;
}

// =============================================
// نهاية الخدمة
// =============================================

export type TerminationReason = 'استقالة' | 'انتهاء العقد' | 'فصل' | 'تقاعد' | 'وفاة' | 'أخرى';

export interface HRTermination {
    id: string;
    employee_id: string;
    reason: TerminationReason;
    date: string;
    last_working_day: string;
    notice_period_days: number;
    notes?: string;
    status: 'معلق' | 'قيد التسليم' | 'مكتمل';
    created_at: string;
}

export interface HRHandover {
    id: string;
    termination_id: string;
    items: HRHandoverItem[];
    completed: boolean;
    completed_at?: string;
    verified_by?: string;
    created_at: string;
}

export interface HRHandoverItem {
    id: string;
    handover_id: string;
    item_name: string;
    description?: string;
    returned: boolean;
    returned_at?: string;
    notes?: string;
}

export interface HRFinalSettlement {
    id: string;
    termination_id: string;
    basic_salary_due: number;
    leave_balance_amount: number;
    end_of_service_amount: number;
    deductions: number;
    total_due: number;
    paid: boolean;
    paid_at?: string;
    notes?: string;
    created_at: string;
}

// =============================================
// الجداول الدراسية
// =============================================

export interface HRTeachingSchedule {
    id: string;
    teacher_id: string;
    academic_year: string;
    semester: 'الفصل الأول' | 'الفصل الثاني';
    schedule: HRScheduleSlot[];
    total_periods: number;
    created_at: string;
}

export interface HRScheduleSlot {
    id: string;
    schedule_id: string;
    day: number; // 0-6
    period: number;
    subject_id: string;
    class_id: string;
    room?: string;
}

export interface HRSubstitution {
    id: string;
    original_teacher_id: string;
    substitute_teacher_id: string;
    date: string;
    period: number;
    class_id: string;
    subject_id: string;
    reason: string;
    created_at: string;
}

// =============================================
// الإعدادات
// =============================================

export interface HRSystemSettings {
    id: string;
    absence_penalty_rate: number;
    lateness_penalty_rate: number;
    overtime_rate: number;
    lateness_grace_period_minutes: number;
    working_hours_per_day: number;
    working_days_per_month: number;
    updated_at: string;
}

export interface HRSettings {
    id: string;
    key: string;
    value: string;
    category: 'مؤسسة' | 'رواتب' | 'إجازات' | 'دوام' | 'إشعارات' | 'تكامل';
    description?: string;
    updated_at: string;
}

// =============================================
// مستندات الموظفين
// =============================================

export type DocumentType = 'بطاقة هوية' | 'شهادة ميلاد' | 'مؤهل دراسي' | 'عقد عمل' | 'شهادة خبرة' | 'صحيفة جنائية' | 'شهادة صحية' | 'أخرى';

export interface HREmployeeDocument {
    id: string;
    employee_id: string;
    type: DocumentType;
    name: string;
    document_url: string;
    issue_date?: string;
    expiry_date?: string;
    notes?: string;
    created_at: string;
}

// =============================================
// سجل التاريخ الوظيفي
// =============================================

export type EmploymentEventType = 'تعيين' | 'ترقية' | 'نقل' | 'تعديل راتب' | 'إنذار' | 'مكافأة' | 'تقييم' | 'إنهاء خدمة';

export interface HREmploymentHistory {
    id: string;
    employee_id: string;
    event_type: EmploymentEventType;
    event_date: string;
    description: string;
    old_value?: string;
    new_value?: string;
    reference_id?: string;
    created_by: string;
    created_at: string;
}
