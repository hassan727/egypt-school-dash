-- =============================================
-- PLATFORM DASHBOARD TABLES
-- Migration: 20260222200000_platform_dashboard_tables.sql
-- Description: Notifications, support tickets, and payments for enterprise dashboard
-- =============================================

-- =============================================
-- 1. PLATFORM NOTIFICATIONS (Alerts & Announcements)
-- =============================================
CREATE TABLE IF NOT EXISTS platform_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_type VARCHAR(30) NOT NULL DEFAULT 'info'
        CHECK (notification_type IN ('info', 'warning', 'error', 'success', 'announcement')),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    target VARCHAR(30) DEFAULT 'all'
        CHECK (target IN ('all', 'school', 'owner')),
    target_school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 0,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_platform_notifications_type ON platform_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_platform_notifications_created ON platform_notifications(created_at DESC);

-- =============================================
-- 2. PLATFORM SUPPORT TICKETS
-- =============================================
CREATE TABLE IF NOT EXISTS platform_support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    school_name VARCHAR(255),
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general'
        CHECK (category IN ('general', 'technical', 'billing', 'feature', 'bug')),
    status VARCHAR(20) DEFAULT 'open'
        CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(20) DEFAULT 'normal'
        CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    assigned_to VARCHAR(255),
    resolution TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON platform_support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_school ON platform_support_tickets(school_id);

-- =============================================
-- 3. PLATFORM PAYMENTS (Invoice & Payment Tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS platform_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency VARCHAR(5) DEFAULT 'SAR',
    payment_method VARCHAR(30) DEFAULT 'bank_transfer'
        CHECK (payment_method IN ('bank_transfer', 'credit_card', 'cash', 'online', 'other')),
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
    invoice_number VARCHAR(50),
    description TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_payments_school ON platform_payments(school_id);
CREATE INDEX IF NOT EXISTS idx_platform_payments_status ON platform_payments(status);

-- =============================================
-- DISABLE RLS (Development)
-- =============================================
ALTER TABLE platform_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE platform_support_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE platform_payments DISABLE ROW LEVEL SECURITY;

-- =============================================
-- SEED DEMO DATA
-- =============================================

-- Demo notifications
INSERT INTO platform_notifications (notification_type, title, message, target, priority) VALUES
('warning', 'اشتراكات تنتهي قريباً', '3 مدارس ستنتهي اشتراكاتها خلال 7 أيام', 'owner', 2),
('info', 'طلبات تسجيل جديدة', 'يوجد طلبان معلقان لتسجيل مدارس جديدة', 'owner', 1),
('warning', 'فواتير غير مدفوعة', 'يوجد مدفوعات معلقة من 3 مدارس', 'owner', 2),
('announcement', 'تحديث النظام v2.5', 'تم إصدار تحديث جديد يتضمن تحسينات أداء ومميزات إضافية', 'all', 0),
('success', 'اكتمال النسخة الاحتياطية', 'تم إنشاء نسخة احتياطية كاملة بنجاح', 'owner', 0);

-- Demo support tickets
INSERT INTO platform_support_tickets (school_name, subject, description, category, status, priority, created_by) VALUES
('مدرسة الأمل', 'مشكلة في تسجيل الدخول', 'لا يمكن تسجيل الدخول للنظام بعد تحديث كلمة المرور', 'technical', 'open', 'high', 'أحمد محمد'),
('مدرسة النور', 'طلب إضافة خاصية التقارير', 'نحتاج مميزات تقارير إضافية للمالية', 'feature', 'in_progress', 'normal', 'سارة أحمد'),
('مدرسة الفجر', 'خطأ في حساب الرواتب', 'تظهر أرقام خاطئة في كشف الرواتب الشهري', 'bug', 'open', 'critical', 'محمود علي');

-- Demo payments
DO $$
DECLARE
    v_school RECORD;
    v_sub RECORD;
    v_counter INTEGER := 0;
BEGIN
    FOR v_school IN SELECT id, school_name FROM schools LIMIT 5
    LOOP
        v_counter := v_counter + 1;
        SELECT id INTO v_sub FROM subscriptions WHERE school_id = v_school.id LIMIT 1;
        
        INSERT INTO platform_payments (school_id, subscription_id, amount, status, invoice_number, description, due_date, paid_at)
        VALUES (
            v_school.id,
            v_sub.id,
            CASE v_counter 
                WHEN 1 THEN 500.00 
                WHEN 2 THEN 1000.00 
                WHEN 3 THEN 2000.00 
                WHEN 4 THEN 500.00 
                WHEN 5 THEN 1000.00 
            END,
            CASE v_counter 
                WHEN 1 THEN 'paid' 
                WHEN 2 THEN 'paid' 
                WHEN 3 THEN 'pending' 
                WHEN 4 THEN 'pending' 
                WHEN 5 THEN 'paid' 
            END,
            'INV-2026-' || LPAD(v_counter::TEXT, 4, '0'),
            'رسوم اشتراك شهرية',
            NOW() + INTERVAL '30 days',
            CASE WHEN v_counter IN (1,2,5) THEN NOW() - INTERVAL '5 days' ELSE NULL END
        );
    END LOOP;
END $$;

SELECT 'Platform Dashboard Tables created successfully!' as status;
