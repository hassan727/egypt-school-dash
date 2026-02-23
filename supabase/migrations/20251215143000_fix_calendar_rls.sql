-- Fix RLS Policies for hr_calendar_overrides
-- 20251215143000_fix_calendar_rls.sql

-- 1. Enable RLS (Ensure it is on)
ALTER TABLE public.hr_calendar_overrides ENABLE ROW LEVEL SECURITY;

-- 2. Drop potential conflicting policies
DROP POLICY IF EXISTS "Allow authenticated to read calendar" ON public.hr_calendar_overrides;
DROP POLICY IF EXISTS "Allow authenticated to update calendar" ON public.hr_calendar_overrides;
DROP POLICY IF EXISTS "Allow authenticated full access calendar" ON public.hr_calendar_overrides;

-- 3. Create a single, comprehensive policy
-- Allows SELECT, INSERT, UPDATE, DELETE for all authenticated users
CREATE POLICY "Allow authenticated full access calendar"
ON public.hr_calendar_overrides
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
