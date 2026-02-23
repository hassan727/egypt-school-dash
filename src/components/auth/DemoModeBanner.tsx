/**
 * DemoModeBanner - شريط الوضع التجريبي
 * Shows a clear indicator when in demo mode
 */

import { AlertTriangle, LogIn, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export function DemoModeBanner() {
    const { isDemoMode, logout } = useAuth();
    const [dismissed, setDismissed] = useState(false);

    if (!isDemoMode || dismissed) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 px-4 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">
                        🎮 أنت في الوضع التجريبي - لا يمكنك رؤية أو تعديل بيانات حقيقية
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <a
                        href="/login"
                        className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition text-sm"
                    >
                        <LogIn className="h-4 w-4" />
                        تسجيل الدخول
                    </a>
                    <button
                        onClick={() => {
                            logout();
                            setDismissed(true);
                        }}
                        className="p-1 hover:bg-white/20 rounded transition"
                        title="إغلاق"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * DemoDataPlaceholder - عنصر بديل للبيانات في الوضع التجريبي
 */
export function DemoDataPlaceholder({
    title = "بيانات تجريبية",
    message = "هذه البيانات للعرض فقط في الوضع التجريبي"
}: {
    title?: string;
    message?: string;
}) {
    return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-dashed border-amber-300 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="font-semibold text-amber-800 mb-1">{title}</h3>
            <p className="text-sm text-amber-700">{message}</p>
        </div>
    );
}
