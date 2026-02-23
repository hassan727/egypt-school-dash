-- Complete Database Schema for Egyptian School Dashboard
-- طابق تماماً مع الواجهة الفعلية - الأساس هو الواجهة فقط

-- =============================================
-- حذف جميع الجداول القديمة أولاً
-- =============================================
DROP TABLE IF EXISTS refund_deductions CASCADE;
DROP TABLE IF EXISTS refunds CASCADE;
DROP TABLE IF EXISTS fee_types CASCADE;
DROP TABLE IF EXISTS positive_notes CASCADE;
DROP TABLE IF EXISTS internal_notes CASCADE;
DROP TABLE IF EXISTS follow_up_reports CASCADE;
DROP TABLE IF EXISTS therapeutic_plans CASCADE;
DROP TABLE IF EXISTS expulsion_decisions CASCADE;
DROP TABLE IF EXISTS expulsion_warnings CASCADE;
DROP TABLE IF EXISTS behavior_evaluation_notices CASCADE;
DROP TABLE IF EXISTS warnings CASCADE;
DROP TABLE IF EXISTS pledge_commitments CASCADE;
DROP TABLE IF EXISTS guardian_summons CASCADE;
DROP TABLE IF EXISTS violation_confessions CASCADE;
DROP TABLE IF EXISTS incident_reports CASCADE;
DROP TABLE IF EXISTS academic_audit_log CASCADE;
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS behavioral_records CASCADE;
DROP TABLE IF EXISTS academic_records CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS student_audit_trail CASCADE;
DROP TABLE IF EXISTS financial_transactions CASCADE;
DROP TABLE IF EXISTS other_expenses CASCADE;
DROP TABLE IF EXISTS fee_installments CASCADE;
DROP TABLE IF EXISTS school_fees CASCADE;
DROP TABLE IF EXISTS emergency_contacts CASCADE;
DROP TABLE IF EXISTS assessment_types CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS semesters CASCADE;
DROP TABLE IF EXISTS academic_years CASCADE;
-- stages_classes table removed - using stages + classes relationship instead
DROP TABLE IF EXISTS students CASCADE;

-- 0. ACADEMIC YEARS TABLE - جدول السنوات الدراسية (Moved to top for dependency)
CREATE TABLE IF NOT EXISTS academic_years (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    year_code VARCHAR(20) UNIQUE NOT NULL, -- مثال: 2025-2026
    year_name_ar VARCHAR(100) NOT NULL, -- السنة الدراسية (2025-2026)
    start_date DATE NOT NULL, -- تاريخ البداية
    end_date DATE NOT NULL, -- تاريخ النهاية
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. STAGES TABLE - جدول المراحل الدراسية
CREATE TABLE IF NOT EXISTS stages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. CLASSES TABLE - جدول الفصول الدراسية
CREATE TABLE IF NOT EXISTS classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stage_id UUID REFERENCES stages(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(stage_id, name)
);

-- Insert default stages
INSERT INTO stages (name) VALUES
('KG1'), ('KG2'),
('الصف الأول الابتدائي'), ('الصف الثاني الابتدائي'), ('الصف الثالث الابتدائي'), ('الصف الرابع الابتدائي'), ('الصف الخامس الابتدائي'), ('الصف السادس الابتدائي'),
('الصف الأول الإعدادي'), ('الصف الثاني الإعدادي'),
('الصف الثالث الإعدادي'),
('الصف الأول الثانوي'), ('الصف الثاني الثانوي'), ('الصف الثالث الثانوي')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- NOTE: Grouped stages (رياض الأطفال، الابتدائية، الإعدادية، الثانوية) REMOVED
-- Only 14 detailed stages are used: KG1, KG2, الصف الأول-السادس الابتدائي, etc.
-- Each stage = one specific grade level (صف دراسي واحد)
-- =============================================

-- MIGRATION: Populate class_id in students table based on existing stage/class strings


-- Insert default classes (Dynamic lookup for stage_ids)
DO $$
DECLARE
    s_id UUID;
BEGIN
    -- KG1
    SELECT id INTO s_id FROM stages WHERE name = 'KG1';
    INSERT INTO classes (stage_id, name) VALUES (s_id, 'KG1A'), (s_id, 'KG1B'), (s_id, 'KG1C'), (s_id, 'KG1D') ON CONFLICT DO NOTHING;
    
    -- KG2
    SELECT id INTO s_id FROM stages WHERE name = 'KG2';
    INSERT INTO classes (stage_id, name) VALUES (s_id, 'KG2A'), (s_id, 'KG2B'), (s_id, 'KG2C'), (s_id, 'KG2D') ON CONFLICT DO NOTHING;

    -- Primary 1
    SELECT id INTO s_id FROM stages WHERE name = 'الصف الأول الابتدائي';
    INSERT INTO classes (stage_id, name) VALUES (s_id, '1A'), (s_id, '1B'), (s_id, '1C'), (s_id, '1D') ON CONFLICT DO NOTHING;

    -- Primary 2
    SELECT id INTO s_id FROM stages WHERE name = 'الصف الثاني الابتدائي';
    INSERT INTO classes (stage_id, name) VALUES (s_id, '2A'), (s_id, '2B'), (s_id, '2C'), (s_id, '2D') ON CONFLICT DO NOTHING;

    -- Primary 3
    SELECT id INTO s_id FROM stages WHERE name = 'الصف الثالث الابتدائي';
    INSERT INTO classes (stage_id, name) VALUES (s_id, '3A'), (s_id, '3B'), (s_id, '3C'), (s_id, '3D'), (s_id, '3E') ON CONFLICT DO NOTHING;

    -- Primary 4
    SELECT id INTO s_id FROM stages WHERE name = 'الصف الرابع الابتدائي';
    INSERT INTO classes (stage_id, name) VALUES (s_id, '4A'), (s_id, '4B'), (s_id, '4C'), (s_id, '4D') ON CONFLICT DO NOTHING;

    -- Primary 5
    SELECT id INTO s_id FROM stages WHERE name = 'الصف الخامس الابتدائي';
    INSERT INTO classes (stage_id, name) VALUES (s_id, '5A'), (s_id, '5B'), (s_id, '5C'), (s_id, '5D') ON CONFLICT DO NOTHING;

    -- Primary 6
    SELECT id INTO s_id FROM stages WHERE name = 'الصف السادس الابتدائي';
    INSERT INTO classes (stage_id, name) VALUES (s_id, '6A'), (s_id, '6B'), (s_id, '6C'), (s_id, '6D') ON CONFLICT DO NOTHING;

    -- Prep 1
    SELECT id INTO s_id FROM stages WHERE name = 'الصف الأول الإعدادي';
    INSERT INTO classes (stage_id, name) VALUES (s_id, '1A PRE'), (s_id, '1B PRE') ON CONFLICT DO NOTHING;

    -- Prep 2
    SELECT id INTO s_id FROM stages WHERE name = 'الصف الثاني الإعدادي';
    INSERT INTO classes (stage_id, name) VALUES (s_id, '2A PRE'), (s_id, '2B PRE'), (s_id, '2C PRE') ON CONFLICT DO NOTHING;

    -- Prep 3
    SELECT id INTO s_id FROM stages WHERE name = 'الصف الثالث الإعدادي';
    INSERT INTO classes (stage_id, name) VALUES (s_id, '3A PRE'), (s_id, '3B PRE') ON CONFLICT DO NOTHING;

    -- Sec 1
    SELECT id INTO s_id FROM stages WHERE name = 'الصف الأول الثانوي';
    INSERT INTO classes (stage_id, name) VALUES (s_id, 'S1A'), (s_id, 'S1B'), (s_id, 'S1C'), (s_id, 'S1D') ON CONFLICT DO NOTHING;

    -- Sec 2
    SELECT id INTO s_id FROM stages WHERE name = 'الصف الثاني الثانوي';
    INSERT INTO classes (stage_id, name) VALUES (s_id, 'S2A'), (s_id, 'S2B'), (s_id, 'S2C'), (s_id, 'S2D') ON CONFLICT DO NOTHING;

    -- Sec 3
    SELECT id INTO s_id FROM stages WHERE name = 'الصف الثالث الثانوي';
    INSERT INTO classes (stage_id, name) VALUES (s_id, 'S3A'), (s_id, 'S3B'), (s_id, 'S3C'), (s_id, 'S3D') ON CONFLICT DO NOTHING;
END $$;

-- SEED DATA: Academic Years (2023-2031)
INSERT INTO academic_years (year_code, year_name_ar, start_date, end_date, is_active) VALUES
('2023-2024', '2023-2024', '2023-09-01', '2024-06-30', false),
('2024-2025', '2024-2025', '2024-09-01', '2025-06-30', false),
('2025-2026', '2025-2026', '2025-09-01', '2026-06-30', true),
('2026-2027', '2026-2027', '2026-09-01', '2027-06-30', false),
('2027-2028', '2027-2028', '2027-09-01', '2028-06-30', false),
('2028-2029', '2028-2029', '2028-09-01', '2029-06-30', false),
('2029-2030', '2029-2030', '2029-09-01', '2030-06-30', false),
('2030-2031', '2030-2031', '2030-09-01', '2031-06-30', false)
ON CONFLICT (year_code) DO NOTHING;

-- 1. STUDENTS TABLE - جدول الطلاب الرئيسي يحتوي على البيانات الشخصية + الإدارية + القيد
CREATE TABLE IF NOT EXISTS students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- =============================================
    -- القسم الأول: البيانات الشخصية
    -- =============================================
    full_name_ar VARCHAR(255) NOT NULL,
    national_id VARCHAR(20) UNIQUE,
    date_of_birth DATE,
    place_of_birth VARCHAR(100),
    nationality VARCHAR(50) DEFAULT 'مصري',
    gender VARCHAR(10) DEFAULT 'ذكر',
    religion VARCHAR(20) DEFAULT 'مسلم',
    special_needs TEXT,
    
    -- =============================================
    -- القسم الثاني: بيانات القيد الدراسي
    -- =============================================
    academic_year VARCHAR(20) REFERENCES academic_years(year_code), -- ربط بالسنة الدراسية (كود)
    class_id UUID REFERENCES classes(id), -- ربط بالفصل (ومن خلاله بالمرحلة)
    stage VARCHAR(50), -- Legacy field (kept for migration)
    class VARCHAR(50), -- Legacy field (kept for migration)
    enrollment_type VARCHAR(20) DEFAULT 'مستجد',
    enrollment_date DATE,
    previous_school VARCHAR(100),
    transfer_reason TEXT,
    previous_level VARCHAR(20),
    second_language VARCHAR(20),
    curriculum_type VARCHAR(20) DEFAULT 'وطني',
    has_repeated BOOLEAN DEFAULT false,
    order_among_siblings INTEGER DEFAULT 1,
    is_regular BOOLEAN DEFAULT true,
    registration_status VARCHAR(50) DEFAULT 'active' CHECK (registration_status IN ('provisionally_registered', 'active')), -- حالة التسجيل

    -- Legacy fields removed/merged above
    
    -- =============================================
    -- القسم الثالث: بيانات ولي الأمر
    -- =============================================
    guardian_full_name VARCHAR(255),
    guardian_relationship VARCHAR(50) DEFAULT 'أب',
    guardian_national_id VARCHAR(20),
    guardian_job VARCHAR(100),
    guardian_workplace VARCHAR(100),
    guardian_education_level VARCHAR(50) DEFAULT 'دبلوم',
    guardian_phone VARCHAR(20),
    guardian_email VARCHAR(100),
    guardian_address TEXT,
    guardian_marital_status VARCHAR(20) DEFAULT 'متزوج',
    has_legal_guardian BOOLEAN DEFAULT false,
    guardian_social_media TEXT,
    guardian_whatsapp VARCHAR(20),
    guardian_nationality VARCHAR(50) DEFAULT 'مصري',
    
    -- =============================================
    -- القسم الرابع: بيانات الأم
    -- =============================================
    mother_full_name VARCHAR(255),
    mother_national_id VARCHAR(20),
    mother_job VARCHAR(100),
    mother_workplace VARCHAR(100),
    mother_phone VARCHAR(20),
    mother_email VARCHAR(100),
    mother_education_level VARCHAR(50) DEFAULT 'دبلوم',
    mother_address TEXT,
    mother_relationship VARCHAR(20) DEFAULT 'أم',
    mother_whatsapp VARCHAR(20),
    mother_nationality VARCHAR(50) DEFAULT 'مصري',
    
    -- =============================================
    -- القسم التاسع: البيانات الإدارية
    -- =============================================
    admission_date DATE,
    student_id_number VARCHAR(20),
    file_status VARCHAR(20) DEFAULT 'نشط',
    info_update_date DATE,
    transportation_status VARCHAR(20) DEFAULT 'لا يستخدم',
    bus_number VARCHAR(20),
    pickup_point VARCHAR(100),
    school_documents_complete BOOLEAN DEFAULT false,
    documents_notes TEXT,
    health_insurance BOOLEAN DEFAULT false,
    health_insurance_number VARCHAR(50),
    administrative_notes TEXT,
    emergency_contact_updated DATE,
    
    -- Profile link for direct access
    profile_link VARCHAR(255) GENERATED ALWAYS AS ('/students/' || student_id) STORED
);

