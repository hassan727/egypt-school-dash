-- =============================================
-- MULTI-TENANT PLATFORM INFRASTRUCTURE
-- Migration: 20260222100000_multi_tenant_platform.sql
-- Description: Creates the complete multi-tenant SaaS infrastructure
-- Tables: platform_owner, features, subscription_plans, plan_features,
--         subscriptions, school_features, roles, permissions, role_permissions,
--         users, user_roles, platform_audit_log
-- =============================================

-- =============================================
-- 1. PLATFORM OWNER TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS platform_owner (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default platform owner
INSERT INTO platform_owner (email, password_hash, full_name, phone)
VALUES ('owner@platform.com', 'owner123', 'مالك المنصة', '+201000000000')
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- 2. FEATURES TABLE (Platform-level feature definitions)
-- =============================================
CREATE TABLE IF NOT EXISTS features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    feature_key VARCHAR(50) UNIQUE NOT NULL,
    feature_name_ar VARCHAR(100) NOT NULL,
    feature_name_en VARCHAR(100),
    description_ar TEXT,
    description_en TEXT,
    icon VARCHAR(50),
    category VARCHAR(50) DEFAULT 'general',
    is_core BOOLEAN DEFAULT false,
    depends_on VARCHAR(50)[] DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed all system features
INSERT INTO features (feature_key, feature_name_ar, feature_name_en, icon, category, is_core, depends_on, sort_order) VALUES
('students',      'شؤون الطلاب',         'Students',           'Users',          'core',       true,  '{}',                 1),
('control_room',  'الكنترول',             'Control Room',       'ClipboardList',  'academic',   false, '{students}',         2),
('hr',            'الموارد البشرية',      'Human Resources',    'UserCog',        'management', false, '{}',                 3),
('finance',       'المالية',              'Finance',            'DollarSign',     'management', false, '{}',                 4),
('attendance',    'الحضور والغياب',       'Attendance',         'CalendarCheck',  'core',       false, '{}',                 5),
('biometric',     'البصمة',              'Biometric',          'Fingerprint',    'hardware',   false, '{attendance}',       6),
('reports',       'التقارير',             'Reports',            'BarChart3',      'analytics',  false, '{}',                 7),
('notifications', 'الإشعارات',            'Notifications',      'Bell',           'communication', false, '{}',              8),
('behavior',      'السلوك',              'Behavior',           'Shield',         'academic',   false, '{students}',         9),
('certificates',  'الشهادات',             'Certificates',       'Award',          'academic',   false, '{students,control_room}', 10),
('transport',     'النقل المدرسي',        'Transport',          'Bus',            'services',   false, '{}',                 11),
('library',       'المكتبة',             'Library',            'BookOpen',       'services',   false, '{}',                 12)
ON CONFLICT (feature_key) DO NOTHING;

-- =============================================
-- 3. SUBSCRIPTION PLANS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_key VARCHAR(50) UNIQUE NOT NULL,
    plan_name_ar VARCHAR(100) NOT NULL,
    plan_name_en VARCHAR(100),
    description_ar TEXT,
    description_en TEXT,
    price_monthly DECIMAL(10,2) DEFAULT 0,
    price_yearly DECIMAL(10,2) DEFAULT 0,
    max_students INTEGER,
    max_employees INTEGER,
    max_users INTEGER,
    trial_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default plans
INSERT INTO subscription_plans (plan_key, plan_name_ar, plan_name_en, price_monthly, price_yearly, max_students, max_employees, max_users, trial_days, sort_order) VALUES
('trial',      'تجربة مجانية',    'Free Trial',     0,      0,       50,   10,  5,   14,  1),
('basic',      'الخطة الأساسية',  'Basic Plan',     500,    5000,    200,  30,  10,  0,   2),
('advanced',   'الخطة المتقدمة',  'Advanced Plan',  1000,   10000,   500,  100, 25,  0,   3),
('premium',    'الخطة الكاملة',   'Premium Plan',   2000,   20000,   NULL, NULL, NULL, 0,  4),
('custom',     'خطة مخصصة',       'Custom Plan',    0,      0,       NULL, NULL, NULL, 0,  5)
ON CONFLICT (plan_key) DO NOTHING;

-- =============================================
-- 4. PLAN_FEATURES TABLE (which features each plan includes)
-- =============================================
CREATE TABLE IF NOT EXISTS plan_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(plan_id, feature_id)
);

