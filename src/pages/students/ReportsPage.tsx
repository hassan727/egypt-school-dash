import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    BarChart3,
    Download,
    FileText,
    PieChart,
    TrendingUp,
    Users,
    AlertCircle,
    Calendar,
    Loader,
} from 'lucide-react';
import { ReportsService } from '@/services/reportsService';
import { AnalyticsService } from '@/services/analyticsService';
import { formatCurrency, formatPercentage } from '@/utils/helpers';
import { PieChartComponent, LineChartComponent, BarChartComponent } from '@/components/AdvancedCharts';
import { StatsGrid, createStudentStat, createFinancialStat, createAttendanceStat, createAlertStat } from '@/components/StatsGrid';

interface ReportData {
    academic?: any;
    attendance?: any;
    financial?: any;
    behavioral?: any;
}

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<ReportData>({});
    const [stats, setStats] = useState<any>(null);

    const generateReport = async (type: string) => {
        try {
            setLoading(true);

            if (type === 'comprehensive') {
                const data = await ReportsService.generateComprehensiveReport();
                setReportData({ ...data });
            } else if (type === 'academic') {
                const data = await ReportsService.generateAcademicReport();
                setReportData({ academic: data });
            } else if (type === 'attendance') {
                const data = await ReportsService.generateAttendanceReport();
                setReportData({ attendance: data });
            } else if (type === 'financial') {
                const data = await ReportsService.generateFinancialReport();
                setReportData({ financial: data });
            }
        } catch (err) {
            console.error('خطأ في توليد التقرير:', err);
        } finally {
            setLoading(false);
        }
    };

    const exportReport = (format: 'csv' | 'json') => {
        try {
            if (format === 'csv') {
                ReportsService.exportToCSV(reportData.academic?.data || [], 'تقرير');
            } else {
                ReportsService.exportToJSON(reportData, 'تقرير');
            }
        } catch (err) {
            console.error('خطأ في التصدير:', err);
        }
    };

    const loadStats = async () => {
        try {
            setLoading(true);
            const [academic, attendance, financial, behavioral] = await Promise.all([
                AnalyticsService.getAcademicStats(),
                AnalyticsService.getAttendanceStats(),
                AnalyticsService.getFinancialStats(),
                AnalyticsService.getBehavioralStats(),
            ]);

            setStats({ academic, attendance, financial, behavioral });
        } catch (err) {
            console.error('خطأ:', err);
        } finally {
            setLoading(false);
        }
    };

    const chartData = [
        { name: 'ممتاز', value: stats?.behavioral?.excellent || 0 },
        { name: 'جيد', value: stats?.behavioral?.good || 0 },
        { name: 'مقبول', value: stats?.behavioral?.fair || 0 },
        { name: 'ضعيف', value: stats?.behavioral?.poor || 0 },
    ];

    const statsItems = [
        createStudentStat(stats?.academic?.totalRecords || 0, 'إجمالي السجلات الأكاديمية'),
        createFinancialStat(stats?.financial?.totalDue || 0, 'المستحقات'),
        createAttendanceStat(stats?.attendance?.attendanceRate || 0, 'معدل الحضور'),
        createAlertStat(stats?.behavioral?.withIssues || 0, 'مشاكل سلوكية'),
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* الرأس */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">التقارير والإحصائيات</h1>
                        <p className="text-gray-600 mt-1">تحليل شامل لبيانات النظام</p>
                    </div>
                    <Button onClick={loadStats} disabled={loading}>
                        {loading ? (
                            <>
                                <Loader className="ml-2 h-4 w-4 animate-spin" />
                                جاري التحميل...
                            </>
                        ) : (
                            'تحديث البيانات'
                        )}
                    </Button>
                </div>

                {/* الإحصائيات السريعة */}
                {stats && (
                    <StatsGrid
                        stats={statsItems}
                        columns={4}
                        loading={loading}
                    />
                )}

                {/* التبويبات */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
                        <TabsTrigger value="academic">أكاديمي</TabsTrigger>
                        <TabsTrigger value="attendance">حضور</TabsTrigger>
                        <TabsTrigger value="financial">مالي</TabsTrigger>
                    </TabsList>

                    {/* نظرة عامة */}
                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Card className="p-6">
                                <h3 className="text-lg font-semibold mb-4">التوزيع السلوكي</h3>
                                {stats && chartData.length > 0 && (
                                    <PieChartComponent
                                        data={chartData}
                                        title=""
                                    />
                                )}
                            </Card>

                            <Card className="p-6">
                                <h3 className="text-lg font-semibold mb-4">الإجراءات السريعة</h3>
                                <div className="space-y-2">
                                    <Button
                                        className="w-full justify-start"
                                        variant="outline"
                                        onClick={() => generateReport('comprehensive')}
                                    >
                                        <FileText className="ml-2 h-4 w-4" />
                                        تقرير شامل
                                    </Button>
                                    <Button
                                        className="w-full justify-start"
                                        variant="outline"
                                        onClick={() => generateReport('academic')}
                                    >
                                        <BarChart3 className="ml-2 h-4 w-4" />
                                        تقرير أكاديمي
                                    </Button>
                                    <Button
                                        className="w-full justify-start"
                                        variant="outline"
                                        onClick={() => generateReport('attendance')}
                                    >
                                        <Calendar className="ml-2 h-4 w-4" />
                                        تقرير حضور
                                    </Button>
                                    <Button
                                        className="w-full justify-start"
                                        variant="outline"
                                        onClick={() => generateReport('financial')}
                                    >
                                        <TrendingUp className="ml-2 h-4 w-4" />
                                        تقرير مالي
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* تقرير أكاديمي */}
                    <TabsContent value="academic" className="space-y-4">
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">البيانات الأكاديمية</h3>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => exportReport('json')}
                                >
                                    <Download className="ml-2 h-4 w-4" />
                                    تصدير
                                </Button>
                            </div>

                            {stats?.academic && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-blue-50 rounded-lg">
                                        <p className="text-sm text-gray-600">المعدل الإجمالي</p>
                                        <p className="text-2xl font-bold text-blue-600">
                                            {stats.academic.averageGPA?.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-green-50 rounded-lg">
                                        <p className="text-sm text-gray-600">الناجحون</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {stats.academic.passingCount}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-red-50 rounded-lg">
                                        <p className="text-sm text-gray-600">الراسبون</p>
                                        <p className="text-2xl font-bold text-red-600">
                                            {stats.academic.failingCount}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-yellow-50 rounded-lg">
                                        <p className="text-sm text-gray-600">الإجمالي</p>
                                        <p className="text-2xl font-bold text-yellow-600">
                                            {stats.academic.totalRecords}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </TabsContent>

                    {/* تقرير حضور */}
                    <TabsContent value="attendance" className="space-y-4">
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">بيانات الحضور</h3>
                                <Badge>{formatPercentage(stats?.attendance?.attendanceRate || 0)}</Badge>
                            </div>

                            {stats?.attendance && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-green-50 rounded-lg">
                                        <p className="text-sm text-gray-600">حاضرون</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {stats.attendance.present}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-red-50 rounded-lg">
                                        <p className="text-sm text-gray-600">غائبون</p>
                                        <p className="text-2xl font-bold text-red-600">
                                            {stats.attendance.absent}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-yellow-50 rounded-lg">
                                        <p className="text-sm text-gray-600">متأخرون</p>
                                        <p className="text-2xl font-bold text-yellow-600">
                                            {stats.attendance.late}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-blue-50 rounded-lg">
                                        <p className="text-sm text-gray-600">معذورون</p>
                                        <p className="text-2xl font-bold text-blue-600">
                                            {stats.attendance.excused}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </TabsContent>

                    {/* تقرير مالي */}
                    <TabsContent value="financial" className="space-y-4">
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">البيانات المالية</h3>
                                <Badge>{formatPercentage(stats?.financial?.paymentRate || 0)}</Badge>
                            </div>

                            {stats?.financial && (
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="p-4 bg-blue-50 rounded-lg">
                                        <p className="text-sm text-gray-600">المستحق</p>
                                        <p className="text-2xl font-bold text-blue-600">
                                            {formatCurrency(stats.financial.totalDue)}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-green-50 rounded-lg">
                                        <p className="text-sm text-gray-600">المدفوع</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {formatCurrency(stats.financial.totalPaid)}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-red-50 rounded-lg">
                                        <p className="text-sm text-gray-600">المتبقي</p>
                                        <p className="text-2xl font-bold text-red-600">
                                            {formatCurrency(stats.financial.remaining)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}