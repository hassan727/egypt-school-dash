-- Create HR System Settings table
CREATE TABLE IF NOT EXISTS public.hr_system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    absence_penalty_rate DECIMAL(3, 2) DEFAULT 1.00, -- Multiplier for daily salary deduction (e.g., 1.0 = 1 day deduction per 1 day absent)
    lateness_penalty_rate DECIMAL(3, 2) DEFAULT 0.25, -- Multiplier, maybe per hour or fixed. Let's assume hourly rate multiplier.
    overtime_rate DECIMAL(3, 2) DEFAULT 1.50, -- Multiplier for hourly rate
    lateness_grace_period_minutes INTEGER DEFAULT 15,
    working_hours_per_day INTEGER DEFAULT 8,
    working_days_per_month INTEGER DEFAULT 30, -- Used for daily rate calculation if not standard
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.hr_system_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read settings
CREATE POLICY "Allow authenticated read access" ON public.hr_system_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Allow only admins/HR to update (simplified for now to authenticated)
CREATE POLICY "Allow authenticated update access" ON public.hr_system_settings
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Insert default settings if not exists
INSERT INTO public.hr_system_settings (absence_penalty_rate, lateness_penalty_rate, overtime_rate, lateness_grace_period_minutes)
SELECT 1.00, 1.50, 1.50, 15
WHERE NOT EXISTS (SELECT 1 FROM public.hr_system_settings);

-- Add 'deduction_details' jsonb column to salaries if it doesn't exist, to store automated breakdown
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salaries' AND column_name = 'calculation_details') THEN
        ALTER TABLE public.salaries ADD COLUMN calculation_details JSONB;
    END IF;
END $$;
