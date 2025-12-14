/**
 * صفحة تسجيل موظف جديد - Multi-Step Form
 * نظام الموارد البشرية
 */

import { useState, useEffect } from 'react';
// Force rebuild
import { useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    User,
    Phone,
    MapPin,
    Briefcase,
    FileText,
    Wallet,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
    Save,
    Plus,
    Upload,
    Trash2,
    Eye,
    Loader2,
    AlertCircle,
    Calendar,
    Building2,
    CreditCard,
    UserCheck,
    Home,
    ChevronLeft,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { SmartPhoneInput } from '@/components/ui/SmartPhoneInput';
import { STUDENT_OPTIONS } from '@/data/studentConstants';
import { Checkbox } from '@/components/ui/checkbox';

// الخطوات
const steps = [
    { id: 1, title: 'البيانات الأساسية', icon: User, description: 'البيانات الشخصية للموظف' },
    { id: 2, title: 'بيانات الاتصال', icon: Phone, description: 'أرقام الهواتف والبريد' },
    { id: 3, title: 'بيانات السكن', icon: MapPin, description: 'العنوان والموقع' },
    { id: 4, title: 'الوظيفة والتعيين', icon: Briefcase, description: 'بيانات العمل والعقد' },
    { id: 5, title: 'الخبرات والمؤهلات', icon: Building2, description: 'الخبرات السابقة والدورات' },
    { id: 6, title: 'المستندات', icon: FileText, description: 'الأوراق المطلوبة' },
    { id: 7, title: 'الملف المالي', icon: Wallet, description: 'الراتب والحساب البنكي' },
    { id: 8, title: 'المراجعة', icon: CheckCircle, description: 'مراجعة وتأكيد' },
];

// المحافظات والمدن المصرية المرتبطة - جميع محافظات مصر الـ 27
const governoratesWithCities: Record<string, string[]> = {
    // القاهرة الكبرى
    'القاهرة': ['مدينة نصر', 'المعادي', 'حلوان', 'مصر الجديدة', 'شبرا', 'عين شمس', 'المقطم', 'التجمع الخامس', 'مدينة الرحاب', 'المرج', 'السلام', 'النزهة', 'الزيتون'],
    'الجيزة': ['الدقي', 'المهندسين', 'الهرم', '6 أكتوبر', 'الشيخ زايد', 'فيصل', 'العجوزة', 'إمبابة', 'بولاق الدكرور', 'أوسيم', 'كرداسة', 'البدرشين'],
    'القليوبية': ['بنها', 'شبرا الخيمة', 'قليوب', 'القناطر الخيرية', 'الخانكة', 'طوخ', 'كفر شكر', 'العبور'],

    // الإسكندرية والساحل الشمالي
    'الإسكندرية': ['سموحة', 'ستانلي', 'المنتزه', 'العامرية', 'برج العرب', 'محرم بك', 'سيدي جابر', 'الرمل', 'كرموز', 'العجمي'],
    'مطروح': ['مرسى مطروح', 'سيوة', 'الضبعة', 'الحمام', 'العلمين', 'النجيلة', 'براني', 'سيدي براني'],
    'البحيرة': ['دمنهور', 'كفر الدوار', 'أبو حمص', 'إيتاي البارود', 'المحمودية', 'رشيد', 'إدكو', 'الدلنجات'],

    // الدلتا
    'الدقهلية': ['المنصورة', 'طلخا', 'ميت غمر', 'دكرنس', 'أجا', 'منية النصر', 'السنبلاوين', 'شربين', 'بلقاس'],
    'الشرقية': ['الزقازيق', 'العاشر من رمضان', 'بلبيس', 'منيا القمح', 'أبو كبير', 'فاقوس', 'ههيا', 'أبو حماد', 'ديرب نجم'],
    'الغربية': ['طنطا', 'المحلة الكبرى', 'كفر الزيات', 'زفتى', 'السنطة', 'قطور', 'بسيون', 'سمنود'],
    'المنوفية': ['شبين الكوم', 'مدينة السادات', 'منوف', 'أشمون', 'قويسنا', 'الباجور', 'تلا', 'بركة السبع', 'الشهداء'],
    'كفر الشيخ': ['كفر الشيخ', 'دسوق', 'فوه', 'بيلا', 'مطوبس', 'البرلس', 'الرياض', 'الحامول', 'سيدي سالم'],
    'دمياط': ['دمياط', 'رأس البر', 'فارسكور', 'كفر سعد', 'الزرقا', 'السرو', 'كفر البطيخ'],

    // القناة وسيناء
    'بورسعيد': ['بورسعيد', 'بور فؤاد', 'العرب', 'الزهور', 'الضواحي', 'المناخ'],
    'الإسماعيلية': ['الإسماعيلية', 'القنطرة شرق', 'القنطرة غرب', 'فايد', 'أبو صوير', 'التل الكبير'],
    'السويس': ['السويس', 'الأربعين', 'عتاقة', 'الجناين', 'فيصل'],
    'شمال سيناء': ['العريش', 'رفح', 'الشيخ زويد', 'نخل', 'الحسنة', 'بئر العبد'],
    'جنوب سيناء': ['شرم الشيخ', 'دهب', 'نويبع', 'طابا', 'سانت كاترين', 'رأس سدر', 'الطور', 'أبو زنيمة'],

    // الصعيد
    'بني سويف': ['بني سويف', 'الواسطى', 'ناصر', 'ببا', 'الفشن', 'سمسطا', 'إهناسيا'],
    'الفيوم': ['الفيوم', 'سنورس', 'إطسا', 'طامية', 'أبشواي', 'يوسف الصديق'],
    'المنيا': ['المنيا', 'ملوي', 'سمالوط', 'مغاغة', 'بني مزار', 'دير مواس', 'أبو قرقاص', 'مطاي'],
    'أسيوط': ['أسيوط', 'ديروط', 'منفلوط', 'القوصية', 'أبو تيج', 'أبنوب', 'الغنايم', 'صدفا', 'الفتح', 'البداري'],
    'سوهاج': ['سوهاج', 'أخميم', 'المراغة', 'طما', 'طهطا', 'جرجا', 'البلينا', 'المنشاة', 'ساقلتة', 'دار السلام'],
    'قنا': ['قنا', 'نجع حمادي', 'قوص', 'الوقف', 'دشنا', 'فرشوط', 'أبو تشت', 'قفط', 'نقادة'],
    'الأقصر': ['الأقصر', 'إسنا', 'أرمنت', 'القرنة', 'البياضية', 'الطود'],
    'أسوان': ['أسوان', 'كوم أمبو', 'دراو', 'إدفو', 'نصر النوبة', 'أبو سمبل'],

    // البحر الأحمر والوادي الجديد
    'البحر الأحمر': ['الغردقة', 'سفاجا', 'القصير', 'مرسى علم', 'الشلاتين', 'حلايب', 'رأس غارب'],
    'الوادي الجديد': ['الخارجة', 'الداخلة', 'الفرافرة', 'باريس', 'بلاط'],
};
const governorates = Object.keys(governoratesWithCities);

// الأقسام
const departments = ['التعليم', 'الإدارة', 'المالية', 'الأمن', 'النقل', 'الصيانة', 'التقنية', 'خدمات الطلاب', 'النظافة', 'خدمات أخري'];

// أنواع العقود
const contractTypes = ['دوام كامل', 'دوام جزئي', 'عقد مؤقت', 'أجر يومي', 'متعاقد'];

// حالة الموظف
const employeeStatuses = ['على رأس العمل', 'تحت التجربة', 'تحت التدريب', 'مؤقت'];

// المستندات المطلوبة
const requiredDocuments = [
    { id: 'birth_cert_original', name: 'أصل شهادة الميلاد', required: false },
    { id: 'qualification_original', name: 'أصل المؤهل الدراسي', required: false },
    { id: 'military_cert', name: 'أصل شهادة الخدمة العسكرية', required: false },
    { id: 'work_slip', name: 'كعب العمل', required: false },
    { id: 'criminal_record', name: 'صحيفة الحالة الجنائية', required: false },
    { id: 'insurance_print', name: 'الرقم التأميني (برنت تأمينات)', required: false },
    { id: 'personal_photos', name: '6 صور شخصية', required: false },
    { id: 'national_id_copy', name: 'صورة بطاقة الرقم القومي', required: false },
    { id: 'health_cert', name: 'الشهادة الصحية', required: false },
    { id: 'form_111', name: 'نموذج 111 (كشف طبي كامل)', required: false },
    { id: 'driver_license', name: 'صورة الرخصة (للسائقين)', required: false },
    { id: 'syndicate_card', name: 'كارنية النقابة (معلمين - مهندسين - محاسبين - محامين)', required: false },
    { id: 'profession_license', name: 'كارنية مزاولة المهنة / قياس المهارة', required: false },
];

type FieldType = 'text' | 'number' | 'date' | 'select' | 'textarea';

interface DepartmentField {
    name: string;
    label: string;
    type: FieldType;
    options?: string[];
    required?: boolean;
}

const DEPARTMENT_FIELDS: Record<string, DepartmentField[]> = {
    'التعليم': [
        { name: 'teaching_subject', label: 'مادة التدريس', type: 'select', options: ['لغة عربية', 'لغة إنجليزية', 'رياضيات', 'علوم', 'دراسات', 'حاسب آلي', 'فرنسي', 'ألماني', 'دين', 'تربية فنية', 'تربية موسيقية'] },
        { name: 'teaching_stage', label: 'المرحلة الدراسية', type: 'select', options: ['رياض أطفال', 'ابتدائي', 'إعدادي', 'ثانوي'] },
        { name: 'license_number', label: 'رقم ترخيص مزاولة المهنة', type: 'text' },
        { name: 'syndicate_no', label: 'رقم العضوية بالنقابة', type: 'text' }
    ],
    'النقل': [
        { name: 'license_degree', label: 'درجة رخصة القيادة', type: 'select', options: ['درجة أولى', 'درجة ثانية', 'درجة ثالثة', 'خاصة', 'مهنية'] },
        { name: 'license_expiry', label: 'تاريخ انتهاء الرخصة', type: 'date' },
        { name: 'traffic_unit', label: 'وحدة المرور', type: 'text' }
    ],
    'الأمن': [
        { name: 'military_status', label: 'الموقف من التجنيد', type: 'select', options: ['أدى الخدمة', 'معفى نهائي', 'مؤجل', 'لم يصبه الدور'] },
        { name: 'height', label: 'الطول (سم)', type: 'number' },
        { name: 'weight', label: 'الوزن (كجم)', type: 'number' },
        { name: 'security_cert', label: 'شهادة حراسة منشآت', type: 'select', options: ['نعم', 'لا'] }
    ],
    'الصيانة': [
        { name: 'technician_specialty', label: 'التخصص الفني', type: 'select', options: ['كهرباء', 'سباكة', 'نجارة', 'تكييف وتبريد', 'نقاشة', 'حدادة', 'عام'] },
        { name: 'experience_years', label: 'سنوات الخبرة العملية', type: 'number' }
    ],
    'التقنية': [
        { name: 'tech_specialty', label: 'التخصص التقني', type: 'select', options: ['شبكات', 'دعم فني', 'برمجة', 'أمن معلومات', 'كاميرات مراقبة'] },
        { name: 'eval_level', label: 'مستوى التقييم الفني', type: 'select', options: ['مبتدئ', 'متوسط', 'خبير'] }
    ],
    'المالية': [
        { name: 'financial_system', label: 'الأنظمة المالية التي يجيدها', type: 'text' },
        { name: 'accounting_cert', label: 'شهادات محاسبية', type: 'text' }
    ],
    'خدمات الطلاب': [
        { name: 'social_work_role', label: 'التخصص', type: 'select', options: ['أخصائي اجتماعي', 'أخصائي نفسي', 'مشرف دور'] }
    ],
    'النظافة': [
        { name: 'cleaning_area', label: 'منطقة العمل المفضلة', type: 'select', options: ['فصول', 'ممرات', 'مكاتب', 'حوش', 'حمامات'] }
    ],
    'خدمات أخري': [
        { name: 'service_role', label: 'الدور المحدد', type: 'text' }
    ],
    'الإدارة': [
        { name: 'managment_role', label: 'الدور الإداري', type: 'text' }
    ]
};

interface Experience {
    company: string;
    role: string;
    start_date: string;
    end_date: string;
    description: string;
}

interface Course {
    name: string;
    organization: string;
    date: string;
    duration: string;
}

interface FormData {
    // البيانات الأساسية
    full_name_ar: string;
    full_name_en: string;
    national_id: string;
    birth_date: string;
    gender: string;
    marital_status: string;
    nationality: string;
    religion: string;
    // بيانات الاتصال
    phone: string;
    phone_secondary: string;
    email: string;
    whatsapp: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    // بيانات السكن
    governorate: string;
    city: string;
    district: string;
    address_detail: string;

    apartment_no: string;
    floor_no: string;
    // الوظيفة

    department: string;
    contract_type: string;
    hire_date: string;
    shift_type: string;
    direct_manager: string;
    employee_code: string;
    employee_status: string;
    working_days: string;
    working_hours: string;
    contract_end_date: string;
    job_notes: string;
    probation_period: string;
    // المالية
    base_salary: number;
    incentives: number;
    housing_allowance: number;
    transport_allowance: number;
    work_nature_allowance: number;
    insurance_percentage: number;
    insurance_number: string;
    bank_account: string;
    bank_name: string;
    account_type: string;
    // المستندات
    documents: Record<string, { uploaded: boolean; file?: File; expiry_date?: string }>;
    dynamic_data: Record<string, any>;
    previous_experience: Experience[];
    courses: Course[];
}

const initialFormData: FormData = {
    full_name_ar: '', full_name_en: '', national_id: '', birth_date: '', gender: 'ذكر',
    marital_status: 'أعزب', nationality: 'مصري', religion: 'مسلم',
    phone: '', phone_secondary: '', email: '', whatsapp: '', emergency_contact_name: '', emergency_contact_phone: '',
    governorate: '', city: '', district: '', address_detail: '', apartment_no: '', floor_no: '',
    department: '', contract_type: 'دوام كامل', hire_date: new Date().toISOString().split('T')[0],
    shift_type: 'صباحي', direct_manager: '', employee_code: '', employee_status: 'على رأس العمل',
    working_days: '5', working_hours: '8', contract_end_date: '', job_notes: '', probation_period: '',
    base_salary: 0, incentives: 0, housing_allowance: 0, transport_allowance: 0, work_nature_allowance: 0,
    insurance_percentage: 14, insurance_number: '', bank_account: '', bank_name: '', account_type: 'جاري',
    documents: {}, dynamic_data: {}, previous_experience: [], courses: [],
};

const HRNewEmployee = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
    const [netSalary, setNetSalary] = useState(0);

    // حساب العمر من الرقم القومي
    useEffect(() => {
        if (formData.national_id.length === 14) {
            const century = formData.national_id[0] === '2' ? '19' : '20';
            const year = century + formData.national_id.substring(1, 3);
            const month = formData.national_id.substring(3, 5);
            const day = formData.national_id.substring(5, 7);
            const birthDate = new Date(`${year}-${month}-${day}`);
            const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
            setCalculatedAge(age);
            if (!formData.birth_date) {
                handleChange('birth_date', `${year}-${month}-${day}`);
            }
        }
    }, [formData.national_id]);

    // حساب صافي الراتب
    useEffect(() => {
        const gross = formData.base_salary + formData.incentives + formData.housing_allowance + formData.transport_allowance + formData.work_nature_allowance;
        const insurance = (formData.base_salary * formData.insurance_percentage) / 100;
        setNetSalary(gross - insurance);
    }, [formData.base_salary, formData.incentives, formData.housing_allowance, formData.transport_allowance, formData.work_nature_allowance, formData.insurance_percentage]);

    const handleChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const handleDynamicDataChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            dynamic_data: { ...(prev.dynamic_data || {}), [field]: value }
        }));
    };

    const handleDocumentUpload = (docId: string, file: File) => {
        setFormData(prev => ({
            ...prev,
            documents: { ...prev.documents, [docId]: { uploaded: true, file } }
        }));
    };

    const handleDocumentRemove = (docId: string) => {
        setFormData(prev => ({
            ...prev,
            documents: { ...prev.documents, [docId]: { uploaded: false } }
        }));
    };

    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};

        switch (step) {
            case 1:
                if (!formData.full_name_ar) newErrors.full_name_ar = 'هذا الحقل مطلوب';
                if (!formData.national_id) newErrors.national_id = 'هذا الحقل مطلوب';
                else if (formData.national_id.length !== 14) newErrors.national_id = 'الرقم القومي يجب أن يكون 14 رقم';
                if (!formData.birth_date) newErrors.birth_date = 'هذا الحقل مطلوب';
                break;
            case 2:
                if (!formData.phone) newErrors.phone = 'هذا الحقل مطلوب';
                if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'البريد الإلكتروني غير صحيح';
                break;
            case 3:
                if (!formData.governorate) newErrors.governorate = 'هذا الحقل مطلوب';
                if (!formData.address_detail) newErrors.address_detail = 'هذا الحقل مطلوب';
                break;
            case 4:
                if (!formData.department) newErrors.department = 'هذا الحقل مطلوب';
                if (!formData.hire_date) newErrors.hire_date = 'هذا الحقل مطلوب';
                break;
            case 5:
                // الخبرات والمؤهلات - اختياري
                break;
            case 6:
                const missingDocs = requiredDocuments.filter(d => d.required && !formData.documents[d.id]?.uploaded);
                if (missingDocs.length > 0) newErrors.documents = `المستندات الناقصة: ${missingDocs.map(d => d.name).join(', ')}`;
                break;
            case 7:
                if (!formData.base_salary || formData.base_salary <= 0) newErrors.base_salary = 'الراتب مطلوب';
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        validateStep(currentStep);
        setCurrentStep(prev => Math.min(prev + 1, 8));
    };

    const handlePrevious = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const generateEmployeeCode = () => {
        const year = new Date().getFullYear().toString().slice(-2);
        const random = Math.floor(1000 + Math.random() * 9000);
        return `EMP-${year}${random}`;
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Derive employee type
            const isTeacher = formData.department === 'التعليم';
            const isWorker = ['النقل', 'الصيانة', 'النظافة', 'خدمات أخري'].includes(formData.department);
            const employeeType = isTeacher ? 'معلم' : (isWorker ? 'عامل' : 'إداري');

            const employeeData = {
                employee_id: generateEmployeeCode(),
                full_name: formData.full_name_ar,
                national_id: formData.national_id,
                employee_type: employeeType,
                position: formData.dynamic_data?.['_role'] || formData.department,
                department: formData.department,
                phone: formData.phone,
                email: formData.email,
                address: formData.address_detail,
                hire_date: formData.hire_date,
                contract_type: formData.contract_type,
                base_salary: formData.base_salary,
                bank_account: formData.bank_account,
                bank_name: formData.bank_name,
                is_active: formData.employee_status === 'على رأس العمل',
                notes: formData.job_notes,

                // New Schema Columns
                birth_date: formData.birth_date,
                gender: formData.gender,
                marital_status: formData.marital_status,
                nationality: formData.nationality,
                religion: formData.religion,

                // JSONB Details
                details: {
                    full_name_en: formData.full_name_en,
                    phone_secondary: formData.phone_secondary,
                    whatsapp: formData.whatsapp,
                    emergency_contact: {
                        name: formData.emergency_contact_name,
                        phone: formData.emergency_contact_phone
                    },
                    address_details: {
                        governorate: formData.governorate,
                        city: formData.city,
                        district: formData.district,
                        apartment_no: formData.apartment_no,
                        floor_no: formData.floor_no
                    },
                    job_details: {
                        shift_type: formData.shift_type,
                        direct_manager: formData.direct_manager,
                        working_days: formData.working_days,
                        working_hours: formData.working_hours,
                        contract_end_date: formData.contract_end_date,
                        probation_period: formData.probation_period,
                        status_text: formData.employee_status
                    },
                    financial_details: {
                        incentives: formData.incentives,
                        housing_allowance: formData.housing_allowance,
                        transport_allowance: formData.transport_allowance,
                        work_nature_allowance: formData.work_nature_allowance,
                        insurance_percentage: formData.insurance_percentage,
                        insurance_number: formData.insurance_number,
                        account_type: formData.account_type
                    },
                    documents: formData.documents,
                    dynamic_data: formData.dynamic_data,
                    previous_experience: formData.previous_experience,
                    courses: formData.courses
                },
                created_at: new Date().toISOString(),
            };

            const { data, error } = await supabase.from('employees').insert([employeeData]).select().single();
            if (error) throw error;

            toast.success('تم تسجيل الموظف بنجاح!');
            navigate(`/hr/employees/${data.id}`);
        } catch (error: any) {
            toast.error(error.message || 'فشل في تسجيل الموظف');
        } finally {
            setLoading(false);
            setShowConfirmDialog(false);
        }
    };

    const handleSaveDraft = () => {
        localStorage.setItem('employee_draft', JSON.stringify(formData));
        toast.success('تم حفظ المسودة');
    };

    const handleSaveAndAddNew = async () => {
        setLoading(true);
        try {
            // Derive employee type
            const isTeacher = formData.department === 'التعليم';
            const isWorker = ['النقل', 'الصيانة', 'النظافة', 'خدمات أخري'].includes(formData.department);
            const employeeType = isTeacher ? 'معلم' : (isWorker ? 'عامل' : 'إداري');

            const employeeData = {
                employee_id: generateEmployeeCode(),
                full_name: formData.full_name_ar,
                national_id: formData.national_id,
                employee_type: employeeType,
                position: formData.dynamic_data?.['_role'] || formData.department,
                department: formData.department,
                phone: formData.phone,
                email: formData.email,
                address: formData.address_detail,
                hire_date: formData.hire_date,
                contract_type: formData.contract_type,
                base_salary: formData.base_salary,
                bank_account: formData.bank_account,
                bank_name: formData.bank_name,
                is_active: formData.employee_status === 'على رأس العمل',
                notes: formData.job_notes,
                birth_date: formData.birth_date,
                gender: formData.gender,
                marital_status: formData.marital_status,
                nationality: formData.nationality,
                religion: formData.religion,
                details: {
                    full_name_en: formData.full_name_en,
                    phone_secondary: formData.phone_secondary,
                    whatsapp: formData.whatsapp,
                    emergency_contact: { name: formData.emergency_contact_name, phone: formData.emergency_contact_phone },
                    address_details: { governorate: formData.governorate, city: formData.city, district: formData.district, apartment_no: formData.apartment_no, floor_no: formData.floor_no },
                    job_details: { shift_type: formData.shift_type, direct_manager: formData.direct_manager, working_days: formData.working_days, working_hours: formData.working_hours, contract_end_date: formData.contract_end_date, probation_period: formData.probation_period, status_text: formData.employee_status },
                    financial_details: { incentives: formData.incentives, housing_allowance: formData.housing_allowance, transport_allowance: formData.transport_allowance, work_nature_allowance: formData.work_nature_allowance, insurance_percentage: formData.insurance_percentage, insurance_number: formData.insurance_number, account_type: formData.account_type },
                    documents: formData.documents,
                    dynamic_data: formData.dynamic_data,
                    previous_experience: formData.previous_experience,
                    courses: formData.courses
                },
                created_at: new Date().toISOString(),
            };
            const { error } = await supabase.from('employees').insert([employeeData]);
            if (error) throw error;
            toast.success('تم تسجيل الموظف بنجاح! يمكنك إضافة موظف جديد');
            setFormData(initialFormData);
            setCurrentStep(1);
        } catch (error: any) {
            toast.error(error.message || 'فشل في تسجيل الموظف');
        } finally {
            setLoading(false);
        }
    };

    // تنسيق رقم الهاتف للتنسيق الدولي
    const formatPhoneNumber = (phone: string): string => {
        if (phone.startsWith('01') && phone.length === 11) {
            return '+2' + phone;
        }
        return phone;
    };

    const progress = (currentStep / 8) * 100;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header with Breadcrumb */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Link to="/hr/employees" className="hover:text-blue-600">الموظفين</Link>
                        <ChevronLeft className="h-4 w-4" />
                        <span className="text-gray-900 font-medium">تسجيل موظف جديد</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                                    <User className="h-7 w-7 text-white" />
                                </div>
                                تسجيل موظف جديد
                            </h1>
                            <p className="text-gray-500 mt-1">إضافة موظف جديد إلى نظام الموارد البشرية</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => navigate('/hr/employees')}>
                                <ArrowRight className="h-4 w-4 ml-2" />
                                رجوع
                            </Button>
                            <Button variant="outline" onClick={handleSaveDraft}>
                                <Save className="h-4 w-4 ml-2" />
                                حفظ مسودة
                            </Button>
                            <Button variant="outline" onClick={handleSaveAndAddNew} className="bg-green-50 text-green-700 border-green-300 hover:bg-green-100">
                                <Plus className="h-4 w-4 ml-2" />
                                حفظ وإضافة جديد
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <Card className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-600">التقدم في التسجيل</span>
                        <span className="text-sm font-bold text-blue-600">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </Card>

                {/* Steps Navigation */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {steps.map((step) => {
                        const isActive = step.id === currentStep;
                        const isCompleted = step.id < currentStep;
                        return (
                            <button
                                key={step.id}
                                onClick={() => setCurrentStep(step.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg' :
                                    isCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                                    }`}
                            >
                                {isCompleted ? <CheckCircle className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                                <span className="font-medium">{step.title}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Step Content */}
                <Card className="p-6">
                    <CardHeader className="px-0 pt-0">
                        <div className="flex items-center gap-3">
                            {(() => {
                                const StepIcon = steps[currentStep - 1].icon;
                                return (
                                    <div className="p-3 bg-blue-100 rounded-xl">
                                        <StepIcon className="h-6 w-6 text-blue-600" />
                                    </div>
                                );
                            })()}
                            <div>
                                <CardTitle className="text-xl">{steps[currentStep - 1].title}</CardTitle>
                                <CardDescription>{steps[currentStep - 1].description}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <Separator className="my-4" />
                    <CardContent className="px-0">
                        {/* Step 1: البيانات الأساسية */}
                        {currentStep === 1 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>الاسم الرباعي *</Label>
                                    <Input value={formData.full_name_ar} onChange={e => handleChange('full_name_ar', e.target.value)} placeholder="أدخل الاسم الرباعي" className={errors.full_name_ar ? 'border-red-500' : ''} />
                                    {errors.full_name_ar && <p className="text-red-500 text-sm">{errors.full_name_ar}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>الرقم القومي *</Label>
                                    <Input value={formData.national_id} onChange={e => handleChange('national_id', e.target.value.replace(/\D/g, '').slice(0, 14))} placeholder="00000000000000" maxLength={14} className={errors.national_id ? 'border-red-500' : ''} />
                                    {errors.national_id && <p className="text-red-500 text-sm">{errors.national_id}</p>}
                                    {calculatedAge && <Badge className="bg-blue-100 text-blue-800">العمر: {calculatedAge} سنة</Badge>}
                                </div>
                                <div className="space-y-2">
                                    <Label>تاريخ الميلاد *</Label>
                                    <Input type="date" value={formData.birth_date} onChange={e => handleChange('birth_date', e.target.value)} className={errors.birth_date ? 'border-red-500' : ''} />
                                    {errors.birth_date && <p className="text-red-500 text-sm">{errors.birth_date}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>النوع</Label>
                                    <Select value={formData.gender} onValueChange={v => handleChange('gender', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ذكر">ذكر</SelectItem>
                                            <SelectItem value="أنثى">أنثى</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>الحالة الاجتماعية</Label>
                                    <Select value={formData.marital_status} onValueChange={v => handleChange('marital_status', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="أعزب">أعزب</SelectItem>
                                            <SelectItem value="متزوج">متزوج</SelectItem>
                                            <SelectItem value="مطلق">مطلق</SelectItem>
                                            <SelectItem value="أرمل">أرمل</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>الجنسية</Label>
                                    <Select value={formData.nationality} onValueChange={v => handleChange('nationality', v)}>
                                        <SelectTrigger><SelectValue placeholder="اختر الجنسية" /></SelectTrigger>
                                        <SelectContent>
                                            {STUDENT_OPTIONS.nationality.map(nat => (
                                                <SelectItem key={nat} value={nat}>{nat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>الديانة</Label>
                                    <Select value={formData.religion} onValueChange={v => handleChange('religion', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="مسلم">مسلم</SelectItem>
                                            <SelectItem value="مسيحي">مسيحي</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {/* Step 2: بيانات الاتصال */}
                        {currentStep === 2 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <SmartPhoneInput
                                        id="employee_phone"
                                        label="رقم الهاتف الرئيسي"
                                        value={formData.phone}
                                        onChange={(val) => handleChange('phone', val)}
                                        nationality={formData.nationality}
                                        required
                                        error={errors.phone}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <SmartPhoneInput
                                        id="employee_phone_secondary"
                                        label="رقم هاتف إضافي"
                                        value={formData.phone_secondary}
                                        onChange={(val) => handleChange('phone_secondary', val)}
                                        nationality={formData.nationality}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>البريد الإلكتروني</Label>
                                    <Input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} placeholder="email@example.com" dir="ltr" className={errors.email ? 'border-red-500' : ''} />
                                    {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label>رقم الواتساب</Label>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="whatsapp_same_as_phone"
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        handleChange('whatsapp', formData.phone);
                                                    }
                                                }}
                                                disabled={!formData.phone}
                                            />
                                            <Label htmlFor="whatsapp_same_as_phone" className="text-xs text-blue-600 cursor-pointer">
                                                نفس رقم الهاتف
                                            </Label>
                                        </div>
                                    </div>
                                    <SmartPhoneInput
                                        id="employee_whatsapp"
                                        label=""
                                        value={formData.whatsapp}
                                        onChange={(val) => handleChange('whatsapp', val)}
                                        nationality={formData.nationality}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>اسم جهة اتصال الطوارئ</Label>
                                    <Input value={formData.emergency_contact_name} onChange={e => handleChange('emergency_contact_name', e.target.value)} placeholder="اسم أقرب الأقارب" />
                                </div>
                                <div className="space-y-2">
                                    <SmartPhoneInput
                                        id="employee_emergency_phone"
                                        label="رقم هاتف الطوارئ"
                                        value={formData.emergency_contact_phone}
                                        onChange={(val) => handleChange('emergency_contact_phone', val)}
                                        nationality={formData.nationality}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 3: بيانات السكن */}
                        {currentStep === 3 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>المحافظة *</Label>
                                    <Select value={formData.governorate} onValueChange={v => handleChange('governorate', v)}>
                                        <SelectTrigger className={errors.governorate ? 'border-red-500' : ''}><SelectValue placeholder="اختر المحافظة" /></SelectTrigger>
                                        <SelectContent>{governorates.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                                    </Select>
                                    {errors.governorate && <p className="text-red-500 text-sm">{errors.governorate}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>المدينة</Label>
                                    <Select value={formData.city} onValueChange={v => handleChange('city', v)} disabled={!formData.governorate}>
                                        <SelectTrigger><SelectValue placeholder={formData.governorate ? "اختر المدينة" : "اختر المحافظة أولاً"} /></SelectTrigger>
                                        <SelectContent>
                                            {formData.governorate && governoratesWithCities[formData.governorate]?.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>المنطقة</Label>
                                    <Input value={formData.district} onChange={e => handleChange('district', e.target.value)} placeholder="المنطقة / الحي" />
                                </div>
                                <div className="space-y-2">
                                    <Label>رقم الشقة</Label>
                                    <Input value={formData.apartment_no} onChange={e => handleChange('apartment_no', e.target.value)} placeholder="رقم الشقة" />
                                </div>
                                <div className="space-y-2">
                                    <Label>الدور</Label>
                                    <Input value={formData.floor_no} onChange={e => handleChange('floor_no', e.target.value)} placeholder="رقم الدور" />
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <Label>العنوان بالتفصيل *</Label>
                                    <Textarea value={formData.address_detail} onChange={e => handleChange('address_detail', e.target.value)} placeholder="العنوان التفصيلي الكامل" rows={3} className={errors.address_detail ? 'border-red-500' : ''} />
                                    {errors.address_detail && <p className="text-red-500 text-sm">{errors.address_detail}</p>}
                                </div>
                            </div>
                        )}

                        {/* Step 4: الوظيفة والتعيين */}
                        {currentStep === 4 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>القسم *</Label>
                                    <Select value={formData.department} onValueChange={v => handleChange('department', v)}>
                                        <SelectTrigger className={errors.department ? 'border-red-500' : ''}><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                                        <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                    </Select>
                                    {errors.department && <p className="text-red-500 text-sm">{errors.department}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>نوع العقد</Label>
                                    <Select value={formData.contract_type} onValueChange={v => handleChange('contract_type', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{contractTypes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>تاريخ التعيين *</Label>
                                    <Input type="date" value={formData.hire_date} onChange={e => handleChange('hire_date', e.target.value)} className={errors.hire_date ? 'border-red-500' : ''} />
                                    {errors.hire_date && <p className="text-red-500 text-sm">{errors.hire_date}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>حالة الموظف</Label>
                                    <Select value={formData.employee_status} onValueChange={v => handleChange('employee_status', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{employeeStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                {formData.employee_status === 'تحت التجربة' && (
                                    <div className="space-y-2">
                                        <Label>مدة فترة التجربة (بالأشهر)</Label>
                                        <Input type="number" value={formData.probation_period} onChange={e => handleChange('probation_period', e.target.value)} placeholder="3" />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label>نوع الوردية</Label>
                                    <Select value={formData.shift_type} onValueChange={v => handleChange('shift_type', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="صباحي">صباحي</SelectItem>
                                            <SelectItem value="مسائي">مسائي</SelectItem>
                                            <SelectItem value="مرن">مرن</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>أيام العمل الأسبوعية</Label>
                                    <Input type="number" value={formData.working_days} onChange={e => handleChange('working_days', e.target.value)} min="1" max="7" />
                                </div>
                                <div className="space-y-2">
                                    <Label>ساعات العمل اليومية</Label>
                                    <Input type="number" value={formData.working_hours} onChange={e => handleChange('working_hours', e.target.value)} min="1" max="12" />
                                </div>
                                <div className="space-y-2">
                                    <Label>تاريخ نهاية العقد</Label>
                                    <Input type="date" value={formData.contract_end_date} onChange={e => handleChange('contract_end_date', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>المدير المباشر</Label>
                                    <Input value={formData.direct_manager} onChange={e => handleChange('direct_manager', e.target.value)} placeholder="اسم المدير المباشر" />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label>ملاحظات وظيفية</Label>
                                    <Textarea value={formData.job_notes} onChange={e => handleChange('job_notes', e.target.value)} placeholder="ملاحظات إضافية..." rows={2} />
                                </div>
                            </div>
                        )}

                        {/* Step 5: الخبرات والمؤهلات (ديناميكي) */}
                        {currentStep === 5 && (
                            <div className="space-y-8">
                                {/* الحقول الخاصة بالقسم */}
                                {formData.department && DEPARTMENT_FIELDS[formData.department] && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Briefcase className="h-5 w-5 text-blue-600" />
                                            <h3 className="text-lg font-semibold text-gray-800">بيانات {formData.department} الخاصة</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-blue-50/50 rounded-xl border border-blue-100">
                                            {DEPARTMENT_FIELDS[formData.department].map(field => (
                                                <div key={field.name} className="space-y-2">
                                                    <Label>
                                                        {field.label}
                                                        {!field.required && <span className="text-gray-400 text-xs mr-2">(اختياري)</span>}
                                                    </Label>
                                                    {field.type === 'select' ? (
                                                        <Select
                                                            value={formData.dynamic_data?.[field.name] || ''}
                                                            onValueChange={v => handleDynamicDataChange(field.name, v)}
                                                        >
                                                            <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                                                            <SelectContent>
                                                                {field.options?.map(opt => (
                                                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <Input
                                                            type={field.type}
                                                            value={formData.dynamic_data?.[field.name] || ''}
                                                            onChange={e => handleDynamicDataChange(field.name, e.target.value)}
                                                            placeholder={field.label}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <Separator />

                                {/* الخبرات السابقة */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-5 w-5 text-purple-600" />
                                            <h3 className="text-lg font-semibold text-gray-800">الخبرات السابقة</h3>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const newExp = { company: '', role: '', start_date: '', end_date: '', description: '' };
                                                handleChange('previous_experience', [...(formData.previous_experience || []), newExp]);
                                            }}
                                            className="text-purple-600 border-purple-200 hover:bg-purple-50"
                                        >
                                            <Plus className="h-4 w-4 ml-2" /> إضافة خبرة
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        {formData.previous_experience?.map((exp, index) => (
                                            <Card key={index} className="p-4 border-dashed relative group">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute top-2 left-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => {
                                                        const newExps = [...formData.previous_experience];
                                                        newExps.splice(index, 1);
                                                        handleChange('previous_experience', newExps);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">المكان / الشركة</Label>
                                                        <Input
                                                            value={exp.company}
                                                            onChange={e => {
                                                                const newExps = [...formData.previous_experience];
                                                                newExps[index].company = e.target.value;
                                                                handleChange('previous_experience', newExps);
                                                            }}
                                                            placeholder="اسم المكان"
                                                            className="h-8"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">المسمى الوظيفي</Label>
                                                        <Input
                                                            value={exp.role}
                                                            onChange={e => {
                                                                const newExps = [...formData.previous_experience];
                                                                newExps[index].role = e.target.value;
                                                                handleChange('previous_experience', newExps);
                                                            }}
                                                            placeholder="الوظيفة"
                                                            className="h-8"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">من</Label>
                                                        <Input
                                                            type="date"
                                                            value={exp.start_date}
                                                            onChange={e => {
                                                                const newExps = [...formData.previous_experience];
                                                                newExps[index].start_date = e.target.value;
                                                                handleChange('previous_experience', newExps);
                                                            }}
                                                            className="h-8"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">إلى</Label>
                                                        <Input
                                                            type="date"
                                                            value={exp.end_date}
                                                            onChange={e => {
                                                                const newExps = [...formData.previous_experience];
                                                                newExps[index].end_date = e.target.value;
                                                                handleChange('previous_experience', newExps);
                                                            }}
                                                            className="h-8"
                                                        />
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                        {(!formData.previous_experience || formData.previous_experience.length === 0) && (
                                            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed">
                                                لا توجد خبرات سابقة مضافة
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Separator />

                                {/* الدورات التدريبية */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-orange-600" />
                                            <h3 className="text-lg font-semibold text-gray-800">الدورات والمؤهلات الإضافية</h3>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const newCourse = { name: '', organization: '', date: '', duration: '' };
                                                handleChange('courses', [...(formData.courses || []), newCourse]);
                                            }}
                                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                                        >
                                            <Plus className="h-4 w-4 ml-2" /> إضافة دورة
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        {formData.courses?.map((course, index) => (
                                            <Card key={index} className="p-4 border-dashed relative group">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute top-2 left-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => {
                                                        const newCourses = [...formData.courses];
                                                        newCourses.splice(index, 1);
                                                        handleChange('courses', newCourses);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">اسم الدورة / المؤهل</Label>
                                                        <Input
                                                            value={course.name}
                                                            onChange={e => {
                                                                const newCourses = [...formData.courses];
                                                                newCourses[index].name = e.target.value;
                                                                handleChange('courses', newCourses);
                                                            }}
                                                            placeholder="اسم الدورة"
                                                            className="h-8"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">الجهة المانحة</Label>
                                                        <Input
                                                            value={course.organization}
                                                            onChange={e => {
                                                                const newCourses = [...formData.courses];
                                                                newCourses[index].organization = e.target.value;
                                                                handleChange('courses', newCourses);
                                                            }}
                                                            placeholder="الجهة"
                                                            className="h-8"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">التاريخ</Label>
                                                        <Input
                                                            type="date"
                                                            value={course.date}
                                                            onChange={e => {
                                                                const newCourses = [...formData.courses];
                                                                newCourses[index].date = e.target.value;
                                                                handleChange('courses', newCourses);
                                                            }}
                                                            className="h-8"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">المدة / التفاصيل</Label>
                                                        <Input
                                                            value={course.duration}
                                                            onChange={e => {
                                                                const newCourses = [...formData.courses];
                                                                newCourses[index].duration = e.target.value;
                                                                handleChange('courses', newCourses);
                                                            }}
                                                            placeholder="مثال: 30 ساعة"
                                                            className="h-8"
                                                        />
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                        {(!formData.courses || formData.courses.length === 0) && (
                                            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed">
                                                لا توجد دورات مضافة
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 6: المستندات */}
                        {currentStep === 6 && (
                            <div className="space-y-4">
                                {errors.documents && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
                                        <AlertCircle className="h-5 w-5" />
                                        <span>{errors.documents}</span>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {requiredDocuments.map(doc => {
                                        const isUploaded = formData.documents[doc.id]?.uploaded;
                                        return (
                                            <Card key={doc.id} className={`p-4 transition-all ${isUploaded ? 'border-green-300 bg-green-50' : doc.required ? 'border-orange-300 bg-orange-50' : ''}`}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className={`h-5 w-5 ${isUploaded ? 'text-green-600' : 'text-gray-400'}`} />
                                                        <span className="font-medium">{doc.name}</span>
                                                    </div>
                                                    {doc.required && <Badge variant="outline" className="text-xs">مطلوب</Badge>}
                                                </div>
                                                {isUploaded ? (
                                                    <div className="flex items-center justify-between">
                                                        <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 ml-1" />تم الرفع</Badge>
                                                        <div className="flex gap-1">
                                                            <Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button>
                                                            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDocumentRemove(doc.id)}><Trash2 className="h-4 w-4" /></Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <label className="block">
                                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                                                            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                                            <span className="text-sm text-gray-500">اسحب أو اضغط للرفع</span>
                                                        </div>
                                                        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => e.target.files?.[0] && handleDocumentUpload(doc.id, e.target.files[0])} />
                                                    </label>
                                                )}
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Step 7: الملف المالي */}
                        {currentStep === 7 && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label>الراتب الأساسي *</Label>
                                        <Input type="number" value={formData.base_salary} onChange={e => handleChange('base_salary', +e.target.value)} placeholder="0" className={errors.base_salary ? 'border-red-500' : ''} />
                                        {errors.base_salary && <p className="text-red-500 text-sm">{errors.base_salary}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>الحوافز</Label>
                                        <Input type="number" value={formData.incentives} onChange={e => handleChange('incentives', +e.target.value)} placeholder="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>بدل السكن</Label>
                                        <Input type="number" value={formData.housing_allowance} onChange={e => handleChange('housing_allowance', +e.target.value)} placeholder="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>بدل الانتقال</Label>
                                        <Input type="number" value={formData.transport_allowance} onChange={e => handleChange('transport_allowance', +e.target.value)} placeholder="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>بدل طبيعة عمل</Label>
                                        <Input type="number" value={formData.work_nature_allowance} onChange={e => handleChange('work_nature_allowance', +e.target.value)} placeholder="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>نسبة التأمينات %</Label>
                                        <Input type="number" value={formData.insurance_percentage} onChange={e => handleChange('insurance_percentage', +e.target.value)} min="0" max="100" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>رقم التأمين</Label>
                                        <Input value={formData.insurance_number} onChange={e => handleChange('insurance_number', e.target.value)} placeholder="رقم التأمينات" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>اسم البنك</Label>
                                        <Input value={formData.bank_name} onChange={e => handleChange('bank_name', e.target.value)} placeholder="مثال: البنك الأهلي" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>رقم الحساب البنكي</Label>
                                        <Input value={formData.bank_account} onChange={e => handleChange('bank_account', e.target.value)} placeholder="IBAN" dir="ltr" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>نوع الحساب</Label>
                                        <Select value={formData.account_type} onValueChange={v => handleChange('account_type', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="جاري">حساب جاري</SelectItem>
                                                <SelectItem value="توفير">حساب توفير</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                {/* تنبيه للأرقام غير المنطقية */}
                                {formData.base_salary > 100000 && (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-800">
                                        <AlertCircle className="h-5 w-5" />
                                        <span>تنبيه: الراتب الأساسي مرتفع جداً ({formData.base_salary.toLocaleString()} ج.م). تحقق من صحة القيمة.</span>
                                    </div>
                                )}
                                {formData.insurance_percentage > 25 && (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-800">
                                        <AlertCircle className="h-5 w-5" />
                                        <span>تنبيه: نسبة التأمينات ({formData.insurance_percentage}%) أعلى من المعتاد.</span>
                                    </div>
                                )}
                                {/* ملخص الراتب */}
                                <Card className="p-6 bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
                                    <h3 className="text-lg font-bold text-emerald-800 mb-4 flex items-center gap-2"><Wallet className="h-5 w-5" />ملخص الراتب</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div><p className="text-sm text-gray-600">الإجمالي</p><p className="text-xl font-bold text-gray-900">{(formData.base_salary + formData.incentives + formData.housing_allowance + formData.transport_allowance + formData.work_nature_allowance).toLocaleString()} ج.م</p></div>
                                        <div><p className="text-sm text-gray-600">التأمينات</p><p className="text-xl font-bold text-red-600">-{((formData.base_salary * formData.insurance_percentage) / 100).toLocaleString()} ج.م</p></div>
                                        <div className="col-span-2"><p className="text-sm text-gray-600">صافي الراتب</p><p className="text-3xl font-bold text-emerald-600">{netSalary.toLocaleString()} ج.م</p></div>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {/* Step 8: المراجعة */}
                        {currentStep === 8 && (
                            <div className="space-y-6">
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-blue-800 flex items-center gap-2"><CheckCircle className="h-5 w-5" />راجع البيانات التالية قبل التأكيد</p>
                                </div>
                                {/* ملخص البيانات */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-bold flex items-center gap-2"><User className="h-5 w-5 text-blue-600" />البيانات الأساسية</h3>
                                            <Button size="sm" variant="ghost" onClick={() => setCurrentStep(1)}>تعديل</Button>
                                        </div>
                                        <div className="space-y-1 text-sm"><p><span className="text-gray-500">الاسم:</span> {formData.full_name_ar}</p><p><span className="text-gray-500">الرقم القومي:</span> {formData.national_id}</p><p><span className="text-gray-500">النوع:</span> {formData.gender} | {formData.marital_status}</p></div>
                                    </Card>
                                    <Card className="p-4">
                                        <div className="flex items-center justify-between mb-3"><h3 className="font-bold flex items-center gap-2"><Phone className="h-5 w-5 text-green-600" />الاتصال</h3><Button size="sm" variant="ghost" onClick={() => setCurrentStep(2)}>تعديل</Button></div>
                                        <div className="space-y-1 text-sm"><p><span className="text-gray-500">الهاتف:</span> {formData.phone}</p><p><span className="text-gray-500">البريد:</span> {formData.email || '-'}</p></div>
                                    </Card>
                                    <Card className="p-4">
                                        <div className="flex items-center justify-between mb-3"><h3 className="font-bold flex items-center gap-2"><MapPin className="h-5 w-5 text-orange-600" />السكن</h3><Button size="sm" variant="ghost" onClick={() => setCurrentStep(3)}>تعديل</Button></div>
                                        <div className="space-y-1 text-sm"><p><span className="text-gray-500">المحافظة:</span> {formData.governorate}</p><p><span className="text-gray-500">العنوان:</span> {formData.address_detail}</p></div>
                                    </Card>
                                    <Card className="p-4">
                                        <div className="flex items-center justify-between mb-3"><h3 className="font-bold flex items-center gap-2"><Briefcase className="h-5 w-5 text-purple-600" />الوظيفة</h3><Button size="sm" variant="ghost" onClick={() => setCurrentStep(4)}>تعديل</Button></div>
                                        <div className="space-y-1 text-sm"><p><span className="text-gray-500">القسم:</span> {formData.department}</p><p><span className="text-gray-500">التعيين:</span> {formData.hire_date}</p></div>
                                    </Card>
                                    <Card className="p-4">
                                        <div className="flex items-center justify-between mb-3"><h3 className="font-bold flex items-center gap-2"><FileText className="h-5 w-5 text-amber-600" />المستندات</h3><Button size="sm" variant="ghost" onClick={() => setCurrentStep(6)}>تعديل</Button></div>
                                        <div className="flex flex-wrap gap-2">{requiredDocuments.map(d => <Badge key={d.id} className={formData.documents[d.id]?.uploaded ? 'bg-green-100 text-green-800' : 'bg-gray-100'}>{d.name}</Badge>)}</div>
                                    </Card>
                                    <Card className="p-4">
                                        <div className="flex items-center justify-between mb-3"><h3 className="font-bold flex items-center gap-2"><Wallet className="h-5 w-5 text-emerald-600" />المالية</h3><Button size="sm" variant="ghost" onClick={() => setCurrentStep(7)}>تعديل</Button></div>
                                        <div className="space-y-1 text-sm"><p><span className="text-gray-500">الأساسي:</span> {formData.base_salary.toLocaleString()} ج.م</p><p><span className="text-gray-500">الصافي:</span> <span className="font-bold text-emerald-600">{netSalary.toLocaleString()} ج.م</span></p></div>
                                    </Card>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Navigation Buttons */}
                <div className="flex justify-between">
                    <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
                        <ArrowRight className="h-4 w-4 ml-2" />السابق
                    </Button>
                    {currentStep < 8 ? (
                        <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
                            التالي<ArrowLeft className="h-4 w-4 mr-2" />
                        </Button>
                    ) : (
                        <Button onClick={() => setShowConfirmDialog(true)} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="h-4 w-4 ml-2" />إنهاء التسجيل
                        </Button>
                    )}
                </div>

                {/* Confirm Dialog */}
                <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>تأكيد تسجيل الموظف</DialogTitle>
                            <DialogDescription>هل أنت متأكد من تسجيل هذا الموظف؟ سيتم إنشاء ملف رقمي كامل للموظف.</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>إلغاء</Button>
                            <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700">
                                {loading ? <><Loader2 className="h-4 w-4 animate-spin ml-2" />جاري التسجيل...</> : <><CheckCircle className="h-4 w-4 ml-2" />تأكيد التسجيل</>}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout >
    );
};

export default HRNewEmployee;
