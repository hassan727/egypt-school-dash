/**
 * صفحة تقارير الحضور المحسنة - نظام الموارد البشرية
 * Enhanced Attendance Reports - HR System
 */
import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    BarChart3, Download, Calendar, Users, Clock, AlertTriangle,
    Loader2, TrendingUp, TrendingDown, FileSpreadsheet, Printer
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { AttendancePrintReport } from '@/components/hr/AttendancePrintReport';

interface AttendanceStats {
    totalWorkDays: number;
    avgAttendanceRate: number;
    totalLateInstances: number;
    totalAbsences: number;
    totalLateMinutes: number;
    avgWorkedHours: number;
}

interface TopEmployee {
    id: string;
    full_name: string;
    employee_id: string;
    department: string;
    count: number;
    total_minutes?: number;
}

const HRAttendanceReports = () => {
    const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<AttendanceStats>({
        totalWorkDays: 0,
        avgAttendanceRate: 0,
        totalLateInstances: 0,
        totalAbsences: 0,
        totalLateMinutes: 0,
        avgWorkedHours: 0,
    });
    const [topLateEmployees, setTopLateEmployees] = useState<TopEmployee[]>([]);
    const [topAbsentEmployees, setTopAbsentEmployees] = useState<TopEmployee[]>([]);
    const [records, setRecords] = useState<any[]>([]);
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchReportData();
    }, [reportType, selectedMonth]);

    const fetchReportData = async () => {
        try {
            setLoading(true);

            // Calculate date range
            let startDate: string;
            let endDate: string;

            if (reportType === 'yearly') {
                const year = selectedMonth.split('-')[0];
                startDate = `${year}-01-01`;
                endDate = `${year}-12-31`;
            } else {
                startDate = `${selectedMonth}-01`;
                const [year, month] = selectedMonth.split('-').map(Number);
                endDate = new Date(year, month, 0).toISOString().split('T')[0];
            }

            // Fetch all attendance records for the period
            const { data: attendanceData, error } = await supabase
                .from('employee_attendance')
                .select(`
          *,
          employee:employees(id, employee_id, full_name, department, position)
        `)
                .gte('date', startDate)
                .lte('date', endDate);

            if (error) throw error;

            setRecords(attendanceData || []);

            // Calculate statistics
            const uniqueDates = new Set((attendanceData || []).map(r => r.date));
            const totalRecords = attendanceData?.length || 0;
            const presentRecords = attendanceData?.filter(r => r.status === 'حاضر' || r.status === 'متأخر') || [];
            const lateRecords = attendanceData?.filter(r => r.status === 'متأخر') || [];
            const absentRecords = attendanceData?.filter(r => r.status === 'غائب') || [];

            setStats({
                totalWorkDays: uniqueDates.size,
                avgAttendanceRate: totalRecords > 0 ? Math.round((presentRecords.length / totalRecords) * 100) : 0,
                totalLateInstances: lateRecords.length,
                totalAbsences: absentRecords.length,
                totalLateMinutes: lateRecords.reduce((sum, r) => sum + (r.late_minutes || 0), 0),
                avgWorkedHours: presentRecords.length > 0
                    ? presentRecords.reduce((sum, r) => sum + (r.worked_hours || 0), 0) / presentRecords.length
                    : 0,
            });

            // Calculate top late employees
            const lateByEmployee: Record<string, { employee: any; count: number; totalMinutes: number }> = {};
            lateRecords.forEach(r => {
                if (!lateByEmployee[r.employee_id]) {
                    lateByEmployee[r.employee_id] = { employee: r.employee, count: 0, totalMinutes: 0 };
                }
                lateByEmployee[r.employee_id].count++;
                lateByEmployee[r.employee_id].totalMinutes += r.late_minutes || 0;
            });

            const topLate = Object.values(lateByEmployee)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map(item => ({
                    id: item.employee?.id,
                    full_name: item.employee?.full_name,
                    employee_id: item.employee?.employee_id,
                    department: item.employee?.department,
                    count: item.count,
                    total_minutes: item.totalMinutes,
                }));

            setTopLateEmployees(topLate);

            // Calculate top absent employees
            const absentByEmployee: Record<string, { employee: any; count: number }> = {};
            absentRecords.forEach(r => {
                if (!absentByEmployee[r.employee_id]) {
                    absentByEmployee[r.employee_id] = { employee: r.employee, count: 0 };
                }
                absentByEmployee[r.employee_id].count++;
            });

            const topAbsent = Object.values(absentByEmployee)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map(item => ({
                    id: item.employee?.id,
                    full_name: item.employee?.full_name,
                    employee_id: item.employee?.employee_id,
                    department: item.employee?.department,
                    count: item.count,
                }));

            setTopAbsentEmployees(topAbsent);

        } catch (error: any) {
            console.error('Error fetching report data:', error);
            toast.error('فشل في تحميل بيانات التقرير');
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = () => {
        // Create CSV content
        const headers = ['الكود', 'الاسم', 'القسم', 'التاريخ', 'الحضور', 'الانصراف', 'الحالة', 'التأخير'];
        const rows = records.map(r => [
            r.employee?.employee_id,
            r.employee?.full_name,
            r.employee?.department || '',
            r.date,
            r.check_in_time?.substring(0, 5) || '',
            r.check_out_time?.substring(0, 5) || '',
            r.status,
            r.late_minutes || 0,
        ].join(','));

        const csvContent = '\ufeff' + [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `attendance_report_${selectedMonth}.csv`;
        link.click();

        toast.success('تم تصدير التقرير بنجاح');
    };

    const handlePrint = () => {
        window.print();
    };

    const dateRange = {
        startDate: `${selectedMonth}-01`,
        endDate: new Date(
            parseInt(selectedMonth.split('-')[0]),
            parseInt(selectedMonth.split('-')[1]),
            0
        ).toISOString().split('T')[0],
    };

    const printStats = {
        total: records.length,
        present: records.filter(r => r.status === 'حاضر').length,
        late: records.filter(r => r.status === 'متأخر').length,
        absent: records.filter(r => r.status === 'غائب').length,
        onLeave: records.filter(r => r.status === 'إجازة').length,
        onPermission: records.filter(r => r.status === 'إذن' || r.status === 'مأمورية').length,
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <BarChart3 className="h-8 w-8 text-indigo-600" />
                            تقارير الحضور والانصراف
                        </h1>
                        <p className="text-gray-500 mt-1">تحليلات وإحصائيات شاملة للحضور</p>
                    </div>
                </div>

                {/* Filters */}
                <Card className="p-4">
                    <div className="flex gap-4 flex-wrap items-center">
                        <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">تقرير يومي</SelectItem>
                                <SelectItem value="weekly">تقرير أسبوعي</SelectItem>
                                <SelectItem value="monthly">تقرير شهري</SelectItem>
                                <SelectItem value="yearly">تقرير سنوي</SelectItem>
                            </SelectContent>
                        </Select>

                        <Input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-[200px]"
                        />

                        <div className="flex-1" />

                        <Button variant="outline" onClick={handlePrint}>
                            <Printer className="h-4 w-4 ml-2" />
                            طباعة
                        </Button>
                        <Button onClick={handleExportExcel}>
                            <FileSpreadsheet className="h-4 w-4 ml-2" />
                            تصدير Excel
                        </Button>
                    </div>
                </Card>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    </div>
                ) : (
                    <>
                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-500 rounded-xl">
                                        <Calendar className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-blue-600">أيام العمل</p>
                                        <p className="text-3xl font-bold text-blue-900">{stats.totalWorkDays}</p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-green-500 rounded-xl">
                                        <TrendingUp className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-green-600">نسبة الحضور</p>
                                        <p className="text-3xl font-bold text-green-900">{stats.avgAttendanceRate}%</p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-yellow-500 rounded-xl">
                                        <AlertTriangle className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-yellow-600">حالات التأخير</p>
                                        <p className="text-3xl font-bold text-yellow-900">{stats.totalLateInstances}</p>
                                        <p className="text-xs text-yellow-600">{stats.totalLateMinutes} دقيقة إجمالي</p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-red-500 rounded-xl">
                                        <TrendingDown className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-red-600">إجمالي الغياب</p>
                                        <p className="text-3xl font-bold text-red-900">{stats.totalAbsences}</p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Additional Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-100 rounded-xl">
                                        <Clock className="h-8 w-8 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">متوسط ساعات العمل اليومية</p>
                                        <p className="text-2xl font-bold text-gray-800">
                                            {stats.avgWorkedHours.toFixed(1)} ساعة
                                        </p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-purple-100 rounded-xl">
                                        <Users className="h-8 w-8 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">إجمالي سجلات الحضور</p>
                                        <p className="text-2xl font-bold text-gray-800">
                                            {records.length} سجل
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Top Lists */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-yellow-700">
                                        <AlertTriangle className="h-5 w-5" />
                                        أكثر الموظفين تأخراً
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {topLateEmployees.length === 0 ? (
                                        <p className="text-gray-500 text-center py-4">لا توجد بيانات</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {topLateEmployees.map((emp, index) => (
                                                <div
                                                    key={emp.id}
                                                    className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-6 h-6 rounded-full bg-yellow-200 flex items-center justify-center text-sm font-bold text-yellow-700">
                                                            {index + 1}
                                                        </span>
                                                        <div>
                                                            <p className="font-medium">{emp.full_name}</p>
                                                            <p className="text-xs text-gray-500">{emp.department}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-left">
                                                        <span className="text-yellow-700 font-bold">{emp.count} مرات</span>
                                                        <p className="text-xs text-gray-500">{emp.total_minutes} دقيقة</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-red-700">
                                        <TrendingDown className="h-5 w-5" />
                                        أكثر الموظفين غياباً
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {topAbsentEmployees.length === 0 ? (
                                        <p className="text-gray-500 text-center py-4">لا توجد بيانات</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {topAbsentEmployees.map((emp, index) => (
                                                <div
                                                    key={emp.id}
                                                    className="flex justify-between items-center p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-6 h-6 rounded-full bg-red-200 flex items-center justify-center text-sm font-bold text-red-700">
                                                            {index + 1}
                                                        </span>
                                                        <div>
                                                            <p className="font-medium">{emp.full_name}</p>
                                                            <p className="text-xs text-gray-500">{emp.department}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-red-700 font-bold">{emp.count} أيام</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </>
                )}

                {/* Hidden Print Content */}
                <div className="hidden print:block">
                    <AttendancePrintReport
                        ref={printRef}
                        records={records}
                        dateRange={dateRange}
                        reportType={reportType === 'yearly' ? 'monthly' : reportType}
                        stats={printStats}
                    />
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
        @media print {
          body > * {
            visibility: hidden;
          }
          .print\\:block {
            display: block !important;
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}</style>
        </DashboardLayout>
    );
};

export default HRAttendanceReports;
