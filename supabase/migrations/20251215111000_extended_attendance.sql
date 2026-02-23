-- =============================================
-- Migration: Extended Attendance Features (Geofencing + QR Code)
-- نظام الحضور المتقدم (تحديد المواقع + QR)
-- =============================================

-- 1. جدول مواقع الحضور (Geofence Locations)
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

-- 2. جدول رموز QR للحضور
CREATE TABLE IF NOT EXISTS attendance_qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES attendance_locations(id) ON DELETE CASCADE,
    qr_code_data VARCHAR(255) UNIQUE NOT NULL,
    qr_type VARCHAR(20) CHECK (qr_type IN ('check_in', 'check_out')),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. إضافة أعمدة GPS إلى جدول الحضور
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'employee_attendance' AND column_name = 'check_in_latitude') 
    THEN
        ALTER TABLE employee_attendance ADD COLUMN check_in_latitude DECIMAL(10, 8);
        ALTER TABLE employee_attendance ADD COLUMN check_in_longitude DECIMAL(11, 8);
        ALTER TABLE employee_attendance ADD COLUMN check_in_verified BOOLEAN DEFAULT false;
        ALTER TABLE employee_attendance ADD COLUMN check_out_latitude DECIMAL(10, 8);
        ALTER TABLE employee_attendance ADD COLUMN check_out_longitude DECIMAL(11, 8);
        ALTER TABLE employee_attendance ADD COLUMN check_out_verified BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 4. فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_attendance_locations_active ON attendance_locations(is_active);
CREATE INDEX IF NOT EXISTS idx_attendance_qr_codes_location ON attendance_qr_codes(location_id);
CREATE INDEX IF NOT EXISTS idx_attendance_qr_codes_data ON attendance_qr_codes(qr_code_data);
CREATE INDEX IF NOT EXISTS idx_attendance_qr_codes_active ON attendance_qr_codes(is_active);

-- 5. Trigger لتحديث updated_at
-- 5. Trigger لتحديث updated_at
DROP TRIGGER IF EXISTS update_attendance_locations_updated_at ON attendance_locations;
CREATE TRIGGER update_attendance_locations_updated_at
    BEFORE UPDATE ON attendance_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. تعطيل RLS (للتطوير)
ALTER TABLE attendance_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_qr_codes DISABLE ROW LEVEL SECURITY;

-- 7. بيانات تجريبية - موقع المدرسة الافتراضي
INSERT INTO attendance_locations (location_name, latitude, longitude, radius_meters, address)
VALUES 
    ('المدخل الرئيسي', 30.0444, 31.2357, 100, 'القاهرة - مصر'),
    ('بوابة الموظفين', 30.0445, 31.2358, 50, 'القاهرة - مصر')
ON CONFLICT DO NOTHING;

SELECT 'تم إنشاء جداول الحضور المتقدم بنجاح!' as status;
