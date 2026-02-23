import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CreditCard, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSystem } from '@/context/SystemContext';
import { useAuth } from '@/context/AuthContext';

export default function RenewSubscriptionPage() {
    const navigate = useNavigate();
    const { identity } = useSystem();
    const { logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
            <div className="w-full max-w-lg">
                <Card className="border-t-4 border-t-red-500 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <AlertTriangle className="h-40 w-40 text-red-500" />
                    </div>
                    <CardHeader className="text-center pb-2 relative z-10">
                        <div className="mx-auto bg-red-100 p-4 rounded-full w-fit mb-4">
                            <CreditCard className="h-8 w-8 text-red-600" />
                        </div>
                        <CardTitle className="text-2xl text-slate-800">
                            عفواً، انتهت صلاحية الاشتراك
                        </CardTitle>
                        <CardDescription className="text-base pt-2 text-slate-600">
                            مدرسة {identity.school?.school_name || 'الخاصة بك'} غير نشطة حالياً. يرجى تجديد الاشتراك لتتمكن من الوصول لجميع ميزات النظام.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6 relative z-10 pt-4">
                        <div className="bg-slate-100/50 rounded-lg p-4 space-y-3">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                                <span className="text-sm font-medium text-slate-500">حالة الاشتراك الحالية:</span>
                                <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-700">
                                    غير منشط / منتهي
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                                بادر بتجديد الاشتراك للإستفادة من:
                            </h3>
                            <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside">
                                <li>تسجيل بيانات الطلاب والموظفين.</li>
                                <li>لوحات التحكم المتقدمة المخصصة للإدارة.</li>
                                <li>استخراج التقارير وسحب البيانات.</li>
                                <li>الدعم الفني المباشر واستمرارية الخدمة.</li>
                            </ul>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-3 relative z-10">
                        <Button className="w-full h-12 text-lg" size="lg" onClick={() => window.open('https://your-payment-gateway.com', '_blank')}>
                            التوجه للدفع والتجديد
                            <ArrowRight className="mr-2 h-5 w-5" />
                        </Button>
                        <Button variant="outline" className="w-full" onClick={handleLogout}>
                            تسجيل الخروج والعودة للبوابة
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
