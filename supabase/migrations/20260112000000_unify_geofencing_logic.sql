-- =============================================
-- توحيد منطق السياج الجغرافي (Geofencing Unification)
-- Migration: 20260112000000_unify_geofencing_logic.sql
-- =============================================

BEGIN;

-- 1. إضافة عمود is_default إلى attendance_locations
ALTER TABLE attendance_locations 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- 2. إضافة constraint: موقع افتراضي واحد فقط
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_default_location 
ON attendance_locations (is_default) 
WHERE is_default = true;

-- 3. نقل البيانات الموجودة (Data Migration)
-- إذا وجدت إحداثيات في attendance_settings، ننشئ موقع افتراضي
DO $$
DECLARE
    v_school_id UUID;
    v_lat TEXT;
    v_lng TEXT;
    v_radius TEXT;
    v_new_location_id UUID;
    v_existing_default UUID;
BEGIN
    -- لكل مدرسة لديها geofencing settings
    FOR v_school_id, v_lat, v_lng, v_radius IN
        SELECT DISTINCT ON (school_id) 
            school_id,
            MAX(CASE WHEN setting_key = 'check_in_latitude' THEN setting_value END),
            MAX(CASE WHEN setting_key = 'check_in_longitude' THEN setting_value END),
            MAX(CASE WHEN setting_key = 'geofencing_radius_meters' THEN setting_value END)
        FROM attendance_settings
        WHERE setting_category = 'geofencing'
          AND setting_key IN ('check_in_latitude', 'check_in_longitude', 'geofencing_radius_meters')
        GROUP BY school_id
        HAVING MAX(CASE WHEN setting_key = 'check_in_latitude' THEN setting_value END) IS NOT NULL
    LOOP
        -- تحقق إذا لم يكن يوجد موقع افتراضي بالفعل
        SELECT id INTO v_existing_default FROM attendance_locations WHERE is_default = true LIMIT 1;
        
        IF v_existing_default IS NULL AND v_lat IS NOT NULL AND v_lng IS NOT NULL THEN
            -- إنشاء موقع جديد من البيانات القديمة
            INSERT INTO attendance_locations (
                school_id, location_name, latitude, longitude, radius_meters, is_default, is_active
            ) VALUES (
                v_school_id,
                'الموقع الرئيسي (تم الترحيل من الإعدادات)',
                v_lat::DECIMAL,
                v_lng::DECIMAL,
                COALESCE(v_radius::INTEGER, 100),
                true,
                true
            ) RETURNING id INTO v_new_location_id;

            RAISE NOTICE 'Created default location with ID: % for school: %', v_new_location_id, v_school_id;

            -- ربطه بالإعدادات كـ default_location_id
            INSERT INTO attendance_settings (setting_key, setting_value, setting_category, description, school_id)
            VALUES ('default_location_id', v_new_location_id::TEXT, 'geofencing', 'معرف الموقع الافتراضي للتحقق من الحضور', v_school_id)
            ON CONFLICT (setting_key, school_id) DO UPDATE SET setting_value = EXCLUDED.setting_value;
        END IF;
    END LOOP;
    
    -- إذا لم توجد بيانات قديمة ولكن يوجد مواقع في attendance_locations
    -- نعين أول موقع نشط كافتراضي
    IF NOT EXISTS (SELECT 1 FROM attendance_locations WHERE is_default = true) THEN
        UPDATE attendance_locations 
        SET is_default = true 
        WHERE id = (SELECT id FROM attendance_locations WHERE is_active = true ORDER BY created_at LIMIT 1);
        
        -- تحديث attendance_settings بهذا الموقع لكل مدرسة
        INSERT INTO attendance_settings (setting_key, setting_value, setting_category, description, school_id)
        SELECT 
            'default_location_id',
            loc.id::TEXT,
            'geofencing',
            'معرف الموقع الافتراضي للتحقق من الحضور',
            s.id
        FROM schools s
        CROSS JOIN LATERAL (
            SELECT id FROM attendance_locations WHERE is_default = true LIMIT 1
        ) loc
        ON CONFLICT (setting_key, school_id) DO UPDATE SET setting_value = EXCLUDED.setting_value;
    END IF;
    
END $$;

-- 4. حذف الإعدادات الجغرافية القديمة بعد نقل البيانات
-- نحتفظ بنسخة احتياطية في جدول مؤقت أولاً (للأمان)
CREATE TABLE IF NOT EXISTS _backup_old_geofencing_settings AS
SELECT * FROM attendance_settings 
WHERE setting_key IN (
    'check_in_latitude',
    'check_in_longitude', 
    'check_out_latitude',
    'check_out_longitude',
    'geofencing_radius_meters'
);

-- الآن نحذف من الجدول الرئيسي
DELETE FROM attendance_settings 
WHERE setting_key IN (
    'check_in_latitude',
    'check_in_longitude', 
    'check_out_latitude',
    'check_out_longitude',
    'geofencing_radius_meters'
);

-- 5. تعليق توضيحي
COMMENT ON COLUMN attendance_locations.is_default IS 'موقع افتراضي للمدرسة - يستخدم للتحقق من السياج الجغرافي';
COMMENT ON TABLE _backup_old_geofencing_settings IS 'نسخة احتياطية من الإعدادات الجغرافية القديمة - يمكن حذفها بعد التأكد من نجاح الترحيل';

COMMIT;

-- رسالة نجاح
SELECT 'تم توحيد السياج الجغرافي بنجاح! ✅' as status;
