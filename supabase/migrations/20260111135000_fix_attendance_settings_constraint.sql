-- =============================================
-- إصلاح قيد التفرد لإعدادات الحضور (دعم تعدد المدارس)
-- Fix: Allow same setting_key for different schools
-- Migration: 20260111135000_fix_attendance_settings_constraint.sql
-- =============================================

DO $$
BEGIN
    -- 1. التأكد من أن عمود school_id موجود (إذا لم يكن موجوداً من قبل)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance_settings' AND column_name = 'school_id') THEN
        ALTER TABLE attendance_settings ADD COLUMN school_id UUID REFERENCES schools(id);
    END IF;

    -- 2. حذف القيد القديم (المفرد) الذي يسبب المشكلة
    -- هذا القيد كان يمنع تكرار اسم الإعداد في كامل الجدول، مما يمنع مدارس مختلفة من حفظ نفس الإعداد
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_settings_setting_key_key') THEN
        ALTER TABLE attendance_settings DROP CONSTRAINT attendance_settings_setting_key_key;
    END IF;

    -- 3. إضافة القيد الجديد (المركب)
    -- يسمح بتكرار اسم الإعداد بشرط أن يكون لمدرسة مختلفة
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_settings_school_key_unique') THEN
        ALTER TABLE attendance_settings ADD CONSTRAINT attendance_settings_school_key_unique UNIQUE (setting_key, school_id);
    END IF;

END $$;
