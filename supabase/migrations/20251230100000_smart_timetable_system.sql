-- =============================================
-- Migration: Smart School Timetable Management System
-- نظام إدارة الجدول المدرسي الذكي
-- 20251230100000_smart_timetable_system.sql
-- 
-- ملاحظة: هذا الترحيل يستخدم الجداول الموجودة:
-- - school_settings (موجود في 20251215145000)
-- - employees (موجود في supabase_schema)
-- - subjects (موجود في supabase_schema) 
-- - classes (موجود في supabase_schema)
-- - stages (موجود في supabase_schema)
-- - academic_years (موجود في supabase_schema)
-- - semesters (موجود في supabase_schema)
-- =============================================

-- 1. الحصص الزمنية (جدول جديد)
CREATE TABLE IF NOT EXISTS time_periods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    period_number INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (end_time - start_time)) / 60) STORED,
    
    -- نوع الفترة
    is_break BOOLEAN DEFAULT false,
    break_type VARCHAR(50), -- 'short_break', 'long_break', 'lunch'
    
    -- الربط بالعام الدراسي
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(period_number, academic_year_id)
);

-- 2. الأيام الدراسية (جدول جديد)
CREATE TABLE IF NOT EXISTS school_days (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    day_code VARCHAR(10) NOT NULL, -- 'SUN', 'MON', 'TUE', 'WED', 'THU'
    day_name_ar VARCHAR(50) NOT NULL,
    day_name_en VARCHAR(50) NOT NULL,
    day_order INTEGER NOT NULL, -- 1-7
    is_active BOOLEAN DEFAULT true,
    
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(day_code, academic_year_id)
);

-- 3. الإجازات والعطلات (جدول جديد)
CREATE TABLE IF NOT EXISTS holidays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    end_date DATE, -- لإجازات متعددة الأيام
    holiday_type VARCHAR(50) DEFAULT 'official', -- 'official', 'school', 'emergency'
    is_recurring BOOLEAN DEFAULT false, -- سنوي؟
    
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(date, academic_year_id)
);

-- 4. القاعات والمعامل (جدول جديد)
CREATE TABLE IF NOT EXISTS classrooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50),
    room_type VARCHAR(50) DEFAULT 'classroom', -- 'classroom', 'lab', 'computer_lab', 'library', 'gym', 'art_room'
    capacity INTEGER DEFAULT 30,
    floor_number INTEGER DEFAULT 0,
    building VARCHAR(100),
    
    -- المميزات
    has_projector BOOLEAN DEFAULT false,
    has_computer BOOLEAN DEFAULT false,
    has_whiteboard BOOLEAN DEFAULT true,
    has_ac BOOLEAN DEFAULT false,
    
    is_available BOOLEAN DEFAULT true,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(code)
);

-- 5. توزيع المواد على المعلمين (جدول جديد)
CREATE TABLE IF NOT EXISTS teaching_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    semester_id UUID REFERENCES semesters(id),
    
    -- عدد الحصص أسبوعياً
    periods_per_week INTEGER DEFAULT 1,
    
    -- ملاحظات
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(teacher_id, subject_id, class_id, academic_year_id)
);

-- 6. إصدارات الجدول (جدول جديد)
CREATE TABLE IF NOT EXISTS schedule_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    version_name VARCHAR(100) NOT NULL,
    version_number INTEGER DEFAULT 1,
    
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    semester_id UUID REFERENCES semesters(id),
    
    -- الحالة
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'review', 'approved', 'published', 'archived'
    is_active BOOLEAN DEFAULT false,
    
    -- التواريخ
    published_at TIMESTAMP WITH TIME ZONE,
    approved_by VARCHAR(255),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. الحصص المجدولة (الجدول الفعلي)
