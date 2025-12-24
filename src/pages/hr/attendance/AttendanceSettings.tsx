
/**
 * صفحة إعدادات الحضور والانصراف - لوحة التحكم الكاملة
 * Advanced Attendance Settings Dashboard
 */

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Settings,
    Clock,
    AlertTriangle,
    DollarSign,
    Save,
    RotateCcw,
    CalendarDays,
    Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import SmartCalendar from '@/components/hr/SmartCalendar';

interface DaySetting {
    is_off: boolean;
    start_time?: string;
    end_time?: string;
}

interface HRSettings {
    id: string;
    absence_penalty_rate: number;
    lateness_penalty_rate: number;
    early_departure_penalty_rate: number;
    overtime_rate: number;
    lateness_grace_period_minutes: number;
    max_grace_period_minutes: number;
    early_departure_grace_minutes: number;
    official_start_time: string;
    official_end_time: string;
    working_hours_per_day: number;
    working_days_per_month: number;
    day_settings: Record<string, DaySetting>;
}

const WeekDays = [
    { key: 'sunday', label: 'الأحد' },
    { key: 'monday', label: 'الاثنين' },
    { key: 'tuesday', label: 'الثلاثاء' },
    { key: 'wednesday', label: 'الأربعاء' },
    { key: 'thursday', label: 'الخميس' },
    { key: 'friday', label: 'الجمعة' },
    { key: 'saturday', label: 'السبت' },
];

