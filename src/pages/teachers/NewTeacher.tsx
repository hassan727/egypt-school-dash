import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PersonalDataSection } from '@/components/TeacherProfile/PersonalDataSection';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Save, X, AlertCircle, CheckCircle, UserPlus, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { TeacherPersonalData, TeacherEmploymentData } from '@/types/teacher';

/**
 * صفحة تعيين معلم جديد - NewTeacher
 * مصممة بنفس نمط CreateStudentPage.tsx
 */

// توليد رقم المعلم
const generateTeacherId = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 10000);
    return `TCH${year}${randomNum.toString().padStart(4, '0')}`;
};

// رقم المعلم يُنشأ مرة واحدة عند تحميل الصفحة
const initialTeacherId = generateTeacherId();

const NewTeacher = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sectionSaved, setSectionSaved] = useState<Record<string, boolean>>({});

    // بيانات المعلم - teacherId موجود من البداية
    const [personalData, setPersonalData] = useState<TeacherPersonalData>({
        teacherId: initialTeacherId,
        fullNameAr: '',
        fullNameEn: '',
        nationalId: '',
        dateOfBirth: '',
        placeOfBirth: '',
        nationality: 'مصري',
        gender: 'ذكر',
        religion: 'مسلم',
        maritalStatus: 'أعزب',
        numberOfDependents: 0,
        phone: '',
        phoneSecondary: '',
        whatsappNumber: '',
        email: '',
        address: '',
        city: '',
        governorate: '',
        postalCode: '',
        emergencyContactName: '',
        emergencyContactRelation: '',
        emergencyContactPhone: '',
    });

    const [employmentData, setEmploymentData] = useState<TeacherEmploymentData>({
        teacherId: initialTeacherId,
        employeeNumber: initialTeacherId,
        educationalRegistrationNumber: '',
        hireDate: new Date().toISOString().split('T')[0],
        contractStartDate: new Date().toISOString().split('T')[0],
        contractEndDate: '',
        contractType: 'دائم',
        employmentStatus: 'نشط',
        highestQualification: 'بكالوريوس',
        qualificationField: '',
        qualificationUniversity: '',
        qualificationYear: undefined,
        teachingCertificate: '',
        schoolBranch: '',
        department: '',
        jobTitle: 'معلم',
        specialization: '',
        gradeLevelsTaught: '',
    });

    // معالجات تحديث البيانات
    const handleUpdatePersonal = async (data: Partial<TeacherPersonalData>): Promise<boolean> => {
        setPersonalData(prev => ({ ...prev, ...data }));
        setSectionSaved(prev => ({ ...prev, personal: true }));
        toast.success('تم حفظ البيانات الشخصية');
        return true;
    };

    const handleUpdateEmployment = async (data: Partial<TeacherEmploymentData>): Promise<boolean> => {
        setEmploymentData(prev => ({ ...prev, ...data }));
        setSectionSaved(prev => ({ ...prev, employment: true }));
        toast.success('تم حفظ البيانات الوظيفية');
        return true;
    };

    // التحقق من صحة البيانات
    const validateForm = (): boolean => {
        if (!personalData.fullNameAr?.trim()) {
            toast.error('الاسم الكامل مطلوب');
            return false;
        }
        if (!personalData.nationalId?.trim() || personalData.nationalId.length !== 14) {
            toast.error('الرقم القومي يجب أن يكون 14 رقم');
            return false;
        }
        if (!personalData.phone?.trim()) {
            toast.error('رقم الهاتف مطلوب');
            return false;
        }
        if (!employmentData.hireDate) {
            toast.error('تاريخ التعيين مطلوب');
            return false;
        }
        if (!employmentData.specialization?.trim()) {
            toast.error('التخصص التدريسي مطلوب');
            return false;
        }
        return true;
    };

    // إرسال النموذج
    const handleSubmit = async () => {
        if (!sectionSaved.personal || !sectionSaved.employment) {
            toast.error('يرجى حفظ جميع الأقسام المطلوبة أولاً');
            return;
        }

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // إدخال بيانات المعلم - مطابق لـ teacher_schema.sql
            const { error: teacherError } = await supabase
                .from('teachers')
                .insert({
                    teacher_id: initialTeacherId,
                    // البيانات الشخصية
                    full_name_ar: personalData.fullNameAr,
                    full_name_en: personalData.fullNameEn,
                    national_id: personalData.nationalId,
                    date_of_birth: personalData.dateOfBirth || null,
                    place_of_birth: personalData.placeOfBirth,
                    nationality: personalData.nationality,
                    gender: personalData.gender,
                    religion: personalData.religion,
                    marital_status: personalData.maritalStatus,
                    number_of_dependents: personalData.numberOfDependents,
                    phone: personalData.phone,
                    phone_secondary: personalData.phoneSecondary,
                    whatsapp_number: personalData.whatsappNumber || personalData.phone,
                    email: personalData.email,
                    address: personalData.address,
                    city: personalData.city,
                    governorate: personalData.governorate,
                    postal_code: personalData.postalCode,
                    emergency_contact_name: personalData.emergencyContactName,
                    emergency_contact_relation: personalData.emergencyContactRelation,
                    emergency_contact_phone: personalData.emergencyContactPhone,
                    // البيانات الوظيفية
                    employee_number: employmentData.employeeNumber || initialTeacherId,
                    educational_registration_number: employmentData.educationalRegistrationNumber,
                    hire_date: employmentData.hireDate,
                    contract_start_date: employmentData.contractStartDate || employmentData.hireDate,
                    contract_end_date: employmentData.contractEndDate || null,
                    contract_type: employmentData.contractType,
                    employment_status: employmentData.employmentStatus,
                    highest_qualification: employmentData.highestQualification,
                    qualification_field: employmentData.qualificationField,
                    qualification_university: employmentData.qualificationUniversity,
                    qualification_year: employmentData.qualificationYear,
                    teaching_certificate: employmentData.teachingCertificate,
                    school_branch: employmentData.schoolBranch,
                    department: employmentData.department,
                    job_title: employmentData.jobTitle,
                    specialization: employmentData.specialization,
                    grade_levels_taught: employmentData.gradeLevelsTaught,
                });

            if (teacherError) throw teacherError;

            // رصيد الإجازات
            await supabase.from('teacher_leave_balances').insert({
                teacher_id: initialTeacherId,
                academic_year_code: '2025-2026',
                annual_leave_balance: 21,
                sick_leave_balance: 14,
                emergency_leave_balance: 3,
                casual_leave_balance: 6,
            });

            // سجل التدقيق
            await supabase.from('teacher_audit_trail').insert({
                teacher_id: initialTeacherId,
                change_type: 'تسجيل جديد',
                changed_fields: { action: 'create' },
                new_values: { personalData, employmentData },
                changed_by: 'system',
                change_reason: 'تسجيل معلم جديد',
            });

            toast.success('تم تسجيل المعلم بنجاح!');
            navigate(`/teacher/${initialTeacherId}/dashboard`);

        } catch (error: any) {
            console.error('Error:', error);
            toast.error(`خطأ: ${error.message || 'يرجى المحاولة مرة أخرى'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 max-w-6xl mx-auto py-6 px-4">
                {/* Header */}
                <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-blue-600 rounded-xl shadow-md">
                            <UserPlus className="h-10 w-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">📝 تعيين معلم جديد</h1>
                            <p className="text-gray-600">رقم المعلم: <strong>{initialTeacherId}</strong></p>
                        </div>
                    </div>
                </div>

                {/* PersonalDataSection */}
                <PersonalDataSection
                    personalData={personalData}
                    employmentData={employmentData}
                    onUpdatePersonal={handleUpdatePersonal}
                    onUpdateEmployment={handleUpdateEmployment}
                    readOnly={false}
                />

                <div className="flex items-center gap-4">
                    {sectionSaved.personal ? (
                        <span className="flex items-center text-green-600 text-sm">
                            <CheckCircle className="h-4 w-4 mr-1" /> البيانات الشخصية محفوظة
                        </span>
                    ) : (
                        <span className="flex items-center text-gray-500 text-sm">
                            <AlertCircle className="h-4 w-4 mr-1" /> احفظ البيانات الشخصية
                        </span>
                    )}
                    {sectionSaved.employment ? (
                        <span className="flex items-center text-green-600 text-sm">
                            <CheckCircle className="h-4 w-4 mr-1" /> البيانات الوظيفية محفوظة
                        </span>
                    ) : (
                        <span className="flex items-center text-gray-500 text-sm">
                            <AlertCircle className="h-4 w-4 mr-1" /> احفظ البيانات الوظيفية
                        </span>
                    )}
                </div>

                {/* تعليمات */}
                <Card className="p-4 bg-blue-50 border border-blue-200">
                    <p className="text-blue-700">
                        <strong>التعليمات:</strong> احفظ البيانات الشخصية والوظيفية، ثم اضغط "تسجيل المعلم"
                    </p>
                </Card>

                {/* أزرار */}
                <div className="flex gap-4 pt-6 border-t">
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !sectionSaved.personal || !sectionSaved.employment}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                        {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري التسجيل...</> : <><Save className="h-4 w-4" /> تسجيل المعلم</>}
                    </Button>
                    <Button onClick={() => navigate('/teachers')} variant="outline" className="gap-2">
                        <X className="h-4 w-4" /> إلغاء
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default NewTeacher;
