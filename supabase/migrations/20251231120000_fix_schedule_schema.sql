-- Migration: Fix Smart School Timetable Schema
-- Adds missing tables and columns required by the frontend
-- 20251231120000_fix_schedule_schema.sql

-- 1. Add missing columns to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS short_name VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS max_weekly_periods INTEGER DEFAULT 24;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT '#3b82f6';

-- 2. Create schedule_constraints table
CREATE TABLE IF NOT EXISTS schedule_constraints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    constraint_type VARCHAR(100) NOT NULL, -- 'max_daily_periods', 'off_days', 'max_consecutive_periods', etc.
    
    -- Target Entity
    entity_type VARCHAR(50) NOT NULL, -- 'teacher', 'class', 'grade', 'subject', 'global'
    entity_id UUID, -- Can be NULL for global constraints
    
    -- Settings (JSON to be flexible for different constraint types)
    -- Examples: { "count": 6 }, { "days": ["sunday", "thursday"] }
    settings JSONB DEFAULT '{}'::JSONB,
    
    priority VARCHAR(20) DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_constraints_lookup ON schedule_constraints(entity_type, entity_id);

-- RLS Settings (Disable for now as per system design)
ALTER TABLE schedule_constraints DISABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER update_schedule_constraints_updated_at 
    BEFORE UPDATE ON schedule_constraints 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

SELECT 'تم إصلاح هيكل قاعدة البيانات بنجاح' as status;
