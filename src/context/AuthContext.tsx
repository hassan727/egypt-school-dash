/**
 * AuthContext - سياق المصادقة المركزي
 * Enterprise-grade authentication with tenant isolation
 * 
 * الأمان على 3 مستويات:
 * 1. Authentication - هل المستخدم مسجل دخول؟
 * 2. Authorization - هل لديه صلاحية؟
 * 3. Tenant Isolation - هل البيانات من مدرسته؟
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

// =============================================
// TYPES - أنواع المستخدمين والجلسات
// =============================================

export type UserRole = 'admin' | 'school_admin' | 'student' | 'demo';

export interface AuthUser {
    id: string;
    email?: string;
    role: UserRole;
    // Tenant Context - السياق المدرسي
    schoolId: string | null;
    schoolName: string | null;
    schoolCode: string | null;
    // Student-specific
    studentId?: string;
    nationalId?: string;
    fullName: string;
    // Metadata
    lastLogin?: string;
}

export interface AuthSession {
    user: AuthUser;
    isAuthenticated: boolean;
    isDemoMode: boolean;
    expiresAt?: string;
}

interface AuthContextType {
    // State
    session: AuthSession | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isDemoMode: boolean;
    user: AuthUser | null;
    // Current School Context (from session)
    currentSchoolId: string | null;
    // Actions
    loginAsAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    loginAsStudent: (nationalId: string, password: string) => Promise<{ success: boolean; error?: string }>;
    enterDemoMode: () => void;
    logout: () => void;
    // Guards
    hasRole: (roles: UserRole[]) => boolean;
    canAccessSchool: (schoolId: string) => boolean;
    validateTenantAccess: (resourceSchoolId: string | null) => boolean;
}

// =============================================
// DEMO USER - المستخدم التجريبي
// =============================================

const DEMO_USER: AuthUser = {
    id: 'demo-user',
    email: 'demo@example.com',
    role: 'demo',
    schoolId: null, // ❌ لا يوجد مدرسة
    schoolName: null,
    schoolCode: null,
    fullName: 'مستخدم تجريبي',
};

const DEMO_SESSION: AuthSession = {
    user: DEMO_USER,
    isAuthenticated: true,
    isDemoMode: true,
};

// =============================================
// DEV ADMIN - المطور / المالك (وضع التطوير)
// =============================================

const DEV_ADMIN: AuthUser = {
    id: 'dev-admin',
    email: 'owner@system.local',
    role: 'admin',
    schoolId: null, // يرى كل المدارس
    schoolName: 'جميع المدارس',
    schoolCode: null,
    fullName: 'المالك / المطور',
};

const DEV_SESSION: AuthSession = {
    user: DEV_ADMIN,
    isAuthenticated: true,
    isDemoMode: false,
};

// =============================================
// SESSION STORAGE - تخزين الجلسة
// =============================================

const SESSION_KEY = 'auth_session';

const saveSession = (session: AuthSession): void => {
    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (error) {
        console.error('Failed to save session:', error);
    }
};

const loadSession = (): AuthSession | null => {
    try {
        const stored = localStorage.getItem(SESSION_KEY);
        if (!stored) return null;
        return JSON.parse(stored);
    } catch (error) {
        console.error('Failed to load session:', error);
        return null;
    }
};

const clearStoredSession = (): void => {
    try {
        localStorage.removeItem(SESSION_KEY);
    } catch (error) {
        console.error('Failed to clear session:', error);
    }
};

// =============================================
// CONTEXT
// =============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================
// PROVIDER
// =============================================

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<AuthSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Restore session on mount
    useEffect(() => {
        const restored = loadSession();
        const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';

        if (isDev && (!restored || restored.isDemoMode)) {
            // 🔧 DEVELOPMENT MODE: Auto-login as admin if no session or if stuck in demo mode
            // This allows the developer to access all pages without logging in and prevents getting stuck in demo
            console.log('🔧 Development Mode: Auto-login as Admin (Overriding Demo)');
            setSession(DEV_SESSION);
            saveSession(DEV_SESSION);
        } else if (restored) {
            setSession(restored);
        }
        setIsLoading(false);
    }, []);

    // =============================================
    // LOGIN AS ADMIN (Supabase Auth)
    // =============================================
    const loginAsAdmin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return { success: false, error: error.message };
            }

            if (!data.user) {
                return { success: false, error: 'فشل تسجيل الدخول' };
            }

            // Get admin's school (if any)
            // For central admin, schoolId is null (can access all)
            const adminUser: AuthUser = {
                id: data.user.id,
                email: data.user.email,
                role: 'admin',
                schoolId: null, // Central admin
                schoolName: 'جميع المدارس',
                schoolCode: null,
                fullName: 'المدير',
            };

            const newSession: AuthSession = {
                user: adminUser,
                isAuthenticated: true,
                isDemoMode: false,
            };

            setSession(newSession);
            saveSession(newSession);

            return { success: true };
        } catch (error: any) {
            console.error('Admin login error:', error);
            return { success: false, error: 'حدث خطأ غير متوقع' };
        }
    };

    // =============================================
    // LOGIN AS STUDENT (National ID)
    // =============================================
    const loginAsStudent = async (nationalId: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            // Validate input
            if (!nationalId || nationalId.length !== 14) {
                return { success: false, error: 'الرقم القومي يجب أن يتكون من 14 رقم' };
            }

            if (!password || password.length !== 6) {
                return { success: false, error: 'كلمة المرور يجب أن تتكون من 6 أرقام' };
            }

            // Call database function
            const { data, error } = await supabase.rpc('authenticate_student', {
                p_national_id: nationalId,
                p_password: password
            });

            if (error) {
                console.error('Auth error:', error);
                return { success: false, error: 'حدث خطأ في تسجيل الدخول' };
            }

            if (!data || data.length === 0 || !data[0].is_authenticated) {
                return { success: false, error: 'الرقم القومي أو كلمة المرور غير صحيحة' };
            }

            const result = data[0];

            const studentUser: AuthUser = {
                id: result.student_id,
                role: 'student',
                schoolId: result.school_id, // 🔐 Tenant Context
                schoolName: result.school_name,
                schoolCode: null,
                studentId: result.student_id,
                nationalId: nationalId,
                fullName: result.full_name,
                lastLogin: new Date().toISOString(),
            };

            const newSession: AuthSession = {
                user: studentUser,
                isAuthenticated: true,
                isDemoMode: false,
            };

            setSession(newSession);
            saveSession(newSession);

            return { success: true };
        } catch (error: any) {
            console.error('Student login error:', error);
            return { success: false, error: 'حدث خطأ غير متوقع' };
        }
    };

    // =============================================
    // DEMO MODE - يربط المستخدم بمدرسة تجريبية
    // =============================================
    const enterDemoMode = async (): Promise<void> => {
        try {
            // Fetch the demo user from database with their school
            // This ensures we use the Real DB ID (UUID) and the correct school linkage
            const { data: dbUser } = await supabase
                .from('system_users')
                .select(`
                    id, 
                    email, 
                    full_name, 
                    role, 
                    school_id,
                    schools (
                        school_name,
                        school_code
                    )
                `)
                .eq('role', 'demo')
                .limit(1)
                .single();

            if (dbUser) {
                // Found real DB demo user
                const demoUser: AuthUser = {
                    id: dbUser.id,
                    email: dbUser.email || 'demo@school.test',
                    role: 'demo',
                    schoolId: dbUser.school_id,
                    // Use type assertion or check for array/object depending on client version
                    // Usually returns object for single FK
                    schoolName: (dbUser.schools as any)?.school_name || 'مدرسة تجريبية',
                    schoolCode: (dbUser.schools as any)?.school_code || 'DEMO',
                    fullName: dbUser.full_name,
                };

                const demoSession: AuthSession = {
                    user: demoUser,
                    isAuthenticated: true,
                    isDemoMode: true,
                    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 60 minutes
                };

                setSession(demoSession);
                saveSession(demoSession);
                console.log('🎮 Demo Mode: Active using DB user', demoUser.fullName);
                return;
            }

            // Fallback: Try fetching just the school (if user record missing)
            const { data: demoSchool } = await supabase
                .from('schools')
                .select('id, school_name')
                .eq('school_code', 'DEMO')
                .single();

            const fallbackUser: AuthUser = {
                id: 'demo-user', // Legacy fallback ID
                email: 'demo@school.test',
                role: 'demo',
                schoolId: demoSchool?.id || null,
                schoolName: demoSchool?.school_name || 'مدرسة تجريبية',
                schoolCode: 'DEMO',
                fullName: 'مستخدم تجريبي (Fallback)',
            };

            const fallbackSession: AuthSession = {
                user: fallbackUser,
                isAuthenticated: true,
                isDemoMode: true,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 60 minutes
            };

            setSession(fallbackSession);
            saveSession(fallbackSession);

            console.log('🎮 Demo Mode: Active (Fallback)');
        } catch (error) {
            console.error('Failed to enter demo mode:', error);
            // Absolute fallback
            setSession(DEMO_SESSION);
            saveSession(DEMO_SESSION);
        }
    };

    // =============================================
    // LOGOUT
    // =============================================
    const logout = async (): Promise<void> => {
        // Sign out from Supabase (for admin)
        if (session?.user.role === 'admin') {
            await supabase.auth.signOut();
        }
        setSession(null);
        clearStoredSession();
    };

    // =============================================
    // SECURITY GUARDS
    // =============================================

    /**
     * Check if user has required role
     */
    const hasRole = (roles: UserRole[]): boolean => {
        if (!session?.isAuthenticated || !session.user) return false;
        return roles.includes(session.user.role);
    };

    /**
     * Check if user can access a specific school
     * - Admin can access all
     * - Others can only access their assigned school
     */
    /**
     * Check if user can access a specific school
     * - Admin can access all
     * - Others can only access their assigned school
     */
    const canAccessSchool = (schoolId: string): boolean => {
        if (!session?.isAuthenticated || !session.user) return false;

        // Admin can access all schools
        if (session.user.role === 'admin') return true;

        // Demo user: can ONLY access their demo school
        if (session.isDemoMode) {
            return session.user.schoolId === schoolId;
        }

        // Others can only access their school
        return session.user.schoolId === schoolId;
    };

    /**
     * 🔐 CRITICAL: Validate tenant access for any resource
     * - Prevents cross-tenant data access
     * - Called before any data operation
     */
    const validateTenantAccess = (resourceSchoolId: string | null): boolean => {
        // Not authenticated - deny
        if (!session?.isAuthenticated || !session.user) return false;

        // Demo mode: 
        // - Allow access IF resource belongs to the demo school
        // - Deny access if resource belongs to any other school (or null/global)
        if (session.isDemoMode) {
            if (!session.user.schoolId) return false; // Must have a demo school assigned
            return session.user.schoolId === resourceSchoolId;
        }

        // Admin with null schoolId - can access all
        if (session.user.role === 'admin' && session.user.schoolId === null) return true;

        // Resource has no school (unexpected for tenant data) - deny for safety
        if (!resourceSchoolId) return false;

        // Must match current user's school
        return session.user.schoolId === resourceSchoolId;
    };

    // =============================================
    // CONTEXT VALUE
    // =============================================

    const value: AuthContextType = {
        session,
        isLoading,
        isAuthenticated: session?.isAuthenticated ?? false,
        isDemoMode: session?.isDemoMode ?? false,
        user: session?.user ?? null,
        currentSchoolId: session?.user?.schoolId ?? null,
        loginAsAdmin,
        loginAsStudent,
        enterDemoMode,
        logout,
        hasRole,
        canAccessSchool,
        validateTenantAccess,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// =============================================
// HOOK
// =============================================

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// =============================================
// UTILITY: Get current school ID for queries
// =============================================

export function useCurrentSchoolId(): string | null {
    const { currentSchoolId, isDemoMode } = useAuth();
    // Demo mode should never return a real school ID
    if (isDemoMode) return null;
    return currentSchoolId;
}

// =============================================
// UTILITY: Check if in demo mode
// =============================================

export function useIsDemoMode(): boolean {
    const { isDemoMode } = useAuth();
    return isDemoMode;
}