-- 2. EMERGENCY CONTACTS TABLE - جدول بيانات الطوارئ
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    contact_name VARCHAR(255) NOT NULL,
    relationship VARCHAR(50),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SCHOOL FEES TABLE - جدول المصروفات الدراسية
CREATE TABLE IF NOT EXISTS school_fees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    academic_year_code VARCHAR(20),
    total_amount DECIMAL(10,2) DEFAULT 0,
    installment_count INTEGER DEFAULT 1,
    advance_payment DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. FEE INSTALLMENTS TABLE - جدول الأقساط
CREATE TABLE IF NOT EXISTS fee_installments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fee_id UUID REFERENCES school_fees(id) ON DELETE CASCADE,
    installment_number INTEGER,
    amount DECIMAL(10,2),
    due_date DATE,
    paid BOOLEAN DEFAULT false,
    paid_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. OTHER EXPENSES TABLE - جدول النفقات الأخرى
CREATE TABLE IF NOT EXISTS other_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    academic_year_code VARCHAR(20),
    expense_type VARCHAR(50),
    quantity INTEGER,
    total_price DECIMAL(10,2),
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ACADEMIC RECORDS TABLE - جدول السجلات الأكاديمية
CREATE TABLE IF NOT EXISTS academic_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    current_gpa DECIMAL(4,2) DEFAULT 0,
    total_marks DECIMAL(10,2) DEFAULT 0,
    average_marks DECIMAL(10,2) DEFAULT 0,
    passing_status VARCHAR(20) DEFAULT 'ناجح',
    academic_notes TEXT,
    strengths TEXT,
    weaknesses TEXT,
    last_exam_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6.5. ACADEMIC HIERARCHY TABLES - جداول الهيكل الشجري الأكاديمي
-- =============================================



-- Link early tables to academic_years after it exists
ALTER TABLE school_fees
    ADD CONSTRAINT fk_school_fees_year
    FOREIGN KEY (academic_year_code)
    REFERENCES academic_years(year_code);

ALTER TABLE other_expenses
    ADD CONSTRAINT fk_other_expenses_year
    FOREIGN KEY (academic_year_code)
    REFERENCES academic_years(year_code);

-- 6.5.2 SEMESTERS TABLE - جدول الفصول الدراسية
CREATE TABLE IF NOT EXISTS semesters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    semester_code VARCHAR(20) NOT NULL, -- الترم الأول / الترم الثاني
    semester_name_ar VARCHAR(100) NOT NULL, -- الفصل الأول الدراسي / الفصل الثاني الدراسي
    order_number INTEGER NOT NULL, -- 1 أو 2
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(academic_year_id, semester_code)
);

-- 6.5.3 SUBJECTS TABLE - جدول المواد الدراسية
CREATE TABLE IF NOT EXISTS subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_code VARCHAR(50) UNIQUE NOT NULL, -- كود موحد لكل مادة
    subject_name_ar VARCHAR(100) NOT NULL, -- اسم المادة
    subject_name_en VARCHAR(100),
    stage_level VARCHAR(50), -- الصف - null إذا كانت للجميع
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6.5.4 ASSESSMENT TYPES TABLE - جدول أنواع التقييم
CREATE TABLE IF NOT EXISTS assessment_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_code VARCHAR(50) UNIQUE NOT NULL, -- يومي، أسبوعي، شهري، نص_سنوي، نهائي، مشروع، عرض_شفهي
    assessment_name_ar VARCHAR(100) NOT NULL, -- اسم نوع التقييم
    assessment_name_en VARCHAR(100),
    description TEXT,
    weight DECIMAL(3,2) DEFAULT 1.00, -- الوزن الافتراضي للتقييم
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. GRADES TABLE - جدول الدرجات الفردية (محدثة)
CREATE TABLE IF NOT EXISTS grades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    
    -- الربط بالهيكل الشجري
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    assessment_type_id UUID REFERENCES assessment_types(id) ON DELETE CASCADE,
    
    -- البيانات الأساسية
    original_grade DECIMAL(5,2) NOT NULL,
    final_grade DECIMAL(5,2) NOT NULL,
    grade_level VARCHAR(20), -- ممتاز، جيد جدًا، جيد، مقبول، ضعيف
    
    -- معلومات الإدخال
    teacher_id VARCHAR(100),
    teacher_name VARCHAR(100),
    assessment_date DATE NOT NULL,
    seat_number VARCHAR(20),
    
    -- الملاحظات والتفاصيل
    teacher_notes TEXT,
    
    -- بيانات تتبع التعديلات
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(100),
    
    -- قيد فريد لتجنب التكرار
    UNIQUE(student_id, academic_year_id, semester_id, subject_id, assessment_type_id, assessment_date)
);

