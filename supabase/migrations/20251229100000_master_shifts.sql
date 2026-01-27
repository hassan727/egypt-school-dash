-- Migration: Add Master Shifts Management
-- Description: Create hr_shifts table and link to employees and teachers

-- 1. Create Master Shifts Table
CREATE TABLE IF NOT EXISTS public.hr_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    grace_period_minutes INTEGER DEFAULT 15,
    break_duration_minutes INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add shift_id to employees
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'shift_id') THEN
        ALTER TABLE employees ADD COLUMN shift_id UUID REFERENCES hr_shifts(id);
    END IF;
END $$;

-- 3. Add shift_id to teachers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'shift_id') THEN
        ALTER TABLE teachers ADD COLUMN shift_id UUID REFERENCES hr_shifts(id);
    END IF;
END $$;

-- 4. Enable RLS
ALTER TABLE public.hr_shifts ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies
DROP POLICY IF EXISTS "Allow authenticated users to read shifts" ON public.hr_shifts;
CREATE POLICY "Allow authenticated users to read shifts"
ON public.hr_shifts FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage shifts" ON public.hr_shifts;
CREATE POLICY "Allow authenticated users to manage shifts"
ON public.hr_shifts FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. Insert Default Shifts
INSERT INTO public.hr_shifts (name, start_time, end_time, grace_period_minutes, break_duration_minutes)
VALUES 
('الوردية الصباحية', '07:30:00', '14:30:00', 15, 30),
('الوردية المسائية', '13:00:00', '20:00:00', 10, 30),
('الدوام المرن', '08:00:00', '16:00:00', 30, 60)
ON CONFLICT DO NOTHING;
