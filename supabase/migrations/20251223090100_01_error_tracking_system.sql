-- =============================================
-- نظام تتبع الأخطاء الذكي - Smart Error Tracking System
-- Migration: 20251223_0001_error_tracking_system
-- =============================================

-- 1. جدول سجلات الأخطاء
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    error_code VARCHAR(50) NOT NULL, -- ERR_001_GRADE_NOT_FOUND
    error_message TEXT NOT NULL,
    error_type VARCHAR(20) NOT NULL CHECK (error_type IN ('validation', 'database', 'network', 'auth', 'unknown')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    
    -- السياق
    module VARCHAR(100) NOT NULL, -- StudentAcademic, EmployeePayroll
    function_name VARCHAR(100) NOT NULL,
    user_id UUID,
    user_role VARCHAR(50),
    
    -- البيانات الإضافية
    context JSONB DEFAULT '{}'::jsonb, -- student_id, grade_id, إلخ
    stack_trace TEXT,
    
    -- معلومات النظام
    user_agent TEXT,
    ip_address VARCHAR(45),
    browser_info VARCHAR(100),
    
    -- الحالة
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'resolved', 'ignored')),
    resolution_notes TEXT,
    
    -- الوقت
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_code ON error_logs(error_code);
CREATE INDEX IF NOT EXISTS idx_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_module ON error_logs(module);
CREATE INDEX IF NOT EXISTS idx_created_at ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_status ON error_logs(status);

-- 2. جدول التنبيهات
CREATE TABLE IF NOT EXISTS error_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    error_log_id UUID NOT NULL REFERENCES error_logs(id) ON DELETE CASCADE,
    sent_to TEXT[] NOT NULL, -- array of emails
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('email', 'whatsapp', 'in_app')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_by UUID,
    acknowledged_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_error_log ON error_alerts(error_log_id);
CREATE INDEX IF NOT EXISTS idx_sent_at ON error_alerts(sent_at);

-- 3. جدول إحصائيات الأخطاء (للأداء)
CREATE TABLE IF NOT EXISTS error_statistics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    total_errors INTEGER DEFAULT 0,
    critical_count INTEGER DEFAULT 0,
    high_count INTEGER DEFAULT 0,
    medium_count INTEGER DEFAULT 0,
    low_count INTEGER DEFAULT 0,
    by_module JSONB DEFAULT '{}'::jsonb,
    by_type JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(date)
);

-- 4. جدول أنماط الأخطاء (للكشف عن المشاكل المتكررة)
CREATE TABLE IF NOT EXISTS error_patterns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    error_code VARCHAR(50) NOT NULL,
    pattern_type VARCHAR(50), -- recurring, spike, cascade
    occurrences INTEGER DEFAULT 0,
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'monitoring')),
    
    UNIQUE(error_code, pattern_type)
);

-- =============================================
-- دوال وتطبيقات (Functions & Triggers)
-- =============================================

-- 1. دالة تحديث timestamp
CREATE OR REPLACE FUNCTION update_error_logs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger لتحديث الـ updated_at
DROP TRIGGER IF EXISTS error_logs_timestamp_trigger ON error_logs;
CREATE TRIGGER error_logs_timestamp_trigger
BEFORE UPDATE ON error_logs
FOR EACH ROW
EXECUTE FUNCTION update_error_logs_timestamp();

-- 3. دالة تحديث الإحصائيات اليومية
CREATE OR REPLACE FUNCTION update_daily_error_statistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO error_statistics (
        date,
        total_errors,
        critical_count,
        high_count,
        medium_count,
        low_count,
        by_module,
        by_type
    )
    SELECT
        CURRENT_DATE,
        COUNT(*),
        COUNT(CASE WHEN severity = 'critical' THEN 1 END),
        COUNT(CASE WHEN severity = 'high' THEN 1 END),
        COUNT(CASE WHEN severity = 'medium' THEN 1 END),
        COUNT(CASE WHEN severity = 'low' THEN 1 END),
        jsonb_object_agg(module, count) FILTER (WHERE module IS NOT NULL),
        jsonb_object_agg(error_type, count) FILTER (WHERE error_type IS NOT NULL)
    FROM (
        SELECT module, error_type, severity, COUNT(*) as count
        FROM error_logs
        WHERE DATE(created_at) = CURRENT_DATE
        GROUP BY module, error_type, severity
    ) stats
    ON CONFLICT (date) DO UPDATE SET
        total_errors = EXCLUDED.total_errors,
        critical_count = EXCLUDED.critical_count,
        high_count = EXCLUDED.high_count,
        medium_count = EXCLUDED.medium_count,
        low_count = EXCLUDED.low_count,
        by_module = EXCLUDED.by_module,
        by_type = EXCLUDED.by_type;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger للإحصائيات اليومية
DROP TRIGGER IF EXISTS daily_statistics_trigger ON error_logs;
CREATE TRIGGER daily_statistics_trigger
AFTER INSERT ON error_logs
FOR EACH STATEMENT
EXECUTE FUNCTION update_daily_error_statistics();

-- 5. دالة كشف الأنماط المتكررة
CREATE OR REPLACE FUNCTION detect_error_patterns()
RETURNS TABLE (
    error_code VARCHAR,
    pattern_type VARCHAR,
    occurrences_24h BIGINT,
    severity_max VARCHAR
) AS $$
BEGIN
    -- اكتشاف الأخطاء المتكررة
    RETURN QUERY
    SELECT
        el.error_code,
        'recurring'::VARCHAR,
        COUNT(*)::BIGINT,
        MAX(el.severity)::VARCHAR
    FROM error_logs el
    WHERE el.created_at > NOW() - INTERVAL '24 hours'
    GROUP BY el.error_code
    HAVING COUNT(*) > 3; -- أكثر من 3 مرات في 24 ساعة
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- RLS (Row Level Security)
-- =============================================

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to view errors" ON error_logs;
CREATE POLICY "Allow authenticated users to view errors" ON error_logs
    FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE error_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to manage alerts" ON error_alerts;
CREATE POLICY "Allow authenticated users to manage alerts" ON error_alerts
    FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- مثال على الاستخدام (Examples)
-- =============================================

/*
-- مثال 1: إدراج خطأ
INSERT INTO error_logs (
    error_code, error_message, error_type, severity, module, function_name, context
) VALUES (
    'ERR_GRADE_NOT_FOUND',
    'الدرجة غير موجودة',
    'database',
    'high',
    'StudentAcademic',
    'getStudentGrades',
    '{"student_id": "S001", "subject_id": "MATH"}'
);

-- مثال 2: جلب الأخطاء الحرجة في آخر 24 ساعة
SELECT * FROM error_logs
WHERE severity = 'critical'
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- مثال 3: اكتشاف الأخطاء المتكررة
SELECT * FROM detect_error_patterns();

-- مثال 4: إحصائيات اليوم
SELECT * FROM error_statistics WHERE date = CURRENT_DATE;
*/
