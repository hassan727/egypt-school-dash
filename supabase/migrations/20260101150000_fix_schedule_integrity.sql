-- =============================================
-- Migration: Fix Schedule System Integrity Issues
-- إصلاح مشاكل تكامل نظام الجداول
-- 20260101150000_fix_schedule_integrity.sql
-- =============================================

-- 1. إضافة CHECK constraint على جداول أساسية
-- التأكد من أن أوقات البداية قبل النهاية
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'time_periods' AND constraint_name = 'valid_period_times'
    ) THEN
        ALTER TABLE time_periods 
        ADD CONSTRAINT valid_period_times CHECK (start_time < end_time);
    END IF;
END $$;

-- 2. إضافة INDEXES للبحث السريع
CREATE INDEX IF NOT EXISTS idx_schedule_slots_version ON schedule_slots(version_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_day_period ON schedule_slots(day_id, period_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_teacher ON schedule_slots(teacher_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_class ON schedule_slots(class_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_classroom ON schedule_slots(classroom_id);
CREATE INDEX IF NOT EXISTS idx_schedule_conflicts_version ON schedule_conflicts(version_id);
CREATE INDEX IF NOT EXISTS idx_teaching_assignments_class ON teaching_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_teaching_assignments_teacher ON teaching_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teaching_assignments_subject ON teaching_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_school_days_order ON school_days(day_order);

-- 3. تحديث school_settings - إضافة قيم افتراضية إذا لم تكن موجودة
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'school_settings' AND column_name = 'school_name_ar') THEN
        ALTER TABLE school_settings ADD COLUMN school_name_ar VARCHAR(255) DEFAULT 'المدرسة';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'school_settings' AND column_name = 'school_name_en') THEN
        ALTER TABLE school_settings ADD COLUMN school_name_en VARCHAR(255) DEFAULT 'School';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'school_settings' AND column_name = 'ministry_name') THEN
        ALTER TABLE school_settings ADD COLUMN ministry_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'school_settings' AND column_name = 'directorate_name') THEN
        ALTER TABLE school_settings ADD COLUMN directorate_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'school_settings' AND column_name = 'administration_name') THEN
        ALTER TABLE school_settings ADD COLUMN administration_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'school_settings' AND column_name = 'principal_name') THEN
        ALTER TABLE school_settings ADD COLUMN principal_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'school_settings' AND column_name = 'address') THEN
        ALTER TABLE school_settings ADD COLUMN address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'school_settings' AND column_name = 'phone') THEN
        ALTER TABLE school_settings ADD COLUMN phone VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'school_settings' AND column_name = 'email') THEN
        ALTER TABLE school_settings ADD COLUMN email VARCHAR(255);
    END IF;
END $$;

-- 4. تحديث جدول الفصول - إضافة groups إن لم تكن موجودة
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'classes' AND column_name = 'groups') THEN
        ALTER TABLE classes ADD COLUMN groups JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 5. إضافة دالة مساعدة لحساب duration تلقائياً إن لم تكن موجودة
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'time_periods' AND column_name = 'duration_minutes'
    ) THEN
        ALTER TABLE time_periods 
        ADD COLUMN duration_minutes INTEGER GENERATED ALWAYS AS (
            EXTRACT(EPOCH FROM (end_time - start_time)) / 60
        ) STORED;
    END IF;
END $$;

-- 6. إنشاء view لسهولة الاستعلامات الشائعة
CREATE OR REPLACE VIEW schedule_overview AS
SELECT 
    ss.id as slot_id,
    ss.version_id,
    sd.day_name_ar,
    tp.period_number,
    tp.name as period_name,
    c.name as class_name,
    s.subject_name_ar,
    e.full_name as teacher_name,
    cr.name as room_name,
    ss.slot_type,
    ss.notes
FROM schedule_slots ss
LEFT JOIN school_days sd ON ss.day_id = sd.id
LEFT JOIN time_periods tp ON ss.period_id = tp.id
LEFT JOIN classes c ON ss.class_id = c.id
LEFT JOIN subjects s ON ss.subject_id = s.id
LEFT JOIN employees e ON ss.teacher_id = e.id
LEFT JOIN classrooms cr ON ss.classroom_id = cr.id
ORDER BY tp.period_number, sd.day_order;

