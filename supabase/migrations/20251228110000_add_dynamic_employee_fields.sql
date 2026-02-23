-- Migration: Add Dynamic Employee Fields for Different Job Roles
-- Date: 2025-12-28
-- Purpose: Support dynamic fields based on employee type (معلم, إداري, سائق, إلخ)

DO $$
BEGIN
    -- Add employee_role column (الدور الوظيفي الرئيسي)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'employee_role') THEN
        ALTER TABLE employees ADD COLUMN employee_role VARCHAR(50) NOT NULL DEFAULT 'معلم';
        -- Options: معلم, إداري, سائق, عامل, عامل نظافة, مراقب, أخرى
    END IF;

    -- Add emergency contact fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'emergency_contact_name') THEN
        ALTER TABLE employees ADD COLUMN emergency_contact_name VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'emergency_contact_relation') THEN
        ALTER TABLE employees ADD COLUMN emergency_contact_relation VARCHAR(50);
        -- Options: أب, أم, أخ, أخت, زوج, زوجة, ابن, ابنة, صديق, آخر
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'emergency_contact_phone') THEN
        ALTER TABLE employees ADD COLUMN emergency_contact_phone VARCHAR(20);
    END IF;

    -- Add phone_secondary for consistency (already exists from contact form migration)
    -- if not present, add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'phone_secondary') THEN
        ALTER TABLE employees ADD COLUMN phone_secondary VARCHAR(20);
    END IF;

END $$;

-- Create indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_employees_employee_role ON employees(employee_role);
CREATE INDEX IF NOT EXISTS idx_employees_emergency_contact_phone ON employees(emergency_contact_phone);
