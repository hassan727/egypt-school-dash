/**
 * ذكي: تحليل وحسابات متقدمة للحضور مع تنبيهات
 * Smart: Advanced attendance analysis and calculations with alerts
 */
import { AttendanceRecord } from '@/hooks/useEmployeeAttendance';

export interface AttendanceAlert {
    id: string;
    type: 'warning' | 'danger' | 'info' | 'success';
    title: string;
    message: string;
    severity: 1 | 2 | 3 | 4 | 5; // 5 = highest
    affectedCount: number;
}

export interface AdvancedStats {
    averageLateMinutes: number;
    averageWorkedHours: number;
    absenteeRatePercent: number;
    lateRatePercent: number;
    mostLateEmployee?: {
        name: string;
        lateMinutes: number;
        lateCount: number;
    };
    highestAbsenteeEmployee?: {
        name: string;
        absentDays: number;
    };
    departmentStats: Record<string, {
        present: number;
        late: number;
        absent: number;
        rate: number;
    }>;
}

// ذكي: حساب الإحصائيات المتقدمة
export const calculateAdvancedStats = (records: AttendanceRecord[]): AdvancedStats => {
    if (records.length === 0) {
        return {
            averageLateMinutes: 0,
            averageWorkedHours: 0,
            absenteeRatePercent: 0,
            lateRatePercent: 0,
            departmentStats: {},
        };
    }

    // الموظفين الفريدين
    const uniqueEmployees = [...new Set(records.map(r => r.employee_id))];

    // حساب المتأخرين
    const lateRecords = records.filter(r => r.status === 'متأخر');
    const totalLateMinutes = lateRecords.reduce((sum, r) => sum + (r.late_minutes || 0), 0);
    const averageLateMinutes = lateRecords.length > 0 ? Math.round(totalLateMinutes / lateRecords.length) : 0;

    // حساب ساعات العمل
    const totalWorkedHours = records.reduce((sum, r) => sum + (r.worked_hours || 0), 0);
    const averageWorkedHours = Math.round((totalWorkedHours / records.length) * 100) / 100;

    // النسب المئوية
    const absentCount = records.filter(r => r.status === 'غائب').length;
    const lateCount = lateRecords.length;
    const absenteeRatePercent = Math.round((absentCount / records.length) * 100);
    const lateRatePercent = Math.round((lateCount / records.length) * 100);

    // أكثر موظف متأخر
    const employeeLateness: Record<string, { name: string; lateMinutes: number; count: number }> = {};
    records.forEach(record => {
        if (record.status === 'متأخر') {
            const key = record.employee_id;
            if (!employeeLateness[key]) {
                employeeLateness[key] = {
                    name: record.employee?.full_name || 'غير معروف',
                    lateMinutes: 0,
                    count: 0,
                };
            }
            employeeLateness[key].lateMinutes += record.late_minutes || 0;
            employeeLateness[key].count += 1;
        }
    });

    const mostLateEmployee = Object.values(employeeLateness).sort(
        (a, b) => b.lateMinutes - a.lateMinutes
    )[0];

    // أكثر موظف غائب
    const employeeAbsence: Record<string, { name: string; count: number }> = {};
    records.forEach(record => {
        if (record.status === 'غائب') {
            const key = record.employee_id;
            if (!employeeAbsence[key]) {
                employeeAbsence[key] = {
                    name: record.employee?.full_name || 'غير معروف',
                    count: 0,
                };
            }
            employeeAbsence[key].count += 1;
        }
    });

    const highestAbsenteeEmployee = Object.entries(employeeAbsence)
        .sort(([, a], [, b]) => b.count - a.count)
        .map(([, v]) => ({ ...v, absentDays: v.count }))[0];

    // إحصائيات القسم
    const departmentStats: Record<string, { present: number; late: number; absent: number; rate: number }> = {};
    records.forEach(record => {
        const dept = record.employee?.department || 'غير محدد';
        if (!departmentStats[dept]) {
            departmentStats[dept] = { present: 0, late: 0, absent: 0, rate: 0 };
        }

        if (record.status === 'حاضر') departmentStats[dept].present += 1;
        else if (record.status === 'متأخر') departmentStats[dept].late += 1;
        else if (record.status === 'غائب') departmentStats[dept].absent += 1;

        const total = departmentStats[dept].present + departmentStats[dept].late + departmentStats[dept].absent;
        departmentStats[dept].rate = total > 0 ? Math.round(((departmentStats[dept].present + departmentStats[dept].late) / total) * 100) : 0;
    });

    return {
        averageLateMinutes,
        averageWorkedHours,
        absenteeRatePercent,
        lateRatePercent,
        mostLateEmployee: mostLateEmployee ? {
            name: mostLateEmployee.name,
            lateMinutes: mostLateEmployee.lateMinutes,
            lateCount: mostLateEmployee.count,
        } : undefined,
        highestAbsenteeEmployee,
        departmentStats,
    };
};

