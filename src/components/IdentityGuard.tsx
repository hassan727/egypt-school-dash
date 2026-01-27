/**
 * IdentityGuard - حارس الهوية
 * يمنع الوصول للصفحات بدون تحديد الهوية من غرفة التحكم
 */

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSystem } from '@/context/SystemContext';
import { Loader2 } from 'lucide-react';

interface IdentityGuardProps {
    children: ReactNode;
}

export function IdentityGuard({ children }: IdentityGuardProps) {
    const { identity, isLoading } = useSystem();
    const location = useLocation();

    // الصفحات المستثناة من الحراسة
    const exemptPaths = [
        '/control-room',
        '/login',
        '/student/login',
        '/student/dashboard',
        '/hr/attendance/mobile', // صفحة تسجيل الحضور للموبايل
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

    // إذا لم يتم تحديد الهوية، وجه لغرفة التحكم
    if (!identity.isReady) {
        return <Navigate to="/control-room" state={{ from: location }} replace />;
    }

    // الهوية جاهزة، اسمح بالمرور
    return <>{children}</>;
}