-- Seed plan-feature mappings
DO $$
DECLARE
    v_trial UUID;
    v_basic UUID;
    v_advanced UUID;
    v_premium UUID;
    v_custom UUID;
BEGIN
    SELECT id INTO v_trial FROM subscription_plans WHERE plan_key = 'trial';
    SELECT id INTO v_basic FROM subscription_plans WHERE plan_key = 'basic';
    SELECT id INTO v_advanced FROM subscription_plans WHERE plan_key = 'advanced';
    SELECT id INTO v_premium FROM subscription_plans WHERE plan_key = 'premium';
    SELECT id INTO v_custom FROM subscription_plans WHERE plan_key = 'custom';

    -- Trial: students + attendance only
    INSERT INTO plan_features (plan_id, feature_id)
    SELECT v_trial, id FROM features WHERE feature_key IN ('students', 'attendance')
    ON CONFLICT DO NOTHING;

    -- Basic: students, attendance, control_room, notifications
    INSERT INTO plan_features (plan_id, feature_id)
    SELECT v_basic, id FROM features WHERE feature_key IN ('students', 'attendance', 'control_room', 'notifications')
    ON CONFLICT DO NOTHING;

    -- Advanced: basic + hr, finance, reports, behavior
    INSERT INTO plan_features (plan_id, feature_id)
    SELECT v_advanced, id FROM features WHERE feature_key IN ('students', 'attendance', 'control_room', 'notifications', 'hr', 'finance', 'reports', 'behavior')
    ON CONFLICT DO NOTHING;

    -- Premium: all features
    INSERT INTO plan_features (plan_id, feature_id)
    SELECT v_premium, id FROM features
    ON CONFLICT DO NOTHING;

    -- Custom: no default features (owner assigns manually)
END $$;

-- =============================================
-- 5. SUBSCRIPTIONS TABLE (per-school subscription)
-- =============================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) NOT NULL DEFAULT 'trial'
        CHECK (status IN ('trial', 'active', 'expired', 'suspended', 'terminated')),
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ends_at TIMESTAMP WITH TIME ZONE,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT false,
    payment_method VARCHAR(50),
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id)
);

-- =============================================
-- 6. SCHOOL_FEATURES TABLE (per-school feature overrides)
-- =============================================
CREATE TABLE IF NOT EXISTS school_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    source VARCHAR(20) DEFAULT 'plan' CHECK (source IN ('plan', 'manual', 'addon')),
    enabled_by VARCHAR(255),
    enabled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, feature_id)
);

-- =============================================
-- 7. ROLES TABLE (per-school roles)
-- =============================================
CREATE TABLE IF NOT EXISTS roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    role_key VARCHAR(50) NOT NULL,
    role_name_ar VARCHAR(100) NOT NULL,
    role_name_en VARCHAR(100),
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, role_key)
);

-- Seed default system roles (template for all schools, school_id = NULL means template)
INSERT INTO roles (school_id, role_key, role_name_ar, role_name_en, is_system) VALUES
(NULL, 'school_admin',       'مدير المدرسة',      'School Admin',       true),
(NULL, 'vice_principal',     'نائب المدير',        'Vice Principal',     true),
(NULL, 'accountant',         'محاسب',              'Accountant',         true),
(NULL, 'student_affairs',    'شؤون طلاب',          'Student Affairs',    true),
(NULL, 'teacher',            'معلم',               'Teacher',            true),
(NULL, 'hr_manager',         'مدير الموارد البشرية', 'HR Manager',        true),
(NULL, 'data_entry',         'مدخل بيانات',        'Data Entry',         true)
ON CONFLICT DO NOTHING;

-- =============================================
-- 8. PERMISSIONS TABLE (granular permission definitions)
-- =============================================
CREATE TABLE IF NOT EXISTS permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    permission_key VARCHAR(100) UNIQUE NOT NULL,
    permission_name_ar VARCHAR(150) NOT NULL,
    feature_key VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('view', 'create', 'edit', 'delete', 'export', 'approve')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed permissions per feature
