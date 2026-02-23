import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, X, AlertCircle, CheckCircle, UserPlus, User, Briefcase, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useSystemSchoolId } from '@/context/SystemContext';

// Import Reusable Forms
import { PersonalDataForm, PersonalData } from "@/components/hr/employees/PersonalDataForm";
import { JobDataForm, JobData } from "@/components/hr/employees/JobDataForm";
import { FinancialDataForm, FinancialData } from "@/components/hr/employees/FinancialDataForm";
import { ContactDataForm, ContactData } from "@/components/hr/employees/ContactDataForm";
import { DocumentsSection, PendingDocument } from "@/components/hr/employees/DocumentsSection";
import { EmployeeRoleSpecificFields, RoleSpecificData } from "@/components/hr/employees/EmployeeRoleSpecificFields";

const HRNewEmployee = () => {
    const navigate = useNavigate();
    const schoolId = useSystemSchoolId();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- State Management ---
    const [personalData, setPersonalData] = useState<PersonalData>({
        full_name_ar: "",
        national_id: "",
        birth_date: "",
        gender: "",
        marital_status: "",
        nationality: "مصري",
        religion: "مسلم"
    });

    const [jobData, setJobData] = useState<JobData>({
        job_title: "",
        employee_role: "معلم",
        employee_type: "full_time",
        contract_type: "permanent",
        hire_date: new Date().toISOString().split('T')[0],
        status: "active",
        shift_id: ""
    });

    const [roleSpecificData, setRoleSpecificData] = useState<RoleSpecificData>({});

    const [financialData, setFinancialData] = useState<FinancialData>({
        base_salary: 0,
        incentives: 0,
        housing_allowance: 0,
        transport_allowance: 0,
        work_nature_allowance: 0,
        insurance_percentage: 11,
        insurance_number: "",
        bank_name: "",
        bank_account: "",
        iban: "",
        account_type: "جاري"
    });

    const [contactData, setContactData] = useState<ContactData>({
        phone: "",
        whatsapp_number: "",
        email: "",
        address: "",
        nationality: "مصري"
    });

    const [documents, setDocuments] = useState<PendingDocument[]>([]);

    // --- Validation/Save Status ---
    const [sectionStatus, setSectionStatus] = useState({
        personal: false,
        job: false,
        financial: false,
        contact: false,
        documents: false
    });

    // --- Handlers ---
    const handlePersonalChange = (field: keyof PersonalData, value: string) => {
        setPersonalData(prev => ({ ...prev, [field]: value }));
        setSectionStatus(prev => ({ ...prev, personal: false }));
    };

    const handleSavePersonal = () => {
        if (!personalData.full_name_ar || !personalData.national_id || !personalData.birth_date || !personalData.gender) {
            toast.error("يرجى ملء جميع الحقول الإجبارية في البيانات الشخصية");
            return;
        }
        setSectionStatus(prev => ({ ...prev, personal: true }));
        toast.success("تم حفظ البيانات الشخصية مبدئياً");
    };

    const handleJobChange = (field: keyof JobData, value: string) => {
        setJobData(prev => ({ ...prev, [field]: value }));
        if (field === 'employee_role') {
            setRoleSpecificData({});
        }
        setSectionStatus(prev => ({ ...prev, job: false }));
    };

    const handleRoleSpecificChange = (field: string, value: string | number) => {
        setRoleSpecificData(prev => ({ ...prev, [field]: value }));
        setSectionStatus(prev => ({ ...prev, job: false }));
    };

    const handleSaveJob = () => {
        if (!jobData.job_title || !jobData.hire_date) {
            toast.error("يرجى ملء المسمى الوظيفي وتاريخ التعيين");
            return;
        }
        setSectionStatus(prev => ({ ...prev, job: true }));
        toast.success("تم حفظ البيانات الوظيفية مبدئياً");
    };

    const handleFinancialChange = (newData: FinancialData) => {
        setFinancialData(newData);
        setSectionStatus(prev => ({ ...prev, financial: false }));
    };

    const handleSaveFinancial = () => {
        if (!financialData.base_salary || financialData.base_salary <= 0) {
            toast.error("الراتب الأساسي مطلوب");
            return;
        }
        setSectionStatus(prev => ({ ...prev, financial: true }));
        toast.success("تم حفظ البيانات المالية مبدئياً");
    };

    const handleContactChange = (field: keyof ContactData, value: string) => {
        setContactData(prev => ({ ...prev, [field]: value }));
        setSectionStatus(prev => ({ ...prev, contact: false }));
    };

    const handleSaveContact = () => {
        if (!contactData.phone) {
            toast.error("رقم الهاتف مطلوب");
            return;
        }
        setSectionStatus(prev => ({ ...prev, contact: true }));
        toast.success("تم حفظ بيانات الاتصال مبدئياً");
    };

    const handleDocumentsSave = (docs: PendingDocument[]) => {
        setDocuments(docs);
        // If docs exist, mark as 'saved' or at least acknowledged
        if (docs.length > 0) {
            setSectionStatus(prev => ({ ...prev, documents: true }));
        }
    };


    // --- Final Submission ---
    const handleSubmit = async () => {
        setIsSubmitting(true);

        if (!sectionStatus.personal || !sectionStatus.job || !sectionStatus.financial || !sectionStatus.contact) {
            toast.error("يرجى مراجعة وحفظ جميع الأقسام (الشخصية، الوظيفية، المالية، الاتصال) أولاً");
            setIsSubmitting(false);
            return;
        }

        try {
            if (!schoolId) {
                toast.error("يرجى تحديث الصفحة، لم يتم التعرف على المدرسة");
                setIsSubmitting(false);
                return;
            }

            // 1. Prepare JSONB Details
            const detailsPayload = {
                financial_details: {
                    incentives: financialData.incentives,
                    housing_allowance: financialData.housing_allowance,
                    transport_allowance: financialData.transport_allowance,
                    work_nature_allowance: financialData.work_nature_allowance,
                    insurance_percentage: financialData.insurance_percentage,
                    insurance_number: financialData.insurance_number,
                    iban: financialData.iban,
                    account_type: financialData.account_type
                },
                role_specific_fields: roleSpecificData
            };

            const empCode = `EMP-${Date.now().toString().slice(-6)}`;

            // 2. Insert Employee
            const { data: empData, error: empError } = await supabase
                .from('employees')
                .insert([{
                    // Personal
                    full_name: personalData.full_name_ar,
                    national_id: personalData.national_id,
                    birth_date: personalData.birth_date,
                    gender: personalData.gender,
                    marital_status: personalData.marital_status,
                    nationality: personalData.nationality,
                    religion: personalData.religion,

                    // Job
                    position: jobData.job_title,
                    employee_role: jobData.employee_role,
                    employee_type: jobData.employee_type,
                    contract_type: jobData.contract_type,
                    hire_date: jobData.hire_date,
                    status: jobData.status,
                    shift_id: jobData.shift_id || null,
                    employee_id: empCode,
                    school_id: schoolId,

                    // Financial
                    base_salary: financialData.base_salary,
                    bank_name: financialData.bank_name,
                    bank_account: financialData.bank_account,

                    // Contact
                    phone: contactData.phone,
                    phone_secondary: contactData.whatsapp_number,
                    email: contactData.email,
                    address: contactData.address,

                    // Emergency Contact
                    emergency_contact_name: contactData.emergency_contact_name || null,
                    emergency_contact_relation: contactData.emergency_contact_relation || null,
                    emergency_contact_phone: contactData.emergency_contact_phone || null,

                    // JSONB
                    details: detailsPayload
                }])
                .select()
                .single();

            if (empError) throw empError;
            const newEmployeeId = empData.id;

            // 3. Upload Documents
            if (documents.length > 0) {
                for (const doc of documents) {
                    const fileExt = doc.file.name.split('.').pop();
                    const filePath = `${newEmployeeId}/${Date.now()}_${doc.type}.${fileExt}`;

                    await supabase.from('employee_documents').insert([{
                        employee_id: newEmployeeId,
                        category_id: doc.categoryId || null,
                        document_type: doc.type,
                        file_name: doc.file.name,
                        file_path: filePath,
                        file_size: doc.file.size,
                        file_type: doc.file.type,
                        notes: "تم الرفع أثناء التسجيل"
                    }]);
                }
            }

            // 4. Log History
            await supabase.from('employment_history').insert([{
                employee_id: newEmployeeId,
                event_type: 'hiring',
                description: 'تعيين جديد',
                new_value: `الوظيفة: ${jobData.job_title}`,
                event_date: jobData.hire_date
            }]);

            toast.success("تم تسجيل الموظف بنجاح");
            navigate(`/hr/employees/${newEmployeeId}`);

        } catch (error: any) {
            console.error("Error creating employee:", error);
            toast.error(`حدث خطأ: ${error.message || 'فشل التسجيل'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="py-6 px-4">
                {/* Header */}
                <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                                <UserPlus className="h-10 w-10 text-blue-600" />
                                تسجيل موظف جديد
                            </h1>
                            <p className="text-gray-600 mb-3">
                                نظام تسجيل الموظفين الموحد - يرجى إدخال البيانات في الأقسام أدناه وحفظ كل قسم
                            </p>
                        </div>
                    </div>
                    {/* Navigation Anchors */}
                    <div className="flex flex-wrap gap-4 mt-4 text-sm font-semibold border-t border-blue-200/50 pt-4">
                        <button onClick={() => document.getElementById('personal-data')?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-1 text-blue-700 hover:bg-blue-100 px-3 py-1 rounded transition">
                            👤 البيانات الشخصية
                        </button>
                        <button onClick={() => document.getElementById('job-data')?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-1 text-purple-700 hover:bg-purple-100 px-3 py-1 rounded transition">
                            💼 البيانات الوظيفية
                        </button>
                        <button onClick={() => document.getElementById('financial-data')?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-1 text-green-700 hover:bg-green-100 px-3 py-1 rounded transition">
                            💰 البيانات المالية
                        </button>
                        <button onClick={() => document.getElementById('contact-data')?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-1 text-red-700 hover:bg-red-100 px-3 py-1 rounded transition">
                            📞 الاتصال
                        </button>
                        <button onClick={() => document.getElementById('documents-data')?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-1 text-orange-700 hover:bg-orange-100 px-3 py-1 rounded transition">
                            📂 المستندات
                        </button>
                    </div>
                </div>

                {/* Sections Grid: 2 Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Section 1: Personal Data */}
                    <div id="personal-data" className="scroll-mt-24">
                        <Card className="border-blue-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-1 h-full bg-blue-500" />
                            <CardHeader className="bg-blue-50/30 pb-4">
                                <CardTitle className="flex items-center gap-2 text-xl text-blue-800">
                                    <User className="h-5 w-5" />
                                    البيانات الشخصية
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <PersonalDataForm data={personalData} onChange={handlePersonalChange} />
                                <div className="flex justify-end border-t pt-4 mt-4">
                                    {sectionStatus.personal ? (
                                        <Button variant="ghost" className="text-green-600 pointer-events-none hover:bg-green-50">
                                            <CheckCircle className="w-4 h-4 ml-2" /> تم الحفظ
                                        </Button>
                                    ) : (
                                        <Button onClick={handleSavePersonal} className="bg-blue-600 hover:bg-blue-700">
                                            <Save className="w-4 h-4 ml-2" /> حفظ البيانات الشخصية
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Section 2: Job Data */}
                    <div id="job-data" className="scroll-mt-24">
                        <Card className="border-purple-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-1 h-full bg-purple-500" />
                            <CardHeader className="bg-purple-50/30 pb-4">
                                <CardTitle className="flex items-center gap-2 text-xl text-purple-800">
                                    <Briefcase className="h-5 w-5" />
                                    البيانات الوظيفية
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <JobDataForm data={jobData} onChange={handleJobChange} />
                                <div className="mt-6 pt-6 border-t">
                                    <EmployeeRoleSpecificFields
                                        employeeRole={jobData.employee_role}
                                        data={roleSpecificData}
                                        onChange={handleRoleSpecificChange}
                                    />
                                </div>
                                <div className="flex justify-end border-t pt-4 mt-4">
                                    {sectionStatus.job ? (
                                        <Button variant="ghost" className="text-green-600 pointer-events-none hover:bg-green-50">
                                            <CheckCircle className="w-4 h-4 ml-2" /> تم الحفظ
                                        </Button>
                                    ) : (
                                        <Button onClick={handleSaveJob} className="bg-purple-600 hover:bg-purple-700">
                                            <Save className="w-4 h-4 ml-2" /> حفظ البيانات الوظيفية
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Section 3: Financial Data */}
                    <div id="financial-data" className="scroll-mt-24">
                        <Card className="border-green-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-1 h-full bg-green-500" />
                            <CardHeader className="bg-green-50/30 pb-4">
                                <CardTitle className="flex items-center gap-2 text-xl text-green-800">
                                    <Wallet className="h-5 w-5" />
                                    البيانات المالية
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <FinancialDataForm
                                    data={financialData}
                                    onChange={handleFinancialChange}
                                    isReadOnly={false}
                                />
                                <div className="flex justify-end border-t pt-4 mt-4">
                                    {sectionStatus.financial ? (
                                        <Button variant="ghost" className="text-green-600 pointer-events-none hover:bg-green-50">
                                            <CheckCircle className="w-4 h-4 ml-2" /> تم الحفظ
                                        </Button>
                                    ) : (
                                        <Button onClick={handleSaveFinancial} className="bg-green-600 hover:bg-green-700">
                                            <Save className="w-4 h-4 ml-2" /> حفظ البيانات المالية
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Section 4: Contact Data */}
                    <div id="contact-data" className="scroll-mt-24">
                        <Card className="border-red-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-1 h-full bg-red-500" />
                            <CardHeader className="bg-red-50/30 pb-4">
                                <CardTitle className="flex items-center gap-2 text-xl text-red-800">
                                    📞 بيانات الاتصال
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ContactDataForm
                                    data={{
                                        ...contactData,
                                        nationality: personalData.nationality
                                    }}
                                    onChange={handleContactChange}
                                />
                                <div className="flex justify-end border-t pt-4 mt-4">
                                    {sectionStatus.contact ? (
                                        <Button variant="ghost" className="text-green-600 pointer-events-none hover:bg-green-50">
                                            <CheckCircle className="w-4 h-4 ml-2" /> تم الحفظ
                                        </Button>
                                    ) : (
                                        <Button onClick={handleSaveContact} className="bg-red-600 hover:bg-red-700">
                                            <Save className="w-4 h-4 ml-2" /> حفظ بيانات الاتصال
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Section 5: Documents */}
                    <div id="documents-data" className="scroll-mt-24 md:col-span-2">
                        <DocumentsSection data={documents} onSave={handleDocumentsSave} />
                    </div>
                </div>

                {/* Submision Footer */}
                <div className="sticky bottom-4 z-10">
                    <div className="bg-white/90 backdrop-blur border shadow-xl rounded-xl p-4 flex items-center justify-between gap-4">
                        <div className="hidden md:block text-sm text-gray-500">
                            يرجى مراجعة كافة البيانات بدقة قبل التسجيل النهائي
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Button
                                onClick={() => navigate('/hr/employees')}
                                variant="outline"
                                className="flex-1 md:flex-none border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                                <X className="h-4 w-4 ml-2" />
                                إلغاء
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex-1 md:w-48 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
                            >
                                {isSubmitting ? "جاري التسجيل..." : (
                                    <>
                                        <Save className="h-4 w-4 ml-2" />
                                        تسجيل الموظف
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
};

export default HRNewEmployee;
