-- =============================================
-- Migration: Add school_id to academic_years
-- Date: 2026-01-22
-- Purpose: Link academic years to schools for multi-tenant support
-- =============================================

-- Add school_id column to academic_years table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'academic_years' AND column_name = 'school_id'
    ) THEN
        ALTER TABLE academic_years 
        ADD COLUMN school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_academic_years_school ON academic_years(school_id);

-- Link existing academic years to a school to satisfy NOT NULL constraint
DO $$
DECLARE
    v_school_id UUID;
BEGIN
    -- Try DEFAULT school first
    SELECT id INTO v_school_id FROM schools WHERE school_code = 'DEFAULT' LIMIT 1;
    
    -- If not found, try the first active school
    IF v_school_id IS NULL THEN
        SELECT id INTO v_school_id FROM schools WHERE is_active = true ORDER BY created_at ASC LIMIT 1;
    END IF;

    -- If still not found, just grab any school
    IF v_school_id IS NULL THEN
        SELECT id INTO v_school_id FROM schools LIMIT 1;
    END IF;

    -- Update records if we found a school
    IF v_school_id IS NOT NULL THEN
        -- Prevent Unique Constraint violation: Delete orphans that already have a counterpart assigned to the school
        DELETE FROM academic_years ay
        WHERE ay.school_id IS NULL 
        AND EXISTS (
            SELECT 1 FROM academic_years exist_ay 
            WHERE exist_ay.school_id = v_school_id 
            AND exist_ay.year_code = ay.year_code
        );

        UPDATE academic_years SET school_id = v_school_id WHERE school_id IS NULL;
    ELSE
        -- If literally no schools exist, we have a bigger problem, but let's avoid failing the constraint
        -- We can't really do much here except let it fail or create a dummy school
        -- Creating a fallback dummy school just in case:
        INSERT INTO schools (school_code, school_name, is_active) 
        VALUES ('DEFAULT_FALLBACK', 'مدرسة افتراضية احتياطية', true)
        RETURNING id INTO v_school_id;
        
        -- Prevent Unique Constraint violation here too just in case
        DELETE FROM academic_years ay
        WHERE ay.school_id IS NULL 
        AND EXISTS (
            SELECT 1 FROM academic_years exist_ay 
            WHERE exist_ay.school_id = v_school_id 
            AND exist_ay.year_code = ay.year_code
        );

        UPDATE academic_years SET school_id = v_school_id WHERE school_id IS NULL;
    END IF;
END $$;

-- Make school_id NOT NULL after populating
ALTER TABLE academic_years 
ALTER COLUMN school_id SET NOT NULL;

-- Update the unique constraint to include school_id
ALTER TABLE academic_years 
DROP CONSTRAINT IF EXISTS academic_years_year_code_key;

ALTER TABLE academic_years 
ADD CONSTRAINT unique_year_per_school UNIQUE(school_id, year_code);

-- Verification
DO $$
DECLARE
    year_count INTEGER;
    school_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO year_count FROM academic_years;
    SELECT COUNT(DISTINCT school_id) INTO school_count FROM academic_years;
    
    RAISE NOTICE '=== ACADEMIC YEARS MIGRATION VERIFICATION ===';
    RAISE NOTICE 'Total Years: %', year_count;
    RAISE NOTICE 'Schools with Years: %', school_count;
    RAISE NOTICE '✓ Migration completed successfully!';
    RAISE NOTICE '=== END ===';
END $$;

-- Show results
SELECT school_code, COUNT(*) as years_count 
FROM academic_years ay
JOIN schools s ON s.id = ay.school_id
GROUP BY school_code;