export default function AttendanceSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<HRSettings | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('hr_system_settings')
                .select('*')
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                // No rows found, create default
                await createDefaultSettings();
            } else {
                setSettings(data);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('فشل في تحميل الإعدادات');
        } finally {
            setLoading(false);
        }
    };

    const createDefaultSettings = async () => {
        setSettings({
            id: '',
            absence_penalty_rate: 1.0,
            lateness_penalty_rate: 1.0,
            early_departure_penalty_rate: 1.0,
            overtime_rate: 1.5,
            lateness_grace_period_minutes: 15,
            max_grace_period_minutes: 30,
            early_departure_grace_minutes: 15,
            official_start_time: '08:00',
            official_end_time: '15:45',
            working_hours_per_day: 8,
            working_days_per_month: 30,
            day_settings: {}
        });
    };

    const handleSave = async () => {
        if (!settings) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('hr_system_settings')
                .upsert({
                    ...settings,
                    id: settings.id || undefined,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            toast.success('تم حفظ الإعدادات بنجاح');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('فشل في حفظ التغييرات');
        } finally {
            setSaving(false);
        }
    };

    const updateSetting = (key: keyof HRSettings, value: any) => {
        if (!settings) return;
        setSettings({ ...settings, [key]: value });
    };

    const updateDaySetting = (dayKey: string, field: keyof DaySetting, value: any) => {
        if (!settings) return;
        const currentDaySettings = settings.day_settings || {};
        const dayConfig = currentDaySettings[dayKey] || { is_off: false };

        setSettings({
            ...settings,
            day_settings: {
                ...currentDaySettings,
                [dayKey]: {
                    ...dayConfig,
                    [field]: value
                }
            }
        });
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-[50vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-5xl mx-auto pb-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-800">
                            <Settings className="h-8 w-8 text-indigo-600" />
                            إعدادات نظام الحضور
                        </h1>
                        <p className="text-gray-500 mt-1">التحكم الكامل في قواعد الحضور، الخصومات، والمواعيد</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchSettings} disabled={saving}>
                            <RotateCcw className="h-4 w-4 ml-2" />
                            تحديث
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                            {saving ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
                            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="times" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
                        <TabsTrigger value="times">المواعيد</TabsTrigger>
                        <TabsTrigger value="penalties">الجزاءات</TabsTrigger>
                        <TabsTrigger value="days">أيام الأسبوع</TabsTrigger>
                        <TabsTrigger value="calendar">التقويم الذكي</TabsTrigger>
                    </TabsList>

                    {/* 1. Times & Grace Periods */}
                    <TabsContent value="times" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-blue-600" />
                                    المواعيد الرسمية
                                </CardTitle>
                                <CardDescription>حدد مواعيد العمل الرسمية الافتراضية للمدرسة</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>موعد الحضور الرسمي</Label>
                                        <Input
                                            type="time"
                                            value={settings?.official_start_time}
                                            onChange={(e) => updateSetting('official_start_time', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>موعد الانصراف الرسمي</Label>
                                        <Input
                                            type="time"
                                            value={settings?.official_end_time}
                                            onChange={(e) => updateSetting('official_end_time', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                                    فترات السماح (Grace Periods)
                                </CardTitle>
                                <CardDescription>التحكم في المرونة المسموح بها قبل تطبيق الخصومات</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-3">
                                        <Label>سماح التأخير الصباحي (دقيقة)</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                min="0"
                                                value={settings?.lateness_grace_period_minutes}
                                                onChange={(e) => updateSetting('lateness_grace_period_minutes', parseInt(e.target.value))}
                                            />
                                            <span className="text-gray-500 text-sm">دقيقة</span>
                                        </div>
                                        <p className="text-xs text-gray-500">لن يخصم من الموظف إذا تأخر أقل من هذه المدة.</p>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-red-600">الحد الأقصى للسماح (Smart Grace)</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                min="0"
                                                className="border-red-200 focus:ring-red-500"
                                                value={settings?.max_grace_period_minutes}
                                                onChange={(e) => updateSetting('max_grace_period_minutes', parseInt(e.target.value))}
                                            />
                                            <span className="text-gray-500 text-sm">دقيقة</span>
                                        </div>
                                        <p className="text-xs text-red-500">إذا تجاوز التأخير هذه المدة، يتم إلغاء السماح ويخصم التأخير بالكامل.</p>
                                    </div>

                                    <div className="space-y-3">
                                        <Label>سماح الانصراف المبكر</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                min="0"
                                                value={settings?.early_departure_grace_minutes}
                                                onChange={(e) => updateSetting('early_departure_grace_minutes', parseInt(e.target.value))}
                                            />
                                            <span className="text-gray-500 text-sm">دقيقة</span>
                                        </div>
                                        <p className="text-xs text-gray-500">هامش مسموح به عند المغادرة قبل الموعد.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 2. Penalties & Money */}
                    <TabsContent value="penalties" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-green-600" />
                                    معدلات الخصم والمكافأة
                                </CardTitle>
                                <CardDescription>تحديد قيمة الدقيقة/اليوم في حالات المخالفات أو الإضافي</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-100">
                                        <Label className="text-red-700">معدل خصم الغياب (أيام)</Label>
                                        <Input
                                            type="number"
                                            step="0.25"
                                            value={settings?.absence_penalty_rate}
                                            onChange={(e) => updateSetting('absence_penalty_rate', parseFloat(e.target.value))}
                                        />
                                        <p className="text-xs text-red-600">مثال: 1.0 تعني خصم يوم مقابل يوم. 2.0 تعني خصم يومين.</p>
                                    </div>

                                    <div className="space-y-3 p-4 bg-orange-50 rounded-lg border border-orange-100">
                                        <Label className="text-orange-700">معدل خصم التأخير</Label>
                                        <Input
                                            type="number"
                                            step="0.25"
                                            value={settings?.lateness_penalty_rate}
                                            onChange={(e) => updateSetting('lateness_penalty_rate', parseFloat(e.target.value))}
                                        />
                                        <p className="text-xs text-orange-600">مثال: 1.0 تعني الدقيقة بدقيقة. 2.0 الدقيقة بدقيقتين.</p>
                                    </div>

                                    <div className="space-y-3 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                                        <Label className="text-yellow-700">معدل الانصراف المبكر</Label>
                                        <Input
                                            type="number"
                                            step="0.25"
                                            value={settings?.early_departure_penalty_rate}
                                            onChange={(e) => updateSetting('early_departure_penalty_rate', parseFloat(e.target.value))}
                                        />
                                        <p className="text-xs text-yellow-600">يفضل أن يكون مساوياً أو أعلى من التأخير.</p>
                                    </div>

                                    <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-100">
                                        <Label className="text-green-700">معدل الإضافي (Overtime)</Label>
                                        <Input
                                            type="number"
                                            step="0.25"
                                            value={settings?.overtime_rate}
                                            onChange={(e) => updateSetting('overtime_rate', parseFloat(e.target.value))}
                                        />
                                        <p className="text-xs text-green-600">مثال: 1.5 تعني الساعة بساعة ونصف.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 3. Day Specific Rules */}
                    <TabsContent value="days">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CalendarDays className="h-5 w-5 text-indigo-600" />
                                    تخصيص أيام الأسبوع
                                </CardTitle>
                                <CardDescription>
                                    هل يوم الخميس نصف دوام؟ هل الجمعة عطلة؟ خصص كل يوم على حدة.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {WeekDays.map((day) => {
                                        const daySettings = settings?.day_settings?.[day.key] || { is_off: false };
                                        const isOff = daySettings.is_off;

                                        return (
                                            <div key={day.key} className="flex flex-col md:flex-row items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                                <div className="w-32 font-bold flex items-center gap-2">
                                                    <div className={`w-2 h-8 rounded-full ${isOff ? 'bg-gray-300' : 'bg-green-500'}`} />
                                                    {day.label}
                                                </div>

                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={isOff}
                                                            onCheckedChange={(checked) => updateDaySetting(day.key, 'is_off', checked)}
                                                        />
                                                        <Label>{isOff ? 'عطلة رسمية' : 'يوم عمل'}</Label>
                                                    </div>

                                                    {!isOff && (
                                                        <>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-gray-500">دخول:</span>
                                                                <Input
                                                                    type="time"
                                                                    className="w-32"
                                                                    value={daySettings.start_time || settings?.official_start_time}
                                                                    onChange={(e) => updateDaySetting(day.key, 'start_time', e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-gray-500">خروج:</span>
                                                                <Input
                                                                    type="time"
                                                                    className="w-32"
                                                                    value={daySettings.end_time || settings?.official_end_time}
                                                                    onChange={(e) => updateDaySetting(day.key, 'end_time', e.target.value)}
                                                                />
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                {isOff && <span className="text-gray-400 text-sm flex-1 text-center">لا توجد مواعيد (عطلة)</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 4. Smart Calendar Tab */}
                    <TabsContent value="calendar">
                        <SmartCalendar />
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
