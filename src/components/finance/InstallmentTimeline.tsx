/**
 * Installment Timeline Component - خط زمني للأقساط
 * Visual timeline for tracking installment payments
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
    CheckCircle2,
    Clock,
    AlertTriangle,
    AlertCircle,
    Calendar,
    DollarSign,
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Installment {
    id: string;
    installmentNumber: number;
    amount: number;
    dueDate: string;
    paid: boolean;
    paidDate?: string;
}

interface InstallmentTimelineProps {
    installments: Installment[];
    onPayClick?: (installment: Installment) => void;
    compact?: boolean;
    showActions?: boolean;
}

export function InstallmentTimeline({
    installments,
    onPayClick,
    compact = false,
    showActions = true,
}: InstallmentTimelineProps) {
    const today = new Date();

    // Sort installments by number
    const sortedInstallments = useMemo(() => {
        return [...installments].sort((a, b) => a.installmentNumber - b.installmentNumber);
    }, [installments]);

    // Calculate status for each installment
    const getInstallmentStatus = (inst: Installment): {
        status: 'paid' | 'due-soon' | 'overdue' | 'upcoming';
        color: string;
        bgColor: string;
        borderColor: string;
        icon: React.ReactNode;
        label: string;
        daysText?: string;
    } => {
        if (inst.paid) {
            return {
                status: 'paid',
                color: 'text-green-600',
                bgColor: 'bg-green-100',
                borderColor: 'border-green-500',
                icon: <CheckCircle2 className="h-4 w-4" />,
                label: 'تم الدفع',
            };
        }

        const dueDate = new Date(inst.dueDate);
        const daysDiff = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff < 0) {
            const overdueDays = Math.abs(daysDiff);
            return {
                status: 'overdue',
                color: 'text-red-600',
                bgColor: 'bg-red-100',
                borderColor: 'border-red-500',
                icon: <AlertCircle className="h-4 w-4" />,
                label: 'متأخر',
                daysText: `متأخر ${overdueDays} يوم`,
            };
        }

        if (daysDiff <= 7) {
            return {
                status: 'due-soon',
                color: 'text-orange-600',
                bgColor: 'bg-orange-100',
                borderColor: 'border-orange-500',
                icon: <AlertTriangle className="h-4 w-4" />,
                label: 'مستحق قريباً',
                daysText: daysDiff === 0 ? 'اليوم' : `بعد ${daysDiff} أيام`,
            };
        }

        return {
            status: 'upcoming',
            color: 'text-gray-500',
            bgColor: 'bg-gray-100',
            borderColor: 'border-gray-300',
            icon: <Clock className="h-4 w-4" />,
            label: 'قادم',
            daysText: `بعد ${daysDiff} يوم`,
        };
    };

    // Stats
    const stats = useMemo(() => {
        const paid = sortedInstallments.filter(i => i.paid);
        const overdue = sortedInstallments.filter(i => {
            if (i.paid) return false;
            return new Date(i.dueDate) < today;
        });
        const totalPaid = paid.reduce((sum, i) => sum + i.amount, 0);
        const totalRemaining = sortedInstallments
            .filter(i => !i.paid)
            .reduce((sum, i) => sum + i.amount, 0);

        return {
            total: sortedInstallments.length,
            paid: paid.length,
            overdue: overdue.length,
            totalPaid,
            totalRemaining,
            progress: sortedInstallments.length > 0
                ? (paid.length / sortedInstallments.length) * 100
                : 0,
        };
    }, [sortedInstallments, today]);

    if (sortedInstallments.length === 0) {
        return (
            <div className="text-center py-6 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>لا توجد أقساط</p>
            </div>
        );
    }

    if (compact) {
        // Compact horizontal timeline
        return (
            <div className="space-y-3">
                {/* Progress Bar */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">التقدم</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 transition-all duration-500"
                            style={{ width: `${stats.progress}%` }}
                        />
                    </div>
                    <span className="text-xs font-medium">{stats.paid}/{stats.total}</span>
                </div>

                {/* Compact Timeline */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    <TooltipProvider>
                        {sortedInstallments.map((inst, idx) => {
                            const statusInfo = getInstallmentStatus(inst);
                            return (
                                <Tooltip key={inst.id}>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={cn(
                                                'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all',
                                                statusInfo.bgColor,
                                                statusInfo.color,
                                                'hover:scale-110'
                                            )}
                                        >
                                            {inst.paid ? statusInfo.icon : inst.installmentNumber}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <div className="text-center">
                                            <p className="font-medium">القسط {inst.installmentNumber}</p>
                                            <p>{inst.amount.toLocaleString()} ج.م</p>
                                            <p className="text-xs">{inst.dueDate}</p>
                                            <Badge className={cn('mt-1', statusInfo.bgColor, statusInfo.color)}>
                                                {statusInfo.label}
                                            </Badge>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </TooltipProvider>
                </div>
            </div>
        );
    }

    // Full Timeline View
    return (
        <div className="space-y-4">
            {/* Stats Header */}
            <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-2 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">الإجمالي</p>
                    <p className="font-bold">{stats.total}</p>
                </div>
                <div className="p-2 rounded-lg bg-green-50">
                    <p className="text-xs text-green-600">مدفوع</p>
                    <p className="font-bold text-green-700">{stats.paid}</p>
                </div>
                <div className="p-2 rounded-lg bg-red-50">
                    <p className="text-xs text-red-600">متأخر</p>
                    <p className="font-bold text-red-700">{stats.overdue}</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-50">
                    <p className="text-xs text-blue-600">المتبقي</p>
                    <p className="font-bold text-blue-700">{stats.totalRemaining.toLocaleString()}</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                    <span>تقدم السداد</span>
                    <span>{Math.round(stats.progress)}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                        style={{ width: `${stats.progress}%` }}
                    />
                </div>
            </div>

            {/* Timeline */}
            <div className="relative">
                {/* Timeline Line */}
                <div className="absolute right-6 top-4 bottom-4 w-0.5 bg-gray-200" />

                {/* Timeline Items */}
                <div className="space-y-4">
                    {sortedInstallments.map((inst, idx) => {
                        const statusInfo = getInstallmentStatus(inst);
                        return (
                            <div
                                key={inst.id}
                                className={cn(
                                    'relative flex items-start gap-4 p-3 rounded-lg border-2 transition-all',
                                    statusInfo.borderColor,
                                    statusInfo.bgColor,
                                    'hover:shadow-md'
                                )}
                            >
                                {/* Timeline Node */}
                                <div
                                    className={cn(
                                        'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center z-10',
                                        'bg-white',
                                        statusInfo.color
                                    )}
                                >
                                    {statusInfo.icon}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">
                                                القسط {inst.installmentNumber}
                                            </p>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Calendar className="h-3 w-3" />
                                                <span>{inst.dueDate}</span>
                                                {statusInfo.daysText && (
                                                    <Badge
                                                        variant="secondary"
                                                        className={cn('text-xs', statusInfo.bgColor, statusInfo.color)}
                                                    >
                                                        {statusInfo.daysText}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <p className={cn('font-bold text-lg', statusInfo.color)}>
                                                {inst.amount.toLocaleString()} ج.م
                                            </p>
                                            {inst.paid && inst.paidDate && (
                                                <p className="text-xs text-gray-500">
                                                    دفع في: {inst.paidDate}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {showActions && !inst.paid && onPayClick && (
                                        <div className="mt-2">
                                            <Button
                                                size="sm"
                                                onClick={() => onPayClick(inst)}
                                                className={cn(
                                                    statusInfo.status === 'overdue'
                                                        ? 'bg-red-600 hover:bg-red-700'
                                                        : statusInfo.status === 'due-soon'
                                                            ? 'bg-orange-600 hover:bg-orange-700'
                                                            : 'bg-blue-600 hover:bg-blue-700'
                                                )}
                                            >
                                                <DollarSign className="h-4 w-4 ml-1" />
                                                تسجيل دفعة
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default InstallmentTimeline;
