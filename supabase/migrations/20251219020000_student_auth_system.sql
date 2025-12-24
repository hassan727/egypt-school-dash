-- =============================================
-- STUDENT AUTHENTICATION SYSTEM - نظام مصادقة الطلاب
-- Multi-Tenant Architecture with Auto Account Creation
-- =============================================
-- Migration: 20251219020000_student_auth_system.sql
-- Author: System
-- Description: Creates schools, student_accounts, parents, and student_parent tables
-- =============================================

-- =============================================
-- 1. SCHOOLS TABLE - جدول المدارس
-- =============================================
CREATE TABLE IF NOT EXISTS schools (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_code VARCHAR(20) UNIQUE NOT NULL,
    school_name VARCHAR(255) NOT NULL,
    school_name_en VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    governorate VARCHAR(100),
    phone VARCHAR(20),
    phone_secondary VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(255),
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_schools_code ON schools(school_code);
CREATE INDEX IF NOT EXISTS idx_schools_active ON schools(is_active);

-- =============================================
-- 2. ADD school_id TO STUDENTS TABLE
-- =============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'school_id'
    ) THEN
        ALTER TABLE students ADD COLUMN school_id UUID REFERENCES schools(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);

-- =============================================
-- 3. STUDENT ACCOUNTS TABLE - جدول حسابات الطلاب
-- =============================================
CREATE TABLE IF NOT EXISTS student_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    -- الرقم القومي هو اسم المستخدم - فريد في كل النظام
    national_id VARCHAR(14) UNIQUE NOT NULL,
    -- كلمة المرور = آخر 6 أرقام من الرقم القومي
    password_hash VARCHAR(6) NOT NULL,
    -- حالة الحساب
    is_active BOOLEAN DEFAULT true,
    -- تتبع آخر دخول
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Constraints
    UNIQUE(student_id)
);

-- Indexes for authentication performance
CREATE INDEX IF NOT EXISTS idx_student_accounts_national_id ON student_accounts(national_id);
CREATE INDEX IF NOT EXISTS idx_student_accounts_student ON student_accounts(student_id);
CREATE INDEX IF NOT EXISTS idx_student_accounts_school ON student_accounts(school_id);
CREATE INDEX IF NOT EXISTS idx_student_accounts_active ON student_accounts(is_active);

