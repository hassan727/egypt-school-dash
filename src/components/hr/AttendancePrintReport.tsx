/**
 * AttendancePrintReport - مكون طباعة تقارير الحضور الاحترافية
 * Professional Attendance Print Report Component
 */
import { forwardRef } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface AttendanceRecord {
    id: string;
    date: string;
    check_in_time: string | null;
    check_out_time: string | null;
    status: string;
    late_minutes: number;
    worked_hours: number;
    employee?: {
        employee_id: string;
        full_name: string;
        department: string;
        position: string;
    };
}

interface AttendancePrintReportProps {
    records: AttendanceRecord[];
    dateRange: {
        startDate: string;
        endDate: string;
    };
    reportType: 'daily' | 'weekly' | 'monthly';
    stats: {
        total: number;
        present: number;
        late: number;
        absent: number;
        onLeave: number;
        onPermission: number;
    };
    ministryHeader?: string;
    directorate?: string;
    organizationName?: string;
    organizationLogo?: string;
    academicYear?: string;
}

const statusLabels: Record<string, string> = {
    'حاضر': 'حاضر',
    'متأخر': 'متأخر',
    'غائب': 'غائب',
    'إجازة': 'إجازة',
    'إذن': 'إذن',
    'مأمورية': 'مأمورية',
};

