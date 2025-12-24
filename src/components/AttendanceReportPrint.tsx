/**
 * AttendanceReportPrint - مكون طباعة تقارير الحضور والغياب للطلاب
 * يستخدم نفس النمط المعتمد في FinancialReportPrint
 */
import { forwardRef } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { LevelReport } from '@/utils/reportUtils';

interface ClassRecord {
    index: number;
    classId?: string;
    className: string;
    enrolled: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    absenceRate: number;
}

interface StageRecord {
    stageId: string;
    stageName: string;
    summary?: {
        totalClasses?: number;
        totalEnrolled: number;
        totalPresent: number;
        totalAbsent: number;
        totalLate: number;
        totalExcused: number;
        avgAbsenceRate: number;
    } | null;
    classes?: ClassRecord[];
}

interface DailyRecord {
    date: string;
    dayName: string;
    enrolled: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    absenceRate: number;
}

interface StudentRecord {
    index: number;
    studentId: string;
    name: string;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendanceRate: number;
    absenceRate: number;
}

interface AttendanceReportData {
    reportType: 'class' | 'stage' | 'school';
    dateRange: {
        startDate: string;
        endDate: string;
    };
    // تقرير الفصل
    classInfo?: {
        className: string;
        stageName: string;
    } | null;
    dailyRecords?: DailyRecord[];
    studentRecords?: StudentRecord[];
    classSummary?: {
        totalDays: number;
        avgPresent: number;
        avgAbsent: number;
        avgAbsenceRate: number;
    } | null;
    // تقرير المرحلة
    stageInfo?: {
        stageName: string;
    } | null;
    stageClasses?: ClassRecord[];
    stageSummary?: {
        totalClasses: number;
        totalEnrolled: number;
        totalPresent: number;
        totalAbsent: number;
        totalLate: number;
        totalExcused: number;
        avgAbsenceRate: number;
    } | null;
    // تقرير المدرسة
    schoolStages?: StageRecord[];
    schoolSummary?: {
        totalStages: number;
        totalClasses: number;
        totalEnrolled: number;
        totalPresent: number;
        totalAbsent: number;
        totalLate: number;
        totalExcused: number;
        avgAbsenceRate: number;
    } | null;
    levelReports?: LevelReport[];
    // معلومات إضافية
    selectedYear?: string;
    supervisorNotes?: string;
}

interface AttendanceReportPrintProps {
    data: AttendanceReportData;
    onClose?: () => void;
}

