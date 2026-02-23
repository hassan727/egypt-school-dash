-- Migration: Remove Smart School Timetable Management System
-- حذف نظام إدارة الجدول المدرسي الذكي
-- 20260104100000_remove_timetable_system.sql

-- Drop triggers first (cascading drops might handle this, but good to be explicit or if dependent objects exist)
DROP TRIGGER IF EXISTS update_time_periods_updated_at ON time_periods;
DROP TRIGGER IF EXISTS update_classrooms_updated_at ON classrooms;
DROP TRIGGER IF EXISTS update_teaching_assignments_updated_at ON teaching_assignments;
DROP TRIGGER IF EXISTS update_schedule_versions_updated_at ON schedule_versions;
DROP TRIGGER IF EXISTS update_schedule_slots_updated_at ON schedule_slots;
DROP TRIGGER IF EXISTS update_print_templates_updated_at ON print_templates;

-- Drop tables in reverse order of dependency with CASCADE to handle views
DROP TABLE IF EXISTS schedule_audit_log CASCADE;
DROP TABLE IF EXISTS print_templates CASCADE;
DROP TABLE IF EXISTS schedule_conflicts CASCADE;
DROP TABLE IF EXISTS schedule_slots CASCADE;
DROP TABLE IF EXISTS schedule_versions CASCADE;
DROP TABLE IF EXISTS teaching_assignments CASCADE;
DROP TABLE IF EXISTS classrooms CASCADE;
DROP TABLE IF EXISTS holidays CASCADE;
DROP TABLE IF EXISTS school_days CASCADE;
DROP TABLE IF EXISTS time_periods CASCADE;

-- Drop Functions if any specific ones were created solely for this system and not generic
-- (None explicitly identified as unique to this system in previous analysis that aren't generic utilities)

SELECT 'تم حذف نظام الجدول المدرسي الذكي بنجاح!' as status;
