import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, ShieldCheck, Play, ArrowRight, BookOpen, Shield } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useSystem } from "@/context/SystemContext";
import { useEffect, useRef } from "react";

export default function LandingGateway() {
    const navigate = useNavigate();
    const location = useLocation();
    const { enterDemoMode } = useAuth();
    const { identity } = useSystem();
    const guestTriggered = useRef(false);

    // Auto-trigger guest mode when accessed via /guest
    useEffect(() => {
        if (location.pathname === '/guest' && !guestTriggered.current) {
            guestTriggered.current = true;
            enterDemoMode();
            navigate('/control-room', { replace: true });
        }
    }, [location.pathname, enterDemoMode, navigate]);

    useEffect(() => {
        if (identity.isReady && location.pathname !== '/guest') {
            navigate('/dashboard');
        }
    }, [identity.isReady, navigate, location.pathname]);

    const handleGuestLogin = () => {
        // We will enhance this later to track 60-min sessions
        enterDemoMode();
        navigate('/control-room');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4" dir="rtl">
            <div className="w-full max-w-4xl space-y-8">
                <div className="text-center space-y-4">
                    <div className="flex justify-center mb-6">
                        <div className="bg-primary/10 p-4 rounded-full">
                            <BookOpen className="h-12 w-12 text-primary" />
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                        نظام إدارة المدارس الذكي
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        المنصة المتكاملة لإدارة شؤون الطلاب، الموارد البشرية، والأنظمة المالية بكل سهولة واحترافية.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 pt-8">
                    {/* تسجيل الدخول العادي */}
                    <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
                        <CardHeader className="text-center pb-4">
                            <div className="mx-auto bg-blue-100 p-3 rounded-full w-fit mb-4">
                                <User className="h-6 w-6 text-blue-600" />
                            </div>
                            <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
                            <CardDescription className="text-base pt-2">
                                للمدارس والموظفين المسجلين في النظام
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            <Button size="lg" className="w-full text-lg h-12" onClick={() => navigate('/login')}>
                                دخول للنظام
                                <ArrowRight className="mr-2 h-5 w-5" />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* الفترة التجريبية */}
                    <Card className="border-2 border-primary/20 bg-primary/5 hover:border-primary/50 transition-all hover:shadow-lg relative overflow-hidden">
                        <div className="absolute top-4 left-[-35px] bg-primary text-primary-foreground text-xs font-bold px-10 py-1 -rotate-45">
                            جديد
                        </div>
                        <CardHeader className="text-center pb-4">
                            <div className="mx-auto bg-primary/20 p-3 rounded-full w-fit mb-4">
                                <ShieldCheck className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle className="text-2xl">فترة تجريبية</CardTitle>
                            <CardDescription className="text-base pt-2 text-primary/80">
                                14 يوماً مجاناً لتجربة كافة مميزات النظام
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            <Button size="lg" variant="default" className="w-full text-lg h-12 bg-primary hover:bg-primary/90" onClick={() => navigate('/trial')}>
                                ابدأ تجربتك الآن
                            </Button>
                        </CardContent>
                    </Card>

                    {/* وضع الضيف */}
                    <Card className="border-2 hover:border-emerald-500/50 transition-all hover:shadow-lg">
                        <CardHeader className="text-center pb-4">
                            <div className="mx-auto bg-emerald-100 p-3 rounded-full w-fit mb-4">
                                <Play className="h-6 w-6 text-emerald-600" />
                            </div>
                            <CardTitle className="text-2xl">جرب النظام كضيف</CardTitle>
                            <CardDescription className="text-base pt-2">
                                استكشف النظام ببيانات افتراضية دون الحاجة للتسجيل
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center flex-col gap-3">
                            <Button size="lg" variant="outline" className="w-full text-lg h-12 border-emerald-500/30 hover:bg-emerald-50 text-emerald-700" onClick={handleGuestLogin}>
                                دخول سريع (60 دقيقة)
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* رابط مالك المنصة / المطور */}
                <div className="flex justify-center pt-4">
                    <Button variant="ghost" className="text-sm text-gray-400 hover:text-violet-600 gap-2" onClick={() => navigate('/platform')}>
                        <Shield className="h-4 w-4" />
                        دخول كمالك المنصة / المطور
                    </Button>
                </div>
            </div>
        </div>
    );
}
