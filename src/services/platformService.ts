// =============================================
// Platform Service - Multi-Tenant SaaS API Layer
// =============================================

import { supabase } from '@/lib/supabase';
import type {
    Feature,
    SubscriptionPlan,
    Subscription,
    SchoolFeature,
    SchoolWithDetails,
    PlatformStats,
    AuditLogEntry,
    PlanFeature,
    DashboardAnalytics,
    ExpiringSubscription,
    RecentActivityItem,
    PlatformAlert,
    SchoolComparisonItem,
    SchoolGrowthPoint,
    RevenuePoint,
    PlatformPayment,
    SupportTicket
} from '@/types/platform';

// =============================================
// SCHOOLS
// =============================================

export async function fetchAllSchools(): Promise<SchoolWithDetails[]> {
    const { data: schools, error } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch subscriptions for all schools
    const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*, plan:subscription_plans(*)');

    // Fetch student counts
    const { data: studentCounts } = await supabase
        .from('students')
        .select('school_id')
        .not('school_id', 'is', null);

    // Fetch employee counts
    const { data: employeeCounts } = await supabase
        .from('employees')
        .select('school_id')
        .not('school_id', 'is', null);

    const schoolStudentMap: Record<string, number> = {};
    studentCounts?.forEach((s: any) => {
        schoolStudentMap[s.school_id] = (schoolStudentMap[s.school_id] || 0) + 1;
    });

    const schoolEmployeeMap: Record<string, number> = {};
    employeeCounts?.forEach((e: any) => {
        schoolEmployeeMap[e.school_id] = (schoolEmployeeMap[e.school_id] || 0) + 1;
    });

    return (schools || []).map((school: any) => ({
        ...school,
        subscription: subscriptions?.find((s: any) => s.school_id === school.id),
        _studentCount: schoolStudentMap[school.id] || 0,
        _employeeCount: schoolEmployeeMap[school.id] || 0,
    }));
}

export async function createSchool(data: {
    school_code: string;
    school_name: string;
    school_name_en?: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
    plan_key?: string;
}): Promise<string> {
    const { data: school, error } = await supabase
        .from('schools')
        .insert({
            school_code: data.school_code,
            school_name: data.school_name,
            school_name_en: data.school_name_en,
            address: data.address,
            city: data.city,
            phone: data.phone,
            email: data.email,
            is_active: true,
            settings: {},
        })
        .select('id')
        .single();

    if (error) throw error;

    // Create subscription
    const planKey = data.plan_key || 'trial';
    const { data: plan } = await supabase
        .from('subscription_plans')
        .select('id, trial_days')
        .eq('plan_key', planKey)
        .single();

    if (plan) {
        const trialEnds = planKey === 'trial'
            ? new Date(Date.now() + (plan.trial_days || 14) * 86400000).toISOString()
            : null;

        await supabase.from('subscriptions').insert({
            school_id: school.id,
            plan_id: plan.id,
            status: planKey === 'trial' ? 'trial' : 'active',
            trial_ends_at: trialEnds,
        });
    }

    await logAudit('owner', null, 'مالك المنصة', 'create_school', 'school', school.id, data.school_name);
    return school.id;
}

export async function updateSchoolStatus(schoolId: string, isActive: boolean) {
    const { error } = await supabase
        .from('schools')
        .update({ is_active: isActive })
        .eq('id', schoolId);
    if (error) throw error;
}

// =============================================
// FEATURES
// =============================================

export async function fetchAllFeatures(): Promise<Feature[]> {
    const { data, error } = await supabase
        .from('features')
        .select('*')
        .order('sort_order');
    if (error) throw error;
    return data || [];
}

export async function updateFeature(id: string, updates: Partial<Feature>) {
    const { error } = await supabase.from('features').update(updates).eq('id', id);
    if (error) throw error;
}

export async function createFeature(data: Partial<Feature>) {
    const { error } = await supabase.from('features').insert(data);
    if (error) throw error;
}

