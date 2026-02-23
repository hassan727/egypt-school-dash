
DO $$
DECLARE
    v_count INTEGER;
    v_school_name TEXT;
    v_school_id UUID;
    v_null_reports INTEGER;
BEGIN
    SELECT count(*) INTO v_count FROM schools WHERE is_active = true;
    
    SELECT school_name, id INTO v_school_name, v_school_id 
    FROM schools 
    WHERE is_active = true 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    RAISE NOTICE 'Active Schools Count: %', v_count;
    RAISE NOTICE 'First School: % (%)', v_school_name, v_school_id;

    SELECT count(*) INTO v_null_reports FROM manual_attendance_reports WHERE school_id IS NULL;
    RAISE NOTICE 'Reports with NULL school_id: %', v_null_reports;
END $$;
