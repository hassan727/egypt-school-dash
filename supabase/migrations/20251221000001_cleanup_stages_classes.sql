-- =============================================
-- Migration: Clean Up Stages and Classes Tables
-- Date: 2025-12-21
-- Purpose: Remove grouped stages and keep only 14 detailed stages
-- =============================================
-- 
-- Definition Lock (تعريف حاسم):
-- المرحلة = صف دراسي واحد محدد فقط (مثل: KG1, الصف الأول الابتدائي)
-- لا يوجد تجميع هرمي (لا يوجد: رياض الأطفال، ابتدائية، إعدادية، ثانوية)
--
-- المراحل المعتمدة الـ 14:
-- KG1, KG2
-- الصف الأول/الثاني/الثالث/الرابع/الخامس/السادس الابتدائي
-- الصف الأول/الثاني/الثالث الإعدادي
-- الصف الأول/الثاني/الثالث الثانوي
-- =============================================

-- =============================================
-- STEP 1: SAFETY CHECK - Report what will be affected
-- =============================================

-- Show grouped stages that will be deleted
DO $$
DECLARE
    grouped_stage RECORD;
    class_count INTEGER;
    student_count INTEGER;
BEGIN
    RAISE NOTICE '=== SAFETY REPORT: Grouped Stages to be Removed ===';
    
    FOR grouped_stage IN 
        SELECT id, name FROM stages 
        WHERE name IN ('رياض الأطفال', 'الابتدائية', 'الإعدادية', 'الثانوية')
    LOOP
        -- Count classes for this stage
        SELECT COUNT(*) INTO class_count FROM classes WHERE stage_id = grouped_stage.id;
        
        -- Count students linked to these classes
        SELECT COUNT(*) INTO student_count 
        FROM students s
        JOIN classes c ON s.class_id = c.id
        WHERE c.stage_id = grouped_stage.id;
        
        RAISE NOTICE 'Stage: %, Classes: %, Students: %', 
            grouped_stage.name, class_count, student_count;
    END LOOP;
    
    RAISE NOTICE '=== END SAFETY REPORT ===';
END $$;

-- =============================================
-- STEP 2: MIGRATE STUDENTS (if any exist on grouped stages)
-- Move students from grouped stages to correct detailed stages
-- =============================================

-- Migrate students using legacy 'stage' field to find correct stage
UPDATE students
SET class_id = (
    SELECT c.id 
    FROM classes c
    JOIN stages s ON c.stage_id = s.id
    WHERE s.name = students.stage 
    AND c.name = students.class
    LIMIT 1
)
WHERE class_id IN (
    SELECT c.id FROM classes c
    JOIN stages s ON c.stage_id = s.id
    WHERE s.name IN ('رياض الأطفال', 'الابتدائية', 'الإعدادية', 'الثانوية')
)
AND students.stage IS NOT NULL
AND students.class IS NOT NULL;

-- =============================================
-- STEP 3: DELETE CLASSES linked to grouped stages
-- (CASCADE will NOT affect students since we migrated them above)
-- =============================================

DELETE FROM classes 
WHERE stage_id IN (
    SELECT id FROM stages 
    WHERE name IN ('رياض الأطفال', 'الابتدائية', 'الإعدادية', 'الثانوية')
);

-- =============================================
-- STEP 4: DELETE GROUPED STAGES
-- =============================================

DELETE FROM stages 
WHERE name IN ('رياض الأطفال', 'الابتدائية', 'الإعدادية', 'الثانوية');

-- =============================================
-- STEP 5: DROP stages_classes TABLE (Not Used)
-- =============================================

DROP TABLE IF EXISTS stages_classes CASCADE;

-- =============================================
-- STEP 6: VERIFICATION - Confirm only 14 stages remain
-- =============================================

DO $$
DECLARE
    stage_count INTEGER;
    class_count INTEGER;
    expected_stages TEXT[] := ARRAY[
        'KG1', 'KG2',
        'الصف الأول الابتدائي', 'الصف الثاني الابتدائي', 'الصف الثالث الابتدائي', 
        'الصف الرابع الابتدائي', 'الصف الخامس الابتدائي', 'الصف السادس الابتدائي',
        'الصف الأول الإعدادي', 'الصف الثاني الإعدادي', 'الصف الثالث الإعدادي',
        'الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'
    ];
    missing_stages TEXT[];
BEGIN
    -- Count remaining stages
    SELECT COUNT(*) INTO stage_count FROM stages;
    SELECT COUNT(*) INTO class_count FROM classes;
    
    -- Find any missing stages
    SELECT ARRAY_AGG(expected_name) INTO missing_stages
    FROM unnest(expected_stages) AS expected_name
    WHERE NOT EXISTS (SELECT 1 FROM stages WHERE name = expected_name);
    
    RAISE NOTICE '=== VERIFICATION RESULTS ===';
    RAISE NOTICE 'Total Stages: % (Expected: 14)', stage_count;
    RAISE NOTICE 'Total Classes: %', class_count;
    
    IF missing_stages IS NOT NULL AND array_length(missing_stages, 1) > 0 THEN
        RAISE NOTICE 'Missing Stages: %', array_to_string(missing_stages, ', ');
    ELSE
        RAISE NOTICE 'All 14 expected stages are present ✓';
    END IF;
    
    -- Verify no grouped stages remain
    IF EXISTS (SELECT 1 FROM stages WHERE name IN ('رياض الأطفال', 'الابتدائية', 'الإعدادية', 'الثانوية')) THEN
        RAISE WARNING 'Grouped stages still exist! Migration incomplete.';
    ELSE
        RAISE NOTICE 'Grouped stages successfully removed ✓';
    END IF;
    
    RAISE NOTICE '=== END VERIFICATION ===';
END $$;

-- =============================================
-- STEP 7: Show final stages list
-- =============================================

SELECT id, name, created_at FROM stages ORDER BY 
    CASE 
        WHEN name = 'KG1' THEN 1
        WHEN name = 'KG2' THEN 2
        WHEN name = 'الصف الأول الابتدائي' THEN 3
        WHEN name = 'الصف الثاني الابتدائي' THEN 4
        WHEN name = 'الصف الثالث الابتدائي' THEN 5
        WHEN name = 'الصف الرابع الابتدائي' THEN 6
        WHEN name = 'الصف الخامس الابتدائي' THEN 7
        WHEN name = 'الصف السادس الابتدائي' THEN 8
        WHEN name = 'الصف الأول الإعدادي' THEN 9
        WHEN name = 'الصف الثاني الإعدادي' THEN 10
        WHEN name = 'الصف الثالث الإعدادي' THEN 11
        WHEN name = 'الصف الأول الثانوي' THEN 12
        WHEN name = 'الصف الثاني الثانوي' THEN 13
        WHEN name = 'الصف الثالث الثانوي' THEN 14
    END;
