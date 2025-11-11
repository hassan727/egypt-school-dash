-- Complete Database Schema for Egyptian School Dashboard
-- طابق تماماً مع الواجهة الفعلية - الأساس هو الواجهة فقط

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

-- 7. GRADES TABLE - جدول الدرجات الفردية
CREATE TABLE IF NOT EXISTS grades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    subject_name VARCHAR(100) NOT NULL,
    teacher_name VARCHAR(100),
    assessment_type VARCHAR(50) NOT NULL,
    month VARCHAR(20),
    semester VARCHAR(20),
    original_grade DECIMAL(5,2) NOT NULL,
    final_grade DECIMAL(5,2) NOT NULL,
    grade_level VARCHAR(20),
    teacher_notes TEXT,
    weight DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(100)
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

-- =============================================
-- تم إعداد قاعدة البيانات بنجاح!
-- ✅ تم إنشاء جميع الجداول
-- ✅ تم تعطيل RLS
-- ✅ تم إضافة الـ Triggers والـ Indexes
-- =============================================