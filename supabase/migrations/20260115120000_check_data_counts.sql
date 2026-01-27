
DO $$
DECLARE
    student_count INTEGER;
    report_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO student_count FROM students;
    SELECT COUNT(*) INTO report_count FROM manual_attendance_reports;
    
    RAISE NOTICE '=== DATA VERIFICATION ===';
    RAISE NOTICE 'Total Students: %', student_count;
    RAISE NOTICE 'Total Manual Reports: %', report_count;
    RAISE NOTICE '=== END LC ===';
END $$;
