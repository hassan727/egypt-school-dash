/**
 * أنواع البيانات لنظام المعلمين
 * Teacher Profile System Types
 * مصمم بنفس معايير نظام بروفايل الطالب
 */

// =============================================
// القسم الأول: البيانات الشخصية
// =============================================
export interface TeacherPersonalData {
  id?: string;
  teacherId: string;
  fullNameAr: string;
  fullNameEn?: string;
  nationalId: string;
  dateOfBirth: string;
  placeOfBirth?: string;
  nationality: string;
  gender: 'ذكر' | 'أنثى';
  religion: string;
  maritalStatus: 'أعزب' | 'متزوج' | 'مطلق' | 'أرمل';
  numberOfDependents: number;

  // بيانات الاتصال
  phone: string;
  phoneSecondary?: string;
  whatsappNumber?: string;
  email?: string;
  address: string;
  city?: string;
  governorate?: string;
  postalCode?: string;

  // بيانات الطوارئ
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
}

// =============================================
// القسم الثاني: البيانات الوظيفية
// =============================================
export interface TeacherEmploymentData {
  id?: string;
  teacherId: string;
  employeeNumber: string;
  educationalRegistrationNumber?: string;
  hireDate: string;
  contractStartDate?: string;
  contractEndDate?: string;
  contractType: 'دائم' | 'مؤقت' | 'حر' | 'استشاري';
  employmentStatus: 'نشط' | 'إجازة' | 'موقوف' | 'مستقيل' | 'منتهي';

  // المؤهلات
  highestQualification: string;
  qualificationField: string;
  qualificationUniversity?: string;
  qualificationYear?: number;
  teachingCertificate?: string;

  // التعيين
  schoolBranch: string;
  department?: string;
  jobTitle: string;
  specialization: string;
  gradeLevelsTaught?: string;

  administrativeNotes?: string;
}

// =============================================
// القسم الثالث: الرواتب والبدلات
// =============================================
export interface TeacherSalary {
  id?: string;
  teacherId: string;
  academicYearCode: string;
  effectiveDate: string;

  // الراتب الأساسي
  baseSalary: number;

  // البدلات
  housingAllowance: number;
  transportationAllowance: number;
  mealAllowance: number;
  phoneAllowance: number;
  teachingLoadAllowance: number;
  specialAllowance: number;
  otherAllowances: number;

  // الاستقطاعات
  socialInsurance: number;
  healthInsurance: number;
  incomeTax: number;
  loanDeduction: number;
  otherDeductions: number;

  // الحسابات
  totalAllowances: number;
  totalDeductions: number;
  grossSalary: number;
  netSalary: number;

  // معلومات البنك
  bankName?: string;
  bankAccountNumber?: string;
  iban?: string;

  isActive: boolean;
  notes?: string;
}

export interface SalaryPayment {
  id?: string;
  teacherId: string;
  salaryId: string;
  paymentMonth: number;
  paymentYear: number;
  paymentDate?: string;

  baseAmount: number;
  allowancesAmount: number;
  deductionsAmount: number;
  bonusAmount: number;
  penaltyAmount: number;
  netAmount: number;

  paymentStatus: 'معلق' | 'مدفوع' | 'متأخر' | 'ملغي';
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
}

export interface TeacherBonus {
  id?: string;
  teacherId: string;
  bonusType: 'مكافأة أداء' | 'مكافأة سنوية' | 'حافز' | 'مكافأة مشروع' | 'أخرى';
  bonusDate: string;
  amount: number;
  reason?: string;
  paymentStatus: 'معلق' | 'مدفوع';
  paymentDate?: string;
  approvedBy?: string;
  approvalDate?: string;
}

// =============================================
// القسم الرابع: المهام التدريسية
// =============================================
export interface TeachingAssignment {
  id?: string;
  teacherId: string;
  academicYearCode: string;
  semesterId?: string;
  subjectId: string;
  subjectName?: string;
  classId: string;
  className?: string;
  stageName?: string;
  weeklyHours: number;
  isPrimaryTeacher: boolean;
  notes?: string;
}

