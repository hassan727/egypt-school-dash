/**
 * UnifiedLoginPage - صفحة تسجيل الدخول الموحدة للنظام
 * Single entry point for Admins, Staff, and Students
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Mail,
    Lock,
    LogIn,
    Loader2,
    AlertCircle,
    Eye,
    EyeOff,
    GraduationCap,
    School,
    User,
    ShieldCheck,
    Building2,
    Calendar,
    ArrowLeft,
    CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSystem } from '@/context/SystemContext';
import { toast } from 'sonner';
import { errorTrackingService } from '@/services/errorTrackingService';

export default function UnifiedLoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { loginAsAdmin, loginAsStudent, isAuthenticated, user, logout } = useAuth();
    const { schools, setSchool, setAcademicYear, identity } = useSystem();

    // State
    const [loginType, setLoginType] = useState<'staff' | 'student'>('staff');
    const [step, setStep] = useState<'login' | 'select'>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Selection State
    const [selectedSchoolId, setSelectedSchoolId] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [academicYears, setAcademicYears] = useState<any[]>([]);

    // Form Fields - Staff
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Form Fields - Student
    const [nationalId, setNationalId] = useState('');
    const [studentPassword, setStudentPassword] = useState('');

    // Handle transition to selection or dashboard
    const handleLoginSuccess = async (role: string) => {
        if (role === 'student') {
            navigate('/student/dashboard', { replace: true });
            return;
        }

        // For staff/admin: Check if school is already set (auto-selected)
        if (identity.school && identity.academicYear) {
            const from = (location.state as any)?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
            return;
        }

        // Otherwise show selection step
        setStep('select');
    };

    // Redirect if already authenticated and school is set
    if (isAuthenticated && step === 'login') {
        if (user?.role === 'student') {
            navigate('/student/dashboard', { replace: true });
        } else if (identity.school && identity.academicYear) {
            const from = (location.state as any)?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
        } else {
            setStep('select');
        }
    }

    // Fetch years when school changes
    useEffect(() => {
        const fetchYears = async () => {
            if (!selectedSchoolId) return;
            try {
                const { data } = await supabase
                    .from('academic_years')
                    .select('*')
                    .eq('school_id', selectedSchoolId)
                    .order('year_code', { ascending: false });

                setAcademicYears(data || []);
                if (data && data.length > 0) {
                    const active = data.find(y => y.is_active);
                    setSelectedYear(active?.year_code || data[0].year_code);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchYears();
    }, [selectedSchoolId]);

    const handleStaffLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
            return;
        }

        setLoading(true);
        try {
            const result = await loginAsAdmin(email, password);
            if (result.success) {
                toast.success('تم تسجيل الدخول بنجاح!');
                handleLoginSuccess('admin');
            } else {
                setError(result.error || 'الايميل او كلمة المرور غير صحيحة');
            }
        } catch (err: any) {
            setError(err.message || 'حدث خطأ غير متوقع');
        } finally {
            setLoading(false);
        }
    };

    const handleStudentLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!nationalId || !studentPassword) {
            setError('يرجى إدخال الرقم القومي وكلمة المرور');
            return;
        }

        setLoading(true);
        try {
            const result = await loginAsStudent(nationalId, studentPassword);
            if (result.success) {
                toast.success('مرحباً بك يا بطل!');
                handleLoginSuccess('student');
            } else {
                setError(result.error || 'بيانات الدخول غير صحيحة');
            }
        } catch (err: any) {
            setError(err.message || 'حدث خطأ غير متوقع');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
            <div className="w-full max-w-md">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-2xl shadow-sm mb-4">
                        <School className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">المنصة التعليمية الذكية</h1>
                    <p className="text-muted-foreground mt-2">بوابة الدخول الموحدة لجميع المستخدمين</p>
                </div>

                <Card className="shadow-xl border-t-4 border-t-primary overflow-hidden bg-white">
                    {step === 'login' ? (
                    <Tabs value={loginType} onValueChange={(v) => setLoginType(v as any)} className="w-full">
                        <TabsList className="w-full h-14 rounded-none bg-slate-100 p-1">
                            <TabsTrigger value="staff" className="w-1/2 h-full gap-2 text-base data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <ShieldCheck className="h-5 w-5" />
                                الإدارة والموظفين
                            </TabsTrigger>
                            <TabsTrigger value="student" className="w-1/2 h-full gap-2 text-base data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <GraduationCap className="h-5 w-5" />
                                الطلاب
                            </TabsTrigger>
                        </TabsList>

                        <CardContent className="pt-6 pb-8">
                            {error && (
                                <Alert variant="destructive" className="mb-6">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <TabsContent value="staff" className="mt-0">
                                <form onSubmit={handleStaffLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">البريد الإلكتروني</Label>
                                        <div className="relative">
                                            <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="example@school.com"
                                                className="pr-10"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                dir="ltr"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password">كلمة المرور</Label>
                                        <div className="relative">
                                            <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                className="pr-10 pl-10"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                dir="ltr"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute left-3 top-3"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                            </button>
                                        </div>
                                    </div>

                                    <Button className="w-full h-12 text-lg" disabled={loading}>
                                        {loading ? <Loader2 className="ml-2 h-5 w-5 animate-spin" /> : <LogIn className="ml-2 h-5 w-5" />}
                                        دخول النظام
                                    </Button>
                                </form>
                            </TabsContent>

                            <TabsContent value="student" className="mt-0">
                                <form onSubmit={handleStudentLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="nationalId">الرقم القومي</Label>
                                        <div className="relative">
                                            <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="nationalId"
                                                placeholder="14 رقم"
                                                className="pr-10 text-center font-mono text-lg"
                                                value={nationalId}
                                                onChange={(e) => setNationalId(e.target.value.replace(/\D/g, '').slice(0, 14))}
                                                dir="ltr"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="studentPassword">كلمة المرور</Label>
                                        <div className="relative">
                                            <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="studentPassword"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="6 أرقام"
                                                className="pr-10 pl-10 text-center font-mono text-lg"
                                                value={studentPassword}
                                                onChange={(e) => setStudentPassword(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                dir="ltr"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute left-3 top-3"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                            </button>
                                        </div>
                                    </div>

                                    <Button className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                                        {loading ? <Loader2 className="ml-2 h-5 w-5 animate-spin" /> : <GraduationCap className="ml-2 h-5 w-5" />}
                                        دخول بوابة الطالب
                                    </Button>
                                </form>
                            </TabsContent>
                        </CardContent>
                    </Tabs>
                    ) : (
                        <CardContent className="pt-8 pb-8 space-y-6">
                            <div className="text-center space-y-2 mb-4">
                                <h2 className="text-2xl font-bold">تحديد بيئة العمل</h2>
                                <p className="text-muted-foreground">اختر المدرسة والسنة الدراسية للمتابعة</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-primary" />
                                        المدرسة
                                    </Label>
                                    <select
                                        className="w-full h-12 rounded-md border border-input bg-background px-3 py-2"
                                        value={selectedSchoolId}
                                        onChange={(e) => setSelectedSchoolId(e.target.value)}
                                    >
                                        <option value="">اختر المدرسة...</option>
                                        {schools.map(s => (
                                            <option key={s.id} value={s.id}>{s.school_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        السنة الدراسية
                                    </Label>
                                    <select
                                        className="w-full h-12 rounded-md border border-input bg-background px-3 py-2"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        disabled={!selectedSchoolId}
                                    >
                                        <option value="">اختر السنة...</option>
                                        {academicYears.map(y => (
                                            <option key={y.year_code} value={y.year_code}>{y.year_code}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <Button
                                        variant="outline"
                                        className="flex-1 h-12"
                                        onClick={() => {
                                            logout();
                                            setStep('login');
                                        }}
                                    >
                                        <ArrowLeft className="ml-2 h-4 w-4" />
                                        خروج
                                    </Button>
                                    <Button
                                        className="flex-[2] h-12 text-lg"
                                        disabled={!selectedSchoolId || !selectedYear}
                                        onClick={() => {
                                            const school = schools.find(s => s.id === selectedSchoolId);
                                            if (school) {
                                                setSchool(school);
                                                setAcademicYear(selectedYear);
                                                navigate('/dashboard');
                                            }
                                        }}
                                    >
                                        <CheckCircle2 className="ml-2 h-5 w-5" />
                                        ابدأ العمل
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>

                <p className="text-center mt-8 text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} جميع الحقوق محفوظة للمنصة التعليمية الذكية
                </p>
            </div>
        </div>
    );
}
