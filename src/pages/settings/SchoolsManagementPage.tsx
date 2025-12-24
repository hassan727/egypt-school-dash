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
    Mail
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTenantSchools } from '@/hooks/useTenantData';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { School as SchoolType } from '@/types/auth';

export default function SchoolsManagementPage() {
    const { user, hasRole } = useAuth();
    const { fetchSchools } = useTenantSchools();
    const [schools, setSchools] = useState<SchoolType[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSchool, setEditingSchool] = useState<SchoolType | null>(null);
    const [saving, setSaving] = useState(false);

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
        });
        setEditingSchool(null);
    };

    // Open edit dialog
    const openEditDialog = (school: SchoolType) => {
        setEditingSchool(school);
        setFormData({
            school_code: school.schoolCode,
            school_name: school.schoolName,
            school_name_en: school.schoolNameEn || '',
            address: school.address || '',
            city: school.city || '',
            governorate: school.governorate || '',
            phone: school.phone || '',
            email: school.email || '',
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
            if (editingSchool) {
                // Update
                const { error } = await supabase
                    .from('schools')
                    .update({
                        school_code: formData.school_code,
                        school_name: formData.school_name,
                        school_name_en: formData.school_name_en,
                        address: formData.address,
                        city: formData.city,
                        governorate: formData.governorate,
                        phone: formData.phone,
                        email: formData.email,
                    })
                    .eq('id', editingSchool.id);

                if (error) throw error;
                toast.success('تم تحديث المدرسة');
            } else {
                // Create
                const { error } = await supabase
                    .from('schools')
                    .insert({
                        school_code: formData.school_code,
                        school_name: formData.school_name,
                        school_name_en: formData.school_name_en,
                        address: formData.address,
                        city: formData.city,
                        governorate: formData.governorate,
                        phone: formData.phone,
                        email: formData.email,
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
                description="إنشاء وإدارة المدارس في النظام"
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
                            <Button>
                                <Plus className="h-4 w-4 ml-2" />
                                إضافة مدرسة جديدة
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingSchool ? 'تعديل المدرسة' : 'إضافة مدرسة جديدة'}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
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

                                <div className="flex gap-3 pt-4">
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
                                        className="flex-1"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                                جاري الحفظ...
                                            </>
                                        ) : (
                                            'حفظ'
                                        )}
                                    </Button>
                                </div>
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
