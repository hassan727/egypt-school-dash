/**
 * UsersManagementPage - صفحة إدارة المستخدمين والصلاحيات
 * Central page for managing all system users
 * 
 * 3 Tabs:
 * 1. مستخدمو النظام (Admins/Staff)
 * 2. الطلاب (Students) 
 * 3. المستخدم التجريبي (Demo)
 */

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Users,
    UserPlus,
    Edit,
    Ban,
    CheckCircle,
    XCircle,
    Loader2,
    Shield,
    GraduationCap,
    Play,
    School,
    Mail,
    Phone,
    User,
    Crown,
    Info,
    Search,
    RefreshCw
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// =============================================
// TYPES
// =============================================

interface SystemUser {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    role: string;
    school_id: string | null;
    school_name?: string;
    is_active: boolean;
    last_login: string | null;
    login_count: number;
    created_at: string;
}

interface School {
    id: string;
    school_name: string;
    school_code: string;
}

// Role info for display
const ROLES = {
    system_admin: { label: 'المالك / الأدمن الأعلى', color: 'bg-purple-100 text-purple-700', icon: Crown },
    school_admin: { label: 'مدير مدرسة', color: 'bg-blue-100 text-blue-700', icon: School },
    staff: { label: 'موظف شؤون الطلاب', color: 'bg-green-100 text-green-700', icon: Users },
    teacher: { label: 'معلم', color: 'bg-amber-100 text-amber-700', icon: GraduationCap },
    viewer: { label: 'عارض فقط', color: 'bg-gray-100 text-gray-700', icon: User },
    demo: { label: 'مستخدم تجريبي', color: 'bg-orange-100 text-orange-700', icon: Play },
};

