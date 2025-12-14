import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    TeacherProfile,
    TeacherPersonalData,
    TeacherEmploymentData,
    TeacherSalary,
    TeachingAssignment,
    TeacherEvaluation,
    TeacherAttendanceRecord,
    LeaveRequest,
    LeaveBalance,
    TeacherNotification,
    TeacherAuditTrail,
    TrainingCourse,
    TeacherCertification,
    DisciplinaryRecord,
    TeacherAchievement,
    SalaryPayment,
    TeacherBonus
} from '@/types/teacher';

/**
 * Hook لجلب وتحديث بيانات المعلم من Supabase
 * يدعم جميع أقسام البيانات بنفس معايير useStudentData
 */
export function useTeacherData(teacherId: string, academicYear?: string) {
    const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // جلب بيانات المعلم الكاملة
    const fetchTeacherData = async () => {
        if (!teacherId) {
            setError('معرف المعلم غير محدد');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // جلب البيانات الأساسية للمعلم
            const { data: teacherData, error: teacherError } = await supabase
                .from('teachers')
                .select('*')
                .eq('teacher_id', teacherId)
                .maybeSingle();

            if (teacherError) {
                console.error('خطأ في جلب بيانات المعلم:', teacherError);
                throw teacherError;
            }

            if (!teacherData) {
                throw new Error('المعلم غير موجود في قاعدة البيانات');
            }

            // جلب بيانات الراتب الحالي
            const selectedYear = academicYear || '2025-2026';
            const { data: salaryData } = await supabase
                .from('teacher_salaries')
                .select('*')
                .eq('teacher_id', teacherId)
                .eq('is_active', true)
                .order('effective_date', { ascending: false })
                .limit(1)
                .maybeSingle();

            // جلب مدفوعات الرواتب
            const { data: paymentsData } = await supabase
                .from('teacher_salary_payments')
                .select('*')
                .eq('teacher_id', teacherId)
                .order('payment_year', { ascending: false })
                .order('payment_month', { ascending: false });

            // جلب المكافآت
            const { data: bonusesData } = await supabase
                .from('teacher_bonuses')
                .select('*')
                .eq('teacher_id', teacherId)
                .order('bonus_date', { ascending: false });

            // جلب المهام التدريسية
            const { data: assignmentsData } = await supabase
                .from('teaching_assignments')
                .select(`
          *,
          subjects:subject_id (subject_name_ar),
          classes:class_id (
            name,
            stages:stage_id (name)
          )
        `)
                .eq('teacher_id', teacherId)
                .eq('academic_year_code', selectedYear);

            // جلب الدورات التدريبية
            const { data: coursesData } = await supabase
                .from('teacher_training_courses')
                .select('*')
                .eq('teacher_id', teacherId)
                .order('start_date', { ascending: false });

            // جلب الشهادات المهنية
            const { data: certificationsData } = await supabase
                .from('teacher_certifications')
                .select('*')
                .eq('teacher_id', teacherId);

            // جلب التقييمات
            const { data: evaluationsData } = await supabase
                .from('teacher_evaluations')
                .select('*')
                .eq('teacher_id', teacherId)
                .order('evaluation_date', { ascending: false });

            // جلب السجل التأديبي
            const { data: disciplinaryData } = await supabase
                .from('teacher_disciplinary_records')
                .select('*')
                .eq('teacher_id', teacherId)
                .order('record_date', { ascending: false });

            // جلب الإنجازات
            const { data: achievementsData } = await supabase
                .from('teacher_achievements')
                .select('*')
                .eq('teacher_id', teacherId)
                .order('achievement_date', { ascending: false });

            // جلب سجل الحضور
            const { data: attendanceData } = await supabase
                .from('teacher_attendance_records')
                .select('*')
                .eq('teacher_id', teacherId)
                .order('date', { ascending: false });

            // جلب طلبات الإجازات
            const { data: leaveRequestsData } = await supabase
                .from('teacher_leave_requests')
                .select('*')
                .eq('teacher_id', teacherId)
                .order('start_date', { ascending: false });

            // جلب أرصدة الإجازات
            const { data: leaveBalanceData } = await supabase
                .from('teacher_leave_balances')
                .select('*')
                .eq('teacher_id', teacherId)
                .eq('academic_year_code', selectedYear)
                .maybeSingle();

            // جلب الإشعارات
            const { data: notificationsData } = await supabase
                .from('teacher_notifications')
                .select('*')
                .eq('teacher_id', teacherId)
                .order('created_at', { ascending: false })
                .limit(50);

            // جلب سجل التدقيق
            const { data: auditTrailData } = await supabase
                .from('teacher_audit_trail')
                .select('*')
                .eq('teacher_id', teacherId)
                .order('created_at', { ascending: false })
                .limit(100);

            // تنظيم البيانات في هيكل TeacherProfile
            const profile: TeacherProfile = {
                id: teacherData.id,
                teacherId: teacherData.teacher_id,
                createdAt: teacherData.created_at,
                updatedAt: teacherData.updated_at,

                personalData: {
                    teacherId: teacherData.teacher_id,
                    fullNameAr: teacherData.full_name_ar,
                    fullNameEn: teacherData.full_name_en,
                    nationalId: teacherData.national_id || '',
                    dateOfBirth: teacherData.date_of_birth || '',
                    placeOfBirth: teacherData.place_of_birth,
                    nationality: teacherData.nationality || 'مصري',
                    gender: teacherData.gender || 'ذكر',
                    religion: teacherData.religion || 'مسلم',
                    maritalStatus: teacherData.marital_status || 'أعزب',
                    numberOfDependents: teacherData.number_of_dependents || 0,
                    phone: teacherData.phone || '',
                    phoneSecondary: teacherData.phone_secondary,
                    whatsappNumber: teacherData.whatsapp_number,
                    email: teacherData.email,
                    address: teacherData.address || '',
                    city: teacherData.city,
                    governorate: teacherData.governorate,
                    postalCode: teacherData.postal_code,
                    emergencyContactName: teacherData.emergency_contact_name,
                    emergencyContactRelation: teacherData.emergency_contact_relation,
                    emergencyContactPhone: teacherData.emergency_contact_phone,
                },

                employmentData: {
                    teacherId: teacherData.teacher_id,
                    employeeNumber: teacherData.employee_number || '',
                    educationalRegistrationNumber: teacherData.educational_registration_number,
                    hireDate: teacherData.hire_date || '',
                    contractStartDate: teacherData.contract_start_date,
                    contractEndDate: teacherData.contract_end_date,
                    contractType: teacherData.contract_type || 'دائم',
                    employmentStatus: teacherData.employment_status || 'نشط',
                    highestQualification: teacherData.highest_qualification || '',
                    qualificationField: teacherData.qualification_field || '',
                    qualificationUniversity: teacherData.qualification_university,
                    qualificationYear: teacherData.qualification_year,
                    teachingCertificate: teacherData.teaching_certificate,
                    schoolBranch: teacherData.school_branch || '',
                    department: teacherData.department,
                    jobTitle: teacherData.job_title || 'معلم',
                    specialization: teacherData.specialization || '',
                    gradeLevelsTaught: teacherData.grade_levels_taught,
                    administrativeNotes: teacherData.administrative_notes,
                },

                currentSalary: salaryData ? {
                    id: salaryData.id,
                    teacherId: salaryData.teacher_id,
                    academicYearCode: salaryData.academic_year_code,
                    effectiveDate: salaryData.effective_date,
                    baseSalary: salaryData.base_salary || 0,
                    housingAllowance: salaryData.housing_allowance || 0,
                    transportationAllowance: salaryData.transportation_allowance || 0,
                    mealAllowance: salaryData.meal_allowance || 0,
                    phoneAllowance: salaryData.phone_allowance || 0,
                    teachingLoadAllowance: salaryData.teaching_load_allowance || 0,
                    specialAllowance: salaryData.special_allowance || 0,
                    otherAllowances: salaryData.other_allowances || 0,
                    socialInsurance: salaryData.social_insurance || 0,
                    healthInsurance: salaryData.health_insurance || 0,
                    incomeTax: salaryData.income_tax || 0,
                    loanDeduction: salaryData.loan_deduction || 0,
                    otherDeductions: salaryData.other_deductions || 0,
                    totalAllowances: salaryData.total_allowances || 0,
                    totalDeductions: salaryData.total_deductions || 0,
                    grossSalary: salaryData.gross_salary || 0,
                    netSalary: salaryData.net_salary || 0,
                    bankName: salaryData.bank_name,
                    bankAccountNumber: salaryData.bank_account_number,
                    iban: salaryData.iban,
                    isActive: salaryData.is_active,
                    notes: salaryData.notes,
                } : undefined,

                salaryPayments: (paymentsData || []).map((p: any) => ({
                    id: p.id,
                    teacherId: p.teacher_id,
                    salaryId: p.salary_id,
                    paymentMonth: p.payment_month,
                    paymentYear: p.payment_year,
                    paymentDate: p.payment_date,
                    baseAmount: p.base_amount,
                    allowancesAmount: p.allowances_amount,
                    deductionsAmount: p.deductions_amount,
                    bonusAmount: p.bonus_amount,
                    penaltyAmount: p.penalty_amount,
                    netAmount: p.net_amount,
                    paymentStatus: p.payment_status,
                    paymentMethod: p.payment_method,
                    referenceNumber: p.reference_number,
                    notes: p.notes,
                })),

                bonuses: (bonusesData || []).map((b: any) => ({
                    id: b.id,
                    teacherId: b.teacher_id,
                    bonusType: b.bonus_type,
                    bonusDate: b.bonus_date,
                    amount: b.amount,
                    reason: b.reason,
                    paymentStatus: b.payment_status,
                    paymentDate: b.payment_date,
                    approvedBy: b.approved_by,
                    approvalDate: b.approval_date,
                })),

                teachingAssignments: (assignmentsData || []).map((a: any) => ({
                    id: a.id,
                    teacherId: a.teacher_id,
                    academicYearCode: a.academic_year_code,
                    semesterId: a.semester_id,
                    subjectId: a.subject_id,
                    subjectName: a.subjects?.subject_name_ar,
                    classId: a.class_id,
                    className: a.classes?.name,
                    stageName: a.classes?.stages?.name,
                    weeklyHours: a.weekly_hours,
                    isPrimaryTeacher: a.is_primary_teacher,
                    notes: a.notes,
                })),

                trainingCourses: (coursesData || []).map((c: any) => ({
                    id: c.id,
                    teacherId: c.teacher_id,
                    courseName: c.course_name,
                    courseProvider: c.course_provider,
                    courseType: c.course_type,
                    startDate: c.start_date,
                    endDate: c.end_date,
                    durationHours: c.duration_hours,
                    certificateObtained: c.certificate_obtained,
                    certificateNumber: c.certificate_number,
                    certificateDate: c.certificate_date,
                    grade: c.grade,
                    notes: c.notes,
                })),

                certifications: (certificationsData || []).map((c: any) => ({
                    id: c.id,
                    teacherId: c.teacher_id,
                    certificationName: c.certification_name,
                    issuingAuthority: c.issuing_authority,
                    issueDate: c.issue_date,
                    expiryDate: c.expiry_date,
                    certificationNumber: c.certification_number,
                    status: c.status,
                    notes: c.notes,
                })),

                evaluations: (evaluationsData || []).map((e: any) => ({
                    id: e.id,
                    teacherId: e.teacher_id,
                    academicYearCode: e.academic_year_code,
                    evaluationType: e.evaluation_type,
                    evaluationDate: e.evaluation_date,
                    teachingQualityScore: e.teaching_quality_score,
                    classroomManagementScore: e.classroom_management_score,
                    studentEngagementScore: e.student_engagement_score,
                    professionalDevelopmentScore: e.professional_development_score,
                    attendancePunctualityScore: e.attendance_punctuality_score,
                    teamworkScore: e.teamwork_score,
                    communicationScore: e.communication_score,
                    curriculumAdherenceScore: e.curriculum_adherence_score,
                    overallScore: e.overall_score,
                    overallRating: e.overall_rating,
                    strengths: e.strengths,
                    areasForImprovement: e.areas_for_improvement,
                    recommendations: e.recommendations,
                    evaluatorName: e.evaluator_name,
                    evaluatorPosition: e.evaluator_position,
                    teacherAcknowledgment: e.teacher_acknowledgment,
                    teacherComments: e.teacher_comments,
                    status: e.status,
                })),

                disciplinaryRecords: (disciplinaryData || []).map((d: any) => ({
                    id: d.id,
                    teacherId: d.teacher_id,
                    recordType: d.record_type,
                    recordDate: d.record_date,
                    violationType: d.violation_type,
                    description: d.description,
                    actionTaken: d.action_taken,
                    penaltyType: d.penalty_type,
                    penaltyAmount: d.penalty_amount,
                    penaltyDays: d.penalty_days,
                    issuedBy: d.issued_by,
                    issuedDate: d.issued_date,
                    teacherResponse: d.teacher_response,
                    teacherAcknowledged: d.teacher_acknowledged,
                    acknowledgmentDate: d.acknowledgment_date,
                    status: d.status,
                })),

                achievements: (achievementsData || []).map((a: any) => ({
                    id: a.id,
                    teacherId: a.teacher_id,
                    achievementType: a.achievement_type,
                    achievementDate: a.achievement_date,
                    title: a.title,
                    description: a.description,
                    awardedBy: a.awarded_by,
                    certificateNumber: a.certificate_number,
                    canBePublished: a.can_be_published,
                    notes: a.notes,
                })),

                attendanceRecords: (attendanceData || []).map((a: any) => ({
                    id: a.id,
                    teacherId: a.teacher_id,
                    date: a.date,
                    status: a.status,
                    checkInTime: a.check_in_time,
                    checkOutTime: a.check_out_time,
                    lateMinutes: a.late_minutes || 0,
                    earlyLeaveMinutes: a.early_leave_minutes || 0,
                    notes: a.notes,
                    attachmentUrl: a.attachment_url,
                })),

                leaveRequests: (leaveRequestsData || []).map((l: any) => ({
                    id: l.id,
                    teacherId: l.teacher_id,
                    leaveType: l.leave_type,
                    startDate: l.start_date,
                    endDate: l.end_date,
                    totalDays: l.total_days,
                    reason: l.reason,
                    supportingDocuments: l.supporting_documents,
                    substituteTeacherId: l.substitute_teacher_id,
                    status: l.status,
                    approvedBy: l.approved_by,
                    approvalDate: l.approval_date,
                    rejectionReason: l.rejection_reason,
                    deductFromBalance: l.deduct_from_balance,
                })),

                leaveBalance: leaveBalanceData ? {
                    id: leaveBalanceData.id,
                    teacherId: leaveBalanceData.teacher_id,
                    academicYearCode: leaveBalanceData.academic_year_code,
                    annualLeaveBalance: leaveBalanceData.annual_leave_balance,
                    sickLeaveBalance: leaveBalanceData.sick_leave_balance,
                    emergencyLeaveBalance: leaveBalanceData.emergency_leave_balance,
                    casualLeaveBalance: leaveBalanceData.casual_leave_balance,
                    annualLeaveUsed: leaveBalanceData.annual_leave_used,
                    sickLeaveUsed: leaveBalanceData.sick_leave_used,
                    emergencyLeaveUsed: leaveBalanceData.emergency_leave_used,
                    casualLeaveUsed: leaveBalanceData.casual_leave_used,
                    annualLeaveRemaining: leaveBalanceData.annual_leave_balance - leaveBalanceData.annual_leave_used,
                    sickLeaveRemaining: leaveBalanceData.sick_leave_balance - leaveBalanceData.sick_leave_used,
                    emergencyLeaveRemaining: leaveBalanceData.emergency_leave_balance - leaveBalanceData.emergency_leave_used,
                    casualLeaveRemaining: leaveBalanceData.casual_leave_balance - leaveBalanceData.casual_leave_used,
                } : undefined,

                notifications: (notificationsData || []).map((n: any) => ({
                    id: n.id,
                    teacherId: n.teacher_id,
                    notificationType: n.notification_type,
                    title: n.title,
                    content: n.content,
                    priority: n.priority,
                    deliveryMethod: n.delivery_method,
                    deliveryStatus: n.delivery_status,
                    deliveredAt: n.delivered_at,
                    isRead: n.is_read,
                    readAt: n.read_at,
                    relatedEntityType: n.related_entity_type,
                    relatedEntityId: n.related_entity_id,
                    createdBy: n.created_by,
                    createdAt: n.created_at,
                })),

                auditTrail: (auditTrailData || []).map((a: any) => ({
                    id: a.id,
                    teacherId: a.teacher_id,
                    changeType: a.change_type,
                    changedFields: a.changed_fields,
                    oldValues: a.old_values,
                    newValues: a.new_values,
                    changedBy: a.changed_by,
                    changeReason: a.change_reason,
                    ipAddress: a.ip_address,
                    userAgent: a.user_agent,
                    createdAt: a.created_at,
                })),
            };

            setTeacherProfile(profile);
        } catch (err) {
            console.error('خطأ في جلب البيانات:', err);
            setError(err instanceof Error ? err.message : 'فشل في جلب بيانات المعلم');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (teacherId) {
            fetchTeacherData();
        }
    }, [teacherId, academicYear]);

    // حفظ سجل التدقيق
    const saveAuditTrail = async (changeType: string, oldData: any, newData: any, reason?: string) => {
        if (!teacherId) return;

        try {
            const { error } = await supabase
                .from('teacher_audit_trail')
                .insert({
                    teacher_id: teacherId,
                    change_type: changeType,
                    changed_fields: { old: oldData, new: newData },
                    old_values: oldData,
                    new_values: newData,
                    changed_by: 'current_user',
                    change_reason: reason,
                    created_at: new Date().toISOString()
                });

            if (error) throw error;
        } catch (err) {
            console.error('Error saving audit trail:', err);
        }
    };

    // تحديث البيانات الشخصية
    const updatePersonalData = async (data: Partial<TeacherPersonalData>) => {
        try {
            const currentData = teacherProfile?.personalData;

            const { error } = await supabase
                .from('teachers')
                .update({
                    full_name_ar: data.fullNameAr,
                    full_name_en: data.fullNameEn,
                    national_id: data.nationalId,
                    date_of_birth: data.dateOfBirth,
                    place_of_birth: data.placeOfBirth,
                    nationality: data.nationality,
                    gender: data.gender,
                    religion: data.religion,
                    marital_status: data.maritalStatus,
                    number_of_dependents: data.numberOfDependents,
                    phone: data.phone,
                    phone_secondary: data.phoneSecondary,
                    whatsapp_number: data.whatsappNumber,
                    email: data.email,
                    address: data.address,
                    city: data.city,
                    governorate: data.governorate,
                    postal_code: data.postalCode,
                    emergency_contact_name: data.emergencyContactName,
                    emergency_contact_relation: data.emergencyContactRelation,
                    emergency_contact_phone: data.emergencyContactPhone,
                    updated_at: new Date().toISOString(),
                })
                .eq('teacher_id', teacherId);

            if (error) throw error;

            await saveAuditTrail('Personal Data', currentData, data);
            await refreshTeacherData();
            return true;
        } catch (err) {
            console.error('خطأ في تحديث البيانات الشخصية:', err);
            throw err;
        }
    };

    // تحديث البيانات الوظيفية
    const updateEmploymentData = async (data: Partial<TeacherEmploymentData>) => {
        try {
            const currentData = teacherProfile?.employmentData;

            const { error } = await supabase
                .from('teachers')
                .update({
                    employee_number: data.employeeNumber,
                    educational_registration_number: data.educationalRegistrationNumber,
                    hire_date: data.hireDate,
                    contract_start_date: data.contractStartDate,
                    contract_end_date: data.contractEndDate,
                    contract_type: data.contractType,
                    employment_status: data.employmentStatus,
                    highest_qualification: data.highestQualification,
                    qualification_field: data.qualificationField,
                    qualification_university: data.qualificationUniversity,
                    qualification_year: data.qualificationYear,
                    teaching_certificate: data.teachingCertificate,
                    school_branch: data.schoolBranch,
                    department: data.department,
                    job_title: data.jobTitle,
                    specialization: data.specialization,
                    grade_levels_taught: data.gradeLevelsTaught,
                    administrative_notes: data.administrativeNotes,
                    updated_at: new Date().toISOString(),
                })
                .eq('teacher_id', teacherId);

            if (error) throw error;

            await saveAuditTrail('Employment Data', currentData, data);
            await refreshTeacherData();
            return true;
        } catch (err) {
            console.error('خطأ في تحديث البيانات الوظيفية:', err);
            throw err;
        }
    };

    // تحديث سجل الحضور
    const updateAttendanceRecord = async (date: string, data: Partial<TeacherAttendanceRecord>) => {
        try {
            const existingRecord = teacherProfile?.attendanceRecords.find(r => r.date === date);

            if (existingRecord) {
                const { error } = await supabase
                    .from('teacher_attendance_records')
                    .update({
                        status: data.status,
                        check_in_time: data.checkInTime,
                        check_out_time: data.checkOutTime,
                        late_minutes: data.lateMinutes,
                        early_leave_minutes: data.earlyLeaveMinutes,
                        notes: data.notes,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('teacher_id', teacherId)
                    .eq('date', date);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('teacher_attendance_records')
                    .insert({
                        teacher_id: teacherId,
                        date,
                        status: data.status,
                        check_in_time: data.checkInTime,
                        check_out_time: data.checkOutTime,
                        late_minutes: data.lateMinutes || 0,
                        early_leave_minutes: data.earlyLeaveMinutes || 0,
                        notes: data.notes,
                    });

                if (error) throw error;
            }

            await saveAuditTrail('Attendance', existingRecord, data);
            await refreshTeacherData();
            return true;
        } catch (err) {
            console.error('خطأ في تحديث سجل الحضور:', err);
            throw err;
        }
    };

    // إنشاء طلب إجازة
    const createLeaveRequest = async (data: Partial<LeaveRequest>) => {
        try {
            const { error } = await supabase
                .from('teacher_leave_requests')
                .insert({
                    teacher_id: teacherId,
                    leave_type: data.leaveType,
                    start_date: data.startDate,
                    end_date: data.endDate,
                    total_days: data.totalDays,
                    reason: data.reason,
                    supporting_documents: data.supportingDocuments,
                    substitute_teacher_id: data.substituteTeacherId,
                    status: 'معلق',
                    deduct_from_balance: data.deductFromBalance ?? true,
                });

            if (error) throw error;

            await saveAuditTrail('Leave Request', null, data);
            await refreshTeacherData();
            return true;
        } catch (err) {
            console.error('خطأ في إنشاء طلب الإجازة:', err);
            throw err;
        }
    };

    // إضافة إشعار
    const sendNotification = async (data: Partial<TeacherNotification>) => {
        try {
            const { error } = await supabase
                .from('teacher_notifications')
                .insert({
                    teacher_id: teacherId,
                    notification_type: data.notificationType,
                    title: data.title,
                    content: data.content,
                    priority: data.priority || 'normal',
                    delivery_method: data.deliveryMethod || 'internal',
                    delivery_status: 'pending',
                    created_by: 'current_user',
                });

            if (error) throw error;
            await refreshTeacherData();
            return true;
        } catch (err) {
            console.error('خطأ في إرسال الإشعار:', err);
            throw err;
        }
    };

    // تحديث البيانات
    const refreshTeacherData = async () => {
        await fetchTeacherData();
    };

    return {
        teacherProfile,
        loading,
        error,
        updatePersonalData,
        updateEmploymentData,
        updateAttendanceRecord,
        createLeaveRequest,
        sendNotification,
        saveAuditTrail,
        refreshTeacherData,
    };
}
