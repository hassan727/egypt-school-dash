/**
 * Salary Analytics Hook - تحليلات الرواتب الذكية
 * Enterprise-level salary analysis and insights
 */

import { useMemo } from 'react';
import { Salary, Employee } from '@/types/finance';

interface SalaryTrend {
    month: string;
    monthName: string;
    totalGross: number;
    totalNet: number;
    totalAllowances: number;
    totalDeductions: number;
    paidCount: number;
    pendingCount: number;
}

interface EmployeeTypeStat {
    type: string;
    count: number;
    totalSalary: number;
    percentage: number;
    avgSalary: number;
}

interface SalaryForecast {
    month: string;
    expectedAmount: number;
    employeeCount: number;
}

interface EmployeeSalaryHistory {
    employeeId: string;
    employeeName: string;
    salaries: Salary[];
    totalPaid: number;
    totalPending: number;
    avgNetSalary: number;
}

interface DepartmentStat {
    department: string;
    employeeCount: number;
    totalSalary: number;
    percentage: number;
}

export interface SalaryAnalytics {
    // Summary Stats
    totalEmployees: number;
    activeEmployees: number;
    totalMonthlyPayroll: number;
    avgSalary: number;
    maxSalary: number;
    minSalary: number;

    // Trends
    salaryTrends: SalaryTrend[];
    monthOverMonthGrowth: number;

    // Distribution
    employeeTypeStats: EmployeeTypeStat[];
    departmentStats: DepartmentStat[];

    // Forecasting
    salaryForecast: SalaryForecast[];
    upcomingPayrollAmount: number;

    // Status
    pendingSalariesCount: number;
    pendingSalariesAmount: number;
    paidSalariesCount: number;
    paidSalariesAmount: number;
    paymentRate: number;

    // Alerts
    alerts: SalaryAlert[];

    // Employee histories
    getEmployeeSalaryHistory: (employeeId: string) => EmployeeSalaryHistory | null;
}

interface SalaryAlert {
    id: string;
    type: 'danger' | 'warning' | 'info' | 'success';
    title: string;
    message: string;
    count?: number;
    amount?: number;
}

interface UseSalaryAnalyticsProps {
    employees: Employee[];
    salaries: Salary[];
    currentMonth?: string;
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

export function useSalaryAnalytics({
    employees,
    salaries,
    currentMonth = new Date().toISOString().slice(0, 7),
}: UseSalaryAnalyticsProps): SalaryAnalytics {

    const activeEmployees = useMemo(() =>
        employees.filter(e => e.isActive), [employees]
    );

    // Summary Statistics
    const summaryStats = useMemo(() => {
        const baseSalaries = activeEmployees.map(e => e.baseSalary);
        return {
            totalEmployees: employees.length,
            activeEmployees: activeEmployees.length,
            totalMonthlyPayroll: baseSalaries.reduce((sum, s) => sum + s, 0),
            avgSalary: baseSalaries.length > 0
                ? baseSalaries.reduce((sum, s) => sum + s, 0) / baseSalaries.length
                : 0,
            maxSalary: baseSalaries.length > 0 ? Math.max(...baseSalaries) : 0,
            minSalary: baseSalaries.length > 0 ? Math.min(...baseSalaries) : 0,
        };
    }, [employees, activeEmployees]);

    // Salary Trends (past 6 months)
    const salaryTrends = useMemo(() => {
        const monthsMap = new Map<string, SalaryTrend>();

        // Get last 6 months
        const months: string[] = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            months.push(date.toISOString().slice(0, 7));
        }

        months.forEach(month => {
            const monthSalaries = salaries.filter(s => s.month === month);
            const monthNum = month.split('-')[1];

            monthsMap.set(month, {
                month,
                monthName: ARABIC_MONTHS[monthNum] || month,
                totalGross: monthSalaries.reduce((sum, s) => sum + s.baseSalary, 0),
                totalNet: monthSalaries.reduce((sum, s) => sum + s.netSalary, 0),
                totalAllowances: monthSalaries.reduce((sum, s) => sum + s.totalAllowances, 0),
                totalDeductions: monthSalaries.reduce((sum, s) => sum + s.totalDeductions, 0),
                paidCount: monthSalaries.filter(s => s.status === 'تم الصرف').length,
                pendingCount: monthSalaries.filter(s => s.status === 'مستحق').length,
            });
        });

        return Array.from(monthsMap.values());
    }, [salaries]);

    // Month over Month Growth
    const monthOverMonthGrowth = useMemo(() => {
        if (salaryTrends.length < 2) return 0;
        const current = salaryTrends[salaryTrends.length - 1]?.totalNet || 0;
        const previous = salaryTrends[salaryTrends.length - 2]?.totalNet || 0;
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
    }, [salaryTrends]);

    // Employee Type Distribution
    const employeeTypeStats = useMemo(() => {
        const typeMap = new Map<string, { count: number; totalSalary: number }>();

        activeEmployees.forEach(emp => {
            const type = emp.employeeType || 'غير محدد';
            const current = typeMap.get(type) || { count: 0, totalSalary: 0 };
            typeMap.set(type, {
                count: current.count + 1,
                totalSalary: current.totalSalary + emp.baseSalary,
            });
        });

        const total = activeEmployees.length;
        return Array.from(typeMap.entries()).map(([type, data]) => ({
            type,
            count: data.count,
            totalSalary: data.totalSalary,
            percentage: total > 0 ? (data.count / total) * 100 : 0,
            avgSalary: data.count > 0 ? data.totalSalary / data.count : 0,
        }));
    }, [activeEmployees]);