export const AttendancePrintReport = forwardRef<HTMLDivElement, AttendancePrintReportProps>(
    ({ records, dateRange, reportType, stats, organizationName = 'المدرسة', organizationLogo, ministryHeader, directorate, academicYear }, ref) => {
        const reportTypeLabels: Record<string, string> = {
            daily: 'تقرير الحضور اليومي',
            weekly: 'تقرير الحضور الأسبوعي',
            monthly: 'تقرير الحضور الشهري',
        };

        const formatReportDate = () => {
            const start = new Date(dateRange.startDate);
            const end = new Date(dateRange.endDate);

            if (reportType === 'daily') {
                return format(start, 'EEEE, d MMMM yyyy', { locale: ar });
            }
            return `${format(start, 'd MMMM yyyy', { locale: ar })} - ${format(end, 'd MMMM yyyy', { locale: ar })}`;
        };

        const printDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ar });

        return (
            <div ref={ref} className="print-report bg-white p-8 max-w-[210mm] mx-auto" dir="rtl">
                {/* Header - Official Style */}
                <div className="hidden print:block print-official-header mb-6">
                    <div className="print-header-row flex justify-between items-center border-b-2 border-black pb-4">
                        <div className="text-right">
                            <p className="font-bold text-sm">{ministryHeader || 'وزارة التربية والتعليم'}</p>
                            <p className="font-bold text-sm">{directorate || 'مديرية التربية والتعليم'}</p>
                        </div>
                        <div className="text-center">
                            <h1 className="text-xl font-bold mb-2">{organizationName}</h1>
                            {organizationLogo && (
                                <img src={organizationLogo} alt="Logo" className="h-16 w-auto mx-auto object-contain" />
                            )}
                        </div>
                        <div className="text-left">
                            <p className="text-sm">عام دراسي: {academicYear || new Date().getFullYear()}</p>
                            <p className="text-sm">تاريخ الطباعة: {printDate}</p>
                        </div>
                    </div>
                    <div className="text-center bg-gray-100 py-2 mt-2 border border-black">
                        <h2 className="text-lg font-bold">{reportTypeLabels[reportType]}</h2>
                        <p className="text-xs">{formatReportDate()}</p>
                    </div>
                </div>

                {/* Screen Header (Hidden in Print) */}
                <div className="print:hidden flex items-center justify-between border-b-2 border-gray-800 pb-4 mb-6">
                    <div className="flex items-center gap-4">
                        {organizationLogo ? (
                            <img src={organizationLogo} alt="Logo" className="h-16 w-16 object-contain" />
                        ) : (
                            <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                م
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{organizationName}</h1>
                            <p className="text-gray-500">نظام إدارة الموارد البشرية</p>
                        </div>
                    </div>
                    <div className="text-left">
                        <h2 className="text-xl font-bold text-blue-600">{reportTypeLabels[reportType]}</h2>
                        <p className="text-gray-600">{formatReportDate()}</p>
                    </div>
                </div>

                {/* Statistics Summary */}
                <div className="grid grid-cols-6 gap-2 mb-6 text-center">
                    <div className="p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="text-xs text-blue-600">الإجمالي</p>
                        <p className="text-lg font-bold text-blue-800">{stats.total}</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded border border-green-200">
                        <p className="text-xs text-green-600">حاضر</p>
                        <p className="text-lg font-bold text-green-800">{stats.present}</p>
                    </div>
                    <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                        <p className="text-xs text-yellow-600">متأخر</p>
                        <p className="text-lg font-bold text-yellow-800">{stats.late}</p>
                    </div>
                    <div className="p-2 bg-red-50 rounded border border-red-200">
                        <p className="text-xs text-red-600">غائب</p>
                        <p className="text-lg font-bold text-red-800">{stats.absent}</p>
                    </div>
                    <div className="p-2 bg-indigo-50 rounded border border-indigo-200">
                        <p className="text-xs text-indigo-600">إجازة</p>
                        <p className="text-lg font-bold text-indigo-800">{stats.onLeave}</p>
                    </div>
                    <div className="p-2 bg-purple-50 rounded border border-purple-200">
                        <p className="text-xs text-purple-600">إذن/مأمورية</p>
                        <p className="text-lg font-bold text-purple-800">{stats.onPermission}</p>
                    </div>
                </div>

                {/* Attendance Table */}
                <table className="w-full border-collapse mb-6">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-2 text-right text-sm font-bold">#</th>
                            <th className="border border-gray-300 p-2 text-right text-sm font-bold">الكود</th>
                            <th className="border border-gray-300 p-2 text-right text-sm font-bold">اسم الموظف</th>
                            <th className="border border-gray-300 p-2 text-right text-sm font-bold">القسم</th>
                            <th className="border border-gray-300 p-2 text-center text-sm font-bold">الحضور</th>
                            <th className="border border-gray-300 p-2 text-center text-sm font-bold">الانصراف</th>
                            <th className="border border-gray-300 p-2 text-center text-sm font-bold">الساعات</th>
                            <th className="border border-gray-300 p-2 text-center text-sm font-bold">الحالة</th>
                            <th className="border border-gray-300 p-2 text-center text-sm font-bold">التأخير</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((record, index) => (
                            <tr key={record.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="border border-gray-300 p-2 text-sm">{index + 1}</td>
                                <td className="border border-gray-300 p-2 text-sm font-mono">{record.employee?.employee_id}</td>
                                <td className="border border-gray-300 p-2 text-sm font-medium">{record.employee?.full_name}</td>
                                <td className="border border-gray-300 p-2 text-sm">{record.employee?.department || '-'}</td>
                                <td className="border border-gray-300 p-2 text-sm text-center font-mono">
                                    {record.check_in_time ? record.check_in_time.substring(0, 5) : '--:--'}
                                </td>
                                <td className="border border-gray-300 p-2 text-sm text-center font-mono">
                                    {record.check_out_time ? record.check_out_time.substring(0, 5) : '--:--'}
                                </td>
                                <td className="border border-gray-300 p-2 text-sm text-center">
                                    {record.worked_hours ? `${record.worked_hours.toFixed(1)}` : '-'}
                                </td>
                                <td className="border border-gray-300 p-2 text-sm text-center">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium
                    ${record.status === 'حاضر' ? 'bg-green-100 text-green-700' :
                                            record.status === 'متأخر' ? 'bg-yellow-100 text-yellow-700' :
                                                record.status === 'غائب' ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'}`}>
                                        {statusLabels[record.status] || record.status}
                                    </span>
                                </td>
                                <td className="border border-gray-300 p-2 text-sm text-center">
                                    {record.late_minutes > 0 ? `${record.late_minutes} د` : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Footer */}
                <div className="border-t-2 border-gray-300 pt-4 mt-8">
                    <div className="flex justify-between text-sm text-gray-500">
                        <div>
                            <p>تم الطباعة بواسطة: مسؤول الموارد البشرية</p>
                            <p>تاريخ الطباعة: {printDate}</p>
                        </div>
                        <div className="text-left">
                            <p>نظام إدارة المدرسة</p>
                            <p>جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
                        </div>
                    </div>
                </div>

                {/* Print Styles */}
                <style>{`
          @media print {
            .print-report {
              width: 100%;
              max-width: none;
              padding: 0;
              font-size: 10pt;
            }
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-official-header {
                display: block !important;
                width: 100%;
            }
            .print-header-row {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                width: 100%;
            }
          }
        `}</style>
            </div>
        );
    }
);

AttendancePrintReport.displayName = 'AttendancePrintReport';

export default AttendancePrintReport;
