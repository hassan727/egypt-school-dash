
-- Check for manual reports with NULL school_id
SELECT count(*) as null_school_reports FROM manual_attendance_reports WHERE school_id IS NULL;

-- List them to be sure
SELECT id, report_date, report_title, school_id FROM manual_attendance_reports WHERE school_id IS NULL;
