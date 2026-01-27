-- Migration: Disable RLS on school_settings
-- Fix for: "new row violates row-level security policy"
-- 20260101130000_disable_school_settings_rls.sql

-- Drop existing policies
DROP POLICY IF EXISTS "Allow read access to school_settings" ON school_settings;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON school_settings;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON school_settings;

-- Disable RLS (since the system doesn't use authentication)
ALTER TABLE school_settings DISABLE ROW LEVEL SECURITY;

SELECT 'تم تعطيل RLS على جدول school_settings بنجاح' as status;
