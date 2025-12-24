-- =============================================
-- نظام التنبيهات الذكية - Smart Alerts System
-- Migration: 20251223_0002_smart_alerts_system
-- =============================================

-- 1. جدول التنبيهات الذكية
CREATE TABLE IF NOT EXISTS smart_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- نوع التنبيه
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    
    -- المحتوى
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    recommended_action TEXT,
    
    -- الكيان المتأثر
    affected_entity VARCHAR(100) NOT NULL, -- student_id, employee_id, إلخ
    affected_entity_type VARCHAR(20) NOT NULL CHECK (affected_entity_type IN ('student', 'employee', 'teacher', 'school')),
    
    -- القيم
    current_value JSONB, -- القيمة الحالية (مثل: نسبة الدفع)
    threshold_value JSONB, -- القيمة الحد (مثل: 30%)
    
    -- الحالة
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'resolved')),
    dismissed_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- الوقت
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_type ON smart_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_severity ON smart_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_affected_entity ON smart_alerts(affected_entity);
CREATE INDEX IF NOT EXISTS idx_status ON smart_alerts(status);
CREATE INDEX IF NOT EXISTS idx_created_at ON smart_alerts(created_at);

-- 2. جدول تاريخ التنبيهات (للتحليل)
CREATE TABLE IF NOT EXISTS alert_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_id UUID REFERENCES smart_alerts(id) ON DELETE CASCADE,
    
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    changed_by UUID,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_alert_id ON alert_history(alert_id);
CREATE INDEX IF NOT EXISTS idx_changed_at ON alert_history(changed_at);

-- 3. جدول إعدادات التنبيهات (المعايير)
CREATE TABLE IF NOT EXISTS alert_thresholds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    alert_type VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    
    -- المعايير
    threshold_value JSONB,
    severity_level VARCHAR(20),
    enabled BOOLEAN DEFAULT true,
    
    -- الوقت
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_type ON alert_thresholds(alert_type);

-- =============================================
-- بيانات أولية - Initial Data
-- =============================================

-- معايير التنبيهات الافتراضية
INSERT INTO alert_thresholds (alert_type, description, threshold_value, severity_level, enabled)
VALUES
    ('student_payment_overdue', 'الطالب متأخر في دفع الرسوم', '{"percentage": 30}'::jsonb, 'high', true),
    ('student_payment_not_started', 'الطالب لم يدفع أي رسوم', '{"percentage": 0}'::jsonb, 'critical', true),
    ('student_fail_risk', 'خطر رسوب الطالب', '{"average": 40}'::jsonb, 'critical', true),
    ('student_multiple_failing_subjects', 'الطالب راسب في عدة مواد', '{"count": 2}'::jsonb, 'high', true),
    ('employee_frequent_late', 'موظف متأخر باستمرار', '{"times_per_month": 10}'::jsonb, 'high', true),
    ('employee_frequent_absent', 'موظف متغيب باستمرار', '{"days": 5}'::jsonb, 'critical', true),
    ('salary_delayed', 'راتب متأخر', '{"days": 30}'::jsonb, 'critical', true)
ON CONFLICT (alert_type) DO UPDATE SET
    threshold_value = EXCLUDED.threshold_value,
    severity_level = EXCLUDED.severity_level,
    enabled = EXCLUDED.enabled;

-- =============================================
-- الدوال والـ Triggers
-- =============================================

-- 1. دالة تحديث timestamp
CREATE OR REPLACE FUNCTION update_smart_alerts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger لتحديث الـ updated_at
DROP TRIGGER IF EXISTS smart_alerts_timestamp_trigger ON smart_alerts;
CREATE TRIGGER smart_alerts_timestamp_trigger
BEFORE UPDATE ON smart_alerts
FOR EACH ROW
EXECUTE FUNCTION update_smart_alerts_timestamp();

-- 3. دالة تسجيل تاريخ التنبيهات
CREATE OR REPLACE FUNCTION log_alert_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO alert_history (alert_id, old_status, new_status, changed_at)
        VALUES (NEW.id, OLD.status, NEW.status, NOW());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger لتسجيل التغييرات
DROP TRIGGER IF EXISTS alert_status_change_trigger ON smart_alerts;
CREATE TRIGGER alert_status_change_trigger
AFTER UPDATE ON smart_alerts
FOR EACH ROW
EXECUTE FUNCTION log_alert_status_change();

-- =============================================
-- Scheduled Functions (يحتاج PostgreSQL 15+)
-- =============================================

-- ملاحظة: إذا كان لديك PostgreSQL 15+، يمكنك استخدام:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('run_smart_alerts', '0 * * * *', 'SELECT run_smart_analytics();');

-- =============================================
-- RLS (Row Level Security)
-- =============================================

ALTER TABLE smart_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to view alerts" ON smart_alerts;
CREATE POLICY "Allow authenticated users to view alerts" ON smart_alerts
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update alerts" ON smart_alerts;
CREATE POLICY "Allow authenticated users to update alerts" ON smart_alerts
    FOR UPDATE USING (auth.role() = 'authenticated');

ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to view alert history" ON alert_history;
CREATE POLICY "Allow authenticated users to view alert history" ON alert_history
    FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE alert_thresholds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to manage thresholds" ON alert_thresholds;
CREATE POLICY "Allow authenticated users to manage thresholds" ON alert_thresholds
    FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- أمثلة على الاستخدام
-- =============================================

/*
-- 1. جلب التنبيهات الحرجة
SELECT * FROM smart_alerts
WHERE severity = 'critical' AND status = 'active'
ORDER BY created_at DESC;

-- 2. جلب تنبيهات طالب معين
SELECT * FROM smart_alerts
WHERE affected_entity = 'S001' AND status = 'active';

-- 3. حساب عدد التنبيهات حسب النوع
SELECT alert_type, COUNT(*) as count
FROM smart_alerts
WHERE status = 'active'
GROUP BY alert_type
ORDER BY count DESC;

-- 4. جلب التنبيهات التي تم حلها اليوم
SELECT * FROM smart_alerts
WHERE status = 'resolved' AND DATE(resolved_at) = CURRENT_DATE;

-- 5. تحديث معيار التنبيهات
UPDATE alert_thresholds
SET threshold_value = '{"percentage": 25}'::jsonb
WHERE alert_type = 'student_payment_overdue';
*/
