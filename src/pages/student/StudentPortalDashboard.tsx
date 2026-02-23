/**
 * StudentPortalDashboard - لوحة تحكم الطالب
 * View-only dashboard for students to see their data
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    GraduationCap,
    User,
    BookOpen,
    Calendar,
    DollarSign,
    LogOut,
    School,
    Phone,
    Mail,
    MapPin,
    ClipboardList,
    Award,
    Clock,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function StudentPortalDashboard() {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout, validateTenantAccess } = useAuth();
    const [studentData, setStudentData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Check session on mount
    useEffect(() => {
        if (!isAuthenticated || !user) {
            navigate('/student/login');
            return;
        }
        if (user.studentId) {
            fetchStudentData(user.studentId);
        }
    }, [isAuthenticated, user, navigate]);

    // Fetch student data
    const fetchStudentData = async (studentId: string) => {
        try {
            const { data, error } = await supabase
                .from('students')
                .select(`
                    *,
                    classes:class_id(name, stage:stage_id(name)),
                    school_fees(*, fee_installments(*)),
                    attendance_records(*)
                `)
                .eq('student_id', studentId)
                .single();

            if (error) throw error;

            // 🔐 Validate tenant access
            if (data && !validateTenantAccess(data.school_id)) {
                console.warn('Tenant access violation in StudentPortalDashboard');
                navigate('/student/login');
                return;
            }

            setStudentData(data);
        } catch (error) {
            console.error('Error fetching student data:', error);
            toast.error('حدث خطأ في جلب البيانات');
        } finally {
            setLoading(false);
        }
    };

    // Handle logout
    const handleLogout = () => {
        logout();
        toast.success('تم تسجيل الخروج');
        navigate('/student/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">جاري تحميل البيانات...</p>
                </div>
            </div>
        );
    }

    if (!user || !studentData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">خطأ في تحميل البيانات</h2>
                        <p className="text-gray-600 mb-4">يرجى تسجيل الدخول مرة أخرى</p>
                        <Button onClick={() => navigate('/student/login')}>
                            تسجيل الدخول
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Calculate attendance stats
    const attendanceRecords = studentData.attendance_records || [];
    const presentDays = attendanceRecords.filter((r: any) => r.status === 'حاضر').length;
    const absentDays = attendanceRecords.filter((r: any) => r.status === 'غائب').length;
    const attendanceRate = attendanceRecords.length > 0
        ? Math.round((presentDays / attendanceRecords.length) * 100)
        : 100;

    // Calculate fees
    const schoolFees = studentData.school_fees?.[0];
    const installments = schoolFees?.fee_installments || [];
    const paidAmount = installments.filter((i: any) => i.paid).reduce((acc: number, i: any) => acc + Number(i.amount), 0);
    const totalAmount = schoolFees?.total_amount || 0;
    const remainingAmount = totalAmount - paidAmount;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                            <GraduationCap className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900">{user.fullName}</h1>
                            <p className="text-sm text-gray-600">{user.schoolName}</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={handleLogout} className="text-red-600 border-red-200">
                        <LogOut className="h-4 w-4 ml-2" />
                        خروج
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Welcome Card */}
                <Card className="mb-8 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                <User className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-1">مرحباً، {studentData.full_name_ar}!</h2>
                                <div className="flex items-center gap-4 text-white/80">
                                    <span className="flex items-center gap-1">
                                        <School className="h-4 w-4" />
                                        {studentData.classes?.stage?.name || studentData.stage}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <BookOpen className="h-4 w-4" />
                                        {studentData.classes?.name || studentData.class}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Calendar className="h-6 w-6 text-green-600" />
                            </div>
                            <p className="text-2xl font-bold text-green-600">{attendanceRate}%</p>
                            <p className="text-sm text-gray-600">نسبة الحضور</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <ClipboardList className="h-6 w-6 text-blue-600" />
                            </div>
                            <p className="text-2xl font-bold text-blue-600">{presentDays}</p>
                            <p className="text-sm text-gray-600">أيام الحضور</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 text-center">
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Award className="h-6 w-6 text-amber-600" />
                            </div>
                            <p className="text-2xl font-bold text-amber-600">{absentDays}</p>
                            <p className="text-sm text-gray-600">أيام الغياب</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 text-center">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <DollarSign className="h-6 w-6 text-purple-600" />
                            </div>
                            <p className="text-2xl font-bold text-purple-600">{remainingAmount.toLocaleString()}</p>
                            <p className="text-sm text-gray-600">المتبقي (ج.م)</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="personal" dir="rtl">
                    <TabsList className="grid w-full md:w-auto grid-cols-3 mb-6">
                        <TabsTrigger value="personal">البيانات الشخصية</TabsTrigger>
                        <TabsTrigger value="attendance">الحضور</TabsTrigger>
                        <TabsTrigger value="fees">المصروفات</TabsTrigger>
                    </TabsList>

                    {/* Personal Data Tab */}
                    <TabsContent value="personal">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    البيانات الشخصية
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-gray-500">الاسم الكامل</p>
                                            <p className="font-medium">{studentData.full_name_ar}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">الرقم القومي</p>
                                            <p className="font-medium font-mono">{studentData.national_id}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">تاريخ الميلاد</p>
                                            <p className="font-medium">{studentData.date_of_birth || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">النوع</p>
                                            <p className="font-medium">{studentData.gender}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-gray-500">ولي الأمر</p>
                                            <p className="font-medium">{studentData.guardian_full_name || '-'}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                            <p className="font-medium">{studentData.guardian_phone || '-'}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-gray-400" />
                                            <p className="font-medium">{studentData.guardian_email || '-'}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                            <p className="font-medium">{studentData.guardian_address || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Attendance Tab */}
                    <TabsContent value="attendance">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    سجل الحضور
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {attendanceRecords.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>لا توجد سجلات حضور</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {attendanceRecords.slice(-20).reverse().map((record: any) => (
                                            <div
                                                key={record.id}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Clock className="h-4 w-4 text-gray-400" />
                                                    <span>{new Date(record.date).toLocaleDateString('ar-EG')}</span>
                                                </div>
                                                <Badge
                                                    className={`${record.status === 'حاضر'
                                                        ? 'bg-green-100 text-green-700'
                                                        : record.status === 'غائب'
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                        } border-0`}
                                                >
                                                    {record.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Fees Tab */}
                    <TabsContent value="fees">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    المصروفات الدراسية
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!schoolFees ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>لا توجد بيانات مالية</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Summary */}
                                        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                                            <div className="text-center">
                                                <p className="text-sm text-gray-500">الإجمالي</p>
                                                <p className="text-xl font-bold">{totalAmount.toLocaleString()} ج.م</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-gray-500">المدفوع</p>
                                                <p className="text-xl font-bold text-green-600">{paidAmount.toLocaleString()} ج.م</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-gray-500">المتبقي</p>
                                                <p className="text-xl font-bold text-red-600">{remainingAmount.toLocaleString()} ج.م</p>
                                            </div>
                                        </div>

                                        {/* Installments */}
                                        <div className="space-y-2">
                                            <h4 className="font-medium mb-3">الأقساط</h4>
                                            {installments.map((inst: any) => (
                                                <div
                                                    key={inst.id}
                                                    className="flex items-center justify-between p-3 border rounded-lg"
                                                >
                                                    <div>
                                                        <p className="font-medium">القسط {inst.installment_number}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {new Date(inst.due_date).toLocaleDateString('ar-EG')}
                                                        </p>
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="font-bold">{Number(inst.amount).toLocaleString()} ج.م</p>
                                                        <Badge className={inst.paid ? 'bg-green-100 text-green-700 border-0' : 'bg-amber-100 text-amber-700 border-0'}>
                                                            {inst.paid ? 'مدفوع' : 'غير مدفوع'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t py-4 mt-8">
                <p className="text-center text-sm text-gray-500">
                    بوابة الطالب © {new Date().getFullYear()}
                </p>
            </footer>
        </div>
    );
}
