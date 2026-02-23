-- Migration: Disable RLS on all tables with authentication policies
-- Fix for: "new row violates row-level security policy" errors
-- 20260101140000_disable_all_rls_policies.sql
-- 
-- Context: This system does not use Supabase authentication,
-- so RLS policies requiring authenticated users cause 401 errors.

-- ========================================
-- TIMETABLE TABLES (Already handled in previous migration)
-- ========================================
-- time_periods, school_days, holidays, classrooms, teaching_assignments,
-- schedule_versions, schedule_slots, schedule_conflicts, print_templates,
-- schedule_audit_log, schedule_constraints
-- These are already set to DISABLE ROW LEVEL SECURITY in their migrations

-- ========================================
-- HR & SYSTEM TABLES
-- ========================================

-- HR System Settings
DROP POLICY IF EXISTS "Allow authenticated full access settings" ON hr_system_settings;
DROP POLICY IF EXISTS "Allow authenticated read access" ON hr_system_settings;
DROP POLICY IF EXISTS "Allow authenticated update access" ON hr_system_settings;
DROP POLICY IF EXISTS "Allow authenticated to read settings" ON hr_system_settings;
DROP POLICY IF EXISTS "Allow authenticated to update settings" ON hr_system_settings;
ALTER TABLE hr_system_settings DISABLE ROW LEVEL SECURITY;

-- HR Calendar Overrides
DROP POLICY IF EXISTS "Allow authenticated full access calendar" ON hr_calendar_overrides;
DROP POLICY IF EXISTS "Allow authenticated to read calendar" ON hr_calendar_overrides;
DROP POLICY IF EXISTS "Allow authenticated to update calendar" ON hr_calendar_overrides;
ALTER TABLE hr_calendar_overrides DISABLE ROW LEVEL SECURITY;

-- HR Shifts
DROP POLICY IF EXISTS "Allow authenticated users to read shifts" ON hr_shifts;
DROP POLICY IF EXISTS "Allow authenticated users to manage shifts" ON hr_shifts;
ALTER TABLE hr_shifts DISABLE ROW LEVEL SECURITY;

-- ========================================
-- EMPLOYEE TABLES
-- ========================================

-- Employee Documents (already has 'true' policy but let's ensure consistency)
DROP POLICY IF EXISTS "Allow all access to employee_documents" ON employee_documents;
ALTER TABLE employee_documents DISABLE ROW LEVEL SECURITY;

-- Employment History (already has 'true' policy but let's ensure consistency)
DROP POLICY IF EXISTS "Allow all access to employment_history" ON employment_history;
ALTER TABLE employment_history DISABLE ROW LEVEL SECURITY;

-- Document Categories (already has 'true' policy but let's ensure consistency)
DROP POLICY IF EXISTS "Allow all access to document_categories" ON document_categories;
ALTER TABLE document_categories DISABLE ROW LEVEL SECURITY;

-- ========================================
-- ATTENDANCE & REPORTS TABLES
-- ========================================

-- Manual Attendance Reports
DROP POLICY IF EXISTS "Allow read access to manual reports" ON manual_attendance_reports;
DROP POLICY IF EXISTS "Allow insert to manual reports" ON manual_attendance_reports;
DROP POLICY IF EXISTS "Allow update to manual reports" ON manual_attendance_reports;
DROP POLICY IF EXISTS "Allow delete to manual reports" ON manual_attendance_reports;
ALTER TABLE manual_attendance_reports DISABLE ROW LEVEL SECURITY;

-- Manual Attendance Entries
DROP POLICY IF EXISTS "Allow read access to manual entries" ON manual_attendance_entries;
DROP POLICY IF EXISTS "Allow insert to manual entries" ON manual_attendance_entries;
DROP POLICY IF EXISTS "Allow delete to manual entries" ON manual_attendance_entries;
ALTER TABLE manual_attendance_entries DISABLE ROW LEVEL SECURITY;

-- ========================================
-- MONITORING & ALERTS TABLES
-- ========================================

-- Smart Alerts
DROP POLICY IF EXISTS "Allow authenticated users to view alerts" ON smart_alerts;
DROP POLICY IF EXISTS "Allow authenticated users to update alerts" ON smart_alerts;
ALTER TABLE smart_alerts DISABLE ROW LEVEL SECURITY;

-- Alert History
DROP POLICY IF EXISTS "Allow authenticated users to view alert history" ON alert_history;
ALTER TABLE alert_history DISABLE ROW LEVEL SECURITY;

-- Alert Thresholds
DROP POLICY IF EXISTS "Allow authenticated users to manage thresholds" ON alert_thresholds;
ALTER TABLE alert_thresholds DISABLE ROW LEVEL SECURITY;

-- Error Logs
DROP POLICY IF EXISTS "Allow authenticated users to view errors" ON error_logs;
ALTER TABLE error_logs DISABLE ROW LEVEL SECURITY;

-- Error Alerts
DROP POLICY IF EXISTS "Allow authenticated users to manage alerts" ON error_alerts;
ALTER TABLE error_alerts DISABLE ROW LEVEL SECURITY;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================

SELECT 'تم تعطيل RLS على جميع الجداول بنجاح - النظام جاهز للاستخدام بدون قيود المصادقة' as status;
