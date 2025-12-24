-- =============================================
-- Migration: Smart Calendar & Hybrid System
-- 20251215120000_smart_calendar.sql
-- =============================================

-- 1. جدول استثناءات التقويم (التحكم اليومي)
CREATE TABLE IF NOT EXISTS public.hr_calendar_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE, -- يوم واحد فقط لكل سجل
    
    -- نوع اليوم في هذا التاريخ
    day_type VARCHAR(50) NOT NULL CHECK (day_type IN ('work', 'half_day', 'off_paid', 'off_unpaid', 'special')),
    
    -- نسب وأرقام مالية
    pay_rate DECIMAL(4, 2) DEFAULT 1.0,  -- نسبة الأجر (1.0 = 100%, 1.5 = 150%)
    bonus_fixed DECIMAL(10, 2) DEFAULT 0, -- مكافأة ثابتة لهذا اليوم (جنيه)
    
    -- مواعيد خاصة لهذا اليوم (اختياري - يغطي على المواعيد الرسمية)
    custom_start_time TIME,
    custom_end_time TIME,
    
    -- ملاحظات
    note TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. إضافة سياسات الغياب إلى الإعدادات العامة
-- سيتم تخزينها كـ JSONB للمرونة: { "work": 0, "off_paid": 1.0, "special": 0.5 }
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'hr_system_settings' AND column_name = 'absence_policies') 
    THEN
        ALTER TABLE public.hr_system_settings ADD COLUMN absence_policies JSONB DEFAULT '{"work": 0, "half_day": 0, "off_paid": 1.0, "special": 1.0}'::jsonb;
    END IF;
END $$;

-- 3. تفعيل RLS (الأمان)
ALTER TABLE public.hr_calendar_overrides ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول (للجميع حالياً للتطوير، يفضل تخصيصها لاحقاً)
DROP POLICY IF EXISTS "Allow authenticated to read calendar" ON public.hr_calendar_overrides;
CREATE POLICY "Allow authenticated to read calendar" ON public.hr_calendar_overrides FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated to update calendar" ON public.hr_calendar_overrides;
CREATE POLICY "Allow authenticated to update calendar" ON public.hr_calendar_overrides FOR ALL TO authenticated USING (true);

-- 4. Trigger لتحديث updated_at
DROP TRIGGER IF EXISTS update_hr_calendar_overrides_updated_at ON hr_calendar_overrides;
CREATE TRIGGER update_hr_calendar_overrides_updated_at
    BEFORE UPDATE ON hr_calendar_overrides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. إضافة بيانات تجريبية (يوم رأس السنة مثلاً)
INSERT INTO public.hr_calendar_overrides (date, day_type, pay_rate, bonus_fixed, note)
VALUES 
    ('2025-01-01', 'special', 2.0, 500, 'رأس السنة الميلادية - مكافأة خاصة'),
    ('2025-01-25', 'off_paid', 1.0, 0, 'عيد الشرطة')
ON CONFLICT (date) DO NOTHING;

SELECT 'تم تفعيل نظام التقويم الذكي بنجاح' as status;
