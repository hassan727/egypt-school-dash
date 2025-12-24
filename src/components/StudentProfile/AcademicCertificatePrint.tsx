import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Grade } from '@/types/student';

interface AcademicCertificatePrintProps {
    studentName: string;
    studentCode: string; // جلوس number or student ID
    academicYear: string;
    semester: string;
    stage: string; // e.g., الصف الأول الثانوي
    grades: Grade[]; // Raw grades to be grouped
    onClose?: () => void;
}

export const AcademicCertificatePrint = ({
    studentName,
    studentCode,
    academicYear,
    semester,
    stage,
    grades,
    onClose
}: AcademicCertificatePrintProps) => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Group grades by Subject
    // We want a unified list, but maybe sorted by Subject?
    // The request says: "Unified Table of all subjects".
    // Columns: Subject | Teacher | Date | Grade

    // Sort grades by Subject Name then Date
    const sortedGrades = [...grades].sort((a, b) => {
        const subjectCompare = (a.subjectName || '').localeCompare(b.subjectName || '');
        if (subjectCompare !== 0) return subjectCompare;
        return new Date(b.assessmentDate || '').getTime() - new Date(a.assessmentDate || '').getTime();
    });

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>شهادة أداء أكاديمي - ${studentName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            size: A4;
            margin: 10mm; 
            direction: rtl;
        }

        @media print {
            body { 
                background-color: white; 
                padding: 0 !important;
            }
            .no-print { display: none !important; }
            .print-container { 
                box-shadow: none; 
                padding: 0 !important;
                max-width: none !important;
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
            color: #000;
        }

        .print-container {
            background-color: white;
            padding: 20px;
            max-width: 210mm;
            margin: 0 auto;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            min-height: 297mm;
        }

        /* 3-Column Header Layout */
        .report-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
            height: 12%; 
        }

        .header-right { width: 25%; text-align: right; }
        .header-center { width: 50%; text-align: center; }
        .header-left { width: 25%; text-align: left; display: flex; flex-direction: column; justify-content: center; }

        .school-logo {
            height: 70px;
            max-width: 100%;
            object-fit: contain;
        }

        .school-name {
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .report-title {
            font-size: 18px;
            font-weight: bold;
            border: 2px solid #000;
            display: inline-block;
            padding: 5px 20px;
            border-radius: 5px;
            margin-top: 5px;
        }

        .date-box {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        /* Horizontal Summary Strip for Student Info */
        .student-info-strip {
            display: flex;
            justify-content: space-between;
            border: 1px solid #000;
            padding: 8px 15px;
            background-color: #f9f9f9;
            margin-bottom: 20px;
            border-radius: 4px;
        }

        .info-item {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .info-label {
            font-size: 10px;
            color: #555;
            margin-bottom: 2px;
        }

        .info-value {
            font-size: 14px;
            font-weight: bold;
        }

        /* Unified Grade Table */
        .grades-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }

        .grades-table th {
            background-color: #eee;
            border: 1px solid #000;
            padding: 10px;
            font-weight: bold;
            text-align: center;
        }

        .grades-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
        }

        .grade-excellent { color: green; font-weight: bold; }
        .grade-fail { color: red; font-weight: bold; }

        /* Signatures */
        .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
            padding: 0 50px;
        }

        .signature-box {
            text-align: center;
        }

        .signature-line {
            margin-top: 40px;
            border-top: 1px dotted #000;
            width: 200px;
        }

        .print-buttons {
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1000;
        }

        .btn {
            padding: 10px 20px;
            margin-right: 10px;
            cursor: pointer;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 5px;
            font-weight: bold;
        }
        .btn-close { background: #ef4444; }

    </style>
</head>
<body>
    <div class="print-buttons no-print">
        <button class="btn" onclick="window.print()">طباعة الشهادة</button>
        <button class="btn btn-close" onclick="window.close()">إغلاق</button>
    </div>

    <div class="print-container">
        <!-- Compact Header -->
        <div class="report-header">
            <div class="header-right">
                <img src="/شعار المدرسة.jpg" alt="Logo" class="school-logo" onerror="this.style.display='none'">
            </div>
            <div class="header-center">
                <div class="school-name">مدرسة جاد الله</div>
                <div class="report-title">شهادة أداء أكاديمي</div>
            </div>
            <div class="header-left">
                <div class="date-box">التاريخ: ${formattedDate}</div>
                <div class="date-box">${academicYear}</div>
            </div>
        </div>

        <!-- Student Info Strip -->
        <div class="student-info-strip">
            <div class="info-item">
                <span class="info-label">اسم الطالب</span>
                <span class="info-value">${studentName}</span>
            </div>
            <div class="info-item">
                <span class="info-label">رقم الجلوس / المعرف</span>
                <span class="info-value">${studentCode}</span>
            </div>
            <div class="info-item">
                <span class="info-label">المرحلة الدراسية</span>
                <span class="info-value">${stage}</span>
            </div>
            <div class="info-item">
                <span class="info-label">الفصل الدراسي</span>
                <span class="info-value">${semester}</span>
            </div>
        </div>

        <!-- Unified Grades Table -->
        <table class="grades-table">
            <thead>
                <tr>
                    <th>م</th>
                    <th>المادة</th>
                    <th>نوع التقييم</th>
                    <th>المعلم</th>
                    <th>التاريخ</th>
                    <th>الدرجة</th>
                    <th>التقدير</th>
                </tr>
            </thead>
            <tbody>
                ${sortedGrades.map((g, idx) => `
                <tr>
                    <td>${idx + 1}</td>
                    <td style="font-weight:bold; text-align:right; padding-right:15px;">${g.subjectName}</td>
                    <td>${g.assessmentType || '-'}</td>
                    <td>${g.teacherName || '-'}</td>
                    <td>${g.assessmentDate ? new Date(g.assessmentDate).toLocaleDateString('ar-EG') : '-'}</td>
                    <td style="font-weight:bold; font-size:14px;">${g.finalGrade} / 100</td>
                    <td>${g.gradeLevel || '-'}</td>
                </tr>
                `).join('')}
                ${sortedGrades.length === 0 ? '<tr><td colspan="7">لا توجد درجات مسجلة لهذه الفترة</td></tr>' : ''}
            </tbody>
        </table>

        <!-- Signatures -->
        <div class="signature-section">
            <div class="signature-box">
                <div>وكيل المرحلة</div>
                <div class="signature-line"></div>
            </div>
            <div class="signature-box">
                <div>مدير المدرسة</div>
                <div class="signature-line"></div>
            </div>
        </div>
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
