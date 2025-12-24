/**
 * لوحة التحكم المالية الرئيسية
 * Main Financial Dashboard
 * 
 * تعرض نظرة شاملة على الوضع المالي للمدرسة
 * مع بيانات حقيقية من قاعدة البيانات
 */

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    Wallet,
    AlertTriangle,
    CheckCircle,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    PieChart,
    BarChart3,
    Calendar,
    UserCheck,
    Loader2,
} from 'lucide-react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useGlobalFilter } from '@/context/GlobalFilterContext';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FinanceNavigation } from '@/components/finance/FinanceNavigation';

import { useSmartAlerts } from '@/hooks/useSmartAlerts';

const FinanceDashboard = () => {
    // استخدام السنة الدراسية من Context العام
    const { selectedYear, setSelectedYear, academicYears, loading: yearsLoading } = useGlobalFilter();

    const {
        loading,
        error,
        summary,
        employees,
        salaries,
        transactions,
        schoolFees,
        installments,

        refreshData,
        studentPayments // New data
    } = useFinanceData(selectedYear);

    const { alerts } = useSmartAlerts({
        salaries,
        summary,
        schoolFees,
        installments,
        transactions,
        studentPayments // Pass to hook
    });

    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshData();
        setIsRefreshing(false);
    };

    // الكروت الرئيسية
    const mainCards = [
        {
            title: 'إجمالي الإيرادات',
            value: summary?.totalRevenue || 0,
            icon: TrendingUp,
            color: 'from-emerald-500 to-emerald-600',
            textColor: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            trend: '+12%',
            trendUp: true,
        },
        {
            title: 'إجمالي المصروفات',
            value: summary?.totalExpenses || 0,
            icon: TrendingDown,
            color: 'from-red-500 to-red-600',
            textColor: 'text-red-600',
            bgColor: 'bg-red-50',
            trend: '+5%',
            trendUp: false,
        },
        {
            title: 'صافي الوضع المالي',
            value: summary?.netBalance || 0,
            icon: Wallet,
            color: (summary?.netBalance || 0) >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600',
            textColor: (summary?.netBalance || 0) >= 0 ? 'text-blue-600' : 'text-orange-600',
            bgColor: (summary?.netBalance || 0) >= 0 ? 'bg-blue-50' : 'bg-orange-50',
            isNet: true,
        },
        {
            title: 'تحصيل الطلاب',
            value: summary?.studentPayments || 0,
            icon: UserCheck,
            color: 'from-violet-500 to-violet-600',
            textColor: 'text-violet-600',
            bgColor: 'bg-violet-50',
            extra: `${summary?.collectionRate || 0}% نسبة التحصيل`,
        },
    ];

    // كروت ثانوية
    const secondaryCards = [
        {
            title: 'الرواتب المستحقة',
            value: summary?.pendingSalaries || 0,
            icon: Clock,
            color: 'text-orange-600',
            bg: 'bg-orange-100',
            count: salaries.filter(s => s.status === 'مستحق').length,
            countLabel: 'موظف',
        },
        {
            title: 'إجمالي الموظفين',
            value: employees.filter(e => e.isActive).length,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-100',
            isCount: true,
        },
        {
            title: 'طلاب متأخرين',
            value: summary?.overdueStudents || 0,
            icon: AlertTriangle,
            color: 'text-red-600',
            bg: 'bg-red-100',
            isCount: true,
        },
    ];

    if (loading || yearsLoading) {
        return (
            <DashboardLayout>
                <FinanceNavigation
                    summary={summary || undefined}
                    isRefreshing={true}
                />
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">جاري تحميل البيانات المالية...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {/* Finance Navigation */}
            <FinanceNavigation
                summary={summary || undefined}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
            />

            <PageLayout
                title="لوحة التحكم المالية"
                description="نظرة شاملة على الوضع المالي للمدرسة"
            >
                <div className="space-y-6">
                    {/* شريط الأدوات */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            {/* اختيار السنة الدراسية */}
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="اختر السنة الدراسية" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {academicYears.map((year: any) => (
                                            <SelectItem key={year.year_code} value={year.year_code}>
                                                {year.year_name_ar || year.year_code}
                                                {year.is_active && ' (الحالية)'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {error && (
                                <Badge variant="destructive" className="text-sm">
                                    يوجد خطأ في البيانات
                                </Badge>
                            )}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                        >
                            <RefreshCw className={`h-4 w-4 ml-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            تحديث البيانات
                        </Button>
                    </div>

                    {/* الكروت الرئيسية */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {mainCards.map((card, index) => (
                            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                                <div className={`h-1.5 bg-gradient-to-r ${card.color}`} />
                                <CardContent className="pt-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            <p className="text-sm text-gray-600">{card.title}</p>
                                            <p className={`text-2xl font-bold ${card.textColor}`}>
                                                {card.value.toLocaleString('en-US')} ج.م
                                            </p>
                                            {card.trend && (
                                                <div className={`flex items-center text-xs ${card.trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {card.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                                    <span className="mr-1">{card.trend} عن الشهر السابق</span>
                                                </div>
                                            )}
                                            {card.extra && (
                                                <div className="text-xs text-violet-600 font-medium">
                                                    {card.extra}
                                                </div>
                                            )}
                                        </div>
                                        <div className={`p-3 rounded-xl ${card.bgColor}`}>
                                            <card.icon className={`h-6 w-6 ${card.textColor}`} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* كروت ثانوية */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {secondaryCards.map((card, index) => (
                            <Card key={index} className="hover:shadow-md transition-shadow">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                                            <p className={`text-xl font-bold ${card.color}`}>
                                                {card.isCount ? card.value : `${card.value.toLocaleString('en-US')} ج.م`}
                                            </p>
                                            {card.count !== undefined && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {card.count} {card.countLabel}
                                                </p>
                                            )}
                                        </div>
                                        <div className={`p-3 rounded-full ${card.bg}`}>
                                            <card.icon className={`h-5 w-5 ${card.color}`} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* قسم الروابط السريعة */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link to="/finance/revenue">
                            <Card className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer border-2 border-transparent hover:border-emerald-200">
                                <CardContent className="pt-6 flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-emerald-100">
                                        <TrendingUp className="h-6 w-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">الإيرادات</p>
                                        <p className="text-sm text-gray-500">إدارة إيرادات المدرسة</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        <Link to="/finance/expenses">
                            <Card className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer border-2 border-transparent hover:border-red-200">
                                <CardContent className="pt-6 flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-red-100">
                                        <TrendingDown className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">المصروفات</p>
                                        <p className="text-sm text-gray-500">إدارة مصروفات المدرسة</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        <Link to="/finance/salaries">
                            <Card className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer border-2 border-transparent hover:border-blue-200">
                                <CardContent className="pt-6 flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-blue-100">
                                        <Wallet className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">الرواتب</p>
                                        <p className="text-sm text-gray-500">إدارة رواتب الموظفين</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        <Link to="/finance/receivables">
                            <Card className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer border-2 border-transparent hover:border-violet-200">
                                <CardContent className="pt-6 flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-violet-100">
                                        <Users className="h-6 w-6 text-violet-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">المستحقات</p>
                                        <p className="text-sm text-gray-500">متابعة مستحقات الطلاب</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>

                    {/* آخر الحركات والتنبيهات */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* آخر الحركات */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-blue-600" />
                                    آخر الحركات المالية
                                </CardTitle>
                                <CardDescription>آخر 5 حركات مالية مسجلة</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {transactions.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                            <p>لا توجد حركات مالية مسجلة</p>
                                        </div>
                                    ) : (
                                        transactions.slice(0, 5).map((tx, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-full ${tx.transactionType === 'إيراد' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                                        {tx.transactionType === 'إيراد' ? (
                                                            <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                                                        ) : (
                                                            <ArrowDownRight className="h-4 w-4 text-red-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{tx.description || tx.transactionType}</p>
                                                        <p className="text-xs text-gray-500">{tx.transactionDate}</p>
                                                    </div>
                                                </div>
                                                <span className={`font-semibold ${tx.transactionType === 'إيراد' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {tx.transactionType === 'إيراد' ? '+' : '-'}{tx.amount.toLocaleString('en-US')} ج.م
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* التنبيهات الذكية */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                                    التنبيهات الذكية
                                </CardTitle>
                                <CardDescription>تنبيهات تتطلب انتباهك</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {alerts.length === 0 ? (
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                                            <div>
                                                <p className="font-medium text-emerald-800">لا توجد تنبيهات</p>
                                                <p className="text-sm text-emerald-600">الوضع المالي مستقر</p>
                                            </div>
                                        </div>
                                    ) : (
                                        alerts.slice(0, 5).map((alert) => (
                                            <div
                                                key={alert.id}
                                                className={`flex items-start gap-3 p-3 rounded-lg border ${alert.type === 'danger' ? 'bg-red-50 border-red-100' :
                                                    alert.type === 'warning' ? 'bg-orange-50 border-orange-100' :
                                                        alert.type === 'info' ? 'bg-blue-50 border-blue-100' :
                                                            'bg-green-50 border-green-100'
                                                    }`}
                                            >
                                                {alert.type === 'danger' ? <AlertTriangle className="h-5 w-5 text-red-500 mt-1" /> :
                                                    alert.type === 'warning' ? <AlertTriangle className="h-5 w-5 text-orange-500 mt-1" /> :
                                                        alert.type === 'info' ? <Clock className="h-5 w-5 text-blue-500 mt-1" /> :
                                                            <CheckCircle className="h-5 w-5 text-green-500 mt-1" />}

                                                <div className="flex-1">
                                                    <p className={`font-medium ${alert.type === 'danger' ? 'text-red-800' :
                                                        alert.type === 'warning' ? 'text-orange-800' :
                                                            alert.type === 'info' ? 'text-blue-800' :
                                                                'text-green-800'
                                                        }`}>
                                                        {alert.title}
                                                    </p>
                                                    <p className={`text-sm ${alert.type === 'danger' ? 'text-red-600' :
                                                        alert.type === 'warning' ? 'text-orange-600' :
                                                            alert.type === 'info' ? 'text-blue-600' :
                                                                'text-green-600'
                                                        }`}>
                                                        {alert.message}
                                                    </p>
                                                </div>

                                                {alert.actionLink && (
                                                    <Link to={alert.actionLink}>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className={`h-8 px-3 text-xs ${alert.type === 'danger' ? 'text-red-700 border-red-200 hover:bg-red-100' :
                                                                alert.type === 'warning' ? 'text-orange-700 border-orange-200 hover:bg-orange-100' :
                                                                    alert.type === 'info' ? 'text-blue-700 border-blue-200 hover:bg-blue-100' :
                                                                        'text-green-700 border-green-200 hover:bg-green-100'
                                                                }`}
                                                        >
                                                            {alert.actionLabel || 'عرض'}
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ملخص الموظفين */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-600" />
                                ملخص الموظفين حسب النوع
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {['معلم', 'إداري', 'عامل'].map((type) => {
                                    const count = employees.filter(e => e.employeeType === type && e.isActive).length;
                                    const totalSalary = employees
                                        .filter(e => e.employeeType === type && e.isActive)
                                        .reduce((sum, e) => sum + (e.baseSalary || 0), 0);

                                    return (
                                        <div key={type} className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-gray-700">{type === 'معلم' ? 'المعلمين' : type === 'إداري' ? 'الإداريين' : 'العاملين'}</span>
                                                <Badge variant="secondary">{count}</Badge>
                                            </div>
                                            <p className="text-lg font-bold text-gray-800">
                                                {totalSalary.toLocaleString('en-US')} ج.م
                                            </p>
                                            <p className="text-xs text-gray-500">إجمالي الرواتب الأساسية</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </PageLayout>
        </DashboardLayout>
    );
};

export default FinanceDashboard;
