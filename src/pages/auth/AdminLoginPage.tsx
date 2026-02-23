/**
 * AdminLoginPage - صفحة تسجيل دخول المطور / المالك
 * Developer-only access via /admin-super
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
    Shield,
    Mail,
    Lock,
    LogIn,
    Loader2,
    AlertCircle,
    Eye,
    EyeOff,
    ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { errorTrackingService } from '@/services/errorTrackingService';

export default function AdminLoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { loginAsAdmin, isAuthenticated } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Redirect if already authenticated as admin
    if (isAuthenticated) {
        navigate('/admin-super/dashboard', { replace: true });
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
                // Verify this user is a system-level developer
                // Get the current auth session to get the auth user ID
                const { data: { user: authUser } } = await supabase.auth.getUser();

                if (!authUser) {
                    setError('فشل التحقق من هوية المستخدم.');
                    setLoading(false);
                    return;
                }

                // Check if this auth user is linked in system_users as a system-level user
                const { data: sysUser } = await supabase
                    .from('system_users')
                    .select('id, full_name, school_id')
                    .eq('auth_user_id', authUser.id)
                    .single();

                if (!sysUser) {
                    // Not registered as a system user — reject
                    await supabase.auth.signOut();
                    setError('هذه البوابة مخصصة للمطور/المالك فقط. استخدم /login لدخول النظام.');
                    setLoading(false);
                    return;
                }

                // system_users with school_id = null are system-level (developers/owners)
                if (sysUser.school_id !== null) {
                    await supabase.auth.signOut();
                    setError('هذه البوابة مخصصة للمطور/المالك فقط. استخدم /login لدخول النظام.');
                    setLoading(false);
                    return;
                }

                toast.success(`أهلاً بك ${sysUser.full_name}!`);
                navigate('/admin-super/dashboard', { replace: true });
            } else {
                setError(result.error || 'فشل تسجيل الدخول');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
            setError(errorMessage);

            errorTrackingService.logError({
                error_code: 'ERR_ADMIN_LOGIN_FAILED',
                error_message: errorMessage,
                error_type: 'auth',
                severity: 'high',
                module: 'AdminLoginPage',
                function_name: 'handleSubmit',
                context: { email: email }
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -right-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
                <div className="absolute bottom-1/4 -left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-2xl mb-4">
                        <Shield className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">بوابة المطور</h1>
                    <p className="text-blue-200 mt-2">مخصصة لمالك النظام فقط</p>
                </div>

                {/* Login Card */}
                <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-xl">تسجيل دخول المطور</CardTitle>
                        <CardDescription>
                            أدخل بياناتك للوصول إلى لوحة تحكم النظام
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
                                    placeholder="admin@school.com"
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
                                className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin ml-2" />
                                        جاري تسجيل الدخول...
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

                        {/* Back to main gateway */}
                        <div className="text-center">
                            <Button
                                type="button"
                                variant="ghost"
                                className="text-sm text-muted-foreground hover:text-primary"
                                onClick={() => navigate('/')}
                            >
                                <ArrowLeft className="h-4 w-4 ml-1" />
                                العودة للبوابة الرئيسية
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Security Notice */}
                <p className="text-center text-blue-300/70 text-xs mt-6">
                    🔒 اتصال آمن ومشفر
                </p>
            </div>
        </div>
    );
}
