-- Migration: Add contact fields to employees table
-- Date: 2025-12-28
-- Purpose: Add phone, email, and address fields for employee contact information

DO $$
BEGIN
    -- Add phone column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'phone') THEN
        ALTER TABLE employees ADD COLUMN phone VARCHAR(20) NOT NULL DEFAULT '';
    END IF;

    -- Add phone_secondary (WhatsApp) column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'phone_secondary') THEN
        ALTER TABLE employees ADD COLUMN phone_secondary VARCHAR(20);
    END IF;

    -- Add email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'email') THEN
        ALTER TABLE employees ADD COLUMN email VARCHAR(255);
    END IF;

    -- Add address column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'address') THEN
        ALTER TABLE employees ADD COLUMN address TEXT;
    END IF;

END $$;

-- Add indexes for faster queries on contact fields
CREATE INDEX IF NOT EXISTS idx_employees_phone ON employees(phone);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_phone_secondary ON employees(phone_secondary);
