-- =============================================
-- Migration: Comprehensive Test Data for Smart Timetable & Payroll
-- إدخال بيانات تجريبية شاملة لاختبار كل حقل وبند في النظام
-- 20260101180000_comprehensive_test_data.sql
-- =============================================

DO $$
DECLARE
    v_year_id UUID;
    v_version_id UUID;
    v_day_sun UUID;
    v_day_mon UUID;
    v_period_1 UUID;
    v_period_2 UUID;
    v_teacher_1 UUID;
    v_teacher_2 UUID;
    v_class_1 UUID;
    v_subject_1 UUID;
    v_salary_id UUID;
    v_school_id UUID;
BEGIN
    -- 0. الحصول على معرف المدرسة الافتراضية
    SELECT id INTO v_school_id FROM schools WHERE school_code = 'DEFAULT' LIMIT 1;
    -- إذا لم توجد، نستخدم أول مدرسة متاحة
    IF v_school_id IS NULL THEN
        SELECT id INTO v_school_id FROM schools LIMIT 1;
    END IF;

    -- 1. التأكد من وجود العام الدراسي
    INSERT INTO academic_years (year_code, year_name_ar, start_date, end_date, is_active)
    VALUES ('2025-2026', 'العام الدراسي 2025-2026', '2025-09-01', '2026-06-30', true)
    ON CONFLICT (year_code) DO UPDATE SET is_active = true
    RETURNING id INTO v_year_id;

    -- 2. الحصول على معرفات الموظفين (المعلمين)
    SELECT id INTO v_teacher_1 FROM employees WHERE employee_id = 'EMP001' LIMIT 1;
    SELECT id INTO v_teacher_2 FROM employees WHERE employee_id = 'EMP002' LIMIT 1;

    -- 3. إدخال أيام الدراسة إذا لم تكن موجودة
    INSERT INTO school_days (day_code, day_name_ar, day_name_en, day_order, academic_year_id, is_active)
    VALUES 
        ('SUN', 'الأحد', 'Sunday', 1, v_year_id, true),
        ('MON', 'الاثنين', 'Monday', 2, v_year_id, true)
    ON CONFLICT (day_code, academic_year_id) DO UPDATE SET is_active = true;
    
    SELECT id INTO v_day_sun FROM school_days WHERE day_code = 'SUN' AND academic_year_id = v_year_id;
    SELECT id INTO v_day_mon FROM school_days WHERE day_code = 'MON' AND academic_year_id = v_year_id;

    -- 4. إدخال الحصص الزمنية
    INSERT INTO time_periods (period_number, name, start_time, end_time, is_break, academic_year_id)
    VALUES 
        (1, 'الحصة الأولى', '08:00:00', '08:45:00', false, v_year_id),
        (2, 'الحصة الثانية', '08:50:00', '09:35:00', false, v_year_id)
    ON CONFLICT (period_number, academic_year_id) DO UPDATE SET name = EXCLUDED.name;

    SELECT id INTO v_period_1 FROM time_periods WHERE period_number = 1 AND academic_year_id = v_year_id;
    SELECT id INTO v_period_2 FROM time_periods WHERE period_number = 2 AND academic_year_id = v_year_id;

    -- 5. إدخال نسخة جدول نشطة
    INSERT INTO schedule_versions (version_name, version_number, academic_year_id, status, is_active)
    VALUES ('جدول الفصل الدراسي الأول - تجريبي', 1, v_year_id, 'published', true)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_version_id;

    IF v_version_id IS NULL THEN
        SELECT id INTO v_version_id FROM schedule_versions WHERE version_name = 'جدول الفصل الدراسي الأول - تجريبي' LIMIT 1;
    END IF;

    -- 6. إدخال مادة وفصل للتجربة
    INSERT INTO subjects (subject_name_ar, subject_code) VALUES ('اللغة العربية', 'ARA101') ON CONFLICT DO NOTHING;
    SELECT id INTO v_subject_1 FROM subjects WHERE subject_code = 'ARA101' LIMIT 1;

    INSERT INTO stages (name) VALUES ('المرحلة الابتدائية') ON CONFLICT DO NOTHING;
    INSERT INTO classes (name, stage_id) 
    SELECT 'الصف الأول - أ', id FROM stages WHERE name = 'المرحلة الابتدائية' LIMIT 1
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_class_1 FROM classes WHERE name = 'الصف الأول - أ' LIMIT 1;

    -- 7. إدخال حصص في الجدول (مع تجربة الحقول المالية الجديدة)
    -- حصة عادية للمعلم 1
    INSERT INTO schedule_slots (version_id, day_id, period_id, class_id, subject_id, teacher_id, slot_type, is_paid, pay_rate)
    VALUES (v_version_id, v_day_sun, v_period_1, v_class_1, v_subject_1, v_teacher_1, 'regular', false, 0)
    ON CONFLICT DO NOTHING;

    -- حصة "احتياطي مدفوعة" للمعلم 2 (لاختبار الربط المالي)
    INSERT INTO schedule_slots (version_id, day_id, period_id, class_id, subject_id, teacher_id, slot_type, is_paid, pay_rate)
    VALUES (v_version_id, v_day_sun, v_period_2, v_class_1, v_subject_1, v_teacher_2, 'spare', true, 75.00)
    ON CONFLICT DO NOTHING;

    -- 8. إدخال بيانات حضور (البصمة) لشهر يناير 2026
    -- المعلم 1 حاضر
    INSERT INTO employee_attendance (employee_id, date, status, check_in_time, check_out_time, school_id)
    VALUES (v_teacher_1, '2026-01-04', 'حاضر', '07:55:00', '15:00:00', v_school_id)
    ON CONFLICT (employee_id, date) DO NOTHING;

    -- المعلم 2 حاضر (ليستحق مكافأة الحصة الاحتياطي)
    INSERT INTO employee_attendance (employee_id, date, status, check_in_time, check_out_time, school_id)
    VALUES (v_teacher_2, '2026-01-04', 'حاضر', '07:50:00', '15:10:00', v_school_id)
    ON CONFLICT (employee_id, date) DO NOTHING;

    -- معلم آخر غائب (لتجربة التنبيه في الجدول)
    INSERT INTO employee_attendance (employee_id, date, status, school_id)
    VALUES (v_teacher_1, '2026-01-05', 'غائب', v_school_id)
    ON CONFLICT (employee_id, date) DO NOTHING;

    -- 9. إدخال سجل راتب تجريبي مع بنود مفصلة
    INSERT INTO salaries (employee_id, academic_year_code, month, base_salary, total_allowances, total_deductions, net_salary, status)
    VALUES (v_teacher_2, '2025-2026', '2026-01', 8500, 300, 0, 8800, 'مستحق')
    ON CONFLICT (employee_id, month) DO UPDATE SET total_allowances = 300, net_salary = 8800
    RETURNING id INTO v_salary_id;

    -- إضافة بنود الراتب (بما في ذلك بند الحصص الاحتياطية)
    INSERT INTO salary_items (salary_id, item_type, item_name, amount, notes)
    VALUES 
        (v_salary_id, 'استحقاق', 'بدل انتقالات', 150, 'بدل ثابت'),
        (v_salary_id, 'استحقاق', 'مكافأة حصص احتياط/بديلة', 150, 'تم احتساب حصتين احتياطي بناء على الجدول')
    ON CONFLICT DO NOTHING;

END $$;

SELECT 'Comprehensive test data inserted successfully' as status;
