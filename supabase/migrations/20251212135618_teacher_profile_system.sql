-- =============================================
-- نظام بروفايل المعلم الشامل - Teacher Profile System
-- مصمم بنفس معايير نظام بروفايل الطالب
-- =============================================

-- 1. TEACHERS TABLE - جدول المعلمين الرئيسي
CREATE TABLE IF NOT EXISTS teachers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- =============================================
    -- القسم الأول: البيانات الشخصية
    -- =============================================
    full_name_ar VARCHAR(255) NOT NULL,
    full_name_en VARCHAR(255),
    national_id VARCHAR(20) UNIQUE,
    date_of_birth DATE,
    place_of_birth VARCHAR(100),
    nationality VARCHAR(50) DEFAULT 'مصري',
    gender VARCHAR(10) DEFAULT 'ذكر',
    religion VARCHAR(20) DEFAULT 'مسلم',
    marital_status VARCHAR(20) DEFAULT 'أعزب',
    number_of_dependents INTEGER DEFAULT 0,
    
    -- بيانات الاتصال
    phone VARCHAR(20),
    phone_secondary VARCHAR(20),
    whatsapp_number VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    governorate VARCHAR(100),
    postal_code VARCHAR(20),
    
    -- =============================================
    -- القسم الثاني: البيانات الوظيفية
    -- =============================================
    employee_number VARCHAR(20) UNIQUE,
    educational_registration_number VARCHAR(50), -- رقم التسجيل التربوي
    hire_date DATE,
    contract_start_date DATE,
    contract_end_date DATE,
    contract_type VARCHAR(50) DEFAULT 'دائم', -- دائم، مؤقت، حر، استشاري
    employment_status VARCHAR(50) DEFAULT 'نشط', -- نشط، إجازة، موقوف، مستقيل، منتهي
    
    -- المؤهلات
    highest_qualification VARCHAR(100), -- بكالوريوس، ماجستير، دكتوراه
    qualification_field VARCHAR(100), -- التخصص
    qualification_university VARCHAR(200),
    qualification_year INTEGER,
    teaching_certificate VARCHAR(100), -- شهادة التأهيل التربوي
    
    -- التعيين
    school_branch VARCHAR(100), -- المدرسة/الفرع
    department VARCHAR(100), -- القسم
    job_title VARCHAR(100) DEFAULT 'معلم',
    specialization VARCHAR(100), -- التخصص التدريسي
    grade_levels_taught TEXT, -- المراحل التي يدرسها
    
    -- بيانات الطوارئ
    emergency_contact_name VARCHAR(255),
    emergency_contact_relation VARCHAR(50),
    emergency_contact_phone VARCHAR(20),
    
    -- ملاحظات
    administrative_notes TEXT,
    
    -- رابط البروفايل
    profile_link VARCHAR(255) GENERATED ALWAYS AS ('/teachers/' || teacher_id) STORED
);