-- 7.5. ACADEMIC AUDIT LOG TABLE - جدول سجل التعديلات الأكاديمية
CREATE TABLE IF NOT EXISTS academic_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    grade_id UUID REFERENCES grades(id) ON DELETE CASCADE,
    user_id VARCHAR(100) NOT NULL, -- TeacherID أو AdminID
    action_type VARCHAR(20) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
    field_name VARCHAR(100), -- اسم الحقل المعدل
    old_value TEXT, -- القيمة قبل التعديل
    new_value TEXT, -- القيمة بعد التعديل
    change_reason TEXT NOT NULL, -- سبب التعديل (إجباري)
    change_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address VARCHAR(45), -- للتتبع الأمني
    user_agent TEXT -- للتتبع الأمني
);

-- 8. BEHAVIORAL RECORDS TABLE - جدول السجلات السلوكية العامة
CREATE TABLE IF NOT EXISTS behavioral_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    conduct_rating VARCHAR(20) DEFAULT 'جيد',
    attendance_rate DECIMAL(5,2) DEFAULT 95,
    absences INTEGER DEFAULT 0,
    tardiness INTEGER DEFAULT 0,
    disciplinary_issues BOOLEAN DEFAULT false,
    disciplinary_details TEXT,
    participation_level VARCHAR(20) DEFAULT 'متوسط',
    classroom_behavior TEXT,
    social_interaction TEXT,
    counselor_notes TEXT,
    last_incident_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, academic_year_id)
);

-- 8.1. INCIDENT REPORTS - جدول تقارير الواقعة
CREATE TABLE IF NOT EXISTS incident_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    record_number VARCHAR(50) UNIQUE NOT NULL,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    incident_date DATE NOT NULL,
    incident_time TIME,
    incident_location VARCHAR(255),
    incident_description TEXT NOT NULL,
    witness_names TEXT,
    reporter_name VARCHAR(255) NOT NULL,
    reporter_role VARCHAR(50),
    severity_level VARCHAR(20) DEFAULT 'متوسطة',
    incident_type VARCHAR(100),
    behavioral_evidence TEXT,
    actions_taken TEXT,
    status VARCHAR(20) DEFAULT 'جديد',
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8.2. VIOLATION CONFESSIONS - جدول إقرار بارتكاب مخالفة
CREATE TABLE IF NOT EXISTS violation_confessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    record_number VARCHAR(50) UNIQUE NOT NULL,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    incident_report_id UUID REFERENCES incident_reports(id),
    confession_date DATE NOT NULL,
    confession_time TIME,
    violation_description TEXT NOT NULL,
    student_confession TEXT NOT NULL,
    student_acknowledgment BOOLEAN DEFAULT false,
    witnessed_by VARCHAR(255),
    legal_guardian_present BOOLEAN DEFAULT false,
    guardian_name VARCHAR(255),
    guardian_signature_date DATE,
    counselor_name VARCHAR(255),
    counselor_notes TEXT,
    status VARCHAR(20) DEFAULT 'جديد',
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8.3. GUARDIAN SUMMONS - جدول استدعاء ولي الأمر
CREATE TABLE IF NOT EXISTS guardian_summons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    record_number VARCHAR(50) UNIQUE NOT NULL,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    summons_date DATE NOT NULL,
    summons_time TIME,
    reason_for_summons TEXT NOT NULL,
    guardian_name VARCHAR(255) NOT NULL,
    guardian_relationship VARCHAR(50),
    guardian_phone VARCHAR(20),
    attendance_date DATE,
    attendance_time TIME,
    did_attend BOOLEAN DEFAULT false,
    meeting_summary TEXT,
    discussion_points TEXT,
    agreed_actions TEXT,
    meeting_notes TEXT,
    counselor_name VARCHAR(255),
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    status VARCHAR(20) DEFAULT 'معلق',
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8.4. PLEDGE COMMITMENTS - جدول إقرار وتعهد
CREATE TABLE IF NOT EXISTS pledge_commitments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    record_number VARCHAR(50) UNIQUE NOT NULL,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    violation_confession_id UUID REFERENCES violation_confessions(id),
    pledge_date DATE NOT NULL,
    pledge_content TEXT NOT NULL,
    commitment_duration_days INTEGER DEFAULT 30,
    committed_actions TEXT,
    student_signature_date DATE,
    guardian_signature_date DATE,
    guardian_name VARCHAR(255),
    witness_names TEXT,
    counselor_name VARCHAR(255),
    counselor_signature_date DATE,
    status VARCHAR(20) DEFAULT 'نشط',
    compliance_status VARCHAR(20) DEFAULT 'قيد المراقبة',
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8.5. WARNINGS - جدول الإنذارات
CREATE TABLE IF NOT EXISTS warnings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    record_number VARCHAR(50) UNIQUE NOT NULL,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    warning_type VARCHAR(50) NOT NULL,
    warning_level INTEGER DEFAULT 1,
    warning_date DATE NOT NULL,
    reason TEXT NOT NULL,
    warning_content TEXT NOT NULL,
    previously_warned BOOLEAN DEFAULT false,
    previous_warning_dates TEXT,
    issued_by VARCHAR(255) NOT NULL,
    issued_date DATE NOT NULL,
    guardian_notification_date DATE,
    guardian_signature_date DATE,
    effectiveness_review_date DATE,
    effectiveness_status VARCHAR(20),
    status VARCHAR(20) DEFAULT 'نافذ',
    next_step VARCHAR(255),
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8.6. BEHAVIOR EVALUATION NOTICES - جدول إخطار تقييم السلوك
CREATE TABLE IF NOT EXISTS behavior_evaluation_notices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    record_number VARCHAR(50) UNIQUE NOT NULL,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    evaluation_period VARCHAR(50),
    evaluation_start_date DATE NOT NULL,
    evaluation_end_date DATE NOT NULL,
    behavior_rating VARCHAR(20),
    attendance_summary TEXT,
    behavioral_summary TEXT,
    positive_aspects TEXT,
    areas_for_improvement TEXT,
    counselor_recommendations TEXT,
    parent_notification_date DATE,
    guardian_signature_date DATE,
    guardian_name VARCHAR(255),
    counselor_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'جديد',
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8.7. EXPULSION WARNINGS - جدول إنذار بالفصل
CREATE TABLE IF NOT EXISTS expulsion_warnings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    record_number VARCHAR(50) UNIQUE NOT NULL,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    warning_date DATE NOT NULL,
    reason_for_warning TEXT NOT NULL,
    previous_violations_summary TEXT,
    violation_severity VARCHAR(20),
    final_warning_content TEXT NOT NULL,
    consequences_explained TEXT,
    issued_by VARCHAR(255) NOT NULL,
    issued_date DATE NOT NULL,
    guardian_notification_method VARCHAR(50),
    guardian_notification_date DATE,
    guardian_acknowledged BOOLEAN DEFAULT false,
    guardian_signature_date DATE,
    guardian_name VARCHAR(255),
    counselor_recommendation TEXT,
    appeal_allowed BOOLEAN DEFAULT false,
    appeal_deadline DATE,
    status VARCHAR(20) DEFAULT 'نافذ',
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8.8. EXPULSION DECISIONS - جدول قرار الفصل
CREATE TABLE IF NOT EXISTS expulsion_decisions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    decision_number VARCHAR(50) UNIQUE NOT NULL,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    expulsion_warning_id UUID REFERENCES expulsion_warnings(id),
    decision_date DATE NOT NULL,
    final_reason TEXT NOT NULL,
    violation_history TEXT,
    decision_justification TEXT NOT NULL,
    expulsion_type VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE,
    is_permanent BOOLEAN DEFAULT false,
    issued_by_name VARCHAR(255) NOT NULL,
    issued_by_position VARCHAR(100),
    issued_by_signature_date DATE,
    principal_approved_date DATE,
    guardian_notification_date DATE,
    guardian_name VARCHAR(255),
    appeal_options TEXT,
    appeal_period_days INTEGER DEFAULT 30,
    status VARCHAR(20) DEFAULT 'نافذ',
    legal_file_reference VARCHAR(100),
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8.9. THERAPEUTIC PLANS - جدول الخطة العلاجية
CREATE TABLE IF NOT EXISTS therapeutic_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    record_number VARCHAR(50) UNIQUE NOT NULL,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    plan_start_date DATE NOT NULL,
    plan_duration_days INTEGER DEFAULT 30,
    plan_end_date DATE,
    behavioral_issues_identified TEXT NOT NULL,
    plan_objectives TEXT NOT NULL,
    therapeutic_strategies TEXT,
    teacher_responsibilities TEXT,
    counselor_responsibilities TEXT,
    guardian_responsibilities TEXT,
    student_responsibilities TEXT,
    expected_outcomes TEXT,
    monitoring_frequency VARCHAR(50),
    monitoring_method VARCHAR(100),
    key_contacts TEXT,
    counselor_name VARCHAR(255),
    counselor_signature_date DATE,
    guardian_agreement BOOLEAN DEFAULT false,
    guardian_signature_date DATE,
    guardian_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'نشط',
    effectiveness_rating VARCHAR(20),
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8.10. FOLLOW-UP REPORTS - جدول تقرير المتابعة
CREATE TABLE IF NOT EXISTS follow_up_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    record_number VARCHAR(50) UNIQUE NOT NULL,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    therapeutic_plan_id UUID REFERENCES therapeutic_plans(id),
    follow_up_date DATE NOT NULL,
    follow_up_number INTEGER DEFAULT 1,
    period_covered_start_date DATE,
    period_covered_end_date DATE,
    progress_assessment TEXT,
    behavioral_changes TEXT,
    challenges_faced TEXT,
    strategies_adjusted TEXT,
    improvements_noted TEXT,
    areas_still_needing_work TEXT,
    student_response TEXT,
    teacher_observations TEXT,
    guardian_feedback TEXT,
    counselor_notes TEXT,
    next_steps TEXT,
    follow_up_recommendation VARCHAR(50),
    recommended_follow_up_date DATE,
    counselor_name VARCHAR(255),
    counselor_signature_date DATE,
    status VARCHAR(20) DEFAULT 'مكتمل',
    effectiveness_rating VARCHAR(20),
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8.11. INTERNAL NOTES - جدول المذكرة الداخلية
CREATE TABLE IF NOT EXISTS internal_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    record_number VARCHAR(50) UNIQUE NOT NULL,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    note_date DATE NOT NULL,
    note_type VARCHAR(50),
    note_content TEXT NOT NULL,
    observed_behavior TEXT,
    context_information TEXT,
    recommended_actions TEXT,
    priority_level VARCHAR(20) DEFAULT 'عادي',
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    related_incident_id UUID REFERENCES incident_reports(id),
    created_by_name VARCHAR(255),
    created_by_role VARCHAR(50),
    internal_status VARCHAR(20) DEFAULT 'نشط',
    visibility_scope VARCHAR(50) DEFAULT 'داخلي',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8.12. POSITIVE NOTES - جدول الملاحظات الإيجابية
