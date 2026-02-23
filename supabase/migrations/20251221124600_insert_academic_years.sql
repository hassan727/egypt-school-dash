-- =============================================
-- Migration: Insert Academic Years
-- Date: 2025-12-21
-- Purpose: Insert 8 academic years (2023-2031)
-- =============================================
-- 
-- BUG FIX: Academic years were defined in supabase_schema.sql
-- but never pushed via migration!
-- =============================================

-- Insert Academic Years (2023-2031)
INSERT INTO academic_years (year_code, year_name_ar, start_date, end_date, is_active) VALUES
('2023-2024', '2023-2024', '2023-09-01', '2024-06-30', false),
('2024-2025', '2024-2025', '2024-09-01', '2025-06-30', false),
('2025-2026', '2025-2026', '2025-09-01', '2026-06-30', true),
('2026-2027', '2026-2027', '2026-09-01', '2027-06-30', false),
('2027-2028', '2027-2028', '2027-09-01', '2028-06-30', false),
('2028-2029', '2028-2029', '2028-09-01', '2029-06-30', false),
('2029-2030', '2029-2030', '2029-09-01', '2030-06-30', false),
('2030-2031', '2030-2031', '2030-09-01', '2031-06-30', false)
ON CONFLICT (year_code) DO NOTHING;

-- Verification
DO $$
DECLARE
    year_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO year_count FROM academic_years;
    RAISE NOTICE '=== ACADEMIC YEARS VERIFICATION ===';
    RAISE NOTICE 'Total Years: % (Expected: 8)', year_count;
    
    IF year_count >= 8 THEN
        RAISE NOTICE '✓ All academic years present!';
    ELSE
        RAISE WARNING '✗ Missing academic years!';
    END IF;
    RAISE NOTICE '=== END ===';
END $$;

-- Show all years
SELECT year_code, year_name_ar, is_active FROM academic_years ORDER BY year_code;
