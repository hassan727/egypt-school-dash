-- =============================================
-- LINK EXISTING DATA TO DEFAULT SCHOOL + DEMO SCHOOL SETUP
-- ربط البيانات الحالية بالمدرسة الافتراضية + إعداد مدرسة الديمو
-- =============================================

-- =============================================
-- 1. GET OR CREATE DEFAULT SCHOOL
-- =============================================
DO $$
DECLARE
    v_default_school_id UUID;
BEGIN
    -- Check if default school exists
    SELECT id INTO v_default_school_id FROM schools WHERE school_code = 'DEFAULT' LIMIT 1;
    
    -- If not exists, create it
    IF v_default_school_id IS NULL THEN
        INSERT INTO schools (school_code, school_name, school_name_en, is_active)
        VALUES ('DEFAULT', 'المدرسة الرئيسية', 'Main School', true)
        RETURNING id INTO v_default_school_id;
        
        RAISE NOTICE 'Created default school with ID: %', v_default_school_id;
    ELSE
        RAISE NOTICE 'Default school already exists with ID: %', v_default_school_id;
    END IF;
    
    -- =============================================
    -- 2. LINK ALL EXISTING STUDENTS TO DEFAULT SCHOOL
    -- All existing students belong to this school
    -- =============================================
    UPDATE students 
    SET school_id = v_default_school_id 
    WHERE school_id IS NULL;
    
    RAISE NOTICE 'Linked all students with NULL school_id to default school';
    
END $$;

-- =============================================
-- 3. CREATE DEMO SCHOOL (مدرسة تجريبية)
-- Completely separate, fake data only
-- =============================================
INSERT INTO schools (school_code, school_name, school_name_en, is_active, address, city, governorate, phone, email)
VALUES (
    'DEMO',
    '🎮 مدرسة تجريبية (للعرض فقط)',
    'Demo School (Display Only)',
    true,
    'شارع التجربة',
    'المدينة التجريبية',
    'محافظة الديمو',
    '0123456789',
    'demo@school.test'
)
ON CONFLICT (school_code) DO UPDATE SET
    school_name = EXCLUDED.school_name,
    is_active = true;

-- Get demo school ID
DO $$
DECLARE
    v_demo_school_id UUID;
BEGIN
    SELECT id INTO v_demo_school_id FROM schools WHERE school_code = 'DEMO' LIMIT 1;
    
    IF v_demo_school_id IS NOT NULL THEN
        -- =============================================
        -- 4. CREATE DEMO STUDENTS (طلاب وهميين)
        -- =============================================
        
        -- Demo Student 1
        INSERT INTO students (student_id, national_id, full_name_ar, gender, date_of_birth, 
            stage, class, school_id, guardian_full_name, guardian_phone, enrollment_date)
        VALUES (
            'DEMO-STD-001', '30012345678901', 'أحمد محمد علي (تجريبي)', 
            'ذكر', '2010-05-15', 'المرحلة الابتدائية', 'الصف الأول', 
            v_demo_school_id, 'محمد علي (ولي أمر تجريبي)', '01012345678', CURRENT_DATE
        )
        ON CONFLICT (student_id) DO NOTHING;
        
        -- Demo Student 2
        INSERT INTO students (student_id, national_id, full_name_ar, gender, date_of_birth, 
            stage, class, school_id, guardian_full_name, guardian_phone, enrollment_date)
        VALUES (
            'DEMO-STD-002', '30012345678902', 'سارة أحمد محمود (تجريبية)', 
            'أنثى', '2011-08-20', 'المرحلة الابتدائية', 'الصف الثاني', 
            v_demo_school_id, 'أحمد محمود (ولي أمر تجريبي)', '01112345678', CURRENT_DATE
        )
        ON CONFLICT (student_id) DO NOTHING;
        
        -- Demo Student 3
        INSERT INTO students (student_id, national_id, full_name_ar, gender, date_of_birth, 
            stage, class, school_id, guardian_full_name, guardian_phone, enrollment_date)
        VALUES (
            'DEMO-STD-003', '30012345678903', 'يوسف إبراهيم (تجريبي)', 
            'ذكر', '2009-03-10', 'المرحلة الإعدادية', 'الصف الأول', 
            v_demo_school_id, 'إبراهيم أحمد (ولي أمر تجريبي)', '01212345678', CURRENT_DATE
        )
        ON CONFLICT (student_id) DO NOTHING;
        
        -- Demo Student 4
        INSERT INTO students (student_id, national_id, full_name_ar, gender, date_of_birth, 
            stage, class, school_id, guardian_full_name, guardian_phone, enrollment_date)
        VALUES (
            'DEMO-STD-004', '30012345678904', 'مريم خالد (تجريبية)', 
            'أنثى', '2012-11-25', 'المرحلة الابتدائية', 'الصف الثالث', 
            v_demo_school_id, 'خالد محمود (ولي أمر تجريبي)', '01512345678', CURRENT_DATE
        )
        ON CONFLICT (student_id) DO NOTHING;
        
        -- Demo Student 5
        INSERT INTO students (student_id, national_id, full_name_ar, gender, date_of_birth, 
            stage, class, school_id, guardian_full_name, guardian_phone, enrollment_date)
        VALUES (
            'DEMO-STD-005', '30012345678905', 'عمر محمد (تجريبي)', 
            'ذكر', '2010-07-08', 'المرحلة الابتدائية', 'الصف الأول', 
            v_demo_school_id, 'محمد حسن (ولي أمر تجريبي)', '01098765432', CURRENT_DATE
        )
        ON CONFLICT (student_id) DO NOTHING;
        
        RAISE NOTICE 'Created 5 demo students for demo school';
        
        -- =============================================
        -- 5. UPDATE DEMO USER TO USE DEMO SCHOOL
        -- =============================================
        UPDATE system_users 
        SET school_id = v_demo_school_id 
        WHERE role = 'demo';
        
        RAISE NOTICE 'Linked demo users to demo school';
    END IF;
END $$;

-- =============================================
-- 6. CREATE DEMO STUDENT ACCOUNTS (Auto)
-- The trigger should handle this, but let's ensure
-- =============================================
-- Note: student_accounts are auto-created by trigger when national_id is set

-- =============================================
-- 7. SHOW SUMMARY
-- =============================================
DO $$
DECLARE
    v_default_count INTEGER;
    v_demo_count INTEGER;
    v_no_school_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_default_count FROM students s 
        JOIN schools sc ON s.school_id = sc.id WHERE sc.school_code = 'DEFAULT';
    SELECT COUNT(*) INTO v_demo_count FROM students s 
        JOIN schools sc ON s.school_id = sc.id WHERE sc.school_code = 'DEMO';
    SELECT COUNT(*) INTO v_no_school_count FROM students WHERE school_id IS NULL;
    
    RAISE NOTICE '=== SUMMARY ===';
    RAISE NOTICE 'Students in Default School: %', v_default_count;
    RAISE NOTICE 'Students in Demo School: %', v_demo_count;
    RAISE NOTICE 'Students with NO School: %', v_no_school_count;
END $$;
