-- تقارير الحضور اليدوية
-- Migration: 20251217101000_manual_attendance_reports.sql
-- الهدف: إنشاء جدول لحفظ بيانات تقارير الحضور المدخلة يدوياً

-- ========================================
-- 1. جدول التقارير الرئيسي (رأس التقرير)
-- ========================================
CREATE TABLE IF NOT EXISTS manual_attendance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date DATE NOT NULL,                       -- تاريخ التقرير
    academic_year_id UUID REFERENCES academic_years(id),
    academic_year_code VARCHAR(20),                  -- كود السنة للعرض السريع
    report_title VARCHAR(255),                       -- عنوان التقرير (اختياري)
    notes TEXT,                                      -- ملاحظات
    total_enrolled INTEGER DEFAULT 0,                -- إجمالي المقيد
    total_present INTEGER DEFAULT 0,                 -- إجمالي الحاضر
    total_absent INTEGER DEFAULT 0,                  -- إجمالي الغائب
    attendance_rate NUMERIC(5,2) DEFAULT 0,          -- نسبة الحضور
    absence_rate NUMERIC(5,2) DEFAULT 0,             -- نسبة الغياب
    created_by UUID,                                 -- المستخدم الذي أنشأ التقرير
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 2. جدول تفاصيل التقرير (بيانات كل فصل)
-- ========================================
CREATE TABLE IF NOT EXISTS manual_attendance_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES manual_attendance_reports(id) ON DELETE CASCADE,
    stage_id UUID REFERENCES stages(id),             -- مرجع المرحلة
    stage_name VARCHAR(100) NOT NULL,                -- اسم المرحلة (للعرض السريع)
    class_id UUID REFERENCES classes(id),            -- مرجع الفصل
    class_name VARCHAR(100) NOT NULL,                -- اسم الفصل (للعرض السريع)
    enrolled INTEGER NOT NULL DEFAULT 0,             -- عدد المقيد
    present INTEGER NOT NULL DEFAULT 0,              -- عدد الحاضر
    absent INTEGER NOT NULL DEFAULT 0,               -- عدد الغائب
    attendance_rate NUMERIC(5,2) DEFAULT 0,          -- نسبة الحضور
    absence_rate NUMERIC(5,2) DEFAULT 0,             -- نسبة الغياب
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 3. الفهارس لتحسين الأداء
-- ========================================
CREATE INDEX IF NOT EXISTS idx_manual_reports_date ON manual_attendance_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_manual_reports_academic_year ON manual_attendance_reports(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_manual_entries_report ON manual_attendance_entries(report_id);
CREATE INDEX IF NOT EXISTS idx_manual_entries_stage ON manual_attendance_entries(stage_id);

-- ========================================
-- 4. تريجر تحديث updated_at
-- ========================================
DROP TRIGGER IF EXISTS update_manual_reports_updated_at ON manual_attendance_reports;

CREATE OR REPLACE FUNCTION update_manual_reports_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_manual_reports_updated_at
    BEFORE UPDATE ON manual_attendance_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_manual_reports_timestamp();

-- ========================================
-- 5. RLS (Row Level Security)
-- ========================================
ALTER TABLE manual_attendance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_attendance_entries ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة: الجميع يمكنهم القراءة
DROP POLICY IF EXISTS "Allow read access to manual reports" ON manual_attendance_reports;
CREATE POLICY "Allow read access to manual reports" 
    ON manual_attendance_reports FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Allow read access to manual entries" ON manual_attendance_entries;
CREATE POLICY "Allow read access to manual entries" 
    ON manual_attendance_entries FOR SELECT 
    USING (true);

-- سياسة الكتابة: الجميع يمكنهم الكتابة (يمكن تعديلها لاحقاً للصلاحيات)
DROP POLICY IF EXISTS "Allow insert to manual reports" ON manual_attendance_reports;
CREATE POLICY "Allow insert to manual reports" 
    ON manual_attendance_reports FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow insert to manual entries" ON manual_attendance_entries;
CREATE POLICY "Allow insert to manual entries" 
    ON manual_attendance_entries FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update to manual reports" ON manual_attendance_reports;
CREATE POLICY "Allow update to manual reports" 
    ON manual_attendance_reports FOR UPDATE 
    USING (true);

DROP POLICY IF EXISTS "Allow delete to manual reports" ON manual_attendance_reports;
CREATE POLICY "Allow delete to manual reports" 
    ON manual_attendance_reports FOR DELETE 
    USING (true);

DROP POLICY IF EXISTS "Allow delete to manual entries" ON manual_attendance_entries;
CREATE POLICY "Allow delete to manual entries" 
    ON manual_attendance_entries FOR DELETE 
    USING (true);

-- ========================================
-- تم بنجاح ✅
-- ========================================