CREATE TABLE IF NOT EXISTS positive_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    record_number VARCHAR(50) UNIQUE NOT NULL,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    note_date DATE NOT NULL,
    positive_behavior TEXT NOT NULL,
    behavior_context TEXT,
    achievement_type VARCHAR(100),
    impact_on_school_community TEXT,
    encouraging_words TEXT,
    recognized_by_name VARCHAR(255),
    recognized_by_role VARCHAR(50),
    can_be_shared_with_parents BOOLEAN DEFAULT true,
    can_be_used_in_report BOOLEAN DEFAULT true,
    reward_recommendation TEXT,
    follow_up_action TEXT,
    status VARCHAR(20) DEFAULT 'recorded',
    importance_level VARCHAR(20) DEFAULT 'عادي',
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. FINANCIAL TRANSACTIONS TABLE - جدول المعاملات المالية
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    academic_year_code VARCHAR(20) REFERENCES academic_years(year_code),
    transaction_type VARCHAR(20), -- 'دفع', 'استرجاع', 'تعديل'
    amount DECIMAL(10,2),
    description TEXT,
    payment_method VARCHAR(30),
    transaction_date DATE,
    receipt_number VARCHAR(50),
    created_by VARCHAR(100),
    
    -- بيانات الدافع (Payer Information)
    payer_name VARCHAR(255), -- اسم الدافع
    payer_relation VARCHAR(50), -- صلة القرابة (أب، أم، وكيل، إلخ)
    payer_phone VARCHAR(20), -- رقم هاتف الدافع
    payer_national_id VARCHAR(20), -- الرقم القومي للدافع
    
    -- Audit Trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9.5 FEE TYPES TABLE - جدول أنواع الرسوم (للتصنيف والسياسات)
CREATE TABLE IF NOT EXISTS fee_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fee_type_name VARCHAR(100) NOT NULL, -- اسم نوع الرسم
    fee_code VARCHAR(50) UNIQUE NOT NULL, -- كود موحد
    description TEXT, -- وصف الرسم
    is_refundable BOOLEAN DEFAULT true, -- هل الرسم قابل للاسترداد
    refund_policy_percentage DECIMAL(5,2) DEFAULT 100, -- نسبة الاسترداد (مثلاً 80%)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9.6 REFUNDS TABLE - جدول طلبات استرداد الأموال
