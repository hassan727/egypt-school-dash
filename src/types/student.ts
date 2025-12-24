/**
 * أنواع البيانات لنظام الطلاب
 * كل واجهة تمثل قسم من أقسام بيانات الطالب
 */

// القسم الأول: البيانات الشخصية
export interface PersonalData {
    id?: string;
    studentId?: string;
    fullNameAr: string;
    nationalId: string;
    dateOfBirth: string;
    placeOfBirth: string;
    nationality: string;
    gender: string;
    religion: string;
    specialNeeds?: string;
}

// القسم الثاني: بيانات القيد الدراسي
export interface EnrollmentData {
    id?: string;
    studentId: string;
    academicYearId?: string; // New field
    classId?: string; // New field
    academicYear: string; // Legacy
    stage: string; // Legacy
    class: string; // Legacy
    enrollmentType: string;
    enrollmentDate: string;
    previousSchool?: string;
    transferReason?: string;
    previousLevel?: string;
    secondLanguage: string;
    curriculumType: string;
    hasRepeated: boolean;
    orderAmongSiblings: number;
    isRegular: boolean;
    registrationStatus?: 'provisionally_registered' | 'active'; // New field
}

// القسم الثالث: بيانات ولي الأمر
export interface GuardianData {
    id?: string;
    studentId: string;
    fullName: string;
    relationship: string;
    nationalId: string;
    job: string;
    workplace: string;
    educationLevel: string;
    phone: string;
    email: string;
    address: string;
    maritalStatus: string;
    hasLegalGuardian: boolean;
    socialMedia?: string;
    whatsappNumber?: string;
    nationality?: string;
}

// القسم الرابع: بيانات الأم
export interface MotherData {
    id?: string;
    studentId: string;
    fullName: string;
    nationalId: string;
    job: string;
    workplace: string;
    phone: string;
    email: string;
    educationLevel: string;
    address: string;
    relationship: string;
    whatsappNumber?: string;
    nationality?: string;
}

// القسم الإداري: البيانات الإدارية
export interface AdministrativeData {
    id?: string;
    studentId: string;
    admissionDate?: string;
    studentIdNumber?: string;
    fileStatus: string;
    infoUpdateDate?: string;
    transportationStatus: string;
    busNumber?: string;
    pickupPoint?: string;
    schoolDocumentsComplete: boolean;
    documentsNotes?: string;
    healthInsurance: boolean;
    healthInsuranceNumber?: string;
    administrativeNotes?: string;
    emergencyContactUpdated?: string;
}

// القسم الخامس: بيانات الطوارئ
export interface EmergencyContact {
    id?: string;
    studentId: string;
    contactName: string;
    relationship: string;
    phone: string;
    whatsappNumber?: string;
    nationality?: string;
    address: string;
}

// القسم السادس: المصروفات
export interface SchoolFees {
    id?: string;
    studentId: string;
    totalAmount: number;
    installmentCount: number;
    advancePayment: number;
    installments: Installment[];
}

export interface Installment {
    id?: string;
    feeId?: string;
    installmentNumber: number;
    amount: number;
    dueDate: string;
    paid: boolean;
    paidDate?: string;
}

export interface OtherExpense {
    id?: string;
    studentId: string;
    expenseType: string;
    quantity?: number;
    totalPrice: number;
    date: string;
}

// القسم السابع: السجلات الأكاديمية
export interface AcademicRecord {
    id?: string;
    studentId?: string;
    currentGPA: number;
    totalMarks: number;
    averageMarks: number;
    passingStatus: 'ناجح' | 'راسب' | 'معلق';
    academicNotes?: string;
    strengths?: string;
    weaknesses?: string;
    lastExamDate?: string;
}

// المواد الدراسية
export interface Subject {
    id?: string;
    name: string;
    teacherName: string;
    semester?: string;
}

// =============================================
// ACADEMIC HIERARCHY TYPES - أنواع الهيكل الشجري الأكاديمي
// =============================================

