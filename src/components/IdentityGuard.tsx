/**
 * IdentityGuard - حارس الهوية
 * يمنع الوصول للصفحات بدون تحديد الهوية من غرفة التحكم
 */

import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface IdentityGuardProps {
    children: ReactNode;
}

export function IdentityGuard({ children }: IdentityGuardProps) {
    const { school, level, role, isLoading } = useAppContext();
    const { session, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // فحص انتهاء جلسة الضيف
    useEffect(() => {
        if (session?.isDemoMode && session.expiresAt) {
            if (new Date() > new Date(session.expiresAt)) {
                toast.error('انتهت جلسة الضيف (60 دقيقة). يرجى التسجيل للاستمرار.');
                logout();
                navigate('/');
            }
        }
    }, [location.pathname, session, logout, navigate]);

    // الصفحات المستثناة من الحراسة
    const exemptPaths = [
        '/control-room',
        '/login',
        '/student/login',
        '/student/dashboard',
        '/hr/attendance/mobile', // صفحة تسجيل الحضور للموبايل
        '/trial', // صفحة الفترة التجريبية المستثناة
        '/admin-super', // صفحة دخول المطور ولوحة التحكم الخاصة به
        '/subscription/renew', // صفحة تجديد الاشتراك
        '/platform', // لوحة تحكم مالك المنصة
        '/' // البوابة الرئيسية
    ];

    const isExempt = exemptPaths.some(path => location.pathname.startsWith(path));

    // إذا كانت الصفحة مستثناة، اسمح بالمرور
    if (isExempt) {
        return <>{children}</>;
    }

    // إذا كان التحميل جارياً، اعرض شاشة تحميل
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    // إذا لم يتم تحديد الهوية (في مستوى المدرسة)، وجه لغرفة التحكم
    // المالك في مستوى المنصة لا يحتاج لتحديد مدرسة
    if (level === 'school' && !school && !isExempt) {
        return <Navigate to="/control-room" state={{ from: location }} replace />;
    }

    // حماية الصفحات التي تتطلب مدرسة
    const schoolRequiredPaths = [
        '/students',
        '/teachers',
        '/finance',
        '/hr',
        '/classes',
        '/settings/stages-classes'
    ];

    const isSchoolPage = schoolRequiredPaths.some(path => location.pathname.startsWith(path));
    if (isSchoolPage && !school) {
        return <Navigate to="/control-room" state={{ from: location }} replace />;
    }

    // فحص انتهاء الاشتراك أو الفترة التجريبية (فقط لمستوى المدرسة)
    if (school && location.pathname !== '/subscription/renew') {
        const status = school?.status || school?.settings?.status;
        const isTrial = school?.is_trial || school?.settings?.is_trial;
        const endDateStr = school?.trial_ends_at || school?.settings?.trial_ends_at;

        if (status === 'expired' || status === 'suspended') {
            return <Navigate to="/subscription/renew" state={{ from: location }} replace />;
        }

        if (isTrial && endDateStr) {
            const endDate = new Date(endDateStr);
            if (new Date() > endDate) {
                return <Navigate to="/subscription/renew" state={{ from: location }} replace />;
            }
        }
    }

    // الهوية جاهزة، اسمح بالمرور
    return <>{children}</>;
}
