import { supabase } from '@/lib/supabase';
import { StudentProfile, PersonalData, EnrollmentData, GuardianData, MotherData, AdministrativeData, EmergencyContact, SchoolFees, OtherExpense, BehavioralRecord, AcademicRecord, AuditTrailEntry, Refund, RefundDeduction, FeeType } from '@/types/student';

export class StudentService {
    // جلب طالب واحد
    static async getStudent(studentId: string) {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('student_id', studentId)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    // جلب قائمة الطلاب مع الفلترة
    static async listStudents(options?: {
        stage?: string;
        class?: string;
        limit?: number;
        offset?: number;
    }) {
        let query = supabase.from('students').select('*', { count: 'exact' });

        if (options?.stage) {
            query = query.eq('stage', options.stage);
        }
        if (options?.class) {
            query = query.eq('class', options.class);
        }

        query = query.order('full_name_ar', { ascending: true });

        if (options?.limit) {
            const offset = options?.offset || 0;
            query = query.range(offset, offset + options.limit - 1);
        }

        const { data, count, error } = await query;

        if (error) throw error;
        return { data, total: count || 0 };
    }

    // البحث عن الطلاب
    static async searchStudents(searchTerm: string) {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .or(
                `full_name_ar.ilike.%${searchTerm}%,student_id.ilike.%${searchTerm}%`
            )
            .limit(50);

        if (error) throw error;
        return data;
    }

    // إنشاء طالب جديد
    static async createStudent(data: Partial<StudentProfile>) {
        const { error } = await supabase
            .from('students')
            .insert([{
                student_id: data.studentId,
                full_name_ar: data.personalData?.fullNameAr,
                national_id: data.personalData?.nationalId,
                date_of_birth: data.personalData?.dateOfBirth,
                gender: data.personalData?.gender,
                stage: data.enrollmentData?.stage,
                class: data.enrollmentData?.class,
            }]);

        if (error) throw error;
        return true;
    }

    // تحديث معلومات الطالب الشخصية
    static async updatePersonalData(studentId: string, data: Partial<PersonalData>) {
        const { error } = await supabase
            .from('students')
            .update({
                full_name_ar: data.fullNameAr,
                national_id: data.nationalId,
                date_of_birth: data.dateOfBirth,
                place_of_birth: data.placeOfBirth,
                nationality: data.nationality,
                gender: data.gender,
                religion: data.religion,
                special_needs: data.specialNeeds,
            })
            .eq('student_id', studentId);

        if (error) throw error;
        return true;
    }

    // تحديث بيانات القيد الدراسي
    static async updateEnrollmentData(studentId: string, data: Partial<EnrollmentData>) {
        const { error } = await supabase
            .from('students')
            .update({
                academic_year: data.academicYear,
                stage: data.stage,
                class: data.class,
                enrollment_type: data.enrollmentType,
                enrollment_date: data.enrollmentDate,
                previous_school: data.previousSchool,
                transfer_reason: data.transferReason,
                previous_level: data.previousLevel,
                second_language: data.secondLanguage,
                curriculum_type: data.curriculumType,
                has_repeated: data.hasRepeated,
                order_among_siblings: data.orderAmongSiblings,
                is_regular: data.isRegular,
            })
            .eq('student_id', studentId);

        if (error) throw error;
        return true;
    }

    // تحديث بيانات ولي الأمر
    static async updateGuardianData(studentId: string, data: Partial<GuardianData>) {
        const { error } = await supabase
            .from('students')
            .update({
                guardian_full_name: data.fullName,
                guardian_relationship: data.relationship,
                guardian_national_id: data.nationalId,
                guardian_job: data.job,
                guardian_workplace: data.workplace,
                guardian_education_level: data.educationLevel,
                guardian_phone: data.phone,
                guardian_whatsapp: data.whatsappNumber,
                guardian_nationality: data.nationality,
                guardian_email: data.email,
                guardian_address: data.address,
                guardian_marital_status: data.maritalStatus,
                has_legal_guardian: data.hasLegalGuardian,
                guardian_social_media: data.socialMedia,
            })
            .eq('student_id', studentId);

        if (error) throw error;
        return true;
    }

    // تحديث بيانات الأم
    static async updateMotherData(studentId: string, data: Partial<MotherData>) {
        const { error } = await supabase
            .from('students')
            .update({
                mother_full_name: data.fullName,
                mother_national_id: data.nationalId,
                mother_job: data.job,
                mother_workplace: data.workplace,
                mother_phone: data.phone,
                mother_whatsapp: data.whatsappNumber,
                mother_nationality: data.nationality,
                mother_email: data.email,
                mother_education_level: data.educationLevel,
                mother_address: data.address,
                mother_relationship: data.relationship,
            })
            .eq('student_id', studentId);

        if (error) throw error;
        return true;
    }

    // تحديث البيانات الإدارية
    static async updateAdministrativeData(studentId: string, data: Partial<AdministrativeData>) {
        const { error } = await supabase
            .from('students')
            .update({
                admission_date: data.admissionDate,
                student_id_number: data.studentIdNumber,
                file_status: data.fileStatus,
                info_update_date: data.infoUpdateDate,
                transportation_status: data.transportationStatus,
                bus_number: data.busNumber,
                pickup_point: data.pickupPoint,
                school_documents_complete: data.schoolDocumentsComplete,
                documents_notes: data.documentsNotes,
                health_insurance: data.healthInsurance,
                health_insurance_number: data.healthInsuranceNumber,
                administrative_notes: data.administrativeNotes,
                emergency_contact_updated: data.emergencyContactUpdated,
            })
            .eq('student_id', studentId);

        if (error) throw error;
        return true;
    }

    // إضافة جهة اتصال طوارئ
    static async addEmergencyContact(studentId: string, contact: EmergencyContact) {
        const { error } = await supabase
            .from('emergency_contacts')
            .insert([{
                student_id: studentId,
                contact_name: contact.contactName,
                relationship: contact.relationship,
                phone: contact.phone,
                address: contact.address,
            }]);

        if (error) throw error;
        return true;
    }

    // تحديث المصروفات الدراسية
    static async updateSchoolFees(studentId: string, fees: Partial<SchoolFees>) {
        const { error } = await supabase
            .from('school_fees')
            .upsert({
                student_id: studentId,
                total_amount: fees.totalAmount,
                installment_count: fees.installmentCount,
                advance_payment: fees.advancePayment,
            });

        if (error) throw error;
        return true;
    }

    // إضافة مصرف آخر
    static async addOtherExpense(studentId: string, expense: OtherExpense) {
        const { error } = await supabase
            .from('other_expenses')
            .insert([{
                student_id: studentId,
                expense_type: expense.expenseType,
                quantity: expense.quantity || 1,
                total_price: expense.totalPrice,
                date: expense.date,
            }]);

        if (error) throw error;
        return true;
    }

    // تحديث البيانات الأكاديمية
    static async updateAcademicData(studentId: string, academic: AcademicRecord) {
        const { error } = await supabase
            .from('academic_records')
            .upsert({
                student_id: studentId,
                current_gpa: academic.currentGPA,
                total_marks: academic.totalMarks,
                average_marks: academic.averageMarks,
                passing_status: academic.passingStatus,
                academic_notes: academic.academicNotes,
                strengths: academic.strengths,
                weaknesses: academic.weaknesses,
                last_exam_date: academic.lastExamDate,
            });

        if (error) throw error;
        return true;
    }

    // تحديث البيانات السلوكية
    static async updateBehavioralData(studentId: string, behavioral: Partial<BehavioralRecord>) {
        const { error } = await supabase
            .from('behavioral_records')
            .upsert({
                student_id: studentId,
                conduct_rating: behavioral.conductRating,
                attendance_rate: behavioral.attendanceRate,
                absences: behavioral.absences,
                tardiness: behavioral.tardiness,
                disciplinary_issues: behavioral.disciplinaryIssues,
                disciplinary_details: behavioral.disciplinaryDetails || '',
                participation_level: behavioral.participationLevel,
                classroom_behavior: behavioral.classroomBehavior || '',
                social_interaction: behavioral.socialInteraction || '',
                counselor_notes: behavioral.counselorNotes || '',
                last_incident_date: behavioral.lastIncidentDate,
            });

        if (error) throw error;
        return true;
    }

    // جلب سجل التدقيق
    static async getAuditTrail(studentId: string) {
        const { data, error } = await supabase
            .from('student_audit_trail')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    // إضافة سجل تدقيق جديد
    static async addAuditTrail(studentId: string, entry: Partial<AuditTrailEntry>) {
        const { error } = await supabase
            .from('student_audit_trail')
            .insert([{
                student_id: studentId,
                change_type: entry.changeType,
                changed_fields: entry.changedFields,
                changed_by: entry.changedBy,
                change_reason: entry.changeReason,
            }]);

        if (error) throw error;
        return true;
    }

    // حذف طالب
    static async deleteStudent(studentId: string) {
        const { error } = await supabase
            .from('students')
            .delete()
            .eq('student_id', studentId);

        if (error) throw error;
        return true;
    }

    // جلب إحصائيات الطالب
    static async getStudentStats(studentId: string) {
        try {
            // عدد أيام الحضور والغياب
            const { data: attendanceData } = await supabase
                .from('attendance_records')
                .select('status')
                .eq('student_id', studentId);

            const attendanceStats = {
                present: attendanceData?.filter(r => r.status === 'حاضر').length || 0,
                absent: attendanceData?.filter(r => r.status === 'غائب').length || 0,
                late: attendanceData?.filter(r => r.status === 'متأخر').length || 0,
                excused: attendanceData?.filter(r => r.status === 'معذور').length || 0,
            };

            // البيانات المالية
            const { data: feesData } = await supabase
                .from('school_fees')
                .select('*')
                .eq('student_id', studentId)
                .maybeSingle();

            const { data: transactionsData } = await supabase
                .from('financial_transactions')
                .select('amount')
                .eq('student_id', studentId);

            const totalPaid = transactionsData?.reduce((sum, t) => sum + t.amount, 0) || 0;
            const totalDue = feesData?.total_amount || 0;
            const remaining = totalDue - totalPaid;

            return {
                attendance: attendanceStats,
                financial: {
                    totalDue,
                    totalPaid,
                    remaining,
                },
            };
        } catch (err) {
            console.error('خطأ في جلب إحصائيات الطالب:', err);
            throw err;
        }
    }

    // عمليات جماعية على الطلاب
    static async bulkUpdateStudents(studentIds: string[], updates: Record<string, any>) {
        try {
            const { error } = await supabase
                .from('students')
                .update(updates)
                .in('student_id', studentIds);

            if (error) throw error;
            return true;
        } catch (err) {
            console.error('خطأ في تحديث الطلاب:', err);
            throw err;
        }
    }

    // حذف جماعي للطلاب
    static async bulkDeleteStudents(studentIds: string[]) {
        try {
            const { error } = await supabase
                .from('students')
                .delete()
                .in('student_id', studentIds);

            if (error) throw error;
            return true;
        } catch (err) {
            console.error('خطأ في حذف الطلاب:', err);
            throw err;
        }
    }

    // جلب الإحصائيات العامة للنظام
    static async getSystemStats() {
        try {
            // إجمالي الطلاب
            const { count: totalStudents } = await supabase
                .from('students')
                .select('*', { count: 'exact' });

            // الطلاب النشطين
            const { count: activeStudents } = await supabase
                .from('students')
                .select('*', { count: 'exact' })
                .eq('file_status', 'نشط');

            // المستحقات المالية
            const { data: fees } = await supabase
                .from('school_fees')
                .select('total_amount');

            const totalDue = fees?.reduce((sum, f) => sum + (f.total_amount || 0), 0) || 0;

            // الطلاب بحضور منخفض (أقل من 80%)
            const { data: attendanceData } = await supabase
                .from('attendance_records')
                .select('student_id, status')
                .eq('status', 'غائب');

            const lowAttendanceStudents = new Set(
                attendanceData?.map(r => r.student_id)
            ).size;

            return {
                totalStudents: totalStudents || 0,
                activeStudents: activeStudents || 0,
                totalDue,
                lowAttendanceStudents,
                inactiveStudents: (totalStudents || 0) - (activeStudents || 0),
            };
        } catch (err) {
            console.error('خطأ في جلب إحصائيات النظام:', err);
            throw err;
        }
    }

    // تصدير بيانات الطلاب
    static async exportStudentsData(filters?: {
        stage?: string;
        class?: string;
        fileStatus?: string;
    }) {
        try {
            let query = supabase.from('students').select('*');

            if (filters?.stage) query = query.eq('stage', filters.stage);
            if (filters?.class) query = query.eq('class', filters.class);
            if (filters?.fileStatus) query = query.eq('file_status', filters.fileStatus);

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('خطأ في تصدير البيانات:', err);
            throw err;
        }
    }

    // استيراد بيانات الطلاب
    static async importStudentsData(studentsData: any[]) {
        try {
            const { error } = await supabase
                .from('students')
                .insert(studentsData);

            if (error) throw error;
            return true;
        } catch (err) {
            console.error('خطأ في استيراد البيانات:', err);
            throw err;
        }
    }

    // البحث المتقدم
    static async advancedSearch(criteria: {
        searchTerm?: string;
        stage?: string;
        class?: string;
        gender?: string;
        enrollmentType?: string;
        fileStatus?: string;
    }) {
        try {
            let query = supabase.from('students').select('*');

            if (criteria.searchTerm) {
                query = query.or(
                    `full_name_ar.ilike.%${criteria.searchTerm}%,student_id.ilike.%${criteria.searchTerm}%`
                );
            }

            if (criteria.stage) query = query.eq('stage', criteria.stage);
            if (criteria.class) query = query.eq('class', criteria.class);
            if (criteria.gender) query = query.eq('gender', criteria.gender);
            if (criteria.enrollmentType) query = query.eq('enrollment_type', criteria.enrollmentType);
            if (criteria.fileStatus) query = query.eq('file_status', criteria.fileStatus);

            const { data, error } = await query.order('full_name_ar', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('خطأ في البحث:', err);
            throw err;
        }
    }

    // جلب الدرجات لطالب معين
    static async getStudentGrades(studentId: string) {
        try {
            const { data, error } = await supabase
                .from('grades')
                .select('*')
                .eq('student_id', studentId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('خطأ في جلب الدرجات:', err);
            throw err;
        }
    }

    // إضافة درجة جديدة لطالب
    static async addStudentGrade(studentId: string, grade: any) {
        try {
            const { error } = await supabase
                .from('grades')
                .insert([{
                    student_id: studentId,
                    subject_name: grade.subjectName,
                    teacher_name: grade.teacherName,
                    assessment_type: grade.assessmentType,
                    month: grade.month,
                    semester: grade.semester,
                    original_grade: grade.originalGrade,
                    final_grade: grade.finalGrade,
                    grade_level: grade.gradeLevel,
                    teacher_notes: grade.teacherNotes,
                    weight: grade.weight,
                    created_by: grade.createdBy,
                }]);

            if (error) throw error;
            return true;
        } catch (err) {
            console.error('خطأ في إضافة الدرجة:', err);
            throw err;
        }
    }

    // تحديث درجة لطالب
    static async updateStudentGrade(gradeId: string, grade: any) {
        try {
            const { error } = await supabase
                .from('grades')
                .update({
                    subject_name: grade.subjectName,
                    teacher_name: grade.teacherName,
                    assessment_type: grade.assessmentType,
                    month: grade.month,
                    semester: grade.semester,
                    original_grade: grade.originalGrade,
                    final_grade: grade.finalGrade,
                    grade_level: grade.gradeLevel,
                    teacher_notes: grade.teacherNotes,
                    weight: grade.weight,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', gradeId);

            if (error) throw error;
            return true;
        } catch (err) {
            console.error('خطأ في تحديث الدرجة:', err);
            throw err;
        }
    }

    // حذف درجة لطالب
    static async deleteStudentGrade(gradeId: string) {
        try {
            const { error } = await supabase
                .from('grades')
                .delete()
                .eq('id', gradeId);

            if (error) throw error;
            return true;
        } catch (err) {
            console.error('خطأ في حذف الدرجة:', err);
            throw err;
        }
    }

    // ========================================
    // عمليات الاسترداد (Refund Operations)
    // ========================================

    // جلب جميع أنواع الرسوم
    static async getFeeTypes() {
        try {
            const { data, error } = await supabase
                .from('fee_types')
                .select('*')
                .order('fee_type_name');

            if (error) throw error;
            return data as FeeType[];
        } catch (err) {
            console.error('خطأ في جلب أنواع الرسوم:', err);
            throw err;
        }
    }

    // إنشاء طلب استرداد جديد
    static async createRefundRequest(refund: Partial<Refund>) {
        try {
            const { data, error } = await supabase
                .from('refunds')
                .insert([{
                    student_id: refund.studentId,
                    academic_year_code: refund.academicYearCode,
                    request_date: refund.requestDate,
                    withdrawal_date: refund.withdrawalDate,
                    status: refund.status || 'معلق',
                    total_paid: refund.totalPaid,
                    total_refundable: refund.totalRefundable,
                    total_deductions: refund.totalDeductions,
                    final_refund_amount: refund.finalRefundAmount,
                    notes: refund.notes,
                    created_by: refund.createdBy,
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('خطأ في إنشاء طلب الاسترداد:', err);
            throw err;
        }
    }

    // جلب طلبات الاسترداد لطالب معين
    static async getStudentRefunds(studentId: string) {
        try {
            const { data, error } = await supabase
                .from('refunds')
                .select(`
                    *,
                    refund_deductions (*)
                `)
                .eq('student_id', studentId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as (Refund & { refund_deductions: RefundDeduction[] })[];
        } catch (err) {
            console.error('خطأ في جلب طلبات الاسترداد:', err);
            throw err;
        }
    }

    // جلب طلب استرداد محدد
    static async getRefund(refundId: string) {
        try {
            const { data, error } = await supabase
                .from('refunds')
                .select(`
                    *,
                    refund_deductions (*)
                `)
                .eq('id', refundId)
                .single();

            if (error) throw error;
            return data as Refund & { refund_deductions: RefundDeduction[] };
        } catch (err) {
            console.error('خطأ في جلب طلب الاسترداد:', err);
            throw err;
        }
    }

    // إضافة خصومات للاسترداد
    static async addRefundDeductions(deductions: Partial<RefundDeduction>[]) {
        try {
            const { error } = await supabase
                .from('refund_deductions')
                .insert(deductions.map(d => ({
                    refund_id: d.refundId,
                    deduction_type: d.deductionType,
                    description: d.description,
                    amount: d.amount,
                    percentage: d.percentage,
                    reason: d.reason,
                })));

            if (error) throw error;
            return true;
        } catch (err) {
            console.error('خطأ في إضافة خصومات الاسترداد:', err);
            throw err;
        }
    }

    // تحديث حالة طلب الاسترداد
    static async updateRefundStatus(
        refundId: string,
        status: 'معلق' | 'موافق عليه' | 'مرفوض' | 'مدفوع',
        updateData?: Partial<Refund>
    ) {
        try {
            const { error } = await supabase
                .from('refunds')
                .update({
                    status,
                    approver_name: updateData?.approverName,
                    approval_date: updateData?.approvalDate,
                    rejection_reason: updateData?.rejectionReason,
                    payment_date: updateData?.paymentDate,
                    payment_method: updateData?.paymentMethod,
                    bank_account_info: updateData?.bankAccountInfo,
                    receipt_number: updateData?.receiptNumber,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', refundId);

            if (error) throw error;
            return true;
        } catch (err) {
            console.error('خطأ في تحديث حالة الاسترداد:', err);
            throw err;
        }
    }

    // جلب جميع طلبات الاسترداد المعلقة للموافقة
    static async getPendingRefunds() {
        try {
            const { data, error } = await supabase
                .from('refunds')
                .select(`
                    *,
                    refund_deductions (*)
                `)
                .eq('status', 'معلق')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as (Refund & { refund_deductions: RefundDeduction[] })[];
        } catch (err) {
            console.error('خطأ في جلب طلبات الاسترداد المعلقة:', err);
            throw err;
        }
    }

    // تسجيل معاملة مالية للاسترداد
    static async recordRefundTransaction(
        studentId: string,
        academicYear: string,
        amount: number,
        description: string,
        refundId?: string
    ) {
        try {
            const { error } = await supabase
                .from('financial_transactions')
                .insert([{
                    student_id: studentId,
                    academic_year_code: academicYear,
                    transaction_type: 'استرجاع',
                    amount,
                    description: description || `استرداد أموال - رقم الطلب: ${refundId}`,
                    transaction_date: new Date().toISOString().split('T')[0],
                    payment_method: 'استرداد',
                }]);

            if (error) throw error;
            return true;
        } catch (err) {
            console.error('خطأ في تسجيل معاملة الاسترداد:', err);
            throw err;
        }
    }
}
