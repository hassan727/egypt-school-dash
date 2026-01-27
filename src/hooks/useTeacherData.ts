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
 * تم تحديثه لاستخدام جدول employees بدلاً من teachers
 */
export function useTeacherData(teacherId: string, academicYear?: string) {
    const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTeacherData = async () => {
        if (!teacherId) {
            setError('معرف المعلم غير محدد');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // جلب البيانات الأساسية للمعلم من جدول employees
            const { data: teacherData, error: teacherError } = await supabase
                .from('employees')
                .select('*')
                .eq('employee_id', teacherId)
                .maybeSingle();

            if (teacherError) {
                console.error('خطأ في جلب بيانات المعلم:', teacherError);
                throw teacherError;
            }

            if (!teacherData) {
                throw new Error('المعلم غير موجود في قاعدة البيانات');
            }

            // جلب بيانات الراتب الحالي من جدول salaries
            const selectedYear = academicYear || '2025-2026';
            const { data: salaryData } = await supabase
                .from('salaries')
                .select('*')
                .eq('employee_id', teacherData.id)
                .eq('academic_year_code', selectedYear)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            // جلب بنود الراتب
            const { data: salaryItemsData } = await supabase
                .from('salary_items')
                .select('*')
                .eq('salary_id', salaryData?.id || '')
                .order('created_at', { ascending: false });

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
                .eq('academic_year_code', selectedYear)
                .catch(() => ({ data: [] }));

            // جلب سجل الحضور من جدول employee_attendance
            const { data: attendanceData } = await supabase
                .from('employee_attendance')
                .select('*')
                .eq('employee_id', teacherData.id)
                .order('date', { ascending: false })
                .catch(() => ({ data: [] }));

            // جلب التدريب والشهادات والتقييمات من جداول المعلمين القديمة (إذا كانت موجودة)
            const { data: trainingData } = await supabase
                .from('teacher_training_courses')
                .select('*')
                .eq('teacher_id', teacherId)
                .order('start_date', { ascending: false })
                .catch(() => ({ data: [] }));

            const { data: certificationsData } = await supabase
                .from('teacher_certifications')
                .select('*')
                .eq('teacher_id', teacherId)
                .catch(() => ({ data: [] }));

            const { data: evaluationsData } = await supabase
                .from('teacher_evaluations')
                .select('*')
                .eq('teacher_id', teacherId)
                .order('evaluation_date', { ascending: false })
                .catch(() => ({ data: [] }));

            // تنظيم البيانات في هيكل TeacherProfile
            const details = teacherData.details || {};
            
            const profile: TeacherProfile = {
                id: teacherData.id,
                teacherId: teacherData.employee_id,
                createdAt: teacherData.created_at,
                updatedAt: teacherData.updated_at,

                personalData: {
                    teacherId: teacherData.employee_id,
                    fullNameAr: teacherData.full_name,
                    fullNameEn: details.fullNameEn || '',
                    nationalId: teacherData.national_id || '',
                    dateOfBirth: teacherData.birth_date || '',
                    placeOfBirth: details.placeOfBirth || '',
                    nationality: teacherData.nationality || 'مصري',
                    gender: teacherData.gender || 'ذكر',
                    religion: teacherData.religion || 'مسلم',
                    maritalStatus: teacherData.marital_status || 'أعزب',
                    numberOfDependents: details.numberOfDependents || 0,
                    phone: teacherData.phone || '',
                    phoneSecondary: details.phoneSecondary || '',
                    whatsappNumber: details.whatsappNumber || teacherData.phone || '',
                    email: teacherData.email || '',
                    address: teacherData.address || '',
                    city: details.city || '',
                    governorate: details.governorate || '',
                    postalCode: details.postalCode || '',
                    emergencyContactName: details.emergencyContactName || '',
                    emergencyContactRelation: details.emergencyContactRelation || '',
                    emergencyContactPhone: details.emergencyContactPhone || '',
                },

                employmentData: {
                    teacherId: teacherData.employee_id,
                    employeeNumber: teacherData.employee_id,
                    educationalRegistrationNumber: details.educationalRegistrationNumber || '',
                    hireDate: teacherData.hire_date || '',
                    contractStartDate: details.contractStartDate || teacherData.hire_date || '',
                    contractEndDate: details.contractEndDate || '',
                    contractType: teacherData.contract_type || 'دائم',
                    employmentStatus: teacherData.is_active ? 'نشط' : 'غير نشط',
                    highestQualification: details.highestQualification || '',
                    qualificationField: details.qualificationField || '',
                    qualificationUniversity: details.qualificationUniversity || '',
                    qualificationYear: details.qualificationYear,
                    teachingCertificate: details.teachingCertificate || '',
                    schoolBranch: details.schoolBranch || '',
                    department: teacherData.department || '',
                    jobTitle: teacherData.position || 'معلم',
                    specialization: details.specialization || '',
                    gradeLevelsTaught: details.gradeLevelsTaught || '',
                    administrativeNotes: teacherData.notes || '',
                },

                currentSalary: salaryData ? {
                    id: salaryData.id,
                    teacherId: teacherData.employee_id,
                    academicYearCode: salaryData.academic_year_code,
                    effectiveDate: salaryData.created_at?.split('T')[0] || '',
                    baseSalary: salaryData.base_salary || 0,
                    housingAllowance: 0,
                    transportationAllowance: 0,
                    mealAllowance: 0,
                    phoneAllowance: 0,
                    teachingLoadAllowance: 0,
                    specialAllowance: 0,
                    otherAllowances: 0,
                    socialInsurance: 0,
                    healthInsurance: 0,
                    incomeTax: 0,
                    loanDeduction: 0,
                    otherDeductions: 0,
                    totalAllowances: 0,
                    totalDeductions: salaryData.total_deductions || 0,
                    grossSalary: salaryData.base_salary || 0,
                    netSalary: salaryData.net_salary || 0,
                    bankName: teacherData.bank_name,
                    bankAccountNumber: teacherData.bank_account,
                    iban: '',
                    isActive: true,
                    notes: salaryData.notes || '',
                } : undefined,

                salaryPayments: (salaryItemsData || []).map((p: any) => ({
                    id: p.id,
                    teacherId: teacherData.employee_id,
                    salaryId: p.salary_id,
                    paymentMonth: '',
                    paymentYear: '',
                    paymentDate: p.created_at,
                    baseAmount: p.item_type === 'allowance' ? p.amount : 0,
                    allowancesAmount: p.item_type === 'allowance' ? p.amount : 0,
                    deductionsAmount: p.item_type === 'deduction' ? p.amount : 0,
                    bonusAmount: 0,
                    penaltyAmount: 0,
                    netAmount: 0,
                    paymentStatus: 'مستحق',
                    paymentMethod: '',
                    referenceNumber: '',
                    notes: p.notes || '',
                })),

                bonuses: [],

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

                trainingCourses: (trainingData || []).map((c: any) => ({
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

                disciplinaryRecords: [],
                achievements: [],
                attendanceRecords: (attendanceData || []).map((a: any) => ({
                    id: a.id,
                    teacherId: teacherData.employee_id,
                    date: a.date,
                    status: a.status,
                    checkInTime: a.check_in_time,
                    checkOutTime: a.check_out_time,
                    lateMinutes: a.late_minutes || 0,
                    earlyLeaveMinutes: a.early_leave_minutes || 0,
                    notes: a.notes,
                    attachmentUrl: '',
                })),
                leaveRequests: [],
                leaveBalance: undefined,
                notifications: [],
                auditTrail: [],
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

    const updatePersonalData = async (data: Partial<TeacherPersonalData>) => {
        try {
            if (!teacherProfile) throw new Error('لا توجد بيانات المعلم');

            const { error } = await supabase
                .from('employees')
                .update({
                    full_name: data.fullNameAr,
                    national_id: data.nationalId,
                    phone: data.phone,
                    email: data.email,
                    address: data.address,
                    gender: data.gender,
                    marital_status: data.maritalStatus,
                    nationality: data.nationality,
                    religion: data.religion,
                    birth_date: data.dateOfBirth,
                    details: {
                        ...teacherProfile.personalData,
                        ...data,
                    },
                    updated_at: new Date().toISOString(),
                })
                .eq('employee_id', teacherProfile.teacherId);

            if (error) throw error;

            await refreshTeacherData();
            return true;
        } catch (err) {
            console.error('خطأ في تحديث البيانات الشخصية:', err);
            throw err;
        }
    };

    const updateEmploymentData = async (data: Partial<TeacherEmploymentData>) => {
        try {
            if (!teacherProfile) throw new Error('لا توجد بيانات المعلم');

            const { error } = await supabase
                .from('employees')
                .update({
                    position: data.jobTitle,
                    department: data.department,
                    hire_date: data.hireDate,
                    contract_type: data.contractType,
                    notes: data.administrativeNotes,
                    details: {
                        ...teacherProfile.employmentData,
                        ...data,
                    },
                    updated_at: new Date().toISOString(),
                })
                .eq('employee_id', teacherProfile.teacherId);

            if (error) throw error;

            await refreshTeacherData();
            return true;
        } catch (err) {
            console.error('خطأ في تحديث البيانات الوظيفية:', err);
            throw err;
        }
    };

    const refreshTeacherData = async () => {
        await fetchTeacherData();
    };

    return {
        teacherProfile,
        loading,
        error,
        updatePersonalData,
        updateEmploymentData,
        refreshTeacherData,
    };
}