CREATE TABLE IF NOT EXISTS schedule_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    version_id UUID REFERENCES schedule_versions(id) ON DELETE CASCADE,
    
    -- الموقع في الجدول
    day_id UUID REFERENCES school_days(id) ON DELETE CASCADE,
    period_id UUID REFERENCES time_periods(id) ON DELETE CASCADE,
    
    -- التفاصيل
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id),
    teacher_id UUID REFERENCES employees(id),
    classroom_id UUID REFERENCES classrooms(id),
    
    -- النوع
    slot_type VARCHAR(50) DEFAULT 'regular', -- 'regular', 'activity', 'spare', 'supervision'
    
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- منع التكرار
    UNIQUE(version_id, day_id, period_id, class_id)
);

-- 8. سجل التعارضات (جدول جديد)
CREATE TABLE IF NOT EXISTS schedule_conflicts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    version_id UUID REFERENCES schedule_versions(id) ON DELETE CASCADE,
    
    -- نوع التعارض
    conflict_type VARCHAR(50) NOT NULL, 
    -- 'teacher_conflict', 'class_conflict', 'classroom_conflict', 
    -- 'subject_unavailable', 'period_duration', 'break_violation', 'holiday_conflict'
    
    severity VARCHAR(20) DEFAULT 'warning', -- 'critical', 'warning', 'info'
    
    -- الحصص المتعارضة
    slot_id UUID REFERENCES schedule_slots(id) ON DELETE CASCADE,
    related_slot_id UUID REFERENCES schedule_slots(id) ON DELETE SET NULL,
    
    -- الوصف
    description TEXT NOT NULL,
    suggestion TEXT, -- اقتراح الحل
    
    -- الحالة
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. قوالب الطباعة (جدول جديد)
CREATE TABLE IF NOT EXISTS print_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- 'teacher', 'class', 'classroom', 'all_teachers', 'all_classes'
    
    -- محتوى القالب
    header_content TEXT,
    footer_content TEXT,
    
    -- الإعدادات
    show_logo BOOLEAN DEFAULT true,
    show_principal_signature BOOLEAN DEFAULT true,
    show_date BOOLEAN DEFAULT true,
    show_version BOOLEAN DEFAULT true,
    
    page_orientation VARCHAR(20) DEFAULT 'landscape', -- 'portrait', 'landscape'
    page_size VARCHAR(10) DEFAULT 'A4',
    
    -- تنسيق مخصص
    custom_css TEXT,
    
    is_default BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. سجل التدقيق للجداول (جدول جديد)
CREATE TABLE IF NOT EXISTS schedule_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    action_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'publish', 'approve'
    entity_type VARCHAR(50) NOT NULL, -- 'slot', 'version', 'assignment', 'setting'
    entity_id UUID NOT NULL,
    
    -- التفاصيل
    old_values JSONB,
    new_values JSONB,
    description TEXT,
    
    -- من قام بالتعديل
    performed_by VARCHAR(255),
    ip_address VARCHAR(45),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- البيانات الافتراضية
-- =============================================

-- إدخال الأيام الدراسية
INSERT INTO school_days (day_code, day_name_ar, day_name_en, day_order, academic_year_id, is_active)
SELECT 
    v.day_code, v.day_name_ar, v.day_name_en, v.day_order, ay.id, true
FROM (VALUES
    ('SUN', 'الأحد', 'Sunday', 1),
    ('MON', 'الاثنين', 'Monday', 2),
    ('TUE', 'الثلاثاء', 'Tuesday', 3),
    ('WED', 'الأربعاء', 'Wednesday', 4),
    ('THU', 'الخميس', 'Thursday', 5)
) AS v(day_code, day_name_ar, day_name_en, day_order)
CROSS JOIN academic_years ay
WHERE ay.is_active = true
ON CONFLICT (day_code, academic_year_id) DO NOTHING;

-- إدخال الحصص الزمنية الافتراضية
INSERT INTO time_periods (period_number, name, start_time, end_time, is_break, academic_year_id)
SELECT 
    v.period_number, v.name, v.start_time, v.end_time, v.is_break, ay.id