CREATE TABLE IF NOT EXISTS refunds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    academic_year_code VARCHAR(20) REFERENCES academic_years(year_code),
    
    -- معلومات الطلب
    request_date DATE NOT NULL, -- تاريخ تقديم الطلب
    withdrawal_date DATE, -- تاريخ انسحاب الطالب من المدرسة
    status VARCHAR(20) DEFAULT 'معلق', -- 'معلق', 'موافق عليه', 'مرفوض', 'مدفوع'
    
    -- المبالغ المالية
    total_paid DECIMAL(10,2) NOT NULL, -- إجمالي المبالغ المدفوعة
    total_refundable DECIMAL(10,2), -- إجمالي المبالغ القابلة للاسترداد
    total_deductions DECIMAL(10,2) DEFAULT 0, -- إجمالي الخصومات
    final_refund_amount DECIMAL(10,2), -- المبلغ النهائي للاسترداد
    
    -- الملاحظات والمراجعة
    notes TEXT, -- ملاحظات الموظف
    rejection_reason TEXT, -- سبب الرفض (إن وجد)
    approver_name VARCHAR(255), -- اسم الموافق
    approval_date DATE, -- تاريخ الموافقة
    payment_date DATE, -- تاريخ الدفع الفعلي
    
    -- معلومات الدفع
    payment_method VARCHAR(30), -- طريقة الدفع (تحويل بنكي، شيك، إلخ)
    bank_account_info TEXT, -- بيانات الحساب البنكي للمستفيد
    receipt_number VARCHAR(50), -- رقم الإيصال
    
    -- Audit Trail
    created_by VARCHAR(255), -- من أنشأ الطلب
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9.7 REFUND DEDUCTIONS TABLE - جدول خصومات الاسترداد
CREATE TABLE IF NOT EXISTS refund_deductions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    refund_id UUID REFERENCES refunds(id) ON DELETE CASCADE,
    
    -- معلومات الخصم
    deduction_type VARCHAR(50) NOT NULL, -- 'رسم إداري', 'شهر دراسي', 'رسم تسجيل', 'خدمة مستهلكة'
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    percentage DECIMAL(5,2), -- النسبة المئوية من الإجمالي (إن كانت)
    reason TEXT, -- سبب الخصم
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. STUDENT AUDIT TRAIL TABLE - جدول سجل التغييرات
CREATE TABLE IF NOT EXISTS student_audit_trail (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    change_type VARCHAR(50),
    changed_fields JSONB,
    changed_by VARCHAR(100),
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. CERTIFICATES TABLE - جدول الشهادات
CREATE TABLE IF NOT EXISTS certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    certificate_type VARCHAR(50) NOT NULL, -- 'إتمام مرحلة', 'تقدير نهائي', 'شهادة حضور', إلخ
    academic_year VARCHAR(20) NOT NULL,
    stage VARCHAR(50),
    class VARCHAR(20),
    issue_date DATE NOT NULL,
    expiry_date DATE,
    overall_grade DECIMAL(5,2), -- الدرجة النهائية العامة
    overall_gpa DECIMAL(4,2), -- المعدل التراكمي
    grade_level VARCHAR(20), -- التقدير العام
    status VARCHAR(20) DEFAULT 'صالح', -- 'صالح', 'منتهي', 'ملغي'
    issued_by VARCHAR(100), -- من أصدر الشهادة
    notes TEXT,
    certificate_number VARCHAR(50) UNIQUE, -- رقم الشهادة الفريد
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. ATTENDANCE RECORDS TABLE - جدول سجل الحضور
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    date DATE,
    status VARCHAR(20), -- 'حاضر', 'غائب', 'متأخر', 'معذور'
    check_in_time TIME,
    check_out_time TIME,
    notes TEXT,
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- NOTE: stages_classes table REMOVED
-- Use stages + classes tables with FK relationship instead
-- This is the Single Source of Truth for grades and sections
-- =============================================

-- =============================================
-- INSERT REFERENCE DATA FOR ACADEMIC HIERARCHY
-- =============================================

-- Insert Academic Years
INSERT INTO academic_years (year_code, year_name_ar, start_date, end_date, is_active)
VALUES 
    ('2025-2026', 'السنة الدراسية 2025-2026', '2025-09-01', '2026-06-30', true),
    ('2026-2027', 'السنة الدراسية 2026-2027', '2026-09-01', '2027-06-30', false),
    ('2027-2028', 'السنة الدراسية 2027-2028', '2027-09-01', '2028-06-30', false)
ON CONFLICT DO NOTHING;

-- Insert Semesters (linked to active academic year 2025-2026)
INSERT INTO semesters (academic_year_id, semester_code, semester_name_ar, order_number, start_date, end_date, is_active)
SELECT 
    ay.id,
    CASE WHEN v.order_number = 1 THEN 'الترم الأول' ELSE 'الترم الثاني' END,
    CASE WHEN v.order_number = 1 THEN 'الفصل الأول' ELSE 'الفصل الثاني' END,
    v.order_number,
    v.start_date,
    v.end_date,
    true
FROM academic_years ay
JOIN (VALUES
    (1, '2025-09-01'::DATE, '2026-01-31'::DATE),
    (2, '2026-02-01'::DATE, '2026-06-30'::DATE)
) v(order_number, start_date, end_date) ON true
WHERE ay.year_code = '2025-2026'
ON CONFLICT DO NOTHING;

-- Insert Subjects
INSERT INTO subjects (subject_code, subject_name_ar, subject_name_en, is_active)
VALUES 
    ('AR', 'اللغة العربية', 'Arabic', true),
    ('EN', 'لغة انجليزية', 'English', true),
    ('MA', 'الرياضيات', 'Mathematics', true),
    ('SC', 'العلوم', 'Science', true),
    ('SS', 'الدراسات', 'Social Studies', true),
    ('PA', 'تربية بدنية', 'Physical Education', true),
    ('AR_ART', 'تربية فنية', 'Art', true),
    ('MU', 'تربية موسيقية', 'Music', true),
    ('RE', 'تربية دينية', 'Religious Education', true),
    ('GE', 'اللغة الألمانية', 'German', true),
    ('FR', 'اللغة الفرنسية', 'French', true),
    ('IT', 'اللغة الإيطالية', 'Italian', true),
    ('ICT', 'ICT', 'Information Technology', true),
    ('SK', 'مهارات', 'Skills', true)
ON CONFLICT DO NOTHING;

-- Insert Assessment Types
INSERT INTO assessment_types (assessment_code, assessment_name_ar, assessment_name_en, weight, is_active)
VALUES 
    ('WEEKLY', 'تقييم أسبوعي', 'Weekly Assessment', 0.10, true),
    ('MONTHLY', 'تقييم شهري', 'Monthly Assessment', 0.15, true),
    ('EXAM_MONTHLY', 'امتحان شهري', 'Monthly Exam', 0.20, true),
    ('EXAM_SEMESTER1', 'اختبار الفصل الدراسي الأول', 'First Semester Exam', 0.25, true),
    ('PROJECT', 'مشروع أو بحث', 'Project or Research', 0.15, true),
    ('EXAM_FINAL', 'اختبار نهاية العام الدراسي', 'Final Year Exam', 0.30, true),
    ('BEHAVIORAL', 'تقييم سلوكي أو عملي', 'Behavioral or Practical Assessment', 0.10, true)
ON CONFLICT DO NOTHING;

-- =============================================
-- INDEXES FOR BETTER PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_stage_class ON students(stage, class);
CREATE INDEX IF NOT EXISTS idx_students_academic_year ON students(academic_year);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_student_id ON emergency_contacts(student_id);
CREATE INDEX IF NOT EXISTS idx_school_fees_student_id ON school_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_school_fees_student_year ON school_fees(student_id, academic_year_code);
CREATE INDEX IF NOT EXISTS idx_fee_installments_fee_id ON fee_installments(fee_id);
CREATE INDEX IF NOT EXISTS idx_other_expenses_student_id ON other_expenses(student_id);
CREATE INDEX IF NOT EXISTS idx_other_expenses_student_year ON other_expenses(student_id, academic_year_code);
CREATE INDEX IF NOT EXISTS idx_academic_records_student_id ON academic_records(student_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_records_student_id ON behavioral_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_student_audit_trail_student_id ON student_audit_trail(student_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_student_id ON financial_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_student_year ON financial_transactions(student_id, academic_year_code);
-- idx_stages_classes_stage removed (table dropped)
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_academic_year_id ON grades(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_grades_semester_id ON grades(semester_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject_id ON grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_assessment_type_id ON grades(assessment_type_id);
CREATE INDEX IF NOT EXISTS idx_academic_audit_log_student_id ON academic_audit_log(student_id);
CREATE INDEX IF NOT EXISTS idx_academic_audit_log_grade_id ON academic_audit_log(grade_id);
CREATE INDEX IF NOT EXISTS idx_academic_audit_log_user_id ON academic_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_academic_audit_log_timestamp ON academic_audit_log(change_timestamp);

-- Indexes for certificates table
CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_type ON certificates(certificate_type);
CREATE INDEX IF NOT EXISTS idx_certificates_academic_year ON certificates(academic_year);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON certificates(certificate_number);

-- =============================================
-- INDEXES FOR ACADEMIC HIERARCHY TABLES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_academic_years_year_code ON academic_years(year_code);
CREATE INDEX IF NOT EXISTS idx_academic_years_is_active ON academic_years(is_active);

CREATE INDEX IF NOT EXISTS idx_semesters_academic_year_id ON semesters(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_semesters_code ON semesters(semester_code);
CREATE INDEX IF NOT EXISTS idx_semesters_is_active ON semesters(is_active);

CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(subject_code);
CREATE INDEX IF NOT EXISTS idx_subjects_stage_level ON subjects(stage_level);
CREATE INDEX IF NOT EXISTS idx_subjects_is_active ON subjects(is_active);

CREATE INDEX IF NOT EXISTS idx_assessment_types_code ON assessment_types(assessment_code);
CREATE INDEX IF NOT EXISTS idx_assessment_types_is_active ON assessment_types(is_active);

-- Updated indexes for grades table
CREATE INDEX IF NOT EXISTS idx_grades_student_academic_year ON grades(student_id, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_grades_semester_id ON grades(semester_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject_id ON grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_assessment_type_id ON grades(assessment_type_id);
CREATE INDEX IF NOT EXISTS idx_grades_assessment_date ON grades(assessment_date);
CREATE INDEX IF NOT EXISTS idx_grades_composite ON grades(student_id, academic_year_id, semester_id, subject_id);

-- =============================================
-- TRIGGER FUNCTIONS FOR AUTO-UPDATING updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- TRIGGERS FOR AUTO-UPDATING updated_at
CREATE TRIGGER update_students_updated_at 
    BEFORE UPDATE ON students 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_school_fees_updated_at 
    BEFORE UPDATE ON school_fees 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academic_records_updated_at 
    BEFORE UPDATE ON academic_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_behavioral_records_updated_at 
    BEFORE UPDATE ON behavioral_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grades_updated_at
    BEFORE UPDATE ON grades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at
    BEFORE UPDATE ON certificates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academic_years_updated_at
    BEFORE UPDATE ON academic_years
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_semesters_updated_at
    BEFORE UPDATE ON semesters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at
    BEFORE UPDATE ON subjects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_types_updated_at
    BEFORE UPDATE ON assessment_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DISABLE RLS ON ALL TABLES (Development Only)
-- تعطيل RLS على جميع الجداول (التطوير فقط)
-- =============================================
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE school_fees DISABLE ROW LEVEL SECURITY;
ALTER TABLE fee_installments DISABLE ROW LEVEL SECURITY;
ALTER TABLE other_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE academic_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE violation_confessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_summons DISABLE ROW LEVEL SECURITY;
ALTER TABLE pledge_commitments DISABLE ROW LEVEL SECURITY;
ALTER TABLE warnings DISABLE ROW LEVEL SECURITY;
ALTER TABLE behavior_evaluation_notices DISABLE ROW LEVEL SECURITY;
ALTER TABLE expulsion_warnings DISABLE ROW LEVEL SECURITY;
ALTER TABLE expulsion_decisions DISABLE ROW LEVEL SECURITY;
ALTER TABLE therapeutic_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE internal_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE positive_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_audit_trail DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records DISABLE ROW LEVEL SECURITY;
-- stages_classes RLS removed (table dropped)
ALTER TABLE grades DISABLE ROW LEVEL SECURITY;
ALTER TABLE academic_audit_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years DISABLE ROW LEVEL SECURITY;
ALTER TABLE semesters DISABLE ROW LEVEL SECURITY;
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_types DISABLE ROW LEVEL SECURITY;

-- =============================================
-- SAMPLE DATA FOR TESTING - بيانات تجريبية للاختبار
-- طالب واحد فقط بالبيانات المطلوبة
-- =============================================

-- إدراج طالب واحد مع البيانات الأساسية فقط
INSERT INTO students (
    student_id, full_name_ar, national_id, date_of_birth, place_of_birth, gender, religion,
    academic_year, stage, class, enrollment_type, enrollment_date, previous_school,
    second_language, curriculum_type, order_among_siblings,
    guardian_full_name, guardian_relationship, guardian_national_id, guardian_job,
    guardian_workplace, guardian_phone, guardian_email, guardian_address,
    mother_full_name, mother_national_id, mother_job, mother_phone, mother_email,
    admission_date, student_id_number, file_status, info_update_date,
    transportation_status, health_insurance, administrative_notes
) VALUES (
    'STU2025001',
    'محمد أحمد محمد علي',
    '30101012345678',
    '2015-01-30',
    'القاهرة',
    'ذكر',
    'مسلم',
    '2025-2026',
    'الصف الرابع الابتدائي',
    '4A',
    'مستجد',
    '2025-09-01',
    'مدرسة النور الابتدائية',
    'الإنجليزية',
    'وطني',
    2,
    'أحمد محمد علي حسن',
    'أب',
    '29501011234567',
    'موظف حكومي',
    'وزارة التربية والتعليم',
    '01111585527',
    'ahmed.parent@email.com',
    'شارع النيل، المعادي، القاهرة',
    'فاطمة محمود أحمد',
    '29602019876543',
    'ربة منزل',
    '01198765432',
    'fatma.mother@email.com',
    '2025-08-15',
    '2025001',
    'نشط',
    '2025-09-01',
    'يستخدم',
    true,
    'طالب منتظم'
) ON CONFLICT (student_id) DO NOTHING;

-- تحديث class_id للطالب ليشير للفصل الصحيح
UPDATE students 
SET class_id = (
    SELECT c.id 
    FROM classes c 
    JOIN stages s ON c.stage_id = s.id 
    WHERE s.name = 'الصف الرابع الابتدائي' 
    AND c.name = '4A'
    LIMIT 1
)
WHERE student_id = 'STU2025001';


-- إدراج بيانات الطوارئ
INSERT INTO emergency_contacts (student_id, contact_name, relationship, phone, address)
VALUES ('STU2025001', 'العم محمود', 'عم', '01234567890', 'شارع الهرم، الجيزة')
ON CONFLICT DO NOTHING;

-- إدراج المصروفات الدراسية
INSERT INTO school_fees (student_id, academic_year_code, total_amount, installment_count, advance_payment)
VALUES ('STU2025001', '2025-2026', 15000.00, 3, 5000.00)
ON CONFLICT DO NOTHING;

-- إدراج الأقساط
INSERT INTO fee_installments (fee_id, installment_number, amount, due_date, paid)
SELECT sf.id, 1, 5000.00, '2025-10-01', true FROM school_fees sf WHERE sf.student_id = 'STU2025001'
ON CONFLICT DO NOTHING;

INSERT INTO fee_installments (fee_id, installment_number, amount, due_date, paid)
SELECT sf.id, 2, 5000.00, '2025-12-01', false FROM school_fees sf WHERE sf.student_id = 'STU2025001'
ON CONFLICT DO NOTHING;

INSERT INTO fee_installments (fee_id, installment_number, amount, due_date, paid)
SELECT sf.id, 3, 5000.00, '2026-02-01', false FROM school_fees sf WHERE sf.student_id = 'STU2025001'
ON CONFLICT DO NOTHING;

-- =============================================
-- إدراج بيانات أنواع الرسوم الافتراضية
-- =============================================
INSERT INTO fee_types (fee_type_name, fee_code, description, is_refundable, refund_policy_percentage)
VALUES
('المصروفات الدراسية', 'TUITION', 'المصروفات الدراسية الأساسية - قابلة للاسترداد حسب السياسة', true, 100),
('رسوم التسجيل والقبول', 'REGISTRATION', 'رسوم القبول والتسجيل - غير قابلة للاسترداد', false, 0),
('رسوم الباص', 'BUS', 'رسوم الخدمة - قابلة للاسترداد جزئياً', true, 80),
('رسوم الأنشطة', 'ACTIVITIES', 'رسوم الأنشطة الطلابية - قابلة للاسترداد جزئياً', true, 50),
('الكتب والمواد', 'BOOKS', 'الكتب والمواد الدراسية - غير قابلة للاسترداد', false, 0),
('الزي المدرسي', 'UNIFORM', 'الزي المدرسي - غير قابلة للاسترداد', false, 0),
('التأمين الصحي', 'INSURANCE', 'التأمين الصحي - قابلة للاسترداد', true, 100)
ON CONFLICT (fee_code) DO NOTHING;

-- =============================================
-- END OF SCHEMA - تشغيل هذا الملف بالكامل مرة واحدة فقط
-- =============================================
SELECT 'تم إنشاء قاعدة البيانات وبيانات الاختبار بنجاح! يمكنك الآن استخدام النظام' as status;
-- =============================================

-- MIGRATION: Populate class_id in students table based on existing stage/class strings
-- This must run AFTER students table is created
UPDATE students s
SET class_id = c.id
FROM classes c
JOIN stages st ON c.stage_id = st.id
WHERE s.stage = st.name AND s.class = c.name
AND s.class_id IS NULL;


-- 14. NOTIFICATIONS TABLE - جدول الإشعارات والرسائل
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('internal', 'whatsapp')), -- internal, whatsapp
    title TEXT, -- عنوان الرسالة (للرسائل الداخلية) - نص غير محدود
    content TEXT NOT NULL, -- محتوى الرسالة
    phone_number VARCHAR(20), -- رقم الهاتف (لواتساب)
    status VARCHAR(50) DEFAULT 'sent', -- sent, read, wa_opened, email_sent, failed
    created_by VARCHAR(255), -- المعلم أو الإداري
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_student_id ON notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Disable RLS for notifications (Development Only)
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- =============================================
-- FIX: Update Student Phone Number for WhatsApp
-- =============================================
-- User Request: Update 01111585527 to international format +20
-- This ensures the number works with the WhatsApp integration
UPDATE students
SET guardian_phone = '+201111585527'
WHERE guardian_phone LIKE '%01111585527%';

UPDATE students
SET mother_phone = '+201111585527'
WHERE mother_phone LIKE '%01111585527%';

UPDATE emergency_contacts
SET phone = '+201111585527'
WHERE phone LIKE '%01111585527%';

-- =============================================
-- MIGRATION: Add WhatsApp Number Columns
-- =============================================

-- Add guardian_whatsapp to students table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'guardian_whatsapp') THEN
        ALTER TABLE students ADD COLUMN guardian_whatsapp VARCHAR(20);
    END IF;
END $$;

-- Add mother_whatsapp to students table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'mother_whatsapp') THEN
        ALTER TABLE students ADD COLUMN mother_whatsapp VARCHAR(20);
    END IF;
END $$;

-- Add whatsapp_number to emergency_contacts table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_contacts' AND column_name = 'whatsapp_number') THEN
        ALTER TABLE emergency_contacts ADD COLUMN whatsapp_number VARCHAR(20);
    END IF;
END $$;

-- Add nationality for guardian and mother
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'guardian_nationality') THEN
        ALTER TABLE students ADD COLUMN guardian_nationality VARCHAR(50) DEFAULT 'مصري';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'mother_nationality') THEN
        ALTER TABLE students ADD COLUMN mother_nationality VARCHAR(50) DEFAULT 'مصري';
    END IF;
END $$;

-- Add nationality for emergency contacts
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_contacts' AND column_name = 'nationality') THEN
        ALTER TABLE emergency_contacts ADD COLUMN nationality VARCHAR(50) DEFAULT 'مصري';
    END IF;
END $$;

-- =============================================
-- ENTERPRISE NOTIFICATION SYSTEM - نظام الإشعارات المتكامل
-- =============================================

-- حذف الجداول القديمة أولاً
DROP TABLE IF EXISTS notification_delivery CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notification_channels CASCADE;
DROP TABLE IF EXISTS notification_types CASCADE;

-- 1. NOTIFICATION TYPES (يجب إنشاؤه أولاً)
CREATE TABLE notification_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type_code VARCHAR(50) UNIQUE NOT NULL,
    type_name_ar VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. NOTIFICATION CHANNELS
CREATE TABLE notification_channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_code VARCHAR(50) UNIQUE NOT NULL,
    channel_name_ar VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Data أولاً قبل إنشاء جدول notifications
INSERT INTO notification_types (type_code, type_name_ar, icon, color) VALUES
('academic', 'أكاديمي', 'GraduationCap', '#3B82F6'),
('behavioral', 'سلوكي', 'AlertTriangle', '#EF4444'),
('attendance', 'حضور وغياب', 'Calendar', '#F59E0B'),
('financial', 'مالي', 'DollarSign', '#10B981'),
('administrative', 'إداري', 'FileText', '#6B7280'),
('general', 'عام', 'MessageSquare', '#8B5CF6');

INSERT INTO notification_channels (channel_code, channel_name_ar) VALUES
('in_app', 'داخل النظام'),
('whatsapp', 'واتساب'),
('sms', 'رسائل نصية'),
('email', 'بريد إلكتروني');

-- 3. NOTIFICATIONS (بعد إنشاء الجداول المرجعية)
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    notification_type_id UUID REFERENCES notification_types(id) ON DELETE SET NULL,
    title TEXT,
    content TEXT NOT NULL,
    link_url TEXT,
    send_mode TEXT DEFAULT 'manual',
    priority TEXT DEFAULT 'normal',
    status TEXT DEFAULT 'sent',
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Legacy fields
    type TEXT,
    phone_number TEXT
);

-- 4. NOTIFICATION DELIVERY
CREATE TABLE notification_delivery (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    channel_id UUID REFERENCES notification_channels(id) ON DELETE SET NULL,
    delivery_status VARCHAR(50) DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. NOTIFICATION LOGS
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    action_description TEXT,
    performed_by TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. NOTIFICATION TEMPLATES
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_type_id UUID REFERENCES notification_types(id) ON DELETE SET NULL,
    template_name_ar TEXT NOT NULL,
    template_content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_student ON notifications(student_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type_id);
CREATE INDEX idx_notifications_created ON notifications(created_at);
CREATE INDEX idx_delivery_notification ON notification_delivery(notification_id);
CREATE INDEX idx_delivery_student ON notification_delivery(student_id);
CREATE INDEX idx_logs_notification ON notification_logs(notification_id);
CREATE INDEX idx_templates_type ON notification_templates(notification_type_id);

-- Disable RLS
ALTER TABLE notification_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_delivery DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates DISABLE ROW LEVEL SECURITY;

-- =============================================
-- FIX FOR EXISTING TABLES: Ensure unlimited text length
-- =============================================
-- هذا الجزء يضمن تحديث الجداول الموجودة بالفعل لتقبل نصوص غير محدودة
ALTER TABLE notifications 
  ALTER COLUMN type TYPE TEXT,
  ALTER COLUMN phone_number TYPE TEXT,
  ALTER COLUMN send_mode TYPE TEXT,
  ALTER COLUMN priority TYPE TEXT,
  ALTER COLUMN status TYPE TEXT,
  ALTER COLUMN created_by TYPE TEXT,
  ALTER COLUMN title TYPE TEXT,
  ALTER COLUMN content TYPE TEXT;

-- =============================================
-- COMPREHENSIVE FINANCIAL SYSTEM - النظام المالي الشامل
-- =============================================

-- 1. جدول تصنيفات الإيرادات (Revenue Categories)
CREATE TABLE IF NOT EXISTS revenue_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_code VARCHAR(50) UNIQUE NOT NULL,
    category_name_ar VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- البيانات الافتراضية لتصنيفات الإيرادات
INSERT INTO revenue_categories (category_code, category_name_ar, description) VALUES
('TUITION', 'مصروفات دراسية', 'الرسوم الدراسية للطلاب'),
('BUS', 'رسوم الحافلة', 'رسوم خدمة النقل المدرسي'),
('ACTIVITIES', 'رسوم الأنشطة', 'رسوم الأنشطة والرحلات'),
('BOOKS', 'بيع الكتب', 'إيرادات بيع الكتب والمواد'),
('UNIFORM', 'الزي المدرسي', 'إيرادات بيع الزي المدرسي'),
('DONATIONS', 'تبرعات وهبات', 'التبرعات والهبات من أولياء الأمور والخريجين'),
('RENTAL', 'إيجارات', 'إيجار الملاعب والمرافق'),
('OTHER_REVENUE', 'إيرادات أخرى', 'إيرادات متنوعة أخرى'),
-- إيرادات استغلال المرافق والممتلكات
('CAFETERIA', 'إيرادات الكافتيريا والمقصف', 'إيرادات الكافتيريا والمقصف المدرسي'),
('SPORTS_RENTAL', 'إيجار الملاعب الرياضية', 'إيجار ملاعب كرة القدم والسلة والتنس'),
('HALL_RENTAL', 'إيجار القاعات والمسارح', 'إيجار القاعات والمسارح لفعاليات خارجية'),
('CLASSROOM_RENTAL', 'إيجار الفصول والمختبرات', 'إيجار الفصول والمختبرات في المساء أو العطلات'),
('ADVERTISING', 'إيرادات الإعلانات', 'لوحات إعلانية وإعلانات الموقع الإلكتروني'),
('PARKING', 'تأجير مواقف السيارات', 'تأجير مساحات وقوف السيارات'),
('EQUIPMENT_RENTAL', 'تأجير المعدات المتخصصة', 'تأجير المعدات والمختبرات لجهات خارجية'),
-- إيرادات متنوعة وفرص إضافية
('FUNDRAISING', 'عائدات جمع التبرعات', 'عائدات فعاليات جمع التبرعات والحفلات الخيرية'),
('LIBRARY_BAZAAR', 'أرباح المكتبة والبازار', 'أرباح المكتبة المدرسية والبازار المدرسي'),
('GRANTS', 'المنح الحكومية والخاصة', 'المنح من الحكومة أو مؤسسات خاصة للمشاريع التعليمية'),
('INVESTMENTS', 'عائدات الاستثمار', 'عائدات استثمار أموال المدرسة أو صندوق الوقف'),
('DOCUMENT_FEES', 'رسوم التصديق والوثائق', 'رسوم خدمات التصديق والوثائق الرسمية'),
('PARTNERSHIPS', 'أرباح الشراكات', 'أرباح من شراكات مع شركات تعليمية أو تقنية')
ON CONFLICT (category_code) DO NOTHING;

-- 2. جدول تصنيفات المصروفات (Expense Categories)
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_code VARCHAR(50) UNIQUE NOT NULL,
    category_name_ar VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- البيانات الافتراضية لتصنيفات المصروفات
INSERT INTO expense_categories (category_code, category_name_ar, description) VALUES
('SALARIES', 'رواتب', 'رواتب الموظفين والمعلمين'),
('MAINTENANCE', 'صيانة', 'صيانة المباني والمرافق'),
('ELECTRICITY', 'كهرباء', 'فواتير الكهرباء'),
('WATER', 'مياه', 'فواتير المياه'),
('GAS', 'غاز', 'فواتير الغاز'),
('INTERNET', 'إنترنت', 'خدمات الإنترنت والاتصالات'),
('EQUIPMENT', 'معدات وأجهزة', 'شراء المعدات والأجهزة'),
('SUPPLIES', 'مستلزمات', 'المستلزمات المكتبية والتعليمية'),
('CLEANING', 'نظافة', 'مستلزمات ومواد النظافة'),
('SECURITY', 'أمن', 'خدمات الأمن والحراسة'),
('TRANSPORTATION', 'نقل', 'مصروفات النقل والوقود'),
('ADVERTISING', 'إعلانات', 'مصروفات الدعاية والإعلان'),
('INSURANCE', 'تأمين', 'أقساط التأمين'),
('TAXES', 'ضرائب', 'الضرائب والرسوم الحكومية'),
('OTHER_EXPENSE', 'مصروفات أخرى', 'مصروفات متنوعة أخرى')
ON CONFLICT (category_code) DO NOTHING;

-- 3. جدول الموظفين (Employees)
CREATE TABLE IF NOT EXISTS employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    national_id VARCHAR(20),
    employee_type VARCHAR(50) NOT NULL,
    position VARCHAR(100),
    department VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    hire_date DATE,
    contract_type VARCHAR(50) DEFAULT 'دائم',
    base_salary DECIMAL(10,2) DEFAULT 0,
    bank_account VARCHAR(50),
    bank_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    
    -- New Fields for Comprehensive Data
    birth_date DATE,
    gender VARCHAR(20),
    marital_status VARCHAR(20),
    nationality VARCHAR(50),
    religion VARCHAR(20),
    details JSONB DEFAULT '{}'::jsonb, -- For storing extra structured data (phones, previous_experience, courses, documents, etc.)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- UPDATE EXISTING TABLE IF EXISTS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'birth_date') THEN
        ALTER TABLE employees ADD COLUMN birth_date DATE;
        ALTER TABLE employees ADD COLUMN gender VARCHAR(20);
        ALTER TABLE employees ADD COLUMN marital_status VARCHAR(20);
        ALTER TABLE employees ADD COLUMN nationality VARCHAR(50);
        ALTER TABLE employees ADD COLUMN religion VARCHAR(20);
        ALTER TABLE employees ADD COLUMN details JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Termination Fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'termination_date') THEN
        ALTER TABLE employees ADD COLUMN termination_date DATE;
        ALTER TABLE employees ADD COLUMN termination_reason VARCHAR(100);
        ALTER TABLE employees ADD COLUMN termination_status VARCHAR(50) DEFAULT 'مكتمل'; -- مكتمل / معلق (مستحقات)
        ALTER TABLE employees ADD COLUMN termination_details JSONB DEFAULT '{}'::jsonb; -- documents, notes, audit
    END IF;
END $$;

-- 4. جدول الرواتب الشهرية (Salaries)
CREATE TABLE IF NOT EXISTS salaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    academic_year_code VARCHAR(20) REFERENCES academic_years(year_code),
    month VARCHAR(7) NOT NULL,
    base_salary DECIMAL(10,2) NOT NULL,
    total_allowances DECIMAL(10,2) DEFAULT 0,
    total_deductions DECIMAL(10,2) DEFAULT 0,
    net_salary DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'مستحق',
    payment_date DATE,
    payment_method VARCHAR(50),
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, month)
);

