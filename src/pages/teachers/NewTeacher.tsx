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
 * محدثة لاستخدام جدول employees بدلاً من teachers
 */

// توليد رقم الموظف (معلم)
const generateEmployeeId = () => {
    const randomNum = Math.floor(Math.random() * 10000);
    return `EMP${randomNum.toString().padStart(5, '0')}`;
};

// رقم الموظف يُنشأ مرة واحدة عند تحميل الصفحة
const initialEmployeeId = generateEmployeeId();

const NewTeacher = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sectionSaved, setSectionSaved] = useState<Record<string, boolean>>({});

    // بيانات المعلم - teacherId موجود من البداية
    const [personalData, setPersonalData] = useState<TeacherPersonalData>({
        teacherId: initialEmployeeId,
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
        teacherId: initialEmployeeId,
        employeeNumber: initialEmployeeId,
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
            // إدخال بيانات المعلم في جدول employees
            const { error: employeeError } = await supabase
                .from('employees')
                .insert({
                    employee_id: initialEmployeeId,
                    full_name: personalData.fullNameAr,
                    national_id: personalData.nationalId,
                    employee_type: 'معلم',
                    position: employmentData.jobTitle,
                    department: employmentData.department,
                    phone: personalData.phone,
                    email: personalData.email,
                    address: personalData.address,
                    hire_date: employmentData.hireDate,
                    contract_type: employmentData.contractType,
                    base_salary: 0,
                    bank_account: null,
                    bank_name: null,
                    is_active: employmentData.employmentStatus === 'نشط',
                    birth_date: personalData.dateOfBirth || null,
                    gender: personalData.gender,
                    marital_status: personalData.maritalStatus,
                    nationality: personalData.nationality,
                    religion: personalData.religion,
                    details: {
                        fullNameEn: personalData.fullNameEn,
                        placeOfBirth: personalData.placeOfBirth,
                        numberOfDependents: personalData.numberOfDependents,
                        phoneSecondary: personalData.phoneSecondary,
                        whatsappNumber: personalData.whatsappNumber,
                        city: personalData.city,
                        governorate: personalData.governorate,
                        postalCode: personalData.postalCode,
                        emergencyContactName: personalData.emergencyContactName,
                        emergencyContactRelation: personalData.emergencyContactRelation,
                        emergencyContactPhone: personalData.emergencyContactPhone,
                        educationalRegistrationNumber: employmentData.educationalRegistrationNumber,
                        contractStartDate: employmentData.contractStartDate,
                        contractEndDate: employmentData.contractEndDate,
                        highestQualification: employmentData.highestQualification,
                        qualificationField: employmentData.qualificationField,
                        qualificationUniversity: employmentData.qualificationUniversity,
                        qualificationYear: employmentData.qualificationYear,
                        teachingCertificate: employmentData.teachingCertificate,
                        schoolBranch: employmentData.schoolBranch,
                        specialization: employmentData.specialization,
                        gradeLevelsTaught: employmentData.gradeLevelsTaught,
                    }
                });

            if (employeeError) throw employeeError;

            toast.success('تم تسجيل المعلم بنجاح!');
            navigate(`/teacher/${initialEmployeeId}/dashboard`);

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
                            <p className="text-gray-600">رقم الموظف: <strong>{initialEmployeeId}</strong></p>
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
