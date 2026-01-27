-- =============================================
-- نظام السياج الجغرافي والربط المالي للحضور الشامل
-- Migration: 20260111100000_geofencing_and_payroll.sql
-- =============================================

DO $$
DECLARE
    v_school_id UUID;
BEGIN
    -- جلب معرف المدرسة الافتراضي
    SELECT id INTO v_school_id FROM schools WHERE school_code = 'DEFAULT' LIMIT 1;
    
    -- إذا لم يوجد DEFAULT، نجلب أول مدرسة متاحة
    IF v_school_id IS NULL THEN
        SELECT id INTO v_school_id FROM schools LIMIT 1;
    END IF;

    -- 1. إضافة إعدادات الموقع الجغرافي والربط المالي (تحكم كامل)
    INSERT INTO attendance_settings (setting_key, setting_value, setting_category, description, school_id) VALUES
    ('check_in_latitude', '30.0444', 'geofencing', 'خط عرض نقطة الحضور', v_school_id),
    ('check_in_longitude', '31.2357', 'geofencing', 'خط طول نقطة الحضور', v_school_id),
    ('check_out_latitude', '30.0444', 'geofencing', 'خط عرض نقطة الانصراف', v_school_id),
    ('check_out_longitude', '31.2357', 'geofencing', 'خط طول نقطة الانصراف', v_school_id),
    ('geofencing_radius_meters', '100', 'geofencing', 'نطاق المسافة المسموح بها', v_school_id),
    ('enable_geofencing', 'true', 'geofencing', 'تفعيل التحقق الجغرافي', v_school_id),
    ('payroll_integration_enabled', 'true', 'financial', 'تفعيل ربط الحضور بالرواتب', v_school_id),
    ('late_minute_deduction_rate', '0.5', 'financial', 'مبلغ الخصم لكل دقيقة تأخير', v_school_id)
    ON CONFLICT (setting_key) DO UPDATE SET 
        setting_value = EXCLUDED.setting_value,
        school_id = EXCLUDED.school_id;
END $$;

-- 2. إضافة حقول الموقع والخصم في سجل الحضور
ALTER TABLE employee_attendance 
ADD COLUMN IF NOT EXISTS check_in_latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS check_in_longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS check_out_latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS check_out_longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS distance_from_school_meters DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS deduction_amount DECIMAL(10,2) DEFAULT 0;

-- 3. وظيفة حساب وترحيل خصومات الحضور للرواتب
CREATE OR REPLACE FUNCTION sync_attendance_deductions_to_salary(emp_id UUID, target_month VARCHAR(7))
RETURNS DECIMAL AS $$
DECLARE
    total_deduction DECIMAL(10,2);
    salary_record_id UUID;
BEGIN
    -- حساب إجمالي الخصومات من جدول الحضور للشهر المحدد
    SELECT COALESCE(SUM(deduction_amount), 0)
    INTO total_deduction
    FROM employee_attendance
    WHERE employee_id = emp_id 
    AND TO_CHAR(date, 'YYYY-MM') = target_month;

    -- البحث عن سجل الراتب لهذا الموظف في هذا الشهر
    SELECT id INTO salary_record_id
    FROM salaries
    WHERE employee_id = emp_id AND month = target_month;

    -- إذا وجد سجل راتب، نقوم بتحديث بند "خصومات التأخير"
    IF salary_record_id IS NOT NULL THEN
        -- حذف البند القديم إذا وجد لتجنب التكرار
        DELETE FROM salary_items 
        WHERE salary_id = salary_record_id AND item_name = 'خصومات تأخير (تلقائي)';

        -- إضافة البند الجديد بالقيمة المحسوبة
        IF total_deduction > 0 THEN
            INSERT INTO salary_items (salary_id, item_type, item_name, amount, notes)
            VALUES (salary_record_id, 'deduction', 'خصومات تأخير (تلقائي)', total_deduction, 'تم الحساب تلقائياً بناءً على سجل الحضور');
        END IF;

        -- تحديث إجمالي الخصومات والراتب الصافي في الجدول الرئيسي للرواتب
        UPDATE salaries
        SET 
            total_deductions = (SELECT COALESCE(SUM(amount), 0) FROM salary_items WHERE salary_id = salary_record_id AND item_type = 'deduction'),
            net_salary = base_salary + (SELECT COALESCE(SUM(amount), 0) FROM salary_items WHERE salary_id = salary_record_id AND item_type = 'allowance') 
                         - (SELECT COALESCE(SUM(amount), 0) FROM salary_items WHERE salary_id = salary_record_id AND item_type = 'deduction')
        WHERE id = salary_record_id;
    END IF;

    RETURN total_deduction;
END;
$$ LANGUAGE plpgsql;

-- 4. زناد (Trigger) للتحديث التلقائي للرواتب عند تغيير بيانات الحضور
CREATE OR REPLACE FUNCTION trigger_sync_attendance()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM sync_attendance_deductions_to_salary(NEW.employee_id, TO_CHAR(NEW.date, 'YYYY-MM'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_attendance ON employee_attendance;
CREATE TRIGGER trg_sync_attendance
AFTER INSERT OR UPDATE OF deduction_amount ON employee_attendance
FOR EACH ROW
EXECUTE FUNCTION trigger_sync_attendance();