// السنة الدراسية
export interface AcademicYear {
    id: string;
    yearCode: string; // مثال: 2025-2026
    yearNameAr: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

// الفصل الدراسي
export interface Semester {
    id: string;
    academicYearId: string;
    semesterCode: string; // TERM_1, TERM_2
    semesterNameAr: string;
    orderNumber: number; // 1 أو 2
    startDate: string;
    endDate: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

// المادة الدراسية (محدثة)
export interface SubjectHierarchy {
    id: string;
    subjectCode: string; // كود موحد (ARABIC, MATH, SCIENCE, ENGLISH, ISLAMIC, ART, PE)
    subjectNameAr: string;
    subjectNameEn?: string;
    stageLevel?: string; // الصف - null إذا كانت للجميع
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

// نوع التقييم (محدث)
export interface AssessmentTypeHierarchy {
    id: string;
    assessmentCode: string; // DAILY, WEEKLY, MONTHLY, MID_YEAR, FINAL, PROJECT, PRESENTATION
    assessmentNameAr: string;
    assessmentNameEn?: string;
    description?: string;
    weight: number; // الوزن الافتراضي
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

// أنواع التقييمات (للحفاظ على التوافق)
export type AssessmentType =
    | 'تقييم أسبوعي'
    | 'تقييم شهري'
    | 'امتحان شهري'
    | 'امتحان منتصف الفصل'
    | 'مشروع أو بحث'
    | 'امتحان نهاية الفصل'
    | 'تقييم سلوكي أو عملي';

// الدرجة الفردية (محدثة مع الهيكل الشجري)
export interface Grade {
    id?: string;
    studentId?: string;

    // الربط بالهيكل الشجري
    studentName?: string; // اسم الطالب (للعرض والطباعة)
    studentCode?: string; // كود الطالب (للعرض والطباعة)
    academicYearId?: string; // ربط مع السنة الدراسية
    semesterId?: string; // ربط مع الفصل الدراسي
    subjectId?: string; // ربط مع المادة الدراسية
    assessmentTypeId?: string; // ربط مع نوع التقييم

    // البيانات الأساسية (للتوافق)
    academicYear?: string; // السنة الدراسية (مثل: 2025-2026)
    semester?: 'الفصل الأول' | 'الفصل الثاني'; // للفصول الدراسية
    subjectName: string;
    teacherName?: string; // اسم المعلم الذي أضاف الدرجة
    assessmentType?: AssessmentType;
    month?: string; // للتقييمات الشهرية

    // الدرجات والتقييم
    originalGrade: number;
    finalGrade: number;
    gradeLevel?: 'ممتاز' | 'جيد جدًّا' | 'جيد' | 'مقبول' | 'ضعيف';

    // معلومات الإدخال
    teacherId?: string; // معرف المعلم
    seatNumber?: string; // رقم جلوس الطالب (للامتحانات النهائية)
    assessmentDate?: string; // تاريخ التقييم المحدد (مثل: 2025-10-15)

    // الملاحظات
    teacherNotes?: string;

    // بيانات تتبع التعديلات
    createdAt?: string; // تاريخ ووقت الإضافة
    updatedAt?: string; // تاريخ ووقت آخر تعديل
    weight?: number; // وزن الدرجة في الحساب
    createdBy?: string; // اسم المعلم الذي أضاف الدرجة (للتدقيق)
}

// سجل التعديلات على الدرجات
export interface GradeAuditLog {
    id?: string;
    gradeId: string;
    studentId?: string;
    subjectName: string;
    actionType: 'إضافة' | 'تعديل' | 'حذف';
    teacherName?: string; // من قام بالتعديل
    userId?: string; // معرف المستخدم (TeacherID أو AdminID)
    fieldName?: string; // اسم الحقل المعدل (مثال: finalGrade, assessmentDate)
    oldValue?: any; // القيمة قبل التعديل (يمكن أن تكون رقم أو نص أو تاريخ)
    newValue?: any; // القيمة بعد التعديل
    timestamp: string; // وقت التعديل بالضبط (بالثانية)
    reason?: string; // سبب التعديل (إجباري عند التعديل)
    notes?: string; // ملاحظات إضافية
}

// ملخص المادة الدراسية للطالب
export interface SubjectGradeSummary {
    subjectId?: string;
    subjectName: string;
    teacherName: string;
    originalGrade: number;
    finalGrade: number;
    gradeLevel: 'ممتاز' | 'جيد جدًّا' | 'جيد' | 'مقبول' | 'ضعيف';
    grades: Grade[];
    teacherNotes?: string;
}

// القسم الثامن: السجلات السلوكية
export interface BehavioralRecord {
    id?: string;
    studentId?: string;
    conductRating: 'ممتاز' | 'جيد جداً' | 'جيد' | 'مقبول' | 'ضعيف';
    attendanceRate: number;
    absences: number;
    tardiness: number;
    disciplinaryIssues: boolean;
    disciplinaryDetails?: string;
    participationLevel: 'عالي' | 'متوسط' | 'منخفض';
    classroomBehavior?: string;
    socialInteraction?: string;
    counselorNotes?: string;
    lastIncidentDate?: string;
}

// القسم التاسع: المعاملات المالية
export interface FinancialTransaction {
    id?: string;
    studentId?: string;
    transactionType: 'دفعة' | 'مصروف إضافي' | 'خصم' | 'غرامة' | 'استرجاع';
    amount: number;
    description: string;
    paymentMethod?: string;
    transactionDate: string;
    receiptNumber?: string;
    createdBy?: string;
    payerName?: string;
    payerRelation?: string;
    payerPhone?: string;
    payerNationalId?: string;
}

// القسم العاشر: سجل التغييرات (Audit Trail)
export interface AuditTrailEntry {
    id?: string;
    studentId?: string;
    changeType: string; // 'بيانات شخصية', 'قيد دراسي', 'ولي أمر', إلخ
    changedFields?: Record<string, { oldValue: any; newValue: any }>;
    changedBy?: string;
    changeReason?: string;
    createdAt?: string;
}

// سجل التعديلات الأكاديمي المفصل
export interface AcademicAuditLog {
    id?: string;
    gradeId: string;
    studentId: string;
    userId: string; // معرف المستخدم الذي قام بالتعديل
    actionType: 'CREATE' | 'UPDATE' | 'DELETE';
    fieldName?: string; // اسم الحقل المعدل
    oldValue?: string; // القيمة القديمة
    newValue?: string; // القيمة الجديدة
    changeReason?: string; // سبب التعديل (إجباري عند التحديث)
    changeTimestamp: string;
    ipAddress?: string;
    userAgent?: string;
}

// القسم الحادي عشر: سجل الحضور
export interface AttendanceRecord {
    id?: string;
    studentId?: string;
    date: string;
    status: 'حاضر' | 'غائب' | 'متأخر' | 'معذور';
    checkInTime?: string;
    checkOutTime?: string;
    notes?: string;
    attachment_url?: string;
}

// ===== القسم الجديد: بيانات الوصاية القانونية =====
export interface LegalGuardianshipData {
    // تحديد ما إذا كان ولي الأمر (الأب/الأم) هو الوصي القانوني
    guardianIsLegalCustodian: boolean;

