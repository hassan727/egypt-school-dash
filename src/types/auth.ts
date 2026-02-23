/**
 * Auth Types - أنواع بيانات المصادقة والصلاحيات
 * Student Authentication & Multi-Tenant Support
 */

// =============================================
// USER ROLES - الصلاحيات
// =============================================
export type UserRole = 'admin' | 'student';

// =============================================
// SCHOOL - المدرسة
// =============================================
export interface School {
    id: string;
    schoolCode: string;
    schoolName: string;
    schoolNameEn?: string;
    address?: string;
    city?: string;
    governorate?: string;
    phone?: string;
    phoneSecondary?: string;
    email?: string;
    website?: string;
    logoUrl?: string;
    isActive: boolean;
    settings?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

// =============================================
// STUDENT ACCOUNT - حساب الطالب
// =============================================
export interface StudentAccount {
    id: string;
    studentId: string;
    schoolId: string;
    nationalId: string;
    isActive: boolean;
    lastLogin?: string;
    loginCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface StudentAccountWithDetails extends StudentAccount {
    studentName: string;
    schoolName: string;
    stage?: string;
    class?: string;
}

// =============================================
// PARENT - ولي الأمر
// =============================================
export interface Parent {
    id: string;
    schoolId: string;
    fullName: string;
    nationalId?: string;
    phone?: string;
    phoneSecondary?: string;
    whatsapp?: string;
    email?: string;
    job?: string;
    workplace?: string;
    educationLevel?: string;
    address?: string;
    governorate?: string;
    city?: string;
    relationshipType: 'أب' | 'أم' | 'وصي' | 'أخ' | 'أخت' | 'عم' | 'خال' | 'جد' | 'جدة' | string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// =============================================
// STUDENT-PARENT LINK - ربط الطالب بولي الأمر
// =============================================
export interface StudentParentLink {
    id: string;
    studentId: string;
    parentId: string;
    isPrimary: boolean;
    relationship?: string;
    createdAt: string;
}

// =============================================
// AUTHENTICATION - المصادقة
// =============================================
export interface AuthCredentials {
    nationalId: string;
    password: string;
}

export interface AuthResult {
    success: boolean;
    message?: string;
    user?: AuthenticatedUser;
}

export interface AuthenticatedUser {
    studentId: string;
    schoolId: string;
    schoolName: string;
    fullName: string;
    role: UserRole;
    nationalId: string;
}

export interface AuthSession {
    user: AuthenticatedUser;
    token?: string;
    expiresAt?: string;
    createdAt: string;
}

// =============================================
// ACCOUNT STATUS - حالة الحساب
// =============================================
export type AccountStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export interface AccountStatusInfo {
    studentId: string;
    nationalId: string;
    status: AccountStatus;
    lastLogin?: string;
    loginCount: number;
    createdAt: string;
}

// =============================================
// STUDENT SETTINGS PAGE - إعدادات صفحات الطلاب
// =============================================
export interface StudentAccountsFilter {
    search?: string;
    schoolId?: string;
    status?: AccountStatus;
    stage?: string;
    class?: string;
}