-- 5. جدول بنود الراتب (Salary Items)
CREATE TABLE IF NOT EXISTS salary_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    salary_id UUID REFERENCES salaries(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. جدول السلف (Employee Loans)
CREATE TABLE IF NOT EXISTS employee_loans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    loan_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    monthly_deduction DECIMAL(10,2) NOT NULL,
    remaining_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'نشط',
    reason TEXT,
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. جدول الحركات المالية العامة (General Financial Transactions)
CREATE TABLE IF NOT EXISTS general_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    academic_year_code VARCHAR(20) REFERENCES academic_years(year_code),
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    category_id UUID,
    category_type VARCHAR(20),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    reference_type VARCHAR(50),
    reference_id UUID,
    payment_method VARCHAR(50),
    receipt_number VARCHAR(50),
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial System Indexes
CREATE INDEX IF NOT EXISTS idx_employees_type ON employees(employee_type);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);
CREATE INDEX IF NOT EXISTS idx_salaries_employee ON salaries(employee_id);
CREATE INDEX IF NOT EXISTS idx_salaries_month ON salaries(month);
CREATE INDEX IF NOT EXISTS idx_salaries_status ON salaries(status);
CREATE INDEX IF NOT EXISTS idx_salary_items_salary ON salary_items(salary_id);
CREATE INDEX IF NOT EXISTS idx_general_tx_date ON general_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_general_tx_type ON general_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_general_tx_year ON general_transactions(academic_year_code);