-- 7. إنشاء view للتعارضات المكتشفة
CREATE OR REPLACE VIEW schedule_conflicts_summary AS
SELECT 
    sc.id,
    sc.version_id,
    sc.conflict_type,
    sc.severity,
    sc.description,
    sc.suggestion,
    sc.resolved,
    sslot.slot_type as slot_type,
    e.full_name as involved_teacher,
    c.name as involved_class
FROM schedule_conflicts sc
LEFT JOIN schedule_slots sslot ON sc.slot_id = sslot.id
LEFT JOIN employees e ON sslot.teacher_id = e.id
LEFT JOIN classes c ON sslot.class_id = c.id
WHERE sc.resolved = false
ORDER BY sc.severity DESC, sc.created_at DESC;

-- 8. Trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق الـ trigger على جداول مهمة
DROP TRIGGER IF EXISTS update_schedule_slots_updated_at ON schedule_slots;
CREATE TRIGGER update_schedule_slots_updated_at
    BEFORE UPDATE ON schedule_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_schedule_versions_updated_at ON schedule_versions;
CREATE TRIGGER update_schedule_versions_updated_at
    BEFORE UPDATE ON schedule_versions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teaching_assignments_updated_at ON teaching_assignments;
CREATE TRIGGER update_teaching_assignments_updated_at
    BEFORE UPDATE ON teaching_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. إنشاء جدول لتسجيل التغييرات (Audit Log)
CREATE TABLE IF NOT EXISTS schedule_changes_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by VARCHAR(255),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_changes_entity ON schedule_changes_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_schedule_changes_date ON schedule_changes_log(changed_at);

-- 10. إنشاء دالة للعثور على التعارضات تلقائياً
CREATE OR REPLACE FUNCTION detect_schedule_conflicts(
    p_version_id UUID
)
RETURNS TABLE(
    conflict_type VARCHAR,
    severity VARCHAR,
    slot1_id UUID,
    slot2_id UUID,
    description TEXT
) AS $$
BEGIN
    -- تعارضات المعلمين
    RETURN QUERY
    SELECT 
        'teacher_conflict'::VARCHAR,
        'critical'::VARCHAR,
        ss1.id,
        ss2.id,
        'المعلم ' || e.full_name || ' مشغول في حصتين في نفس الوقت'::TEXT
    FROM schedule_slots ss1
    JOIN schedule_slots ss2 ON 
        ss1.teacher_id = ss2.teacher_id AND
        ss1.day_id = ss2.day_id AND
        ss1.period_id = ss2.period_id AND
        ss1.id < ss2.id
    JOIN employees e ON ss1.teacher_id = e.id
    WHERE ss1.version_id = p_version_id AND ss2.version_id = p_version_id;

    -- تعارضات الفصول
    RETURN QUERY
    SELECT 
        'class_conflict'::VARCHAR,
        'critical'::VARCHAR,
        ss1.id,
        ss2.id,
        'الفصل ' || c.name || ' لديه حصتان في نفس الوقت'::TEXT
    FROM schedule_slots ss1
    JOIN schedule_slots ss2 ON 
        ss1.class_id = ss2.class_id AND
        ss1.day_id = ss2.day_id AND
        ss1.period_id = ss2.period_id AND
        ss1.id < ss2.id
    JOIN classes c ON ss1.class_id = c.id
    WHERE ss1.version_id = p_version_id AND ss2.version_id = p_version_id;

    -- تعارضات القاعات
    RETURN QUERY
    SELECT 
        'classroom_conflict'::VARCHAR,
        'warning'::VARCHAR,
        ss1.id,
        ss2.id,
        'القاعة ' || cr.name || ' مشغولة بحصتين في نفس الوقت'::TEXT
    FROM schedule_slots ss1
    JOIN schedule_slots ss2 ON 
        ss1.classroom_id = ss2.classroom_id AND
        ss1.day_id = ss2.day_id AND
        ss1.period_id = ss2.period_id AND
        ss1.id < ss2.id AND
        ss1.classroom_id IS NOT NULL
    JOIN classrooms cr ON ss1.classroom_id = cr.id
    WHERE ss1.version_id = p_version_id AND ss2.version_id = p_version_id;
END;
$$ LANGUAGE plpgsql;

SELECT 'Schedule System Integrity Fixed Successfully' as status;
