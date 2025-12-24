/**
 * Receivables Analytics Hook - تحليلات المستحقات الذكية
 * Enterprise-level student receivables analysis and insights
 */

import { useMemo, useCallback } from 'react';

interface StudentReceivable {
    studentId: string;
    studentName: string;
    classId: string;
    className?: string;
    stageName?: string;
    totalFees: number;
    totalPaid: number;
    totalDiscounts: number;
    remaining: number;
    paymentProgress: number;
    status: 'مكتمل' | 'جاري السداد' | 'متأخر' | 'لم يسدد';
    lastPaymentDate?: string;
    guardianPhone?: string;
    installments?: InstallmentInfo[];
}

interface InstallmentInfo {
    id: string;
    installmentNumber: number;
    amount: number;
    dueDate: string;
    paid: boolean;
    paidDate?: string;
    overdueDays?: number;
}

interface StageStats {
    stageName: string;
    totalStudents: number;
    totalFees: number;
    totalCollected: number;
    totalRemaining: number;
    collectionRate: number;
    overdueStudents: number;
}

interface ClassStats {
    classId: string;
    className: string;
    stageName: string;
    totalStudents: number;
    totalFees: number;
    totalCollected: number;
    totalRemaining: number;
    collectionRate: number;
    overdueStudents: number;
}

interface PaymentStatusStats {
    status: string;
    count: number;
    totalAmount: number;
    percentage: number;
    color: string;
}

interface OverdueLevel {
    level: string;
    daysRange: string;
    count: number;
    totalAmount: number;
    color: string;
}

interface CollectionTrend {
    month: string;
    monthName: string;
    collected: number;
    expected: number;
    rate: number;
}

interface ReceivablesAlert {
    id: string;
    type: 'danger' | 'warning' | 'info' | 'success';
    title: string;
    message: string;
    count?: number;
    amount?: number;
    actionLink?: string;
}

export interface ReceivablesAnalytics {
    // Summary
    totalStudents: number;
    totalFees: number;
    totalCollected: number;
    totalRemaining: number;
    collectionRate: number;
    avgPaymentProgress: number;

    // Stage Analysis
    stageStats: StageStats[];

    // Class Analysis
    classStats: ClassStats[];

    // Status Distribution
    paymentStatusStats: PaymentStatusStats[];

    // Overdue Analysis
    overdueLevels: OverdueLevel[];
    totalOverdueStudents: number;
    totalOverdueAmount: number;

    // Collection Trends
    collectionTrends: CollectionTrend[];

    // Installment Analysis
    upcomingInstallments: InstallmentInfo[];
    overdueInstallments: InstallmentInfo[];

    // Alerts
    alerts: ReceivablesAlert[];

    // Rankings
    topDebtors: StudentReceivable[];
    recentPayments: StudentReceivable[];

    // Filters
    getStudentsByStage: (stageName: string) => StudentReceivable[];
    getStudentsByClass: (classId: string) => StudentReceivable[];
    getStudentsByStatus: (status: string) => StudentReceivable[];
    getOverdueStudents: () => StudentReceivable[];
}

interface UseReceivablesAnalyticsProps {
    receivables: StudentReceivable[];
    installments?: any[];
}

const ARABIC_MONTHS: Record<string, string> = {
    '01': 'يناير',
    '02': 'فبراير',
    '03': 'مارس',
    '04': 'أبريل',
    '05': 'مايو',
    '06': 'يونيو',
    '07': 'يوليو',
    '08': 'أغسطس',
    '09': 'سبتمبر',
    '10': 'أكتوبر',
    '11': 'نوفمبر',
    '12': 'ديسمبر',
};

// Deduce stage from class name
function getStageFromClass(classId: string): string {
    if (!classId) return 'غير محدد';
    const cls = classId.toUpperCase();
    if (cls.includes('KG')) return 'رياض الأطفال';
    if (cls.includes('PRE') || cls.includes('إعدادي')) return 'الإعدادية';
    if (cls.startsWith('S') || cls.includes('ثانوي')) return 'الثانوية';
    if (/^[1-6]/.test(cls)) return 'الابتدائية';
    return 'غير محدد';
}