-- 2. TEACHER_SALARIES TABLE - جدول الرواتب والبدلات
CREATE TABLE IF NOT EXISTS teacher_salaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id VARCHAR(20) REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    academic_year_code VARCHAR(20) REFERENCES academic_years(year_code),
    effective_date DATE NOT NULL,
    
    -- الراتب الأساسي
    base_salary DECIMAL(10,2) DEFAULT 0,
    
    -- البدلات
    housing_allowance DECIMAL(10,2) DEFAULT 0,
    transportation_allowance DECIMAL(10,2) DEFAULT 0,
    meal_allowance DECIMAL(10,2) DEFAULT 0,
    phone_allowance DECIMAL(10,2) DEFAULT 0,
    teaching_load_allowance DECIMAL(10,2) DEFAULT 0, -- بدل الأعباء التدريسية
    special_allowance DECIMAL(10,2) DEFAULT 0,
    other_allowances DECIMAL(10,2) DEFAULT 0,
    
    -- الاستقطاعات الثابتة
    social_insurance DECIMAL(10,2) DEFAULT 0, -- التأمين الاجتماعي
    health_insurance DECIMAL(10,2) DEFAULT 0, -- التأمين الصحي
    income_tax DECIMAL(10,2) DEFAULT 0, -- ضريبة الدخل
    loan_deduction DECIMAL(10,2) DEFAULT 0, -- أقساط قروض
    other_deductions DECIMAL(10,2) DEFAULT 0,
    
    -- الحسابات التلقائية
    total_allowances DECIMAL(10,2) GENERATED ALWAYS AS (
        housing_allowance + transportation_allowance + meal_allowance + 
        phone_allowance + teaching_load_allowance + special_allowance + other_allowances
    ) STORED,
    total_deductions DECIMAL(10,2) GENERATED ALWAYS AS (
        social_insurance + health_insurance + income_tax + loan_deduction + other_deductions
    ) STORED,
    gross_salary DECIMAL(10,2) GENERATED ALWAYS AS (
        base_salary + housing_allowance + transportation_allowance + meal_allowance + 
        phone_allowance + teaching_load_allowance + special_allowance + other_allowances
    ) STORED,
    net_salary DECIMAL(10,2) GENERATED ALWAYS AS (
        base_salary + housing_allowance + transportation_allowance + meal_allowance + 
        phone_allowance + teaching_load_allowance + special_allowance + other_allowances -
        social_insurance - health_insurance - income_tax - loan_deduction - other_deductions
    ) STORED,
    
    -- معلومات البنك
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    iban VARCHAR(50),
    
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(teacher_id, academic_year_code, effective_date)
);

-- 3. TEACHER_SALARY_PAYMENTS TABLE - جدول مدفوعات الرواتب
CREATE TABLE IF NOT EXISTS teacher_salary_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id VARCHAR(20) REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    salary_id UUID REFERENCES teacher_salaries(id) ON DELETE CASCADE,
    
    payment_month INTEGER NOT NULL, -- 1-12
    payment_year INTEGER NOT NULL,
    payment_date DATE,
    
    base_amount DECIMAL(10,2) NOT NULL,
    allowances_amount DECIMAL(10,2) DEFAULT 0,
    deductions_amount DECIMAL(10,2) DEFAULT 0,
    bonus_amount DECIMAL(10,2) DEFAULT 0,
    penalty_amount DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2) NOT NULL,
    
    payment_status VARCHAR(20) DEFAULT 'معلق', -- معلق، مدفوع، متأخر، ملغي
    payment_method VARCHAR(30), -- تحويل بنكي، نقدي، شيك
    reference_number VARCHAR(50),
    
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(teacher_id, payment_month, payment_year)
);

-- 4. TEACHER_BONUSES TABLE - جدول المكافآت
CREATE TABLE IF NOT EXISTS teacher_bonuses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id VARCHAR(20) REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    
    bonus_type VARCHAR(50) NOT NULL, -- مكافأة أداء، مكافأة سنوية، حافز، مكافأة مشروع
    bonus_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    
    payment_status VARCHAR(20) DEFAULT 'معلق',
    payment_date DATE,
    
    approved_by VARCHAR(100),
    approval_date DATE,
    
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TEACHING_ASSIGNMENTS TABLE - جدول المهام التدريسية
CREATE TABLE IF NOT EXISTS teaching_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id VARCHAR(20) REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    academic_year_code VARCHAR(20) REFERENCES academic_years(year_code),
    semester_id UUID REFERENCES semesters(id),
    
    subject_id UUID REFERENCES subjects(id),
    class_id UUID REFERENCES classes(id),
    
    weekly_hours INTEGER DEFAULT 0,
    is_primary_teacher BOOLEAN DEFAULT true, -- المعلم الأساسي أم مساعد
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(teacher_id, academic_year_code, subject_id, class_id)
);

