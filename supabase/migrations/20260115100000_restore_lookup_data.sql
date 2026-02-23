-- =============================================
-- Migration: Restore Lookup Data (Stages, Classes, Years)
-- Date: 2026-01-15
-- Purpose: Restore data ensuring multi-tenancy support (School ID)
-- Includes DYNAMIC dropping of conflicting FK constraints
-- =============================================

-- 0. DYNAMICALLY Drop Conflicting Foreign Keys
-- Finds any FK that references academic_years(year_code) and drops it
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tc.table_schema, tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND ccu.table_name = 'academic_years'
          AND ccu.column_name = 'year_code'
    ) LOOP
        RAISE NOTICE 'Dropping FK constraint: %.%', r.table_name, r.constraint_name;
        EXECUTE 'ALTER TABLE ' || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) || ' DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;


-- 1. Schema Fixes for Multi-tenancy

-- A. Academic Years
ALTER TABLE academic_years 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- Drop global unique constraint (should be safe now)
ALTER TABLE academic_years 
DROP CONSTRAINT IF EXISTS academic_years_year_code_key;

-- Add school-scoped unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'academic_years_school_year_idx'
    ) THEN
        ALTER TABLE academic_years 
        ADD CONSTRAINT academic_years_school_year_idx UNIQUE (school_id, year_code);
    END IF;
END $$;


-- B. Classes
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- Drop global unique constraint on (stage_id, name)
ALTER TABLE classes 
DROP CONSTRAINT IF EXISTS classes_stage_id_name_key;

-- Add school-scoped unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'classes_school_stage_name_idx'
    ) THEN
        ALTER TABLE classes 
        ADD CONSTRAINT classes_school_stage_name_idx UNIQUE (school_id, stage_id, name);
    END IF;
END $$;


