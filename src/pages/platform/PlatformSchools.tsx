import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Plus, Search, Power, PowerOff, ExternalLink, Users, ChevronDown, ChevronUp, MoreVertical, Edit2, Trash2, Shield, AlertTriangle, ArrowRight, Eye, Play, CheckCircle2, XCircle } from 'lucide-react';
import { fetchAllSchools, updateSchoolStatus, changeSchoolPlan, fetchAllPlans, fetchSchoolFeatures, toggleSchoolFeature, fetchAllFeatures } from '@/services/platformService';
import type { SchoolWithDetails, SubscriptionPlan, Feature, SchoolFeature } from '@/types/platform';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { useSystem } from '@/context/SystemContext';

const statusColors: Record<string, string> = {
    trial: 'bg-amber-100 text-amber-700 border-amber-200',
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    expired: 'bg-red-100 text-red-700 border-red-200',
    suspended: 'bg-orange-100 text-orange-700 border-orange-200',
    terminated: 'bg-gray-100 text-gray-700 border-gray-200',
};

const statusLabels: Record<string, string> = {
    trial: 'تجربة مجانية',
    active: 'نشط',
    expired: 'منتهي',
    suspended: 'موقوف',
    terminated: 'مُغلق',
};

export default function PlatformSchools() {
    const [schools, setSchools] = useState<SchoolWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<string>('all');
    const [expandedSchool, setExpandedSchool] = useState<string | null>(null);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [allFeatures, setAllFeatures] = useState<Feature[]>([]);
    const [schoolFeatures, setSchoolFeatures] = useState<Record<string, SchoolFeature[]>>({});
    const [showCreate, setShowCreate] = useState(false);
    const [newSchool, setNewSchool] = useState({
        school_code: '',
        school_name: '',
        phone: '',
        email: '',
        city: '',
        plan_key: 'trial',
        admin_name: '',
        admin_email: '',
        admin_password: ''
    });
    const { toast } = useToast();
    const navigate = useNavigate();
    const { setSchool, setAcademicYear } = useSystem();

    const reload = () => {
        setLoading(true);
        Promise.all([fetchAllSchools(), fetchAllPlans(), fetchAllFeatures()])
            .then(([s, p, f]) => { setSchools(s); setPlans(p); setAllFeatures(f); })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { reload(); }, []);

    useEffect(() => { reload(); }, []);

    const handleExpand = (schoolId: string) => {
        if (expandedSchool === schoolId) {
            setExpandedSchool(null);
        } else {
            setExpandedSchool(schoolId);
        }
    };

    const handleToggleActive = async (school: SchoolWithDetails) => {
        try {
            await updateSchoolStatus(school.id, !school.is_active);
            toast({ title: school.is_active ? 'تم تعطيل المدرسة' : 'تم تفعيل المدرسة' });
            reload();
        } catch (e: any) {
            toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
        }
    };

    const handleChangePlan = async (schoolId: string, planId: string) => {
        try {
            await changeSchoolPlan(schoolId, planId);
            toast({ title: 'تم تغيير الخطة بنجاح' });
            reload();
        } catch (e: any) {
            toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
        }
    };

    const handleToggleFeature = async (schoolId: string, featureId: string, enabled: boolean) => {
        try {
            await toggleSchoolFeature(schoolId, featureId, enabled);
            toast({ title: enabled ? 'تم تفعيل الخاصية' : 'تم تعطيل الخاصية' });
            reload();
        } catch (e: any) {
            toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
        }
    };

    const handleImpersonate = async (school: SchoolWithDetails) => {
        try {
            setSchool({
                id: school.id,
                school_name: school.school_name,
                school_code: school.school_code,
                settings: school.settings,
                is_trial: school.is_trial,
                trial_ends_at: school.trial_ends_at,
                status: school.status,
            });

            // Fetch the active academic year to prevent the IdentityGuard from bouncing us to Control Room
            const { data: years } = await supabase
                .from('academic_years')
                .select('year_code')
                .eq('school_id', school.id)
                .eq('is_active', true);

            if (years && years.length > 0) {
                setAcademicYear(years[0].year_code);
                toast({ title: `تم تسجيل الدخول كمدرسة: ${school.school_name}` });
                navigate('/dashboard');
            } else {
                // If no active year, just fallback to whatever year is there
                const { data: anyYears } = await supabase
                    .from('academic_years')
                    .select('year_code')
                    .eq('school_id', school.id)
                    .limit(1);

                if (anyYears && anyYears.length > 0) {
                    setAcademicYear(anyYears[0].year_code);
                    toast({ title: `تم تسجيل الدخول كمدرسة: ${school.school_name}` });
                    navigate('/dashboard');
                } else {
                    toast({ title: 'تنبيه', description: 'هذه المدرسة لا تملك سنوات دراسية. يرجى إعدادها.' });
                    navigate('/');
                }
            }
        } catch (error) {
            console.error(error);
            navigate('/');
        }
    };

    const handleCreateSchool = async () => {
        try {
            const { data: existing } = await supabase.from('schools').select('id').eq('school_code', newSchool.school_code).single();
            if (existing) {
                toast({ title: 'خطأ', description: 'كود المدرسة موجود بالفعل', variant: 'destructive' });
                return;
            }
            const { data, error } = await supabase.from('schools').insert({
                school_code: newSchool.school_code,
                school_name: newSchool.school_name,
                school_name_en: newSchool.school_name, // fallback or omit
                phone: newSchool.phone,
                email: newSchool.email,
                city: newSchool.city,
                is_active: true,
                settings: {},
            }).select('id').single();

            if (error) throw error;

            const plan = plans.find(p => p.plan_key === newSchool.plan_key);
            if (plan) {
                const trialEnds = newSchool.plan_key === 'trial'
                    ? new Date(Date.now() + (plan.trial_days || 14) * 86400000).toISOString() : null;
                await supabase.from('subscriptions').insert({
                    school_id: data.id,
                    plan_id: plan.id,
                    status: newSchool.plan_key === 'trial' ? 'trial' : 'active',
                    trial_ends_at: trialEnds,
                });
            }

            // CREATE THE ADMIN USER FOR THE SCHOOL VIA POSTGRES RPC
            const { error: adminError } = await supabase.rpc('create_school_admin_user', {
                p_email: newSchool.admin_email,
                p_password: newSchool.admin_password,
                p_full_name: newSchool.admin_name,
                p_school_id: data.id,
                p_role: 'school_admin'
            });

            if (adminError) {
                console.error("Failed to create admin auth user:", adminError);
                toast({ title: 'تم إنشاء المدرسة ولكن فشل إنشاء حساب المدير', description: adminError.message, variant: 'destructive' });
            } else {
                toast({ title: 'تم إنشاء المدرسة وحساب المدير بنجاح' });
            }

            setShowCreate(false);
            setNewSchool({
                school_code: '', school_name: '', phone: '', email: '', city: '', plan_key: 'trial',
                admin_name: '', admin_email: '', admin_password: ''
            });
            reload();
        } catch (e: any) {
            toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
        }
    };

    const handleChangeStatus = async (schoolId: string, newStatus: string) => {
        try {
            await supabase.from('subscriptions').update({ status: newStatus }).eq('school_id', schoolId);
            toast({ title: `تم تغيير حالة الاشتراك إلى: ${statusLabels[newStatus]}` });
            reload();
        } catch (e: any) {
            toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
        }
    };

    const filtered = schools.filter(s => {
        const matchesSearch = s.school_name.includes(search) || s.school_code.includes(search);
        const status = s.subscription?.status || 'trial';
        const matchesFilter = filter === 'all' || status === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">إدارة المدارس</h1>
                        <p className="text-muted-foreground mt-1">{schools.length} مدرسة مسجلة</p>
                    </div>
                    <Dialog open={showCreate} onOpenChange={(open) => {
                        if (open) {
                            // Automatically compute the next highest school code
                            let nextCode = 1;
                            if (schools.length > 0) {
                                const codes = schools.map(s => parseInt(s.school_code, 10)).filter(c => !isNaN(c));
                                if (codes.length > 0) {
                                    nextCode = Math.max(...codes) + 1;
                                }
                            }
                            setNewSchool(p => ({ ...p, school_code: nextCode.toString() }));
                        }
                        setShowCreate(open);
                    }}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" /> إنشاء مدرسة
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg" dir="rtl">
                            <DialogHeader>
                                <DialogTitle>إنشاء مدرسة جديدة</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-muted-foreground mr-1">كود المدرسة (تلقائي)</label>
                                        <Input
                                            className="bg-muted text-muted-foreground font-bold font-mono"
                                            readOnly
                                            disabled
                                            value={newSchool.school_code}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-muted-foreground mr-1">اسم المدرسة باللغة العربية *</label>
                                        <Input
                                            placeholder="مثال: مدرسة المستقبل الحديثة"
                                            value={newSchool.school_name}
                                            onChange={e => setNewSchool(p => ({ ...p, school_name: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                {/* Divider for Admin Account */}
                                <div className="border-t pt-4 mt-2">
                                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        حساب مدير المدرسة (المالك)
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-muted-foreground mr-1">الاسم الكامل للمدير *</label>
                                            <Input
                                                placeholder="مثال: أحمد محمود"
                                                value={newSchool.admin_name}
                                                onChange={e => setNewSchool(p => ({ ...p, admin_name: e.target.value }))}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-muted-foreground mr-1">البريد الإلكتروني للدخول *</label>
                                                <Input
                                                    type="email"
                                                    placeholder="admin@school.com"
                                                    value={newSchool.admin_email}
                                                    onChange={e => setNewSchool(p => ({ ...p, admin_email: e.target.value }))}
                                                    dir="ltr"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-muted-foreground mr-1">كلمة المرور *</label>
                                                <Input
                                                    type="text"
                                                    placeholder="••••••••"
                                                    value={newSchool.admin_password}
                                                    onChange={e => setNewSchool(p => ({ ...p, admin_password: e.target.value }))}
                                                    dir="ltr"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-muted-foreground mr-1">أرقام التواصل (يمكن كتابة أكثر من رقم)</label>
                                        <Input
                                            placeholder="مثال: 01012345678"
                                            value={newSchool.phone}
                                            onChange={e => setNewSchool(p => ({ ...p, phone: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-muted-foreground mr-1">البريد الإلكتروني للإدارة</label>
                                        <Input
                                            type="email"
                                            placeholder="admin@school.com"
                                            value={newSchool.email}
                                            onChange={e => setNewSchool(p => ({ ...p, email: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-muted-foreground mr-1">العنوان الجغرافي التفصيلي للمدرسة</label>
                                    <Input
                                        placeholder="مثال: القاهرة، مدينة نصر، شارع مكرم عبيد..."
                                        value={newSchool.city}
                                        onChange={e => setNewSchool(p => ({ ...p, city: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-muted-foreground mr-1">الخطة الافتراضية</label>
                                    <Select value={newSchool.plan_key} onValueChange={v => setNewSchool(p => ({ ...p, plan_key: v }))}>
                                        <SelectTrigger><SelectValue placeholder="اختر الخطة" /></SelectTrigger>
                                        <SelectContent>
                                            {plans.map(p => <SelectItem key={p.plan_key} value={p.plan_key}>{p.plan_name_ar}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button className="w-full" onClick={handleCreateSchool}>
                                    إنشاء المدرسة
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filters */}
                <div className="flex gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="بحث بالاسم أو الكود..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
                    </div>
                    {['all', 'trial', 'active', 'expired', 'suspended'].map(f => (
                        <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
                            {f === 'all' ? 'الكل' : statusLabels[f]}
                        </Button>
                    ))}
                </div>

                {/* Schools List */}
                {loading ? (
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="p-4 h-20" /></Card>)}
                    </div>
                ) : filtered.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-16 text-muted-foreground">
                            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>لا توجد مدارس مطابقة</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(school => {
                            const sub = school.subscription;
                            const status = sub?.status || 'trial';
                            const isExpanded = expandedSchool === school.id;
                            const features = schoolFeatures[school.id] || [];

                            return (
                                <Card key={school.id} className="overflow-hidden">
                                    {/* Main Row */}
                                    <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleExpand(school.id)}>
                                        <div className="bg-blue-50 p-2.5 rounded-lg">
                                            <Building2 className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-foreground font-semibold truncate">{school.school_name}</h3>
                                                <span className="text-muted-foreground text-xs">#{school.school_code}</span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {school._studentCount} طالب</span>
                                                {school.city && <span>{school.city}</span>}
                                                <span className="text-primary font-medium">
                                                    {sub?.plan ? (sub.plan as any).plan_name_ar : statusLabels[status]}
                                                </span>
                                            </div>
                                        </div>
                                        <Badge className={`${statusColors[status]} border text-xs`}>{statusLabels[status]}</Badge>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-emerald-600" title="دخول كمدير" onClick={(e) => { e.stopPropagation(); handleImpersonate(school); }}>
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className={`${school.is_active ? 'text-muted-foreground hover:text-red-600' : 'text-red-500 hover:text-emerald-600'}`} title={school.is_active ? 'تعطيل' : 'تفعيل'} onClick={(e) => { e.stopPropagation(); handleToggleActive(school); }}>
                                                {school.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                            </Button>
                                            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                        </div>
                                    </div>

                                    {/* Expanded Panel */}
                                    {isExpanded && (
                                        <div className="border-t border-border bg-muted/30 p-4 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div>
                                                    <label className="text-xs text-muted-foreground block mb-1">تغيير الخطة</label>
                                                    <Select value={sub?.plan_id || ''} onValueChange={(v) => handleChangePlan(school.id, v)}>
                                                        <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.plan_name_ar}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-muted-foreground block mb-1">حالة الاشتراك</label>
                                                    <Select value={status} onValueChange={(v) => handleChangeStatus(school.id, v)}>
                                                        <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="flex items-end">
                                                    <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-2"
                                                        onClick={() => handleImpersonate(school)}>
                                                        <ExternalLink className="h-3 w-3" /> وضع المحاكاة (Login as School)
                                                    </Button>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-semibold text-foreground mb-3">الخصائص المفعلة</h4>
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                    {allFeatures.map(feature => {
                                                        const currentFeatures = school.settings?.features || { finance: true, hr: true, students: true, control: true };
                                                        const isEnabled = currentFeatures[feature.feature_key] ?? false;
                                                        return (
                                                            <div key={feature.id} className={`flex items-center justify-between p-2.5 rounded-lg border transition-all text-sm
                                ${isEnabled ? 'bg-emerald-50 border-emerald-200' : 'bg-muted/50 border-border'}`}>
                                                                <span className={isEnabled ? 'text-emerald-700' : 'text-muted-foreground'}>{feature.feature_name_ar}</span>
                                                                <Switch checked={isEnabled} onCheckedChange={(v) => handleToggleFeature(school.id, feature.id, v)} className="scale-75" />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
