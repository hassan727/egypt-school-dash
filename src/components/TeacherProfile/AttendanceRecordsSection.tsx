import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    CalendarDays,
    Plane,
    FileText
} from 'lucide-react';
import { useState } from 'react';
import { TeacherAttendanceRecord, LeaveRequest, LeaveBalance } from '@/types/teacher';

interface AttendanceRecordsSectionProps {
    attendanceRecords: TeacherAttendanceRecord[];
    leaveRequests: LeaveRequest[];
    leaveBalance?: LeaveBalance;
    onCreateLeaveRequest?: (data: Partial<LeaveRequest>) => Promise<boolean>;
}

export function AttendanceRecordsSection({
    attendanceRecords,
    leaveRequests,
    leaveBalance
}: AttendanceRecordsSectionProps) {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // حسابات ديناميكية
    const currentMonthRecords = attendanceRecords.filter(r => {
        const date = new Date(r.date);
        return date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear;
    });

    const presentDays = currentMonthRecords.filter(r => r.status === 'حاضر').length;
    const absentDays = currentMonthRecords.filter(r => r.status === 'غائب').length;
    const lateDays = currentMonthRecords.filter(r => r.status === 'متأخر').length;
    const leaveDays = currentMonthRecords.filter(r => r.status === 'إجازة').length;

    const attendanceRate = currentMonthRecords.length > 0
        ? Math.round(((presentDays + lateDays) / currentMonthRecords.length) * 100)
        : 100;

    const totalLateMinutes = currentMonthRecords.reduce((sum, r) => sum + r.lateMinutes, 0);

    return (
        <div className="space-y-6">
            {/* بطاقات الملخص */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* نسبة الحضور */}
                <Card className="p-5 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-green-200">
                            <CheckCircle className="h-6 w-6 text-green-700" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-green-700">{attendanceRate}%</p>
                            <p className="text-sm text-green-600">نسبة الحضور</p>
                        </div>
                    </div>
                </Card>

                {/* أيام الحضور */}
                <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-blue-700">{presentDays}</p>
                        <p className="text-sm text-blue-600">يوم حضور</p>
                    </div>
                </Card>

                {/* أيام الغياب */}
                <Card className="p-5 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-red-700">{absentDays}</p>
                        <p className="text-sm text-red-600">يوم غياب</p>
                    </div>
                </Card>

                {/* أيام التأخر */}
                <Card className="p-5 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-yellow-700">{lateDays}</p>
                        <p className="text-sm text-yellow-600">يوم تأخر</p>
                        <p className="text-xs text-yellow-500 mt-1">{totalLateMinutes} دقيقة</p>
                    </div>
                </Card>

                {/* أيام الإجازة */}
                <Card className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-purple-700">{leaveDays}</p>
                        <p className="text-sm text-purple-600">يوم إجازة</p>
                    </div>
                </Card>
            </div>

            {/* أرصدة الإجازات */}
            {leaveBalance && (
                <Card className="p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-purple-600" />
                        أرصدة الإجازات
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* الإجازة السنوية */}
                        <div className="p-4 bg-blue-50 rounded-lg text-center">
                            <div className="relative w-20 h-20 mx-auto mb-2">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="40" cy="40" r="35" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                                    <circle
                                        cx="40"
                                        cy="40"
                                        r="35"
                                        fill="none"
                                        stroke="#3b82f6"
                                        strokeWidth="8"
                                        strokeDasharray={`${((leaveBalance.annualLeaveBalance - leaveBalance.annualLeaveUsed) / leaveBalance.annualLeaveBalance) * 220} 220`}
                                    />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center font-bold text-lg text-blue-700">
                                    {leaveBalance.annualLeaveBalance - leaveBalance.annualLeaveUsed}
                                </span>
                            </div>
                            <p className="font-semibold text-blue-700">إجازة سنوية</p>
                            <p className="text-xs text-gray-500">من {leaveBalance.annualLeaveBalance} يوم</p>
                        </div>

                        {/* الإجازة المرضية */}
                        <div className="p-4 bg-red-50 rounded-lg text-center">
                            <div className="relative w-20 h-20 mx-auto mb-2">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="40" cy="40" r="35" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                                    <circle
                                        cx="40"
                                        cy="40"
                                        r="35"
                                        fill="none"
                                        stroke="#ef4444"
                                        strokeWidth="8"
                                        strokeDasharray={`${((leaveBalance.sickLeaveBalance - leaveBalance.sickLeaveUsed) / leaveBalance.sickLeaveBalance) * 220} 220`}
                                    />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center font-bold text-lg text-red-700">
                                    {leaveBalance.sickLeaveBalance - leaveBalance.sickLeaveUsed}
                                </span>
                            </div>
                            <p className="font-semibold text-red-700">إجازة مرضية</p>
                            <p className="text-xs text-gray-500">من {leaveBalance.sickLeaveBalance} يوم</p>
                        </div>

                        {/* الإجازة الطارئة */}
                        <div className="p-4 bg-orange-50 rounded-lg text-center">
                            <div className="relative w-20 h-20 mx-auto mb-2">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="40" cy="40" r="35" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                                    <circle
                                        cx="40"
                                        cy="40"
                                        r="35"
                                        fill="none"
                                        stroke="#f97316"
                                        strokeWidth="8"
                                        strokeDasharray={`${((leaveBalance.emergencyLeaveBalance - leaveBalance.emergencyLeaveUsed) / leaveBalance.emergencyLeaveBalance) * 220} 220`}
                                    />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center font-bold text-lg text-orange-700">
                                    {leaveBalance.emergencyLeaveBalance - leaveBalance.emergencyLeaveUsed}
                                </span>
                            </div>
                            <p className="font-semibold text-orange-700">إجازة طارئة</p>
                            <p className="text-xs text-gray-500">من {leaveBalance.emergencyLeaveBalance} يوم</p>
                        </div>

                        {/* الإجازة العارضة */}
                        <div className="p-4 bg-green-50 rounded-lg text-center">
                            <div className="relative w-20 h-20 mx-auto mb-2">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="40" cy="40" r="35" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                                    <circle
                                        cx="40"
                                        cy="40"
                                        r="35"
                                        fill="none"
                                        stroke="#22c55e"
                                        strokeWidth="8"
                                        strokeDasharray={`${((leaveBalance.casualLeaveBalance - leaveBalance.casualLeaveUsed) / leaveBalance.casualLeaveBalance) * 220} 220`}
                                    />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center font-bold text-lg text-green-700">
                                    {leaveBalance.casualLeaveBalance - leaveBalance.casualLeaveUsed}
                                </span>
                            </div>
                            <p className="font-semibold text-green-700">إجازة عارضة</p>
                            <p className="text-xs text-gray-500">من {leaveBalance.casualLeaveBalance} يوم</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* سجل الحضور الشهري */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        سجل الحضور
                    </h3>
                    <div className="flex items-center gap-2">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="border rounded-lg p-2 text-sm"
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                                <option key={m} value={m}>{getMonthName(m)}</option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="border rounded-lg p-2 text-sm"
                        >
                            {[2024, 2025, 2026].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {currentMonthRecords.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-right p-3">التاريخ</th>
                                    <th className="text-right p-3">الحالة</th>
                                    <th className="text-right p-3">وقت الحضور</th>
                                    <th className="text-right p-3">وقت الانصراف</th>
                                    <th className="text-right p-3">التأخير</th>
                                    <th className="text-right p-3">ملاحظات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {currentMonthRecords.map((record, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="p-3 font-medium">{record.date}</td>
                                        <td className="p-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${record.status === 'حاضر' ? 'bg-green-100 text-green-700' :
                                                    record.status === 'غائب' ? 'bg-red-100 text-red-700' :
                                                        record.status === 'متأخر' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-purple-100 text-purple-700'
                                                }`}>
                                                {record.status === 'حاضر' && <CheckCircle className="h-3 w-3" />}
                                                {record.status === 'غائب' && <XCircle className="h-3 w-3" />}
                                                {record.status === 'متأخر' && <Clock className="h-3 w-3" />}
                                                {record.status === 'إجازة' && <Plane className="h-3 w-3" />}
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="p-3">{record.checkInTime || '-'}</td>
                                        <td className="p-3">{record.checkOutTime || '-'}</td>
                                        <td className="p-3">
                                            {record.lateMinutes > 0 ? (
                                                <span className="text-yellow-600">{record.lateMinutes} دقيقة</span>
                                            ) : '-'}
                                        </td>
                                        <td className="p-3 text-gray-500">{record.notes || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>لا توجد سجلات حضور لهذا الشهر</p>
                    </div>
                )}
            </Card>

            {/* طلبات الإجازات */}
            <Card className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Plane className="h-5 w-5 text-blue-600" />
                    طلبات الإجازات
                </h3>

                {leaveRequests.length > 0 ? (
                    <div className="space-y-3">
                        {leaveRequests.map((request, index) => (
                            <div
                                key={index}
                                className={`p-4 rounded-lg border ${request.status === 'موافق عليه' ? 'bg-green-50 border-green-200' :
                                        request.status === 'مرفوض' ? 'bg-red-50 border-red-200' :
                                            request.status === 'ملغي' ? 'bg-gray-50 border-gray-200' :
                                                'bg-yellow-50 border-yellow-200'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                {request.leaveType}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${request.status === 'موافق عليه' ? 'bg-green-100 text-green-700' :
                                                    request.status === 'مرفوض' ? 'bg-red-100 text-red-700' :
                                                        request.status === 'ملغي' ? 'bg-gray-100 text-gray-600' :
                                                            'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {request.status}
                                            </span>
                                        </div>
                                        <p className="font-medium">
                                            من {request.startDate} إلى {request.endDate}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            ({request.totalDays} يوم)
                                        </p>
                                        {request.reason && (
                                            <p className="text-sm text-gray-600 mt-2">{request.reason}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        {request.approvedBy && (
                                            <p className="text-xs text-gray-500">
                                                الموافقة: {request.approvedBy}
                                            </p>
                                        )}
                                        {request.rejectionReason && (
                                            <p className="text-xs text-red-600 mt-1">
                                                سبب الرفض: {request.rejectionReason}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>لا توجد طلبات إجازات</p>
                    </div>
                )}
            </Card>
        </div>
    );
}

function getMonthName(month: number): string {
    const months = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[month - 1] || '-';
}
