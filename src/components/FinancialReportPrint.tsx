import { useEffect } from 'react';

interface StudentProfile {
    id: string;
    studentId?: string;
    personalData?: {
        fullNameAr: string;
    };
    enrollmentData?: {
        academicYear: string;
        stage: string;
        class?: string;
    };
    schoolFees?: {
        totalAmount: number;
        advancePayment: number;
        installmentCount: number;
        installments: Array<{
            id?: string;
            installmentNumber: number;
            amount: number;
            dueDate: string;
            paid: boolean;
            paidDate?: string;
        }>;
    };
    financialTransactions?: Array<{
        id?: string;
        transactionType: 'دفعة' | 'مصروف إضافي' | 'خصم' | 'غرامة';
        amount: number;
        description: string;
        transactionDate: string;
    }>;
    otherExpenses?: Array<{
        expenseType: string;
        totalPrice: number;
    }>;
}

interface FinancialReportPrintProps {
    studentProfile: StudentProfile;
    studentId: string;
    selectedYear: string;
    onClose?: () => void;
}

export function FinancialReportPrint({
    studentProfile,
    studentId,
    selectedYear,
    onClose
}: FinancialReportPrintProps) {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        // This effect intentionally runs only once to open the print window
        const calculateFinancials = () => {
            const transactions = studentProfile.financialTransactions || [];

            const totalStudyExpenses = studentProfile.schoolFees?.totalAmount || 0;

            const totalPaid = transactions
                .filter(t => t.transactionType === 'دفعة')
                .reduce((sum, t) => sum + t.amount, 0);

            const totalAdditionalFees = transactions
                .filter(t => t.transactionType === 'مصروف إضافي')
                .reduce((sum, t) => sum + t.amount, 0);

            const totalDiscounts = transactions
                .filter(t => t.transactionType === 'خصم' || t.transactionType === 'غرامة')
                .reduce((sum, t) => sum + t.amount, 0);

            const netDue = totalStudyExpenses + totalAdditionalFees - totalPaid - totalDiscounts;
            const paymentRatio = totalStudyExpenses > 0 ? ((totalPaid / totalStudyExpenses) * 100) : 0;

            return {
                totalStudyExpenses,
                totalPaid,
                totalAdditionalFees,
                totalDiscounts,
                netDue,
                paymentRatio: paymentRatio.toFixed(1),
                transactions: (transactions || []).sort((a, b) =>
                    new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
                )
            };
        };

        const financials = calculateFinancials();
        const today = new Date();
        const formattedDate = today.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>كشف حساب مالي - ${studentProfile.personalData?.fullNameAr || 'طالب'}</title>
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
                display: none;
            }
        }

        body {
            font-family: 'Arial', 'Segoe UI', sans-serif;
            direction: rtl;
            text-align: right;
            background-color: #f5f5f5;
            padding: 20px;
        }

        .print-container {
            background-color: white;
            padding: 40px;
            max-width: 900px;
            margin: 0 auto;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }

        /* القسم الأول: ترويسة التقرير */
        .report-header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .school-logo {
            height: 80px;
            margin-bottom: 15px;
            display: block;
            margin-left: auto;
            margin-right: auto;
        }

        .report-title {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
        }

        .student-basic-info {
            margin-top: 15px;
            border-top: 1px solid #e5e7eb;
            padding-top: 15px;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }

        .info-item {
            display: block;
            line-height: 1.6;
        }

        .info-label {
            font-weight: bold;
            color: #4b5563;
        }

        .info-value {
            color: #1f2937;
            font-weight: 600;
        }
        
        .info-item .info-label::after {
            content: ' ';
        }

        /* القسم الثاني: الملخص المالي */
        .financial-summary {
            margin-bottom: 30px;
        }

        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #ffffff;
            background-color: #3b82f6;
            padding: 12px 15px;
            margin-bottom: 15px;
            border-radius: 4px;
        }

        .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 15px;
        }

        .summary-item {
            background-color: #f3f4f6;
            padding: 12px;
            border-right: 4px solid #3b82f6;
            border-radius: 4px;
        }

        .summary-label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 5px;
        }

        .summary-value {
            font-size: 18px;
            font-weight: bold;
            color: #1f2937;
        }

        /* القسم الثالث: تفصيل المصروفات الأساسية */
        .base-fees-breakdown {
            margin-bottom: 30px;
            border: 1px solid #e5e7eb;
            padding: 15px;
            border-radius: 4px;
            background-color: #fafbfc;
        }

        .base-fees-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 15px;
        }

        .fee-item {
            background-color: white;
            padding: 12px;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
        }

        .fee-label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 5px;
        }

        .fee-value {
            font-size: 16px;
            font-weight: bold;
            color: #047857;
        }

        .installments-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            border: 1px solid #d1d5db;
        }

        .installments-table th {
            background-color: #dbeafe !important;
            color: #1e3a8a !important;
            font-weight: bold;
            padding: 10px;
            text-align: right;
            border: 1px solid #bfdbfe;
            font-size: 13px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .installments-table td {
            padding: 10px;
            border: 1px solid #e5e7eb;
            font-size: 13px;
        }

        .installments-table tr:nth-child(even) {
            background-color: #f9fafb;
        }

        .status-paid {
            color: #047857;
            font-weight: bold;
        }

        .status-unpaid {
            color: #dc2626;
            font-weight: bold;
        }

        /* القسم الرابع: سجل المعاملات المفصل */
        .transaction-log {
            margin-bottom: 30px;
        }

        .transactions-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            border: 1px solid #d1d5db;
        }

        .transactions-table th {
            background-color: #dbeafe !important;
            color: #1e3a8a !important;
            font-weight: bold;
            padding: 12px;
            text-align: right;
            border: 1px solid #bfdbfe;
            font-size: 13px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .transactions-table td {
            padding: 12px;
            border: 1px solid #e5e7eb;
            font-size: 13px;
        }

        .transactions-table tr:nth-child(even) {
            background-color: #f9fafb;
        }

        .transaction-amount {
            font-weight: bold;
        }

        .transaction-payment {
            color: #047857;
        }

        .transaction-fee {
            color: #dc2626;
        }

        .transaction-discount {
            color: #7c3aed;
        }

        /* القسم الخامس: تذييل التقرير */
        .report-footer {
            margin-top: 40px;
            border-top: 2px solid #2563eb;
            padding-top: 20px;
            text-align: center;
        }

        .footer-date {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 30px;
        }

        .signature-section {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-top: 50px;
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

        .no-transactions {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
        }

        .print-button-container {
            text-align: center;
            padding: 20px;
            no-print: true;
        }

        .print-button {
            background-color: #3b82f6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            font-weight: bold;
        }

        .print-button:hover {
            background-color: #2563eb;
        }

        @media print {
            .print-button-container {
                display: none;
            }
            
            .print-container {
                box-shadow: none;
                padding: 0;
            }
        }

        .info-grid-two-cols {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>
    <div class="print-button-container no-print">
        <button class="print-button" onclick="window.print()">طباعة التقرير</button>
    </div>

    <div class="print-container">
        <!-- القسم الأول: ترويسة التقرير -->
        <div class="report-header">
            <img src="/شعار المدرسة.jpg" alt="شعار المدرسة" class="school-logo">
            <div style="font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 10px;">مدرسة جاد الله</div>
            <div class="report-title">كشف حساب مالي</div>
            <div class="student-basic-info">
                <div class="info-item">
                    <span class="info-label">اسم الطالب:</span>
                    <span class="info-value">${studentProfile.personalData?.fullNameAr || 'غير محدد'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">الرقم التعريفي:</span>
                    <span class="info-value">${studentId}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">الصف والفصل:</span>
                    <span class="info-value">${studentProfile.enrollmentData?.stage || 'غير محدد'} - ${studentProfile.enrollmentData?.class || 'غير محدد'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">السنة الدراسية:</span>
                    <span class="info-value">${selectedYear}</span>
                </div>
            </div>
        </div>

        <!-- القسم الثاني: الملخص المالي -->
        <div class="financial-summary">
            <div class="section-title">الملخص المالي</div>
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-label">إجمالي المستحق</div>
                    <div class="summary-value">${financials.totalStudyExpenses.toLocaleString()} ج</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">إجمالي المدفوع</div>
                    <div class="summary-value">${financials.totalPaid.toLocaleString()} ج</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">المصروفات الإضافية</div>
                    <div class="summary-value">${financials.totalAdditionalFees.toLocaleString()} ج</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">الخصومات</div>
                    <div class="summary-value">${financials.totalDiscounts.toLocaleString()} ج</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">الصافي المستحق</div>
                    <div class="summary-value">${financials.netDue.toLocaleString()} ج</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">نسبة السداد</div>
                    <div class="summary-value">${financials.paymentRatio}%</div>
                </div>
            </div>
        </div>

        <!-- القسم الثالث: تفصيل المصروفات الأساسية -->
        <div class="base-fees-breakdown">
            <div class="section-title">تفصيل المصروفات الأساسية</div>
            <div class="base-fees-grid">
                <div class="fee-item">
                    <div class="fee-label">المرحلة الدراسية</div>
                    <div class="fee-value">${studentProfile.enrollmentData?.stage || 'غير محدد'}</div>
                </div>
                <div class="fee-item">
                    <div class="fee-label">المبلغ الإجمالي للمصروفات</div>
                    <div class="fee-value">${financials.totalStudyExpenses.toLocaleString()} ج</div>
                </div>
                <div class="fee-item">
                    <div class="fee-label">الدفعة المقدمة</div>
                    <div class="fee-value">${(studentProfile.schoolFees?.advancePayment || 0).toLocaleString()} ج</div>
                </div>
                <div class="fee-item">
                    <div class="fee-label">عدد الأقساط</div>
                    <div class="fee-value">${studentProfile.schoolFees?.installmentCount || 1}</div>
                </div>
            </div>

            ${studentProfile.schoolFees?.installments && studentProfile.schoolFees.installments.length > 0 ? `
            <div style="margin-top: 15px;">
                <strong style="font-size: 14px; color: #1f2937;">جدول الأقساط:</strong>
                <table class="installments-table">
                    <thead>
                        <tr>
                            <th>رقم القسط</th>
                            <th>المبلغ</th>
                            <th>تاريخ الاستحقاق</th>
                            <th>الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${studentProfile.schoolFees.installments
                    .sort((a, b) => a.installmentNumber - b.installmentNumber)
                    .map((inst, idx) => `
                        <tr>
                            <td>${inst.installmentNumber}</td>
                            <td>${inst.amount.toLocaleString()} ج</td>
                            <td>${inst.dueDate}</td>
                            <td class="${inst.paid ? 'status-paid' : 'status-unpaid'}">
                                ${inst.paid ? 'مدفوع' : 'غير مدفوع'}
                            </td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}
        </div>

        <!-- القسم الرابع: سجل المعاملات المالية -->
        <div class="transaction-log">
            <div class="section-title">سجل المعاملات المفصل</div>
            ${financials.transactions.length > 0 ? `
            <table class="transactions-table">
                <thead>
                    <tr>
                        <th>التاريخ</th>
                        <th>الوصف</th>
                        <th>النوع</th>
                        <th>المبلغ</th>
                    </tr>
                </thead>
                <tbody>
                    ${financials.transactions.map(tx => {
                        let typeLabel = '';
                        let amountClass = '';
                        let amountSign = '';

                        if (tx.transactionType === 'دفعة') {
                            typeLabel = 'دفعة';
                            amountClass = 'transaction-payment';
                            amountSign = '+';
                        } else if (tx.transactionType === 'مصروف إضافي') {
                            typeLabel = 'مصروف إضافي';
                            amountClass = 'transaction-fee';
                            amountSign = '+';
                        } else if (tx.transactionType === 'خصم' || tx.transactionType === 'غرامة') {
                            typeLabel = 'خصم';
                            amountClass = 'transaction-discount';
                            amountSign = '-';
                        }

                        return `
                        <tr>
                            <td>${tx.transactionDate}</td>
                            <td>${tx.description}</td>
                            <td>${typeLabel}</td>
                            <td class="transaction-amount ${amountClass}">
                                ${amountSign}${tx.amount.toLocaleString()} ج
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            ` : `<div class="no-transactions">لا توجد معاملات مالية مسجلة لهذه السنة</div>`}
        </div>

        <!-- القسم الخامس: تذييل التقرير -->
        <div class="report-footer">
            <div class="footer-date">تاريخ الطباعة: ${formattedDate}</div>
            <div class="signature-section">
                <div class="signature-line">
                    <div class="signature-space"></div>
                    <div class="signature-label">توقيع المسؤول المالي</div>
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
    </div>
</body>
</html>
        `;

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
    }, []);

    return null;
}