-- 2. Insert Global Stages (if they don't exist)
INSERT INTO stages (name) VALUES
('KG1'), ('KG2'),
('الصف الأول الابتدائي'), ('الصف الثاني الابتدائي'), ('الصف الثالث الابتدائي'), ('الصف الرابع الابتدائي'), ('الصف الخامس الابتدائي'), ('الصف السادس الابتدائي'),
('الصف الأول الإعدادي'), ('الصف الثاني الإعدادي'), ('الصف الثالث الإعدادي'),
('الصف الأول الثانوي'), ('الصف الثاني الثانوي'), ('الصف الثالث الثانوي')
ON CONFLICT (name) DO NOTHING;


-- 3. Insert School-Specific Data (Years & Classes)
DO $$
DECLARE
    r_school RECORD;
    v_stage_id UUID;
BEGIN
    -- Loop through all active schools
    FOR r_school IN SELECT id FROM schools WHERE is_active = true LOOP
        
        RAISE NOTICE 'Processing School ID: %', r_school.id;

        -- A. Insert Academic Years for this school
        INSERT INTO academic_years (school_id, year_code, year_name_ar, start_date, end_date, is_active) VALUES
        (r_school.id, '2023-2024', '2023-2024', '2023-09-01', '2024-06-30', false),
        (r_school.id, '2024-2025', '2024-2025', '2024-09-01', '2025-06-30', false),
        (r_school.id, '2025-2026', '2025-2026', '2025-09-01', '2026-06-30', true),
        (r_school.id, '2026-2027', '2026-2027', '2026-09-01', '2027-06-30', false),
        (r_school.id, '2027-2028', '2027-2028', '2027-09-01', '2028-06-30', false),
        (r_school.id, '2028-2029', '2028-2029', '2028-09-01', '2029-06-30', false),
        (r_school.id, '2029-2030', '2029-2030', '2029-09-01', '2030-06-30', false),
        (r_school.id, '2030-2031', '2030-2031', '2030-09-01', '2031-06-30', false)
        ON CONFLICT (school_id, year_code) DO NOTHING;

        -- B. Insert Classes for this school linked to Stages
        -- KG1
        SELECT id INTO v_stage_id FROM stages WHERE name = 'KG1';
        IF v_stage_id IS NOT NULL THEN
            INSERT INTO classes (school_id, stage_id, name) VALUES 
            (r_school.id, v_stage_id, 'KG1A'), (r_school.id, v_stage_id, 'KG1B'), (r_school.id, v_stage_id, 'KG1C'), (r_school.id, v_stage_id, 'KG1D')
            ON CONFLICT (school_id, stage_id, name) DO NOTHING;
        END IF;

        -- KG2
        SELECT id INTO v_stage_id FROM stages WHERE name = 'KG2';
        IF v_stage_id IS NOT NULL THEN
            INSERT INTO classes (school_id, stage_id, name) VALUES 
            (r_school.id, v_stage_id, 'KG2A'), (r_school.id, v_stage_id, 'KG2B'), (r_school.id, v_stage_id, 'KG2C'), (r_school.id, v_stage_id, 'KG2D')
            ON CONFLICT (school_id, stage_id, name) DO NOTHING;
        END IF;

        -- Primary 1
        SELECT id INTO v_stage_id FROM stages WHERE name = 'الصف الأول الابتدائي';
        IF v_stage_id IS NOT NULL THEN
            INSERT INTO classes (school_id, stage_id, name) VALUES 
            (r_school.id, v_stage_id, '1A'), (r_school.id, v_stage_id, '1B'), (r_school.id, v_stage_id, '1C'), (r_school.id, v_stage_id, '1D')
            ON CONFLICT (school_id, stage_id, name) DO NOTHING;
        END IF;

        -- Primary 2
        SELECT id INTO v_stage_id FROM stages WHERE name = 'الصف الثاني الابتدائي';
        IF v_stage_id IS NOT NULL THEN
            INSERT INTO classes (school_id, stage_id, name) VALUES 
            (r_school.id, v_stage_id, '2A'), (r_school.id, v_stage_id, '2B'), (r_school.id, v_stage_id, '2C'), (r_school.id, v_stage_id, '2D')
            ON CONFLICT (school_id, stage_id, name) DO NOTHING;
        END IF;

        -- Primary 3
        SELECT id INTO v_stage_id FROM stages WHERE name = 'الصف الثالث الابتدائي';
        IF v_stage_id IS NOT NULL THEN
            INSERT INTO classes (school_id, stage_id, name) VALUES 
            (r_school.id, v_stage_id, '3A'), (r_school.id, v_stage_id, '3B'), (r_school.id, v_stage_id, '3C'), (r_school.id, v_stage_id, '3D'), (r_school.id, v_stage_id, '3E')
            ON CONFLICT (school_id, stage_id, name) DO NOTHING;
        END IF;

        -- Primary 4
        SELECT id INTO v_stage_id FROM stages WHERE name = 'الصف الرابع الابتدائي';
        IF v_stage_id IS NOT NULL THEN
            INSERT INTO classes (school_id, stage_id, name) VALUES 
            (r_school.id, v_stage_id, '4A'), (r_school.id, v_stage_id, '4B'), (r_school.id, v_stage_id, '4C'), (r_school.id, v_stage_id, '4D')
            ON CONFLICT (school_id, stage_id, name) DO NOTHING;
        END IF;

        -- Primary 5
        SELECT id INTO v_stage_id FROM stages WHERE name = 'الصف الخامس الابتدائي';
        IF v_stage_id IS NOT NULL THEN
            INSERT INTO classes (school_id, stage_id, name) VALUES 
            (r_school.id, v_stage_id, '5A'), (r_school.id, v_stage_id, '5B'), (r_school.id, v_stage_id, '5C'), (r_school.id, v_stage_id, '5D')
            ON CONFLICT (school_id, stage_id, name) DO NOTHING;
        END IF;

        -- Primary 6
        SELECT id INTO v_stage_id FROM stages WHERE name = 'الصف السادس الابتدائي';
        IF v_stage_id IS NOT NULL THEN
            INSERT INTO classes (school_id, stage_id, name) VALUES 
            (r_school.id, v_stage_id, '6A'), (r_school.id, v_stage_id, '6B'), (r_school.id, v_stage_id, '6C'), (r_school.id, v_stage_id, '6D')
            ON CONFLICT (school_id, stage_id, name) DO NOTHING;
        END IF;

        -- Prep 1
        SELECT id INTO v_stage_id FROM stages WHERE name = 'الصف الأول الإعدادي';
        IF v_stage_id IS NOT NULL THEN
            INSERT INTO classes (school_id, stage_id, name) VALUES 
            (r_school.id, v_stage_id, '1A PRE'), (r_school.id, v_stage_id, '1B PRE')
            ON CONFLICT (school_id, stage_id, name) DO NOTHING;
        END IF;

        -- Prep 2
        SELECT id INTO v_stage_id FROM stages WHERE name = 'الصف الثاني الإعدادي';
        IF v_stage_id IS NOT NULL THEN
            INSERT INTO classes (school_id, stage_id, name) VALUES 
            (r_school.id, v_stage_id, '2A PRE'), (r_school.id, v_stage_id, '2B PRE'), (r_school.id, v_stage_id, '2C PRE')
            ON CONFLICT (school_id, stage_id, name) DO NOTHING;
        END IF;

        -- Prep 3
        SELECT id INTO v_stage_id FROM stages WHERE name = 'الصف الثالث الإعدادي';
        IF v_stage_id IS NOT NULL THEN
            INSERT INTO classes (school_id, stage_id, name) VALUES 
            (r_school.id, v_stage_id, '3A PRE'), (r_school.id, v_stage_id, '3B PRE')
            ON CONFLICT (school_id, stage_id, name) DO NOTHING;
        END IF;

        -- Sec 1
        SELECT id INTO v_stage_id FROM stages WHERE name = 'الصف الأول الثانوي';
        IF v_stage_id IS NOT NULL THEN
            INSERT INTO classes (school_id, stage_id, name) VALUES 
            (r_school.id, v_stage_id, 'S1A'), (r_school.id, v_stage_id, 'S1B'), (r_school.id, v_stage_id, 'S1C'), (r_school.id, v_stage_id, 'S1D')
            ON CONFLICT (school_id, stage_id, name) DO NOTHING;
        END IF;

        -- Sec 2
        SELECT id INTO v_stage_id FROM stages WHERE name = 'الصف الثاني الثانوي';
        IF v_stage_id IS NOT NULL THEN
            INSERT INTO classes (school_id, stage_id, name) VALUES 
            (r_school.id, v_stage_id, 'S2A'), (r_school.id, v_stage_id, 'S2B'), (r_school.id, v_stage_id, 'S2C'), (r_school.id, v_stage_id, 'S2D')
            ON CONFLICT (school_id, stage_id, name) DO NOTHING;
        END IF;

        -- Sec 3
        SELECT id INTO v_stage_id FROM stages WHERE name = 'الصف الثالث الثانوي';
        IF v_stage_id IS NOT NULL THEN
            INSERT INTO classes (school_id, stage_id, name) VALUES 
            (r_school.id, v_stage_id, 'S3A'), (r_school.id, v_stage_id, 'S3B'), (r_school.id, v_stage_id, 'S3C'), (r_school.id, v_stage_id, 'S3D')
            ON CONFLICT (school_id, stage_id, name) DO NOTHING;
        END IF;

    END LOOP;

    RAISE NOTICE 'Data restoration completed for all schools.';
END $$;