-- Disable RLS for Financial Tables
ALTER TABLE revenue_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE salaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE salary_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_loans DISABLE ROW LEVEL SECURITY;
ALTER TABLE general_transactions DISABLE ROW LEVEL SECURITY;

-- بيانات تجريبية للموظفين
INSERT INTO employees (employee_id, full_name, employee_type, position, base_salary, hire_date, is_active) VALUES
('EMP001', 'أحمد محمد علي', 'معلم', 'معلم لغة عربية', 8000, '2020-09-01', true),
('EMP002', 'محمد حسن إبراهيم', 'معلم', 'معلم رياضيات', 8500, '2019-09-01', true),
('EMP003', 'فاطمة أحمد محمود', 'معلم', 'معلمة لغة إنجليزية', 7500, '2021-09-01', true),
('EMP004', 'سارة محمد عبدالله', 'إداري', 'سكرتيرة', 5000, '2018-09-01', true),
('EMP005', 'علي حسين محمد', 'إداري', 'محاسب', 6000, '2017-09-01', true),
('EMP006', 'خالد عبدالرحمن', 'عامل', 'حارس', 3500, '2019-01-01', true),
('EMP007', 'أم محمد', 'عامل', 'عاملة نظافة', 3000, '2020-01-01', true),
('EMP008', 'محمود السائق', 'عامل', 'سائق حافلة', 4000, '2018-01-01', true)
ON CONFLICT (employee_id) DO NOTHING;

