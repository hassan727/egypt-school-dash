/**
 * TrialBanner - شريط الفترة التجريبية
 * يظهر دائماً للمدارس التجريبية ويعرض عدد الأيام المتبقية مع رابط للاشتراك
 */

import { useSystem } from '@/context/SystemContext';
import { useAuth } from '@/context/AuthContext';
import { Clock, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';

export function TrialBanner() {
    const { identity } = useSystem();
    const { session } = useAuth();
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

    // Don't show for guests (they have their own banner) or non-trial schools
    if (!identity.isReady || !isTrial || session?.isDemoMode || daysLeft === null) {
        return null;
    }

    // Expired trials are handled by TrialNotification and IdentityGuard
    if (daysLeft <= 0) return null;

    return (
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b border-indigo-200 px-4 py-2">
            <div className="flex items-center justify-between max-w-[1600px] mx-auto text-sm">
                <div className="flex items-center gap-2 text-indigo-700">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">
                        الفترة التجريبية: متبقي <strong className="text-indigo-900">{daysLeft}</strong> {daysLeft === 1 ? 'يوم' : daysLeft <= 10 ? 'أيام' : 'يوماً'}
                    </span>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 text-xs h-7 px-3 whitespace-nowrap gap-1"
                    onClick={() => navigate('/subscription/renew')}
                >
                    <Sparkles className="h-3 w-3" />
                    اشترك الآن
                </Button>
            </div>
        </div>
    );
}
