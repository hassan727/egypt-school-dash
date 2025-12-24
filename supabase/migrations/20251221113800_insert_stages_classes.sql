-- =============================================
-- Migration: Insert 14 Stages and Classes
-- Date: 2025-12-21
-- Purpose: Populate stages and classes tables with correct data
-- =============================================
-- 
-- Definition Lock:
-- المرحلة = صف دراسي واحد محدد فقط
-- 14 مرحلة فقط - لا يوجد تجميع هرمي
-- =============================================

-- =============================================
-- STEP 1: Insert the 14 Stages
-- =============================================
INSERT INTO stages (name) VALUES
('KG1'),
('KG2'),
('الصف الأول الابتدائي'),
('الصف الثاني الابتدائي'),
('الصف الثالث الابتدائي'),
('الصف الرابع الابتدائي'),
('الصف الخامس الابتدائي'),
('الصف السادس الابتدائي'),
('الصف الأول الإعدادي'),
('الصف الثاني الإعدادي'),
('الصف الثالث الإعدادي'),
('الصف الأول الثانوي'),
('الصف الثاني الثانوي'),
('الصف الثالث الثانوي')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- STEP 2: Insert Classes for each Stage
-- =============================================
DO $$
DECLARE
    s_id UUID;
BEGIN
    -- KG1
    SELECT id INTO s_id FROM stages WHERE name = 'KG1';
    IF s_id IS NOT NULL THEN
        INSERT INTO classes (stage_id, name) VALUES 
        (s_id, 'KG1A'), (s_id, 'KG1B'), (s_id, 'KG1C'), (s_id, 'KG1D')
        ON CONFLICT (stage_id, name) DO NOTHING;
    END IF;
    
    -- KG2
    SELECT id INTO s_id FROM stages WHERE name = 'KG2';
    IF s_id IS NOT NULL THEN
        INSERT INTO classes (stage_id, name) VALUES 
        (s_id, 'KG2A'), (s_id, 'KG2B'), (s_id, 'KG2C'), (s_id, 'KG2D')
        ON CONFLICT (stage_id, name) DO NOTHING;
    END IF;

    -- الصف الأول الابتدائي
    SELECT id INTO s_id FROM stages WHERE name = 'الصف الأول الابتدائي';
    IF s_id IS NOT NULL THEN
        INSERT INTO classes (stage_id, name) VALUES 
        (s_id, '1A'), (s_id, '1B'), (s_id, '1C'), (s_id, '1D')
        ON CONFLICT (stage_id, name) DO NOTHING;
    END IF;

    -- الصف الثاني الابتدائي
    SELECT id INTO s_id FROM stages WHERE name = 'الصف الثاني الابتدائي';
    IF s_id IS NOT NULL THEN
        INSERT INTO classes (stage_id, name) VALUES 
        (s_id, '2A'), (s_id, '2B'), (s_id, '2C'), (s_id, '2D')
        ON CONFLICT (stage_id, name) DO NOTHING;
    END IF;

    -- الصف الثالث الابتدائي
    SELECT id INTO s_id FROM stages WHERE name = 'الصف الثالث الابتدائي';
    IF s_id IS NOT NULL THEN
        INSERT INTO classes (stage_id, name) VALUES 
        (s_id, '3A'), (s_id, '3B'), (s_id, '3C'), (s_id, '3D'), (s_id, '3E')
        ON CONFLICT (stage_id, name) DO NOTHING;
    END IF;

    -- الصف الرابع الابتدائي
    SELECT id INTO s_id FROM stages WHERE name = 'الصف الرابع الابتدائي';
    IF s_id IS NOT NULL THEN
        INSERT INTO classes (stage_id, name) VALUES 
        (s_id, '4A'), (s_id, '4B'), (s_id, '4C'), (s_id, '4D')
        ON CONFLICT (stage_id, name) DO NOTHING;
    END IF;

    -- الصف الخامس الابتدائي
    SELECT id INTO s_id FROM stages WHERE name = 'الصف الخامس الابتدائي';
    IF s_id IS NOT NULL THEN
        INSERT INTO classes (stage_id, name) VALUES 
        (s_id, '5A'), (s_id, '5B'), (s_id, '5C'), (s_id, '5D')
        ON CONFLICT (stage_id, name) DO NOTHING;
    END IF;

    -- الصف السادس الابتدائي
    SELECT id INTO s_id FROM stages WHERE name = 'الصف السادس الابتدائي';
    IF s_id IS NOT NULL THEN
        INSERT INTO classes (stage_id, name) VALUES 
        (s_id, '6A'), (s_id, '6B'), (s_id, '6C'), (s_id, '6D')
        ON CONFLICT (stage_id, name) DO NOTHING;
    END IF;

    -- الصف الأول الإعدادي
    SELECT id INTO s_id FROM stages WHERE name = 'الصف الأول الإعدادي';
    IF s_id IS NOT NULL THEN
        INSERT INTO classes (stage_id, name) VALUES 
        (s_id, '1A PRE'), (s_id, '1B PRE')
        ON CONFLICT (stage_id, name) DO NOTHING;
    END IF;

    -- الصف الثاني الإعدادي
    SELECT id INTO s_id FROM stages WHERE name = 'الصف الثاني الإعدادي';
    IF s_id IS NOT NULL THEN
        INSERT INTO classes (stage_id, name) VALUES 
        (s_id, '2A PRE'), (s_id, '2B PRE'), (s_id, '2C PRE')
        ON CONFLICT (stage_id, name) DO NOTHING;
    END IF;

    -- الصف الثالث الإعدادي
    SELECT id INTO s_id FROM stages WHERE name = 'الصف الثالث الإعدادي';
    IF s_id IS NOT NULL THEN
        INSERT INTO classes (stage_id, name) VALUES 
        (s_id, '3A PRE'), (s_id, '3B PRE')
        ON CONFLICT (stage_id, name) DO NOTHING;
    END IF;

    -- الصف الأول الثانوي
    SELECT id INTO s_id FROM stages WHERE name = 'الصف الأول الثانوي';
    IF s_id IS NOT NULL THEN
        INSERT INTO classes (stage_id, name) VALUES 
        (s_id, 'S1A'), (s_id, 'S1B'), (s_id, 'S1C'), (s_id, 'S1D')
        ON CONFLICT (stage_id, name) DO NOTHING;
    END IF;

    -- الصف الثاني الثانوي
    SELECT id INTO s_id FROM stages WHERE name = 'الصف الثاني الثانوي';
    IF s_id IS NOT NULL THEN
        INSERT INTO classes (stage_id, name) VALUES 
        (s_id, 'S2A'), (s_id, 'S2B'), (s_id, 'S2C'), (s_id, 'S2D')
        ON CONFLICT (stage_id, name) DO NOTHING;
    END IF;

    -- الصف الثالث الثانوي
    SELECT id INTO s_id FROM stages WHERE name = 'الصف الثالث الثانوي';
    IF s_id IS NOT NULL THEN
        INSERT INTO classes (stage_id, name) VALUES 
        (s_id, 'S3A'), (s_id, 'S3B'), (s_id, 'S3C'), (s_id, 'S3D')
        ON CONFLICT (stage_id, name) DO NOTHING;
    END IF;
    
    RAISE NOTICE 'All stages and classes inserted successfully!';
END $$;

-- =============================================
-- STEP 3: Verification
-- =============================================
DO $$
DECLARE
    stage_count INTEGER;
    class_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO stage_count FROM stages;
    SELECT COUNT(*) INTO class_count FROM classes;
    
    RAISE NOTICE '=== FINAL VERIFICATION ===';
    RAISE NOTICE 'Total Stages: % (Expected: 14)', stage_count;
    RAISE NOTICE 'Total Classes: % (Expected: 48)', class_count;
    
    IF stage_count = 14 THEN
        RAISE NOTICE '✓ All 14 stages present!';
    ELSE
        RAISE WARNING '✗ Stage count mismatch!';
    END IF;
    
    RAISE NOTICE '=== END ===';
END $$;
