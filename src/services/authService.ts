/**
 * Auth Service - خدمة مصادقة الطلاب
 * Smart Student Authentication with Auto Account Creation
 */

import { supabase } from '@/lib/supabase';
import type {
    AuthCredentials,
    AuthResult,
    AuthenticatedUser,
    StudentAccount,
    StudentAccountWithDetails,
    AccountStatusInfo,
    School
} from '@/types/auth';

// =============================================
// PASSWORD GENERATION - توليد كلمة المرور
// =============================================

/**
 * Generate password from national ID (last 6 digits)
 * توليد كلمة المرور من آخر 6 أرقام من الرقم القومي
 */
export const generatePasswordFromNationalId = (nationalId: string): string => {
    if (!nationalId || nationalId.length < 6) {
        throw new Error('الرقم القومي غير صالح');
    }
    return nationalId.slice(-6);
};

/**
 * Validate national ID format (14 digits)
 * التحقق من صيغة الرقم القومي
 */
export const validateNationalId = (nationalId: string): boolean => {
    return /^\d{14}$/.test(nationalId);
};

// =============================================
// AUTHENTICATION - المصادقة
// =============================================

/**
 * Authenticate student using national ID and password
 * تسجيل دخول الطالب
 */
export const authenticateStudent = async (
    credentials: AuthCredentials
): Promise<AuthResult> => {
    try {
        const { nationalId, password } = credentials;

        // Validate input
        if (!nationalId || !password) {
            return {
                success: false,
                message: 'يرجى إدخال الرقم القومي وكلمة المرور'
            };
        }

        // Validate national ID format
        if (!validateNationalId(nationalId)) {
            return {
                success: false,
                message: 'الرقم القومي يجب أن يتكون من 14 رقم'
            };
        }

        // Call database function for authentication
        const { data, error } = await supabase
            .rpc('authenticate_student', {
                p_national_id: nationalId,
                p_password: password
            });

        if (error) {
            console.error('Auth error:', error);
            return {
                success: false,
                message: 'حدث خطأ في عملية تسجيل الدخول'
            };
        }

        // Check the result
        if (data && data.length > 0 && data[0].is_authenticated) {
            const result = data[0];
            const user: AuthenticatedUser = {
                studentId: result.student_id,
                schoolId: result.school_id,
                schoolName: result.school_name,
                fullName: result.full_name,
                role: 'student',
                nationalId: nationalId
            };

            // Store session in localStorage
            saveSession(user);

            return {
                success: true,
                user
            };
        }

        return {
            success: false,
            message: 'الرقم القومي أو كلمة المرور غير صحيحة'
        };
    } catch (error) {
        console.error('Authentication error:', error);
        return {
            success: false,
            message: 'حدث خطأ غير متوقع'
        };
    }
};

// =============================================
// SESSION MANAGEMENT - إدارة الجلسة
// =============================================

const SESSION_KEY = 'student_session';

/**
 * Save session to localStorage
 */
