import { formatDate } from './helpers';

export interface PrintHeaderData {
    schoolName: string;
    schoolLogo?: string;
    academicYear: string;
    studentName: string;
    studentCode: string;
    grade: string;
    class: string;
    nationalId?: string;
    studentId: string;
}

export function getFormattedPrintDate(): string {
    const today = new Date();
    return today.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

export function generatePrintHeader(data: PrintHeaderData): string {
    return `
        <!-- رأس الصفحة الثابت -->
        <div class="print-header-container">
            <div class="print-header">
                ${data.schoolLogo ? `<div class="logo-container"><img src="${data.schoolLogo}" alt="شعار المدرسة" class="school-logo" /></div>` : ''}
                <div class="header-content">
                    <h1 class="school-name">${data.schoolName}</h1>
                    <p class="academic-year">السنة الدراسية: ${data.academicYear}</p>
                </div>
            </div>
            
            <div class="student-info-grid">
                <div class="info-row">
                    <span class="info-label">اسم الطالب:</span>
                    <span class="info-value">${data.studentName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">الصف:</span>
                    <span class="info-value">${data.grade}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">الفصل:</span>
                    <span class="info-value">${data.class}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">رقم الطالب:</span>
                    <span class="info-value">${data.studentId}</span>
                </div>
                ${data.nationalId ? `
                <div class="info-row">
                    <span class="info-label">الرقم القومي:</span>
                    <span class="info-value">${data.nationalId}</span>
                </div>
                ` : ''}
                <div class="info-row">
                    <span class="info-label">الكود:</span>
                    <span class="info-value">${data.studentCode}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">تاريخ اليوم:</span>
                    <span class="info-value">${getFormattedPrintDate()}</span>
                </div>
            </div>
        </div>
    `;
}

export function generatePrintStyles(): string {
    return `
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            @page {
                size: A4;
                margin: 20mm;
                direction: rtl;
            }

            @media print {
                body {
                    background-color: white;
                }
                .no-print {
                    display: none !important;
                }
                .print-container {
                    box-shadow: none;
                    margin: 0;
                    padding: 0;
                }
            }

            html, body {
                height: 100%;
            }

            body {
                font-family: 'Arial', 'Segoe UI', 'Traditional Arabic', sans-serif;
                direction: rtl;
                text-align: right;
                background-color: #f5f5f5;
                padding: 20px;
            }

            .print-button-container {
                text-align: center;
                padding: 20px;
                margin-bottom: 20px;
                background-color: #f0f0f0;
                border-radius: 8px;
            }

            .print-button {
                background-color: #3b82f6;
                color: white;
                border: none;
                padding: 10px 24px;
                border-radius: 6px;
                font-size: 14px;
                cursor: pointer;
                font-weight: bold;
                margin: 0 5px;
            }

            .print-button:hover {
                background-color: #2563eb;
            }

            .print-button.secondary {
                background-color: #6b7280;
            }

            .print-button.secondary:hover {
                background-color: #4b5563;
            }

            .print-container {
                background-color: white;
                padding: 40px;
                max-width: 900px;
                margin: 0 auto;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }

            /* رأس الصفحة */
            .print-header-container {
                margin-bottom: 30px;
                border-bottom: 3px solid #2563eb;
                padding-bottom: 20px;
                page-break-inside: avoid;
            }

            .print-header {
                text-align: center;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 20px;
            }

            .logo-container {
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .school-logo {
                height: 80px;
                width: auto;
                max-width: 80px;
                object-fit: contain;
            }

            .header-content {
                flex-grow: 1;
            }

            .school-name {
                font-size: 24px;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 5px;
            }

            .academic-year {
                font-size: 14px;
                color: #6b7280;
                font-weight: 600;
            }

            .student-info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-top: 15px;
            }

            .info-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                background-color: #f9fafb;
                border-right: 3px solid #3b82f6;
                border-radius: 4px;
            }

            .info-label {
                font-weight: bold;
                color: #4b5563;
                font-size: 13px;
            }

            .info-value {
                color: #1f2937;
                font-weight: 600;
                font-size: 13px;
            }

            /* محتوى النموذج */
            .form-title {
                font-size: 22px;
                font-weight: bold;
                color: #1f2937;
                text-align: center;
                margin: 30px 0 25px 0;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 15px;
            }

            .form-section {
                margin-bottom: 25px;
                page-break-inside: avoid;
            }

            .section-title {
                font-size: 16px;
                font-weight: bold;
                color: #ffffff;
                background-color: #3b82f6;
                padding: 10px 15px;
                margin-bottom: 15px;
                border-radius: 4px;
            }

            .form-row {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin-bottom: 15px;
            }

            .form-row.full {
                grid-template-columns: 1fr;
            }

            .form-group {
                display: flex;
                flex-direction: column;
            }

            .form-label {
                font-weight: bold;
                color: #374151;
                font-size: 13px;
                margin-bottom: 8px;
            }

            .form-value {
                color: #1f2937;
                font-size: 13px;
                padding: 10px;
                background-color: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 4px;
                min-height: 30px;
                display: flex;
                align-items: center;
            }

            .form-value.textarea {
                min-height: 80px;
                align-items: flex-start;
                padding: 10px;
                white-space: pre-wrap;
                word-wrap: break-word;
            }

            /* جدول */
            .form-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
                font-size: 13px;
            }

            .form-table th {
                background-color: #e5e7eb;
                color: #374151;
                font-weight: bold;
                padding: 12px;
                text-align: right;
                border: 1px solid #d1d5db;
            }

            .form-table td {
                padding: 12px;
                border: 1px solid #d1d5db;
            }

            .form-table tr:nth-child(even) {
                background-color: #f9fafb;
            }

            /* التوقيع */
            .signature-section {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                margin-top: 60px;
                page-break-inside: avoid;
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
                height: 60px;
                margin-bottom: 10px;
            }

            .signature-label {
                font-size: 12px;
                font-weight: bold;
                color: #1f2937;
            }

            /* نموذج فارغ */
            .empty-form-line {
                border-bottom: 1px solid #1f2937;
                min-height: 25px;
                margin: 20px 0;
            }

            .empty-form-lines {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .empty-form-line-small {
                border-bottom: 1px solid #1f2937;
                min-height: 20px;
            }

            /* ملاحظات عدم الطباعة */
            @media print {
                .no-print {
                    display: none !important;
                }
            }
        </style>
    `;
}

export function openPrintWindow(
    html: string,
    title: string = 'طباعة النموذج'
): void {
    const newWindow = window.open('', '', 'width=1000,height=1200');
    if (newWindow) {
        newWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${title}</title>
                ${generatePrintStyles()}
            </head>
            <body>
                ${html}
                <script>
                    window.onload = function() {
                        window.focus();
                    };
                </script>
            </body>
            </html>
        `);
        newWindow.document.close();
    } else {
        alert('يرجى السماح بفتح النوافذ المنبثقة لاستخدام ميزة الطباعة');
    }
}

export function createBlankFormContent(
    title: string,
    fields: Array<{ label: string; fullWidth?: boolean }>,
    headerData: PrintHeaderData
): string {
    const lines = fields.map(field => `
        <div class="form-row ${field.fullWidth ? 'full' : ''}">
            <div class="form-group">
                <div class="form-label">${field.label}</div>
                <div class="empty-form-lines">
                    <div class="empty-form-line-small"></div>
                    <div class="empty-form-line-small"></div>
                </div>
            </div>
        </div>
    `).join('');

    return `
        <div class="print-button-container no-print">
            <button class="print-button" onclick="window.print()">⇦ طباعة النموذج الفارغ</button>
        </div>

        <div class="print-container">
            ${generatePrintHeader(headerData)}
            <h2 class="form-title">${title} (نموذج فارغ)</h2>
            <div class="form-section">
                ${lines}
            </div>
            <div class="signature-section">
                <div class="signature-line">
                    <div class="signature-space"></div>
                    <div class="signature-label">توقيع المسؤول</div>
                </div>
                <div class="signature-line">
                    <div class="signature-space"></div>
                    <div class="signature-label">توقيع مدير المدرسة</div>
                </div>
                <div class="signature-line">
                    <div class="signature-space"></div>
                    <div class="signature-label">ختم المدرسة</div>
                </div>
            </div>
        </div>
    `;
}

export function createFilledFormContent(
    title: string,
    sections: Array<{
        title?: string;
        fields: Array<{ label: string; value: string | number | boolean | null | undefined; fullWidth?: boolean }>;
    }>,
    headerData: PrintHeaderData
): string {
    const sectionsHtml = sections.map((section) => `
        <div class="form-section">
            ${section.title ? `<div class="section-title">${section.title}</div>` : ''}
            ${section.fields.map(field => `
                <div class="form-row ${field.fullWidth ? 'full' : ''}">
                    <div class="form-group">
                        <div class="form-label">${field.label}</div>
                        <div class="form-value ${typeof field.value === 'string' && field.value.length > 50 ? 'textarea' : ''}">
                            ${field.value || '-'}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `).join('');

    return `
        <div class="print-button-container no-print">
            <button class="print-button" onclick="window.print()">⇦ طباعة النموذج بالبيانات</button>
        </div>

        <div class="print-container">
            ${generatePrintHeader(headerData)}
            <h2 class="form-title">${title}</h2>
            ${sectionsHtml}
            <div class="signature-section">
                <div class="signature-line">
                    <div class="signature-space"></div>
                    <div class="signature-label">توقيع المسؤول</div>
                </div>
                <div class="signature-line">
                    <div class="signature-space"></div>
                    <div class="signature-label">توقيع مدير المدرسة</div>
                </div>
                <div class="signature-line">
                    <div class="signature-space"></div>
                    <div class="signature-label">ختم المدرسة</div>
                </div>
            </div>
        </div>
    `;
}
