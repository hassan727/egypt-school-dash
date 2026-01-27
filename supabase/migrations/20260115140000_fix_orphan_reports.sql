
-- Migration: 20260115140000_fix_orphan_reports.sql
-- Goal: Fix missing reports by assigning them to the main school.

DO $$
DECLARE
    v_school_id UUID;
    v_count INTEGER;
BEGIN
    -- 1. Find the main active school to assign reports to
    -- We prefer 'active' schools, and if multiple, pick the first one.
    SELECT id INTO v_school_id 
    FROM schools 
    WHERE status = 'active' 
    ORDER BY created_at ASC 
    LIMIT 1;

    -- Fallback: If no active school, pick ANY school
    IF v_school_id IS NULL THEN
        SELECT id INTO v_school_id FROM schools LIMIT 1;
    END IF;

    IF v_school_id IS NOT NULL THEN
        -- 2. Update orphan reports
        UPDATE manual_attendance_reports
        SET school_id = v_school_id
        WHERE school_id IS NULL;
        
        GET DIAGNOSTICS v_count = ROW_COUNT;
        RAISE NOTICE 'Updated % manual reports to school_id %', v_count, v_school_id;
    ELSE
        RAISE NOTICE 'No school found to assign reports to.';
    END IF;
END $$;
