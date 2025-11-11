import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PersonalDataSection } from '@/components/StudentProfile/PersonalDataSection';
import { EnrollmentDataSection } from '@/components/StudentProfile/EnrollmentDataSection';
import { GuardianDataSection } from '@/components/StudentProfile/GuardianDataSection';
import { MotherDataSection } from '@/components/StudentProfile/MotherDataSection';
import { EmergencyContactsSection } from '@/components/StudentProfile/EmergencyContactsSection';
import { SchoolFeesSection } from '@/components/StudentProfile/SchoolFeesSection';
import { Button } from '@/components/ui/button';
import { Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { validateSection, validateStudentData } from '@/utils/studentValidation';
import type { StudentProfile, PersonalData, EnrollmentData, GuardianData, MotherData, EmergencyContact, SchoolFees, OtherExpense } from '@/types/student';

/**
 * صفحة تسجيل طالب جديد - CreateStudentPage
 * 
 * هذه الصفحة مخصصة لتسجيل طلاب جدد فقط
 * تحتوي على 6 أقسام فقط:
 * 1. 👤 البيانات الشخصية
 * 2. 📚 قيد دراسي
 * 3. 👨‍👩‍👧 ولي أمر
 * 4. 👩 الأم
 * 5. 🆘 طوارئ
 * 6. 💰 مالية (المصروفات الدراسية)
 * 
 * ملاحظة: الأقسام الأخرى (أكاديمية، سلوكية، إدارية، معاملات مالية، السجل، الحضور)
 * متاحة فقط لتعديل بيانات الطلاب الموجودين عبر صفحات متخصصة أخرى
 */
const CreateStudentPage = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sectionErrors, setSectionErrors] = useState<Record<string, string[]>>({});
    const [sectionSaved, setSectionSaved] = useState<Record<string, boolean>>({});
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

    // Handle functions for updating data (نسخ دقيق من NewStudent.tsx)
    const handleUpdatePersonalData = async (data: PersonalData) => {
        setStudentProfile(prev => ({
            ...prev,
            personalData: data,
        }));
        // Validate section after update
        validateAndSaveSection('personal', data);
    };

    const handleUpdateEnrollmentData = async (data: EnrollmentData) => {
        setStudentProfile(prev => ({
            ...prev,
            enrollmentData: data,
        }));
        // Validate section after update
        validateAndSaveSection('enrollment', data);
    };

    const handleUpdateGuardianData = async (data: GuardianData) => {
        setStudentProfile(prev => ({
            ...prev,
            guardianData: data,
        }));
        // Validate section after update
        validateAndSaveSection('guardian', data);
    };

    const handleUpdateMotherData = async (data: MotherData) => {
        setStudentProfile(prev => ({
            ...prev,
            motherData: data,
        }));
        // Validate section after update
        validateAndSaveSection('mother', data);
    };

    const handleAddEmergencyContact = async (data: EmergencyContact[]) => {
        setStudentProfile(prev => ({
            ...prev,
            emergencyContacts: data,
        }));
        // Validate section after update
        validateAndSaveSection('emergency', data);
    };

    const handleUpdateSchoolFees = (feesData: any, installments: any[], auditLog: any[]) => {
        validateAndSaveSection('fees', feesData, () => {
            setStudentProfile(prev => ({
                ...prev,
                schoolFees: { ...feesData, installments, auditLog },
            }));
        });
    };

    const handleAddOtherExpense = (expenses: any[], optionalExpenses: any) => {
        setStudentProfile(prev => ({
            ...prev,
            otherExpenses: expenses,
            optionalExpenses: optionalExpenses,
        }));
        // We can add validation for expenses here if needed
        setSectionSaved(prev => ({ ...prev, expenses: true }));
    };

    // Validate and save section
    const validateAndSaveSection = (sectionName: string, data: any) => {
        const validationResult = validateSection(sectionName, data);
        
        if (!validationResult.isValid) {
            setSectionErrors(prev => ({
                ...prev,
                [sectionName]: validationResult.errors.map(err => err.message)
            }));
            setSectionSaved(prev => ({
                ...prev,
                [sectionName]: false
            }));
            return false;
        }
        
        setSectionErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[sectionName];
            return newErrors;
        });
        
        setSectionSaved(prev => ({
            ...prev,
            [sectionName]: true
        }));
        
        return true;
    };

    // Generate unique student ID
    const generateStudentId = () => {
        const year = new Date().getFullYear();
        const randomNum = Math.floor(Math.random() * 10000);
        return `STU${year}${randomNum.toString().padStart(4, '0')}`;
    };

    // Handle form submission
    const handleSubmit = async () => {
        setIsSubmitting(true);
        
        // Validate all sections before submission
        const validationResult = validateStudentData(
            studentProfile.personalData,
            studentProfile.enrollmentData,
            studentProfile.guardianData,
            studentProfile.motherData,
            studentProfile.emergencyContacts,
            studentProfile.schoolFees
        );
        
        if (!validationResult.isValid) {
            alert('يرجى تصحيح الأخطاء في النموذج قبل التسجيل. تأكد من حفظ جميع الأقسام بنجاح.');
            setIsSubmitting(false);
            return;
        }
        
        try {
            // Generate student ID
            const newStudentId = generateStudentId();

            // Save student data to Supabase
            const { error: studentError } = await supabase
                .from('students')
                .insert({
                    student_id: newStudentId,
                    // Personal Data
                    full_name_ar: studentProfile.personalData.fullNameAr,
                    national_id: studentProfile.personalData.nationalId,
                    date_of_birth: studentProfile.personalData.dateOfBirth,
                    place_of_birth: studentProfile.personalData.placeOfBirth,
                    nationality: studentProfile.personalData.nationality,
                    gender: studentProfile.personalData.gender,
                    religion: studentProfile.personalData.religion,
                    special_needs: studentProfile.personalData.specialNeeds,

                    // Enrollment Data
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

                    // Guardian Data
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

                    // Mother Data
                    mother_full_name: studentProfile.motherData.fullName,
                    mother_national_id: studentProfile.motherData.nationalId,
                    mother_job: studentProfile.motherData.job,
                    mother_workplace: studentProfile.motherData.workplace,
                    mother_phone: studentProfile.motherData.phone,
                    mother_email: studentProfile.motherData.email,
                    mother_education_level: studentProfile.motherData.educationLevel,
                    mother_address: studentProfile.motherData.address,
                    mother_relationship: studentProfile.motherData.relationship,
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
            const { error: feesError } = await supabase
                .from('school_fees')
                .insert({
                    student_id: newStudentId,
                    total_amount: studentProfile.schoolFees.totalAmount,
                    installment_count: studentProfile.schoolFees.installmentCount,
                    advance_payment: studentProfile.schoolFees.advancePayment,
                });

            if (feesError) throw feesError;

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

            // Success message
            alert('تم تسجيل الطالب بنجاح!');

            // Navigate to student dashboard
            navigate(`/student/${newStudentId}/dashboard`);
        } catch (error: any) {
            console.error('خطأ في إضافة الطالب:', error);
            alert(`حدث خطأ أثناء حفظ بيانات الطالب: ${error.message || 'يرجى المحاولة مرة أخرى.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 max-w-6xl mx-auto py-6 px-4">
                {/* Header */}
                <div className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        📝 تسجيل طالب جديد
                    </h1>
                    <p className="text-gray-600 mb-3">
                        يرجى ملء جميع البيانات المطلوبة أدناه. النموذج يتضمن 6 أقسام أساسية فقط لتسجيل الطالب الجديد
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mt-4 text-xs font-semibold">
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
                    </div>
                </div>

                {/* Section 1: Personal Data */}
                <div id="personal-data">
                    <PersonalDataSection
                        data={studentProfile.personalData}
                        onSave={handleUpdatePersonalData}
                        isReadOnly={false}
                    />
                    <div className="flex items-center gap-2 mt-2">
                        {sectionSaved.personal ? (
                            <div className="flex items-center text-green-600 text-sm">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                <span>تم حفظ البيانات الشخصية بنجاح</span>
                            </div>
                        ) : (
                            <div className="flex items-center text-gray-500 text-sm">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                <span>يرجى حفظ البيانات الشخصية</span>
                            </div>
                        )}
                    </div>
                    {sectionErrors.personal && sectionErrors.personal.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2">
                            <div className="flex items-center text-red-800 text-sm">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                <span className="font-bold">أخطاء في البيانات الشخصية:</span>
                            </div>
                            <ul className="list-disc pr-5 text-red-700 text-sm mt-1">
                                {sectionErrors.personal.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Section 2: Enrollment Data */}
                <div id="enrollment-data">
                    <EnrollmentDataSection
                        data={studentProfile.enrollmentData}
                        onSave={handleUpdateEnrollmentData}
                        isReadOnly={false}
                    />
                    <div className="flex items-center gap-2 mt-2">
                        {sectionSaved.enrollment ? (
                            <div className="flex items-center text-green-600 text-sm">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                <span>تم حفظ بيانات القيد بنجاح</span>
                            </div>
                        ) : (
                            <div className="flex items-center text-gray-500 text-sm">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                <span>يرجى حفظ بيانات القيد</span>
                            </div>
                        )}
                    </div>
                    {sectionErrors.enrollment && sectionErrors.enrollment.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2">
                            <div className="flex items-center text-red-800 text-sm">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                <span className="font-bold">أخطاء في بيانات القيد:</span>
                            </div>
                            <ul className="list-disc pr-5 text-red-700 text-sm mt-1">
                                {sectionErrors.enrollment.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Section 3: Guardian Data */}
                <div id="guardian-data">
                    <GuardianDataSection
                        data={studentProfile.guardianData}
                        onSave={handleUpdateGuardianData}
                        isReadOnly={false}
                    />
                    <div className="flex items-center gap-2 mt-2">
                        {sectionSaved.guardian ? (
                            <div className="flex items-center text-green-600 text-sm">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                <span>تم حفظ بيانات ولي الأمر بنجاح</span>
                            </div>
                        ) : (
                            <div className="flex items-center text-gray-500 text-sm">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                <span>يرجى حفظ بيانات ولي الأمر</span>
                            </div>
                        )}
                    </div>
                    {sectionErrors.guardian && sectionErrors.guardian.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2">
                            <div className="flex items-center text-red-800 text-sm">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                <span className="font-bold">أخطاء في بيانات ولي الأمر:</span>
                            </div>
                            <ul className="list-disc pr-5 text-red-700 text-sm mt-1">
                                {sectionErrors.guardian.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Section 4: Mother Data */}
                <div id="mother-data">
                    <MotherDataSection
                        data={studentProfile.motherData}
                        onSave={handleUpdateMotherData}
                        isReadOnly={false}
                    />
                    <div className="flex items-center gap-2 mt-2">
                        {sectionSaved.mother ? (
                            <div className="flex items-center text-green-600 text-sm">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                <span>تم حفظ بيانات الأم بنجاح</span>
                            </div>
                        ) : (
                            <div className="flex items-center text-gray-500 text-sm">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                <span>يرجى حفظ بيانات الأم</span>
                            </div>
                        )}
                    </div>
                    {sectionErrors.mother && sectionErrors.mother.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2">
                            <div className="flex items-center text-red-800 text-sm">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                <span className="font-bold">أخطاء في بيانات الأم:</span>
                            </div>
                            <ul className="list-disc pr-5 text-red-700 text-sm mt-1">
                                {sectionErrors.mother.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Section 5: Emergency Contacts */}
                <div id="emergency-contacts">
                    <EmergencyContactsSection
                        data={studentProfile.emergencyContacts}
                        onSave={handleAddEmergencyContact}
                        isReadOnly={false}
                    />
                    <div className="flex items-center gap-2 mt-2">
                        {sectionSaved.emergency ? (
                            <div className="flex items-center text-green-600 text-sm">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                <span>تم حفظ جهات الاتصال الطارئة بنجاح</span>
                            </div>
                        ) : (
                            <div className="flex items-center text-gray-500 text-sm">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                <span>يرجى حفظ جهات الاتصال الطارئة</span>
                            </div>
                        )}
                    </div>
                    {sectionErrors.emergency && sectionErrors.emergency.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2">
                            <div className="flex items-center text-red-800 text-sm">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                <span className="font-bold">أخطاء في جهات الاتصال الطارئة:</span>
                            </div>
                            <ul className="list-disc pr-5 text-red-700 text-sm mt-1">
                                {sectionErrors.emergency.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Section 6: School Fees */}
                <div id="financial-data" className="border-t-2 border-cyan-200 pt-8">
                    <h2 className="text-3xl font-bold text-cyan-900 mb-6">💰 البيانات المالية</h2>
                    <SchoolFeesSection
                        feesData={studentProfile.schoolFees}
                        expensesData={studentProfile.otherExpenses}
                        enrollmentData={studentProfile.enrollmentData}
                        onSaveFees={handleUpdateSchoolFees}
                        onSaveExpenses={handleAddOtherExpense}
                        isReadOnly={false}
                    />
                    <div className="flex items-center gap-2 mt-2">
                        {sectionSaved.fees ? (
                            <div className="flex items-center text-green-600 text-sm">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                <span>تم حفظ البيانات المالية بنجاح</span>
                            </div>
                        ) : (
                            <div className="flex items-center text-gray-500 text-sm">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                <span>يرجى حفظ البيانات المالية</span>
                            </div>
                        )}
                    </div>
                    {sectionErrors.fees && sectionErrors.fees.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2">
                            <div className="flex items-center text-red-800 text-sm">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                <span className="font-bold">أخطاء في البيانات المالية:</span>
                            </div>
                            <ul className="list-disc pr-5 text-red-700 text-sm mt-1">
                                {sectionErrors.fees.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Final Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center text-blue-800">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <h3 className="font-bold">تعليمات مهمة:</h3>
                    </div>
                    <p className="text-blue-700 mt-2">
                        يرجى الضغط على زر "حفظ" لكل قسم من الأقسام أعلاه قبل تسجيل الطالب.
                        في حالة وجود أخطاء، سيتم عرضها بجوار كل قسم.
                        يجب تصحيح جميع الأخطاء وحفظ جميع الأقسام بنجاح قبل تسجيل الطالب.
                    </p>
                </div>

                {/* Save and Cancel Buttons */}
                <div className="flex gap-4 pt-8 border-t sticky bottom-0 bg-white py-4 shadow-lg rounded-lg">
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                        <Save className="h-4 w-4" />
                        {isSubmitting ? 'جاري التسجيل...' : 'تسجيل الطالب'}
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

export default CreateStudentPage;