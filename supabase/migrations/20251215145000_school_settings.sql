-- Migration: إضافة جدول إعدادات المدرسة
-- يُستخدم لترويسة التقارير الرسمية

-- إنشاء جدول إعدادات المدرسة
CREATE TABLE IF NOT EXISTS school_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'المدرسة',
    name_en TEXT DEFAULT 'School',
    logo TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    ministry_header TEXT DEFAULT 'وزارة التربية والتعليم',
    directorate TEXT DEFAULT 'مديرية التربية والتعليم',
    administration TEXT DEFAULT 'إدارة',
    academic_year TEXT,
    principal_name TEXT,
    principal_title TEXT DEFAULT 'مدير المدرسة',
    vice_principal_name TEXT,
    attendance_supervisor_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تمكين RLS
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة للجميع
CREATE POLICY "Allow read access to school_settings"
    ON school_settings FOR SELECT
    USING (true);

-- سياسة التعديل للمستخدمين المصادق عليهم
CREATE POLICY "Allow update for authenticated users"
    ON school_settings FOR UPDATE
    USING (auth.role() = 'authenticated');

-- سياسة الإدراج للمستخدمين المصادق عليهم
CREATE POLICY "Allow insert for authenticated users"
    ON school_settings FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- إدراج بيانات افتراضية
INSERT INTO school_settings (
    name,
    name_en,
    ministry_header,
    directorate,
    administration
) VALUES (
    'المدرسة النموذجية',
    'Model School',
    'وزارة التربية والتعليم',
    'مديرية التربية والتعليم',
    'إدارة التعليم'
) ON CONFLICT DO NOTHING;

-- تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_school_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_school_settings_updated_at
    BEFORE UPDATE ON school_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_school_settings_updated_at();
