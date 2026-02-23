/**
 * UserLoginPage - صفحة تسجيل الدخول المخصصة للمدارس والموظفين
 * Client-facing secure login
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
    Mail,
    Lock,
    LogIn,
    Loader2,
    AlertCircle,
    Eye,
    EyeOff,
    GraduationCap,
    School
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { errorTrackingService } from '@/services/errorTrackingService';

export default function UserLoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { loginAsAdmin, isAuthenticated } = useAuth(); // We use loginAsAdmin structure for all system_users

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Redirect if already authenticated
    if (isAuthenticated) {
        const from = (location.state as any)?.from?.pathname || '/control-room';
        navigate(from, { replace: true });
    }

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
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
                const from = (location.state as any)?.from?.pathname || '/control-room';
                navigate(from, { replace: true });
            } else {
                setError(result.error || 'الايميل او كلمة المرور غير صحيحة');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
            setError(errorMessage);

            errorTrackingService.logError({
                error_code: 'ERR_USER_LOGIN_FAILED',
                error_message: errorMessage,
                error_type: 'auth',
                severity: 'high',
                status: 'new',
                module: 'UserLoginPage',
                function_name: 'handleSubmit',
                context: { email: email }
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-2xl shadow-sm mb-4">
                        <School className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">تسجيل الدخول للنظام</h1>
                    <p className="text-muted-foreground mt-2">خاص بالمدارس وموظفيها</p>
                </div>

                {/* Login Card */}
                <Card className="shadow-lg border-t-4 border-t-primary bg-white">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-xl">مرحباً بعودتك</CardTitle>
                        <CardDescription>
                            أدخل بيانات الاعتماد الخاصة بك للوصول إلى النظام
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Error Alert */}
                            {error && (
                                <Alert variant="destructive" className="text-right">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    البريد الإلكتروني
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="user@school.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    dir="ltr"
                                    disabled={loading}
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="flex items-center gap-2">
                                    <Lock className="h-4 w-4" />
                                    كلمة المرور
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10"
                                        dir="ltr"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full h-12 text-lg bg-primary hover:bg-primary/90"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin ml-2" />
                                        جاري المصادقة...
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="h-5 w-5 ml-2" />
                                        دخول
                                    </>
                                )}
                            </Button>
                        </form>

                        <Separator className="my-6" />

                        <div className="text-center space-y-4">
                            <a
                                href="/student/login"
                                className="text-sm text-primary hover:underline flex items-center justify-center gap-2"
                            >
                                <GraduationCap className="h-4 w-4" />
                                نظام دخول الطلاب
                            </a>
                            <Button variant="link" className="text-muted-foreground" onClick={() => navigate('/')}>
                                العودة للبوابة الرئيسية
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
