import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Building2, Users, Briefcase, Package, Puzzle, AlertTriangle, CheckCircle2,
    Clock, TrendingUp, DollarSign, Star, RefreshCcw, Bell, FileText,
    CreditCard, Headphones, Megaphone, BarChart3, Settings, ArrowUpRight,
    ArrowDownRight, Activity, Shield, Eye, ChevronLeft
} from 'lucide-react';
import {
    fetchPlatformStats, fetchDashboardAnalytics, fetchRecentActivity,
    fetchExpiringSubscriptions, fetchPlatformAlerts, fetchSchoolComparison,
    fetchSchoolGrowthData, fetchRevenueData
} from '@/services/platformService';
import type {
    PlatformStats, DashboardAnalytics, RecentActivityItem,
    ExpiringSubscription, PlatformAlert, SchoolComparisonItem,
    SchoolGrowthPoint, RevenuePoint
} from '@/types/platform';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

// =============================================
// Helper Components
// =============================================

function TimeAgo({ date }: { date: string }) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return <span>منذ {mins} دقيقة</span>;
    if (hours < 24) return <span>منذ {hours} ساعة</span>;
    return <span>منذ {days} يوم</span>;
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
        pending: { label: '⏳ معلقة', variant: 'secondary' },
        completed: { label: '✅ مكتمل', variant: 'default' },
        failed: { label: '🔴 مفتوح', variant: 'destructive' },
    };
    const c = config[status] || config.pending;
    return <Badge variant={c.variant}>{c.label}</Badge>;
}

const CHART_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#14b8a6'];
const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// =============================================
// Main Dashboard Component
// =============================================

