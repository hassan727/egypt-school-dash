-- =============================================
-- نظام سجل البصمة للموظفين - Employee Fingerprint Attendance System
-- Migration: 20251214_employee_attendance
-- =============================================

-- 1. جدول سجل حضور الموظفين الرئيسي
CREATE TABLE IF NOT EXISTS employee_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- أوقات الدخول والخروج
    check_in_time TIME,                          -- وقت الدخول الفعلي
    check_out_time TIME,                         -- وقت الخروج الفعلي
    
    -- الجدول الزمني المطلوب
    scheduled_start TIME DEFAULT '08:00:00',     -- وقت بدء الدوام المفترض
    scheduled_end TIME DEFAULT '15:00:00',       -- وقت انتهاء الدوام المفترض
    
    -- الحالة والتفاصيل
    status VARCHAR(20) DEFAULT 'غائب' CHECK (status IN ('حاضر', 'غائب', 'متأخر', 'إجازة', 'إذن', 'مأمورية')),
    late_minutes INTEGER DEFAULT 0,              -- دقائق التأخير
    early_leave_minutes INTEGER DEFAULT 0,       -- دقائق الخروج المبكر
    overtime_minutes INTEGER DEFAULT 0,          -- الوقت الإضافي
    worked_hours DECIMAL(5,2) DEFAULT 0,         -- ساعات العمل الفعلية
    
    -- الإجازات والأذونات
    leave_request_id UUID,                       -- ربط بطلب الإجازة
    permission_reason TEXT,                      -- سبب الإذن
    permission_type VARCHAR(50),                 -- نوع الإذن
    
    -- معلومات جهاز البصمة
    device_id VARCHAR(50),                       -- رقم جهاز البصمة
    fingerprint_verified BOOLEAN DEFAULT true,   -- تم التحقق من البصمة
    
    -- إقفال السجل
    is_locked BOOLEAN DEFAULT false,             -- هل السجل مقفل
    locked_at TIMESTAMP WITH TIME ZONE,          -- تاريخ الإقفال
    locked_by VARCHAR(255),                      -- من أقفل السجل
    
    -- ملاحظات
    notes TEXT,
    
    -- التتبع
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- قيد فريد - موظف واحد ليوم واحد
    UNIQUE(employee_id, date)
);

-- 2. جدول سجل التعديلات (Audit Trail)
CREATE TABLE IF NOT EXISTS attendance_modifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attendance_id UUID REFERENCES employee_attendance(id) ON DELETE CASCADE,
    
    -- من قام بالتعديل
    modified_by VARCHAR(255) NOT NULL,
    modified_by_role VARCHAR(50),
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- تفاصيل التعديل
    field_changed VARCHAR(50) NOT NULL,          -- الحقل المعدل
    old_value TEXT,                              -- القيمة القديمة
    new_value TEXT,                              -- القيمة الجديدة
    
    -- السبب (إجباري)
    reason TEXT NOT NULL,
    
    -- معلومات تقنية
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- 3. جدول ورديات العمل
CREATE TABLE IF NOT EXISTS employee_shifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    
    -- تفاصيل الوردية
    shift_name VARCHAR(100) NOT NULL,            -- اسم الوردية
    shift_type VARCHAR(50) DEFAULT 'صباحي',      -- نوع الوردية
    start_time TIME NOT NULL,                    -- وقت البداية
    end_time TIME NOT NULL,                      -- وقت النهاية
    break_duration_minutes INTEGER DEFAULT 60,   -- مدة الاستراحة
    grace_period_minutes INTEGER DEFAULT 15,     -- فترة السماح بالتأخير
    
    -- أيام العمل (0 = الأحد، 6 = السبت)
    working_days INTEGER[] DEFAULT ARRAY[0,1,2,3,4],
    
    -- فترة الفعالية
    effective_from DATE,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    
    -- التتبع
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. جدول إعدادات الحضور
CREATE TABLE IF NOT EXISTS attendance_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_category VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- الفهارس لتحسين الأداء
-- =============================================
CREATE INDEX IF NOT EXISTS idx_employee_attendance_employee ON employee_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_date ON employee_attendance(date);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_status ON employee_attendance(status);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_employee_date ON employee_attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_locked ON employee_attendance(is_locked);

CREATE INDEX IF NOT EXISTS idx_attendance_modifications_attendance ON attendance_modifications(attendance_id);
CREATE INDEX IF NOT EXISTS idx_attendance_modifications_modified_at ON attendance_modifications(modified_at);

CREATE INDEX IF NOT EXISTS idx_employee_shifts_employee ON employee_shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_active ON employee_shifts(is_active);

