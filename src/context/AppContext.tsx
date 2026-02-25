/**
 * AppContext - السياق المركزي الموحد للتطبيق
 * Unified Central Application Context
 *
 * هذا السياق هو المصدر الوحيد للحقيقة لكل ما يتعلق بـ:
 * 1. المستخدم الحالي (Current User)
 * 2. المدرسة الحالية (Current School)
 * 3. الدور النشط (Current Role)
 * 4. مستوى الوصول (Platform vs School Level)
 */

import { createContext, useContext, ReactNode, useState, useEffect, useMemo } from 'react';
import { useAuth, AuthUser, UserRole } from './AuthContext';
import { useSystem, School } from './SystemContext';
import { supabase } from '@/lib/supabase';

// =============================================
// TYPES
// =============================================

export type AppLevel = 'platform' | 'school';

export interface AppContextType {
    // Identity - الهوية
    user: AuthUser | null;
    school: School | null;
    role: UserRole;
    academicYear: string | null;

    // Context State - حالة السياق
    level: AppLevel;
    isImpersonating: boolean;
    isLoading: boolean;

    // Feature Flags - خصائص المدرسة
    features: Record<string, boolean>;

    // Actions - العمليات
    switchSchool: (school: School | null) => void;
    switchRole: (role: UserRole) => void;
    clearImpersonation: () => void;
    refreshContext: () => Promise<void>;
}

// =============================================
// CONTEXT
// =============================================

const AppContext = createContext<AppContextType | undefined>(undefined);

// =============================================
// PROVIDER
// =============================================

export function AppProvider({ children }: { children: ReactNode }) {
    const { user, session } = useAuth();
    const { identity, setSchool, isLoading: systemLoading } = useSystem();

    const [impersonatedRole, setImpersonatedRole] = useState<UserRole | null>(null);
    const [localFeatures, setLocalFeatures] = useState<Record<string, boolean>>({});

    // 1. Determine Current Role
    // If user is admin (owner) and has selected a role, use it. Otherwise use base role.
    const currentRole = useMemo(() => {
        if (user?.role === 'admin' && impersonatedRole) {
            return impersonatedRole;
        }
        return user?.role || 'demo';
    }, [user, impersonatedRole]);

    // 2. Determine Current School
    // For admin, it's the one selected in SystemContext.
    // For others, it's their assigned school.
    const currentSchool = useMemo(() => {
        // If user is a student, their school is fixed
        if (user?.role === 'student' && user.schoolId && identity.school?.id !== user.schoolId) {
            // Auto-sync student school if not set
            const studentSchool = identity.schools.find(s => s.id === user.schoolId);
            if (studentSchool) {
                // We can't call setSchool here directly as it's a render cycle,
                // but SystemProvider already has an effect for this.
                return studentSchool;
            }
        }

        if (user?.role === 'admin') {
            return identity.school;
        }
        // Fallback to identity school which should match user.schoolId via SystemContext logic
        return identity.school;
    }, [user, identity.school, identity.schools]);

    // 3. Determine Level
    const level: AppLevel = useMemo(() => {
        // Platform level is for admins who haven't selected a school
        // or for pages that don't require a school context.
        if (user?.role === 'admin' && !currentSchool) {
            return 'platform';
        }
        // Students and school staff are always at school level
        return 'school';
    }, [user, currentSchool]);

    // 4. Determine Impersonation Status
    const isImpersonating = useMemo(() => {
        return user?.role === 'admin' && (!!currentSchool || !!impersonatedRole);
    }, [user, currentSchool, impersonatedRole]);

    // 5. Fetch/Sync Feature Flags - Real-time from currentSchool
    useEffect(() => {
        if (currentSchool?.settings?.features) {
            setLocalFeatures(currentSchool.settings.features);
        } else if (level === 'platform') {
            // Platform level has all features enabled by default
            setLocalFeatures({
                finance: true,
                hr: true,
                students: true,
                control: true,
                platform_management: true
            });
        } else {
            // Default school features
            setLocalFeatures({
                finance: true,
                hr: true,
                students: true,
                control: true
            });
        }
    }, [currentSchool, level]);

    // Actions
    const switchSchool = (school: School | null) => {
        if (user?.role !== 'admin') return;
        setSchool(school);
    };

    const switchRole = (role: UserRole) => {
        if (user?.role !== 'admin') return;
        setImpersonatedRole(role);
    };

    const clearImpersonation = () => {
        if (user?.role !== 'admin') return;
        setImpersonatedRole(null);
        setSchool(null);
    };

    const refreshContext = async () => {
        // Force refresh logic if needed
        console.log('Refreshing App Context...');
    };

    const value: AppContextType = {
        user,
        school: currentSchool,
        role: currentRole,
        academicYear: identity.academicYear,
        level,
        isImpersonating,
        isLoading: systemLoading,
        features: localFeatures,
        switchSchool,
        switchRole,
        clearImpersonation,
        refreshContext,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

// =============================================
// HOOK
// =============================================

export function useAppContext(): AppContextType {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
}
