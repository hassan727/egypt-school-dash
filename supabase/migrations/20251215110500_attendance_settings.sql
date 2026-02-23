-- Create hr_system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.hr_system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Penalty Rates (Multipliers)
    absence_penalty_rate DECIMAL(4, 2) DEFAULT 1.0,
    lateness_penalty_rate DECIMAL(4, 2) DEFAULT 1.0, 
    early_departure_penalty_rate DECIMAL(4, 2) DEFAULT 1.0,
    overtime_rate DECIMAL(4, 2) DEFAULT 1.5,

    -- Grace Periods (Minutes)
    lateness_grace_period_minutes INTEGER DEFAULT 15,
    max_grace_period_minutes INTEGER DEFAULT 30, -- If exceeded, grace is void
    early_departure_grace_minutes INTEGER DEFAULT 15,

    -- Official Times (Defaults)
    official_start_time TIME DEFAULT '08:00:00',
    official_end_time TIME DEFAULT '15:45:00',
    
    -- Work Settings
    working_hours_per_day DECIMAL(4, 1) DEFAULT 8.0,
    working_days_per_month INTEGER DEFAULT 30,

    -- Advanced Flexible Settings (JSONB)
    -- Structure: { "friday": { "is_off": true }, "thursday": { "end_time": "13:00" } }
    day_settings JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.hr_system_settings ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read settings
CREATE POLICY "Allow authenticated to read settings"
ON public.hr_system_settings
FOR SELECT
TO authenticated
USING (true);

-- Policy to allow admins/HR to update settings (simplified to authenticated for now)
CREATE POLICY "Allow authenticated to update settings"
ON public.hr_system_settings
FOR UPDATE
TO authenticated
USING (true);

-- Insert default row if table is empty
INSERT INTO public.hr_system_settings (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM public.hr_system_settings);