-- =============================================
-- 4. PARENTS TABLE - جدول أولياء الأمور
-- =============================================
CREATE TABLE IF NOT EXISTS parents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    -- البيانات الشخصية
    full_name VARCHAR(255) NOT NULL,
    national_id VARCHAR(14),
    phone VARCHAR(20),
    phone_secondary VARCHAR(20),
    whatsapp VARCHAR(20),
    email VARCHAR(100),
    -- بيانات العمل
    job VARCHAR(100),
    workplace VARCHAR(100),
    education_level VARCHAR(50),
    -- العنوان
    address TEXT,
    governorate VARCHAR(100),
    city VARCHAR(100),
    -- نوع العلاقة
    relationship_type VARCHAR(50) DEFAULT 'أب',
    -- حالة التفعيل
    is_active BOOLEAN DEFAULT true,
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Unique constraint per school + national_id
    UNIQUE(school_id, national_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_parents_school ON parents(school_id);
CREATE INDEX IF NOT EXISTS idx_parents_national_id ON parents(national_id);
CREATE INDEX IF NOT EXISTS idx_parents_phone ON parents(phone);

-- =============================================
-- 5. STUDENT_PARENT LINKING TABLE - ربط الطلاب بأولياء الأمور
-- =============================================
CREATE TABLE IF NOT EXISTS student_parent (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
    -- هل هذا الولي هو الأساسي؟
    is_primary BOOLEAN DEFAULT false,
    -- نوع العلاقة (أب، أم، وصي)
    relationship VARCHAR(50),
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Prevent duplicate links
    UNIQUE(student_id, parent_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_student_parent_student ON student_parent(student_id);
CREATE INDEX IF NOT EXISTS idx_student_parent_parent ON student_parent(parent_id);

-- =============================================
-- 6. FUNCTION: Generate Password from National ID
-- =============================================
CREATE OR REPLACE FUNCTION generate_student_password(national_id VARCHAR(14))
RETURNS VARCHAR(6) AS $$
BEGIN
    -- Return last 6 digits of the national ID
    RETURN RIGHT(national_id, 6);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================
-- 7. FUNCTION: Create or Update Student Account
-- =============================================
CREATE OR REPLACE FUNCTION upsert_student_account()
RETURNS TRIGGER AS $$
DECLARE
    v_password VARCHAR(6);
BEGIN
    -- Only proceed if national_id exists and has 14 characters
    IF NEW.national_id IS NOT NULL AND LENGTH(NEW.national_id) = 14 THEN
        -- Generate password
        v_password := generate_student_password(NEW.national_id);
        
        -- Upsert into student_accounts
        INSERT INTO student_accounts (
            student_id, 
            school_id, 
            national_id, 
            password_hash,
            is_active
        )
        VALUES (
            NEW.student_id,
            NEW.school_id,
            NEW.national_id,
            v_password,
            true
        )
        ON CONFLICT (student_id) 
        DO UPDATE SET
            national_id = EXCLUDED.national_id,
            school_id = EXCLUDED.school_id,
            password_hash = EXCLUDED.password_hash,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 8. TRIGGER: Auto-create account on student insert/update
-- =============================================
DROP TRIGGER IF EXISTS trigger_upsert_student_account ON students;

CREATE TRIGGER trigger_upsert_student_account
    AFTER INSERT OR UPDATE OF national_id, school_id
    ON students
    FOR EACH ROW
    EXECUTE FUNCTION upsert_student_account();

-- =============================================
-- 9. FUNCTION: Authenticate Student
-- =============================================
CREATE OR REPLACE FUNCTION authenticate_student(
    p_national_id VARCHAR(14),
    p_password VARCHAR(6)
)
RETURNS TABLE (
    student_id VARCHAR(20),
    school_id UUID,
    school_name VARCHAR(255),
    full_name VARCHAR(255),
    is_authenticated BOOLEAN
) AS $$
DECLARE
    v_account RECORD;
BEGIN
    -- Find account by national_id
    SELECT sa.*, s.full_name_ar, sc.school_name
    INTO v_account
    FROM student_accounts sa
    JOIN students s ON s.student_id = sa.student_id
    JOIN schools sc ON sc.id = sa.school_id
    WHERE sa.national_id = p_national_id
    AND sa.is_active = true;
    
    -- Check if found and password matches
    IF v_account IS NOT NULL AND v_account.password_hash = p_password THEN
        -- Update last login
        UPDATE student_accounts
        SET last_login = NOW(),
            login_count = login_count + 1
        WHERE national_id = p_national_id;
        
        -- Return success
        RETURN QUERY SELECT 
            v_account.student_id,
            v_account.school_id,
            v_account.school_name,
            v_account.full_name_ar,
            true::BOOLEAN;
    ELSE
        -- Return failure
        RETURN QUERY SELECT 
            NULL::VARCHAR(20),
            NULL::UUID,
            NULL::VARCHAR(255),
            NULL::VARCHAR(255),
            false::BOOLEAN;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 10. SEED: Default School (for existing data)
-- =============================================
INSERT INTO schools (school_code, school_name, is_active)
VALUES ('DEFAULT', 'المدرسة الافتراضية', true)
ON CONFLICT (school_code) DO NOTHING;

-- Link existing students to default school
UPDATE students 
SET school_id = (SELECT id FROM schools WHERE school_code = 'DEFAULT')
WHERE school_id IS NULL;

-- =============================================
-- 11. DISABLE RLS (Development Only)
-- =============================================
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE parents DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_parent DISABLE ROW LEVEL SECURITY;

-- =============================================
-- 12. UPDATE TRIGGERS
-- =============================================
DROP TRIGGER IF EXISTS update_schools_updated_at ON schools;
CREATE TRIGGER update_schools_updated_at
    BEFORE UPDATE ON schools
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_accounts_updated_at ON student_accounts;
CREATE TRIGGER update_student_accounts_updated_at
    BEFORE UPDATE ON student_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_parents_updated_at ON parents;
CREATE TRIGGER update_parents_updated_at
    BEFORE UPDATE ON parents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 13. CREATE ACCOUNTS FOR EXISTING STUDENTS
-- =============================================
-- This creates accounts for all students that have national_id
INSERT INTO student_accounts (student_id, school_id, national_id, password_hash, is_active)
SELECT 
    s.student_id,
    s.school_id,
    s.national_id,
    RIGHT(s.national_id, 6),
    true
FROM students s
WHERE s.national_id IS NOT NULL 
AND LENGTH(s.national_id) = 14
AND s.school_id IS NOT NULL
ON CONFLICT (student_id) DO NOTHING;

SELECT 'تم إنشاء نظام مصادقة الطلاب بنجاح!' as status;