export const saveSession = (user: AuthenticatedUser): void => {
    const session = {
        user,
        createdAt: new Date().toISOString()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

/**
 * Get current session
 */
export const getSession = (): AuthenticatedUser | null => {
    try {
        const sessionStr = localStorage.getItem(SESSION_KEY);
        if (!sessionStr) return null;

        const session = JSON.parse(sessionStr);
        return session.user || null;
    } catch {
        return null;
    }
};

/**
 * Clear session (logout)
 */
export const clearSession = (): void => {
    localStorage.removeItem(SESSION_KEY);
};

/**
 * Check if student is authenticated
 */
export const isAuthenticated = (): boolean => {
    return getSession() !== null;
};

// =============================================
// ACCOUNT MANAGEMENT - إدارة الحسابات
// =============================================

/**
 * Get all student accounts (for admin)
 * جلب جميع حسابات الطلاب
 */
export const getStudentAccounts = async (
    schoolId?: string
): Promise<StudentAccountWithDetails[]> => {
    try {
        let query = supabase
            .from('student_accounts')
            .select(`
                *,
                students!inner(
                    full_name_ar,
                    stage,
                    class
                ),
                schools!inner(
                    school_name
                )
            `)
            .order('created_at', { ascending: false });

        if (schoolId) {
            query = query.eq('school_id', schoolId);
        }

        const { data, error } = await query;

        if (error) throw error;

        return (data || []).map((account: any) => ({
            id: account.id,
            studentId: account.student_id,
            schoolId: account.school_id,
            nationalId: account.national_id,
            isActive: account.is_active,
            lastLogin: account.last_login,
            loginCount: account.login_count || 0,
            createdAt: account.created_at,
            updatedAt: account.updated_at,
            studentName: account.students?.full_name_ar || '',
            schoolName: account.schools?.school_name || '',
            stage: account.students?.stage,
            class: account.students?.class
        }));
    } catch (error) {
        console.error('Error fetching student accounts:', error);
        return [];
    }
};

/**
 * Get account status by student ID
 */
export const getAccountStatus = async (
    studentId: string
): Promise<AccountStatusInfo | null> => {
    try {
        const { data, error } = await supabase
            .from('student_accounts')
            .select('*')
            .eq('student_id', studentId)
            .single();

        if (error || !data) return null;

        return {
            studentId: data.student_id,
            nationalId: data.national_id,
            status: data.is_active ? 'active' : 'inactive',
            lastLogin: data.last_login,
            loginCount: data.login_count || 0,
            createdAt: data.created_at
        };
    } catch (error) {
        console.error('Error fetching account status:', error);
        return null;
    }
};

/**
 * Toggle account active status
 */
export const toggleAccountStatus = async (
    studentId: string,
    isActive: boolean
): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('student_accounts')
            .update({ is_active: isActive })
            .eq('student_id', studentId);

        return !error;
    } catch (error) {
        console.error('Error toggling account status:', error);
        return false;
    }
};

/**
 * Check if national ID exists in system
 */
export const checkNationalIdExists = async (
    nationalId: string,
    excludeStudentId?: string
): Promise<boolean> => {
    try {
        let query = supabase
            .from('student_accounts')
            .select('id')
            .eq('national_id', nationalId);

        if (excludeStudentId) {
            query = query.neq('student_id', excludeStudentId);
        }

        const { data, error } = await query;

        if (error) throw error;

        return (data?.length || 0) > 0;
    } catch (error) {
        console.error('Error checking national ID:', error);
        return false;
    }
};

// =============================================
// SCHOOLS - المدارس
// =============================================

/**
 * Get all schools
 */
export const getSchools = async (): Promise<School[]> => {
    try {
        const { data, error } = await supabase
            .from('schools')
            .select('*')
            .eq('is_active', true)
            .order('school_name');

        if (error) throw error;

        return (data || []).map((school: any) => ({
            id: school.id,
            schoolCode: school.school_code,
            schoolName: school.school_name,
            schoolNameEn: school.school_name_en,
            address: school.address,
            city: school.city,
            governorate: school.governorate,
            phone: school.phone,
            phoneSecondary: school.phone_secondary,
            email: school.email,
            website: school.website,
            logoUrl: school.logo_url,
            isActive: school.is_active,
            settings: school.settings,
            createdAt: school.created_at,
            updatedAt: school.updated_at
        }));
    } catch (error) {
        console.error('Error fetching schools:', error);
        return [];
    }
};

/**
 * Get default school ID
 */
export const getDefaultSchoolId = async (): Promise<string | null> => {
    try {
        const { data, error } = await supabase
            .from('schools')
            .select('id')
            .eq('school_code', 'DEFAULT')
            .single();

        if (error) throw error;

        return data?.id || null;
    } catch (error) {
        console.error('Error fetching default school:', error);
        return null;
    }
};
