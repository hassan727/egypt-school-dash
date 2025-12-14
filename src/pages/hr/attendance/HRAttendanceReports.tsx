/**
 * صفحة تقارير الحضور - نظام الموارد البشرية
 */
import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Download, Calendar, Users, Clock, AlertTriangle } from 'lucide-react';

const HRAttendanceReports = () => {
    const [reportType, setReportType] = useState('monthly');
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3"><BarChart3 className="h-8 w-8 text-indigo-600" />تقارير الحضور</h1>
                    <p className="text-gray-500">تقارير تحليلية للحضور والغياب</p>
                </div>

                <Card className="p-4">
                    <div className="flex gap-4 flex-wrap">
                        <Select value={reportType} onValueChange={setReportType}>
                            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">تقرير يومي</SelectItem>
                                <SelectItem value="weekly">تقرير أسبوعي</SelectItem>
                                <SelectItem value="monthly">تقرير شهري</SelectItem>
                                <SelectItem value="yearly">تقرير سنوي</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-[200px]" />
                        <Button><Download className="h-4 w-4 ml-2" />تصدير التقرير</Button>
                    </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
                        <div className="flex items-center gap-4">
                            <Users className="h-10 w-10 text-blue-600" />
                            <div><p className="text-sm text-blue-600">إجمالي أيام العمل</p><p className="text-3xl font-bold text-blue-900">22</p></div>
                        </div>
                    </Card>
                    <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
                        <div className="flex items-center gap-4">
                            <Clock className="h-10 w-10 text-green-600" />
                            <div><p className="text-sm text-green-600">متوسط الحضور</p><p className="text-3xl font-bold text-green-900">95%</p></div>
                        </div>
                    </Card>
                    <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100">
                        <div className="flex items-center gap-4">
                            <AlertTriangle className="h-10 w-10 text-yellow-600" />
                            <div><p className="text-sm text-yellow-600">حالات التأخير</p><p className="text-3xl font-bold text-yellow-900">45</p></div>
                        </div>
                    </Card>
                    <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100">
                        <div className="flex items-center gap-4">
                            <Calendar className="h-10 w-10 text-red-600" />
                            <div><p className="text-sm text-red-600">إجمالي الغياب</p><p className="text-3xl font-bold text-red-900">12</p></div>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle>أكثر الموظفين تأخراً</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {['أحمد محمد', 'سارة أحمد', 'محمود علي'].map((name, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="font-medium">{name}</span>
                                        <span className="text-yellow-600 font-bold">{5 - i} مرات</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>أكثر الموظفين غياباً</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {['خالد إبراهيم', 'فاطمة حسن', 'عمر سعيد'].map((name, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="font-medium">{name}</span>
                                        <span className="text-red-600 font-bold">{3 - i} أيام</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default HRAttendanceReports;
