
import { useMemo } from 'react';
import {
    Salary,
    FinancialSummary,
    GeneralTransaction
} from '@/types/finance';

export interface SmartAlert {
    id: string;
    type: 'danger' | 'warning' | 'info' | 'success';
    category: 'installments' | 'students' | 'salaries' | 'expenses' | 'budget';
    title: string;
    message: string;
    count?: number;
    amount?: number;
    actionLink?: string;
    actionLabel?: string;
    priority: number; // 1-10 (higher = more urgent)
    createdAt: Date;
}

interface UseSmartAlertsProps {
    salaries: Salary[];
    summary: FinancialSummary | null;
    schoolFees: any[];
    installments: any[];
    transactions: GeneralTransaction[];
    studentPayments?: any[]; // Added this new prop
}

export function useSmartAlerts({
    salaries,
    summary,
    schoolFees,
    installments,
    transactions,
    studentPayments = []
}: UseSmartAlertsProps) {

    const alerts = useMemo(() => {
        const newAlerts: SmartAlert[] = [];
        const today = new Date();

        // 1. Installment Alerts
        const overdueInstallments = installments.filter(inst => {
            if (inst.paid) return false;
            const dueDate = new Date(inst.due_date);
            return dueDate < today;
        });

        const highRiskInstallments = overdueInstallments.filter(inst => {
            const dueDate = new Date(inst.due_date);
            const diffTime = Math.abs(today.getTime() - dueDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays > 30;
        });

        const upcomingInstallments = installments.filter(inst => {
            if (inst.paid) return false;
            const dueDate = new Date(inst.due_date);
            const diffTime = dueDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 7;
        });

        if (highRiskInstallments.length > 0) {
            newAlerts.push({
                id: 'inst-high-risk',
                type: 'danger',
                category: 'installments',
                title: 'أقساط عالية المخاطر',
                message: `يوجد ${highRiskInstallments.length} قسط متأخر لأكثر من 30 يوم`,
                count: highRiskInstallments.length,
                priority: 10,
                createdAt: today,
                actionLink: '/finance/receivables',
                actionLabel: 'عرض المتأخرات'
            });
        }

        if (overdueInstallments.length > 0 && highRiskInstallments.length === 0) {
            newAlerts.push({
                id: 'inst-overdue',
                type: 'warning',
                category: 'installments',
                title: 'أقساط متأخرة',
                message: `يوجد ${overdueInstallments.length} قسط مستحق الدفع وتجاوز الموعد`,
                count: overdueInstallments.length,
                priority: 8,
                createdAt: today,
                actionLink: '/finance/receivables',
                actionLabel: 'متابعة التحصيل'
            });
        }

        if (upcomingInstallments.length > 0) {
            newAlerts.push({
                id: 'inst-upcoming',
                type: 'info',
                category: 'installments',
                title: 'أقساط مستحقة قريباً',
                message: `يوجد ${upcomingInstallments.length} قسط مستحق خلال 7 أيام`,
                count: upcomingInstallments.length,
                priority: 5,
                createdAt: today
            });
        }

        // 2. Student Alerts
        // Check for students with NO payments (advance or otherwise)
        const studentsWithoutPayment = schoolFees?.filter(fee => {
            const paidAmount = studentPayments.filter(p => p.student_id === fee.student_id)
                .reduce((sum, p) => sum + (p.amount || 0), 0);
            // Verify if total paid (advance + transactions) is 0
            // Note: 'advance_payment' in schoolFees is usually what they paid initially.
            // If advance_payment is 0 and no other transactions found?
            return (fee.advance_payment || 0) + paidAmount === 0 && (fee.total_amount || 0) > 0;
        }) || [];

        // Check for students with low payment percentage (< 50%)
        const studentsLowPayment = schoolFees?.filter(fee => {
            const paidAmount = studentPayments.filter(p => p.student_id === fee.student_id)
                .reduce((sum, p) => sum + (p.amount || 0), 0);
            const totalPaid = (fee.advance_payment || 0) + paidAmount;
            // Calculate percentage
            return (fee.total_amount || 0) > 0 && (totalPaid / fee.total_amount) < 0.5;
        }) || [];


        if (studentsWithoutPayment.length > 0) {
            newAlerts.push({
                id: 'stu-no-payment',
                type: 'danger',
                category: 'students',
                title: 'طلاب لم يسددوا أي مبالغ',
                message: `يوجد ${studentsWithoutPayment.length} طالب لم يسددوا أي رسوم دراسية`,
                count: studentsWithoutPayment.length,
                priority: 9, // Elevated priority
                createdAt: today,
                actionLink: '/students',
                actionLabel: 'مراجعة الطلاب'
            });
        } else if (studentsLowPayment.length > 0) {
            newAlerts.push({
                id: 'stu-low-payment',
                type: 'warning',
                category: 'students',
                title: 'تحصيل منخفض للرسوم',
                message: `يوجد ${studentsLowPayment.length} طالب سددوا أقل من 50% من الرسوم`,
                count: studentsLowPayment.length,
                priority: 6,
                createdAt: today
            });
        }

        // 3. Salary Alerts
        const pendingSalaries = salaries.filter(s => s.status === 'مستحق');
        if (pendingSalaries.length > 0) {
            const totalPending = pendingSalaries.reduce((sum, s) => sum + (s.netSalary || 0), 0);
            newAlerts.push({
                id: 'sal-pending',
                type: 'warning',
                category: 'salaries',
                title: 'رواتب مستحقة الصرف',
                message: `يوجد ${pendingSalaries.length} راتب مستحق بإجمالي ${totalPending.toLocaleString('en-US')} ج.م`,
                count: pendingSalaries.length,
                amount: totalPending,
                priority: 7,
                createdAt: today,
                actionLink: '/finance/salaries',
                actionLabel: 'صرف الرواتب'
            });
        }

        // 4. Budget Alerts
        if (summary) {
            if (summary.netBalance < 0) {
                newAlerts.push({
                    id: 'budget-deficit',
                    type: 'danger',
                    category: 'budget',
                    title: 'عجز في الميزانية',
                    message: `المصروفات تتجاوز الإيرادات بمبلغ ${Math.abs(summary.netBalance).toLocaleString('en-US')} ج.م`,
                    amount: Math.abs(summary.netBalance),
                    priority: 9,
                    createdAt: today,
                    actionLink: '/finance/revenue',
                    actionLabel: 'إدارة الميزانية'
                });
            } else if (newAlerts.length === 0) {
                newAlerts.push({
                    id: 'budget-stable',
                    type: 'success',
                    category: 'budget',
                    title: 'الوضع المالي مستقر',
                    message: 'لا توجد تنبيهات حرجة، والوضع المالي في حالة جيدة',
                    priority: 1,
                    createdAt: today
                });
            }
        }

        // 5. Expense Trends (Compare this month vs last month)
        const currentMonth = today.getMonth();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;

        const thisMonthExpenses = transactions
            .filter(t => {
                const d = new Date(t.transactionDate);
                return d.getMonth() === currentMonth && t.transactionType === 'مصروف';
            })
            .reduce((sum, t) => sum + t.amount, 0);

        const lastMonthExpenses = transactions
            .filter(t => {
                const d = new Date(t.transactionDate);
                return d.getMonth() === lastMonth && t.transactionType === 'مصروف';
            })
            .reduce((sum, t) => sum + t.amount, 0);

        if (thisMonthExpenses > lastMonthExpenses && lastMonthExpenses > 0) {
            const increase = thisMonthExpenses - lastMonthExpenses;
            const percent = Math.round((increase / lastMonthExpenses) * 100);

            if (percent > 20) { // Notify if increase is significant (> 20%)
                newAlerts.push({
                    id: 'exp-trend-up',
                    type: 'info',
                    category: 'expenses',
                    title: 'زيادة في المصروفات',
                    message: `زيادة بنسبة ${percent}% في المصروفات مقارنة بالشهر السابق`,
                    amount: increase,
                    priority: 4,
                    createdAt: today
                });
            }
        }

        return newAlerts.sort((a, b) => b.priority - a.priority);
    }, [salaries, summary, schoolFees, installments, transactions, studentPayments]);

    return {
        alerts,
        hasDanger: alerts.some(a => a.type === 'danger'),
        hasWarning: alerts.some(a => a.type === 'warning'),
    };
}
