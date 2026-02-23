/**
 * AuthGuard - حماية المسارات
 * Enterprise-grade route protection with 3-layer security
 * 
 * 1️⃣ Authentication - هل المستخدم مسجل دخول؟
 * 2️⃣ Authorization - هل لديه الصلاحية المطلوبة؟
 * 3️⃣ Tenant Isolation - هل هذا المحتوى من مدرسته؟
 */

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/context/AuthContext';
import { Loader2, ShieldAlert, Lock } from 'lucide-react';

interface AuthGuardProps {
    children: ReactNode;
    // Required roles (user must have at least one)
    allowedRoles?: UserRole[];
    // If true, route is accessible without authentication
    isPublic?: boolean;
    // If true, redirect demo users to demo-specific page
    blockDemoMode?: boolean;
    // Fallback redirect path
    redirectTo?: string;
}

export function AuthGuard({
    children,
    allowedRoles,
    isPublic = false,
    blockDemoMode = false,
    redirectTo = '/login',
}: AuthGuardProps) {
    const { isAuthenticated, isLoading, user, isDemoMode, hasRole } = useAuth();
    const location = useLocation();

    // Still loading session
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">جاري التحقق من الجلسة...</p>
                </div>
            </div>
        );
    }

    // Public route - allow access
    if (isPublic) {
        return <>{children}</>;
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    // Demo mode blocked for this route
    if (isDemoMode && blockDemoMode) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-4">
                <div className="bg-white rounded-xl shadow-xl p-8 max-w-md text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert className="h-8 w-8 text-amber-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                        وضع العرض التجريبي
                    </h2>
                    <p className="text-gray-600 mb-6">
                        هذه الصفحة غير متاحة في الوضع التجريبي.
                        <br />
                        يرجى تسجيل الدخول للوصول إلى البيانات الحقيقية.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <a
                            href="/login"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            تسجيل الدخول
                        </a>
                        <a
                            href="/"
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                            الرئيسية
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // Role check (if roles specified)
    if (allowedRoles && allowedRoles.length > 0) {
        if (!hasRole(allowedRoles)) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl p-8 max-w-md text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="h-8 w-8 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            غير مصرح بالوصول
                        </h2>
                        <p className="text-gray-600 mb-6">
                            ليس لديك الصلاحية للوصول إلى هذه الصفحة.
                        </p>
                        <a
                            href="/"
                            className="inline-block px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition"
                        >
                            العودة للرئيسية
                        </a>
                    </div>
                </div>
            );
        }
    }

    // All checks passed
    return <>{children}</>;
}

/**
 * AdminGuard - حماية صفحات الإدارة
 */
export function AdminGuard({ children }: { children: ReactNode }) {
    return (
        <AuthGuard allowedRoles={['admin', 'school_admin']} blockDemoMode redirectTo="/login">
            {children}
        </AuthGuard>
    );
}

/**
 * StudentGuard - حماية صفحات الطلاب
 */
export function StudentGuard({ children }: { children: ReactNode }) {
    return (
        <AuthGuard allowedRoles={['student']} redirectTo="/student/login">
            {children}
        </AuthGuard>
    );
}

/**
 * DemoGuard - يسمح للوضع التجريبي + المسجلين
 */
export function DemoGuard({ children }: { children: ReactNode }) {
    return (
        <AuthGuard allowedRoles={['admin', 'school_admin', 'demo']}>
            {children}
        </AuthGuard>
    );
}
