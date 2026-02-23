import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Crown, ArrowRight, CheckCircle2, CreditCard, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchAllPlans } from "@/services/platformService";
import type { SubscriptionPlan } from "@/types/platform";
import { useToast } from "@/hooks/use-toast";

export default function UpgradeRequired() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllPlans()
            .then(data => {
                // Filter out trial or basic plans if necessary, or just show them all
                setPlans(data.filter(p => p.is_active));
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handlePayment = (planName: string) => {
        toast({
            title: "بوابة الدفع",
            description: `جاري إعادة التوجيه لدفع قيمة اشتراك باقة ${planName}...`,
        });
        // In a real scenario, this would redirect to Stripe/Paymob etc.
        setTimeout(() => {
            navigate('/dashboard');
        }, 3000);
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col items-center justify-start min-h-[85vh] px-4 py-8">

                {/* Header Banner */}
                <div className="w-full max-w-5xl text-center mb-10">
                    <div className="inline-flex items-center justify-center bg-amber-100 text-amber-700 p-3 rounded-full mb-4">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-bold text-foreground mb-4 font-cairo">
                        الوصول مقيد (ميزة إضافية)
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        لقد حاولت الوصول إلى خاصية غير متوفرة في باقتك الحالية. قم بالترقية الآن إلى خطط <span className="text-primary font-bold">البرو (Pro)</span> للاستمتاع بالقوة الكاملة للمنصة!
                    </p>
                </div>

                {/* Pricing Grid */}
                <div className="w-full max-w-6xl">
                    {loading ? (
                        <div className="flex space-x-4 space-x-reverse justify-center">
                            {[1, 2, 3].map(i => (
                                <Card key={i} className="animate-pulse w-full max-w-sm h-96"></Card>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-end">
                            {plans.map((plan, index) => {
                                const isPro = plan.price_monthly > 0;
                                const isPremium = plan.price_monthly > 1500; // Arbitrary logic for "Premium"

                                return (
                                    <Card
                                        key={plan.id}
                                        className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${isPro ? 'border-primary ring-2 ring-primary/20 scale-105 z-10' : 'border-border'}`}
                                    >
                                        {isPremium && (
                                            <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1 z-20">
                                                <Sparkles className="h-3 w-3" /> الأكثر طلباً
                                            </div>
                                        )}

                                        <CardContent className="p-0">
                                            {/* Card Header */}
                                            <div className={`p-6 text-center text-white ${isPremium ? 'bg-gradient-to-br from-slate-900 to-slate-800' : isPro ? 'bg-gradient-to-br from-primary to-blue-600' : 'bg-slate-100 text-slate-800'}`}>
                                                {isPro && <Crown className={`w-12 h-12 mx-auto mb-3 ${isPremium ? 'text-amber-400' : 'text-blue-200'}`} />}
                                                <h3 className="text-2xl font-bold">{plan.plan_name_ar}</h3>
                                                <div className="mt-4 flex items-end justify-center gap-1">
                                                    <span className="text-4xl font-extrabold">{plan.price_monthly > 0 ? plan.price_monthly : 'مجاني'}</span>
                                                    {plan.price_monthly > 0 && <span className={'text-sm opacity-80 mb-1'}>ج.م / شهرياً</span>}
                                                </div>
                                            </div>

                                            {/* Card Body */}
                                            <div className="p-6 bg-card">
                                                <ul className="space-y-4 mb-8">
                                                    <li className="flex items-start gap-3 justify-between border-b pb-2">
                                                        <span className="text-muted-foreground text-sm">الطلاب</span>
                                                        <span className="font-bold">{plan.max_students ? plan.max_students : 'غير محدود'}</span>
                                                    </li>
                                                    <li className="flex items-start gap-3 justify-between border-b pb-2">
                                                        <span className="text-muted-foreground text-sm">الموظفين</span>
                                                        <span className="font-bold">{plan.max_employees ? plan.max_employees : 'غير محدود'}</span>
                                                    </li>

                                                    {/* Display Included Features */}
                                                    {plan.features?.slice(0, 5).map((feat) => (
                                                        <li key={feat.id} className="flex items-center gap-3">
                                                            <CheckCircle2 className={`w-5 h-5 shrink-0 ${isPro ? 'text-primary' : 'text-slate-400'}`} />
                                                            <span className="text-sm font-medium">{feat.feature_name_ar}</span>
                                                        </li>
                                                    ))}
                                                    {(plan.features?.length || 0) > 5 && (
                                                        <p className="text-xs text-center text-muted-foreground mt-2">
                                                            + {plan.features!.length - 5} خصائص إضافية
                                                        </p>
                                                    )}
                                                </ul>

                                                <Button
                                                    onClick={() => handlePayment(plan.plan_name_ar)}
                                                    variant={isPro ? 'default' : 'outline'}
                                                    className={`w-full gap-2 ${isPremium ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0' : ''}`}
                                                >
                                                    {isPro ? (
                                                        <>
                                                            <CreditCard className="w-5 h-5" />
                                                            ادفع واشترك الآن
                                                        </>
                                                    ) : (
                                                        'الباقة الحالية'
                                                    )}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="mt-12 text-center">
                    <Button onClick={() => navigate('/dashboard')} variant="ghost" className="text-muted-foreground hover:text-foreground gap-2">
                        <ArrowRight className="w-4 h-4 rtl:rotate-180" /> العودة للوحة التحكم
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}
