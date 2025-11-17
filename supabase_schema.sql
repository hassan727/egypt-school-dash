-- Complete Database Schema for Egyptian School Dashboard
-- طابق تماماً مع الواجهة الفعلية - الأساس هو الواجهة فقط

-- =============================================
-- حذف جميع الجداول القديمة أولاً
-- =============================================
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
DROP TABLE IF EXISTS stages_classes CASCADE;
DROP TABLE IF EXISTS students CASCADE;

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
    academic_year VARCHAR(20) DEFAULT '2025-2026',
    stage VARCHAR(50),
    class VARCHAR(20),
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

-- 6.5.1 ACADEMIC YEARS TABLE - جدول السنوات الدراسية
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

-- 8. BEHAVIORAL RECORDS TABLE - جدول السجلات السلوكية
CREATE TABLE IF NOT EXISTS behavioral_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. FINANCIAL TRANSACTIONS TABLE - جدول المعاملات المالية
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    transaction_type VARCHAR(20), -- 'دفع', 'استرجاع', 'تعديل'
    amount DECIMAL(10,2),
    description TEXT,
    payment_method VARCHAR(30),
    transaction_date DATE,
    receipt_number VARCHAR(50),
    created_by VARCHAR(100),
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. STAGES AND CLASSES TABLE - جدول المراحل والفصول (للدعم الديناميكي)
CREATE TABLE IF NOT EXISTS stages_classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stage_name VARCHAR(50),
    class_name VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default stage-class data (only if empty)
INSERT INTO stages_classes (stage_name, class_name) 
SELECT * FROM (VALUES
('KG1', 'KG1A'), ('KG1', 'KG1B'), ('KG1', 'KG1C'), ('KG1', 'KG1D'),
('KG2', 'KG2A'), ('KG2', 'KG2B'), ('KG2', 'KG2C'), ('KG2', 'KG2D'),
('الصف الأول الابتدائي', '1A'), ('الصف الأول الابتدائي', '1B'), ('الصف الأول الابتدائي', '1C'), ('الصف الأول الابتدائي', '1D'),
('الصف الثاني الابتدائي', '2A'), ('الصف الثاني الابتدائي', '2B'), ('الصف الثاني الابتدائي', '2C'), ('الصف الثاني الابتدائي', '2D'),
('الصف الثالث الابتدائي', '3A'), ('الصف الثالث الابتدائي', '3B'), ('الصف الثالث الابتدائي', '3C'), ('الصف الثالث الابتدائي', '3D'), ('الصف الثالث الابتدائي', '3E'),
('الصف الرابع الابتدائي', '4A'), ('الصف الرابع الابتدائي', '4B'), ('الصف الرابع الابتدائي', '4C'), ('الصف الرابع الابتدائي', '4D'),
('الصف الخامس الابتدائي', '5A'), ('الصف الخامس الابتدائي', '5B'), ('الصف الخامس الابتدائي', '5C'), ('الصف الخامس الابتدائي', '5D'),
('الصف السادس الابتدائي', '6A'), ('الصف السادس الابتدائي', '6B'), ('الصف السادس الابتدائي', '6C'), ('الصف السادس الابتدائي', '6D'),
('الصف الأول الإعدادي', '1A PRE'), ('الصف الأول الإعدادي', '1B PRE'),
('الصف الثاني الإعدادي', '2A PRE'), ('الصف الثاني الإعدادي', '2B PRE'), ('الصف الثاني الإعدادي', '2C PRE'),
('الصف الثالث الإعدادي', '3A PRE'), ('الصف الثالث الإعدادي', '3B PRE'),
('الصف الأول الثانوي', 'S1A'), ('الصف الأول الثانوي', 'S1B'), ('الصف الأول الثانوي', 'S1C'), ('الصف الأول الثانوي', 'S1D'),
('الصف الثاني الثانوي', 'S2A'), ('الصف الثاني الثانوي', 'S2B'), ('الصف الثاني الثانوي', 'S2C'), ('الصف الثاني الثانوي', 'S2D'),
('الصف الثالث الثانوي', 'S3A'), ('الصف الثالث الثانوي', 'S3B'), ('الصف الثالث الثانوي', 'S3C'), ('الصف الثالث الثانوي', 'S3D')
) AS t(stage_name, class_name)
WHERE NOT EXISTS (SELECT 1 FROM stages_classes LIMIT 1);

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
CREATE INDEX IF NOT EXISTS idx_fee_installments_fee_id ON fee_installments(fee_id);
CREATE INDEX IF NOT EXISTS idx_other_expenses_student_id ON other_expenses(student_id);
CREATE INDEX IF NOT EXISTS idx_academic_records_student_id ON academic_records(student_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_records_student_id ON behavioral_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_student_audit_trail_student_id ON student_audit_trail(student_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_student_id ON financial_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_stages_classes_stage ON stages_classes(stage_name);
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
ALTER TABLE financial_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_audit_trail DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE stages_classes DISABLE ROW LEVEL SECURITY;
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
    '01012345678',
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

-- إدراج بيانات الطوارئ
INSERT INTO emergency_contacts (student_id, contact_name, relationship, phone, address)
VALUES ('STU2025001', 'العم محمود', 'عم', '01234567890', 'شارع الهرم، الجيزة')
ON CONFLICT DO NOTHING;

-- إدراج المصروفات الدراسية
INSERT INTO school_fees (student_id, total_amount, installment_count, advance_payment)
VALUES ('STU2025001', 15000.00, 3, 5000.00)
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
-- END OF SCHEMA - تشغيل هذا الملف بالكامل مرة واحدة فقط
-- =============================================
SELECT 'تم إنشاء قاعدة البيانات وبيانات الاختبار بنجاح! يمكنك الآن استخدام النظام' as status;
-- =============================================