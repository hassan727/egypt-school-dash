import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PersonalDataSection } from '@/components/StudentProfile/PersonalDataSection';
import { EnrollmentDataSection } from '@/components/StudentProfile/EnrollmentDataSection';
import { GuardianDataSection } from '@/components/StudentProfile/GuardianDataSection';
import { MotherDataSection } from '@/components/StudentProfile/MotherDataSection';
import { EmergencyContactsSection } from '@/components/StudentProfile/EmergencyContactsSection';
import { SchoolFeesSection } from '@/components/StudentProfile/SchoolFeesSection';
import { AcademicSection } from '@/components/StudentProfile/AcademicSection';
import { BehavioralSection } from '@/components/StudentProfile/BehavioralSection';
import { AdministrativeSection } from '@/components/StudentProfile/AdministrativeSection';
import { FinancialTransactionsSection } from '@/components/StudentProfile/FinancialTransactionsSection';
import { AuditTrailSection } from '@/components/StudentProfile/AuditTrailSection';
import { AttendanceRecordsSection } from '@/components/StudentProfile/AttendanceRecordsSection';
import { Button } from '@/components/ui/button';
import { getEgyptianDateString } from '@/utils/helpers';
import { Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { validateStudentData, formatErrorMessage, ValidationError } from '@/utils/studentValidation';
import type { StudentProfile, PersonalData, EnrollmentData, GuardianData, MotherData, EmergencyContact, SchoolFees, OtherExpense, FinancialTransaction, AuditTrailEntry, AttendanceRecord } from '@/types/student';
import { useSystemSchoolId } from '@/context/SystemContext';

const NewStudent = () => {
  const navigate = useNavigate();
  const schoolId = useSystemSchoolId();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [studentProfile, setStudentProfile] = useState<StudentProfile>({
    id: '',
    studentId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    personalData: {
      fullNameAr: '',
      nationalId: '',
      dateOfBirth: '',
      placeOfBirth: '',
      nationality: 'مصري',
      gender: 'ذكر',
      religion: 'مسلم',
      specialNeeds: '',
    },
    enrollmentData: {
      studentId: '',
      academicYear: '2025-2026',
      stage: '',
      class: '',
      enrollmentType: 'مستجد',
      enrollmentDate: '',
      previousSchool: '',
      transferReason: '',
      previousLevel: '',
      secondLanguage: '',
      curriculumType: 'وطني',
      hasRepeated: false,
      orderAmongSiblings: 1,
      isRegular: true,
    },
    guardianData: {
      studentId: '',
      fullName: '',
      relationship: 'أب',
      nationalId: '',
      job: '',
      workplace: '',
      educationLevel: 'دبلوم',
      phone: '',
      email: '',
      address: '',
      maritalStatus: 'متزوج',
      hasLegalGuardian: false,
      socialMedia: '',
    },
    motherData: {
      studentId: '',
      fullName: '',
      nationalId: '',
      job: '',
      workplace: '',
      phone: '',
      email: '',
      educationLevel: 'دبلوم',
      address: '',
      relationship: 'أم',
    },
    emergencyContacts: [],
    schoolFees: {
      studentId: '',
      totalAmount: 0,
      installmentCount: 1,
      advancePayment: 0,
      installments: [],
    },
    otherExpenses: [],
  });

  // البيانات الأكاديمية
  const [academicData, setAcademicData] = useState({
    currentGPA: 0,
    subjects: [],
    totalMarks: 0,
    averageMarks: 0,
    passingStatus: 'ناجح' as 'ناجح' | 'راسب' | 'معلق',
    academicNotes: '',
    strengths: '',
    weaknesses: '',
    lastExamDate: getEgyptianDateString(),
  });

  // البيانات السلوكية
  const [behavioralData, setBehavioralData] = useState({
    conductRating: 'جيد' as 'ممتاز' | 'جيد جداً' | 'جيد' | 'مقبول' | 'ضعيف',
    attendanceRate: 95,
    absences: 0,
    tardiness: 0,
    disciplinaryIssues: false,
    disciplinaryDetails: '',
    participationLevel: 'متوسط' as 'عالي' | 'متوسط' | 'منخفض',
    classroomBehavior: '',
    socialInteraction: '',
    counselorNotes: '',
    lastIncidentDate: getEgyptianDateString(),
  });

  // البيانات الإدارية
  const [administrativeData, setAdministrativeData] = useState({
    admissionDate: getEgyptianDateString(),
    studentIdNumber: '',
    fileStatus: 'نشط' as 'نشط' | 'معطل' | 'مغلق' | 'معلق',
    infoUpdateDate: getEgyptianDateString(),
    transportationStatus: 'لا يستخدم' as 'يستخدم' | 'لا يستخدم',
    busNumber: '',
    pickupPoint: '',
    schoolDocumentsComplete: false,
    documentsNotes: '',
    healthInsurance: false,
    healthInsuranceNumber: '',
    administrativeNotes: '',
    emergencyContactUpdated: new Date().toISOString().split('T')[0],
  });

  // المعاملات المالية
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);

  // سجل التغييرات
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);

  // سجل الحضور
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  const handleUpdatePersonalData = async (data: PersonalData) => {
    setStudentProfile(prev => ({
      ...prev,
      personalData: data,
    }));
  };

  const handleUpdateEnrollmentData = async (data: EnrollmentData) => {
    setStudentProfile(prev => ({
      ...prev,
      enrollmentData: data,
    }));
  };

  const handleUpdateGuardianData = async (data: GuardianData) => {
    setStudentProfile(prev => ({
      ...prev,
      guardianData: data,
    }));
  };

  const handleUpdateMotherData = async (data: MotherData) => {
    setStudentProfile(prev => ({
      ...prev,
      motherData: data,
    }));
  };

  const handleAddEmergencyContact = async (data: EmergencyContact[]) => {
    setStudentProfile(prev => ({
      ...prev,
      emergencyContacts: data,
    }));
  };

  const handleUpdateSchoolFees = async (fees: SchoolFees) => {
    setStudentProfile(prev => ({
      ...prev,
      schoolFees: fees,
    }));
  };

  const handleAddOtherExpense = async (expenses: OtherExpense[]) => {
    setStudentProfile(prev => ({
      ...prev,
      otherExpenses: expenses,
    }));
  };

  const handleUpdateAcademicData = async (data: any) => {
    setAcademicData(data);
  };

  const handleUpdateBehavioralData = async (data: any) => {
    setBehavioralData(data);
  };

  const handleUpdateAdministrativeData = async (data: any) => {
    setAdministrativeData(data);
  };

  const handleUpdateFinancialTransactions = async (data: FinancialTransaction[]) => {
    setFinancialTransactions(data);
  };

  const handleUpdateAuditTrail = async (data: AuditTrailEntry[]) => {
    setAuditTrail(data);
  };

  const handleUpdateAttendanceRecords = async (data: AttendanceRecord[]) => {
    setAttendanceRecords(data);
  };

  const generateStudentId = () => {
    // Generate a unique student ID (in real app, this would be more sophisticated)
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 10000);
    return `STU${year}${randomNum.toString().padStart(4, '0')}`;
  };

  const handleSubmit = async () => {
    // تنظيف الرسائل السابقة
    setValidationErrors([]);
    setSuccessMessage('');

    // التحقق من صحة البيانات
    const validation = validateStudentData(
      studentProfile.personalData,
      studentProfile.enrollmentData,
      studentProfile.guardianData,
      studentProfile.motherData,
      studentProfile.emergencyContacts,
      studentProfile.schoolFees
    );

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      // scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate student ID
      const newStudentId = generateStudentId();

      if (!schoolId) {
        throw new Error("لا يمكن إضافة الطالب: لم يتم تحديد مدرسة");
      }

      // Save student data to Supabase
      const { error: studentError } = await supabase
        .from('students')
        .insert({
          school_id: schoolId,
          student_id: newStudentId,
          full_name_ar: studentProfile.personalData.fullNameAr,
          national_id: studentProfile.personalData.nationalId,
          date_of_birth: studentProfile.personalData.dateOfBirth,
          place_of_birth: studentProfile.personalData.placeOfBirth,
          nationality: studentProfile.personalData.nationality,
          gender: studentProfile.personalData.gender,
          religion: studentProfile.personalData.religion,
          special_needs: studentProfile.personalData.specialNeeds,

          academic_year: studentProfile.enrollmentData.academicYear,
          stage: studentProfile.enrollmentData.stage,
          class: studentProfile.enrollmentData.class,
          enrollment_type: studentProfile.enrollmentData.enrollmentType,
          enrollment_date: studentProfile.enrollmentData.enrollmentDate,
          previous_school: studentProfile.enrollmentData.previousSchool,
          transfer_reason: studentProfile.enrollmentData.transferReason,
          previous_level: studentProfile.enrollmentData.previousLevel,
          second_language: studentProfile.enrollmentData.secondLanguage,
          curriculum_type: studentProfile.enrollmentData.curriculumType,
          has_repeated: studentProfile.enrollmentData.hasRepeated,
          order_among_siblings: studentProfile.enrollmentData.orderAmongSiblings,
          is_regular: studentProfile.enrollmentData.isRegular,

          guardian_full_name: studentProfile.guardianData.fullName,
          guardian_relationship: studentProfile.guardianData.relationship,
          guardian_national_id: studentProfile.guardianData.nationalId,
          guardian_job: studentProfile.guardianData.job,
          guardian_workplace: studentProfile.guardianData.workplace,
          guardian_education_level: studentProfile.guardianData.educationLevel,
          guardian_phone: studentProfile.guardianData.phone,
          guardian_email: studentProfile.guardianData.email,
          guardian_address: studentProfile.guardianData.address,
          guardian_marital_status: studentProfile.guardianData.maritalStatus,
          has_legal_guardian: studentProfile.guardianData.hasLegalGuardian,
          guardian_social_media: studentProfile.guardianData.socialMedia,

          mother_full_name: studentProfile.motherData.fullName,
          mother_national_id: studentProfile.motherData.nationalId,
          mother_job: studentProfile.motherData.job,
          mother_workplace: studentProfile.motherData.workplace,
          mother_phone: studentProfile.motherData.phone,
          mother_email: studentProfile.motherData.email,
          mother_education_level: studentProfile.motherData.educationLevel,
          mother_address: studentProfile.motherData.address,
          mother_relationship: studentProfile.motherData.relationship,

          admission_date: administrativeData.admissionDate,
          student_id_number: administrativeData.studentIdNumber,
          file_status: administrativeData.fileStatus,
          info_update_date: administrativeData.infoUpdateDate,
          transportation_status: administrativeData.transportationStatus,
          bus_number: administrativeData.busNumber,
          pickup_point: administrativeData.pickupPoint,
          school_documents_complete: administrativeData.schoolDocumentsComplete,
          documents_notes: administrativeData.documentsNotes,
          health_insurance: administrativeData.healthInsurance,
          health_insurance_number: administrativeData.healthInsuranceNumber,
          administrative_notes: administrativeData.administrativeNotes,
          emergency_contact_updated: administrativeData.emergencyContactUpdated,
        });

      if (studentError) throw studentError;

      // Save emergency contacts
      if (studentProfile.emergencyContacts.length > 0) {
        const { error: contactsError } = await supabase
          .from('emergency_contacts')
          .insert(
            studentProfile.emergencyContacts.map(contact => ({
              student_id: newStudentId,
              contact_name: contact.contactName,
              relationship: contact.relationship,
              phone: contact.phone,
              address: contact.address,
            }))
          );

        if (contactsError) throw contactsError;
      }

      // Save school fees
      const { data: feesData, error: feesError } = await supabase
        .from('school_fees')
        .insert({
          student_id: newStudentId,
          total_amount: studentProfile.schoolFees.totalAmount,
          installment_count: studentProfile.schoolFees.installmentCount,
          advance_payment: studentProfile.schoolFees.advancePayment,
        })
        .select();

      if (feesError) throw feesError;

      // Save fee installments
      if (feesData && feesData.length > 0 && studentProfile.schoolFees.installments.length > 0) {
        const feeId = feesData[0].id;
        const { error: installmentsError } = await supabase
          .from('fee_installments')
          .insert(
            studentProfile.schoolFees.installments.map(installment => ({
              fee_id: feeId,
              installment_number: installment.installmentNumber,
              amount: installment.amount,
              due_date: installment.dueDate,
              paid: installment.paid || false,
              paid_date: installment.paidDate || null,
            }))
          );

        if (installmentsError) throw installmentsError;
      }

      // Save other expenses
      if (studentProfile.otherExpenses.length > 0) {
        const { error: expensesError } = await supabase
          .from('other_expenses')
          .insert(
            studentProfile.otherExpenses.map(expense => ({
              student_id: newStudentId,
              expense_type: expense.expenseType,
              quantity: expense.quantity,
              total_price: expense.totalPrice,
              date: expense.date,
            }))
          );

        if (expensesError) throw expensesError;
      }

      // Save academic records
      const { error: academicError } = await supabase
        .from('academic_records')
        .insert({
          student_id: newStudentId,
          current_gpa: academicData.currentGPA,
          total_marks: academicData.totalMarks,
          average_marks: academicData.averageMarks,
          passing_status: academicData.passingStatus,
          academic_notes: academicData.academicNotes,
          strengths: academicData.strengths,
          weaknesses: academicData.weaknesses,
          last_exam_date: academicData.lastExamDate,
        });

      if (academicError) throw academicError;

      // Save behavioral records
      const { error: behavioralError } = await supabase
        .from('behavioral_records')
        .insert({
          student_id: newStudentId,
          conduct_rating: behavioralData.conductRating,
          attendance_rate: behavioralData.attendanceRate,
          absences: behavioralData.absences,
          tardiness: behavioralData.tardiness,
          disciplinary_issues: behavioralData.disciplinaryIssues,
          disciplinary_details: behavioralData.disciplinaryDetails,
          participation_level: behavioralData.participationLevel,
          classroom_behavior: behavioralData.classroomBehavior,
          social_interaction: behavioralData.socialInteraction,
          counselor_notes: behavioralData.counselorNotes,
          last_incident_date: behavioralData.lastIncidentDate,
        });

      if (behavioralError) throw behavioralError;

      // Save financial transactions
      if (financialTransactions.length > 0) {
        const { error: financialError } = await supabase
          .from('financial_transactions')
          .insert(
            financialTransactions.map(transaction => ({
              student_id: newStudentId,
              transaction_type: transaction.transactionType,
              amount: transaction.amount,
              description: transaction.description,
              payment_method: transaction.paymentMethod,
              transaction_date: transaction.transactionDate,
              receipt_number: transaction.receiptNumber,
              created_by: transaction.createdBy,
            }))
          );

        if (financialError) throw financialError;
      }

      // Save audit trail
      if (auditTrail.length > 0) {
        const { error: auditError } = await supabase
          .from('student_audit_trail')
          .insert(
            auditTrail.map(entry => ({
              student_id: newStudentId,
              change_type: entry.changeType,
              changed_fields: entry.changedFields,
              changed_by: entry.changedBy,
              change_reason: entry.changeReason,
            }))
          );

        if (auditError) throw auditError;
      }

      // Save attendance records
      if (attendanceRecords.length > 0) {
        const { error: attendanceError } = await supabase
          .from('attendance_records')
          .insert(
            attendanceRecords.map(record => ({
              student_id: newStudentId,
              date: record.date,
              status: record.status,
              check_in_time: record.checkInTime,
              check_out_time: record.checkOutTime,
              notes: record.notes,
            }))
          );

        if (attendanceError) throw attendanceError;
      }

      // After success, show message
      setSuccessMessage(`✅ تم إضافة الطالب بنجاح برقم: ${newStudentId}`);

      // Navigate after 2 seconds
      setTimeout(() => {
        navigate('/students');
      }, 2000);
    } catch (error: any) {
      console.error('خطأ في إضافة الطالب:', error);

      // Extract error message from Supabase error
      let errorMessage = 'حدث خطأ أثناء حفظ بيانات الطالب.';

      if (error.message === 'invalid input syntax for type date: ""') {
        errorMessage = '❌ خطأ: يوجد حقل تاريخ فارغ. يرجى ملء جميع حقول التاريخ.';
      } else if (error.message) {
        errorMessage = `❌ خطأ: ${error.message}`;
      }

      setValidationErrors([
        {
          field: 'database',
          message: errorMessage,
        },
      ]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto py-6 px-4">
        {/* رسائل الأخطاء والنجاح */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  ⚠️ يوجد أخطاء يجب تصحيحها قبل الحفظ
                </h3>
                <ul className="space-y-1">
                  {validationErrors.map((error, idx) => (
                    <li key={idx} className="text-red-700 text-sm font-medium">
                      {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <p className="text-green-800 font-semibold">{successMessage}</p>
            </div>
          </div>
        )}

        {/* رأس الصفحة */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📝 تسجيل طالب جديد - نموذج شامل
          </h1>
          <p className="text-gray-600 mb-3">
            يرجى ملء جميع البيانات المطلوبة أدناه. النموذج يتضمن 13 قسم شامل لجميع بيانات الطالب
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mt-4 text-xs font-semibold">
            <span
              className="text-blue-700 cursor-pointer hover:underline"
              onClick={() => document.getElementById('personal-data')?.scrollIntoView({ behavior: 'smooth' })}
            >
              👤 بيانات شخصية
            </span>
            <span
              className="text-green-700 cursor-pointer hover:underline"
              onClick={() => document.getElementById('enrollment-data')?.scrollIntoView({ behavior: 'smooth' })}
            >
              📚 قيد دراسي
            </span>
            <span
              className="text-purple-700 cursor-pointer hover:underline"
              onClick={() => document.getElementById('guardian-data')?.scrollIntoView({ behavior: 'smooth' })}
            >
              👨‍👩‍👧 ولي أمر
            </span>
            <span
              className="text-indigo-700 cursor-pointer hover:underline"
              onClick={() => document.getElementById('mother-data')?.scrollIntoView({ behavior: 'smooth' })}
            >
              👩 الأم
            </span>
            <span
              className="text-red-700 cursor-pointer hover:underline"
              onClick={() => document.getElementById('emergency-contacts')?.scrollIntoView({ behavior: 'smooth' })}
            >
              🆘 طوارئ
            </span>
            <span
              className="text-cyan-700 cursor-pointer hover:underline"
              onClick={() => document.getElementById('financial-data')?.scrollIntoView({ behavior: 'smooth' })}
            >
              💰 مالية
            </span>
            <span
              className="text-yellow-700 cursor-pointer hover:underline"
              onClick={() => document.getElementById('academic-data')?.scrollIntoView({ behavior: 'smooth' })}
            >
              📊 أكاديمية
            </span>
            <span
              className="text-orange-700 cursor-pointer hover:underline"
              onClick={() => document.getElementById('behavioral-data')?.scrollIntoView({ behavior: 'smooth' })}
            >
              ⭐ سلوكية
            </span>
            <span
              className="text-pink-700 cursor-pointer hover:underline"
              onClick={() => document.getElementById('administrative-data')?.scrollIntoView({ behavior: 'smooth' })}
            >
              📋 إدارية
            </span>
            <span
              className="text-red-700 cursor-pointer hover:underline"
              onClick={() => document.getElementById('financial-transactions')?.scrollIntoView({ behavior: 'smooth' })}
            >
              💸 معاملات مالية
            </span>
            <span
              className="text-indigo-700 cursor-pointer hover:underline"
              onClick={() => document.getElementById('audit-trail')?.scrollIntoView({ behavior: 'smooth' })}
            >
              📝 سجل التغييرات
            </span>
            <span
              className="text-cyan-700 cursor-pointer hover:underline"
              onClick={() => document.getElementById('attendance-records')?.scrollIntoView({ behavior: 'smooth' })}
            >
              📅 الحضور
            </span>
          </div>
        </div>

        {/* القسم الأول: البيانات الشخصية */}
        <div id="personal-data">
          <PersonalDataSection
            data={studentProfile.personalData}
            onSave={handleUpdatePersonalData}
            isReadOnly={false}
          />
        </div>

        {/* القسم الثاني: بيانات القيد الدراسي */}
        <div id="enrollment-data">
          <EnrollmentDataSection
            data={studentProfile.enrollmentData}
            onSave={handleUpdateEnrollmentData}
            isReadOnly={false}
          />
        </div>

        {/* القسم الثالث: بيانات ولي الأمر */}
        <div id="guardian-data">
          <GuardianDataSection
            data={studentProfile.guardianData}
            onSave={handleUpdateGuardianData}
            isReadOnly={false}
          />
        </div>

        {/* القسم الرابع: بيانات الأم */}
        <div id="mother-data">
          <MotherDataSection
            data={studentProfile.motherData}
            onSave={handleUpdateMotherData}
            isReadOnly={false}
          />
        </div>

        {/* القسم الخامس: بيانات الطوارئ */}
        <div id="emergency-contacts">
          <EmergencyContactsSection
            data={studentProfile.emergencyContacts}
            onSave={handleAddEmergencyContact}
            isReadOnly={false}
          />
        </div>

        {/* القسم السادس: البيانات المالية */}
        <div id="financial-data" className="border-t-2 border-blue-200 pt-8">
          <h2 className="text-3xl font-bold text-blue-900 mb-6">💰 البيانات المالية المتقدمة</h2>
          <SchoolFeesSection
            feesData={studentProfile.schoolFees}
            expensesData={studentProfile.otherExpenses}
            enrollmentData={studentProfile.enrollmentData}
            onSaveFees={handleUpdateSchoolFees}
            onSaveExpenses={handleAddOtherExpense}
            isReadOnly={false}
          />
        </div>

        {/* القسم الثامن: البيانات الأكاديمية */}
        <div id="academic-data" className="border-t-2 border-green-200 pt-8">
          <h2 className="text-3xl font-bold text-green-900 mb-6">📊 البيانات الأكاديمية</h2>
          <AcademicSection
            data={academicData}
            onSave={handleUpdateAcademicData}
            isReadOnly={false}
          />
        </div>

        {/* القسم التاسع: البيانات السلوكية */}
        <div id="behavioral-data" className="border-t-2 border-yellow-200 pt-8">
          <h2 className="text-3xl font-bold text-yellow-900 mb-6">⭐ البيانات السلوكية</h2>
          <BehavioralSection
            data={behavioralData}
            onSave={handleUpdateBehavioralData}
            isReadOnly={false}
          />
        </div>

        {/* القسم العاشر: البيانات الإدارية */}
        <div id="administrative-data" className="border-t-2 border-purple-200 pt-8">
          <h2 className="text-3xl font-bold text-purple-900 mb-6">📋 البيانات الإدارية</h2>
          <AdministrativeSection
            data={administrativeData}
            onSave={handleUpdateAdministrativeData}
            isReadOnly={false}
          />
        </div>

        {/* القسم الحادي عشر: المعاملات المالية */}
        <div id="financial-transactions" className="border-t-2 border-red-200 pt-8">
          <h2 className="text-3xl font-bold text-red-900 mb-6">💸 المعاملات المالية</h2>
          <FinancialTransactionsSection
            data={financialTransactions}
            onSave={handleUpdateFinancialTransactions}
            isReadOnly={false}
          />
        </div>

        {/* القسم الثاني عشر: سجل التغييرات */}
        <div id="audit-trail" className="border-t-2 border-indigo-200 pt-8">
          <h2 className="text-3xl font-bold text-indigo-900 mb-6">📝 سجل التغييرات</h2>
          <AuditTrailSection
            data={auditTrail}
            onSave={handleUpdateAuditTrail}
            isReadOnly={false}
          />
        </div>

        {/* القسم الثالث عشر: سجل الحضور */}
        <div id="attendance-records" className="border-t-2 border-cyan-200 pt-8">
          <h2 className="text-3xl font-bold text-cyan-900 mb-6">📅 سجل الحضور والغياب</h2>
          <AttendanceRecordsSection
            data={attendanceRecords}
            onSave={handleUpdateAttendanceRecords}
            isReadOnly={false}
          />
        </div>

        {/* أزرار الحفظ والإلغاء */}
        <div className="flex gap-4 pt-8 border-t sticky bottom-0 bg-white py-4">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ بيانات الطالب'}
          </Button>
          <Button
            onClick={() => navigate('/students')}
            variant="outline"
            className="gap-2"
          >
            <X className="h-4 w-4" />
            إلغاء
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NewStudent;