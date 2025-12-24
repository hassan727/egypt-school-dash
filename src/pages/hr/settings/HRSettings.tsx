/**
 * صفحة إعدادات HR - نظام الموارد البشرية
 */
import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Building2, Users, Clock, Calendar, Wallet, Bell, Link } from 'lucide-react';
import { toast } from 'sonner';

const HRSettings = () => {
    const [settings, setSettings] = useState({
        schoolName: 'مدرسة النجاح',
        workingDays: '5',
        workingHours: '8',
        graceMinutes: '15',
        annualLeave: '21',
        sickLeave: '7',
        enableNotifications: true,
        enableIntegration: true,
    });

    const handleSave = () => toast.success('تم حفظ الإعدادات بنجاح');

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3"><Settings className="h-8 w-8 text-gray-600" />إعدادات HR</h1>
                    <p className="text-gray-500">ضبط إعدادات نظام الموارد البشرية</p>
                </div>

                <Tabs defaultValue="general">
                    <TabsList className="grid grid-cols-5 w-full max-w-3xl">
                        <TabsTrigger value="general"><Building2 className="h-4 w-4 ml-2" />عام</TabsTrigger>
                        <TabsTrigger value="attendance"><Clock className="h-4 w-4 ml-2" />الدوام</TabsTrigger>
                        <TabsTrigger value="leaves"><Calendar className="h-4 w-4 ml-2" />الإجازات</TabsTrigger>
                        <TabsTrigger value="payroll"><Wallet className="h-4 w-4 ml-2" />الرواتب</TabsTrigger>
                        <TabsTrigger value="notifications"><Bell className="h-4 w-4 ml-2" />الإشعارات</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general">
                        <Card>
                            <CardHeader><CardTitle>إعدادات المؤسسة</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 gap-6">
                                <div><Label>اسم المؤسسة</Label><Input value={settings.schoolName} onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })} /></div>
                                <div><Label>أيام العمل الأسبوعية</Label><Input type="number" value={settings.workingDays} onChange={(e) => setSettings({ ...settings, workingDays: e.target.value })} /></div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="attendance">
                        <Card>
                            <CardHeader><CardTitle>إعدادات الدوام</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 gap-6">
                                <div><Label>ساعات العمل اليومية</Label><Input type="number" value={settings.workingHours} onChange={(e) => setSettings({ ...settings, workingHours: e.target.value })} /></div>
                                <div><Label>فترة السماح (دقيقة)</Label><Input type="number" value={settings.graceMinutes} onChange={(e) => setSettings({ ...settings, graceMinutes: e.target.value })} /></div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="leaves">
                        <Card>
                            <CardHeader><CardTitle>إعدادات الإجازات</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 gap-6">
                                <div><Label>الإجازة السنوية (أيام)</Label><Input type="number" value={settings.annualLeave} onChange={(e) => setSettings({ ...settings, annualLeave: e.target.value })} /></div>
                                <div><Label>الإجازة المرضية (أيام)</Label><Input type="number" value={settings.sickLeave} onChange={(e) => setSettings({ ...settings, sickLeave: e.target.value })} /></div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="payroll">
                        <Card>
                            <CardHeader><CardTitle>إعدادات الرواتب</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-gray-500">إعدادات مكونات الراتب والخصومات والبدلات</p>
                                <Button variant="outline">إدارة مكونات الراتب</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="notifications">
                        <Card>
                            <CardHeader><CardTitle>إعدادات الإشعارات</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between"><Label>تفعيل الإشعارات</Label><Switch checked={settings.enableNotifications} onCheckedChange={(v) => setSettings({ ...settings, enableNotifications: v })} /></div>
                                <div className="flex items-center justify-between"><Label>تكامل مع المالية</Label><Switch checked={settings.enableIntegration} onCheckedChange={(v) => setSettings({ ...settings, enableIntegration: v })} /></div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end"><Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">حفظ الإعدادات</Button></div>
            </div>
        </DashboardLayout>
    );
};

export default HRSettings;