export const AttendanceReportPrint = ({ data, onClose }: AttendanceReportPrintProps) => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const getReportTitle = () => {
        switch (data.reportType) {
            case 'class': return 'تقرير الحضور والغياب - الفصل';
            case 'stage': return 'تقرير الحضور والغياب - المرحلة';
            case 'school': return 'تقرير الحضور والغياب - المدرسة الكامل';
            default: return 'تقرير الحضور والغياب';
        }
    };

    const getReportSubtitle = () => {
        if (data.reportType === 'class') {
            return `${data.classInfo?.stageName || ''} - ${data.classInfo?.className || 'غير محدد'}`;
        } else if (data.reportType === 'stage') {
            return data.stageInfo?.stageName || 'غير محدد';
        }
        return 'جميع المراحل الدراسية';
    };

    const formatDateRange = () => {
        if (data.dateRange.startDate === data.dateRange.endDate) {
            return format(new Date(data.dateRange.startDate), 'EEEE d MMMM yyyy', { locale: ar });
        }
        return `من ${format(new Date(data.dateRange.startDate), 'd MMMM yyyy', { locale: ar })} إلى ${format(new Date(data.dateRange.endDate), 'd MMMM yyyy', { locale: ar })}`;
    };

    // بناء محتوى الجدول حسب نوع التقرير
    const renderClassTable = () => {
        if (!data.studentRecords || data.studentRecords.length === 0) return '';

        return `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>م</th>
                        <th>اسم الطالب</th>
                        <th>أيام الحضور</th>
                        <th>أيام الغياب</th>
                        <th>أيام التأخير</th>
                        <th>نسبة الحضور</th>
                        <th>نسبة الغياب</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.studentRecords.map(s => `
                        <tr>
                            <td>${s.index}</td>
                            <td class="text-right">${s.name}</td>
                            <td class="success">${s.present}</td>
                            <td class="danger">${s.absent}</td>
                            <td class="warning">${s.late}</td>
                            <td>${s.attendanceRate}%</td>
                            <td class="${s.absenceRate > 20 ? 'danger' : ''}">${s.absenceRate}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    };

    const renderStageTable = () => {
        if (!data.stageClasses || data.stageClasses.length === 0) return '';

        return `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>م</th>
                        <th>الفصل</th>
                        <th>عدد المقيد</th>
                        <th>الحاضر</th>
                        <th>الغائب</th>
                        <th>المتأخر</th>
                        <th>المعذور</th>
                        <th>نسبة الغياب</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.stageClasses.map(c => `
                        <tr>
                            <td>${c.index}</td>
                            <td class="text-right font-bold">${c.className}</td>
                            <td>${c.enrolled}</td>
                            <td class="success">${c.present}</td>
                            <td class="danger">${c.absent}</td>
                            <td class="warning">${c.late}</td>
                            <td>${c.excused}</td>
                            <td class="${c.absenceRate > 15 ? 'danger' : ''}">${c.absenceRate}%</td>
                        </tr>
                    `).join('')}
                    ${data.stageSummary ? `
                        <tr class="summary-row">
                            <td colspan="2">إجمالي المرحلة</td>
                            <td>${data.stageSummary.totalEnrolled}</td>
                            <td>${data.stageSummary.totalPresent}</td>
                            <td>${data.stageSummary.totalAbsent}</td>
                            <td>${data.stageSummary.totalLate}</td>
                            <td>${data.stageSummary.totalExcused}</td>
                            <td>${data.stageSummary.avgAbsenceRate}%</td>
                        </tr>
                    ` : ''}
                </tbody>
            </table>
        `;
    };

    const renderSchoolTable = () => {
        if (!data.schoolStages || data.schoolStages.length === 0) return '';

        // إذا كان هناك تقارير حسب المستويات، نعرضها بشكل هرمي
        if (data.levelReports && data.levelReports.length > 0) {
            return `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>م</th>
                        <th>المرحلة الدراسية</th>
                        <th>عدد المقيد</th>
                        <th>إجمالي الحاضر</th>
                        <th>إجمالي الغائب</th>
                        <th>نسبة الحضور</th>
                        <th>نسبة الغياب</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.levelReports.map(level => {
                const activeLevelStages = level.stages.filter(s => s.summary && s.summary.totalEnrolled > 0);
                if (activeLevelStages.length === 0) return '';

                return `
                        <tr>
                            <td colspan="7" class="text-right font-bold" style="background-color: #f1f5f9; color: #4b5563;">${level.name}</td>
                        </tr>
                        ${activeLevelStages.map((stage, idx) => `
                            <tr>
                                <td>${idx + 1}</td>
                                <td class="text-right font-bold" style="padding-right: 20px;">${stage.stageName}</td>
                                <td>${stage.summary?.totalEnrolled || 0}</td>
                                <td class="success">${(stage.summary?.totalPresent || 0) + (stage.summary?.totalLate || 0)}</td>
                                <td class="danger">${stage.summary?.totalAbsent || 0}</td>
                                <td>${stage.summary && stage.summary.totalEnrolled > 0 ? Math.round(((stage.summary.totalPresent + stage.summary.totalLate) / stage.summary.totalEnrolled) * 100) : 0}%</td>
                                <td class="${(stage.summary?.avgAbsenceRate || 0) > 15 ? 'danger' : ''}">${stage.summary?.avgAbsenceRate || 0}%</td>
                            </tr>
                        `).join('')}
                        <tr class="summary-row" style="background-color: #e0f2fe !important;">
                             <td colspan="2">إجمالي ${level.name}</td>
                             <td>${level.summary.totalEnrolled}</td>
                             <td class="success">${level.summary.totalPresent + level.summary.totalLate}</td>
                             <td class="danger">${level.summary.totalAbsent}</td>
                             <td>${level.summary.avgAttendanceRate}%</td>
                             <td>${level.summary.avgAbsenceRate}%</td>
                        </tr>
                    `}).join('')}
                    
                     ${data.schoolSummary ? `
                        <tr class="total-row">
                            <td colspan="2">إجمالي المدرسة</td>
                            <td>${data.schoolSummary.totalEnrolled}</td>
                            <td class="success">${data.schoolSummary.totalPresent + data.schoolSummary.totalLate}</td>
                            <td class="danger">${data.schoolSummary.totalAbsent}</td>
                            <td>${data.schoolSummary.totalEnrolled > 0 ? Math.round(((data.schoolSummary.totalPresent + data.schoolSummary.totalLate) / data.schoolSummary.totalEnrolled) * 100) : 0}%</td>
                            <td>${data.schoolSummary.avgAbsenceRate}%</td>
                        </tr>
                    ` : ''}
                </tbody>
            </table>
        `;
        }

        const activeStages = data.schoolStages.filter(s => s.summary && s.summary.totalEnrolled > 0);

        return `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>م</th>
                        <th>المرحلة الدراسية</th>
                        <th>عدد المقيد</th>
                        <th>إجمالي الحاضر</th>
                        <th>إجمالي الغائب</th>
                        <th>نسبة الحضور</th>
                        <th>نسبة الغياب</th>
                    </tr>
                </thead>
                <tbody>
                    ${activeStages.map((stage, idx) => `
                        <tr>
                            <td>${idx + 1}</td>
                            <td class="text-right font-bold">${stage.stageName}</td>
                            <td>${stage.summary?.totalEnrolled || 0}</td>
                            <td class="success">${(stage.summary?.totalPresent || 0) + (stage.summary?.totalLate || 0)}</td>
                            <td class="danger">${stage.summary?.totalAbsent || 0}</td>
                            <td>${stage.summary && stage.summary.totalEnrolled > 0 ? Math.round(((stage.summary.totalPresent + stage.summary.totalLate) / stage.summary.totalEnrolled) * 100) : 0}%</td>
                            <td class="${(stage.summary?.avgAbsenceRate || 0) > 15 ? 'danger' : ''}">${stage.summary?.avgAbsenceRate || 0}%</td>
                        </tr>
                    `).join('')}
                    ${data.schoolSummary ? `
                        <tr class="total-row">
                            <td colspan="2">إجمالي المدرسة</td>
                            <td>${data.schoolSummary.totalEnrolled}</td>
                            <td class="success">${data.schoolSummary.totalPresent + data.schoolSummary.totalLate}</td>
                            <td class="danger">${data.schoolSummary.totalAbsent}</td>
                            <td>${data.schoolSummary.totalEnrolled > 0 ? Math.round(((data.schoolSummary.totalPresent + data.schoolSummary.totalLate) / data.schoolSummary.totalEnrolled) * 100) : 0}%</td>
                            <td>${data.schoolSummary.avgAbsenceRate}%</td>
                        </tr>
                    ` : ''}
                </tbody>
            </table>
        `;
    };

    const renderSummaryStats = () => {
        if (data.reportType === 'class' && data.classSummary) {
            const totalStudents = data.studentRecords?.length || 0;
            return `
                <div class="summary-strip">
                    <div class="summary-item-compact">
                        <span class="summary-label">إجمالي الطلاب:</span>
                        <span class="summary-value">${totalStudents}</span>
                    </div>
                    <div class="separator"></div>
                    <div class="summary-item-compact">
                        <span class="summary-label">أيام الدراسة:</span>
                        <span class="summary-value">${data.classSummary.totalDays}</span>
                    </div>
                    <div class="separator"></div>
                    <div class="summary-item-compact">
                        <span class="summary-label">متوسط الحاضرين:</span>
                        <span class="summary-value text-green-700">${data.classSummary.avgPresent}</span>
                    </div>
                    <div class="separator"></div>
                    <div class="summary-item-compact">
                        <span class="summary-label">نسبة الغياب:</span>
                        <span class="summary-value text-red-700">${data.classSummary.avgAbsenceRate}%</span>
                    </div>
                </div>
            `;
        } else if (data.reportType === 'stage' && data.stageSummary) {
            return `
                <div class="summary-strip">
                    <div class="summary-item-compact">
                        <span class="summary-label">عدد الفصول:</span>
                        <span class="summary-value">${data.stageSummary.totalClasses}</span>
                    </div>
                    <div class="separator"></div>
                    <div class="summary-item-compact">
                        <span class="summary-label">إجمالي المقيد:</span>
                        <span class="summary-value">${data.stageSummary.totalEnrolled}</span>
                    </div>
                    <div class="separator"></div>
                    <div class="summary-item-compact">
                        <span class="summary-label">إجمالي الحاضر:</span>
                        <span class="summary-value text-green-700">${data.stageSummary.totalPresent}</span>
                    </div>
                    <div class="separator"></div>
                    <div class="summary-item-compact">
                        <span class="summary-label">نسبة الغياب:</span>
                        <span class="summary-value text-red-700">${data.stageSummary.avgAbsenceRate}%</span>
                    </div>
                </div>
            `;
        } else if (data.reportType === 'school' && data.schoolSummary) {
            const activeStages = data.schoolStages?.filter(s => s.summary && s.summary.totalEnrolled > 0).length || 0;
            return `
                 <div class="summary-strip">
                    <div class="summary-item-compact">
                        <span class="summary-label">عدد المراحل:</span>
                        <span class="summary-value">${activeStages}</span>
                    </div>
                    <div class="separator"></div>
                    <div class="summary-item-compact">
                        <span class="summary-label">إجمالي المقيد:</span>
                        <span class="summary-value">${data.schoolSummary.totalEnrolled}</span>
                    </div>
                    <div class="separator"></div>
                    <div class="summary-item-compact">
                        <span class="summary-label">إجمالي الحاضر:</span>
                        <span class="summary-value text-green-700">${data.schoolSummary.totalPresent + data.schoolSummary.totalLate}</span>
                    </div>
                    <div class="separator"></div>
                    <div class="summary-item-compact">
                        <span class="summary-label">نسبة الغياب:</span>
                        <span class="summary-value text-red-700">${data.schoolSummary.avgAbsenceRate}%</span>
                    </div>
                </div>
            `;
        }
        return '';
    };

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${getReportTitle()} - ${getReportSubtitle()}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            size: A4;
            margin: 10mm; /* تقليل الهوامش الخارجية */
            direction: rtl;
        }

        @media print {
            body {
                background-color: white;
                padding: 0 !important; /* إزالة هوامش الجسم عند الطباعة */
            }
            .no-print {
                display: none !important;
            }
            .print-container {
                box-shadow: none;
                padding: 0 !important;
                max-width: none !important; /* إلغاء الحد الأقصى للعرض عند الطباعة */
                width: 100% !important;
                margin: 0 !important;
            }
        }

        body {
            font-family: 'Arial', 'Segoe UI', sans-serif;
            direction: rtl;
            text-align: right;
            background-color: #f5f5f5;
            padding: 20px;
            font-size: 12px;
        }

        .print-container {
            background-color: white;
            padding: 30px;
            max-width: 900px;
            margin: 0 auto;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }

        /* ترويسة التقرير الجديدة - 3 أعمدة */
        .report-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 10px;
            margin-bottom: 10px;
            height: 12%; /* ارتفاع تقريبي 10-12% من الصفحة */
        }

        .header-right {
            width: 20%;
            text-align: right;
        }

        .header-center {
            width: 60%;
            text-align: center;
        }

        .header-left {
            width: 20%;
            text-align: left;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .school-logo {
            height: 60px; /* تصغير الشعار قليلاً */
            max-width: 100%;
            object-fit: contain;
        }

        .school-name {
            font-size: 18px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 4px;
        }

        .report-title {
            font-size: 16px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 2px;
        }

        .report-subtitle {
            font-size: 12px;
            color: #4b5563;
        }

        .date-box {
            font-size: 11px;
            color: #4b5563;
            border: 1px solid #e5e7eb;
            padding: 4px;
            border-radius: 4px;
            background: #f9fafb;
            margin-bottom: 4px;
        }

        /* شريط الملخص الأفقي */
        .summary-strip {
            display: flex;
            justify-content: space-between;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 15px;
            margin-bottom: 15px;
            gap: 15px;
        }

        .summary-item-compact {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 11px;
        }

        .summary-label {
            color: #64748b;
            font-weight: 500;
        }

        .summary-value {
            font-weight: bold;
            color: #0f172a;
            font-size: 13px;
        }

        .separator {
            width: 1px;
            background-color: #cbd5e1;
            height: 20px;
            align-self: center;
        }

        /* جدول البيانات */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border: 1px solid #d1d5db;
        }

        .data-table th {
            background-color: #dbeafe !important;
            color: #1e3a8a !important;
            font-weight: bold;
            padding: 10px 8px;
            text-align: center;
            border: 1px solid #bfdbfe;
            font-size: 12px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .data-table td {
            padding: 8px;
            border: 1px solid #e5e7eb;
            font-size: 11px;
            text-align: center;
        }

        .data-table tr:nth-child(even) {
            background-color: #f9fafb;
        }

        .data-table .text-right {
            text-align: right;
        }

        .data-table .font-bold {
            font-weight: bold;
        }

        .data-table .success {
            color: #16a34a;
            font-weight: bold;
        }

        .data-table .danger {
            color: #dc2626;
            font-weight: bold;
        }

        .data-table .warning {
            color: #ca8a04;
        }

        .data-table .summary-row {
            background-color: #fef3c7 !important;
            font-weight: bold;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .data-table .total-row {
            background-color: #dcfce7 !important;
            font-weight: bold;
            font-size: 12px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        /* ملاحظات المشرف */
        .notes-section {
            margin-bottom: 20px;
            padding: 12px;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            background-color: #fefce8;
        }

        .notes-title {
            font-weight: bold;
            margin-bottom: 8px;
            color: #1f2937;
        }

        .notes-content {
            color: #4b5563;
            font-size: 12px;
            line-height: 1.6;
        }

        /* تذييل التقرير */
        .report-footer {
            margin-top: 30px;
            border-top: 2px solid #2563eb;
            padding-top: 15px;
            text-align: center;
        }

        .footer-date {
            font-size: 11px;
            color: #6b7280;
            margin-bottom: 20px;
        }

        .signature-section {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-top: 30px;
        }

        .signature-line {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
        }

        .signature-space {
            border-top: 1px solid #1f2937;
            width: 100%;
            height: 50px;
            margin-bottom: 8px;
        }

        .signature-label {
            font-size: 11px;
            font-weight: bold;
            color: #1f2937;
        }

        /* زر الطباعة */
        .print-button-container {
            text-align: center;
            padding: 15px;
        }

        .print-button {
            background-color: #3b82f6;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            font-weight: bold;
            margin: 0 5px;
        }

        .print-button:hover {
            background-color: #2563eb;
        }

        .close-button {
            background-color: #6b7280;
        }

        .close-button:hover {
            background-color: #4b5563;
        }
    </style>
</head>
<body>
    <div class="print-button-container no-print">
        <button class="print-button" onclick="window.print()">طباعة التقرير</button>
        <button class="print-button close-button" onclick="window.close()">إغلاق</button>
    </div>

    <div class="print-container">
        <!-- ترويسة التقرير -->
        <!-- ترويسة التقرير الجديدة - 3 أعمدة -->
        <div class="report-header">
            <div class="header-right">
                <img src="/شعار المدرسة.jpg" alt="شعار المدرسة" class="school-logo" onerror="this.style.display='none'">
            </div>
            
            <div class="header-center">
                <div class="school-name">مدرسة جاد الله</div>
                <div class="report-title">${getReportTitle()}</div>
                <div class="report-subtitle">${getReportSubtitle()}</div>
            </div>

            <div class="header-left">
                <div class="date-box">
                    <div>التاريخ: ${formattedDate}</div>
                </div>
                <div class="date-box">
                    <div>العام: ${data.selectedYear || '2024-2025'}</div>
                </div>
                <div class="date-box" style="margin-top:2px; font-size:10px;">
                    ${formatDateRange()}
                </div>
            </div>
        </div>

        <!-- الملخص الإحصائي -->
        ${renderSummaryStats()}

        <!-- جدول البيانات -->
        ${data.reportType === 'class' ? renderClassTable() : ''}
        ${data.reportType === 'stage' ? renderStageTable() : ''}
        ${data.reportType === 'school' ? renderSchoolTable() : ''}

        <!-- ملاحظات المشرف -->
        ${data.supervisorNotes ? `
            <div class="notes-section">
                <div class="notes-title">ملاحظات المشرف:</div>
                <div class="notes-content">${data.supervisorNotes}</div>
            </div>
        ` : ''}

        <!-- تذييل التقرير -->
        <div class="report-footer">
            <div class="footer-date">تاريخ الطباعة: ${formattedDate}</div>
            <div class="signature-section">
                <div class="signature-line">
                    <div class="signature-space"></div>
                    <div class="signature-label">مشرف الغياب</div>
                </div>
                <div class="signature-line">
                    <div class="signature-space"></div>
                    <div class="signature-label">وكيل المدرسة</div>
                </div>
                <div class="signature-line">
                    <div class="signature-space"></div>
                    <div class="signature-label">مدير المدرسة</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
    `;

    // فتح نافذة الطباعة
    const newWindow = window.open('', '', 'width=900,height=1200');
    if (newWindow) {
        newWindow.document.write(html);
        newWindow.document.close();
        newWindow.focus();
        onClose?.();
    } else {
        alert('يرجى السماح بفتح النوافذ المنبثقة لاستخدام ميزة الطباعة');
        onClose?.();
    }

    return null;
};

export default AttendanceReportPrint;
