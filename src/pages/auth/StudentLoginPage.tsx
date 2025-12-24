/**
 * StudentLoginPage - صفحة تسجيل دخول الطالب
 * Simple and secure student login interface
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    GraduationCap,
    Lock,
    User,
    LogIn,
    Loader2,
    AlertCircle,
    Eye,
    EyeOff,
    Home,
    Shield
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { errorTrackingService } from '@/services/errorTrackingService';

export default function StudentLoginPage() {
    const navigate = useNavigate();
    const { loginAsStudent, isAuthenticated } = useAuth();
    const [nationalId, setNationalId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Redirect if already authenticated
    if (isAuthenticated) {
        navigate('/student/dashboard', { replace: true });
    }

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate inputs
        if (!nationalId || !password) {
            setError('يرجى إدخال الرقم القومي وكلمة المرور');
            return;
        }

        if (nationalId.length !== 14) {
            setError('الرقم القومي يجب أن يتكون من 14 رقم');
            return;
        }

        if (password.length !== 6) {
            setError('كلمة المرور يجب أن تتكون من 6 أرقام');
            return;
        }

        setLoading(true);

        try {
            const result = await loginAsStudent(nationalId, password);

            if (result.success) {
                toast.success('مرحباً بك!');
                navigate('/student/dashboard');
            } else {
                setError(result.error || 'فشل تسجيل الدخول');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
            console.error('Login error:', err);
            setError(errorMessage);
            
            errorTrackingService.logError({
                error_code: 'ERR_STUDENT_LOGIN_FAILED',
                error_message: errorMessage,
                error_type: 'auth',
                severity: 'high',
                module: 'StudentLoginPage',
                function_name: 'handleSubmit',
                context: { nationalId: nationalId.slice(0, 8) + '****' }
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle national ID input (numbers only)
    const handleNationalIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 14);
        setNationalId(value);
    };

    // Handle password input (numbers only)
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setPassword(value);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
                        <GraduationCap className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">بوابة الطالب</h1>
                    <p className="text-gray-600 mt-2">سجل دخولك للوصول إلى بياناتك</p>
                </div>

                {/* Login Card */}
                <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/90">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-xl">تسجيل الدخول</CardTitle>
                        <CardDescription>
                            استخدم رقمك القومي للدخول
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

                            {/* National ID */}
                            <div className="space-y-2">
                                <Label htmlFor="nationalId" className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    الرقم القومي
                                </Label>
                                <Input
                                    id="nationalId"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="أدخل الرقم القومي (14 رقم)"
                                    value={nationalId}
                                    onChange={handleNationalIdChange}
                                    className="text-center font-mono text-lg tracking-wider"
                                    dir="ltr"
                                    disabled={loading}
                                />
                                <p className="text-xs text-muted-foreground text-center">
                                    {nationalId.length}/14
                                </p>
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
                                        inputMode="numeric"
                                        placeholder="آخر 6 أرقام من الرقم القومي"
                                        value={password}
                                        onChange={handlePasswordChange}
                                        className="text-center font-mono text-lg tracking-wider pl-10"
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
                                className="w-full h-12 text-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                                disabled={loading || nationalId.length !== 14 || password.length !== 6}
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

                        {/* Help */}
                        <div className="mt-6 pt-4 border-t text-center">
                            <p className="text-sm text-muted-foreground">
                                كلمة المرور هي آخر 6 أرقام من الرقم القومي
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Admin Link */}
                <div className="text-center mt-6">
                    <Button variant="ghost" asChild className="text-gray-600">
                        <a href="/">
                            <Home className="h-4 w-4 ml-2" />
                            الرئيسية
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    );
}