export interface TrainingCourse {
  id?: string;
  teacherId: string;
  courseName: string;
  courseProvider?: string;
  courseType: 'داخلية' | 'خارجية' | 'أونلاين';
  startDate: string;
  endDate?: string;
  durationHours?: number;
  certificateObtained: boolean;
  certificateNumber?: string;
  certificateDate?: string;
  grade?: string;
  notes?: string;
}

export interface TeacherCertification {
  id?: string;
  teacherId: string;
  certificationName: string;
  issuingAuthority?: string;
  issueDate: string;
  expiryDate?: string;
  certificationNumber?: string;
  status: 'سارية' | 'منتهية' | 'قيد التجديد';
  notes?: string;
}

// =============================================
// القسم الخامس: التقييمات والسلوك
// =============================================
export interface TeacherEvaluation {
  id?: string;
  teacherId: string;
  academicYearCode: string;
  evaluationType: 'سنوي' | 'نصف سنوي' | 'شهري' | 'خاص';
  evaluationDate: string;

  // معايير التقييم
  teachingQualityScore: number;
  classroomManagementScore: number;
  studentEngagementScore: number;
  professionalDevelopmentScore: number;
  attendancePunctualityScore: number;
  teamworkScore: number;
  communicationScore: number;
  curriculumAdherenceScore: number;

  overallScore: number;
  overallRating: 'ممتاز' | 'جيد جدا' | 'جيد' | 'مقبول' | 'ضعيف';

  strengths?: string;
  areasForImprovement?: string;
  recommendations?: string;

  evaluatorName: string;
  evaluatorPosition?: string;

  teacherAcknowledgment: boolean;
  teacherComments?: string;

  status: 'مسودة' | 'نهائي' | 'معتمد';
}

export interface DisciplinaryRecord {
  id?: string;
  teacherId: string;
  recordType: 'ملاحظة' | 'تنبيه' | 'إنذار شفهي' | 'إنذار كتابي' | 'عقوبة';
  recordDate: string;
  violationType?: string;
  description: string;
  actionTaken?: string;
  penaltyType?: 'خصم' | 'إيقاف' | 'إنذار نهائي';
  penaltyAmount?: number;
  penaltyDays?: number;
  issuedBy: string;
  issuedDate: string;
  teacherResponse?: string;
  teacherAcknowledged: boolean;
  acknowledgmentDate?: string;
  status: 'نافذ' | 'منتهي' | 'ملغي' | 'قيد الطعن';
}

export interface TeacherAchievement {
  id?: string;
  teacherId: string;
  achievementType: 'جائزة' | 'شهادة تقدير' | 'إنجاز' | 'مشاركة متميزة';
  achievementDate: string;
  title: string;
  description?: string;
  awardedBy?: string;
  certificateNumber?: string;
  canBePublished: boolean;
  notes?: string;
}

// =============================================
// القسم السادس: الحضور والإجازات
// =============================================
export interface TeacherAttendanceRecord {
  id?: string;
  teacherId: string;
  date: string;
  status: 'حاضر' | 'غائب' | 'متأخر' | 'إجازة';
  checkInTime?: string;
  checkOutTime?: string;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  notes?: string;
  attachmentUrl?: string;
}

export interface LeaveRequest {
  id?: string;
  teacherId: string;
  leaveType: 'سنوية' | 'مرضية' | 'طارئة' | 'عارضة' | 'إداري' | 'بدون راتب' | 'أمومة' | 'أبوة';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  supportingDocuments?: string;
  substituteTeacherId?: string;
  substituteTeacherName?: string;
  status: 'معلق' | 'موافق عليه' | 'مرفوض' | 'ملغي';
  approvedBy?: string;
  approvalDate?: string;
  rejectionReason?: string;
  deductFromBalance: boolean;
}

