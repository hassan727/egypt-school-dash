-- =============================================
-- SYSTEM TRIALS AND SUBSCRIPTIONS
-- Adds native support for trial tracking and status
-- =============================================
-- Migration: 20260222000000_trial_and_subscriptions.sql
-- Author: System
-- =============================================

-- Add subscription control columns to schools table
ALTER TABLE schools ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Add constraint to ensure status is one of the valid options
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'schools_status_check'
    ) THEN
        ALTER TABLE schools ADD CONSTRAINT schools_status_check 
        CHECK (status IN ('trial', 'active', 'expired', 'suspended'));
    END IF;
END $$;

-- Update existing trial schools based on settings jsonb (Migrating data if any)
UPDATE schools 
SET 
    is_trial = true,
    status = 'trial',
    trial_ends_at = (settings->>'trial_ends_at')::TIMESTAMP WITH TIME ZONE
WHERE 
    settings->>'is_trial' = 'true';
