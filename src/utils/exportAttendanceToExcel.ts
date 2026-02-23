/**
 * ذكي: تصدير سجلات الحضور إلى Excel مع التنسيق والألوان
 * Smart: Export attendance records to Excel with formatting and colors
 */
import * as XLSX from 'xlsx';
import { AttendanceRecord } from '@/hooks/useEmployeeAttendance';

interface ExportOptions {
    filename?: string;
    sheetName?: string;
    dateRange?: {
        startDate: string;
        endDate: string;
    };
    filters?: {
        status?: string;
        department?: string;
    };
}

interface AttendanceStats {
    total: number;
    present: number;
    late: number;
    absent: number;
    onLeave: number;
    onPermission: number;
}

export const exportAttendanceToExcel = (
    records: AttendanceRecord[],
    stats: AttendanceStats,
    options: ExportOptions = {}
) => {
    try {
        const {
            filename = `سجل_البصمة_${new Date().toLocaleDateString('ar-EG')}.xlsx`,
            sheetName = 'سجل البصمة',
            dateRange,
            filters,
        } = options;

        // بيانات الجدول الرئيسي
        const tableData = records.map((record) => ({
            الكود: record.employee?.employee_id || '-',
            الموظف: record.employee?.full_name || '-',
            القسم: record.employee?.department || '-',
            الوظيفة: record.employee?.position || '-',
            التاريخ: record.date,
            الحضور: record.check_in_time ? record.check_in_time.substring(0, 5) : '-',
            الانصراف: record.check_out_time ? record.check_out_time.substring(0, 5) : '-',
            الساعات: record.worked_hours ? record.worked_hours.toFixed(1) : '-',
            التأخير: record.late_minutes ? `${record.late_minutes} د` : '-',
            الحالة: record.status,
            ملاحظات: record.notes || '-',
        }));

        // بيانات الإحصائيات
        const statsData = [
            ['الإحصائيات', ''],
            ['الإجمالي', stats.total],
            ['حاضر', stats.present],
            ['متأخر', stats.late],
            ['غائب', stats.absent],
            ['إجازة', stats.onLeave],
            ['إذن/مأمورية', stats.onPermission],
        ];

        // إنشاء workbook
        const wb = XLSX.utils.book_new();

        // إضافة بيانات الجدول الرئيسي
        const ws = XLSX.utils.json_to_sheet(tableData, {
            header: [
                'الكود',
                'الموظف',
                'القسم',
                'الوظيفة',
                'التاريخ',
                'الحضور',
                'الانصراف',
                'الساعات',
                'التأخير',
                'الحالة',
                'ملاحظات',
            ],
        });

        // تنسيق العمود - عرض الأعمدة
        ws['!cols'] = [
            { wch: 12 }, // الكود
            { wch: 20 }, // الموظف
            { wch: 15 }, // القسم
            { wch: 15 }, // الوظيفة
            { wch: 12 }, // التاريخ
            { wch: 10 }, // الحضور
            { wch: 10 }, // الانصراف
            { wch: 10 }, // الساعات
            { wch: 10 }, // التأخير
            { wch: 10 }, // الحالة
            { wch: 25 }, // ملاحظات
        ];

        // دالة ذكية لتعيين الألوان حسب الحالة
        const getStatusColor = (status: string) => {
            switch (status) {
                case 'حاضر':
                    return 'FFD9E8F5'; // أزرق فاتح
                case 'متأخر':
                    return 'FFFFECB3'; // أصفر فاتح
                case 'غائب':
                    return 'FFFFCCCC'; // أحمر فاتح
                case 'إجازة':
                    return 'FFC5E1A5'; // أخضر فاتح
                case 'إذن':
                case 'مأمورية':
                    return 'FFE1BEE7'; // بنفسجي فاتح
                default:
                    return 'FFFFFFFF'; // أبيض
            }
        };

        // تطبيق الألوان على الخلايا
        for (let i = 2; i <= tableData.length + 1; i++) {
            const statusCell = `J${i}`;
            const status = tableData[i - 2]?.الحالة;

            if (ws[statusCell]) {
                ws[statusCell].s = {
                    fill: { fgColor: { rgb: getStatusColor(status) } },
                    font: { bold: true, color: { rgb: 'FF000000' } },
                    alignment: { horizontal: 'center', vertical: 'center' },
                };
            }

            // تنسيق الرقم
            const numberCells = [`H${i}`, `I${i}`];
            numberCells.forEach((cell) => {
                if (ws[cell]) {
                    ws[cell].s = {
                        alignment: { horizontal: 'center' },
                    };
                }
            });
        }

        // تنسيق الرؤوس
        const headerCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1'];
        headerCells.forEach((cell) => {
            if (ws[cell]) {
                ws[cell].s = {
                    fill: { fgColor: { rgb: 'FF4472C4' } },
                    font: { bold: true, color: { rgb: 'FFFFFFFF' } },
                    alignment: { horizontal: 'center', vertical: 'center' },
                };
            }
        });

        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        // إضافة ورقة الإحصائيات
        const statsWs = XLSX.utils.aoa_to_sheet(statsData);
        statsWs['!cols'] = [{ wch: 20 }, { wch: 15 }];

        // تنسيق الإحصائيات
        for (let i = 0; i < statsData.length; i++) {
            const cell = `A${i + 1}`;
            if (statsWs[cell]) {
                statsWs[cell].s = {
                    font: { bold: true },
                    fill:
                        i === 0
                            ? { fgColor: { rgb: 'FF4472C4' } }
                            : { fgColor: { rgb: 'FFD9E8F5' } },
                };
            }
        }

        XLSX.utils.book_append_sheet(wb, statsWs, 'الإحصائيات');

        // إضافة معلومات التصدير
        const infoData = [
            ['معلومات التصدير', ''],
            ['تاريخ التصدير', new Date().toLocaleString('ar-EG')],
            ['نطاق التاريخ', `${dateRange?.startDate || '-'} إلى ${dateRange?.endDate || '-'}`],
            ['الفلاتر المفعلة', ''],
            ['الحالة', filters?.status || 'الكل'],
            ['القسم', filters?.department || 'الكل'],
        ];

        const infoWs = XLSX.utils.aoa_to_sheet(infoData);
        infoWs['!cols'] = [{ wch: 20 }, { wch: 30 }];
        XLSX.utils.book_append_sheet(wb, infoWs, 'معلومات');

        // حفظ الملف
        XLSX.writeFile(wb, filename);

        return true;
    } catch (error) {
        console.error('خطأ في تصدير Excel:', error);
        throw error;
    }
};

// دالة مساعدة لتصدير بتنسيق مبسط (سريع)
export const quickExportAttendance = (records: AttendanceRecord[], filename?: string) => {
    const data = records.map((record) => ({
        الكود: record.employee?.employee_id || '-',
        الموظف: record.employee?.full_name || '-',
        التاريخ: record.date,
        الحالة: record.status,
        الحضور: record.check_in_time?.substring(0, 5) || '-',
        الانصراف: record.check_out_time?.substring(0, 5) || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'سجل البصمة');
    XLSX.writeFile(wb, filename || `سجل_البصمة_${new Date().toLocaleDateString('ar-EG')}.xlsx`);
};
