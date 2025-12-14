/**
 * صفحة تقارير HR - نظام الموارد البشرية
 */
import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Download, Users, TrendingUp, PieChart, FileText } from 'lucide-react';

const HRReports = () => {
    const [reportType, setReportType] = useState('employees');

    const reports = [
        { id: 'employees', name: 'تقرير الموظفين', icon: Users, description: 'تقرير شامل بكل بيانات الموظفين', count: 45 },
        { id: 'attendance', name: 'تقرير الحضور', icon: TrendingUp, description: 'تحليل الحضور والغياب الشهري', count: 22 },
        { id: 'payroll', name: 'تقرير الرواتب', icon: FileText, description: 'ملخص الرواتب والمستحقات', count: 12 },
        { id: 'leaves', name: 'تقرير الإجازات', icon: PieChart, description: 'إحصائيات الإجازات والأرصدة', count: 8 },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3"><BarChart3 className="h-8 w-8 text-purple-600" />تقارير HR</h1>
                    <p className="text-gray-500">التقارير والإحصائيات الشاملة</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {reports.map(r => (
                        <Card key={r.id} className={`p-6 cursor-pointer transition-all hover:shadow-lg ${reportType === r.id ? 'ring-2 ring-purple-500 bg-purple-50' : ''}`} onClick={() => setReportType(r.id)}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${reportType === r.id ? 'bg-purple-500 text-white' : 'bg-gray-100'}`}><r.icon className="h-6 w-6" /></div>
                                <div>
                                    <p className="font-semibold">{r.name}</p>
                                    <p className="text-sm text-gray-500">{r.count} تقرير</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                <Card className="p-6">
                    <CardHeader className="px-0 pt-0"><CardTitle>إنشاء تقرير جديد</CardTitle></CardHeader>
                    <CardContent className="px-0 space-y-4">
                        <Select value={reportType} onValueChange={setReportType}>
                            <SelectTrigger className="w-[300px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {reports.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <div className="flex gap-4">
                            <Button className="bg-purple-600 hover:bg-purple-700"><BarChart3 className="h-4 w-4 ml-2" />إنشاء التقرير</Button>
                            <Button variant="outline"><Download className="h-4 w-4 ml-2" />تصدير PDF</Button>
                            <Button variant="outline"><Download className="h-4 w-4 ml-2" />تصدير Excel</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="p-6">
                    <CardHeader className="px-0 pt-0"><CardTitle>التقارير الأخيرة</CardTitle></CardHeader>
                    <CardContent className="px-0">
                        <div className="space-y-3">
                            {[{ name: 'تقرير الموظفين - يناير 2024', date: '15/01/2024' }, { name: 'تقرير الحضور الشهري', date: '10/01/2024' }, { name: 'تحليل الرواتب Q4', date: '05/01/2024' }].map((r, i) => (
                                <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3"><FileText className="h-5 w-5 text-purple-600" /><span className="font-medium">{r.name}</span></div>
                                    <div className="flex items-center gap-3"><span className="text-sm text-gray-500">{r.date}</span><Button size="sm" variant="ghost"><Download className="h-4 w-4" /></Button></div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default HRReports;