    // بيانات الوصي القانوني الأساسي (إذا كان مختلفاً عن ولي الأمر)
    primaryLegalGuardian?: {
        fullName: string;
        relationship: string;
        nationalId: string;
        nationality: string;
        phone: string;
        whatsappNumber: string;
        email?: string;
        workplace?: string;
    };

    // بيانات الوصي القانوني الثانوي / جهة اتصال بديلة (اختياري)
    secondaryLegalGuardian?: {
        fullName?: string;
        relationship?: string;
        nationalId?: string;
        nationality?: string;
        phone?: string;
        whatsappNumber?: string;
        email?: string;
        workplace?: string;
    };
}

// البيانات الكاملة للطالب
export interface StudentProfile {
    id: string;
    studentId: string;
    createdAt: string;
    updatedAt: string;
    personalData: PersonalData;
    enrollmentData: EnrollmentData;
    guardianData: GuardianData;
    motherData: MotherData;
    legalGuardianshipData?: LegalGuardianshipData; // بيانات الوصاية القانونية
    administrativeData?: AdministrativeData;
    emergencyContacts: EmergencyContact[];
    schoolFees: SchoolFees;
    otherExpenses: OtherExpense[];
    academicRecords?: AcademicRecord[];
    behavioralRecords?: BehavioralRecord[];
    financialTransactions?: FinancialTransaction[];
    auditTrail?: AuditTrailEntry[];
    attendanceRecords?: AttendanceRecord[];
    refunds?: Refund[];
}

// القسم الثاني عشر: أنواع الرسوم (Fee Types)
export interface FeeType {
    id?: string;
    feeTypeName: string;
    feeCode: string;
    description?: string;
    isRefundable: boolean;
    refundPolicyPercentage: number;
    createdAt?: string;
    updatedAt?: string;
}

// القسم الثالث عشر: خصومات الاسترداد (Refund Deductions)
export interface RefundDeduction {
    id?: string;
    refundId?: string;
    deductionType: 'رسم إداري' | 'شهر دراسي' | 'رسم تسجيل' | 'خدمة مستهلكة';
    description?: string;
    amount: number;
    percentage?: number;
    reason?: string;
    createdAt?: string;
}

// القسم الرابع عشر: طلبات الاسترداد (Refunds)
export interface Refund {
    id?: string;
    studentId: string;
    academicYearCode: string;
    requestDate: string;
    withdrawalDate?: string;
    status: 'معلق' | 'موافق عليه' | 'مرفوض' | 'مدفوع';
    totalPaid: number;
    totalRefundable?: number;
    totalDeductions: number;
    finalRefundAmount?: number;
    notes?: string;
    rejectionReason?: string;
    approverName?: string;
    approvalDate?: string;
    paymentDate?: string;
    paymentMethod?: string;
    bankAccountInfo?: string;
    receiptNumber?: string;
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
    deductions?: RefundDeduction[];
}