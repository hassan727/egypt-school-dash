-- =============================================
-- استكمال أعمدة إعدادات النظام وتحديث الحقول الناقصة
-- Fix: Add missing columns to hr_system_settings that were skipped
-- Migration: 20260111140000_update_hr_system_settings_columns.sql
-- =============================================

DO $$
BEGIN
    -- 1. إضافة الأعمدة الناقصة (Missing Columns)
    
    -- day_settings (Critical for 400 Error)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hr_system_settings' AND column_name = 'day_settings') THEN
        ALTER TABLE hr_system_settings ADD COLUMN day_settings JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- official_start_time
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hr_system_settings' AND column_name = 'official_start_time') THEN
        ALTER TABLE hr_system_settings ADD COLUMN official_start_time TIME DEFAULT '08:00:00';
    END IF;

    -- official_end_time
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hr_system_settings' AND column_name = 'official_end_time') THEN
        ALTER TABLE hr_system_settings ADD COLUMN official_end_time TIME DEFAULT '15:45:00';
    END IF;

    -- early_departure_penalty_rate
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hr_system_settings' AND column_name = 'early_departure_penalty_rate') THEN
        ALTER TABLE hr_system_settings ADD COLUMN early_departure_penalty_rate DECIMAL(4, 2) DEFAULT 1.0;
    END IF;

    -- max_grace_period_minutes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hr_system_settings' AND column_name = 'max_grace_period_minutes') THEN
        ALTER TABLE hr_system_settings ADD COLUMN max_grace_period_minutes INTEGER DEFAULT 30;
    END IF;

    -- early_departure_grace_minutes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hr_system_settings' AND column_name = 'early_departure_grace_minutes') THEN
        ALTER TABLE hr_system_settings ADD COLUMN early_departure_grace_minutes INTEGER DEFAULT 15;
    END IF;

    -- 2. تحديث أنواع الأعمدة (Type Fixes)
    -- تحديث working_hours_per_day من INTEGER إلى DECIMAL لدقة أفضل
    -- نستخدم ALTER TYPE بشكل آمن
    BEGIN
        ALTER TABLE hr_system_settings ALTER COLUMN working_hours_per_day TYPE DECIMAL(4, 1);
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Skipping type change for working_hours_per_day';
    END;

    -- تحديث reload schema cache عن طريق أمر NOTIFY (Supabase عادة يفعل هذا تلقائيا مع DDL)

END $$;
