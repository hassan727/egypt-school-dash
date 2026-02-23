-- =============================================
-- USERS & ROLES MANAGEMENT SYSTEM
-- نظام إدارة المستخدمين والصلاحيات
-- =============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. SYSTEM USERS TABLE - المستخدمون
-- =============================================
CREATE TABLE IF NOT EXISTS system_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Authentication (linked to Supabase Auth)
    auth_user_id UUID UNIQUE, -- Link to auth.users if applicable
    
    -- Basic Info
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    
    -- Role & Access
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    -- Roles: 'system_admin', 'school_admin', 'staff', 'teacher', 'viewer', 'demo'
    
    -- School Context (NULL for system_admin and demo)
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_role CHECK (role IN (
        'system_admin',  -- المالك / الأدمن الأعلى - يرى كل شيء
        'school_admin',  -- مدير مدرسة - يدير مدرسة واحدة
        'staff',         -- موظف شؤون طلاب
        'teacher',       -- معلم
        'viewer',        -- عارض فقط
        'demo'           -- مستخدم تجريبي
    ))
);

-- =============================================
-- 2. ROLES PERMISSIONS TABLE - صلاحيات الأدوار
-- =============================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(50) NOT NULL,
    
    -- Permissions
    can_view_all_schools BOOLEAN DEFAULT false,
    can_manage_schools BOOLEAN DEFAULT false,
    can_manage_users BOOLEAN DEFAULT false,
    can_view_students BOOLEAN DEFAULT true,
    can_manage_students BOOLEAN DEFAULT false,
    can_view_finances BOOLEAN DEFAULT false,
    can_manage_finances BOOLEAN DEFAULT false,
    can_view_reports BOOLEAN DEFAULT true,
    can_export_data BOOLEAN DEFAULT false,
    can_import_data BOOLEAN DEFAULT false,
    can_send_notifications BOOLEAN DEFAULT false,
    
    -- Metadata
    description_ar VARCHAR(255),
    description_en VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(role)
);

-- =============================================
-- 3. SEED DEFAULT ROLES PERMISSIONS
-- =============================================
INSERT INTO role_permissions (role, can_view_all_schools, can_manage_schools, can_manage_users, 
    can_view_students, can_manage_students, can_view_finances, can_manage_finances, 
    can_view_reports, can_export_data, can_import_data, can_send_notifications,
    description_ar, description_en)
VALUES 
    -- System Admin - Full Access
    ('system_admin', true, true, true, true, true, true, true, true, true, true, true,
     'المالك / الأدمن الأعلى - صلاحيات كاملة', 'System Admin - Full Access'),
    
    -- School Admin - Manage One School
    ('school_admin', false, false, true, true, true, true, true, true, true, true, true,
     'مدير المدرسة - إدارة مدرسة واحدة', 'School Admin - Manage One School'),
    
    -- Staff - Student Affairs
    ('staff', false, false, false, true, true, false, false, true, true, true, true,
     'موظف شؤون الطلاب', 'Staff - Student Affairs'),
    
    -- Teacher - View Students
    ('teacher', false, false, false, true, false, false, false, true, false, false, true,
     'معلم - عرض الطلاب', 'Teacher - View Students'),
    
    -- Viewer - Read Only
    ('viewer', false, false, false, true, false, false, false, true, false, false, false,
     'عارض فقط', 'Viewer - Read Only'),
    
    -- Demo - UI Only
    ('demo', false, false, false, false, false, false, false, false, false, false, false,
     'مستخدم تجريبي - عرض الواجهات فقط', 'Demo User - UI Only')
ON CONFLICT (role) DO UPDATE SET
    can_view_all_schools = EXCLUDED.can_view_all_schools,
    can_manage_schools = EXCLUDED.can_manage_schools,
    can_manage_users = EXCLUDED.can_manage_users,
    can_view_students = EXCLUDED.can_view_students,
    can_manage_students = EXCLUDED.can_manage_students,
    can_view_finances = EXCLUDED.can_view_finances,
    can_manage_finances = EXCLUDED.can_manage_finances,
    can_view_reports = EXCLUDED.can_view_reports,
    can_export_data = EXCLUDED.can_export_data,
    can_import_data = EXCLUDED.can_import_data,
    can_send_notifications = EXCLUDED.can_send_notifications,
    description_ar = EXCLUDED.description_ar,
    description_en = EXCLUDED.description_en;

-- =============================================
-- 4. CREATE DEFAULT SYSTEM ADMIN
-- =============================================
INSERT INTO system_users (full_name, email, role, is_active)
VALUES ('المدير الأعلى', 'admin@system.local', 'system_admin', true)
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- 5. CREATE DEFAULT DEMO USER
-- =============================================
INSERT INTO system_users (full_name, email, role, school_id, is_active)
VALUES ('مستخدم تجريبي', 'demo@system.local', 'demo', NULL, true)
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- 6. FUNCTION: Get User Permissions
-- =============================================
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    role VARCHAR(50),
    school_id UUID,
    can_view_all_schools BOOLEAN,
    can_manage_schools BOOLEAN,
    can_manage_users BOOLEAN,
    can_view_students BOOLEAN,
    can_manage_students BOOLEAN,
    can_view_finances BOOLEAN,
    can_manage_finances BOOLEAN,
    can_view_reports BOOLEAN,
    can_export_data BOOLEAN,
    can_import_data BOOLEAN,
    can_send_notifications BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.role,
        u.school_id,
        rp.can_view_all_schools,
        rp.can_manage_schools,
        rp.can_manage_users,
        rp.can_view_students,
        rp.can_manage_students,
        rp.can_view_finances,
        rp.can_manage_finances,
        rp.can_view_reports,
        rp.can_export_data,
        rp.can_import_data,
        rp.can_send_notifications
    FROM system_users u
    JOIN role_permissions rp ON u.role = rp.role
    WHERE u.id = p_user_id AND u.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 7. FUNCTION: Authenticate System User
-- =============================================
CREATE OR REPLACE FUNCTION authenticate_system_user(
    p_email VARCHAR(255),
    p_password VARCHAR(255)  -- For demo, we skip password check
)
RETURNS TABLE (
    is_authenticated BOOLEAN,
    user_id UUID,
    full_name VARCHAR(255),
    role VARCHAR(50),
    school_id UUID,
    school_name VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        true as is_authenticated,
        u.id as user_id,
        u.full_name,
        u.role,
        u.school_id,
        s.school_name
    FROM system_users u
    LEFT JOIN schools s ON u.school_id = s.id
    WHERE u.email = p_email 
      AND u.is_active = true;
    
    -- Update last login
    UPDATE system_users 
    SET last_login = NOW(), login_count = login_count + 1
    WHERE email = p_email;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 8. TRIGGERS
-- =============================================
DROP TRIGGER IF EXISTS update_system_users_updated_at ON system_users;
CREATE TRIGGER update_system_users_updated_at
    BEFORE UPDATE ON system_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 9. INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_system_users_role ON system_users(role);
CREATE INDEX IF NOT EXISTS idx_system_users_school ON system_users(school_id);
CREATE INDEX IF NOT EXISTS idx_system_users_email ON system_users(email);

-- =============================================
-- 10. RLS (Row Level Security) - Disabled for now
-- =============================================
ALTER TABLE system_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions DISABLE ROW LEVEL SECURITY;