-- =============================================
-- Trigger لتحديث updated_at تلقائياً
-- =============================================
-- =============================================
-- Trigger لتحديث updated_at تلقائياً (نسخة آمنة)
-- =============================================
DROP TRIGGER IF EXISTS update_employee_attendance_updated_at ON employee_attendance;
CREATE TRIGGER update_employee_attendance_updated_at
    BEFORE UPDATE ON employee_attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employee_shifts_updated_at ON employee_shifts;
CREATE TRIGGER update_employee_shifts_updated_at
    BEFORE UPDATE ON employee_shifts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendance_settings_updated_at ON attendance_settings;
CREATE TRIGGER update_attendance_settings_updated_at
    BEFORE UPDATE ON attendance_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- تعطيل RLS (للتطوير فقط)
-- =============================================
ALTER TABLE employee_attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_modifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_settings DISABLE ROW LEVEL SECURITY;

-- =============================================
-- البيانات الأساسية - Default Settings (Skip if already exists or constraints fail)
-- =============================================
DO $$
BEGIN
    INSERT INTO attendance_settings (setting_key, setting_value, setting_category, description) VALUES
    ('default_shift_start', '08:00', 'shift', 'وقت بدء الدوام الافتراضي'),
    ('default_shift_end', '15:00', 'shift', 'وقت انتهاء الدوام الافتراضي'),
    ('grace_period_minutes', '15', 'attendance', 'فترة السماح بالتأخير (دقائق)'),
    ('late_threshold_mild', '15', 'attendance', 'عتبة التأخير البسيط (دقائق)'),
    ('late_threshold_severe', '30', 'attendance', 'عتبة التأخير الشديد (دقائق)'),
    ('auto_lock_days', '1', 'lock', 'إقفال السجل تلقائياً بعد (أيام)'),
    ('deduction_per_late_minute', '0.5', 'financial', 'خصم لكل دقيقة تأخير (جنيه)'),
    ('deduction_per_absence', '100', 'financial', 'خصم اليوم الغياب (جنيه)'),
    ('working_hours_per_day', '7', 'shift', 'ساعات العمل اليومية')
    ON CONFLICT (setting_key) DO NOTHING;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Skipping attendance_settings insert: %', SQLERRM;
END $$;

-- =============================================
-- ورديات افتراضية للموظفين الموجودين (Skip if error)
-- =============================================
DO $$
BEGIN
    INSERT INTO employee_shifts (employee_id, shift_name, shift_type, start_time, end_time, grace_period_minutes, working_days, is_active)
    SELECT 
        e.id,
        'الوردية الصباحية',
        'صباحي',
        '08:00:00'::TIME,
        '15:00:00'::TIME,
        15,
        ARRAY[0,1,2,3,4],
        true
    FROM employees e
    WHERE e.is_active = true
    ON CONFLICT DO NOTHING;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Skipping employee_shifts insert: %', SQLERRM;
END $$;

-- =============================================
-- بيانات حضور تجريبية (Skip if error)
-- =============================================
DO $$
BEGIN
    INSERT INTO employee_attendance (employee_id, date, check_in_time, check_out_time, status, late_minutes, worked_hours, scheduled_start, scheduled_end)
    SELECT 
        e.id,
        d.date,
        CASE 
            WHEN RANDOM() < 0.1 THEN NULL
            WHEN RANDOM() < 0.3 THEN ('08:' || LPAD((FLOOR(RANDOM() * 25) + 5)::TEXT, 2, '0'))::TIME
            ELSE ('07:' || LPAD((FLOOR(RANDOM() * 15) + 45)::TEXT, 2, '0'))::TIME
        END,
        CASE 
            WHEN RANDOM() < 0.1 THEN NULL
            ELSE ('14:' || LPAD((FLOOR(RANDOM() * 55))::TEXT, 2, '0'))::TIME
        END,
        CASE 
            WHEN RANDOM() < 0.1 THEN 'غائب'
            WHEN RANDOM() < 0.3 THEN 'متأخر'
            ELSE 'حاضر'
        END,
        CASE 
            WHEN RANDOM() < 0.3 THEN FLOOR(RANDOM() * 25)::INTEGER
            ELSE 0
        END,
        CASE 
            WHEN RANDOM() < 0.1 THEN 0
            ELSE 6 + RANDOM()::DECIMAL(5,2)
        END,
        '08:00:00'::TIME,
        '15:00:00'::TIME
    FROM employees e
    CROSS JOIN (
        SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day')::DATE as date
    ) d
    WHERE e.is_active = true
      AND EXTRACT(DOW FROM d.date) NOT IN (5, 6)
    ON CONFLICT (employee_id, date) DO NOTHING;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Skipping employee_attendance insert: %', SQLERRM;
END $$;

SELECT 'تم إنشاء نظام سجل البصمة بنجاح!' as status;

