-- Migration to drop all timetable management system tables
-- This is a destructive migration that removes all data related to schedules

-- Drop tables in reverse order of dependency
DROP TABLE IF EXISTS timetable_audit_log;
DROP TABLE IF EXISTS timetable_reports;
DROP TABLE IF EXISTS timetable_notifications;
DROP TABLE IF EXISTS timetable_modifications;
DROP TABLE IF EXISTS timetable_conflicts;
DROP TABLE IF EXISTS teacher_timetable_slots;
DROP TABLE IF EXISTS class_timetable_slots;
DROP TABLE IF EXISTS timetable_templates;
DROP TABLE IF EXISTS timetable_school_days;
DROP TABLE IF EXISTS timetable_periods;
