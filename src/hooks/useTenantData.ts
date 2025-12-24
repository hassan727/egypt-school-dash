/**
 * useTenantData - Hook للبيانات المحمية بالـ Tenant
 * Automatically injects school_id in all queries
 * 
 * 🔐 Security: All data access goes through this hook
 */

import { useAuth, useCurrentSchoolId, useIsDemoMode } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

// =============================================
// DEMO DATA - بيانات تجريبية
// =============================================

const DEMO_STUDENTS = [
    { student_id: 'DEMO-001', full_name_ar: 'أحمد محمد (تجريبي)', national_id: '30012345678901', stage: 'المرحلة الابتدائية', class: 'الصف الأول' },
    { student_id: 'DEMO-002', full_name_ar: 'سارة أحمد (تجريبي)', national_id: '30012345678902', stage: 'المرحلة الابتدائية', class: 'الصف الثاني' },
    { student_id: 'DEMO-003', full_name_ar: 'محمود علي (تجريبي)', national_id: '30012345678903', stage: 'المرحلة الإعدادية', class: 'الصف الأول' },
];

const DEMO_SCHOOLS = [
    { id: 'demo-school-1', school_code: 'DEMO', school_name: 'مدرسة تجريبية', is_active: true },
];

// =============================================
// HOOK: useTenantStudents - جلب الطلاب بأمان
// =============================================

export function useTenantStudents() {
    const { isAuthenticated, validateTenantAccess, user } = useAuth();
    const schoolId = useCurrentSchoolId();
    const isDemoMode = useIsDemoMode();

    const fetchStudents = async () => {
        // Demo mode - fetch from DEMO school (real demo data in DB)
        if (isDemoMode && user?.schoolId) {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('school_id', user.schoolId) // Demo school ID
                .order('full_name_ar');

            return { data: data || [], error: error?.message };
        }

        // Demo mode without school - return hardcoded demo
        if (isDemoMode) {
            return { data: DEMO_STUDENTS, error: null };
        }

        // Not authenticated - return empty
        if (!isAuthenticated) {
            return { data: [], error: 'غير مصرح' };
        }

        // Build query with tenant isolation
        let query = supabase
            .from('students')
            .select('*')
            .order('full_name_ar');

        // 🔐 Tenant isolation: Filter by school_id (except admin who sees all)
        if (schoolId) {
            query = query.eq('school_id', schoolId);
        }

        const { data, error } = await query;

        return { data: data || [], error: error?.message };
    };

    const fetchStudentById = async (studentId: string) => {
        // Demo mode
        if (isDemoMode) {
            // 1. Try hardcoded demo data first (for speed/fallback)
            const demo = DEMO_STUDENTS.find(s => s.student_id === studentId);
            if (demo) return { data: demo, error: null };

            // 2. If not found and we have a school ID, try DB
            if (user?.schoolId) {
                const { data, error } = await supabase
                    .from('students')
                    .select('*')
                    .eq('student_id', studentId)
                    .single();

                // Validate it belongs to demo school
                if (data && data.school_id === user.schoolId) {
                    return { data, error: null };
                }
            }

            return { data: null, error: 'الطالب غير موجود' };
        }

        // Not authenticated - return null
        if (!isAuthenticated) {
            return { data: null, error: 'غير مصرح' };
        }

        // Fetch student
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('student_id', studentId)
            .single();

        // 🔐 Tenant validation
        if (data && !validateTenantAccess(data.school_id)) {
            console.warn('Tenant access violation attempted:', { studentId, studentSchool: data.school_id });
            return { data: null, error: 'غير مصرح بالوصول لهذا الطالب' };
        }

        return { data, error: error?.message };
    };

    return { fetchStudents, fetchStudentById };
}

// =============================================
// HOOK: useTenantSchools - جلب المدارس
// =============================================

export function useTenantSchools() {
    const { user, isAuthenticated } = useAuth();
    const isDemoMode = useIsDemoMode();

    const fetchSchools = async () => {
        // Demo mode
        if (isDemoMode) {
            return { data: DEMO_SCHOOLS, error: null };
        }

        if (!isAuthenticated) {
            return { data: [], error: 'غير مصرح' };
        }

        // Only admin can see all schools
        if (user?.role === 'admin') {
            const { data, error } = await supabase
                .from('schools')
                .select('*')
                .eq('is_active', true)
                .order('school_name');

            return { data: data || [], error: error?.message };
        }

        // Others see only their school
        if (user?.schoolId) {
            const { data, error } = await supabase
                .from('schools')
                .select('*')
                .eq('id', user.schoolId)
                .single();

            return { data: data ? [data] : [], error: error?.message };
        }

        return { data: [], error: null };
    };

    return { fetchSchools };
}

// =============================================
// HOOK: useTenantQuery - استعلام عام محمي
// =============================================

export function useTenantQuery<T = any>(tableName: string) {
    const { isAuthenticated, validateTenantAccess, user } = useAuth();
    const schoolId = useCurrentSchoolId();
    const isDemoMode = useIsDemoMode();

    const query = async (options?: {
        select?: string;
        filters?: Record<string, any>;
        order?: { column: string; ascending?: boolean };
        limit?: number;
    }) => {
        // Demo mode: Block ONLY if no demo school assigned (pure UI demo)
        // If they have a schoolId (DB demo mode), we proceed to query but filter strictly by that schoolId
        if (isDemoMode && !user?.schoolId) {
            console.log(`[DEMO MODE] Query to ${tableName} blocked (No school assigned)`);
            return { data: [] as T[], error: null };
        }

        if (!isAuthenticated) {
            return { data: [] as T[], error: 'غير مصرح' };
        }

        let q = supabase
            .from(tableName)
            .select(options?.select || '*');

        // 🔐 Auto-inject tenant filter (except for admin querying all)
        if (schoolId && user?.role !== 'admin') {
            q = q.eq('school_id', schoolId);
        }

        // Apply additional filters
        if (options?.filters) {
            for (const [key, value] of Object.entries(options.filters)) {
                q = q.eq(key, value);
            }
        }

        // Apply ordering
        if (options?.order) {
            q = q.order(options.order.column, { ascending: options.order.ascending ?? true });
        }

        // Apply limit
        if (options?.limit) {
            q = q.limit(options.limit);
        }

        const { data, error } = await q;

        return { data: (data || []) as T[], error: error?.message };
    };

    const getById = async (id: string, idColumn: string = 'id') => {
        // Demo mode: Block only if no school assigned
        if (isDemoMode && !user?.schoolId) {
            return { data: null, error: 'وضع تجريبي' };
        }

        if (!isAuthenticated) {
            return { data: null, error: 'غير مصرح' };
        }

        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq(idColumn, id)
            .single();

        // 🔐 Validate tenant access
        if (data && 'school_id' in data && !validateTenantAccess(data.school_id)) {
            console.warn('Tenant access violation:', { table: tableName, id });
            return { data: null, error: 'غير مصرح بالوصول' };
        }

        return { data: data as T | null, error: error?.message };
    };

    return { query, getById };
}

// =============================================
// UTILITY: Build safe query with tenant filter
// =============================================

export function buildTenantQuery(tableName: string, schoolId: string | null, options?: { select?: string }) {
    let query = supabase.from(tableName).select(options?.select || '*');

    if (schoolId) {
        query = query.eq('school_id', schoolId);
    }

    return query;
}