// =============================================
// SUBSCRIPTION PLANS
// =============================================

export async function fetchAllPlans(): Promise<SubscriptionPlan[]> {
    const { data: plans, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order');
    if (error) throw error;

    // Fetch plan features
    const { data: planFeatures } = await supabase
        .from('plan_features')
        .select('*, feature:features(*)');

    return (plans || []).map((plan: any) => ({
        ...plan,
        features: (planFeatures || [])
            .filter((pf: any) => pf.plan_id === plan.id)
            .map((pf: any) => pf.feature),
    }));
}

export async function updatePlan(id: string, updates: Partial<SubscriptionPlan>) {
    const { error } = await supabase.from('subscription_plans').update(updates).eq('id', id);
    if (error) throw error;
}

export async function updatePlanFeatures(planId: string, featureIds: string[]) {
    // Remove old
    await supabase.from('plan_features').delete().eq('plan_id', planId);
    // Insert new
    if (featureIds.length > 0) {
        const rows = featureIds.map(fid => ({ plan_id: planId, feature_id: fid }));
        const { error } = await supabase.from('plan_features').insert(rows);
        if (error) throw error;
    }
}

// =============================================
// SUBSCRIPTIONS
// =============================================

export async function fetchSubscription(schoolId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
        .from('subscriptions')
        .select('*, plan:subscription_plans(*)')
        .eq('school_id', schoolId)
        .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
}

export async function updateSubscription(schoolId: string, updates: Partial<Subscription>) {
    const { error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('school_id', schoolId);
    if (error) throw error;
}

export async function changeSchoolPlan(schoolId: string, planId: string) {
    const { error } = await supabase
        .from('subscriptions')
        .update({ plan_id: planId, status: 'active', updated_at: new Date().toISOString() })
        .eq('school_id', schoolId);
    if (error) throw error;
    await logAudit('owner', null, 'مالك المنصة', 'change_plan', 'school', schoolId);
}

// =============================================
// SCHOOL FEATURES
// =============================================

export async function fetchSchoolFeatures(schoolId: string): Promise<SchoolFeature[]> {
    const { data, error } = await supabase
        .from('school_features')
        .select('*, feature:features(*)')
        .eq('school_id', schoolId);
    if (error) throw error;
    return data || [];
}

export async function toggleSchoolFeature(schoolId: string, featureId: string, enabled: boolean) {
    // 1. Get the feature key to update the school's settings JSON
    const { data: featureObj } = await supabase
        .from('features')
        .select('feature_key')
        .eq('id', featureId)
        .single();

    // 2. Update the school_features table
    const { data: existing } = await supabase
        .from('school_features')
        .select('id')
        .eq('school_id', schoolId)
        .eq('feature_id', featureId)
        .single();

    if (existing) {
        await supabase.from('school_features')
            .update({ is_enabled: enabled, source: 'manual', updated_at: new Date().toISOString() })
            .eq('id', existing.id);
    } else {
        await supabase.from('school_features').insert({
            school_id: schoolId,
            feature_id: featureId,
            is_enabled: enabled,
            source: 'manual',
            enabled_by: 'مالك المنصة',
        });
    }

    // 3. Update the ACTUAL school settings JSON so the AppSidebar reacts instantly via Realtime
    if (featureObj && featureObj.feature_key) {
        const { data: school } = await supabase.from('schools').select('settings').eq('id', schoolId).single();
        if (school) {
            const currentSettings = school.settings || {};
            const currentFeatures = currentSettings.features || {
                finance: true, hr: true, students: true, control: true
            };

            await supabase.from('schools').update({
                settings: {
                    ...currentSettings,
                    features: { ...currentFeatures, [featureObj.feature_key]: enabled }
                }
            }).eq('id', schoolId);
        }
    }

    await logAudit('owner', null, 'مالك المنصة', enabled ? 'enable_feature' : 'disable_feature', 'school_feature', featureId);
}

// =============================================
// PLATFORM STATS
// =============================================

export async function fetchPlatformStats(): Promise<PlatformStats> {
    const [schools, subscriptions, students, employees, features, plans] = await Promise.all([
        supabase.from('schools').select('id, is_active'),
        supabase.from('subscriptions').select('status'),
        supabase.from('students').select('id'),
        supabase.from('employees').select('id'),
        supabase.from('features').select('id'),
        supabase.from('subscription_plans').select('id'),
    ]);

    const subs = subscriptions.data || [];
    return {
        totalSchools: schools.data?.length || 0,
        activeSchools: subs.filter((s: any) => s.status === 'active').length,
        trialSchools: subs.filter((s: any) => s.status === 'trial').length,
        expiredSchools: subs.filter((s: any) => s.status === 'expired').length,
        suspendedSchools: subs.filter((s: any) => s.status === 'suspended').length,
        totalStudents: students.data?.length || 0,
        totalEmployees: employees.data?.length || 0,
        totalFeatures: features.data?.length || 0,
        totalPlans: plans.data?.length || 0,
    };
}

// =============================================
// AUDIT LOG
// =============================================

export async function logAudit(
    actorType: 'owner' | 'school_user' | 'system',
    actorId: string | null,
    actorName: string,
    action: string,
    targetType?: string,
    targetId?: string,
    targetName?: string,
    details?: Record<string, any>
) {
    await supabase.from('platform_audit_log').insert({
        actor_type: actorType,
        actor_id: actorId,
        actor_name: actorName,
        action,
        target_type: targetType,
        target_id: targetId,
        target_name: targetName,
        details: details || {},
    });
}

export async function fetchAuditLog(limit = 50): Promise<AuditLogEntry[]> {
    const { data, error } = await supabase
        .from('platform_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) throw error;
    return data || [];
}

// =============================================
// ENTERPRISE DASHBOARD DATA
// =============================================

const ACTION_LABELS: Record<string, string> = {
    create_school: 'تسجيل مدرسة جديدة',
    change_plan: 'تغيير باقة اشتراك',
    enable_feature: 'تفعيل خاصية',
    disable_feature: 'إلغاء تفعيل خاصية',
    update_school: 'تحديث بيانات مدرسة',
    login: 'تسجيل دخول',
    logout: 'تسجيل خروج',
};

export async function fetchDashboardAnalytics(): Promise<DashboardAnalytics> {
    // Query ALL real data from actual database tables
    const [payments, subscriptions, tickets, schools, schoolsPrevMonth] = await Promise.all([
        supabase.from('platform_payments').select('amount, status, paid_at'),
        supabase.from('subscriptions').select('status, plan_id, starts_at, ends_at, created_at'),
        supabase.from('platform_support_tickets').select('status'),
        supabase.from('schools').select('id, created_at'),
        supabase.from('schools').select('id, created_at'),
    ]);

    const payData = payments.data || [];
    const subsData = subscriptions.data || [];
    const ticketData = tickets.data || [];
    const schoolsData = schools.data || [];

    // --- Revenue: from actual platform_payments ---
    const totalRevenue = payData
        .filter((p: any) => p.status === 'paid')
        .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const monthlyRevenue = payData
        .filter((p: any) => p.status === 'paid' && p.paid_at && new Date(p.paid_at) >= thisMonthStart)
        .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

    // --- Growth Rate: computed from actual schools.created_at ---
    const schoolsThisMonth = schoolsData.filter((s: any) =>
        s.created_at && new Date(s.created_at) >= thisMonthStart
    ).length;
    const schoolsLastMonth = schoolsData.filter((s: any) =>
        s.created_at && new Date(s.created_at) >= lastMonthStart && new Date(s.created_at) < thisMonthStart
    ).length;
    const monthlyGrowthRate = schoolsLastMonth > 0
        ? Math.round(((schoolsThisMonth - schoolsLastMonth) / schoolsLastMonth) * 100)
        : schoolsThisMonth > 0 ? 100 : 0;

    // --- Subscriptions: real from subscriptions table ---
    const activeSubs = subsData.filter((s: any) => s.status === 'active').length;
    const trialSubs = subsData.filter((s: any) => s.status === 'trial').length;
    const totalSubs = subsData.length || 1;
    const renewalRate = Math.round((activeSubs / totalSubs) * 100);
    const retentionRate = Math.round(((activeSubs + trialSubs) / totalSubs) * 100);

    // --- Tickets: real from platform_support_tickets ---
    const openTickets = ticketData.filter((t: any) => t.status === 'open' || t.status === 'in_progress').length;
    const resolvedTickets = ticketData.filter((t: any) => t.status === 'resolved' || t.status === 'closed').length;
    const totalTickets = ticketData.length;
    // Customer satisfaction derived from resolved tickets ratio (scale 1-5)
    const customerSatisfaction = totalTickets > 0
        ? Math.round((resolvedTickets / totalTickets) * 5 * 10) / 10
        : 0;

    // --- Payments ---
    const pendingPayments = payData.filter((p: any) => p.status === 'pending').length;

    const schoolCount = schoolsData.length || 1;
    const avgRevenuePerSchool = Math.round(totalRevenue / schoolCount);

    return {
        totalRevenue,
        monthlyRevenue,
        monthlyGrowthRate,
        renewalRate,
        retentionRate,
        customerSatisfaction,
        avgRevenuePerSchool,
        openTickets,
        pendingPayments,
    };
}

// --- School Growth Chart: real data from schools.created_at grouped by month ---
export async function fetchSchoolGrowthData(): Promise<SchoolGrowthPoint[]> {
    const { data: schools } = await supabase
        .from('schools')
        .select('created_at')
        .order('created_at', { ascending: true });

    const MONTH_NAMES = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    const monthMap: Record<string, number> = {};

    // Count schools created each month
    (schools || []).forEach((s: any) => {
        if (!s.created_at) return;
        const d = new Date(s.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
        monthMap[key] = (monthMap[key] || 0) + 1;
    });

    // Build cumulative growth for last 12 months
    const now = new Date();
    const result: SchoolGrowthPoint[] = [];
    let cumulative = 0;

    // Count all schools before our 12-month window
    const windowStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    (schools || []).forEach((s: any) => {
        if (s.created_at && new Date(s.created_at) < windowStart) cumulative++;
    });

    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
        cumulative += (monthMap[key] || 0);
        result.push({
            month: MONTH_NAMES[d.getMonth()],
            count: cumulative,
        });
    }

    return result;
}

// --- Revenue Chart: real data from platform_payments.paid_at grouped by month ---
export async function fetchRevenueData(): Promise<RevenuePoint[]> {
    const { data: payments } = await supabase
        .from('platform_payments')
        .select('amount, status, paid_at')
        .eq('status', 'paid')
        .not('paid_at', 'is', null)
        .order('paid_at', { ascending: true });

    const MONTH_NAMES = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    const monthMap: Record<string, number> = {};

    (payments || []).forEach((p: any) => {
        if (!p.paid_at) return;
        const d = new Date(p.paid_at);
        const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
        monthMap[key] = (monthMap[key] || 0) + Number(p.amount || 0);
    });

    // Show last 6 months
    const now = new Date();
    const result: RevenuePoint[] = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
        result.push({
            month: MONTH_NAMES[d.getMonth()],
            revenue: Math.round(monthMap[key] || 0),
        });
    }

    return result;
}

export async function fetchExpiringSubscriptions(withinDays = 30): Promise<ExpiringSubscription[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + withinDays * 86400000);

    const { data: subs } = await supabase
        .from('subscriptions')
        .select('*, plan:subscription_plans(plan_name_ar)')
        .in('status', ['trial', 'active']);

    const { data: schools } = await supabase.from('schools').select('id, school_name');
    const schoolMap: Record<string, string> = {};
    schools?.forEach((s: any) => { schoolMap[s.id] = s.school_name; });

    const results: ExpiringSubscription[] = [];

    (subs || []).forEach((sub: any) => {
        const endDate = sub.status === 'trial' ? sub.trial_ends_at : sub.ends_at;
        if (!endDate) return;
        const expDate = new Date(endDate);
        if (expDate <= futureDate && expDate >= now) {
            const daysRemaining = Math.ceil((expDate.getTime() - now.getTime()) / 86400000);
            results.push({
                schoolId: sub.school_id,
                schoolName: schoolMap[sub.school_id] || 'غير معروف',
                planName: sub.plan?.plan_name_ar || 'غير محدد',
                status: sub.status,
                expiresAt: endDate,
                daysRemaining,
            });
        }
    });

    return results.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export async function fetchRecentActivity(limit = 10): Promise<RecentActivityItem[]> {
    const { data, error } = await supabase
        .from('platform_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;

    return (data || []).map((entry: any) => ({
        id: entry.id,
        action: entry.action,
        actionLabel: ACTION_LABELS[entry.action] || entry.action,
        schoolName: entry.target_name || 'النظام',
        actorName: entry.actor_name || 'النظام',
        createdAt: entry.created_at,
        status: entry.action.includes('create') ? 'pending' as const
            : entry.action.includes('disable') ? 'failed' as const
                : 'completed' as const,
    }));
}

export async function fetchPlatformAlerts(): Promise<PlatformAlert[]> {
    const { data, error } = await supabase
        .from('platform_notifications')
        .select('*')
        .eq('is_read', false)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.warn('platform_notifications table may not exist yet:', error.message);
        return [];
    }

    return (data || []).map((n: any) => ({
        id: n.id,
        type: n.notification_type,
        title: n.title,
        message: n.message || '',
        priority: n.priority,
        createdAt: n.created_at,
        isRead: n.is_read,
    }));
}

export async function fetchSchoolComparison(): Promise<SchoolComparisonItem[]> {
    const { data: schools } = await supabase.from('schools').select('id, school_name').limit(10);
    const { data: students } = await supabase.from('students').select('school_id').not('school_id', 'is', null);
    const { data: employees } = await supabase.from('employees').select('id, school_id');

    const studentMap: Record<string, number> = {};
    students?.forEach((s: any) => {
        studentMap[s.school_id] = (studentMap[s.school_id] || 0) + 1;
    });

    // Count employees per school if school_id exists
    const empMap: Record<string, number> = {};
    employees?.forEach((e: any) => {
        if (e.school_id) empMap[e.school_id] = (empMap[e.school_id] || 0) + 1;
    });

    return (schools || []).map((school: any) => ({
        name: school.school_name?.substring(0, 20) || 'مدرسة',
        students: studentMap[school.id] || 0,
        employees: empMap[school.id] || 0,
    }));
}

// --- NEW REAL PLATFORM PAGES DATA FETCHERS ---

export async function fetchPlatformPayments(): Promise<PlatformPayment[]> {
    const { data, error } = await supabase
        .from('platform_payments')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((p: any) => ({
        id: p.id,
        schoolId: p.school_id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        invoiceNumber: p.invoice_number,
        dueDate: p.due_date,
        paidAt: p.paid_at
    }));
}

export async function fetchPlatformSupportTickets(): Promise<SupportTicket[]> {
    const { data, error } = await supabase
        .from('platform_support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((t: any) => ({
        id: t.id,
        schoolName: t.school_name || 'غير معروف',
        subject: t.subject,
        category: t.category,
        status: t.status,
        priority: t.priority,
        createdAt: t.created_at
    }));
}

export async function fetchAllPlatformNotifications(): Promise<PlatformAlert[]> {
    const { data, error } = await supabase
        .from('platform_notifications')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((n: any) => ({
        id: n.id,
        type: n.notification_type,
        title: n.title,
        message: n.message || '',
        priority: n.priority,
        createdAt: n.created_at,
        isRead: n.is_read
    }));
}