export interface AttendanceStatsForAlerts {
    total: number;
    present: number;
    late: number;
    absent: number;
    onLeave: number;
    onPermission: number;
}

// ذكي: توليد التنبيهات الذكية
export const generateAttendanceAlerts = (records: AttendanceRecord[], stats: AttendanceStatsForAlerts): AttendanceAlert[] => {
    const alerts: AttendanceAlert[] = [];
    const advStats = calculateAdvancedStats(records);

    // تنبيه 1: نسبة الغياب عالية جداً
    if (advStats.absenteeRatePercent > 30) {
        alerts.push({
            id: 'high-absent-rate',
            type: 'danger',
            title: '🚨 نسبة غياب مرتفعة جداً',
            message: `نسبة الغياب وصلت إلى ${advStats.absenteeRatePercent}% - يتطلب متابعة فورية`,
            severity: 5,
            affectedCount: records.filter(r => r.status === 'غائب').length,
        });
    } else if (advStats.absenteeRatePercent > 20) {
        alerts.push({
            id: 'medium-absent-rate',
            type: 'warning',
            title: '⚠️ نسبة غياب مرتفعة',
            message: `نسبة الغياب ${advStats.absenteeRatePercent}% - يفضل المتابعة`,
            severity: 3,
            affectedCount: stats.absent,
        });
    }

    // تنبيه 2: نسبة التأخير عالية
    if (advStats.lateRatePercent > 25) {
        alerts.push({
            id: 'high-late-rate',
            type: 'warning',
            title: '⏰ نسبة تأخير مرتفعة',
            message: `${advStats.lateRatePercent}% من الموظفين متأخرون - متوسط التأخير ${advStats.averageLateMinutes} دقيقة`,
            severity: 4,
            affectedCount: stats.late,
        });
    }

    // تنبيه 3: موظف متأخر بشكل متكرر
    if (advStats.mostLateEmployee && advStats.mostLateEmployee.lateCount > 5) {
        alerts.push({
            id: 'frequent-late-employee',
            type: 'warning',
            title: '⏰ موظف متأخر بشكل متكرر',
            message: `${advStats.mostLateEmployee.name} متأخر ${advStats.mostLateEmployee.lateCount} مرات برصيد ${advStats.mostLateEmployee.lateMinutes} دقيقة`,
            severity: 3,
            affectedCount: 1,
        });
    }

    // تنبيه 4: موظف غائب بشكل متكرر
    if (advStats.highestAbsenteeEmployee && advStats.highestAbsenteeEmployee.absentDays > 5) {
        alerts.push({
            id: 'frequent-absent-employee',
            type: 'danger',
            title: '🚨 موظف غائب بشكل متكرر',
            message: `${advStats.highestAbsenteeEmployee.name} غائب ${advStats.highestAbsenteeEmployee.absentDays} أيام`,
            severity: 5,
            affectedCount: 1,
        });
    }

    // تنبيه 5: عدم انصراف الموظفين
    const noCheckOut = records.filter(r => r.check_in_time && !r.check_out_time);
    if (noCheckOut.length > 0) {
        alerts.push({
            id: 'no-check-out',
            type: 'info',
            title: '⚠️ موظفون لم ينصرفوا',
            message: `${noCheckOut.length} موظف لم يسجل انصرافه بعد`,
            severity: 2,
            affectedCount: noCheckOut.length,
        });
    }

    // تنبيه 6: قسم بنسبة حضور منخفضة
    const lowAttendanceDepts = Object.entries(advStats.departmentStats)
        .filter(([, stats]) => stats.rate < 70)
        .map(([dept, stats]) => ({ dept, rate: stats.rate }));

    if (lowAttendanceDepts.length > 0) {
        const dept = lowAttendanceDepts[0];
        alerts.push({
            id: 'low-department-rate',
            type: 'warning',
            title: '⚠️ قسم بنسبة حضور منخفضة',
            message: `قسم "${dept.dept}" بنسبة حضور ${dept.rate}% فقط`,
            severity: 3,
            affectedCount: 1,
        });
    }

    // تنبيه إيجابي: نسبة حضور جيدة
    if (advStats.absenteeRatePercent < 5 && advStats.lateRatePercent < 10) {
        alerts.push({
            id: 'good-attendance',
            type: 'success',
            title: '✅ نسبة حضور ممتازة',
            message: `نسبة الحضور ${100 - advStats.absenteeRatePercent}% - مستوى ممتاز`,
            severity: 1,
            affectedCount: stats.present,
        });
    }

    return alerts.sort((a, b) => b.severity - a.severity);
};