export default function UsersManagementPage() {
    const { user, hasRole } = useAuth();

    // State
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [schools, setSchools] = useState<School[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('staff');

    // Form state
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        role: 'staff',
        school_id: '',
    });

    // =============================================
    // DATA LOADING
    // =============================================

    const loadData = async () => {
        setLoading(true);
        try {
            // Load users with school name
            let usersQuery = supabase
                .from('system_users')
                .select(`
                    *,
                    schools(school_name)
                `)
                .order('created_at', { ascending: false });

            // If not system admin, restrict to own school
            if (user?.role !== 'admin' && user?.schoolId) {
                usersQuery = usersQuery.eq('school_id', user.schoolId);
            }

            const { data: usersData, error: usersError } = await usersQuery;

            if (usersError) throw usersError;

            const processedUsers = (usersData || []).map((u: any) => ({
                ...u,
                school_name: u.schools?.school_name || null
            }));

            setUsers(processedUsers);

            // Load schools for dropdown
            let schoolsQuery = supabase
                .from('schools')
                .select('id, school_name, school_code')
                .eq('is_active', true)
                .order('school_name');

            if (user?.role !== 'admin' && user?.schoolId) {
                schoolsQuery = schoolsQuery.eq('id', user.schoolId);
            }

            const { data: schoolsData } = await schoolsQuery;

            setSchools(schoolsData || []);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('فشل في تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // =============================================
    // FORM HANDLERS
    // =============================================

    const resetForm = () => {
        setFormData({
            full_name: '',
            email: '',
            phone: '',
            role: 'staff',
            school_id: '',
        });
        setEditingUser(null);
    };

    const openEditDialog = (user: SystemUser) => {
        setEditingUser(user);
        setFormData({
            full_name: user.full_name,
            email: user.email || '',
            phone: user.phone || '',
            role: user.role,
            school_id: user.school_id || '',
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.full_name) {
            toast.error('يرجى إدخال الاسم');
            return;
        }

        // Validate that non-system roles have a school
        if (!['system_admin', 'demo'].includes(formData.role) && !formData.school_id) {
            toast.error('يجب اختيار مدرسة لهذا الدور');
            return;
        }

        setSaving(true);
        try {
            const userData = {
                full_name: formData.full_name,
                email: formData.email || null,
                phone: formData.phone || null,
                role: formData.role,
                school_id: ['system_admin', 'demo'].includes(formData.role) ? null : formData.school_id,
            };

            if (editingUser) {
                // Update
                const { error } = await supabase
                    .from('system_users')
                    .update(userData)
                    .eq('id', editingUser.id);

                if (error) throw error;
                toast.success('تم تحديث المستخدم');
            } else {
                // Create
                const { error } = await supabase
                    .from('system_users')
                    .insert({
                        ...userData,
                        is_active: true,
                    });

                if (error) throw error;
                toast.success('تم إنشاء المستخدم بنجاح');
            }

            setDialogOpen(false);
            resetForm();
            loadData();
        } catch (error: any) {
            console.error('Error saving user:', error);
            toast.error(error.message || 'فشل في حفظ المستخدم');
        } finally {
            setSaving(false);
        }
    };

    const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('system_users')
                .update({ is_active: !currentStatus })
                .eq('id', userId);

            if (error) throw error;
            toast.success(currentStatus ? 'تم إيقاف المستخدم' : 'تم تفعيل المستخدم');
            loadData();
        } catch (error) {
            toast.error('فشل في تغيير الحالة');
        }
    };

    // =============================================
    // FILTERED DATA
    // =============================================

    const filterUsers = (roleFilter: string[]) => {
        return users.filter(u => {
            const matchesRole = roleFilter.includes(u.role);
            const matchesSearch = !searchTerm ||
                u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesRole && matchesSearch;
        });
    };

    const staffUsers = filterUsers(['system_admin', 'school_admin', 'staff', 'teacher', 'viewer']);
    const demoUsers = filterUsers(['demo']);

    // =============================================
    // STATS
    // =============================================

    const stats = {
        total: users.length,
        active: users.filter(u => u.is_active).length,
        admins: users.filter(u => ['system_admin', 'school_admin'].includes(u.role)).length,
        staff: users.filter(u => ['staff', 'teacher', 'viewer'].includes(u.role)).length,
    };

    // =============================================
    // ACCESS CHECK
    // =============================================

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

    // =============================================
    // RENDER
    // =============================================

    return (
        <DashboardLayout>
            <PageLayout
                title="إدارة المستخدمين والصلاحيات"
                description="إدارة جميع مستخدمي النظام وتحديد أدوارهم وصلاحياتهم"
                showBackButton
            >
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-200">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">نشط</p>
                                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-200">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Crown className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">مديرون</p>
                                <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-200">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <GraduationCap className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">موظفون</p>
                                <p className="text-2xl font-bold text-amber-600">{stats.staff}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                        <TabsList>
                            <TabsTrigger value="staff" className="gap-2">
                                <Shield className="h-4 w-4" />
                                مستخدمو النظام
                            </TabsTrigger>
                            <TabsTrigger value="students" className="gap-2">
                                <GraduationCap className="h-4 w-4" />
                                الطلاب
                            </TabsTrigger>
                            <TabsTrigger value="demo" className="gap-2">
                                <Play className="h-4 w-4" />
                                تجريبي
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="بحث..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pr-10 w-48"
                                />
                            </div>
                            <Button variant="outline" size="icon" onClick={loadData}>
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>

                            <Dialog open={dialogOpen} onOpenChange={(open) => {
                                setDialogOpen(open);
                                if (!open) resetForm();
                            }}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <UserPlus className="h-4 w-4 ml-2" />
                                        إضافة مستخدم
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg">
                                    <DialogHeader>
                                        <DialogTitle>
                                            {editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 mt-4">
                                        {/* Name */}
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                الاسم الكامل *
                                            </Label>
                                            <Input
                                                value={formData.full_name}
                                                onChange={(e) => setFormData(p => ({ ...p, full_name: e.target.value }))}
                                                placeholder="محمد أحمد"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Email */}
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4" />
                                                    البريد الإلكتروني
                                                </Label>
                                                <Input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                                                    placeholder="email@school.com"
                                                    dir="ltr"
                                                />
                                            </div>

                                            {/* Phone */}
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4" />
                                                    الهاتف
                                                </Label>
                                                <Input
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                                                    placeholder="0123456789"
                                                    dir="ltr"
                                                />
                                            </div>
                                        </div>

                                        {/* Role */}
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <Shield className="h-4 w-4" />
                                                الدور / الصلاحية *
                                            </Label>
                                            <Select
                                                value={formData.role}
                                                onValueChange={(value) => setFormData(p => ({ ...p, role: value }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="اختر الدور" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(ROLES).map(([key, value]) => (
                                                        <SelectItem key={key} value={key}>
                                                            <span className="flex items-center gap-2">
                                                                <value.icon className="h-4 w-4" />
                                                                {value.label}
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* School (conditional) */}
                                        {!['system_admin', 'demo'].includes(formData.role) && (
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2">
                                                    <School className="h-4 w-4" />
                                                    المدرسة *
                                                </Label>
                                                <Select
                                                    value={formData.school_id}
                                                    onValueChange={(value) => setFormData(p => ({ ...p, school_id: value }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="اختر المدرسة" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {schools.map((school) => (
                                                            <SelectItem key={school.id} value={school.id}>
                                                                {school.school_name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {/* Info about role */}
                                        <Alert>
                                            <Info className="h-4 w-4" />
                                            <AlertDescription>
                                                {formData.role === 'system_admin' && 'صلاحيات كاملة على النظام بأكمله'}
                                                {formData.role === 'school_admin' && 'إدارة مدرسة واحدة فقط'}
                                                {formData.role === 'staff' && 'إدارة شؤون الطلاب في المدرسة'}
                                                {formData.role === 'teacher' && 'عرض الطلاب وإرسال الإشعارات'}
                                                {formData.role === 'viewer' && 'عرض البيانات فقط بدون تعديل'}
                                                {formData.role === 'demo' && 'عرض الواجهات فقط بدون بيانات حقيقية'}
                                            </AlertDescription>
                                        </Alert>

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
                    </div>

                    {/* Tab: Staff */}
                    <TabsContent value="staff">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    مستخدمو النظام
                                </CardTitle>
                                <CardDescription>
                                    المديرون والموظفون والمعلمون
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : staffUsers.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>لا يوجد مستخدمون</p>
                                    </div>
                                ) : (
                                    <UsersTable
                                        users={staffUsers}
                                        onEdit={openEditDialog}
                                        onToggle={toggleUserStatus}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab: Students */}
                    <TabsContent value="students">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5" />
                                    حسابات الطلاب
                                </CardTitle>
                                <CardDescription>
                                    الحسابات تُنشأ تلقائياً من الرقم القومي
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Alert className="mb-4">
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>حسابات الطلاب تُدار من صفحة منفصلة.</strong>
                                        <br />
                                        لا يوجد اسم مستخدم أو كلمة مرور يدوية - كل شيء تلقائي من الرقم القومي.
                                    </AlertDescription>
                                </Alert>
                                <div className="flex gap-3">
                                    <Button variant="outline" asChild>
                                        <a href="/students/settings/accounts">
                                            <Users className="h-4 w-4 ml-2" />
                                            إدارة حسابات الطلاب
                                        </a>
                                    </Button>
                                    <Button variant="outline" asChild>
                                        <a href="/students/list">
                                            <GraduationCap className="h-4 w-4 ml-2" />
                                            قائمة الطلاب
                                        </a>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab: Demo */}
                    <TabsContent value="demo">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Play className="h-5 w-5" />
                                    المستخدم التجريبي
                                </CardTitle>
                                <CardDescription>
                                    حسابات للعرض فقط بدون بيانات حقيقية
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Alert className="mb-4 bg-amber-50 border-amber-200">
                                    <Play className="h-4 w-4 text-amber-600" />
                                    <AlertDescription className="text-amber-800">
                                        المستخدم التجريبي يرى الواجهات فقط.<br />
                                        <strong>لا يوجد وصول لأي بيانات حقيقية.</strong>
                                    </AlertDescription>
                                </Alert>

                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                    </div>
                                ) : demoUsers.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>لا يوجد مستخدمون تجريبيون</p>
                                        <Button
                                            className="mt-4"
                                            onClick={() => {
                                                setFormData(p => ({ ...p, role: 'demo' }));
                                                setDialogOpen(true);
                                            }}
                                        >
                                            <UserPlus className="h-4 w-4 ml-2" />
                                            إضافة مستخدم تجريبي
                                        </Button>
                                    </div>
                                ) : (
                                    <UsersTable
                                        users={demoUsers}
                                        onEdit={openEditDialog}
                                        onToggle={toggleUserStatus}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </PageLayout>
        </DashboardLayout>
    );
}

// =============================================
// USERS TABLE COMPONENT
// =============================================

function UsersTable({
    users,
    onEdit,
    onToggle
}: {
    users: SystemUser[];
    onEdit: (user: SystemUser) => void;
    onToggle: (userId: string, isActive: boolean) => void;
}) {
    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>البريد</TableHead>
                        <TableHead>الدور</TableHead>
                        <TableHead>المدرسة</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>آخر دخول</TableHead>
                        <TableHead>الإجراءات</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => {
                        const roleInfo = ROLES[user.role as keyof typeof ROLES] || ROLES.viewer;
                        const RoleIcon = roleInfo.icon;

                        return (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-full ${roleInfo.color}`}>
                                            <RoleIcon className="h-3.5 w-3.5" />
                                        </div>
                                        {user.full_name}
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                    {user.email || '-'}
                                </TableCell>
                                <TableCell>
                                    <Badge className={`${roleInfo.color} border-0`}>
                                        {roleInfo.label}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {user.school_name || (
                                        <span className="text-muted-foreground text-sm">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {user.is_active ? (
                                        <Badge className="bg-green-100 text-green-700 border-0">
                                            نشط
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-red-100 text-red-700 border-0">
                                            موقوف
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {user.last_login
                                        ? new Date(user.last_login).toLocaleDateString('ar-EG')
                                        : 'لم يدخل'
                                    }
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onEdit(user)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onToggle(user.id, user.is_active)}
                                        >
                                            {user.is_active ? (
                                                <Ban className="h-4 w-4 text-red-600" />
                                            ) : (
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                            )}
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
