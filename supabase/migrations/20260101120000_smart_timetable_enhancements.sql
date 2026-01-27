-- =============================================
-- Migration: Smart Timetable Enhancements
-- تحسينات الجدول الذكي: ألوان، أسماء مختصرة، قيود، وإعدادات متقدمة
-- 20260101120000_smart_timetable_enhancements.sql
-- =============================================

-- 1. تحديث جدول إعدادات المدرسة (School Settings)
-- إضافة دعم الأسابيع الدوارة وإعدادات الفسح المعقدة
DO $$
BEGIN
    -- نظام التناوب (A/B Week)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'school_settings' AND column_name = 'weekly_rotation_enabled') THEN
        ALTER TABLE school_settings ADD COLUMN weekly_rotation_enabled BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'school_settings' AND column_name = 'rotation_type') THEN
        ALTER TABLE school_settings ADD COLUMN rotation_type VARCHAR(50) DEFAULT 'standard'; -- 'standard', 'weekly_ab', 'custom'
    END IF;

    -- إعدادات الفسح المتقدمة (JSON)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'school_settings' AND column_name = 'break_settings') THEN
        ALTER TABLE school_settings ADD COLUMN break_settings JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 2. تحديث جدول الموظفين (المعلمين)
-- إضافة الأسماء المختصرة والألوان والحد الأقصى للنصاب
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'short_name') THEN
        ALTER TABLE employees ADD COLUMN short_name VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'color') THEN
        ALTER TABLE employees ADD COLUMN color VARCHAR(20) DEFAULT '#3b82f6'; -- Blue default
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'max_weekly_periods') THEN
        ALTER TABLE employees ADD COLUMN max_weekly_periods INTEGER DEFAULT 24;
    END IF;
END $$;

-- 3. تحديث جدول المواد
-- إضافة الأسماء المختصرة والألوان والمتطلبات
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'short_name') THEN
        ALTER TABLE subjects ADD COLUMN short_name VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'color') THEN
        ALTER TABLE subjects ADD COLUMN color VARCHAR(20) DEFAULT '#10b981'; -- Green default
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'required_equipment') THEN
        ALTER TABLE subjects ADD COLUMN required_equipment TEXT[]; -- Array of requirement codes e.g. ['computer_lab', 'projector']
    END IF;
END $$;

-- 4. تحديث جدول القاعات
-- إضافة التخصص (مواد محددة لهذه القاعة)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classrooms' AND column_name = 'dedicated_subjects') THEN
        ALTER TABLE classrooms ADD COLUMN dedicated_subjects UUID[]; -- Array of subject types IDs or just specific handling in validation
    END IF;
END $$;

-- 5. تحديث جدول الفصول
-- إضافة المجموعات الفرعية
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'groups') THEN
        ALTER TABLE classes ADD COLUMN groups JSONB DEFAULT '[]'::jsonb; -- e.g. [{"id": "g1", "name": "Group A"}, {"id": "g2", "name": "Group B"}]
    END IF;
END $$;

-- 6. تحديث جدول توزيع المواد (Specifications)
-- إضافة متطلبات القاعة والمجموعة المستهدفة
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teaching_assignments' AND column_name = 'required_room_type') THEN
        ALTER TABLE teaching_assignments ADD COLUMN required_room_type VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teaching_assignments' AND column_name = 'target_group') THEN
        ALTER TABLE teaching_assignments ADD COLUMN target_group VARCHAR(50); -- null = all class, otherwise group name/id
    END IF;
END $$;

-- 7. إنشاء جدول القيود (Constraints)
CREATE TABLE IF NOT EXISTS schedule_constraints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    constraint_type VARCHAR(50) NOT NULL, 
    -- 'teacher_day_off', 'max_daily_periods', 'no_consecutive_periods', 
    -- 'period_preference', 'room_restriction', 'subject_sequence'
    
    entity_type VARCHAR(20) NOT NULL, -- 'teacher', 'class', 'subject', 'global'
    entity_id UUID, -- NULL for global constraints
    
    settings JSONB DEFAULT '{}'::jsonb, 
    -- Stores specific details like: { "day_code": "SUN" } or { "max": 2 }
    
    priority VARCHAR(20) DEFAULT 'high', -- 'critical', 'high', 'medium', 'low'
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهرس للبحث السريع عن القيود
CREATE INDEX IF NOT EXISTS idx_schedule_constraints_entity ON schedule_constraints(entity_type, entity_id);

-- Trigger لتحديث updated_at
-- Trigger لتحديث updated_at
DROP TRIGGER IF EXISTS update_schedule_constraints_updated_at ON schedule_constraints;
CREATE TRIGGER update_schedule_constraints_updated_at 
    BEFORE UPDATE ON schedule_constraints 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

SELECT 'Smart Timetable Enhancements Applied Successfully' as status;