INSERT INTO permissions (permission_key, permission_name_ar, feature_key, action) VALUES
-- Students
('students.view',       'عرض الطلاب',           'students', 'view'),
('students.create',     'إضافة طالب',           'students', 'create'),
('students.edit',       'تعديل بيانات طالب',    'students', 'edit'),
('students.delete',     'حذف طالب',             'students', 'delete'),
('students.export',     'تصدير بيانات الطلاب',   'students', 'export'),
-- Control Room
('control_room.view',   'عرض الكنترول',          'control_room', 'view'),
('control_room.create', 'إدخال درجات',           'control_room', 'create'),
('control_room.edit',   'تعديل درجات',           'control_room', 'edit'),
('control_room.approve', 'اعتماد النتائج',       'control_room', 'approve'),
-- HR
('hr.view',             'عرض الموارد البشرية',    'hr', 'view'),
('hr.create',           'إضافة موظف',            'hr', 'create'),
('hr.edit',             'تعديل بيانات موظف',     'hr', 'edit'),
('hr.delete',           'حذف موظف',              'hr', 'delete'),
-- Finance
('finance.view',        'عرض المالية',            'finance', 'view'),
('finance.create',      'إنشاء معاملة مالية',     'finance', 'create'),
('finance.edit',        'تعديل معاملة مالية',     'finance', 'edit'),
('finance.approve',     'اعتماد مالي',            'finance', 'approve'),
('finance.export',      'تصدير بيانات مالية',     'finance', 'export'),
-- Attendance
('attendance.view',     'عرض الحضور',             'attendance', 'view'),
('attendance.create',   'تسجيل حضور',             'attendance', 'create'),
('attendance.edit',     'تعديل حضور',             'attendance', 'edit'),
-- Reports
('reports.view',        'عرض التقارير',            'reports', 'view'),
('reports.export',      'تصدير التقارير',          'reports', 'export'),
-- Notifications
('notifications.view',  'عرض الإشعارات',           'notifications', 'view'),
('notifications.create','إرسال إشعار',             'notifications', 'create'),
-- Behavior
('behavior.view',       'عرض السلوك',              'behavior', 'view'),
('behavior.create',     'تسجيل سلوك',              'behavior', 'create'),
('behavior.edit',       'تعديل سجل سلوك',          'behavior', 'edit'),
-- Certificates
('certificates.view',   'عرض الشهادات',             'certificates', 'view'),
('certificates.create', 'إصدار شهادة',             'certificates', 'create'),
-- Transport
('transport.view',      'عرض النقل',               'transport', 'view'),
('transport.edit',      'إدارة النقل',             'transport', 'edit'),
-- Library
('library.view',        'عرض المكتبة',              'library', 'view'),
('library.edit',        'إدارة المكتبة',            'library', 'edit'),
-- Biometric
('biometric.view',      'عرض البصمة',               'biometric', 'view'),
('biometric.edit',      'إدارة البصمة',             'biometric', 'edit')
ON CONFLICT (permission_key) DO NOTHING;

-- =============================================
-- 9. ROLE_PERMISSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- Assign all permissions to school_admin template role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.role_key = 'school_admin' AND r.school_id IS NULL
ON CONFLICT DO NOTHING;

-- =============================================
-- 10. SCHOOL_USERS TABLE (users within a school)
-- =============================================
CREATE TABLE IF NOT EXISTS school_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    auth_user_id UUID,
    email VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, email)
);

