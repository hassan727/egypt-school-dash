
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
    Calendar as CalendarIcon,
    Loader2,
    QrCode
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import SmartCalendar from '@/components/hr/SmartCalendar';
import { useSystemSchoolId } from '@/context/SystemContext';

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
    const contextSchoolId = useSystemSchoolId();
    const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(contextSchoolId);
    const [schools, setSchools] = useState<{ id: string, school_name: string }[]>([]);

    // For Admins/Devs: Fetch list of schools if no context school is present
    useEffect(() => {
        if (!contextSchoolId) {
            const fetchSchools = async () => {
                const { data } = await supabase.from('schools').select('id, school_name').order('school_name');
                if (data && data.length > 0) {
                    setSchools(data);
                    setSelectedSchoolId(data[0].id); // Default to first school
                }
            };
            fetchSchools();
        } else {
            setSelectedSchoolId(contextSchoolId);
        }
    }, [contextSchoolId]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<HRSettings | null>(null);

    // New state for locations-based geofencing
    const [locations, setLocations] = useState<any[]>([]);
    const [defaultLocationId, setDefaultLocationId] = useState<string | null>(null);
    const [geofencingEnabled, setGeofencingEnabled] = useState(false);

    // Quick add location dialog
    const [addLocationOpen, setAddLocationOpen] = useState(false);
    const [newLocation, setNewLocation] = useState({
        location_name: '',
        latitude: '',
        longitude: '',
        radius_meters: '100',
    });

    // QR Time Restriction Settings State
    const [qrTimeSettings, setQrTimeSettings] = useState({
        enforce_time_restrictions: false,
        check_in_start_time: '06:00',
        check_in_end_time: '12:00',
        check_out_start_time: '13:00',
        check_out_end_time: '20:00',
    });

    useEffect(() => {
        if (selectedSchoolId) fetchSettings();
    }, [selectedSchoolId]);

    useEffect(() => {
        if (selectedSchoolId) {
            fetchGeofencingSettings();
        }
    }, [selectedSchoolId]);

    const fetchGeofencingSettings = async () => {
        if (!selectedSchoolId) return;

        // 1. Fetch all active locations
        const { data: locs } = await supabase
            .from('attendance_locations')
            .select('*')
            .eq('school_id', selectedSchoolId)
            .eq('is_active', true)
            .order('location_name');
        setLocations(locs || []);

        // 2. Fetch geofencing enabled status AND QR time settings
        const { data: allSettings } = await supabase
            .from('attendance_settings')
            .select('setting_key, setting_value')
            .eq('school_id', selectedSchoolId)
            .in('setting_key', [
                'enable_geofencing',
                'enforce_time_restrictions',
                'check_in_start_time',
                'check_in_end_time',
                'check_out_start_time',
                'check_out_end_time'
            ]);

        const settingsMap: Record<string, string> = {};
        allSettings?.forEach(s => { settingsMap[s.setting_key] = s.setting_value; });

        setGeofencingEnabled(settingsMap['enable_geofencing'] === 'true');

        // Load QR time settings
        setQrTimeSettings({
            enforce_time_restrictions: settingsMap['enforce_time_restrictions'] === 'true',
            check_in_start_time: settingsMap['check_in_start_time'] || '06:00',
            check_in_end_time: settingsMap['check_in_end_time'] || '12:00',
            check_out_start_time: settingsMap['check_out_start_time'] || '13:00',
            check_out_end_time: settingsMap['check_out_end_time'] || '20:00',
        });

        // 3. Find default location
        const defaultLoc = locs?.find(loc => loc.is_default === true);
        setDefaultLocationId(defaultLoc?.id || null);
    };

    const handleSaveGeofencing = async () => {
        if (!selectedSchoolId) {
            toast.error('لم يتم تحديد المدرسة (وضع التطوير: تأكد من وجود مدارس في قاعدة البيانات)');
            return;
        }

        if (!defaultLocationId && geofencingEnabled) {
            toast.error('يرجى اختيار موقع افتراضي قبل تفعيل السياج الجغرافي');
            return;
        }

        try {
            // 1. Update is_default for all locations
            await supabase
                .from('attendance_locations')
                .update({ is_default: false })
                .eq('school_id', selectedSchoolId)
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

            // 2. Set new default location
            if (defaultLocationId) {
                await supabase
                    .from('attendance_locations')
                    .update({ is_default: true })
                    .eq('id', defaultLocationId);
            }

            // 3. Save enabled status
            await supabase
                .from('attendance_settings')
                .upsert({
                    setting_key: 'enable_geofencing',
                    setting_value: String(geofencingEnabled),
                    setting_category: 'geofencing',
                    school_id: selectedSchoolId
                }, { onConflict: 'setting_key,school_id' });

            toast.success('تم حفظ إعدادات السياج الجغرافي بنجاح');
            fetchGeofencingSettings();
        } catch (error) {
            console.error(error);
            toast.error('فشل في حفظ الإعدادات');
        }
    };

    // Save QR Time Restriction Settings
    const handleSaveQrTimeSettings = async () => {
        if (!selectedSchoolId) {
            toast.error('لم يتم تحديد المدرسة');
            return;
        }

        try {
            const settingsToSave = [
                { setting_key: 'enforce_time_restrictions', setting_value: String(qrTimeSettings.enforce_time_restrictions), setting_category: 'qr_scan' },
                { setting_key: 'check_in_start_time', setting_value: qrTimeSettings.check_in_start_time, setting_category: 'qr_scan' },
                { setting_key: 'check_in_end_time', setting_value: qrTimeSettings.check_in_end_time, setting_category: 'qr_scan' },
                { setting_key: 'check_out_start_time', setting_value: qrTimeSettings.check_out_start_time, setting_category: 'qr_scan' },
                { setting_key: 'check_out_end_time', setting_value: qrTimeSettings.check_out_end_time, setting_category: 'qr_scan' },
            ];

            for (const setting of settingsToSave) {
                await supabase
                    .from('attendance_settings')
                    .upsert({
                        ...setting,
                        school_id: selectedSchoolId
                    }, { onConflict: 'setting_key,school_id' });
            }

            toast.success('تم حفظ إعدادات مسح QR بنجاح');
        } catch (error) {
            console.error(error);
            toast.error('فشل في حفظ إعدادات مسح QR');
        }
    };

    const handleAddLocation = async () => {
        if (!newLocation.location_name.trim()) {
            toast.error('يرجى إدخال اسم الموقع');
            return;
        }

        if (!selectedSchoolId) {
            toast.error('لم يتم تحديد المدرسة');
            return;
        }

        try {
            const { data: locationData, error } = await supabase
                .from('attendance_locations')
                .insert({
                    school_id: selectedSchoolId,
                    location_name: newLocation.location_name,
                    latitude: parseFloat(newLocation.latitude) || 30.0444,
                    longitude: parseFloat(newLocation.longitude) || 31.2357,
                    radius_meters: parseInt(newLocation.radius_meters) || 100,
                    is_default: locations.length === 0, // First location is default
                    is_active: true,
                })
                .select()
                .single();

            if (error) throw error;

            toast.success('تم إضافة الموقع بنجاح');
            setAddLocationOpen(false);
            setNewLocation({ location_name: '', latitude: '', longitude: '', radius_meters: '100' });
            fetchGeofencingSettings();
        } catch (error: any) {
            console.error(error);
            toast.error('فشل في إضافة الموقع');
        }
    };

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data: settingsData, error } = await supabase
                .from('hr_system_settings')
                .select('*')
                .eq('school_id', selectedSchoolId)
                .maybeSingle();

            if (error) throw error;

            if (!settingsData) {
                // No rows found, create default
                await createDefaultSettings();
            } else {
                setSettings(settingsData);
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
                    school_id: selectedSchoolId,
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
            <div className="space-y-6 max-w-5xl mx-auto pb-10 text-right" dir="rtl">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-800">
                            <Settings className="h-8 w-8 text-indigo-600" />
                            إعدادات نظام الحضور
                        </h1>
                        <p className="text-gray-500 mt-1">التحكم الكامل في قواعد الحضور، الخصومات، والمواعيد</p>
                    </div>
                    {/* Admin/Dev Mode: School Selector */}
                    {!contextSchoolId && schools.length > 0 && (
                        <div className="min-w-[200px]">
                            <Select value={selectedSchoolId || ''} onValueChange={setSelectedSchoolId}>
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="اختر المدرسة للتعديل" />
                                </SelectTrigger>
                                <SelectContent>
                                    {schools.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.school_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1 mr-1">وضع المطور: اختر المدرسة</p>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchSettings} disabled={saving}>
                            <RotateCcw className="h-4 w-4" />
                            تحديث
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="times" className="space-y-6">
                    <TabsList className="mb-4 flex flex-wrap justify-center gap-2 bg-transparent p-0">
                        <TabsTrigger
                            value="times"
                            className="flex-1 min-w-[120px] rounded-lg border bg-white px-4 py-3 text-sm font-medium shadow-sm transition-all hover:bg-gray-50 hover:text-indigo-600 data-[state=active]:border-indigo-600 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-md"
                        >
                            <Clock className="mb-1 h-5 w-5 md:ml-2 md:inline md:mb-0" />
                            المواعيد
                        </TabsTrigger>
                        <TabsTrigger
                            value="penalties"
                            className="flex-1 min-w-[120px] rounded-lg border bg-white px-4 py-3 text-sm font-medium shadow-sm transition-all hover:bg-gray-50 hover:text-indigo-600 data-[state=active]:border-indigo-600 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-md"
                        >
                            <DollarSign className="mb-1 h-5 w-5 md:ml-2 md:inline md:mb-0" />
                            الجزاءات
                        </TabsTrigger>
                        <TabsTrigger
                            value="days"
                            className="flex-1 min-w-[120px] rounded-lg border bg-white px-4 py-3 text-sm font-medium shadow-sm transition-all hover:bg-gray-50 hover:text-indigo-600 data-[state=active]:border-indigo-600 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-md"
                        >
                            <CalendarDays className="mb-1 h-5 w-5 md:ml-2 md:inline md:mb-0" />
                            أيام الأسبوع
                        </TabsTrigger>
                        <TabsTrigger
                            value="calendar"
                            className="flex-1 min-w-[120px] rounded-lg border bg-white px-4 py-3 text-sm font-medium shadow-sm transition-all hover:bg-gray-50 hover:text-indigo-600 data-[state=active]:border-indigo-600 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-md"
                        >
                            <CalendarIcon className="mb-1 h-5 w-5 md:ml-2 md:inline md:mb-0" />
                            التقويم الذكي
                        </TabsTrigger>
                        <TabsTrigger
                            value="qr_settings"
                            className="flex-1 min-w-[120px] rounded-lg border bg-white px-4 py-3 text-sm font-medium shadow-sm transition-all hover:bg-gray-50 hover:text-purple-600 data-[state=active]:border-purple-600 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:shadow-md"
                        >
                            <QrCode className="mb-1 h-5 w-5 md:ml-2 md:inline md:mb-0" />
                            تحكم QR
                        </TabsTrigger>
                    </TabsList>


                    {/* Times Tab */}
                    <TabsContent value="times" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 justify-start">
                                    <Clock className="h-5 w-5 text-blue-600" />
                                    <span>المواعيد الرسمية</span>
                                </CardTitle>
                                <CardDescription className="text-right">حدد مواعيد العمل الرسمية الافتراضية للمدرسة</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 text-right">
                                        <Label>موعد الحضور الرسمي</Label>
                                        <Input
                                            type="time"
                                            className="text-right"
                                            value={settings?.official_start_time}
                                            onChange={(e) => updateSetting('official_start_time', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2 text-right">
                                        <Label>موعد الانصراف الرسمي</Label>
                                        <Input
                                            type="time"
                                            className="text-right"
                                            value={settings?.official_end_time}
                                            onChange={(e) => updateSetting('official_end_time', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 justify-start">
                                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                                    <span>فترات السماح (Grace Periods)</span>
                                </CardTitle>
                                <CardDescription className="text-right">التحكم في المرونة المسموح بها قبل تطبيق الخصومات</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-3 text-right">
                                        <Label>سماح التأخير الصباحي (دقيقة)</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                min="0"
                                                className="text-right"
                                                value={settings?.lateness_grace_period_minutes}
                                                onChange={(e) => updateSetting('lateness_grace_period_minutes', parseInt(e.target.value))}
                                            />
                                            <span className="text-gray-500 text-sm whitespace-nowrap">دقيقة</span>
                                        </div>
                                        <p className="text-xs text-gray-500">لن يخصم من الموظف إذا تأخر أقل من هذه المدة.</p>
                                    </div>

                                    <div className="space-y-3 text-right">
                                        <Label className="text-red-600">الحد الأقصى للسماح (Smart Grace)</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                min="0"
                                                className="border-red-200 focus:ring-red-500 text-right"
                                                value={settings?.max_grace_period_minutes}
                                                onChange={(e) => updateSetting('max_grace_period_minutes', parseInt(e.target.value))}
                                            />
                                            <span className="text-gray-500 text-sm whitespace-nowrap">دقيقة</span>
                                        </div>
                                        <p className="text-xs text-red-500">إذا تجاوز التأخير هذه المدة، يتم إلغاء السماح ويخصم التأخير بالكامل.</p>
                                    </div>

                                    <div className="space-y-3 text-right">
                                        <Label>سماح الانصراف المبكر</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                min="0"
                                                className="text-right"
                                                value={settings?.early_departure_grace_minutes}
                                                onChange={(e) => updateSetting('early_departure_grace_minutes', parseInt(e.target.value))}
                                            />
                                            <span className="text-gray-500 text-sm whitespace-nowrap">دقيقة</span>
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

                    {/* 5. QR Time Restriction Settings Tab */}
                    <TabsContent value="qr_settings" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 justify-start">
                                    <QrCode className="h-5 w-5 text-purple-600" />
                                    <span>تحكم مسح QR Code</span>
                                </CardTitle>
                                <CardDescription className="text-right">
                                    تحديد الفترات الزمنية المسموح فيها لمسح رموز الحضور والانصراف
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Master Toggle */}
                                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-100">
                                    <div className="space-y-1">
                                        <Label className="text-purple-700 font-bold">تفعيل قيود الوقت</Label>
                                        <p className="text-xs text-purple-600">عند التفعيل، لن يستطيع الموظف تسجيل الحضور/الانصراف خارج الأوقات المحددة</p>
                                    </div>
                                    <Switch
                                        checked={qrTimeSettings.enforce_time_restrictions}
                                        onCheckedChange={(checked) => setQrTimeSettings({ ...qrTimeSettings, enforce_time_restrictions: checked })}
                                    />
                                </div>

                                {qrTimeSettings.enforce_time_restrictions && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Check-in Time Window */}
                                        <Card className="border-green-200 bg-green-50/50">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-lg text-green-700 flex items-center gap-2">
                                                    <Clock className="h-5 w-5" />
                                                    فترة تسجيل الحضور
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label>من الساعة</Label>
                                                    <Input
                                                        type="time"
                                                        value={qrTimeSettings.check_in_start_time}
                                                        onChange={(e) => setQrTimeSettings({ ...qrTimeSettings, check_in_start_time: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>إلى الساعة</Label>
                                                    <Input
                                                        type="time"
                                                        value={qrTimeSettings.check_in_end_time}
                                                        onChange={(e) => setQrTimeSettings({ ...qrTimeSettings, check_in_end_time: e.target.value })}
                                                    />
                                                </div>
                                                <p className="text-xs text-green-600">
                                                    الموظف يستطيع تسجيل الحضور فقط بين {qrTimeSettings.check_in_start_time} و {qrTimeSettings.check_in_end_time}
                                                </p>
                                            </CardContent>
                                        </Card>

                                        {/* Check-out Time Window */}
                                        <Card className="border-blue-200 bg-blue-50/50">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-lg text-blue-700 flex items-center gap-2">
                                                    <Clock className="h-5 w-5" />
                                                    فترة تسجيل الانصراف
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label>من الساعة</Label>
                                                    <Input
                                                        type="time"
                                                        value={qrTimeSettings.check_out_start_time}
                                                        onChange={(e) => setQrTimeSettings({ ...qrTimeSettings, check_out_start_time: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>إلى الساعة</Label>
                                                    <Input
                                                        type="time"
                                                        value={qrTimeSettings.check_out_end_time}
                                                        onChange={(e) => setQrTimeSettings({ ...qrTimeSettings, check_out_end_time: e.target.value })}
                                                    />
                                                </div>
                                                <p className="text-xs text-blue-600">
                                                    الموظف يستطيع تسجيل الانصراف فقط بين {qrTimeSettings.check_out_start_time} و {qrTimeSettings.check_out_end_time}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {/* Save Button */}
                                <div className="flex justify-end pt-4 border-t">
                                    <Button onClick={handleSaveQrTimeSettings} className="bg-purple-600 hover:bg-purple-700">
                                        <Save className="h-4 w-4 ml-2" />
                                        حفظ إعدادات QR
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Info Card */}
                        <Card className="bg-yellow-50 border-yellow-200">
                            <CardContent className="py-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                    <div className="text-sm text-yellow-800">
                                        <p className="font-bold mb-1">ملاحظات هامة:</p>
                                        <ul className="list-disc mr-4 space-y-1">
                                            <li>لن يستطيع الموظف تسجيل انصراف بدون تسجيل حضور أولاً</li>
                                            <li>إذا حاول الموظف مسح QR خارج الفترة المسموحة سيظهر له رسالة خطأ</li>
                                            <li>يتم تسجيل موقع GPS الموظف مع كل عملية مسح</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