export interface LeaveBalance {
  id?: string;
  teacherId: string;
  academicYearCode: string;

  annualLeaveBalance: number;
  sickLeaveBalance: number;
  emergencyLeaveBalance: number;
  casualLeaveBalance: number;

  annualLeaveUsed: number;
  sickLeaveUsed: number;
  emergencyLeaveUsed: number;
  casualLeaveUsed: number;

  // حسابي
  annualLeaveRemaining?: number;
  sickLeaveRemaining?: number;
  emergencyLeaveRemaining?: number;
  casualLeaveRemaining?: number;
}

// =============================================
// القسم السابع: الإشعارات
// =============================================
export interface TeacherNotification {
  id?: string;
  teacherId: string;
  notificationType: 'تحديث بيانات' | 'تذكير' | 'طلب' | 'إعلان' | 'تنبيه';
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  deliveryMethod: 'internal' | 'whatsapp' | 'email' | 'sms';
  deliveryStatus: 'pending' | 'sent' | 'delivered' | 'failed';
  deliveredAt?: string;
  isRead: boolean;
  readAt?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdBy?: string;
  createdAt: string;
}

// =============================================
// القسم الثامن: سجل التغييرات
// =============================================
export interface TeacherAuditTrail {
  id?: string;
  teacherId: string;
  changeType: string;
  changedFields: Record<string, any>;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changedBy: string;
  changeReason?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// =============================================
// البروفايل الكامل
// =============================================
export interface TeacherProfile {
  id: string;
  teacherId: string;
  createdAt: string;
  updatedAt: string;

  personalData: TeacherPersonalData;
  employmentData: TeacherEmploymentData;

  currentSalary?: TeacherSalary;
  salaryPayments: SalaryPayment[];
  bonuses: TeacherBonus[];

  teachingAssignments: TeachingAssignment[];
  trainingCourses: TrainingCourse[];
  certifications: TeacherCertification[];

  evaluations: TeacherEvaluation[];
  disciplinaryRecords: DisciplinaryRecord[];
  achievements: TeacherAchievement[];

  attendanceRecords: TeacherAttendanceRecord[];
  leaveRequests: LeaveRequest[];
  leaveBalance?: LeaveBalance;

  notifications: TeacherNotification[];
  auditTrail: TeacherAuditTrail[];
}

// =============================================
// ملخصات للعرض في Dashboard
// =============================================
export interface TeacherDashboardData {
  teacherId: string;
  fullNameAr: string;
  jobTitle: string;
  department?: string;
  employmentStatus: string;
  phone?: string;

  // ملخص مالي
  currentNetSalary?: number;
  lastPaymentDate?: string;
  lastPaymentStatus?: string;
  pendingBonuses?: number;

  // ملخص أكاديمي
  totalWeeklyHours?: number;
  totalClasses?: number;
  totalSubjects?: number;

  // ملخص الحضور
  attendanceRate?: number;
  absences?: number;
  lateCount?: number;
  remainingAnnualLeave?: number;

  // ملخص التقييم
  lastEvaluationRating?: string;
  lastEvaluationDate?: string;

  // إشعارات
  unreadNotifications?: number;
  recentNotifications?: TeacherNotification[];
}

// =============================================
// أنواع الفلترة والبحث
// =============================================
export interface TeacherSearchFilters {
  searchQuery?: string;
  department?: string;
  specialization?: string;
  employmentStatus?: string;
  contractType?: string;
  schoolBranch?: string;
  hireYearFrom?: number;
  hireYearTo?: number;
}

export interface TeacherListItem {
  teacherId: string;
  fullNameAr: string;
  phone?: string;
  email?: string;
  department?: string;
  jobTitle: string;
  specialization?: string;
  employmentStatus: string;
  hireDate: string;
  profileLink: string;
}