FROM (VALUES
    (1, 'الحصة الأولى', '07:30:00'::TIME, '08:15:00'::TIME, false),
    (2, 'الحصة الثانية', '08:20:00'::TIME, '09:05:00'::TIME, false),
    (3, 'الحصة الثالثة', '09:10:00'::TIME, '09:55:00'::TIME, false),
    (4, 'الفسحة', '09:55:00'::TIME, '10:15:00'::TIME, true),
    (5, 'الحصة الرابعة', '10:15:00'::TIME, '11:00:00'::TIME, false),
    (6, 'الحصة الخامسة', '11:05:00'::TIME, '11:50:00'::TIME, false),
    (7, 'الحصة السادسة', '11:55:00'::TIME, '12:40:00'::TIME, false),
    (8, 'الحصة السابعة', '12:45:00'::TIME, '13:30:00'::TIME, false)
) AS v(period_number, name, start_time, end_time, is_break)
CROSS JOIN academic_years ay
WHERE ay.is_active = true
ON CONFLICT (period_number, academic_year_id) DO NOTHING;

-- إدخال قاعات افتراضية
INSERT INTO classrooms (name, code, room_type, capacity, floor_number, has_projector)
VALUES 
    ('معمل العلوم', 'LAB-SCI-01', 'lab', 25, 1, true),
    ('معمل الحاسب', 'LAB-COM-01', 'computer_lab', 30, 2, true),
    ('المكتبة', 'LIB-01', 'library', 50, 0, true),
    ('صالة الألعاب', 'GYM-01', 'gym', 100, 0, false),
    ('غرفة الفنون', 'ART-01', 'art_room', 25, 1, false)
ON CONFLICT (code) DO NOTHING;

-- إدخال قالب طباعة افتراضي
INSERT INTO print_templates (template_name, template_type, show_logo, is_default)
VALUES 
    ('جدول المعلم', 'teacher', true, true),
    ('جدول الفصل', 'class', true, true),
    ('جميع جداول المعلمين', 'all_teachers', true, false),
    ('جميع جداول الفصول', 'all_classes', true, false)
ON CONFLICT DO NOTHING;

-- =============================================
-- الفهارس للأداء
-- =============================================

CREATE INDEX IF NOT EXISTS idx_time_periods_academic_year ON time_periods(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_school_days_academic_year ON school_days(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
CREATE INDEX IF NOT EXISTS idx_holidays_academic_year ON holidays(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_teaching_assignments_teacher ON teaching_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teaching_assignments_class ON teaching_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_teaching_assignments_subject ON teaching_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_version ON schedule_slots(version_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_day ON schedule_slots(day_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_period ON schedule_slots(period_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_teacher ON schedule_slots(teacher_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_class ON schedule_slots(class_id);
CREATE INDEX IF NOT EXISTS idx_schedule_conflicts_version ON schedule_conflicts(version_id);
CREATE INDEX IF NOT EXISTS idx_schedule_conflicts_resolved ON schedule_conflicts(resolved);
CREATE INDEX IF NOT EXISTS idx_schedule_audit_entity ON schedule_audit_log(entity_type, entity_id);

-- =============================================
-- تعطيل RLS (بدون صلاحيات)
-- =============================================

ALTER TABLE time_periods DISABLE ROW LEVEL SECURITY;
ALTER TABLE school_days DISABLE ROW LEVEL SECURITY;
ALTER TABLE holidays DISABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_conflicts DISABLE ROW LEVEL SECURITY;
ALTER TABLE print_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_audit_log DISABLE ROW LEVEL SECURITY;

-- =============================================
-- Triggers للتحديث التلقائي
-- =============================================

CREATE TRIGGER update_time_periods_updated_at 
    BEFORE UPDATE ON time_periods 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classrooms_updated_at 
    BEFORE UPDATE ON classrooms 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teaching_assignments_updated_at 
    BEFORE UPDATE ON teaching_assignments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_versions_updated_at 
    BEFORE UPDATE ON schedule_versions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_slots_updated_at 
    BEFORE UPDATE ON schedule_slots 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_print_templates_updated_at 
    BEFORE UPDATE ON print_templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

SELECT 'تم إنشاء نظام الجدول المدرسي الذكي بنجاح!' as status;
