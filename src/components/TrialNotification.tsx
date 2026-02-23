import { useSystem } from '@/context/SystemContext';
import { AlertTriangle, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';

export function TrialNotification() {
    const { identity } = useSystem();
    const navigate = useNavigate();
    const [daysLeft, setDaysLeft] = useState<number | null>(null);

    useEffect(() => {
        const isTrial = identity.school?.is_trial || identity.school?.settings?.is_trial;
        if (!identity.isReady || !isTrial) return;

        const endDateStr = identity.school?.trial_ends_at || identity.school?.settings?.trial_ends_at;
        if (endDateStr) {
            const endDate = new Date(endDateStr);
            const now = new Date();
            const diffTime = endDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setDaysLeft(diffDays);
        }
    }, [identity]);

    const isTrial = identity.school?.is_trial || identity.school?.settings?.is_trial;
    if (!identity.isReady || !isTrial || daysLeft === null) {
        return null;
    }

    if (daysLeft <= 0) {
        // Handled by guard usually, but fallback display
        return (
            <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center text-red-700 max-w-[1600px] mx-auto w-full gap-3">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-sm">انتهت الفترة التجريبية</p>
                        <p className="text-xs mt-0.5">يرجى تجديد الاشتراك للاستمرار في استخدام النظام بأمان.</p>
                    </div>
                    <Button variant="destructive" size="sm" className="mr-auto whitespace-nowrap" onClick={() => navigate('/subscription/renew')}>
                        تجديد الاشتراك
                    </Button>
                </div>
            </div>
        );
    }

    if (daysLeft <= 3) {
        return (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center text-amber-700 max-w-[1600px] mx-auto w-full gap-3">
                    <Clock className="h-5 w-5 flex-shrink-0 animate-pulse" />
                    <div>
                        <p className="font-semibold text-sm">
                            {daysLeft === 1 ? 'غداً تنتهي فترتك التجريبية' : `فترتك التجريبية ستنتهي قريباً (متبقي ${daysLeft} أيام)`}
                        </p>
                        <p className="text-xs mt-0.5">بادر بتفعيل اشتراكك لضمان عدم توقف الخدمة عن مدرستك.</p>
                    </div>
                    <Button variant="outline" size="sm" className="mr-auto whitespace-nowrap border-amber-500/50 text-amber-700 hover:bg-amber-50" onClick={() => navigate('/subscription/renew')}>
                        تفعيل الاشتراك
                    </Button>
                </div>
            </div>
        );
    }

    return null; // Don't show anything if > 3 days left unless requested
}
