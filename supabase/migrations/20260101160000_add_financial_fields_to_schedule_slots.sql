-- =============================================
-- Migration: Add Financial Fields to Schedule Slots
-- إضافة الحقول المالية (احتساب المكافآت) لجدول الحصص
-- 20260101160000_add_financial_fields_to_schedule_slots.sql
-- =============================================

DO $$
BEGIN
    -- 1. إضافة حقل هل هي حصة مدفوعة (مكافأة)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedule_slots' AND column_name = 'is_paid') THEN
        ALTER TABLE schedule_slots ADD COLUMN is_paid BOOLEAN DEFAULT false;
    END IF;

    -- 2. إضافة حقل قيمة الحصة (أو النسبة)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedule_slots' AND column_name = 'pay_rate') THEN
        ALTER TABLE schedule_slots ADD COLUMN pay_rate DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- تحديث التعليقات
COMMENT ON COLUMN schedule_slots.is_paid IS 'هل يتم احتساب هذه الحصة كمكافأة إضافية في الراتب';
COMMENT ON COLUMN schedule_slots.pay_rate IS 'قيمة المبلغ الإضافي لهذه الحصة (مثلاً 50 جنيه للحصة الاحتياطي)';

SELECT 'Financial fields added to schedule_slots successfully' as status;