    // Department Distribution
    const departmentStats = useMemo(() => {
        const deptMap = new Map<string, { count: number; totalSalary: number }>();

        activeEmployees.forEach(emp => {
            const dept = emp.department || emp.position || 'غير محدد';
            const current = deptMap.get(dept) || { count: 0, totalSalary: 0 };
            deptMap.set(dept, {
                count: current.count + 1,
                totalSalary: current.totalSalary + emp.baseSalary,
            });
        });

        const total = summaryStats.totalMonthlyPayroll;
        return Array.from(deptMap.entries()).map(([department, data]) => ({
            department,
            employeeCount: data.count,
            totalSalary: data.totalSalary,
            percentage: total > 0 ? (data.totalSalary / total) * 100 : 0,
        }));
    }, [activeEmployees, summaryStats.totalMonthlyPayroll]);

    // Salary Forecast (next 3 months)
    const salaryForecast = useMemo(() => {
        const forecasts: SalaryForecast[] = [];

        for (let i = 1; i <= 3; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() + i);
            const month = date.toISOString().slice(0, 7);

            forecasts.push({
                month,
                expectedAmount: summaryStats.totalMonthlyPayroll,
                employeeCount: summaryStats.activeEmployees,
            });
        }

        return forecasts;
    }, [summaryStats]);

    // Pending and Paid Salaries for current month
    const currentMonthStatus = useMemo(() => {
        const monthSalaries = salaries.filter(s => s.month === currentMonth);
        const pending = monthSalaries.filter(s => s.status === 'مستحق');
        const paid = monthSalaries.filter(s => s.status === 'تم الصرف');

        return {
            pendingSalariesCount: pending.length,
            pendingSalariesAmount: pending.reduce((sum, s) => sum + s.netSalary, 0),
            paidSalariesCount: paid.length,
            paidSalariesAmount: paid.reduce((sum, s) => sum + s.netSalary, 0),
            paymentRate: monthSalaries.length > 0
                ? (paid.length / monthSalaries.length) * 100
                : 0,
        };
    }, [salaries, currentMonth]);

    // Smart Alerts
    const alerts = useMemo(() => {
        const alertsList: SalaryAlert[] = [];

        // Check for high pending salaries
        if (currentMonthStatus.pendingSalariesCount > 0) {
            alertsList.push({
                id: 'pending-salaries',
                type: currentMonthStatus.pendingSalariesCount > 5 ? 'danger' : 'warning',
                title: 'رواتب مستحقة',
                message: `يوجد ${currentMonthStatus.pendingSalariesCount} راتب مستحق للصرف`,
                count: currentMonthStatus.pendingSalariesCount,
                amount: currentMonthStatus.pendingSalariesAmount,
            });
        }

        // Check for employees without generated salaries
        const monthSalariesEmps = salaries.filter(s => s.month === currentMonth).map(s => s.employeeId);
        const missingEmps = activeEmployees.filter(e => !monthSalariesEmps.includes(e.id));
        if (missingEmps.length > 0) {
            alertsList.push({
                id: 'missing-salaries',
                type: 'info',
                title: 'رواتب غير منشأة',
                message: `${missingEmps.length} موظف لم يتم إنشاء راتبهم لهذا الشهر`,
                count: missingEmps.length,
            });
        }

        // Success alert for fully paid month
        if (currentMonthStatus.paymentRate === 100 && currentMonthStatus.paidSalariesCount > 0) {
            alertsList.push({
                id: 'all-paid',
                type: 'success',
                title: 'تم صرف جميع الرواتب',
                message: 'تم صرف جميع رواتب الشهر الحالي بنجاح',
                count: currentMonthStatus.paidSalariesCount,
                amount: currentMonthStatus.paidSalariesAmount,
            });
        }

        return alertsList;
    }, [currentMonthStatus, salaries, activeEmployees, currentMonth]);

    // Get employee salary history
    const getEmployeeSalaryHistory = useMemo(() => {
        return (employeeId: string): EmployeeSalaryHistory | null => {
            const employee = employees.find(e => e.id === employeeId);
            if (!employee) return null;

            const empSalaries = salaries
                .filter(s => s.employeeId === employeeId)
                .sort((a, b) => b.month.localeCompare(a.month));

            const paid = empSalaries.filter(s => s.status === 'تم الصرف');
            const pending = empSalaries.filter(s => s.status === 'مستحق');

            return {
                employeeId,
                employeeName: employee.fullName,
                salaries: empSalaries,
                totalPaid: paid.reduce((sum, s) => sum + s.netSalary, 0),
                totalPending: pending.reduce((sum, s) => sum + s.netSalary, 0),
                avgNetSalary: empSalaries.length > 0
                    ? empSalaries.reduce((sum, s) => sum + s.netSalary, 0) / empSalaries.length
                    : 0,
            };
        };
    }, [employees, salaries]);

    return {
        ...summaryStats,
        salaryTrends,
        monthOverMonthGrowth,
        employeeTypeStats,
        departmentStats,
        salaryForecast,
        upcomingPayrollAmount: salaryForecast[0]?.expectedAmount || 0,
        ...currentMonthStatus,
        alerts,
        getEmployeeSalaryHistory,
    };
}
