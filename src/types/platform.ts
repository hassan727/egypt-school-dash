// =============================================
// Platform Types - Multi-Tenant SaaS System
// =============================================

export interface PlatformOwner {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
    is_active: boolean;
    last_login?: string;
}

export interface Feature {
    id: string;
    feature_key: string;
    feature_name_ar: string;
    feature_name_en?: string;
    description_ar?: string;
    description_en?: string;
    icon?: string;
    category: string;
    is_core: boolean;
    depends_on: string[];
    sort_order: number;
    is_active: boolean;
}

export interface SubscriptionPlan {
    id: string;
    plan_key: string;
    plan_name_ar: string;
    plan_name_en?: string;
    description_ar?: string;
    description_en?: string;
    price_monthly: number;
    price_yearly: number;
    max_students?: number | null;
    max_employees?: number | null;
    max_users?: number | null;
    trial_days: number;
    is_active: boolean;
    sort_order: number;
    features?: Feature[];
}

export interface PlanFeature {
    id: string;
    plan_id: string;
    feature_id: string;
    feature?: Feature;
}

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'suspended' | 'terminated';

export interface Subscription {
    id: string;
    school_id: string;
    plan_id: string;
    status: SubscriptionStatus;
    starts_at: string;
    ends_at?: string;
    trial_ends_at?: string;
    auto_renew: boolean;
    payment_method?: string;
    notes?: string;
    plan?: SubscriptionPlan;
}

export interface SchoolFeature {
    id: string;
    school_id: string;
    feature_id: string;
    is_enabled: boolean;
    source: 'plan' | 'manual' | 'addon';
    enabled_by?: string;
    enabled_at?: string;
    notes?: string;
    feature?: Feature;
}

export interface SchoolWithDetails {
    id: string;
    school_code: string;
    school_name: string;
    school_name_en?: string;
    address?: string;
    city?: string;
    governorate?: string;
    phone?: string;
    email?: string;
    logo_url?: string;
    is_active: boolean;
    settings?: Record<string, any>;
    is_trial?: boolean;
    trial_ends_at?: string;
    status?: string;
    created_at: string;
    subscription?: Subscription;
    features?: SchoolFeature[];
    _studentCount?: number;
    _employeeCount?: number;
}

export interface PlatformStats {
    totalSchools: number;
    activeSchools: number;
    trialSchools: number;
    expiredSchools: number;
    suspendedSchools: number;
    totalStudents: number;
    totalEmployees: number;
    totalFeatures: number;
    totalPlans: number;
}

export interface AuditLogEntry {
    id: string;
    actor_type: 'owner' | 'school_user' | 'system';
    actor_id?: string;
    actor_name?: string;
    action: string;
    target_type?: string;
    target_id?: string;
    target_name?: string;
    details?: Record<string, any>;
    ip_address?: string;
    created_at: string;
}

// =============================================
// Enterprise Dashboard Types
// =============================================

export interface DashboardAnalytics {
    totalRevenue: number;
    monthlyRevenue: number;
    monthlyGrowthRate: number;
    renewalRate: number;
    retentionRate: number;
    customerSatisfaction: number;
    avgRevenuePerSchool: number;
    openTickets: number;
    pendingPayments: number;
}

export interface ExpiringSubscription {
    schoolId: string;
    schoolName: string;
    planName: string;
    status: string;
    expiresAt: string;
    daysRemaining: number;
}

export interface RecentActivityItem {
    id: string;
    action: string;
    actionLabel: string;
    schoolName: string;
    actorName: string;
    createdAt: string;
    status: 'pending' | 'completed' | 'failed';
}

export interface PlatformAlert {
    id: string;
    type: 'warning' | 'info' | 'error' | 'success' | 'announcement';
    title: string;
    message: string;
    priority: number;
    createdAt: string;
    isRead: boolean;
}

export interface SupportTicket {
    id: string;
    schoolName: string;
    subject: string;
    category: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: string;
    createdAt: string;
}

export interface PlatformPayment {
    id: string;
    schoolId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
    invoiceNumber: string;
    dueDate: string;
    paidAt?: string;
}

export interface SchoolGrowthPoint {
    month: string;
    count: number;
}

export interface RevenuePoint {
    month: string;
    revenue: number;
}

export interface SchoolComparisonItem {
    name: string;
    students: number;
    employees: number;
}
