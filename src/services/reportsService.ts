import { StudentService } from './studentService';
import { AnalyticsService } from './analyticsService';
import { arrayToCSV } from '@/utils/helpers';

/**
 * خدمة التقارير والصادرات
 */
export class ReportsService {
    // توليد تقرير طلاب
    static async generateStudentsReport(filters?: any) {
        try {
            const data = await StudentService.exportStudentsData(filters);
            return {
                name: 'تقرير الطلاب',
                data,
                timestamp: new Date().toISOString(),
            };
        } catch (err) {
            console.error('خطأ في توليد تقرير الطلاب:', err);
            throw err;
        }
    }

    // توليد تقرير مالي
    static async generateFinancialReport() {
        try {
            const stats = await AnalyticsService.getFinancialStats();
            const { data } = await StudentService.exportStudentsData();

            const report = {
                title: 'التقرير المالي',
                summary: {
                    totalDue: stats.totalDue,
                    totalPaid: stats.totalPaid,
                    remaining: stats.remaining,
                    paymentRate: `${stats.paymentRate.toFixed(2)}%`,
                },
                students: data?.map((s: any) => ({
                    name: s.full_name_ar,
                    studentId: s.student_id,
                    stage: s.stage,
                })),
                timestamp: new Date().toISOString(),
            };

            return report;
        } catch (err) {
            console.error('خطأ في توليد التقرير المالي:', err);
            throw err;
        }
    }

    // توليد تقرير أكاديمي
    static async generateAcademicReport(stage?: string) {
        try {
            const stats = await AnalyticsService.getAcademicStats(stage);
            const topPerformers = await AnalyticsService.getTopPerformers();

            const report = {
                title: 'التقرير الأكاديمي',
                summary: stats,
                topPerformers,
                timestamp: new Date().toISOString(),
            };

            return report;
        } catch (err) {
            console.error('خطأ في توليد التقرير الأكاديمي:', err);
            throw err;
        }
    }

    // توليد تقرير حضور
    static async generateAttendanceReport() {
        try {
            const stats = await AnalyticsService.getAttendanceStats();
            const trends = await AnalyticsService.getMonthlyTrends();

            const report = {
                title: 'تقرير الحضور',
                summary: stats,
                trends,
                timestamp: new Date().toISOString(),
            };

            return report;
        } catch (err) {
            console.error('خطأ في توليد تقرير الحضور:', err);
            throw err;
        }
    }

    // توليد تقرير شامل
    static async generateComprehensiveReport() {
        try {
            const report = await AnalyticsService.getComprehensiveReport();
            const distribution = await AnalyticsService.getDistributionByStage();
            const needingSupport = await AnalyticsService.getStudentsNeedingSupport();

            return {
                title: 'التقرير الشامل',
                report,
                distribution,
                studentsNeedingSupport: needingSupport.length,
                timestamp: new Date().toISOString(),
            };
        } catch (err) {
            console.error('خطأ في توليد التقرير الشامل:', err);
            throw err;
        }
    }

    // تصدير التقرير إلى CSV
    static exportToCSV(data: any[], filename: string) {
        try {
            const csv = arrayToCSV(data);
            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
        } catch (err) {
            console.error('خطأ في تصدير CSV:', err);
            throw err;
        }
    }

    // تصدير التقرير إلى JSON
    static exportToJSON(data: any, filename: string) {
        try {
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
        } catch (err) {
            console.error('خطأ في تصدير JSON:', err);
            throw err;
        }
    }

    // إنشاء ملف PDF
    static async generatePDF(title: string, content: any) {
        try {
            // يتطلب مكتبة jsPDF
            const html = `
        <h1>${title}</h1>
        <pre>${JSON.stringify(content, null, 2)}</pre>
      `;

            // هنا يمكنك استخدام jsPDF
            console.log('PDF generation - يتطلب مكتبة jsPDF');
            return html;
        } catch (err) {
            console.error('خطأ في توليد PDF:', err);
            throw err;
        }
    }

    // جدولة التقارير
    static async scheduleReport(reportType: string, frequency: 'daily' | 'weekly' | 'monthly') {
        try {
            // يمكن تخزين جدولة التقارير في قاعدة البيانات
            const schedule = {
                reportType,
                frequency,
                createdAt: new Date().toISOString(),
                nextRun: this.calculateNextRun(frequency),
            };

            return schedule;
        } catch (err) {
            console.error('خطأ في جدولة التقرير:', err);
            throw err;
        }
    }

    private static calculateNextRun(frequency: 'daily' | 'weekly' | 'monthly'): string {
        const now = new Date();

        switch (frequency) {
            case 'daily':
                now.setDate(now.getDate() + 1);
                break;
            case 'weekly':
                now.setDate(now.getDate() + 7);
                break;
            case 'monthly':
                now.setMonth(now.getMonth() + 1);
                break;
        }

        return now.toISOString();
    }
}