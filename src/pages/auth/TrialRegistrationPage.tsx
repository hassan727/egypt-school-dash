import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Building2, Mail, Phone, Lock, CalendarClock, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function TrialRegistrationPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        schoolName: '',
        email: '',
        phone: '',
        password: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 1. Create temporary school record with 14-day trial
            const trialEnd = new Date();
            trialEnd.setDate(trialEnd.getDate() + 14);

            const { data: schoolData, error: schoolError } = await supabase
                .from('schools')
                .insert({
                    school_name: formData.schoolName,
                    school_code: `TRIAL-${Math.floor(Math.random() * 10000)}`,
                    is_trial: true,
                    trial_ends_at: trialEnd.toISOString(),
                    status: 'trial',
                    settings: {
                        created_from: 'trial_page'
                    }
                })
                .select()
                .single();

            if (schoolError) throw new Error('فشل إنشاء حساب المدرسة: ' + schoolError.message);

            // 2. We skip supabase auth signup here and just create the system_user for demo purposes
            // In a real production scenario, you would use supabase.auth.signUp
            const { error: userError } = await supabase
                .from('system_users')
                .insert({
                    full_name: 'مدير (تجريبي)',
                    email: formData.email,
                    phone: formData.phone,
                    role: 'school_admin',
                    school_id: schoolData.id,
                    is_active: true
                });

            if (userError) throw new Error('فشل إنشاء حساب المدير: ' + userError.message);

            toast.success('تم التسجيل بنجاح! نرحب بك في فترتك التجريبية (14 يوماً)');
            navigate('/login');
        } catch (error: any) {
            console.error('Trial registration error:', error);
            toast.error(error.message || 'حدث خطأ أثناء التسجيل. يرجى المحاولة لاحقاً.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="bg-primary/10 p-4 rounded-full inline-block mb-4">
                        <CalendarClock className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">ابدأ فترتك التجريبية</h1>
                    <p className="text-muted-foreground mt-2">14 يوماً مجاناً لتجربة كفاءة النظام</p>
                </div>

                <Card className="border-t-4 border-t-primary shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-center">بيانات المدرسة</CardTitle>
                        <CardDescription className="text-center">الرجاء إدخال البيانات المبدئية والأساسية</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="schoolName">اسم المدرسة</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <Input
                                        id="schoolName"
                                        name="schoolName"
                                        placeholder="مدرسة الأمل النموذجية"
                                        className="pr-10"
                                        value={formData.schoolName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">البريد الإلكتروني للإدارة</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="admin@school.com"
                                        className="pr-10"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">رقم هاتف المسؤول</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        placeholder="010XXXXXXXX"
                                        className="pr-10"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">كلمة المرور للحساب</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pr-10"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-11 text-base mt-2" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                                        جاري الأعداد...
                                    </>
                                ) : (
                                    <>
                                        تسجيل والبدء بالتجربة
                                        <ArrowRight className="mr-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex justify-center border-t p-4 bg-slate-50/50">
                        <Button variant="link" onClick={() => navigate('/')} className="text-muted-foreground hover:text-primary">
                            العودة للبوابة الرئيسية
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
