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
    academicYear: string;
    stage: string;
    class: string;
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

// أنواع التقييمات
export type AssessmentType =
    | 'تقييم أسبوعي'
    | 'تقييم شهري'
    | 'امتحان شهري'
    | 'امتحان منتصف الفصل'
    | 'مشروع أو بحث'
    | 'امتحان نهاية الفصل'
    | 'تقييم سلوكي أو عملي';

// الدرجة الفردية
export interface Grade {
    id?: string;
    studentId?: string;
    subjectId?: string;
    subjectName: string;
    teacherName?: string; // اسم المعلم الذي أضاف الدرجة
    assessmentType: AssessmentType;
    month?: string; // للتقييمات الشهرية
    semester?: 'الترم الأول' | 'الترم الثاني'; // لامتحانات الترم
    originalGrade: number;
    finalGrade: number;
    gradeLevel?: 'ممتاز' | 'جيد جدًّا' | 'جيد' | 'مقبول' | 'ضعيف';
    teacherNotes?: string;
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
    oldValue?: number; // القيمة القديمة (عند التعديل)
    newValue?: number; // القيمة الجديدة
    timestamp: string; // وقت التعديل بالضبط
    notes?: string;
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
    transactionType: 'دفع' | 'استرجاع' | 'تعديل';
    amount: number;
    description: string;
    paymentMethod?: string;
    transactionDate: string;
    receiptNumber?: string;
    createdBy?: string;
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

// القسم الحادي عشر: سجل الحضور
export interface AttendanceRecord {
    id?: string;
    studentId?: string;
    date: string;
    status: 'حاضر' | 'غائب' | 'متأخر' | 'معذور';
    checkInTime?: string;
    checkOutTime?: string;
    notes?: string;
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
    administrativeData?: AdministrativeData;
    emergencyContacts: EmergencyContact[];
    schoolFees: SchoolFees;
    otherExpenses: OtherExpense[];
    academicRecords?: AcademicRecord[];
    behavioralRecords?: BehavioralRecord[];
    financialTransactions?: FinancialTransaction[];
    auditTrail?: AuditTrailEntry[];
    attendanceRecords?: AttendanceRecord[];
}