export default function PlatformDashboard() {
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
    const [activity, setActivity] = useState<RecentActivityItem[]>([]);
    const [expiring, setExpiring] = useState<ExpiringSubscription[]>([]);
    const [alerts, setAlerts] = useState<PlatformAlert[]>([]);
    const [comparison, setComparison] = useState<SchoolComparisonItem[]>([]);
    const [growthData, setGrowthData] = useState<SchoolGrowthPoint[]>([]);
    const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([
            fetchPlatformStats().then(setStats).catch(() => null),
            fetchDashboardAnalytics().then(setAnalytics).catch(() => null),
            fetchRecentActivity(10).then(setActivity).catch(() => []),
            fetchExpiringSubscriptions(30).then(setExpiring).catch(() => []),
            fetchPlatformAlerts().then(setAlerts).catch(() => []),
            fetchSchoolComparison().then(setComparison).catch(() => []),
            fetchSchoolGrowthData().then(setGrowthData).catch(() => []),
            fetchRevenueData().then(setRevenueData).catch(() => []),
        ]).finally(() => setLoading(false));
    }, []);

    // Derived chart data
    const subscriptionPieData = stats ? [
        { name: 'نشطة', value: stats.activeSchools, color: '#10b981' },
        { name: 'تجريبية', value: stats.trialSchools, color: '#f59e0b' },
        { name: 'منتهية', value: stats.expiredSchools, color: '#ef4444' },
        { name: 'موقوفة', value: stats.suspendedSchools, color: '#8b5cf6' },
    ].filter(d => d.value > 0) : [];

    // growthData and revenueData are fetched from real DB in useEffect above

    // Quick actions
    const quickActions = [
        { icon: Building2, label: 'إدارة المدارس', desc: 'إضافة ومتابعة المشتركين', color: 'bg-blue-500', path: '/platform/schools' },
        { icon: CreditCard, label: 'المدفوعات والفواتير', desc: 'متابعة المعاملات المالية', color: 'bg-violet-500', path: '/platform/payments' },
        { icon: Headphones, label: 'الدعم الفني', desc: 'إدارة تذاكر الدعم', color: 'bg-orange-500', path: '/platform/support' },
        { icon: Megaphone, label: 'الإعلانات والتنبيهات', desc: 'إرسال إشعارات للمدارس', color: 'bg-pink-500', path: '/platform/announcements' },
        { icon: Package, label: 'باقات الاشتراك', desc: 'إدارة الباقات والأسعار', color: 'bg-emerald-500', path: '/platform/plans' },
        { icon: Puzzle, label: 'إدارة الميزات', desc: 'تفعيل/تعطيل خصائص المنصة', color: 'bg-amber-500', path: '/platform/features' },
        { icon: FileText, label: 'سجل العمليات (Audit)', desc: 'سجل كامل لمراقبة المنصة', color: 'bg-cyan-500', path: '/platform/audit' },
    ];

    // Loading skeleton
    if (loading) {
        return (
            <DashboardLayout>
                <div className="space-y-6" dir="rtl">
                    <div><h1 className="text-3xl font-bold text-foreground">لوحة تحكم المنصة</h1></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <Card key={i} className="animate-pulse">
                                <CardContent className="p-5">
                                    <div className="h-4 bg-muted rounded w-24 mb-3" />
                                    <div className="h-8 bg-muted rounded w-16" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <Card key={i} className="animate-pulse">
                                <CardContent className="p-5">
                                    <div className="h-4 bg-muted rounded w-32 mb-3" />
                                    <div className="h-48 bg-muted rounded" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6" dir="rtl">
                {/* ========================================= */}
                {/* HEADER */}
                {/* ========================================= */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                            <div className="bg-gradient-to-br from-violet-500 to-indigo-600 p-2.5 rounded-xl">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            لوحة تحكم المنصة
                        </h1>
                        <p className="text-muted-foreground mt-1 mr-14">
                            إحصائيات ومراقبة شاملة للنظام &bull; مستوى Enterprise
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs px-3 py-1.5 border-violet-300 text-violet-600">
                            <Activity className="h-3 w-3 ml-1" /> النظام يعمل
                        </Badge>
                    </div>
                </div>

                {/* ========================================= */}
                {/* SECTION 1: KPI HERO CARDS */}
                {/* ========================================= */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Revenue */}
                    <Card className="border-t-4 border-t-emerald-500 hover:shadow-lg transition-all duration-300 group">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-muted-foreground text-sm font-medium">💰 إجمالي الإيرادات</span>
                                <div className="bg-emerald-50 p-2 rounded-lg group-hover:scale-110 transition-transform">
                                    <DollarSign className="h-4 w-4 text-emerald-600" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-foreground">
                                {(analytics?.totalRevenue || 0).toLocaleString('ar-EG')} <span className="text-base font-normal text-muted-foreground">ج.م</span>
                            </div>
                            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                                {analytics?.monthlyGrowthRate !== undefined && analytics.monthlyGrowthRate !== 0 ? (
                                    <><ArrowUpRight className="h-3 w-3" /> +{analytics.monthlyGrowthRate}% هذا الشهر</>
                                ) : (
                                    <span className="text-muted-foreground">لا يوجد بيانات بعد</span>
                                )}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Monthly Growth */}
                    <Card className="border-t-4 border-t-blue-500 hover:shadow-lg transition-all duration-300 group">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-muted-foreground text-sm font-medium">📈 معدل النمو الشهري</span>
                                <div className="bg-blue-50 p-2 rounded-lg group-hover:scale-110 transition-transform">
                                    <TrendingUp className="h-4 w-4 text-blue-600" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-foreground">
                                {analytics?.monthlyGrowthRate !== undefined ? `${analytics.monthlyGrowthRate > 0 ? '+' : ''}${analytics.monthlyGrowthRate}%` : '—'}
                            </div>
                            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                {analytics?.monthlyGrowthRate !== undefined && analytics.monthlyGrowthRate > 0 ? (
                                    <><ArrowUpRight className="h-3 w-3" /> مقارنة بالشهر السابق</>
                                ) : analytics?.monthlyGrowthRate !== undefined && analytics.monthlyGrowthRate < 0 ? (
                                    <><ArrowDownRight className="h-3 w-3 text-red-500" /> <span className="text-red-500">تراجع عن الشهر السابق</span></>
                                ) : (
                                    <span className="text-muted-foreground">محسوب من بيانات المدارس</span>
                                )}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Customer Satisfaction */}
                    <Card className="border-t-4 border-t-amber-500 hover:shadow-lg transition-all duration-300 group">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-muted-foreground text-sm font-medium">⭐ رضا العملاء</span>
                                <div className="bg-amber-50 p-2 rounded-lg group-hover:scale-110 transition-transform">
                                    <Star className="h-4 w-4 text-amber-600" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-foreground">
                                {analytics?.customerSatisfaction ?? 0}/5
                            </div>
                            <p className="text-xs text-amber-600 mt-1">
                                {analytics?.customerSatisfaction !== undefined
                                    ? `محسوب من نسبة حل التذاكر`
                                    : 'لا توجد بيانات تذاكر'}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Retention Rate */}
                    <Card className="border-t-4 border-t-violet-500 hover:shadow-lg transition-all duration-300 group">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-muted-foreground text-sm font-medium">🔄 معدل الاحتفاظ</span>
                                <div className="bg-violet-50 p-2 rounded-lg group-hover:scale-110 transition-transform">
                                    <RefreshCcw className="h-4 w-4 text-violet-600" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-foreground">
                                {analytics?.retentionRate ?? 0}%
                            </div>
                            <p className="text-xs text-violet-600 mt-1 flex items-center gap-1">
                                <span className="text-muted-foreground">نسبة الاشتراكات الفعالة</span>
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* ========================================= */}
                {/* SECTION 2: STAT CARDS ROW */}
                {/* ========================================= */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                    {[
                        { label: 'المدارس', value: stats?.totalSchools || 0, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'نشطة', value: stats?.activeSchools || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'تجريبية', value: stats?.trialSchools || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'منتهية', value: (stats?.expiredSchools || 0) + (stats?.suspendedSchools || 0), icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
                        { label: 'الطلاب', value: stats?.totalStudents || 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'الموظفين', value: stats?.totalEmployees || 0, icon: Briefcase, color: 'text-teal-600', bg: 'bg-teal-50' },
                        { label: 'الباقات', value: stats?.totalPlans || 0, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'الخصائص', value: stats?.totalFeatures || 0, icon: Puzzle, color: 'text-pink-600', bg: 'bg-pink-50' },
                    ].map((card, i) => (
                        <Card key={i} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-3 text-center">
                                <div className={`${card.bg} p-2 rounded-lg inline-flex mb-2`}>
                                    <card.icon className={`h-4 w-4 ${card.color}`} />
                                </div>
                                <div className="text-xl font-bold text-foreground">
                                    {card.value.toLocaleString('ar-EG')}
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-0.5">{card.label}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* ========================================= */}
                {/* SECTION 3: CHARTS GRID */}
                {/* ========================================= */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* School Growth Line Chart */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                📈 نمو المدارس عبر الزمن
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={growthData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="month" fontSize={11} />
                                    <YAxis allowDecimals={false} fontSize={11} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 8, fontSize: 12 }}
                                        labelStyle={{ fontWeight: 'bold' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        dot={{ fill: '#6366f1', r: 5 }}
                                        activeDot={{ r: 7 }}
                                        name="عدد المدارس"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Subscription Distribution Pie Chart */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                🥧 توزيع الاشتراكات
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {subscriptionPieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={subscriptionPieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={90}
                                            paddingAngle={4}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            labelLine={false}
                                        >
                                            {subscriptionPieData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: 8, fontSize: 12 }}
                                            formatter={(value: number) => [value, 'مدارس']}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                    لا توجد بيانات اشتراكات
                                </div>
                            )}
                            {/* Legend */}
                            <div className="flex flex-wrap gap-3 justify-center mt-2">
                                {subscriptionPieData.map((d, i) => (
                                    <div key={i} className="flex items-center gap-1.5 text-xs">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                                        <span>{d.name}: {d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Students & Employees Bar Chart */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                📊 الطلاب والموظفين لكل مدرسة
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {comparison.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={comparison} layout="vertical" barCategoryGap="15%">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis type="number" fontSize={11} />
                                        <YAxis type="category" dataKey="name" width={90} fontSize={10} />
                                        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                                        <Legend
                                            formatter={(value) => <span style={{ fontSize: 11 }}>{value}</span>}
                                        />
                                        <Bar dataKey="students" fill="#6366f1" name="الطلاب" radius={[0, 4, 4, 0]} />
                                        <Bar dataKey="employees" fill="#14b8a6" name="الموظفين" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                    لا توجد بيانات مدارس
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Revenue Bar Chart */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                📉 إحصائيات الإيرادات الشهرية
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="month" fontSize={11} />
                                    <YAxis fontSize={11} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 8, fontSize: 12 }}
                                        formatter={(value: number) => [value.toLocaleString('ar-EG'), 'ج.م']}
                                    />
                                    <Bar dataKey="revenue" fill="#10b981" name="الإيرادات" radius={[6, 6, 0, 0]}>
                                        {revenueData.map((_, i) => (
                                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* ========================================= */}
                {/* SECTION 4: ALERTS & ADDITIONAL STATS */}
                {/* ========================================= */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Alerts Panel */}
                    <Card className="lg:col-span-1 hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Bell className="h-4 w-4 text-amber-500" />
                                🔔 تنبيهات هامة
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {alerts.length > 0 ? alerts.map(alert => (
                                <div
                                    key={alert.id}
                                    className={`rounded-lg p-3 border text-sm ${alert.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                        alert.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                                            alert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                                alert.type === 'announcement' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                                                    'bg-gray-50 border-gray-200 text-gray-800'
                                        }`}
                                >
                                    <div className="font-semibold flex items-center gap-1">
                                        {alert.type === 'warning' ? '⚠️' :
                                            alert.type === 'error' ? '🚨' :
                                                alert.type === 'success' ? '✅' :
                                                    alert.type === 'announcement' ? '📢' : 'ℹ️'}
                                        {alert.title}
                                    </div>
                                    <p className="mt-1 text-xs opacity-80">{alert.message}</p>
                                </div>
                            )) : (
                                // Fallback alerts from stats
                                <>
                                    {expiring.length > 0 && (
                                        <div className="rounded-lg p-3 border bg-amber-50 border-amber-200 text-amber-800 text-sm">
                                            <div className="font-semibold">⚠️ {expiring.length} اشتراكات تنتهي قريباً</div>
                                            <p className="mt-1 text-xs opacity-80">
                                                {expiring.slice(0, 2).map(e => e.schoolName).join(', ')}
                                            </p>
                                        </div>
                                    )}
                                    <div className="rounded-lg p-3 border bg-blue-50 border-blue-200 text-blue-800 text-sm">
                                        <div className="font-semibold">ℹ️ لا توجد تنبيهات جديدة</div>
                                        <p className="mt-1 text-xs opacity-80">جميع الأنظمة تعمل بشكل طبيعي</p>
                                    </div>
                                </>
                            )}

                            {/* Expiring subscriptions */}
                            {expiring.length > 0 && (
                                <div className="mt-2 pt-3 border-t">
                                    <p className="text-xs text-muted-foreground font-semibold mb-2">
                                        ⏰ اشتراكات تنتهي قريباً ({expiring.length})
                                    </p>
                                    {expiring.slice(0, 3).map((sub, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b last:border-0">
                                            <span className="font-medium">{sub.schoolName}</span>
                                            <Badge variant="outline" className="text-[10px] py-0">
                                                {sub.daysRemaining} يوم
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Additional Stats */}
                    <Card className="lg:col-span-2 hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                📊 إحصائيات إضافية
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
                                    <div className="text-2xl font-bold text-emerald-700">
                                        {(analytics?.totalRevenue || 0).toLocaleString('ar-EG')}
                                    </div>
                                    <p className="text-xs text-emerald-600 mt-1">💰 إجمالي الإيرادات</p>
                                </div>
                                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                                    <div className="text-2xl font-bold text-blue-700">
                                        {analytics?.renewalRate || 0}%
                                    </div>
                                    <p className="text-xs text-blue-600 mt-1">🔄 معدل التجديد</p>
                                </div>
                                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200">
                                    <div className="text-2xl font-bold text-amber-700">
                                        {expiring.length}
                                    </div>
                                    <p className="text-xs text-amber-600 mt-1">⚠️ تنتهي قريباً</p>
                                </div>
                                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100 border border-violet-200">
                                    <div className="text-2xl font-bold text-violet-700">
                                        {analytics?.openTickets || 0}
                                    </div>
                                    <p className="text-xs text-violet-600 mt-1">🆘 تذاكر مفتوحة</p>
                                </div>
                                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200">
                                    <div className="text-2xl font-bold text-pink-700">
                                        {analytics?.pendingPayments || 0}
                                    </div>
                                    <p className="text-xs text-pink-600 mt-1">💳 مدفوعات معلقة</p>
                                </div>
                                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 border border-cyan-200">
                                    <div className="text-2xl font-bold text-cyan-700">
                                        {(analytics?.avgRevenuePerSchool || 0).toLocaleString('ar-EG')}
                                    </div>
                                    <p className="text-xs text-cyan-600 mt-1">🎯 متوسط الإيراد/مدرسة</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ========================================= */}
                {/* SECTION 5: QUICK ACTIONS */}
                {/* ========================================= */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">⚡ اختصارات سريعة</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                            {quickActions.map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => navigate(action.path)}
                                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-background hover:bg-muted hover:shadow-md transition-all duration-200 group cursor-pointer"
                                >
                                    <div className={`${action.color} p-2.5 rounded-xl group-hover:scale-110 transition-transform`}>
                                        <action.icon className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="text-xs font-semibold text-foreground text-center leading-tight">
                                        {action.label}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground text-center leading-tight hidden sm:block">
                                        {action.desc}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* ========================================= */}
                {/* SECTION 6: ACTIVITY TABLE + KPIs */}
                {/* ========================================= */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Recent Activity Table */}
                    <Card className="lg:col-span-2 hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                    📋 آخر النشاطات
                                </CardTitle>
                                <Button variant="ghost" size="sm" onClick={() => navigate('/platform/audit')} className="text-xs">
                                    عرض الكل
                                    <ChevronLeft className="h-3 w-3 mr-1" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {activity.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground">العملية</th>
                                                <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground">الهدف</th>
                                                <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground">التاريخ</th>
                                                <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground">الحالة</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activity.map(item => (
                                                <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                    <td className="py-2.5 px-3 font-medium">{item.actionLabel}</td>
                                                    <td className="py-2.5 px-3 text-muted-foreground">{item.schoolName}</td>
                                                    <td className="py-2.5 px-3 text-muted-foreground text-xs">
                                                        <TimeAgo date={item.createdAt} />
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        <StatusBadge status={item.status} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-10 text-muted-foreground">
                                    <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">لا توجد نشاطات حديثة</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* KPI Performance Indicators */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                📌 مؤشرات الأداء الرئيسية
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Growth */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs text-muted-foreground">📈 معدل النمو الشهري</span>
                                    <span className={`text-sm font-bold ${analytics?.monthlyGrowthRate && analytics.monthlyGrowthRate > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                                        {analytics?.monthlyGrowthRate !== undefined ? `${analytics.monthlyGrowthRate > 0 ? '+' : ''}${analytics.monthlyGrowthRate}%` : '0%'}
                                    </span>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-emerald-600 transition-all duration-1000"
                                        style={{ width: `${Math.min((analytics?.monthlyGrowthRate || 0) * 3, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Revenue */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs text-muted-foreground">💰 متوسط الإيرادات</span>
                                    <span className="text-sm font-bold text-blue-600">
                                        {(analytics?.avgRevenuePerSchool || 0).toLocaleString('ar-EG')} ج.م
                                    </span>
                                </div>
                            </div>

                            {/* Satisfaction */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs text-muted-foreground">⭐ رضا العملاء</span>
                                    <span className="text-sm font-bold text-amber-600">
                                        {analytics?.customerSatisfaction ?? 0}/5
                                    </span>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-l from-amber-400 to-amber-600 transition-all duration-1000"
                                        style={{ width: `${((analytics?.customerSatisfaction || 0) / 5) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Retention */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs text-muted-foreground">🔄 معدل الاحتفاظ</span>
                                    <span className="text-sm font-bold text-violet-600">
                                        {analytics?.retentionRate ?? 0}%
                                    </span>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-l from-violet-400 to-violet-600 transition-all duration-1000"
                                        style={{ width: `${analytics?.retentionRate || 0}%` }}
                                    />
                                </div>
                            </div>

                            {/* Renewal */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs text-muted-foreground">🔄 معدل التجديد</span>
                                    <span className="text-sm font-bold text-teal-600">
                                        {analytics?.renewalRate || 0}%
                                    </span>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-l from-teal-400 to-teal-600 transition-all duration-1000"
                                        style={{ width: `${analytics?.renewalRate || 0}%` }}
                                    />
                                </div>
                            </div>

                            {/* Quick Stats Summary */}
                            <div className="mt-4 pt-4 border-t space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">🆘 طلبات الدعم المفتوحة</span>
                                    <Badge variant={analytics?.openTickets ? 'destructive' : 'secondary'}>
                                        {analytics?.openTickets || 0}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">💳 مدفوعات معلقة</span>
                                    <Badge variant={analytics?.pendingPayments ? 'outline' : 'secondary'}>
                                        {analytics?.pendingPayments || 0}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">📧 إشعارات غير مقروءة</span>
                                    <Badge variant="secondary">{alerts.length}</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ========================================= */}
                {/* SECTION 7: ORIGINAL QUICK NAVIGATION */}
                {/* ========================================= */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-border group"
                        onClick={() => navigate('/platform/schools')}>
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="bg-blue-50 p-3 rounded-xl group-hover:scale-110 transition-transform">
                                <Building2 className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-foreground font-semibold">إدارة المدارس</h3>
                                <p className="text-muted-foreground text-sm">إنشاء، تعديل، تفعيل/تعطيل</p>
                            </div>
                            <ChevronLeft className="h-4 w-4 text-muted-foreground mr-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-border group"
                        onClick={() => navigate('/platform/plans')}>
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="bg-emerald-50 p-3 rounded-xl group-hover:scale-110 transition-transform">
                                <Package className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-foreground font-semibold">إدارة الباقات</h3>
                                <p className="text-muted-foreground text-sm">خطط الاشتراك والتسعير</p>
                            </div>
                            <ChevronLeft className="h-4 w-4 text-muted-foreground mr-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-border group"
                        onClick={() => navigate('/platform/features')}>
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="bg-purple-50 p-3 rounded-xl group-hover:scale-110 transition-transform">
                                <Puzzle className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="text-foreground font-semibold">إدارة الخصائص</h3>
                                <p className="text-muted-foreground text-sm">وحدات النظام وتفعيلها</p>
                            </div>
                            <ChevronLeft className="h-4 w-4 text-muted-foreground mr-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