-- =============================================
-- 11. USER_ROLES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES school_users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- =============================================
-- 12. PLATFORM_AUDIT_LOG TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS platform_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_type VARCHAR(20) NOT NULL CHECK (actor_type IN ('owner', 'school_user', 'system')),
    actor_id UUID,
    actor_name VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id UUID,
    target_name VARCHAR(255),
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 13. INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_school ON subscriptions(school_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_school_features_school ON school_features(school_id);
CREATE INDEX IF NOT EXISTS idx_school_features_feature ON school_features(feature_id);
CREATE INDEX IF NOT EXISTS idx_roles_school ON roles(school_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_school_users_school ON school_users(school_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_log_actor ON platform_audit_log(actor_type, actor_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_log_target ON platform_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_log_created ON platform_audit_log(created_at);

-- =============================================
-- 14. DISABLE RLS (Development)
-- =============================================
ALTER TABLE platform_owner DISABLE ROW LEVEL SECURITY;
ALTER TABLE features DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE plan_features DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE school_features DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE school_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE platform_audit_log DISABLE ROW LEVEL SECURITY;

-- =============================================
-- 15. AUTO-PROVISION: When a school gets a subscription, populate school_features from plan
-- =============================================
CREATE OR REPLACE FUNCTION provision_school_features()
RETURNS TRIGGER AS $$
BEGIN
    -- Clear existing plan-sourced features
    DELETE FROM school_features 
    WHERE school_id = NEW.school_id AND source = 'plan';
    
    -- Insert features from the new plan
    INSERT INTO school_features (school_id, feature_id, is_enabled, source, enabled_by)
    SELECT NEW.school_id, pf.feature_id, true, 'plan', 'system'
    FROM plan_features pf
    WHERE pf.plan_id = NEW.plan_id
    ON CONFLICT (school_id, feature_id) 
    DO UPDATE SET is_enabled = true, source = 'plan', updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_provision_school_features ON subscriptions;
CREATE TRIGGER trigger_provision_school_features
    AFTER INSERT OR UPDATE OF plan_id ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION provision_school_features();

-- =============================================
-- 16. AUTO-PROVISION: Clone system roles for new schools
-- =============================================
CREATE OR REPLACE FUNCTION provision_school_roles()
RETURNS TRIGGER AS $$
DECLARE
    v_template_role RECORD;
    v_new_role_id UUID;
BEGIN
    -- Clone template roles (school_id IS NULL) for this school
    FOR v_template_role IN 
        SELECT * FROM roles WHERE school_id IS NULL AND is_system = true
    LOOP
        INSERT INTO roles (school_id, role_key, role_name_ar, role_name_en, is_system)
        VALUES (NEW.id, v_template_role.role_key, v_template_role.role_name_ar, v_template_role.role_name_en, true)
        ON CONFLICT (school_id, role_key) DO NOTHING
        RETURNING id INTO v_new_role_id;
        
        -- Clone permissions for this role
        IF v_new_role_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT v_new_role_id, rp.permission_id
            FROM role_permissions rp
            WHERE rp.role_id = v_template_role.id
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_provision_school_roles ON schools;
CREATE TRIGGER trigger_provision_school_roles
    AFTER INSERT ON schools
    FOR EACH ROW
    EXECUTE FUNCTION provision_school_roles();

-- =============================================
-- 17. PROVISION EXISTING SCHOOLS
-- =============================================
DO $$
DECLARE
    v_school RECORD;
    v_trial_plan UUID;
    v_template_role RECORD;
    v_new_role_id UUID;
BEGIN
    SELECT id INTO v_trial_plan FROM subscription_plans WHERE plan_key = 'trial';
    
    FOR v_school IN SELECT id FROM schools
    LOOP
        -- Create subscription if not exists
        INSERT INTO subscriptions (school_id, plan_id, status, trial_ends_at)
        VALUES (v_school.id, v_trial_plan, 'trial', NOW() + INTERVAL '14 days')
        ON CONFLICT (school_id) DO NOTHING;
        
        -- Clone template roles for this school (inline, not trigger)
        FOR v_template_role IN 
            SELECT * FROM roles WHERE school_id IS NULL AND is_system = true
        LOOP
            INSERT INTO roles (school_id, role_key, role_name_ar, role_name_en, is_system)
            VALUES (v_school.id, v_template_role.role_key, v_template_role.role_name_ar, v_template_role.role_name_en, true)
            ON CONFLICT (school_id, role_key) DO NOTHING
            RETURNING id INTO v_new_role_id;
            
            IF v_new_role_id IS NOT NULL THEN
                INSERT INTO role_permissions (role_id, permission_id)
                SELECT v_new_role_id, rp.permission_id
                FROM role_permissions rp
                WHERE rp.role_id = v_template_role.id
                ON CONFLICT DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Force provision features for existing subscriptions
DO $$
DECLARE
    v_sub RECORD;
BEGIN
    FOR v_sub IN SELECT * FROM subscriptions
    LOOP
        DELETE FROM school_features WHERE school_id = v_sub.school_id AND source = 'plan';
        INSERT INTO school_features (school_id, feature_id, is_enabled, source, enabled_by)
        SELECT v_sub.school_id, pf.feature_id, true, 'plan', 'system'
        FROM plan_features pf WHERE pf.plan_id = v_sub.plan_id
        ON CONFLICT (school_id, feature_id) DO UPDATE SET is_enabled = true, source = 'plan', updated_at = NOW();
    END LOOP;
END $$;

SELECT 'Multi-Tenant Platform Infrastructure created successfully!' as status;