-- 6. TEACHER_TRAINING_COURSES TABLE - جدول الدورات التدريبية
CREATE TABLE IF NOT EXISTS teacher_training_courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id VARCHAR(20) REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    
    course_name VARCHAR(255) NOT NULL,
    course_provider VARCHAR(200),
    course_type VARCHAR(50), -- داخلية، خارجية، أونلاين
    start_date DATE,
    end_date DATE,
    duration_hours INTEGER,
    
    certificate_obtained BOOLEAN DEFAULT false,
    certificate_number VARCHAR(50),
    certificate_date DATE,
    
    grade VARCHAR(20), -- ممتاز، جيد جدا، جيد، مقبول
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TEACHER_CERTIFICATIONS TABLE - جدول الشهادات المهنية
CREATE TABLE IF NOT EXISTS teacher_certifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id VARCHAR(20) REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    
    certification_name VARCHAR(255) NOT NULL,
    issuing_authority VARCHAR(200),
    issue_date DATE,
    expiry_date DATE,
    certification_number VARCHAR(50),
    
    status VARCHAR(20) DEFAULT 'سارية', -- سارية، منتهية، قيد التجديد
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TEACHER_EVALUATIONS TABLE - جدول التقييمات المهنية
CREATE TABLE IF NOT EXISTS teacher_evaluations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id VARCHAR(20) REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    academic_year_code VARCHAR(20) REFERENCES academic_years(year_code),
    
    evaluation_type VARCHAR(50) NOT NULL, -- سنوي، نصف سنوي، شهري، خاص
    evaluation_date DATE NOT NULL,
    
    -- معايير التقييم (1-5 أو 1-100)
    teaching_quality_score DECIMAL(5,2),
    classroom_management_score DECIMAL(5,2),
    student_engagement_score DECIMAL(5,2),
    professional_development_score DECIMAL(5,2),
    attendance_punctuality_score DECIMAL(5,2),
    teamwork_score DECIMAL(5,2),
    communication_score DECIMAL(5,2),
    curriculum_adherence_score DECIMAL(5,2),
    
    overall_score DECIMAL(5,2),
    overall_rating VARCHAR(20), -- ممتاز، جيد جدا، جيد، مقبول، ضعيف
    
    strengths TEXT,
    areas_for_improvement TEXT,
    recommendations TEXT,
    
    evaluator_name VARCHAR(255),
    evaluator_position VARCHAR(100),
    
    teacher_acknowledgment BOOLEAN DEFAULT false,
    teacher_comments TEXT,
    
    status VARCHAR(20) DEFAULT 'مسودة', -- مسودة، نهائي، معتمد
    
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TEACHER_DISCIPLINARY_RECORDS TABLE - جدول السجل التأديبي
CREATE TABLE IF NOT EXISTS teacher_disciplinary_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id VARCHAR(20) REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    
    record_type VARCHAR(50) NOT NULL, -- ملاحظة، تنبيه، إنذار شفهي، إنذار كتابي، عقوبة
    record_date DATE NOT NULL,
    
    violation_type VARCHAR(100), -- نوع المخالفة
    description TEXT NOT NULL,
    
    action_taken TEXT,
    penalty_type VARCHAR(50), -- خصم، إيقاف، إنذار نهائي
    penalty_amount DECIMAL(10,2), -- في حالة الخصم
    penalty_days INTEGER, -- في حالة الإيقاف
    
    issued_by VARCHAR(255),
    issued_date DATE,
    
    teacher_response TEXT,
    teacher_acknowledged BOOLEAN DEFAULT false,
    acknowledgment_date DATE,
    
    status VARCHAR(20) DEFAULT 'نافذ', -- نافذ، منتهي، ملغي، قيد الطعن
    
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. TEACHER_ACHIEVEMENTS TABLE - جدول الإنجازات والتقديرات
CREATE TABLE IF NOT EXISTS teacher_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id VARCHAR(20) REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    
    achievement_type VARCHAR(50) NOT NULL, -- جائزة، شهادة تقدير، إنجاز، مشاركة متميزة
    achievement_date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    awarded_by VARCHAR(200),
    certificate_number VARCHAR(50),
    
    can_be_published BOOLEAN DEFAULT true,
    notes TEXT,
    
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. TEACHER_ATTENDANCE_RECORDS TABLE - جدول سجل حضور المعلمين
CREATE TABLE IF NOT EXISTS teacher_attendance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id VARCHAR(20) REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL, -- حاضر، غائب، متأخر، إجازة
    
    check_in_time TIME,
    check_out_time TIME,
    
    late_minutes INTEGER DEFAULT 0,
    early_leave_minutes INTEGER DEFAULT 0,
    
    notes TEXT,
    attachment_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(teacher_id, date)
);

