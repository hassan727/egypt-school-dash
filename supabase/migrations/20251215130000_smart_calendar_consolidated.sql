-- =============================================
-- Migration: Smart Calendar & Attendance Consolidated
-- 20251215130000_smart_calendar_consolidated.sql
-- =============================================

-- 1. HR System Settings Table
CREATE TABLE IF NOT EXISTS public.hr_system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Penalty Rates
    absence_penalty_rate DECIMAL(4, 2) DEFAULT 1.0,
    lateness_penalty_rate DECIMAL(4, 2) DEFAULT 1.0, 
    early_departure_penalty_rate DECIMAL(4, 2) DEFAULT 1.0,
    overtime_rate DECIMAL(4, 2) DEFAULT 1.5,

    -- Grace Periods
    lateness_grace_period_minutes INTEGER DEFAULT 15,
    max_grace_period_minutes INTEGER DEFAULT 30,
    early_departure_grace_minutes INTEGER DEFAULT 15,

    -- Official Times
    official_start_time TIME DEFAULT '08:00:00',
    official_end_time TIME DEFAULT '15:45:00',
    working_hours_per_day DECIMAL(4, 1) DEFAULT 8.0,
    working_days_per_month INTEGER DEFAULT 30,

    -- JSONB Settings
    day_settings JSONB DEFAULT '{}'::jsonb,
    absence_policies JSONB DEFAULT '{"work": 0, "half_day": 0, "off_paid": 1.0, "special": 1.0}'::jsonb
);

-- 2. HR Calendar Overrides Table
CREATE TABLE IF NOT EXISTS public.hr_calendar_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    
    day_type VARCHAR(50) NOT NULL CHECK (day_type IN ('work', 'half_day', 'off_paid', 'off_unpaid', 'special')),
    
    pay_rate DECIMAL(4, 2) DEFAULT 1.0,
    bonus_fixed DECIMAL(10, 2) DEFAULT 0,
    
    custom_start_time TIME,
    custom_end_time TIME,
    
    note TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Attendance Locations Table (Geofencing)
CREATE TABLE IF NOT EXISTS attendance_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER DEFAULT 100,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Attendance QR Codes Table
CREATE TABLE IF NOT EXISTS attendance_qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES attendance_locations(id) ON DELETE CASCADE,
    qr_code_data VARCHAR(255) UNIQUE NOT NULL,
    qr_type VARCHAR(20) CHECK (qr_type IN ('check_in', 'check_out')),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Helper Function for Updated At (Idempotent)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Triggers (Drop then Create)
DROP TRIGGER IF EXISTS update_hr_calendar_overrides_updated_at ON hr_calendar_overrides;
CREATE TRIGGER update_hr_calendar_overrides_updated_at
    BEFORE UPDATE ON hr_calendar_overrides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendance_locations_updated_at ON attendance_locations;
CREATE TRIGGER update_attendance_locations_updated_at
    BEFORE UPDATE ON attendance_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Add Columns to Employee Attendance (Safe Alter)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_attendance' AND column_name = 'check_in_latitude') THEN
        ALTER TABLE employee_attendance ADD COLUMN check_in_latitude DECIMAL(10, 8);
        ALTER TABLE employee_attendance ADD COLUMN check_in_longitude DECIMAL(11, 8);
        ALTER TABLE employee_attendance ADD COLUMN check_in_verified BOOLEAN DEFAULT false;
        ALTER TABLE employee_attendance ADD COLUMN check_out_latitude DECIMAL(10, 8);
        ALTER TABLE employee_attendance ADD COLUMN check_out_longitude DECIMAL(11, 8);
        ALTER TABLE employee_attendance ADD COLUMN check_out_verified BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 8. Enable RLS
ALTER TABLE public.hr_system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_calendar_overrides ENABLE ROW LEVEL SECURITY;

-- 9. Policies (Drop then Create)
DROP POLICY IF EXISTS "Allow authenticated full access settings" ON public.hr_system_settings;
CREATE POLICY "Allow authenticated full access settings" ON public.hr_system_settings FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated full access calendar" ON public.hr_calendar_overrides;
CREATE POLICY "Allow authenticated full access calendar" ON public.hr_calendar_overrides FOR ALL TO authenticated USING (true);

-- 10. Default Data (Idempotent Insert)
INSERT INTO public.hr_system_settings (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM public.hr_system_settings);