export function useReceivablesAnalytics({
    receivables,
    installments = [],
}: UseReceivablesAnalyticsProps): ReceivablesAnalytics {

    // Enhance receivables with stage info
    const enhancedReceivables = useMemo(() => {
        return receivables.map(r => ({
            ...r,
            stageName: r.stageName || getStageFromClass(r.classId),
            className: r.className || r.classId,
        }));
    }, [receivables]);

    // Summary Statistics
    const summaryStats = useMemo(() => {
        const totalFees = enhancedReceivables.reduce((sum, r) => sum + r.totalFees, 0);
        const totalCollected = enhancedReceivables.reduce((sum, r) => sum + r.totalPaid, 0);
        const totalRemaining = enhancedReceivables.reduce((sum, r) => sum + r.remaining, 0);
        const avgProgress = enhancedReceivables.length > 0
            ? enhancedReceivables.reduce((sum, r) => sum + r.paymentProgress, 0) / enhancedReceivables.length
            : 0;

        return {
            totalStudents: enhancedReceivables.length,
            totalFees,
            totalCollected,
            totalRemaining,
            collectionRate: totalFees > 0 ? (totalCollected / totalFees) * 100 : 0,
            avgPaymentProgress: avgProgress,
        };
    }, [enhancedReceivables]);

    // Stage Statistics
    const stageStats = useMemo(() => {
        const stageMap = new Map<string, StageStats>();

        enhancedReceivables.forEach(r => {
            const stage = r.stageName || 'غير محدد';
            const current = stageMap.get(stage) || {
                stageName: stage,
                totalStudents: 0,
                totalFees: 0,
                totalCollected: 0,
                totalRemaining: 0,
                collectionRate: 0,
                overdueStudents: 0,
            };

            stageMap.set(stage, {
                ...current,
                totalStudents: current.totalStudents + 1,
                totalFees: current.totalFees + r.totalFees,
                totalCollected: current.totalCollected + r.totalPaid,
                totalRemaining: current.totalRemaining + r.remaining,
                overdueStudents: current.overdueStudents + (r.status === 'متأخر' || r.status === 'لم يسدد' ? 1 : 0),
            });
        });

        return Array.from(stageMap.values()).map(s => ({
            ...s,
            collectionRate: s.totalFees > 0 ? (s.totalCollected / s.totalFees) * 100 : 0,
        }));
    }, [enhancedReceivables]);

    // Class Statistics
    const classStats = useMemo(() => {
        const classMap = new Map<string, ClassStats>();

        enhancedReceivables.forEach(r => {
            const classId = r.classId || 'غير محدد';
            const current = classMap.get(classId) || {
                classId,
                className: r.className || classId,
                stageName: r.stageName || 'غير محدد',
                totalStudents: 0,
                totalFees: 0,
                totalCollected: 0,
                totalRemaining: 0,
                collectionRate: 0,
                overdueStudents: 0,
            };

            classMap.set(classId, {
                ...current,
                totalStudents: current.totalStudents + 1,
                totalFees: current.totalFees + r.totalFees,
                totalCollected: current.totalCollected + r.totalPaid,
                totalRemaining: current.totalRemaining + r.remaining,
                overdueStudents: current.overdueStudents + (r.status === 'متأخر' || r.status === 'لم يسدد' ? 1 : 0),
            });
        });

        return Array.from(classMap.values()).map(c => ({
            ...c,
            collectionRate: c.totalFees > 0 ? (c.totalCollected / c.totalFees) * 100 : 0,
        })).sort((a, b) => b.collectionRate - a.collectionRate);
    }, [enhancedReceivables]);

    // Payment Status Distribution
    const paymentStatusStats = useMemo(() => {
        const statusMap = new Map<string, { count: number; totalAmount: number }>();
        const statusColors: Record<string, string> = {
            'مكتمل': '#10B981',
            'جاري السداد': '#3B82F6',
            'متأخر': '#F59E0B',
            'لم يسدد': '#EF4444',
        };

        enhancedReceivables.forEach(r => {
            const current = statusMap.get(r.status) || { count: 0, totalAmount: 0 };
            statusMap.set(r.status, {
                count: current.count + 1,
                totalAmount: current.totalAmount + r.remaining,
            });
        });

        const total = enhancedReceivables.length;
        return Array.from(statusMap.entries()).map(([status, data]) => ({
            status,
            count: data.count,
            totalAmount: data.totalAmount,
            percentage: total > 0 ? (data.count / total) * 100 : 0,
            color: statusColors[status] || '#6B7280',
        }));
    }, [enhancedReceivables]);

    // Overdue Levels (severity analysis)
    const overdueLevels = useMemo(() => {
        const today = new Date();
        const levels: OverdueLevel[] = [
            { level: 'خفيف', daysRange: '1-30 يوم', count: 0, totalAmount: 0, color: '#F59E0B' },
            { level: 'متوسط', daysRange: '31-60 يوم', count: 0, totalAmount: 0, color: '#F97316' },
            { level: 'شديد', daysRange: '61-90 يوم', count: 0, totalAmount: 0, color: '#EF4444' },
            { level: 'حرج', daysRange: 'أكثر من 90 يوم', count: 0, totalAmount: 0, color: '#DC2626' },
        ];

        // Analyze installments for overdue calculation
        installments.forEach(inst => {
            if (inst.paid || !inst.due_date) return;

            const dueDate = new Date(inst.due_date);
            const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff <= 0) return; // Not overdue yet

            const amount = inst.amount || 0;

            if (daysDiff <= 30) {
                levels[0].count++;
                levels[0].totalAmount += amount;
            } else if (daysDiff <= 60) {
                levels[1].count++;
                levels[1].totalAmount += amount;
            } else if (daysDiff <= 90) {
                levels[2].count++;
                levels[2].totalAmount += amount;
            } else {
                levels[3].count++;
                levels[3].totalAmount += amount;
            }
        });

        return levels.filter(l => l.count > 0);
    }, [installments]);

    // Total Overdue Stats
    const overdueStats = useMemo(() => {
        const overdueStudents = enhancedReceivables.filter(r =>
            r.status === 'متأخر' || r.status === 'لم يسدد'
        );
        return {
            totalOverdueStudents: overdueStudents.length,
            totalOverdueAmount: overdueStudents.reduce((sum, r) => sum + r.remaining, 0),
        };
    }, [enhancedReceivables]);

    // Collection Trends (past 6 months)
    const collectionTrends = useMemo(() => {
        // This would ideally come from historical payment data
        // For now, we'll create a placeholder structure
        const trends: CollectionTrend[] = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const month = date.toISOString().slice(0, 7);
            const monthNum = month.split('-')[1];

            trends.push({
                month,
                monthName: ARABIC_MONTHS[monthNum] || month,
                collected: 0, // Would be populated from actual payment history
                expected: summaryStats.totalFees / 12,
                rate: 0,
            });
        }

        return trends;
    }, [summaryStats.totalFees]);

    // Upcoming and Overdue Installments
    const installmentAnalysis = useMemo(() => {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const upcoming: InstallmentInfo[] = [];
        const overdue: InstallmentInfo[] = [];

        installments.forEach(inst => {
            if (inst.paid) return;

            const dueDate = new Date(inst.due_date);
            const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

            const info: InstallmentInfo = {
                id: inst.id,
                installmentNumber: inst.installment_number,
                amount: inst.amount,
                dueDate: inst.due_date,
                paid: inst.paid,
                paidDate: inst.paid_date,
                overdueDays: daysDiff > 0 ? daysDiff : undefined,
            };

            if (daysDiff > 0) {
                overdue.push(info);
            } else if (dueDate <= nextWeek) {
                upcoming.push(info);
            }
        });

        return {
            upcomingInstallments: upcoming.sort((a, b) =>
                new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
            ),
            overdueInstallments: overdue.sort((a, b) =>
                (b.overdueDays || 0) - (a.overdueDays || 0)
            ),
        };
    }, [installments]);

    // Smart Alerts
    const alerts = useMemo(() => {
        const alertsList: ReceivablesAlert[] = [];

        // Critical: High overdue students
        if (overdueStats.totalOverdueStudents > 10) {
            alertsList.push({
                id: 'high-overdue',
                type: 'danger',
                title: 'طلاب متأخرين كثيرون',
                message: `يوجد ${overdueStats.totalOverdueStudents} طالب متأخر في السداد يحتاجون متابعة عاجلة`,
                count: overdueStats.totalOverdueStudents,
                amount: overdueStats.totalOverdueAmount,
                actionLink: '/finance/receivables?filter=overdue',
            });
        }

        // Warning: Low collection rate
        if (summaryStats.collectionRate < 50 && summaryStats.totalStudents > 0) {
            alertsList.push({
                id: 'low-collection',
                type: 'warning',
                title: 'نسبة تحصيل منخفضة',
                message: `نسبة التحصيل الحالية ${summaryStats.collectionRate.toFixed(1)}% فقط`,
                amount: summaryStats.totalRemaining,
            });
        }

        // Info: Upcoming installments
        if (installmentAnalysis.upcomingInstallments.length > 0) {
            alertsList.push({
                id: 'upcoming-installments',
                type: 'info',
                title: 'أقساط قادمة',
                message: `يوجد ${installmentAnalysis.upcomingInstallments.length} قسط مستحق خلال الأسبوع القادم`,
                count: installmentAnalysis.upcomingInstallments.length,
            });
        }

        // Success: High collection rate
        if (summaryStats.collectionRate >= 80) {
            alertsList.push({
                id: 'good-collection',
                type: 'success',
                title: 'نسبة تحصيل ممتازة',
                message: `نسبة التحصيل ${summaryStats.collectionRate.toFixed(1)}% - أداء ممتاز!`,
            });
        }

        return alertsList;
    }, [overdueStats, summaryStats, installmentAnalysis]);

    // Top Debtors (students with highest remaining balance)
    const topDebtors = useMemo(() => {
        return [...enhancedReceivables]
            .filter(r => r.remaining > 0)
            .sort((a, b) => b.remaining - a.remaining)
            .slice(0, 10);
    }, [enhancedReceivables]);

    // Recent Payments (students who recently paid)
    const recentPayments = useMemo(() => {
        return [...enhancedReceivables]
            .filter(r => r.lastPaymentDate)
            .sort((a, b) =>
                new Date(b.lastPaymentDate!).getTime() - new Date(a.lastPaymentDate!).getTime()
            )
            .slice(0, 10);
    }, [enhancedReceivables]);

    // Filter Functions
    const getStudentsByStage = useCallback((stageName: string) => {
        return enhancedReceivables.filter(r => r.stageName === stageName);
    }, [enhancedReceivables]);

    const getStudentsByClass = useCallback((classId: string) => {
        return enhancedReceivables.filter(r => r.classId === classId);
    }, [enhancedReceivables]);

    const getStudentsByStatus = useCallback((status: string) => {
        return enhancedReceivables.filter(r => r.status === status);
    }, [enhancedReceivables]);

    const getOverdueStudents = useCallback(() => {
        return enhancedReceivables.filter(r =>
            r.status === 'متأخر' || r.status === 'لم يسدد'
        );
    }, [enhancedReceivables]);

    return {
        ...summaryStats,
        stageStats,
        classStats,
        paymentStatusStats,
        overdueLevels,
        ...overdueStats,
        collectionTrends,
        ...installmentAnalysis,
        alerts,
        topDebtors,
        recentPayments,
        getStudentsByStage,
        getStudentsByClass,
        getStudentsByStatus,
        getOverdueStudents,
    };
}
