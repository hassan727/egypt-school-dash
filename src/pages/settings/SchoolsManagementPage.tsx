/**
 * SchoolsManagementPage - صفحة إدارة المدارس
 * Admin-only page for creating and managing schools
 */

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    School,
    Plus,
    Edit,
    Trash2,
    Users,
    CheckCircle,
    XCircle,
    Loader2,
    Building,
    MapPin,
    Phone,
    Mail,
    Settings,
    Zap,
    Palette
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTenantSchools } from '@/hooks/useTenantData';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { School as SchoolType } from '@/types/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

export default function SchoolsManagementPage() {
    const { user, hasRole } = useAuth();
    const { fetchSchools } = useTenantSchools();
    const [schools, setSchools] = useState<SchoolType[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSchool, setEditingSchool] = useState<SchoolType | null>(null);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');

    // Default Settings
    const defaultSettings = {
        features: {
            finance: true,
            hr: true,
            students: true,
            control: true
        },
        branding: {
            logo_url: '',
            print_header: '',
            primary_color: '#2563eb'
        },
        limits: {
            max_users: 10,
            max_students: 500
        }
    };

    // Form state
    const [formData, setFormData] = useState({
        school_code: '',
        school_name: '',
        school_name_en: '',
        address: '',
        city: '',
        governorate: '',
        phone: '',
        email: '',
        settings: defaultSettings
    });

    // Load schools
    const loadSchools = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('schools')
                .select('*')
                .order('school_name');

            if (error) throw error;
            setSchools(data || []);
        } catch (error) {
            console.error('Error loading schools:', error);
            toast.error('فشل في تحميل المدارس');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSchools();
    }, []);

    // Handle form change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    // Handle Settings Change
    const handleSettingChange = (category: string, key: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            settings: {
                ...prev.settings,
                [category]: {
                    ...prev.settings[category as keyof typeof prev.settings],
                    [key]: value
                }
            }
        }));
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            school_code: '',
            school_name: '',
            school_name_en: '',
            address: '',
            city: '',
            governorate: '',
            phone: '',
            email: '',
            settings: defaultSettings
        });
        setEditingSchool(null);
        setActiveTab('basic');
    };

    // Open edit dialog
    const openEditDialog = (school: SchoolType) => {
        setEditingSchool(school);
        const currentSettings = school.settings || defaultSettings;
        // Merge with defaults to ensure all keys exist
        const mergedSettings = {
            features: { ...defaultSettings.features, ...(currentSettings.features || {}) },
            branding: { ...defaultSettings.branding, ...(currentSettings.branding || {}) },
            limits: { ...defaultSettings.limits, ...(currentSettings.limits || {}) }
        };

        setFormData({
            school_code: school.schoolCode,
            school_name: school.schoolName,
            school_name_en: school.schoolNameEn || '',
            address: school.address || '',
            city: school.city || '',
            governorate: school.governorate || '',
            phone: school.phone || '',
            email: school.email || '',
            settings: mergedSettings
        });
        setDialogOpen(true);
    };

    // Save school
    const handleSave = async () => {
        if (!formData.school_code || !formData.school_name) {
            toast.error('يرجى إدخال كود واسم المدرسة');
            return;
        }

        setSaving(true);
        try {
            const schoolData = {
                school_code: formData.school_code,
                school_name: formData.school_name,
                school_name_en: formData.school_name_en,
                address: formData.address,
                city: formData.city,
                governorate: formData.governorate,
                phone: formData.phone,
                email: formData.email,
                settings: formData.settings, // Save Settings JSON
            };

            if (editingSchool) {
                // Update
                const { error } = await supabase
                    .from('schools')
                    .update(schoolData)
                    .eq('id', editingSchool.id);

                if (error) throw error;
                toast.success('تم تحديث المدرسة وإعداداتها');
            } else {
                // Create
                const { error } = await supabase
                    .from('schools')
                    .insert({
                        ...schoolData,
                        is_active: true,
                    });

                if (error) throw error;
                toast.success('تم إنشاء المدرسة بنجاح');
            }

            setDialogOpen(false);
            resetForm();
            loadSchools();
        } catch (error: any) {
            console.error('Error saving school:', error);
            toast.error(error.message || 'فشل في حفظ المدرسة');
        } finally {
            setSaving(false);
        }
    };

    // Toggle school status
    const toggleStatus = async (schoolId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('schools')
                .update({ is_active: !currentStatus })
                .eq('id', schoolId);

            if (error) throw error;
            toast.success(currentStatus ? 'تم تعطيل المدرسة' : 'تم تفعيل المدرسة');
            loadSchools();
        } catch (error) {
            toast.error('فشل في تغيير الحالة');
        }
    };

    // Check admin access
    if (!hasRole(['admin'])) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">غير مصرح</h2>
                        <p className="text-gray-600">هذه الصفحة للمدير المركزي فقط</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <PageLayout
                title="إدارة المدارس"
                description="مركز التحكم: إنشاء وإدارة المدارس وتخصيص صلاحياتها"
                showBackButton
            >
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Building className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">إجمالي المدارس</p>
                                <p className="text-2xl font-bold text-blue-600">{schools.length}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-200">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">نشطة</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {schools.filter(s => s.isActive).length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-200">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <XCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">معطلة</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {schools.filter(s => !s.isActive).length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Add School Button */}
                <div className="flex justify-end mb-4">
                    <Dialog open={dialogOpen} onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) resetForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                                <Plus className="h-4 w-4 ml-2" />
                                إضافة مدرسة جديدة
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-xl">
                                    {editingSchool ? 'تعديل بيانات المدرسة' : 'إضافة مدرسة جديدة'}
                                </DialogTitle>
                            </DialogHeader>

                            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="basic">البيانات الأساسية</TabsTrigger>
                                    <TabsTrigger value="advanced" className="gap-2">
                                        <Settings className="h-4 w-4" />
                                        الإعدادات المتقدمة
                                    </TabsTrigger>
                                </TabsList>

                                {/* Basic Info Tab */}
                                <TabsContent value="basic" className="space-y-4 mt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>كود المدرسة *</Label>
                                            <Input
                                                name="school_code"
                                                value={formData.school_code}
                                                onChange={handleChange}
                                                placeholder="SCH001"
                                                dir="ltr"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>اسم المدرسة *</Label>
                                            <Input
                                                name="school_name"
                                                value={formData.school_name}
                                                onChange={handleChange}
                                                placeholder="مدرسة النور"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>الاسم بالإنجليزية</Label>
                                        <Input
                                            name="school_name_en"
                                            value={formData.school_name_en}
                                            onChange={handleChange}
                                            placeholder="El-Nour School"
                                            dir="ltr"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>المحافظة</Label>
                                            <Input
                                                name="governorate"
                                                value={formData.governorate}
                                                onChange={handleChange}
                                                placeholder="القاهرة"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>المدينة</Label>
                                            <Input
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                placeholder="مدينة نصر"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>العنوان</Label>
                                        <Input
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            placeholder="شارع..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>الهاتف</Label>
                                            <Input
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="0123456789"
                                                dir="ltr"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>البريد الإلكتروني</Label>
                                            <Input
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="info@school.com"
                                                dir="ltr"
                                            />
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Advanced Settings Tab */}
                                <TabsContent value="advanced" className="space-y-6 mt-4">
                                    {/* Features Section */}
                                    <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Zap className="h-5 w-5 text-amber-500" />
                                            <h3 className="font-semibold text-lg">تفعيل المميزات (Features)</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-center justify-between p-3 bg-white rounded border">
                                                <div className="space-y-0.5">
                                                    <Label>النظام المالي</Label>
                                                    <p className="text-xs text-muted-foreground">الفواتير، الرواتب، المصروفات</p>
                                                </div>
                                                <Switch
                                                    checked={formData.settings?.features?.finance}
                                                    onCheckedChange={(c) => handleSettingChange('features', 'finance', c)}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-white rounded border">
                                                <div className="space-y-0.5">
                                                    <Label>الموارد البشرية</Label>
                                                    <p className="text-xs text-muted-foreground">الموظفين، الحضور، الإجازات</p>
                                                </div>
                                                <Switch
                                                    checked={formData.settings?.features?.hr}
                                                    onCheckedChange={(c) => handleSettingChange('features', 'hr', c)}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-white rounded border">
                                                <div className="space-y-0.5">
                                                    <Label>شؤون الطلاب</Label>
                                                    <p className="text-xs text-muted-foreground">الطلاب، الفصول، الغياب</p>
                                                </div>
                                                <Switch
                                                    checked={formData.settings?.features?.students}
                                                    onCheckedChange={(c) => handleSettingChange('features', 'students', c)}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-white rounded border">
                                                <div className="space-y-0.5">
                                                    <Label>الكنترول</Label>
                                                    <p className="text-xs text-muted-foreground">الامتحانات، الدرجات، الشهادات</p>
                                                </div>
                                                <Switch
                                                    checked={formData.settings?.features?.control}
                                                    onCheckedChange={(c) => handleSettingChange('features', 'control', c)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Branding Section */}
                                    <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Palette className="h-5 w-5 text-purple-500" />
                                            <h3 className="font-semibold text-lg">الهوية والطباعة (Branding)</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>ترويسة التقارير (Header Text)</Label>
                                                <Input
                                                    value={formData.settings?.branding?.print_header || ''}
                                                    onChange={(e) => handleSettingChange('branding', 'print_header', e.target.value)}
                                                    placeholder="مثال: مدارس النور الدولية - سجل تجاري 12345"
                                                />
                                                <p className="text-xs text-muted-foreground">هذا النص سيظهر في أعلى جميع التقارير المطبوعة</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>رابط الشعار (Logo URL)</Label>
                                                    <Input
                                                        value={formData.settings?.branding?.logo_url || ''}
                                                        onChange={(e) => handleSettingChange('branding', 'logo_url', e.target.value)}
                                                        placeholder="https://..."
                                                        dir="ltr"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>اللون الرئيسي</Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            type="color"
                                                            className="w-12 h-10 p-1"
                                                            value={formData.settings?.branding?.primary_color || '#2563eb'}
                                                            onChange={(e) => handleSettingChange('branding', 'primary_color', e.target.value)}
                                                        />
                                                        <Input
                                                            value={formData.settings?.branding?.primary_color || '#2563eb'}
                                                            onChange={(e) => handleSettingChange('branding', 'primary_color', e.target.value)}
                                                            dir="ltr"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>

                            <div className="flex gap-3 pt-4 border-t mt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setDialogOpen(false)}
                                    className="flex-1"
                                >
                                    إلغاء
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                            جاري الحفظ...
                                        </>
                                    ) : (
                                        'حفظ التغييرات'
                                    )}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>


                {/* Schools Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <School className="h-5 w-5" />
                            قائمة المدارس
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : schools.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>لا توجد مدارس</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>الكود</TableHead>
                                            <TableHead>اسم المدرسة</TableHead>
                                            <TableHead>المحافظة</TableHead>
                                            <TableHead>الهاتف</TableHead>
                                            <TableHead>الحالة</TableHead>
                                            <TableHead>الإجراءات</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {schools.map((school: any) => (
                                            <TableRow key={school.id}>
                                                <TableCell className="font-mono">
                                                    {school.school_code}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {school.school_name}
                                                </TableCell>
                                                <TableCell>
                                                    {school.governorate || '-'}
                                                </TableCell>
                                                <TableCell className="font-mono">
                                                    {school.phone || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {school.is_active ? (
                                                        <Badge className="bg-green-100 text-green-700 border-0">
                                                            نشطة
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-red-100 text-red-700 border-0">
                                                            معطلة
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openEditDialog({
                                                                id: school.id,
                                                                schoolCode: school.school_code,
                                                                schoolName: school.school_name,
                                                                schoolNameEn: school.school_name_en,
                                                                address: school.address,
                                                                city: school.city,
                                                                governorate: school.governorate,
                                                                phone: school.phone,
                                                                email: school.email,
                                                                isActive: school.is_active,
                                                                createdAt: school.created_at,
                                                                updatedAt: school.updated_at,
                                                            })}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => toggleStatus(school.id, school.is_active)}
                                                        >
                                                            {school.is_active ? (
                                                                <XCircle className="h-4 w-4 text-red-600" />
                                                            ) : (
                                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </PageLayout>
        </DashboardLayout>
    );
}