-- 12. TEACHER_LEAVE_REQUESTS TABLE - جدول طلبات الإجازات
CREATE TABLE IF NOT EXISTS teacher_leave_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id VARCHAR(20) REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    
    leave_type VARCHAR(50) NOT NULL, -- سنوية، مرضية، طارئة، عارضة، إداري، بدون راتب، أمومة، أبوة
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    
    reason TEXT,
    supporting_documents TEXT, -- روابط المستندات
    
    substitute_teacher_id VARCHAR(20) REFERENCES teachers(teacher_id), -- البديل
    
    status VARCHAR(20) DEFAULT 'معلق', -- معلق، موافق عليه، مرفوض، ملغي
    
    approved_by VARCHAR(100),
    approval_date DATE,
    rejection_reason TEXT,
    
    deduct_from_balance BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. TEACHER_LEAVE_BALANCES TABLE - جدول أرصدة الإجازات
CREATE TABLE IF NOT EXISTS teacher_leave_balances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id VARCHAR(20) REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    academic_year_code VARCHAR(20) REFERENCES academic_years(year_code),
    
    annual_leave_balance INTEGER DEFAULT 21,
    sick_leave_balance INTEGER DEFAULT 14,
    emergency_leave_balance INTEGER DEFAULT 3,
    casual_leave_balance INTEGER DEFAULT 6,
    
    annual_leave_used INTEGER DEFAULT 0,
    sick_leave_used INTEGER DEFAULT 0,
    emergency_leave_used INTEGER DEFAULT 0,
    casual_leave_used INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(teacher_id, academic_year_code)
);

-- 14. TEACHER_NOTIFICATIONS TABLE - جدول إشعارات المعلمين
CREATE TABLE IF NOT EXISTS teacher_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id VARCHAR(20) REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    
    notification_type VARCHAR(50) NOT NULL, -- تحديث بيانات، تذكير، طلب، إعلان، تنبيه
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    
    delivery_method VARCHAR(20) DEFAULT 'internal', -- internal, whatsapp, email, sms
    delivery_status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, failed
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    related_entity_type VARCHAR(50), -- leave_request, evaluation, salary, etc.
    related_entity_id UUID,
    
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. TEACHER_AUDIT_TRAIL TABLE - جدول سجل التغييرات
CREATE TABLE IF NOT EXISTS teacher_audit_trail (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id VARCHAR(20) REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    
    change_type VARCHAR(50) NOT NULL, -- Personal Data, Employment, Salary, Evaluation, Attendance, etc.
    changed_fields JSONB,
    
    old_values JSONB,
    new_values JSONB,
    
    changed_by VARCHAR(100) NOT NULL,
    change_reason TEXT,
    
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_teachers_teacher_id ON teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teachers_status ON teachers(employment_status);
CREATE INDEX IF NOT EXISTS idx_teachers_department ON teachers(department);
CREATE INDEX IF NOT EXISTS idx_teacher_salaries_teacher_id ON teacher_salaries(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_teacher_id ON teacher_attendance_records(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_date ON teacher_attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_teacher_evaluations_teacher_id ON teacher_evaluations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_notifications_teacher_id ON teacher_notifications(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_audit_trail_teacher_id ON teacher_audit_trail(teacher_id);

-- =============================================
-- SEED DATA - Leave Types Reference
-- =============================================
-- أنواع الإجازات المدعومة:
-- سنوية (annual) - 21 يوم
-- مرضية (sick) - 14 يوم
-- طارئة (emergency) - 3 أيام
-- عارضة (casual) - 6 أيام
-- إداري (administrative) - غير محدود
-- بدون راتب (unpaid) - غير محدود
-- أمومة (maternity) - 90 يوم
-- أبوة (paternity) - 3 أيام