SELECT 'تم إنشاء قاعدة البيانات الكاملة بنجاح!' as status;

-- =============================================
-- نظام الإشعارات - NOTIFICATION SYSTEM
-- =============================================

-- حذف الجداول القديمة أولاً
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS notification_delivery CASCADE;
DROP TABLE IF EXISTS notification_deliveries CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notification_channels CASCADE;
DROP TABLE IF EXISTS notification_types CASCADE;

-- 1. جدول أنواع الإشعارات (Notification Types)
CREATE TABLE notification_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type_code VARCHAR(50) UNIQUE NOT NULL,
    type_name_ar VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    priority_level VARCHAR(20) DEFAULT 'normal',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. جدول قنوات الإشعارات (Notification Channels)
CREATE TABLE notification_channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_code VARCHAR(50) UNIQUE NOT NULL,
    channel_name_ar VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. جدول الإشعارات الرئيسي (Notifications)
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_code VARCHAR(50),
    notification_type_id UUID REFERENCES notification_types(id),
    title VARCHAR(255),
    content TEXT NOT NULL,
    link_url VARCHAR(500),
    attachments JSONB,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id),
    class_id UUID,
    stage_id UUID,
    send_mode VARCHAR(20) DEFAULT 'manual',
    priority VARCHAR(20) DEFAULT 'normal',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'draft',
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    metadata JSONB,
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    type VARCHAR(50),
    phone_number VARCHAR(20)
);

-- 4. جدول تسليم الإشعارات (notification_delivery - الاسم المستخدم في الكود)
CREATE TABLE notification_delivery (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    channel_id UUID REFERENCES notification_channels(id),
    delivery_status VARCHAR(20) DEFAULT 'pending',
    contact_info VARCHAR(255),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMP WITH TIME ZONE,
    delivery_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. جدول سجل الإشعارات (Notification Logs)
CREATE TABLE notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    action_type VARCHAR(20) NOT NULL,
    action_description TEXT,
    performed_by VARCHAR(100),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- 6. جدول تفضيلات الإشعارات (Notification Preferences)
CREATE TABLE notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE UNIQUE,
    guardian_id VARCHAR(50),
    channel_preferences JSONB,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    is_enabled BOOLEAN DEFAULT true,
    preferred_language VARCHAR(10) DEFAULT 'ar',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- البيانات الأساسية للإشعارات (Seed Data)
-- =============================================

INSERT INTO notification_types (type_code, type_name_ar, description, icon, color, priority_level) VALUES
('academic', 'أكاديمي', 'إشعارات متعلقة بالدرجات والتقييمات', 'book', 'blue', 'normal'),
('assignments', 'واجبات', 'إشعارات الواجبات والمهام', 'clipboard', 'green', 'normal'),
('behavioral', 'سلوكي', 'إشعارات السلوك والانضباط', 'alert-triangle', 'orange', 'high'),
('attendance', 'حضور', 'إشعارات الحضور والغياب', 'calendar', 'purple', 'high'),
('financial', 'مالي', 'إشعارات المدفوعات والأقساط', 'dollar-sign', 'green', 'normal'),
('administrative', 'إداري', 'إشعارات إدارية عامة', 'briefcase', 'gray', 'normal'),
('emergency', 'طوارئ', 'إشعارات طوارئ', 'alert-circle', 'red', 'urgent'),
('private_message', 'رسالة خاصة', 'رسائل خاصة', 'mail', 'blue', 'normal'),
('data_update', 'تحديث بيانات', 'إشعارات تحديث البيانات', 'edit', 'teal', 'normal'),
('general', 'عام', 'إشعارات عامة', 'bell', 'gray', 'low')
ON CONFLICT (type_code) DO NOTHING;

INSERT INTO notification_channels (channel_code, channel_name_ar, description, is_active) VALUES
('in_app', 'داخل التطبيق', 'إشعارات داخل التطبيق', true),
('whatsapp', 'واتساب', 'رسائل واتساب', true),
('sms', 'رسالة نصية', 'رسائل نصية قصيرة', true),
('email', 'بريد إلكتروني', 'رسائل البريد الإلكتروني', true),
('push', 'إشعار فوري', 'إشعارات فورية للجوال', true)
ON CONFLICT (channel_code) DO NOTHING;

-- إنشاء الفهارس للأداء
CREATE INDEX IF NOT EXISTS idx_notifications_student ON notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_notification ON notification_delivery(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_student ON notification_delivery(student_id);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_status ON notification_delivery(delivery_status);

-- تعطيل RLS للجداول
ALTER TABLE notification_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_delivery DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences DISABLE ROW LEVEL SECURITY;

SELECT 'تم إنشاء نظام الإشعارات بنجاح!' as notification_status;
