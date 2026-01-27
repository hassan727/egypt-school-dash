-- Migration: Add JSONB settings column to schools table
-- Description: Adds a flexible settings column to store feature flags and branding options per school.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schools' AND column_name = 'settings') THEN
        ALTER TABLE public.schools ADD COLUMN settings JSONB DEFAULT '{
            "features": {
                "finance": true,
                "hr": true,
                "students": true,
                "control": true
            },
            "branding": {
                "logo_url": "",
                "print_header": "",
                "primary_color": "#2563eb"
            },
            "limits": {
                "max_users": 10,
                "max_students": 500
            }
        }'::jsonb;
    END IF;
END $$;
