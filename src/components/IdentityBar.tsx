/**
 * IdentityBar - شريط الهوية العلوي
 * يعرض المدرسة والسنة الدراسية المحددة في غرفة التحكم
 */

import { useNavigate } from 'react-router-dom';
import { useSystem } from '@/context/SystemContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Building2, Calendar, Settings2 } from 'lucide-react';

export function IdentityBar() {
    const navigate = useNavigate();
    const { identity } = useSystem();
    const { user } = useAuth();

    // لا تظهر الشريط إذا لم يتم تحديد الهوية
    if (!identity.isReady) return null;

    return (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 shadow-md sticky top-0 z-20">
            <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-2 md:gap-4 text-xs md:text-sm">
                {/* Identity Info */}
                <div className="flex items-center gap-2 md:gap-4 lg:gap-6 flex-wrap">
                    {/* School */}
                    <div className="flex items-center gap-1 md:gap-2">
                        <Building2 className="h-3 w-3 md:h-4 md:w-4 text-white/70 hidden sm:block" />
                        <span className="font-medium truncate max-w-[80px] sm:max-w-[120px] md:max-w-none">
                            {identity.school?.school_name}
                        </span>
                    </div>

                    {/* Separator */}
                    <div className="h-3 md:h-4 w-px bg-white/30 hidden sm:block" />

                    {/* Academic Year */}
                    <div className="flex items-center gap-1 md:gap-2">
                        <Calendar className="h-3 w-3 md:h-4 md:w-4 text-white/70 hidden sm:block" />
                        <span className="font-medium whitespace-nowrap">{identity.academicYear}</span>
                    </div>

                    {/* Separator */}
                    <div className="h-3 md:h-4 w-px bg-white/30 hidden md:block" />

                    {/* User - Hidden on mobile */}
                    <div className="hidden md:flex items-center gap-2">
                        <span className="text-white/70">👤</span>
                        <span className="font-medium truncate max-w-[100px] lg:max-w-none">
                            {user?.fullName || 'المطور'}
                        </span>
                    </div>
                </div>

                {/* Settings Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/control-room')}
                    className="text-white hover:bg-white/20 hover:text-white text-xs md:text-sm h-7 md:h-8 px-2 md:px-3 whitespace-nowrap flex-shrink-0"
                >
                    <Settings2 className="h-3 w-3 md:h-4 md:w-4 ml-1" />
                    <span className="hidden sm:inline">تغيير الإعدادات</span>
                    <span className="sm:hidden">إعدادات</span>
                </Button>
            </div>
        </div>
    );
}
