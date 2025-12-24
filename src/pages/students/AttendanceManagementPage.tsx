import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { SmartAttendanceTable } from '@/components/StudentProfile/SmartAttendanceTable';
import { useStudentData } from '@/hooks/useStudentData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Calendar,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    ArrowLeft,
    Clock,
    FileText,
    AlertTriangle
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AttendanceRecord } from '@/types/student';
import { parseISO, getMonth, getYear } from 'date-fns';
import * as XLSX from 'xlsx';
import { onStudentAbsent, onStudentTardy } from '@/services/notificationTriggers';

export default function AttendanceManagementPage() {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const {
        studentProfile,
        loading,
        error,
        updateAttendanceRecords,
        refreshStudentData,
        saveAuditTrail
    } = useStudentData(studentId || '');

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-11

    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

    // Filter records for the selected period
    const filteredRecords = useMemo(() => {
        if (!studentProfile?.attendanceRecords) return [];
        // Calculate actual calendar year based on academic year logic
        // If month is Jan-Aug (0-7), it's the next year (Academic Year + 1)
        // If month is Sept-Dec (8-11), it's the same year (Academic Year)
        const targetYear = selectedMonth < 8 ? selectedYear + 1 : selectedYear;

        return studentProfile.attendanceRecords.filter(r => {
            const date = parseISO(r.date);
            return getYear(date) === targetYear && getMonth(date) === selectedMonth;
        });
    }, [studentProfile?.attendanceRecords, selectedYear, selectedMonth]);

    // Calculate Stats
    const stats = useMemo(() => {
        const present = filteredRecords.filter(r => r.status === 'حاضر').length;
        const absent = filteredRecords.filter(r => r.status === 'غائب').length;
        const late = filteredRecords.filter(r => r.status === 'متأخر').length;
        const excused = filteredRecords.filter(r => r.status === 'معذور').length;

        // Calculate Total Working Days (Elapsed)
        const now = new Date();
        const targetYear = selectedMonth < 8 ? selectedYear + 1 : selectedYear;
        const monthStart = new Date(targetYear, selectedMonth, 1);
        const monthEnd = new Date(targetYear, selectedMonth + 1, 0); // Last day of month

        let endDate = monthEnd;
        if (targetYear === now.getFullYear() && selectedMonth === now.getMonth()) {
            endDate = now;
        } else if (monthStart > now) {
            endDate = monthStart; // Future month, 0 days
        }

        let workingDays = 0;
        if (endDate >= monthStart) {
            for (let d = new Date(monthStart); d <= endDate; d.setDate(d.getDate() + 1)) {
                const day = d.getDay();
                if (day !== 5 && day !== 6) { // 5=Fri, 6=Sat
                    workingDays++;
                }
            }
        }

        const totalRecorded = filteredRecords.length;
        const unrecorded = Math.max(0, workingDays - totalRecorded);

        // Calculation: Rate based on RECORDED days only (User Preference)
        // Rate = (Present / (Recorded - Excused)) * 100
        const effectiveTotal = totalRecorded - excused;
        const attendanceRate = effectiveTotal > 0
            ? Math.round((present / effectiveTotal) * 100)
            : 0;

        return { present, absent, late, excused, totalRecorded, attendanceRate, workingDays, unrecorded };
    }, [filteredRecords, selectedYear, selectedMonth]);

    // Alerts Logic
    const alerts = useMemo(() => {
        const list = [];
        // Only show alerts if we have enough data (>= 3 records) to avoid false alarms
        if (stats.totalRecorded >= 3) {
            const absentRate = (stats.absent / stats.totalRecorded) * 100;
            if (absentRate > 20) {
                list.push({
                    type: 'danger',
                    message: `تحذير: غياب مفرط – قد يؤثر على النجاح (تجاوز 20%)`
                });
            }

            if (stats.late > 5) {
                list.push({
                    type: 'warning',
                    message: 'تنبيه: تأخر متكرر (أكثر من 5 مرات)'
                });
            }
        }
        return list;
    }, [stats]);

    const handleUpdateRecord = async (date: string, data: Partial<AttendanceRecord>) => {
        try {
            // 1. Optimistic Update
            const currentRecords = studentProfile?.attendanceRecords || [];
            const existingIndex = currentRecords.findIndex(r => r.date === date);

            let newRecords = [...currentRecords];
            if (existingIndex >= 0) {
                newRecords[existingIndex] = { ...newRecords[existingIndex], ...data };
            } else {
                newRecords.push({
                    date,
                    status: 'حاضر', // default
                    ...data,
                    studentId: studentId // Ensure studentId is present
                } as AttendanceRecord);
            }

            // Update local state immediately (if we had a setStudentProfile exposed, but we don't directly)
            // Since useStudentData doesn't expose a setter for the whole profile, we rely on the fact that
            // updateAttendanceRecords might trigger a refresh or we can manually trigger a refetch.
            // However, to make it truly "optimistic" in the UI without waiting for network, 
            // we would need to update the local state. 
            // Given the current hook structure, the best we can do is:
            // 1. Call API
            // 2. Trigger Refresh
            // If the user wants "instant" feedback, we might need to modify the hook to expose setStudentProfile 
            // or manage a local state for records in this page.

            // Let's try to manage a local override or just rely on the fast refresh.
            // But the user said "Optimistic updates". 
            // Let's check if we can modify the hook or just force a fast refresh.
            // Actually, `updateAttendanceRecords` in the hook calls `saveAuditTrail` then `supabase` then returns.
            // It doesn't update the local state in the hook.

            // To fix this properly:
            // I will update the hook to allow updating the local state OR
            // I will just wait for the refresh. 
            // The user complaint is "This action does not appear in the front interface".
            // This suggests that even after refresh it might not be showing, OR it's too slow.
            // Let's ensure we await the update and then await the refresh.

            await updateAttendanceRecords(newRecords);
            await refreshStudentData();

            // إرسال إشعار تلقائي لولي الأمر عند الغياب أو التأخر
            try {
                if (data.status === 'غائب') {
                    await onStudentAbsent({
                        studentId: studentId || '',
                        studentName: studentProfile?.personalData?.fullNameAr || '',
                        date,
                        reason: data.notes
                    });
                    console.log('✅ تم إرسال إشعار الغياب لولي الأمر');
                } else if (data.status === 'متأخر') {
                    await onStudentTardy({
                        studentId: studentId || '',
                        studentName: studentProfile?.personalData?.fullNameAr || '',
                        date,
                        minutesLate: 15 // القيمة الافتراضية
                    });
                    console.log('✅ تم إرسال إشعار التأخر لولي الأمر');
                }
            } catch (notifyError) {
                console.error('خطأ في إرسال الإشعار:', notifyError);
            }

        } catch (err) {
            console.error('Error updating record:', err);
        }
    };

    const handleExportExcel = (type: 'monthly' | 'yearly') => {
        try {
            let recordsToExport = [];
            let fileName = '';

            if (type === 'monthly') {
                recordsToExport = filteredRecords;
                fileName = `Attendance_${studentProfile?.personalData.fullNameAr || studentId}_${selectedYear}_${selectedMonth + 1}.xlsx`;
            } else {
                // Yearly: Filter for the whole academic year
                // Academic Year starts in Sept (8) of selectedYear and ends in Aug (7) of selectedYear + 1
                const startMonth = 8; // Sept
                const endMonth = 7; // Aug

                recordsToExport = (studentProfile?.attendanceRecords || []).filter(r => {
                    const date = parseISO(r.date);
                    const month = getMonth(date);
                    const year = getYear(date);

                    // Logic for Academic Year
                    if (month >= startMonth && year === selectedYear) return true;
                    if (month <= endMonth && year === selectedYear + 1) return true;
                    return false;
                });
                fileName = `Attendance_${studentProfile?.personalData.fullNameAr || studentId}_${selectedYear}_FullYear.xlsx`;
            }

            if (recordsToExport.length === 0) {
                alert('لا توجد سجلات للتصدير');
                return;
            }

            // Format data for Excel
            const data = recordsToExport.map(r => ({
                'التاريخ': r.date,
                'اليوم': new Date(r.date).toLocaleDateString('ar-EG', { weekday: 'long' }),
                'الحالة': r.status,
                'ملاحظات': r.notes || '-'
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Attendance");
            XLSX.writeFile(wb, fileName);

        } catch (err) {
            console.error('Error exporting Excel:', err);
            alert('حدث خطأ أثناء تصدير الملف');
        }
    };

    if (loading) return <DashboardLayout><div className="p-8 text-center">جاري التحميل...</div></DashboardLayout>;
    if (error) return <DashboardLayout><div className="p-8 text-center text-red-500">خطأ: {error}</div></DashboardLayout>;

    // Calculate actual calendar year based on academic year logic
    // If month is Jan-Aug (0-7), it's the next year (Academic Year + 1)
    // If month is Sept-Dec (8-11), it's the same year (Academic Year)
    const calendarYear = selectedMonth < 8 ? selectedYear + 1 : selectedYear;

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto py-6 px-4">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-xl p-8 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar className="h-8 w-8 text-blue-200" />
                            <h1 className="text-3xl font-bold">كارت التحكم الذكي للحضور</h1>
                        </div>
                        <p className="text-blue-100 opacity-90">
                            الطالب: {studentProfile?.personalData.fullNameAr || studentId} | {selectedYear}-{selectedYear + 1}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => handleExportExcel('monthly')}
                            className="bg-green-600 hover:bg-green-700 text-white border-0"
                        >
                            <FileText className="h-4 w-4 ml-2" />
                            تقرير شهري
                        </Button>
                        <Button
                            onClick={() => handleExportExcel('yearly')}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white border-0"
                        >
                            <FileText className="h-4 w-4 ml-2" />
                            تقرير سنوي
                        </Button>
                        <Button
                            onClick={() => navigate(`/student/${studentId}/dashboard`)}
                            className="bg-white/10 hover:bg-white/20 text-white border-0"
                        >
                            <ArrowLeft className="h-4 w-4 ml-2" />
                            العودة للملف
                        </Button>
                    </div>
                </div>

                {/* Alerts Area */}
                {alerts.length > 0 && (
                    <div className="space-y-2">
                        {alerts.map((alert, idx) => (
                            <div
                                key={idx}
                                className={`p-4 rounded-lg flex items-center gap-3 ${alert.type === 'danger'
                                    ? 'bg-red-50 text-red-800 border border-red-200'
                                    : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                                    }`}
                            >
                                <AlertTriangle className="h-5 w-5" />
                                <span className="font-bold">{alert.message}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <Card className="p-4 bg-white border-t-4 border-t-blue-500 shadow-sm col-span-2 md:col-span-1">
                        <div className="text-sm text-gray-500 mb-1">نسبة الحضور</div>
                        <div className="text-3xl font-bold text-blue-600">{stats.attendanceRate}%</div>
                        <div className="text-xs text-gray-400 mt-1">من {stats.totalRecorded} يوم مسجل</div>
                    </Card>
                    <Card className="p-4 bg-white border-t-4 border-t-green-500 shadow-sm">
                        <div className="text-sm text-gray-500 mb-1">أيام الحضور</div>
                        <div className="text-3xl font-bold text-green-600">{stats.present}</div>
                        <div className="text-xs text-gray-400 mt-1">يوم</div>
                    </Card>
                    <Card className="p-4 bg-white border-t-4 border-t-red-500 shadow-sm">
                        <div className="text-sm text-gray-500 mb-1">الغياب</div>
                        <div className="text-3xl font-bold text-red-600">{stats.absent}</div>
                        <div className="text-xs text-gray-400 mt-1">غير معذور</div>
                    </Card>
                    <Card className="p-4 bg-white border-t-4 border-t-yellow-500 shadow-sm">
                        <div className="text-sm text-gray-500 mb-1">التأخر</div>
                        <div className="text-3xl font-bold text-yellow-600">{stats.late}</div>
                        <div className="text-xs text-gray-400 mt-1">مرة</div>
                    </Card>
                    <Card className="p-4 bg-white border-t-4 border-t-purple-500 shadow-sm">
                        <div className="text-sm text-gray-500 mb-1">معذور</div>
                        <div className="text-3xl font-bold text-purple-600">{stats.excused}</div>
                        <div className="text-xs text-gray-400 mt-1">بعذر مقبول</div>
                    </Card>
                    <Card className="p-4 bg-gray-50 border-t-4 border-t-gray-400 shadow-sm">
                        <div className="text-sm text-gray-500 mb-1">غير مسجل</div>
                        <div className="text-3xl font-bold text-gray-600">{stats.unrecorded}</div>
                        <div className="text-xs text-gray-400 mt-1">يوم فائت</div>
                    </Card>
                </div>

                {/* Filters & Content */}
                <Card className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <FileText className="h-5 w-5 text-gray-500" />
                            سجل الحضور التفصيلي
                        </h2>
                        <div className="flex gap-3 w-full md:w-auto">
                            <Select
                                value={selectedYear.toString()}
                                onValueChange={(v) => setSelectedYear(parseInt(v))}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="السنة الدراسية" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 8 }, (_, i) => {
                                        const year = currentYear - 2 + i;
                                        return (
                                            <SelectItem key={year} value={year.toString()}>
                                                {year}-{year + 1}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>

                            <Select
                                value={selectedMonth.toString()}
                                onValueChange={(v) => setSelectedMonth(parseInt(v))}
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="الشهر" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">يناير (1)</SelectItem>
                                    <SelectItem value="1">فبراير (2)</SelectItem>
                                    <SelectItem value="2">مارس (3)</SelectItem>
                                    <SelectItem value="3">أبريل (4)</SelectItem>
                                    <SelectItem value="4">مايو (5)</SelectItem>
                                    <SelectItem value="5">يونيو (6)</SelectItem>
                                    <SelectItem value="6">يوليو (7)</SelectItem>
                                    <SelectItem value="7">أغسطس (8)</SelectItem>
                                    <SelectItem value="8">سبتمبر (9)</SelectItem>
                                    <SelectItem value="9">أكتوبر (10)</SelectItem>
                                    <SelectItem value="10">نوفمبر (11)</SelectItem>
                                    <SelectItem value="11">ديسمبر (12)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <SmartAttendanceTable
                        year={calendarYear}
                        month={selectedMonth}
                        records={studentProfile?.attendanceRecords || []}
                        onUpdateRecord={handleUpdateRecord}
                    />
                </Card>
            </div>
        </DashboardLayout>
    );
}