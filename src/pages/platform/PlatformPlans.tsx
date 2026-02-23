import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Package, Check, X, Edit2, Save } from 'lucide-react';
import { fetchAllPlans, fetchAllFeatures, updatePlan, updatePlanFeatures } from '@/services/platformService';
import type { SubscriptionPlan, Feature } from '@/types/platform';
import { useToast } from '@/hooks/use-toast';

export default function PlatformPlans() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [features, setFeatures] = useState<Feature[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPlan, setEditingPlan] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<SubscriptionPlan>>({});
    const [planFeatureEdits, setPlanFeatureEdits] = useState<Record<string, boolean>>({});
    const { toast } = useToast();

    const reload = () => {
        setLoading(true);
        Promise.all([fetchAllPlans(), fetchAllFeatures()])
            .then(([p, f]) => { setPlans(p); setFeatures(f); })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { reload(); }, []);

    const startEdit = (plan: SubscriptionPlan) => {
        setEditingPlan(plan.id);
        setEditValues({ price_monthly: plan.price_monthly, price_yearly: plan.price_yearly, max_students: plan.max_students, max_employees: plan.max_employees });
        const featureMap: Record<string, boolean> = {};
        features.forEach(f => {
            featureMap[f.id] = plan.features?.some(pf => pf.id === f.id) || false;
        });
        setPlanFeatureEdits(featureMap);
    };

    const saveEdit = async (planId: string) => {
        try {
            await updatePlan(planId, editValues);
            const enabledFeatureIds = Object.entries(planFeatureEdits).filter(([, v]) => v).map(([k]) => k);
            await updatePlanFeatures(planId, enabledFeatureIds);
            toast({ title: 'تم حفظ التعديلات' });
            setEditingPlan(null);
            reload();
        } catch (e: any) {
            toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">إدارة الباقات</h1>
                    <p className="text-muted-foreground mt-1">خطط الاشتراك والتسعير وحدود الاستخدام</p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(4)].map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="p-6 h-64" /></Card>)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {plans.map(plan => {
                            const isEditing = editingPlan === plan.id;
                            return (
                                <Card key={plan.id} className={`overflow-hidden transition-all ${isEditing ? 'ring-2 ring-primary shadow-lg' : ''}`}>
                                    {/* Header */}
                                    <div className="p-4 border-b border-border flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-indigo-50 p-2 rounded-lg">
                                                <Package className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-foreground font-semibold">{plan.plan_name_ar}</h3>
                                                <p className="text-muted-foreground text-xs">{plan.plan_name_en}</p>
                                            </div>
                                        </div>
                                        {isEditing ? (
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="text-emerald-600 hover:bg-emerald-50" onClick={() => saveEdit(plan.id)}>
                                                    <Save className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => setEditingPlan(null)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => startEdit(plan)}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>

                                    <CardContent className="p-4 space-y-3">
                                        {/* Pricing */}
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <label className="text-muted-foreground text-xs">شهري</label>
                                                {isEditing ? (
                                                    <Input type="number" value={editValues.price_monthly} onChange={e => setEditValues(p => ({ ...p, price_monthly: +e.target.value }))} className="h-8 text-sm mt-1" />
                                                ) : (
                                                    <p className="text-foreground font-bold text-lg">{plan.price_monthly > 0 ? `${plan.price_monthly} ج.م` : 'مجاني'}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-muted-foreground text-xs">سنوي</label>
                                                {isEditing ? (
                                                    <Input type="number" value={editValues.price_yearly} onChange={e => setEditValues(p => ({ ...p, price_yearly: +e.target.value }))} className="h-8 text-sm mt-1" />
                                                ) : (
                                                    <p className="text-foreground font-bold text-lg">{plan.price_yearly > 0 ? `${plan.price_yearly} ج.م` : 'مجاني'}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Limits */}
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="flex justify-between bg-muted/50 p-2 rounded">
                                                <span className="text-muted-foreground">طلاب</span>
                                                {isEditing ? (
                                                    <Input type="number" value={editValues.max_students ?? ''} onChange={e => setEditValues(p => ({ ...p, max_students: e.target.value ? +e.target.value : null }))} className="border-0 h-5 w-16 text-xs text-center bg-background" />
                                                ) : (
                                                    <span className="text-foreground font-medium">{plan.max_students ?? '∞'}</span>
                                                )}
                                            </div>
                                            <div className="flex justify-between bg-muted/50 p-2 rounded">
                                                <span className="text-muted-foreground">موظفين</span>
                                                {isEditing ? (
                                                    <Input type="number" value={editValues.max_employees ?? ''} onChange={e => setEditValues(p => ({ ...p, max_employees: e.target.value ? +e.target.value : null }))} className="border-0 h-5 w-16 text-xs text-center bg-background" />
                                                ) : (
                                                    <span className="text-foreground font-medium">{plan.max_employees ?? '∞'}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Features */}
                                        <div>
                                            <label className="text-muted-foreground text-xs block mb-2">الخصائص المضمنة</label>
                                            <div className="space-y-1">
                                                {features.map(feature => {
                                                    const included = isEditing
                                                        ? planFeatureEdits[feature.id] ?? false
                                                        : plan.features?.some(f => f.id === feature.id) ?? false;
                                                    return (
                                                        <div key={feature.id} className="flex items-center justify-between py-1 text-xs">
                                                            <span className={included ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}>{feature.feature_name_ar}</span>
                                                            {isEditing ? (
                                                                <Switch checked={planFeatureEdits[feature.id] ?? false}
                                                                    onCheckedChange={v => setPlanFeatureEdits(p => ({ ...p, [feature.id]: v }))}
                                                                    className="scale-65" />
                                                            ) : (
                                                                included ?
                                                                    <Check className="h-3.5 w-3.5 text-emerald-500" /> :
                                                                    <X className="h-3.5 w-3.5 text-muted-foreground/40" />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
