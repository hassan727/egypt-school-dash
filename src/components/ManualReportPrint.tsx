import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { sortStagesByName } from '@/utils/reportUtils';

interface ManualClassEntry {
    stageId: string;
    stageName: string;
    classId: string;
    className: string;
    enrolled: number;
    present: number;
    absent: number;
    attendanceRate: number;
    absenceRate: number;
}

interface ManualReportPrintProps {
    entries: ManualClassEntry[];
    academicYear: string;
    schoolName?: string;
}

interface StageSummary {
    stageId: string;
    stageName: string;
    totalEnrolled: number;
    totalPresent: number;
    totalAbsent: number;
    attendanceRate: number;
    absenceRate: number;
    classes: ManualClassEntry[];
}

export const ManualReportPrint = ({
    entries,
    academicYear,
    schoolName = 'مدرسة جاد الله'
}: ManualReportPrintProps) => {
    const today = new Date();
    const formattedDate = format(today, 'yyyy/MM/dd');

    // تجميع البيانات حسب المرحلة
    const stagesSummary: StageSummary[] = [];
    const stagesMap = new Map<string, ManualClassEntry[]>();

    entries.forEach(entry => {
        if (!stagesMap.has(entry.stageId)) {
            stagesMap.set(entry.stageId, []);
        }
        stagesMap.get(entry.stageId)!.push(entry);
    });

    stagesMap.forEach((classes, stageId) => {
        // ترتيب الفصول داخل المرحلة أبجدياً
        const sortedClasses = classes.sort((a, b) => a.className.localeCompare(b.className, 'ar'));

        const totalEnrolled = sortedClasses.reduce((sum, c) => sum + c.enrolled, 0);
        const totalPresent = sortedClasses.reduce((sum, c) => sum + c.present, 0);
        const totalAbsent = sortedClasses.reduce((sum, c) => sum + c.absent, 0);
        const attendanceRate = totalEnrolled > 0 ? Math.round((totalPresent / totalEnrolled) * 100) : 0;
        const absenceRate = totalEnrolled > 0 ? Math.round((totalAbsent / totalEnrolled) * 100) : 0;

        stagesSummary.push({
            stageId,
            stageName: sortedClasses[0].stageName,
            totalEnrolled,
            totalPresent,
            totalAbsent,
            attendanceRate,
            absenceRate,
            classes: sortedClasses
        });
    });

    // إجمالي المدرسة
    const schoolTotalEnrolled = stagesSummary.reduce((sum, s) => sum + s.totalEnrolled, 0);
    const schoolTotalPresent = stagesSummary.reduce((sum, s) => sum + s.totalPresent, 0);
    const schoolTotalAbsent = stagesSummary.reduce((sum, s) => sum + s.totalAbsent, 0);
    const schoolAttendanceRate = schoolTotalEnrolled > 0 ? Math.round((schoolTotalPresent / schoolTotalEnrolled) * 100) : 0;
    const schoolAbsenceRate = schoolTotalEnrolled > 0 ? Math.round((schoolTotalAbsent / schoolTotalEnrolled) * 100) : 0;

    // تجميع المراحل حسب المستوى التعليمي
    const levelsMap = new Map<string, StageSummary[]>();
    const levelOrder = ['مرحلة رياض الأطفال', 'المرحلة الابتدائية', 'المرحلة الإعدادية', 'المرحلة الثانوية'];

    stagesSummary.forEach(stage => {
        let levelName = 'مرحلة رياض الأطفال';
        if (stage.stageName.includes('الابتدائي') || stage.stageName.includes('primary')) levelName = 'المرحلة الابتدائية';
        else if (stage.stageName.includes('الإعدادي') || stage.stageName.includes('prep')) levelName = 'المرحلة الإعدادية';
        else if (stage.stageName.includes('الثانوي') || stage.stageName.includes('secondary')) levelName = 'المرحلة الثانوية';

        if (!levelsMap.has(levelName)) {
            levelsMap.set(levelName, []);
        }
        levelsMap.get(levelName)!.push(stage);
    });

    // ترتيب الصفوف داخل كل مستوى تعليمي
    levelsMap.forEach((stages, levelName) => {
        stages.sort((a, b) => sortStagesByName({ name: a.stageName }, { name: b.stageName }));
    });

    // ترتيب المستويات
    const sortedLevels = levelOrder.filter(level => levelsMap.has(level));

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير الحضور والغياب اليدوي</title>
    <style>
        /* ... (styles remain the same) ... */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A4; margin: 10mm; direction: rtl; }
        @media print {
            body { background-color: white; padding: 0 !important; }
            .no-print { display: none !important; }
            .print-container { box-shadow: none; padding: 0 !important; max-width: none !important; width: 100% !important; margin: 0 !important; }
        }
        body { font-family: 'Arial', 'Segoe UI', sans-serif; direction: rtl; text-align: right; background-color: #f5f5f5; padding: 20px; font-size: 12px; color: #000; }
        .print-container { background-color: white; padding: 20px; max-width: 100%; margin: 0 auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .report-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 15px; }
        .header-right { width: 20%; text-align: right; }
        .header-center { width: 60%; text-align: center; }
        .header-left { width: 20%; text-align: left; display: flex; flex-direction: column; justify-content: center; }
        .school-logo { height: 60px; max-width: 100%; object-fit: contain; }
        .school-name { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
        .report-title { font-size: 16px; font-weight: bold; color: #d97706; border: 2px solid #d97706; display: inline-block; padding: 5px 15px; border-radius: 5px; }
        .date-box { font-size: 11px; font-weight: bold; margin-bottom: 3px; }
        .section-header { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 8px 15px; font-weight: bold; font-size: 14px; margin: 20px 0 10px 0; border-radius: 5px; color: #92400e; }
        .level-header { background-color: #dbeafe; border: 1px solid #2563eb; color: #1e40af; }
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .data-table th { background-color: #fef3c7; border: 1px solid #d97706; padding: 8px; font-weight: bold; text-align: center; font-size: 11px; }
        .data-table td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: center; font-size: 11px; }
        .data-table tr:nth-child(even) { background-color: #fffbeb; }
        .data-table .text-right { text-align: right; }
        .data-table .success { color: #16a34a; font-weight: bold; }
        .data-table .danger { color: #dc2626; font-weight: bold; }
        .stage-summary-row { background-color: #fde68a !important; font-weight: bold; }
        .level-total-row { background-color: #bfdbfe !important; font-weight: bold; color: #1e3a8a; } 
        .school-total-row { background-color: #a78bfa !important; font-weight: bold; font-size: 12px; color: white; }
        .print-buttons { position: fixed; top: 20px; left: 20px; z-index: 1000; }
        .btn { padding: 10px 20px; margin-right: 10px; cursor: pointer; background: #d97706; color: white; border: none; border-radius: 5px; font-weight: bold; }
        .btn-close { background: #ef4444; }
        .summary-banner { display: flex; justify-content: space-around; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
        .summary-item { text-align: center; }
        .summary-label { font-size: 10px; color: #78350f; margin-bottom: 3px; }
        .summary-value { font-size: 18px; font-weight: bold; color: #92400e; }
    </style>
</head>
<body>
    <div class="print-buttons no-print">
        <button class="btn" onclick="window.print()">طباعة التقرير</button>
        <button class="btn btn-close" onclick="window.close()">إغلاق</button>
    </div>

    <div class="print-container">
        <!-- Compact Header -->
        <div class="report-header">
            <div class="header-right">
                <img src="/شعار المدرسة.jpg" alt="Logo" class="school-logo" onerror="this.style.display='none'">
            </div>
            <div class="header-center">
                <div class="school-name">${schoolName}</div>
                <div class="report-title">تقرير الحضور والغياب المجمع (إدخال يدوي)</div>
            </div>
            <div class="header-left">
                <div class="date-box">التاريخ: ${formattedDate}</div>
                <div class="date-box">العام: ${academicYear}</div>
            </div>
        </div>

        <!-- ملخص المدرسة العام -->
        <div class="summary-banner">

            <div class="summary-item">
                <div class="summary-label">إجمالي المقيد</div>
                <div class="summary-value">${schoolTotalEnrolled}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">إجمالي الحاضر</div>
                <div class="summary-value" style="color: #16a34a;">${schoolTotalPresent}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">إجمالي الغياب</div>
                <div class="summary-value" style="color: #dc2626;">${schoolTotalAbsent}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">نسبة الحضور</div>
                <div class="summary-value" style="color: #16a34a;">${schoolAttendanceRate}%</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">نسبة الغياب</div>
                <div class="summary-value" style="color: #dc2626;">${schoolAbsenceRate}%</div>
            </div>
        </div>

        <!-- جداول المستويات التعليمية -->
        ${sortedLevels.map(levelName => {
        const levelStages = levelsMap.get(levelName)!;
        const levelEnrolled = levelStages.reduce((s, st) => s + st.totalEnrolled, 0);
        const levelPresent = levelStages.reduce((s, st) => s + st.totalPresent, 0);
        const levelAbsent = levelStages.reduce((s, st) => s + st.totalAbsent, 0);
        const levelAttendanceRate = levelEnrolled > 0 ? Math.round((levelPresent / levelEnrolled) * 100) : 0;
        const levelAbsenceRate = levelEnrolled > 0 ? Math.round((levelAbsent / levelEnrolled) * 100) : 0;

        return `
                <div class="section-header level-header">🔹 ${levelName}</div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 50px;">م</th>
                            <th>المرحلة الدراسية</th>
                            <th>المقيد</th>
                            <th>الحاضر</th>
                            <th>الغائب</th>
                            <th>نسبة الحضور %</th>
                            <th>نسبة الغياب %</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${levelStages.map((stage, idx) => `
                            <tr>
                                <td>${idx + 1}</td>
                                <td class="text-right font-bold">${stage.stageName}</td>
                                <td>${stage.totalEnrolled}</td>
                                <td class="success">${stage.totalPresent}</td>
                                <td class="danger">${stage.totalAbsent}</td>
                                <td>${stage.attendanceRate}%</td>
                                <td>${stage.absenceRate}%</td>
                            </tr>
                        `).join('')}
                        <tr class="level-total-row">
                            <td colspan="2">إجمالي ${levelName}</td>
                            <td>${levelEnrolled}</td>
                            <td>${levelPresent}</td>
                            <td>${levelAbsent}</td>
                            <td>${levelAttendanceRate}%</td>
                            <td>${levelAbsenceRate}%</td>
                        </tr>
                    </tbody>
                </table>
            `;
    }).join('')}

        <!-- الجدول النهائي للمدرسة -->
        <div class="section-header" style="background-color: #ede9fe; border-color: #8b5cf6; color: #5b21b6;">🏫 الإجمالي العام للمدرسة</div>
        <table class="data-table">
            <thead>
                <tr style="background-color: #ede9fe;">
                    <th>البيان</th>
                    <th>إجمالي المقيد</th>
                    <th>إجمالي الحاضر</th>
                    <th>إجمالي الغياب</th>
                    <th>نسبة الحضور %</th>
                    <th>نسبة الغياب %</th>
                </tr>
            </thead>
            <tbody>
                <tr class="school-total-row">
                    <td>إجمالي المدرسة</td>
                    <td>${schoolTotalEnrolled}</td>
                    <td>${schoolTotalPresent}</td>
                    <td>${schoolTotalAbsent}</td>
                    <td>${schoolAttendanceRate}%</td>
                    <td>${schoolAbsenceRate}%</td>
                </tr>
            </tbody>
        </table>
    </div>
</body>
</html>
  `;

    const newWindow = window.open('', '_blank');
    if (newWindow) {
        newWindow.document.write(html);
        newWindow.document.close();
        newWindow.focus();
    }
};
