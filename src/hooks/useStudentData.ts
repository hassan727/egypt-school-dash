import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { StudentProfile, PersonalData, EnrollmentData, GuardianData, MotherData, AdministrativeData, EmergencyContact, SchoolFees, OtherExpense, FinancialTransaction, AttendanceRecord } from '@/types/student';
import { useSystemSchoolId } from '@/context/SystemContext';

/**
 * Hook لجلب وتحديث بيانات الطالب من Supabase
 * يدعم جميع أقسام البيانات
 */
export function useStudentData(studentId: string, academicYear?: string) {
    const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const schoolId = useSystemSchoolId();

    // جلب بيانات الطالب الكاملة
    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                setLoading(true);
                setError(null);

                // جلب البيانات الأساسية للطالب
                const { data: studentData, error: studentError } = await supabase
                    .from('students')
                    .select(`
                        *,
                        classes:class_id (
                            name,
                            stages:stage_id (
                                name
                            )
                        )
                    `)
                    .eq('student_id', studentId)
                    .eq('school_id', schoolId) // Enforce School Identity
                    .maybeSingle();


                if (studentError) {
                    console.error('خطأ في جلب بيانات الطالب:', studentError);
                    throw studentError;
                }

                if (!studentData) {
                    console.error('لم يتم العثور على طالب بالمعرف:', studentId);
                    throw new Error('الطالب غير موجود في قاعدة البيانات');
                }

                // جلب جهات الاتصال في الطوارئ
                const { data: emergencyContacts, error: contactsError } = await supabase
                    .from('emergency_contacts')
                    .select('*')
                    .eq('student_id', studentId);

                if (contactsError) throw contactsError;

                // جلب جميع بيانات المصروفات (لا نستخدم maybeSingle)
                const { data: allFeesData, error: allFeesError } = await supabase
                    .from('school_fees')
                    .select('*')
                    .eq('student_id', studentId);

                if (allFeesError) throw allFeesError;
                const allSchoolFees: any[] = allFeesData || [];

                // فلترة المصروفات حسب السنة الدراسية المختارة
                const selectedYear = academicYear || studentData.academic_year;
                const schoolFees = allSchoolFees.find(fee => fee.academic_year_code === selectedYear);


                // جلب الأقساط المرتبطة بالمصروفات
                let feeInstallments: any[] = [];
                if (schoolFees?.id) {
                    const { data: installmentsData, error: installmentsError } = await supabase
                        .from('fee_installments')
                        .select('*')
                        .eq('fee_id', schoolFees.id)
                        .order('installment_number', { ascending: true });

                    if (installmentsError) throw installmentsError;
                    feeInstallments = installmentsData || [];
                }

                // جلب بيانات المصروفات الأخرى للسنة المختارة
                const { data: otherExpenses, error: expensesError } = await supabase
                    .from('other_expenses')
                    .select('*')
                    .eq('student_id', studentId)
                    .eq('academic_year_code', selectedYear);

                if (expensesError) throw expensesError;

                // جلب البيانات السلوكية (غير مستخدمة حالياً)
                const { error: behavioralError } = await supabase
                    .from('behavioral_records')
                    .select('*')
                    .eq('student_id', studentId)
                    .maybeSingle();

                if (behavioralError && behavioralError.code !== 'PGRST116') { // PGRST116 = no rows returned
                    // Silent fail for behavioral data
                }

                // جلب البيانات الأكاديمية
                const { data: academicData, error: academicError } = await supabase
                    .from('academic_records')
                    .select('*')
                    .eq('student_id', studentId)
                    .maybeSingle();

                if (academicError && academicError.code !== 'PGRST116') { // PGRST116 = no rows returned
                    throw academicError;
                }

                // جلب المعاملات المالية للسنة المختارة
                const { data: financialTransactions, error: financialError } = await supabase
                    .from('financial_transactions')
                    .select('*')
                    .eq('student_id', studentId)
                    .eq('academic_year_code', selectedYear);

                if (financialError) throw financialError;

                // جلب سجل الحضور
                const { data: attendanceRecords, error: attendanceError } = await supabase
                    .from('attendance_records')
                    .select('*')
                    .eq('student_id', studentId);

                if (attendanceError) throw attendanceError;

                // جلب سجل التدقيق (Audit Trail)
                const { data: auditTrail, error: auditError } = await supabase
                    .from('student_audit_trail')
                    .select('*')
                    .eq('student_id', studentId);

                if (auditError) throw auditError;

                // تنظيم البيانات في هيكل StudentProfile
                const profile: StudentProfile = {
                    id: studentData.id,
                    studentId: studentData.student_id,
                    createdAt: studentData.created_at,
                    updatedAt: studentData.updated_at,
                    personalData: {
                        id: studentData.id,
                        studentId: studentData.student_id,
                        fullNameAr: studentData.full_name_ar,
                        nationalId: studentData.national_id || '',
                        dateOfBirth: studentData.date_of_birth || '',
                        placeOfBirth: studentData.place_of_birth || '',
                        nationality: studentData.nationality || '',
                        gender: studentData.gender || '',
                        religion: studentData.religion || '',
                        specialNeeds: studentData.special_needs || '',
                    },
                    enrollmentData: {
                        id: studentData.id,
                        studentId: studentData.student_id,
                        academicYear: studentData.academic_year || '',
                        stage: studentData.classes?.stages?.name || studentData.stage || '',
                        class: studentData.classes?.name || studentData.class || '',
                        classId: studentData.class_id,
                        enrollmentType: studentData.enrollment_type || '',
                        enrollmentDate: studentData.enrollment_date || '',
                        previousSchool: studentData.previous_school || '',
                        transferReason: studentData.transfer_reason || '',
                        previousLevel: studentData.previous_level || '',
                        secondLanguage: studentData.second_language || '',
                        curriculumType: studentData.curriculum_type || '',
                        hasRepeated: studentData.has_repeated || false,
                        orderAmongSiblings: studentData.order_among_siblings || 1,
                        isRegular: studentData.is_regular || true,
                    },
                    guardianData: {
                        id: studentData.id,
                        studentId: studentData.student_id,
                        fullName: studentData.guardian_full_name || '',
                        relationship: studentData.guardian_relationship || '',
                        nationalId: studentData.guardian_national_id || '',
                        job: studentData.guardian_job || '',
                        workplace: studentData.guardian_workplace || '',
                        educationLevel: studentData.guardian_education_level || '',
                        phone: studentData.guardian_phone || '',
                        whatsappNumber: studentData.guardian_whatsapp || '',
                        nationality: studentData.guardian_nationality || '',
                        email: studentData.guardian_email || '',
                        address: studentData.guardian_address || '',
                        maritalStatus: studentData.guardian_marital_status || '',
                        hasLegalGuardian: studentData.has_legal_guardian || false,
                        socialMedia: studentData.guardian_social_media || '',
                    },
                    motherData: {
                        id: studentData.id,
                        studentId: studentData.student_id,
                        fullName: studentData.mother_full_name || '',
                        nationalId: studentData.mother_national_id || '',
                        job: studentData.mother_job || '',
                        workplace: studentData.mother_workplace || '',
                        phone: studentData.mother_phone || '',
                        whatsappNumber: studentData.mother_whatsapp || '',
                        nationality: studentData.mother_nationality || '',
                        email: studentData.mother_email || '',
                        educationLevel: studentData.mother_education_level || '',
                        address: studentData.mother_address || '',
                        relationship: studentData.mother_relationship || '',
                    },
                    administrativeData: {
                        id: studentData.id,
                        studentId: studentData.student_id,
                        admissionDate: studentData.admission_date || '',
                        studentIdNumber: studentData.student_id_number || '',
                        fileStatus: studentData.file_status || 'نشط',
                        infoUpdateDate: studentData.info_update_date || '',
                        transportationStatus: studentData.transportation_status || 'لا يستخدم',
                        busNumber: studentData.bus_number || '',
                        pickupPoint: studentData.pickup_point || '',
                        schoolDocumentsComplete: studentData.school_documents_complete || false,
                        documentsNotes: studentData.documents_notes || '',
                        healthInsurance: studentData.health_insurance || false,
                        healthInsuranceNumber: studentData.health_insurance_number || '',
                        administrativeNotes: studentData.administrative_notes || '',
                        emergencyContactUpdated: studentData.emergency_contact_updated || '',
                    },
                    emergencyContacts: emergencyContacts || [],
                    schoolFees: schoolFees ? {
                        id: schoolFees.id || '',
                        studentId: schoolFees.student_id || studentId,
                        totalAmount: schoolFees.total_amount || 0,
                        installmentCount: schoolFees.installment_count || 1,
                        advancePayment: schoolFees.advance_payment || 0,
                        installments: feeInstallments.map((inst: any) => ({
                            id: inst.id,
                            feeId: inst.fee_id,
                            installmentNumber: inst.installment_number,
                            amount: inst.amount,
                            dueDate: inst.due_date,
                            paid: inst.paid || false,
                            paidDate: inst.paid_date || '',
                        })) || [],
                    } : {
                        id: '',
                        studentId: studentId,
                        totalAmount: 0,
                        installmentCount: 1,
                        advancePayment: 0,
                        installments: [],
                    },
                    otherExpenses: otherExpenses || [],
                    behavioralRecords: [],
                    academicRecords: academicData ? [{
                        id: academicData.id,
                        studentId: academicData.student_id,
                        currentGPA: academicData.current_gpa,
                        totalMarks: academicData.total_marks,
                        averageMarks: academicData.average_marks,
                        passingStatus: academicData.passing_status,
                        academicNotes: academicData.academic_notes,
                        strengths: academicData.strengths,
                        weaknesses: academicData.weaknesses,
                        lastExamDate: academicData.last_exam_date,
                    }] : [],
                    financialTransactions: financialTransactions?.map((ft: any) => ({
                        id: ft.id,
                        studentId: ft.student_id,
                        transactionType: ft.transaction_type as 'دفعة' | 'مصروف إضافي' | 'خصم' | 'غرامة',
                        amount: ft.amount,
                        description: ft.description,
                        paymentMethod: ft.payment_method,
                        transactionDate: ft.transaction_date,
                        receiptNumber: ft.receipt_number,
                        createdBy: ft.created_by,
                    })) || [],
                    attendanceRecords: attendanceRecords?.map((ar: any) => ({
                        id: ar.id,
                        studentId: ar.student_id,
                        date: ar.date,
                        status: ar.status as 'حاضر' | 'غائب' | 'متأخر' | 'معذور',
                        checkInTime: ar.check_in_time,
                        checkOutTime: ar.check_out_time,
                        notes: ar.notes,
                    })) || [],
                    auditTrail: auditTrail?.map((at: any) => ({
                        id: at.id,
                        studentId: at.student_id,
                        changeType: at.change_type,
                        changedFields: at.changed_fields,
                        changedBy: at.changed_by,
                        changeReason: at.change_reason,
                        createdAt: at.created_at,
                    })) || [],
                };

                setStudentProfile(profile);
            } catch (err) {
                console.error('خطأ في جلب البيانات:', err);
                setError(err instanceof Error ? err.message : 'فشل في جلب بيانات الطالب');
            } finally {
                setLoading(false);
            }
        };

        if (studentId && schoolId) {
            fetchStudentData();
        }
    }, [studentId, academicYear, schoolId]);

    // Save audit trail function
    const saveAuditTrail = async (changeType: string, oldData: any, newData: any) => {
        if (!studentId) return;

        try {
            const changedFields = {
                old: oldData || {},
                new: newData || {}
            };

            const { error } = await supabase
                .from('student_audit_trail')
                .insert({
                    student_id: studentId,
                    change_type: changeType,
                    changed_fields: changedFields,
                    changed_by: 'current_user', // In real app, get from auth context
                    created_at: new Date().toISOString()
                });

            if (error) throw error;
        } catch (err) {
            console.error('Error saving audit trail:', err);
        }
    };

    // تحديث بيانات شخصية
    const updatePersonalData = async (data: PersonalData) => {
        try {
            // Get current data for audit trail
            const currentData = studentProfile?.personalData;

            const { error } = await supabase
                .from('students')
                .update({
                    full_name_ar: data.fullNameAr,
                    national_id: data.nationalId,
                    date_of_birth: data.dateOfBirth || null,
                    place_of_birth: data.placeOfBirth,
                    nationality: data.nationality,
                    gender: data.gender,
                    religion: data.religion,
                    special_needs: data.specialNeeds,
                })
                .eq('student_id', data.studentId || studentId)
                .eq('school_id', schoolId);

            if (error) throw error;

            // Save audit trail
            await saveAuditTrail('Personal Data', currentData, data);

            return true;
        } catch (err) {
            console.error('خطأ في التحديث:', err);
            throw err;
        }
    };

    // تحديث بيانات القيد
    const updateEnrollmentData = async (data: EnrollmentData) => {
        try {
            // Get current data for audit trail
            const currentData = studentProfile?.enrollmentData;

            const updatePayload: any = {
                academic_year: data.academicYear,
                enrollment_type: data.enrollmentType,
                enrollment_date: data.enrollmentDate || null,
                previous_school: data.previousSchool,
                transfer_reason: data.transferReason,
                previous_level: data.previousLevel,
                second_language: data.secondLanguage,
                curriculum_type: data.curriculumType,
                has_repeated: data.hasRepeated,
                order_among_siblings: data.orderAmongSiblings,
                is_regular: data.isRegular,
            };

            // Only update class_id if it's provided (it should be if changed)
            if (data.classId) {
                updatePayload.class_id = data.classId;
            }

            const { error } = await supabase
                .from('students')
                .update(updatePayload)
                .eq('student_id', data.studentId || studentId)
                .eq('school_id', schoolId);

            if (error) throw error;

            // Save audit trail
            await saveAuditTrail('Enrollment Data', currentData, data);

            return true;
        } catch (err) {
            console.error('خطأ في التحديث:', err);
            throw err;
        }
    };

    // تحديث بيانات ولي الأمر
    const updateGuardianData = async (data: GuardianData) => {
        try {
            // Get current data for audit trail
            const currentData = studentProfile?.guardianData;

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
                    guardian_email: data.email,
                    guardian_address: data.address,
                    guardian_marital_status: data.maritalStatus,
                    has_legal_guardian: data.hasLegalGuardian,
                    guardian_social_media: data.socialMedia,
                })
                .eq('student_id', data.studentId || studentId)
                .eq('school_id', schoolId);

            if (error) throw error;

            // Save audit trail
            await saveAuditTrail('Guardian Data', currentData, data);

            return true;
        } catch (err) {
            console.error('خطأ في التحديث:', err);
            throw err;
        }
    };

    // تحديث بيانات الأم
    const updateMotherData = async (data: MotherData) => {
        try {
            // Get current data for audit trail
            const currentData = studentProfile?.motherData;

            const { error } = await supabase
                .from('students')
                .update({
                    mother_full_name: data.fullName,
                    mother_national_id: data.nationalId,
                    mother_job: data.job,
                    mother_workplace: data.workplace,
                    mother_phone: data.phone,
                    mother_email: data.email,
                    mother_education_level: data.educationLevel,
                    mother_address: data.address,
                    mother_relationship: data.relationship,
                })
                .eq('student_id', data.studentId || studentId)
                .eq('school_id', schoolId);

            if (error) throw error;

            // Save audit trail
            await saveAuditTrail('Mother Data', currentData, data);

            return true;
        } catch (err) {
            console.error('خطأ في التحديث:', err);
            throw err;
        }
    };

    // تحديث جهات الاتصال في الطوارئ
    const addEmergencyContact = async (data: EmergencyContact[]) => {
        try {
            // حذف جهات الاتصال الحالية
            await supabase
                .from('emergency_contacts')
                .delete()
                .eq('student_id', studentId);

            // إضافة الجهات الجديدة
            if (data.length > 0) {
                const { error } = await supabase
                    .from('emergency_contacts')
                    .insert(data.map(contact => ({
                        student_id: contact.studentId || studentId,
                        contact_name: contact.contactName,
                        relationship: contact.relationship,
                        phone: contact.phone,
                        address: contact.address,
                    })));

                if (error) throw error;
            }

            // حفظ سجل التدقيق
            await saveAuditTrail('Emergency Contacts', null, data);

            return true;
        } catch (err) {
            console.error('خطأ في التحديث:', err);
            throw err;
        }
    };

    // تحديث المصروفات
    const updateSchoolFees = async (data: Partial<SchoolFees>) => {
        if (!studentProfile) return;

        try {
            // تحديث بيانات المصروفات الأساسية
            const updateData: any = {
                total_amount: data.totalAmount,
                installment_count: data.installmentCount,
                advance_payment: data.advancePayment,
                updated_at: new Date().toISOString(),
            };

            // إزالة الخصائص undefined
            Object.keys(updateData).forEach(key =>
                updateData[key] === undefined && delete updateData[key]
            );

            const { error: updateError } = await supabase
                .from('school_fees')
                .update(updateData)
                .eq('student_id', studentId);

            if (updateError) throw updateError;

            // إذا تم تحديث الأقساط، يتم تحديث جدول fee_installments
            if (data.installments && data.installments.length > 0 && studentProfile.schoolFees.id) {
                // حذف الأقساط القديمة
                const { error: deleteError } = await supabase
                    .from('fee_installments')
                    .delete()
                    .eq('fee_id', studentProfile.schoolFees.id);

                if (deleteError) throw deleteError;

                // إضافة الأقساط الجديدة
                const { error: insertError } = await supabase
                    .from('fee_installments')
                    .insert(
                        data.installments.map((inst: any) => ({
                            fee_id: studentProfile.schoolFees.id,
                            installment_number: inst.installmentNumber,
                            amount: inst.amount,
                            due_date: inst.dueDate,
                            paid: inst.paid || false,
                            paid_date: inst.paidDate || null,
                        }))
                    );

                if (insertError) throw insertError;
            }

            await refreshStudentData();
        } catch (err) {
            console.error('خطأ في تحديث المصروفات:', err);
            throw err;
        }
    };

    // إنشاء بيانات المصروفات
    const createSchoolFees = async (data: Partial<SchoolFees>) => {
        const { error } = await supabase
            .from('school_fees')
            .insert([{ ...data, student_id: studentId, school_id: schoolId }]);

        if (error) throw error;
        await refreshStudentData();
    };

    // إضافة مصروف آخر
    const addOtherExpense = async (data: Partial<OtherExpense>[]) => {
        try {
            // حذف المصروفات الأخرى الحالية
            await supabase
                .from('other_expenses')
                .delete()
                .eq('student_id', studentId);

            // إضافة المصروفات الجديدة
            if (data.length > 0) {
                const { error } = await supabase
                    .from('other_expenses')
                    .insert(data.map((expense: Partial<OtherExpense>) => ({
                        student_id: expense.studentId || studentId,
                        expense_type: expense.expenseType,
                        quantity: expense.quantity || 1,
                        total_price: expense.totalPrice,
                        date: expense.date,
                    })));

                if (error) throw error;
            }

            // حفظ سجل التدقيق
            await saveAuditTrail('Other Expenses', null, data);

            return true;
        } catch (err) {
            console.error('خطأ في التحديث:', err);
            throw err;
        }
    };

    // تحديث البيانات الأكاديمية
    const updateAcademicData = async (data: any) => {
        try {
            // التحقق مما إذا كانت البيانات الأكاديمية موجودة
            const { data: existingRecord, error: checkError } = await supabase
                .from('academic_records')
                .select('id')
                .eq('student_id', studentId)
                .single();

            let error;
            if (existingRecord) {
                // تحديث البيانات الموجودة
                const { error: updateError } = await supabase
                    .from('academic_records')
                    .update({
                        current_gpa: data.currentGPA,
                        subjects: data.subjects,
                        total_marks: data.totalMarks,
                        average_marks: data.averageMarks,
                        passing_status: data.passingStatus,
                        academic_notes: data.academicNotes,
                        strengths: data.strengths,
                        weaknesses: data.weaknesses,
                        last_exam_date: data.lastExamDate,
                    })
                    .eq('student_id', studentId);
                error = updateError;
            } else {
                // إنشاء بيانات جديدة
                const { error: insertError } = await supabase
                    .from('academic_records')
                    .insert({
                        student_id: studentId,
                        current_gpa: data.currentGPA,
                        subjects: data.subjects,
                        total_marks: data.totalMarks,
                        average_marks: data.averageMarks,
                        passing_status: data.passingStatus,
                        academic_notes: data.academicNotes,
                        strengths: data.strengths,
                        weaknesses: data.weaknesses,
                        last_exam_date: data.lastExamDate,
                    });
                error = insertError;
            }

            if (error) throw error;

            // حفظ سجل التدقيق
            await saveAuditTrail('Academic Data', existingRecord, data);

            return true;
        } catch (err) {
            console.error('خطأ في تحديث البيانات الأكاديمية:', err);
            throw err;
        }
    };

    // تحديث البيانات السلوكية
    const updateBehavioralData = async (data: any) => {
        try {
            // التحقق مما إذا كانت البيانات السلوكية موجودة
            const { data: existingRecord, error: checkError } = await supabase
                .from('behavioral_records')
                .select('id')
                .eq('student_id', studentId)
                .single();

            let error;
            if (existingRecord) {
                // تحديث البيانات الموجودة
                const { error: updateError } = await supabase
                    .from('behavioral_records')
                    .update({
                        conduct_rating: data.conductRating,
                        attendance_rate: data.attendanceRate,
                        absences: data.absences,
                        tardiness: data.tardiness,
                        disciplinary_issues: data.disciplinaryIssues,
                        disciplinary_details: data.disciplinaryDetails,
                        participation_level: data.participationLevel,
                        classroom_behavior: data.classroomBehavior,
                        social_interaction: data.socialInteraction,
                        counselor_notes: data.counselorNotes,
                        last_incident_date: data.lastIncidentDate,
                    })
                    .eq('student_id', studentId)
                    .eq('school_id', schoolId);
                error = updateError;
            } else {
                // إنشاء بيانات جديدة
                const { error: insertError } = await supabase
                    .from('behavioral_records')
                    .insert({
                        student_id: studentId,
                        school_id: schoolId,
                        conduct_rating: data.conductRating,
                        attendance_rate: data.attendanceRate,
                        absences: data.absences,
                        tardiness: data.tardiness,
                        disciplinary_issues: data.disciplinaryIssues,
                        disciplinary_details: data.disciplinaryDetails,
                        participation_level: data.participationLevel,
                        classroom_behavior: data.classroomBehavior,
                        social_interaction: data.socialInteraction,
                        counselor_notes: data.counselorNotes,
                        last_incident_date: data.lastIncidentDate,
                    });
                error = insertError;
            }

            if (error) throw error;

            // حفظ سجل التدقيق
            await saveAuditTrail('Behavioral Data', existingRecord, data);

            return true;
        } catch (err) {
            console.error('خطأ في تحديث البيانات السلوكية:', err);
            throw err;
        }
    };

    // تحديث البيانات الإدارية
    const updateAdministrativeData = async (data: AdministrativeData) => {
        try {
            const currentData = studentProfile?.administrativeData;

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
                .eq('student_id', data.studentId || studentId)
                .eq('school_id', schoolId);

            if (error) throw error;

            // حفظ سجل التدقيق
            await saveAuditTrail('Administrative Data', currentData, data);

            return true;
        } catch (err) {
            console.error('خطأ في تحديث البيانات الإدارية:', err);
            throw err;
        }
    };

    // إضافة معاملة مالية جديدة
    const addFinancialTransaction = async (data: FinancialTransaction) => {
        try {
            const yearCode = academicYear || studentProfile?.enrollmentData?.academicYear || '2025-2026';

            const { error } = await supabase
                .from('financial_transactions')
                .insert({
                    student_id: data.studentId,
                    school_id: schoolId,
                    academic_year_code: yearCode,
                    transaction_type: data.transactionType,
                    amount: data.amount,
                    description: data.description,
                    payment_method: data.paymentMethod || 'نقدي',
                    transaction_date: data.transactionDate,
                    receipt_number: data.receiptNumber || '',
                    created_by: data.createdBy || 'current_user',
                    payer_name: data.payerName || '',
                    payer_relation: data.payerRelation || '',
                    payer_phone: data.payerPhone || '',
                    payer_national_id: data.payerNationalId || '',
                });

            if (error) throw error;
            return true;
        } catch (err) {
            console.error('خطأ في إضافة معاملة مالية:', err);
            throw err;
        }
    };

    // تحديث المعاملات المالية (استبدال الجميع)
    const updateFinancialTransactions = async (data: FinancialTransaction[]) => {
        try {
            // حذف المعاملات القديمة
            const { error: deleteError } = await supabase
                .from('financial_transactions')
                .delete()
                .eq('student_id', studentId);

            if (deleteError) throw deleteError;

            // إضافة المعاملات الجديدة
            if (data.length > 0) {
                const { error: insertError } = await supabase
                    .from('financial_transactions')
                    .insert(data.map(transaction => ({
                        student_id: transaction.studentId || studentId,
                        transaction_type: transaction.transactionType,
                        amount: transaction.amount,
                        description: transaction.description,
                        payment_method: transaction.paymentMethod || 'نقدي',
                        transaction_date: transaction.transactionDate,
                        receipt_number: transaction.receiptNumber || '',
                        created_by: transaction.createdBy || 'current_user',
                        payer_name: transaction.payerName || '',
                        payer_relation: transaction.payerRelation || '',
                        payer_phone: transaction.payerPhone || '',
                        payer_national_id: transaction.payerNationalId || '',
                    })));

                if (insertError) throw insertError;
            }

            // حفظ سجل التدقيق
            await saveAuditTrail('Financial Transactions', null, data);

            return true;
        } catch (err) {
            console.error('خطأ في تحديث المعاملات المالية:', err);
            throw err;
        }
    };

    // تحديث سجل الحضور
    const updateAttendanceRecords = async (data: AttendanceRecord[]) => {
        try {
            // حذف السجلات القديمة
            const { error: deleteError } = await supabase
                .from('attendance_records')
                .delete()
                .eq('student_id', studentId);

            if (deleteError) throw deleteError;

            // إضافة السجلات الجديدة
            if (data.length > 0) {
                const { error: insertError } = await supabase
                    .from('attendance_records')
                    .insert(data.map(record => ({
                        student_id: record.studentId,
                        date: record.date,
                        status: record.status,
                        check_in_time: record.checkInTime || null,
                        check_out_time: record.checkOutTime || null,
                        notes: record.notes || '',
                        attachment_url: record.attachment_url || null,
                    })));

                if (insertError) throw insertError;
            }

            // حفظ سجل التدقيق
            await saveAuditTrail('Attendance Records', null, data);

            return true;
        } catch (err) {
            console.error('خطأ في تحديث سجلات الحضور:', err);
            throw err;
        }
    };

    // إعادة تحميل بيانات الطالب (للتحديث التلقائي)
    const refreshStudentData = async () => {
        try {
            setLoading(true);
            setError(null);

            // جلب البيانات الأساسية للطالب
            const { data: studentData, error: studentError } = await supabase
                .from('students')
                .select('*')
                .eq('student_id', studentId)
                .single();

            if (studentError) throw studentError;

            // جلب جهات الاتصال في الطوارئ
            const { data: emergencyContacts, error: contactsError } = await supabase
                .from('emergency_contacts')
                .select('*')
                .eq('student_id', studentId);

            if (contactsError) throw contactsError;

            // جلب جميع بيانات المصروفات (لا نستخدم .single())
            const { data: allFeesData, error: allFeesError } = await supabase
                .from('school_fees')
                .select('*')
                .eq('student_id', studentId);

            if (allFeesError) throw allFeesError;
            const allSchoolFees: any[] = allFeesData || [];

            // فلترة المصروفات حسب السنة الدراسية المختارة
            const selectedYear = academicYear || studentData.academic_year;
            const schoolFees = allSchoolFees.find(fee => fee.academic_year_code === selectedYear);

            // جلب الأقساط المرتبطة بالمصروفات
            let feeInstallments: any[] = [];
            if (schoolFees?.id) {
                const { data: installmentsData, error: installmentsError } = await supabase
                    .from('fee_installments')
                    .select('*')
                    .eq('fee_id', schoolFees.id)
                    .order('installment_number', { ascending: true });

                if (installmentsError) throw installmentsError;
                feeInstallments = installmentsData || [];
            }

            // جلب بيانات المصروفات الأخرى للسنة المختارة
            const { data: otherExpenses, error: expensesError } = await supabase
                .from('other_expenses')
                .select('*')
                .eq('student_id', studentId)
                .eq('academic_year_code', selectedYear);

            if (expensesError) throw expensesError;

            // جلب البيانات السلوكية
            const { data: behavioralData, error: behavioralError } = await supabase
                .from('behavioral_records')
                .select('conduct_rating, disciplinary_issues, counselor_notes, last_incident_date')
                .eq('student_id', studentId)
                .maybeSingle();

            // جلب البيانات الأكاديمية
            const { data: academicData, error: academicError } = await supabase
                .from('academic_records')
                .select('*')
                .eq('student_id', studentId)
                .maybeSingle();

            // جلب المعاملات المالية للسنة المختارة
            const { data: financialTransactions, error: financialError } = await supabase
                .from('financial_transactions')
                .select('*')
                .eq('student_id', studentId)
                .eq('academic_year_code', selectedYear);

            if (financialError) throw financialError;

            // جلب سجل الحضور
            const { data: attendanceRecords, error: attendanceError } = await supabase
                .from('attendance_records')
                .select('*')
                .eq('student_id', studentId);

            if (attendanceError) throw attendanceError;

            // جلب سجل التدقيق (Audit Trail)
            const { data: auditTrail, error: auditError } = await supabase
                .from('student_audit_trail')
                .select('*')
                .eq('student_id', studentId);

            if (auditError) throw auditError;

            // تحديث البيانات في الـ state
            const profile: StudentProfile = {
                id: studentData.id,
                studentId: studentData.student_id,
                createdAt: studentData.created_at,
                updatedAt: studentData.updated_at,
                personalData: {
                    id: studentData.id,
                    studentId: studentData.student_id,
                    fullNameAr: studentData.full_name_ar,
                    nationalId: studentData.national_id || '',
                    dateOfBirth: studentData.date_of_birth || '',
                    placeOfBirth: studentData.place_of_birth || '',
                    nationality: studentData.nationality || '',
                    gender: studentData.gender || '',
                    religion: studentData.religion || '',
                    specialNeeds: studentData.special_needs || '',
                },
                enrollmentData: {
                    id: studentData.id,
                    studentId: studentData.student_id,
                    academicYear: studentData.academic_year || '',
                    stage: studentData.stage || '',
                    class: studentData.class || '',
                    enrollmentType: studentData.enrollment_type || '',
                    enrollmentDate: studentData.enrollment_date || '',
                    previousSchool: studentData.previous_school || '',
                    transferReason: studentData.transfer_reason || '',
                    previousLevel: studentData.previous_level || '',
                    secondLanguage: studentData.second_language || '',
                    curriculumType: studentData.curriculum_type || '',
                    hasRepeated: studentData.has_repeated || false,
                    orderAmongSiblings: studentData.order_among_siblings || 1,
                    isRegular: studentData.is_regular || true,
                },
                guardianData: {
                    id: studentData.id,
                    studentId: studentData.student_id,
                    fullName: studentData.guardian_full_name || '',
                    relationship: studentData.guardian_relationship || '',
                    nationalId: studentData.guardian_national_id || '',
                    job: studentData.guardian_job || '',
                    workplace: studentData.guardian_workplace || '',
                    educationLevel: studentData.guardian_education_level || '',
                    phone: studentData.guardian_phone || '',
                    email: studentData.guardian_email || '',
                    address: studentData.guardian_address || '',
                    maritalStatus: studentData.guardian_marital_status || '',
                    hasLegalGuardian: studentData.has_legal_guardian || false,
                    socialMedia: studentData.guardian_social_media || '',
                },
                motherData: {
                    id: studentData.id,
                    studentId: studentData.student_id,
                    fullName: studentData.mother_full_name || '',
                    nationalId: studentData.mother_national_id || '',
                    job: studentData.mother_job || '',
                    workplace: studentData.mother_workplace || '',
                    phone: studentData.mother_phone || '',
                    email: studentData.mother_email || '',
                    educationLevel: studentData.mother_education_level || '',
                    address: studentData.mother_address || '',
                    relationship: studentData.mother_relationship || '',
                },
                administrativeData: {
                    id: studentData.id,
                    studentId: studentData.student_id,
                    admissionDate: studentData.admission_date || '',
                    studentIdNumber: studentData.student_id_number || '',
                    fileStatus: studentData.file_status || 'نشط',
                    infoUpdateDate: studentData.info_update_date || '',
                    transportationStatus: studentData.transportation_status || 'لا يستخدم',
                    busNumber: studentData.bus_number || '',
                    pickupPoint: studentData.pickup_point || '',
                    schoolDocumentsComplete: studentData.school_documents_complete || false,
                    documentsNotes: studentData.documents_notes || '',
                    healthInsurance: studentData.health_insurance || false,
                    healthInsuranceNumber: studentData.health_insurance_number || '',
                    administrativeNotes: studentData.administrative_notes || '',
                    emergencyContactUpdated: studentData.emergency_contact_updated || '',
                },
                emergencyContacts: emergencyContacts || [],
                schoolFees: schoolFees ? {
                    id: schoolFees.id || '',
                    studentId: schoolFees.student_id || studentId,
                    totalAmount: schoolFees.total_amount || 0,
                    installmentCount: schoolFees.installment_count || 1,
                    advancePayment: schoolFees.advance_payment || 0,
                    installments: feeInstallments.map((inst: any) => ({
                        id: inst.id,
                        feeId: inst.fee_id,
                        installmentNumber: inst.installment_number,
                        amount: inst.amount,
                        dueDate: inst.due_date,
                        paid: inst.paid || false,
                        paidDate: inst.paid_date || '',
                    })) || [],
                } : {
                    id: '',
                    studentId: studentId,
                    totalAmount: 0,
                    installmentCount: 1,
                    advancePayment: 0,
                    installments: [],
                },
                otherExpenses: otherExpenses || [],
                behavioralRecords: [],
                academicRecords: academicData ? [{
                    id: academicData.id,
                    studentId: academicData.student_id,
                    currentGPA: academicData.current_gpa,
                    totalMarks: academicData.total_marks,
                    averageMarks: academicData.average_marks,
                    passingStatus: academicData.passing_status,
                    academicNotes: academicData.academic_notes,
                    strengths: academicData.strengths,
                    weaknesses: academicData.weaknesses,
                    lastExamDate: academicData.last_exam_date,
                }] : [],
                financialTransactions: financialTransactions?.map((ft: any) => ({
                    id: ft.id,
                    studentId: ft.student_id,
                    transactionType: ft.transaction_type as 'دفعة' | 'مصروف إضافي' | 'خصم' | 'غرامة',
                    amount: ft.amount,
                    description: ft.description,
                    paymentMethod: ft.payment_method,
                    transactionDate: ft.transaction_date,
                    receiptNumber: ft.receipt_number,
                    createdBy: ft.created_by,
                })) || [],
                attendanceRecords: attendanceRecords?.map((ar: any) => ({
                    id: ar.id,
                    studentId: ar.student_id,
                    date: ar.date,
                    status: ar.status as 'حاضر' | 'غائب' | 'متأخر' | 'معذور',
                    checkInTime: ar.check_in_time,
                    checkOutTime: ar.check_out_time,
                    notes: ar.notes,
                })) || [],
                auditTrail: auditTrail?.map((at: any) => ({
                    id: at.id,
                    studentId: at.student_id,
                    changeType: at.change_type,
                    changedFields: at.changed_fields,
                    changedBy: at.changed_by,
                    changeReason: at.change_reason,
                    createdAt: at.created_at,
                })) || [],
            };

            setStudentProfile(profile);
        } catch (err) {
            console.error('خطأ في إعادة تحميل البيانات:', err);
            setError('فشل في إعادة تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    // دالة التراجع عن آخر تغيير
    const undoLastChange = async () => {
        try {
            if (!studentProfile?.auditTrail || studentProfile.auditTrail.length === 0) {
                console.warn('لا توجد تغييرات للتراجع عنها');
                return false;
            }

            // الحصول على آخر تغيير
            const lastChange = studentProfile.auditTrail[0];
            const oldData = lastChange.changedFields?.old;

            if (!oldData) {
                console.warn('لا توجد بيانات قديمة للتراجع إليها');
                return false;
            }

            // استرجاع البيانات القديمة بناءً على نوع التغيير
            switch (lastChange.changeType) {
                case 'Personal Data':
                    await updatePersonalData(oldData as unknown as PersonalData);
                    break;
                case 'Enrollment Data':
                    await updateEnrollmentData(oldData as unknown as EnrollmentData);
                    break;
                case 'Guardian Data':
                    await updateGuardianData(oldData as unknown as GuardianData);
                    break;
                case 'Mother Data':
                    await updateMotherData(oldData as unknown as MotherData);
                    break;
                case 'Administrative Data':
                    await updateAdministrativeData(oldData as unknown as AdministrativeData);
                    break;
                default:
                    console.warn('نوع التغيير غير مدعوم للتراجع:', lastChange.changeType);
                    return false;
            }

            // إعادة تحميل البيانات
            await refreshStudentData();

            return true;
        } catch (err) {
            console.error('خطأ في التراجع عن التغيير:', err);
            throw err;
        }
    };

    // جلب الدرجات لطالب معين
    const getStudentGrades = async (studentId: string) => {
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
    };

    // إضافة درجة جديدة لطالب
    const addStudentGrade = async (studentId: string, grade: any) => {
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

            // تحديث تاريخ آخر امتحان في السجلات الأكاديمية
            if (studentProfile?.academicRecords && studentProfile.academicRecords.length > 0) {
                const academicRecord = studentProfile.academicRecords[0];
                await updateAcademicData({
                    ...academicRecord,
                    lastExamDate: new Date().toISOString().split('T')[0]
                });
            }

            return true;
        } catch (err) {
            console.error('خطأ في إضافة الدرجة:', err);
            throw err;
        }
    };

    // تحديث درجة لطالب
    const updateStudentGrade = async (gradeId: string, grade: any) => {
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
    };

    // تحديث حالة القسط (paid/unpaid)
    const updateInstallmentStatus = async (installmentId: string, paid: boolean, paidDate?: string) => {
        try {
            const { error } = await supabase
                .from('fee_installments')
                .update({
                    paid: paid,
                    paid_date: paid ? (paidDate || new Date().toISOString().split('T')[0]) : null
                })
                .eq('id', installmentId);

            if (error) throw error;
            return true;
        } catch (err) {
            console.error('خطأ في تحديث حالة القسط:', err);
            throw err;
        }
    };

    // حذف درجة لطالب
    const deleteStudentGrade = async (gradeId: string) => {
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
    };

    return {
        studentProfile,
        loading,
        error,
        saveAuditTrail,
        updatePersonalData,
        updateEnrollmentData,
        updateGuardianData,
        updateMotherData,
        updateAdministrativeData,
        addEmergencyContact,
        updateSchoolFees,
        addOtherExpense,
        updateAcademicData,
        updateBehavioralData,
        addFinancialTransaction,
        updateFinancialTransactions,
        updateInstallmentStatus,
        updateAttendanceRecords,
        refreshStudentData,
        undoLastChange,
        getStudentGrades,
        addStudentGrade,
        updateStudentGrade,
        deleteStudentGrade,
    } as const;
}
