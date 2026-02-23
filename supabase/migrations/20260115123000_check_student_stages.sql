
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '=== STUDENT DISTRIBUTION ===';
    
    -- Check Legacy Stage Field
    FOR r IN 
        SELECT stage, COUNT(*) as count 
        FROM students 
        GROUP BY stage 
    LOOP
        RAISE NOTICE 'Legacy Stage: %, Count: %', r.stage, r.count;
    END LOOP;

    -- Check Relational Stage (via Class)
    FOR r IN 
        SELECT s.name as stage_name, COUNT(std.id) as count
        FROM students std
        LEFT JOIN classes c ON std.class_id = c.id
        LEFT JOIN stages s ON c.stage_id = s.id
        GROUP BY s.name
    LOOP
            RAISE NOTICE 'Relational Stage: %, Count: %', r.stage_name, r.count;
    END LOOP;

    RAISE NOTICE '=== END ===';
END $$;
