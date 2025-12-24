/**
 * صفحة إرسال الرواتب للمالية - نظام الموارد البشرية
 */
import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, CheckCircle, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const HRPayrollExport = () => {
    const [sending, setSending] = useState(false);
    const [progress, setProgress] = useState(0);
    const [lastExport, setLastExport] = useState<any>(null);

    const handleExport = async () => {
        setSending(true);
        setProgress(0);
        for (let i = 0; i <= 100; i += 20) {
            await new Promise(r => setTimeout(r, 500));
            setProgress(i);
        }
        setSending(false);
        setLastExport({ date: new Date().toLocaleString('ar-EG'), employees: 45, total: 425000 });
        toast.success('تم إرسال البيانات للمالية بنجاح');
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3"><Send className="h-8 w-8 text-blue-600" />إرسال للمالية</h1>
                    <p className="text-gray-500">إرسال بيانات الرواتب لقسم الإدارة المالية</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <Card className="p-6">
                        <CardHeader className="px-0 pt-0"><CardTitle>حالة الدورة الحالية</CardTitle></CardHeader>
                        <CardContent className="px-0 space-y-4">
                            <div className="flex justify-between"><span>الشهر:</span><Badge>يناير 2024</Badge></div>
                            <div className="flex justify-between"><span>عدد الموظفين:</span><span className="font-bold">45</span></div>
                            <div className="flex justify-between"><span>إجمالي المستحقات:</span><span className="font-bold text-emerald-600">425,000 ج.م</span></div>
                            <div className="flex justify-between"><span>الحالة:</span><Badge className="bg-yellow-100 text-yellow-800">جاهز للإرسال</Badge></div>
                        </CardContent>
                    </Card>

                    <Card className="p-6">
                        <CardHeader className="px-0 pt-0"><CardTitle>إرسال البيانات</CardTitle></CardHeader>
                        <CardContent className="px-0 space-y-4">
                            {sending ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin text-blue-600" /><span>جاري إرسال البيانات...</span></div>
                                    <Progress value={progress} />
                                    <p className="text-sm text-gray-500">{progress}% مكتمل</p>
                                </div>
                            ) : (
                                <Button onClick={handleExport} className="w-full bg-blue-600 hover:bg-blue-700" size="lg"><Send className="h-5 w-5 ml-2" />إرسال الآن</Button>
                            )}
                            {lastExport && (
                                <Alert className="bg-green-50 border-green-200"><CheckCircle className="h-4 w-4 text-green-600" /><AlertDescription className="text-green-800">آخر إرسال: {lastExport.date} - {lastExport.employees} موظف - {lastExport.total.toLocaleString()} ج.م</AlertDescription></Alert>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card className="p-6">
                    <CardHeader className="px-0 pt-0"><CardTitle>سجل الإرسال</CardTitle></CardHeader>
                    <CardContent className="px-0">
                        <div className="space-y-3">
                            {[{ month: 'ديسمبر 2023', date: '28/12/2023', status: 'مكتمل' }, { month: 'نوفمبر 2023', date: '27/11/2023', status: 'مكتمل' }].map((item, i) => (
                                <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                    <div><p className="font-semibold">{item.month}</p><p className="text-sm text-gray-500">{item.date}</p></div>
                                    <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 ml-1" />{item.status}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default HRPayrollExport;
