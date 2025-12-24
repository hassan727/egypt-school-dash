/**
 * StudentAccountsPage - صفحة إدارة حسابات الطلاب
 * Admin page for viewing and managing student accounts
 */

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
    Search,
    Users,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    Shield,
    ShieldOff,
    Loader2,
    Eye,
    UserCheck,
    Key
} from 'lucide-react';
import { getStudentAccounts, toggleAccountStatus } from '@/services/authService';
import type { StudentAccountWithDetails } from '@/types/auth';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function StudentAccountsPage() {
    const [accounts, setAccounts] = useState<StudentAccountWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [togglingId, setTogglingId] = useState<string | null>(null);

    // Fetch accounts
    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const data = await getStudentAccounts();
            setAccounts(data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            toast.error('حدث خطأ في جلب الحسابات');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    // Filter accounts by search
    const filteredAccounts = accounts.filter(account => {
        const query = searchQuery.toLowerCase();
        return (
            account.studentName?.toLowerCase().includes(query) ||
            account.nationalId?.includes(query) ||
            account.studentId?.toLowerCase().includes(query)
        );
    });

    // Toggle account status
    const handleToggleStatus = async (studentId: string, currentStatus: boolean) => {
        setTogglingId(studentId);
        try {
            const success = await toggleAccountStatus(studentId, !currentStatus);
            if (success) {
                toast.success(currentStatus ? 'تم تعطيل الحساب' : 'تم تفعيل الحساب');
                fetchAccounts();
            } else {
                toast.error('فشل في تغيير حالة الحساب');
            }
        } catch (error) {
            toast.error('حدث خطأ');
        } finally {
            setTogglingId(null);
        }
    };

    // Format date
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Stats
    const stats = {
        total: accounts.length,
        active: accounts.filter(a => a.isActive).length,
        inactive: accounts.filter(a => !a.isActive).length,
        loggedIn: accounts.filter(a => a.lastLogin).length
    };

    return (
        <DashboardLayout>
            <PageLayout
                title="إدارة حسابات الطلاب"
                description="عرض وإدارة حسابات دخول الطلاب"
                showBackButton
            >
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Users className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">إجمالي الحسابات</p>
                                    <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-200">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">نشط</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-200">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <XCircle className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">معطل</p>
                                    <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-200">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <UserCheck className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">سجل دخول</p>
                                    <p className="text-2xl font-bold text-amber-600">{stats.loggedIn}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Info Alert */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <Key className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-blue-800">معلومات تسجيل الدخول</h4>
                            <p className="text-sm text-blue-700">
                                اسم المستخدم: <strong>الرقم القومي</strong> (14 رقم)
                                <br />
                                كلمة المرور: <strong>آخر 6 أرقام</strong> من الرقم القومي
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search & Refresh */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="بحث بالاسم أو الرقم القومي..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pr-10"
                        />
                    </div>
                    <Button variant="outline" onClick={fetchAccounts} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
                        تحديث
                    </Button>
                </div>

                {/* Accounts Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            قائمة حسابات الطلاب
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredAccounts.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>لا توجد حسابات مطابقة</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-right">الطالب</TableHead>
                                            <TableHead className="text-right">الرقم القومي</TableHead>
                                            <TableHead className="text-right">المرحلة / الفصل</TableHead>
                                            <TableHead className="text-right">الحالة</TableHead>
                                            <TableHead className="text-right">آخر دخول</TableHead>
                                            <TableHead className="text-right">الإجراءات</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAccounts.map((account) => (
                                            <TableRow key={account.id}>
                                                <TableCell>
                                                    <Link
                                                        to={`/students/${account.studentId}/dashboard`}
                                                        className="font-medium text-blue-600 hover:underline"
                                                    >
                                                        {account.studentName}
                                                    </Link>
                                                    <p className="text-xs text-muted-foreground">
                                                        {account.studentId}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="font-mono">
                                                    {account.nationalId}
                                                </TableCell>
                                                <TableCell>
                                                    {account.stage || '-'} / {account.class || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {account.isActive ? (
                                                        <Badge className="bg-green-100 text-green-700 border-0">
                                                            <CheckCircle className="h-3 w-3 ml-1" />
                                                            نشط
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-red-100 text-red-700 border-0">
                                                            <XCircle className="h-3 w-3 ml-1" />
                                                            معطل
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {account.lastLogin ? (
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <Clock className="h-3 w-3" />
                                                            {formatDate(account.lastLogin)}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">
                                                            لم يسجل دخول
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleToggleStatus(account.studentId, account.isActive)}
                                                            disabled={togglingId === account.studentId}
                                                        >
                                                            {togglingId === account.studentId ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : account.isActive ? (
                                                                <ShieldOff className="h-4 w-4 text-red-600" />
                                                            ) : (
                                                                <Shield className="h-4 w-4 text-green-600" />
                                                            )}
                                                        </Button>
                                                        <Link to={`/students/${account.studentId}/dashboard`}>
                                                            <Button variant="ghost" size="sm">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
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
