-- Migration: Update employees table schema for rich data
-- Created at: 2025-12-13

-- 1. Add new columns for personal data if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'birth_date') THEN
        ALTER TABLE employees ADD COLUMN birth_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'gender') THEN
        ALTER TABLE employees ADD COLUMN gender VARCHAR(20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'marital_status') THEN
        ALTER TABLE employees ADD COLUMN marital_status VARCHAR(20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'nationality') THEN
        ALTER TABLE employees ADD COLUMN nationality VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'religion') THEN
        ALTER TABLE employees ADD COLUMN religion VARCHAR(20);
    END IF;
    
    -- 2. Add 'details' JSONB column for flexible data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'details') THEN
        ALTER TABLE employees ADD COLUMN details JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;
