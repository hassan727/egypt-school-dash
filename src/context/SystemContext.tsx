/**
 * SystemContext - السياق المركزي الموحد للنظام
 * Unified System Context for Central Control
 * 
 * هذا السياق يدمج:
 * 1. هوية المدرسة (schoolId, schoolName)
 * 2. السنة الدراسية (academicYear)
 * 3. المستخدم الحالي (من AuthContext)
 * 
 * ويوفر:
 * - حارس (Guard) يمنع الوصول للصفحات بدون تحديد الهوية
 * - واجهة موحدة لكل الإدارات
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

// =============================================
// TYPES - أنواع البيانات
// =============================================

export interface School {
    id: string;
    school_name: string;
    school_code: string;
    settings?: Record<string, any>;
}

export interface SystemIdentity {
    school: School | null;
    academicYear: string;
    isReady: boolean; // هل الهوية جاهزة للعمل؟
}

interface SystemContextType {
    // State
    identity: SystemIdentity;
    schools: School[];
    isLoading: boolean;

    // Actions
    setSchool: (school: School) => void;
    setAcademicYear: (year: string) => void;
    resetIdentity: () => void;

    // Guards
    requireIdentity: () => boolean;
}

// =============================================
// STORAGE KEYS
// =============================================

const STORAGE_KEY = 'system_identity';

const saveIdentity = (identity: Partial<SystemIdentity>): void => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const existing = stored ? JSON.parse(stored) : {};
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...identity }));
    } catch (error) {
        console.error('Failed to save system identity:', error);
    }
};

const loadIdentity = (): Partial<SystemIdentity> | null => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;
        return JSON.parse(stored);
    } catch (error) {
        console.error('Failed to load system identity:', error);
        return null;
    }
};

const clearIdentity = (): void => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear system identity:', error);
    }
};

// =============================================
// CONTEXT
// =============================================

const SystemContext = createContext<SystemContextType | undefined>(undefined);

// =============================================
// PROVIDER
// =============================================

export function SystemProvider({ children }: { children: ReactNode }) {
    const { user, isDemoMode } = useAuth();

    const [schools, setSchools] = useState<School[]>([]);
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const [currentYear, setCurrentYear] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    // Load schools from database
    useEffect(() => {
        const fetchSchools = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('schools')
                    .select('id, school_name, school_code, settings')
                    .order('school_name');

                if (error) throw error;
                setSchools(data || []);

                // Restore saved identity
                const saved = loadIdentity();
                if (saved?.school) {
                    const found = data?.find(s => s.id === saved.school?.id);
                    if (found) setSelectedSchool(found);
                }
                if (saved?.academicYear) {
                    setCurrentYear(saved.academicYear);
                }
            } catch (error) {
                console.error('Error fetching schools:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSchools();
    }, []);

    // Auto-select school from AuthContext if user has one assigned
    useEffect(() => {
        if (user?.schoolId && schools.length > 0 && !selectedSchool) {
            const found = schools.find(s => s.id === user.schoolId);
            if (found) {
                setSelectedSchool(found);
                saveIdentity({ school: found });
            }
        }
    }, [user, schools, selectedSchool]);

    // Actions
    const setSchool = (school: School) => {
        setSelectedSchool(school);
        saveIdentity({ school });
    };

    const setAcademicYear = (year: string) => {
        setCurrentYear(year);
        saveIdentity({ academicYear: year });
    };

    const resetIdentity = () => {
        setSelectedSchool(null);
        setCurrentYear('');
        clearIdentity();
    };

    // Check if identity is ready
    const isReady = Boolean(selectedSchool && currentYear);

    const requireIdentity = (): boolean => {
        return isReady;
    };

    // Context value
    const identity: SystemIdentity = {
        school: selectedSchool,
        academicYear: currentYear,
        isReady,
    };

    const value: SystemContextType = {
        identity,
        schools,
        isLoading,
        setSchool,
        setAcademicYear,
        resetIdentity,
        requireIdentity,
    };

    return (
        <SystemContext.Provider value={value}>
            {children}
        </SystemContext.Provider>
    );
}

// =============================================
// HOOKS
// =============================================

/**
 * Hook للوصول للسياق المركزي
 */
export function useSystem(): SystemContextType {
    const context = useContext(SystemContext);
    if (context === undefined) {
        throw new Error('useSystem must be used within a SystemProvider');
    }
    return context;
}

/**
 * Hook للحصول على معرف المدرسة المحددة
 * سيحل محل useCurrentSchoolId تدريجياً
 */
export function useSystemSchoolId(): string | null {
    const { identity } = useSystem();
    return identity.school?.id || null;
}

/**
 * Hook للحصول على السنة الدراسية المحددة
 */
export function useSystemYear(): string {
    const { identity } = useSystem();
    return identity.academicYear;
}

/**
 * Hook للتحقق من جاهزية الهوية
 */
export function useIdentityReady(): boolean {
    const { identity } = useSystem();
    return identity.isReady;
}

/**
 * Hook للوصول لإعدادات المدرسة الحالية
 */
export function useSchoolSettings() {
    const { identity } = useSystem();
    return identity.school?.settings || {};
}

/**
 * Hook للتحقق من تفعيل ميزة معينة
 */
export function useSchoolFeatures() {
    const settings = useSchoolSettings();
    return settings.features || {
        finance: true,
        hr: true,
        students: true,
        control: true
    };
}

/**
 * Hook للوصول لهوية المدرسة (اللوجو، الهيدر)
 */
export function useSchoolBranding() {
    const settings = useSchoolSettings();
    return settings.branding || {};
}
