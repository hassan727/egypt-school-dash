import { DashboardCard } from "@/components/DashboardCard";
import { CircularChart } from "@/components/CircularChart";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useGlobalFilter } from "@/context/GlobalFilterContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  School,
  UserCheck,
  UserX,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Banknote,
  Gift,
  Minus,
  CircleDollarSign,
  History,
  PieChart,
  BarChart3,
  Target,
  BookOpen,
  Loader2,
  Calendar,
  Percent,
  Clock,
} from "lucide-react";

interface DashboardStats {
  totalStudents: number;
  totalClasses: number;
  totalTeachers: number;
  absentTeachersToday: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingPayments: number;
  totalStudentDiscounts: number; // إجمالي خصومات الطلاب
  totalBaseSalaries: number;
  totalBonuses: number;
  totalDeductions: number;
  netPayroll: number;
  studentsByStage: { name: string; value: number; color: string }[];
}

const Index = () => {
  const navigate = useNavigate();
  const { selectedYear, setSelectedYear, academicYears, loading: yearsLoading } = useGlobalFilter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalClasses: 0,
    totalTeachers: 0,
    absentTeachersToday: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    pendingPayments: 0,
    totalStudentDiscounts: 0,
    totalBaseSalaries: 0,
    totalBonuses: 0,
    totalDeductions: 0,
    netPayroll: 0,
    studentsByStage: [],
  });

  // جلب البيانات الحقيقية من قاعدة البيانات مع فلترة حسب السنة الدراسية
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);

        const currentYear = selectedYear || '';

        // 1. إجمالي عدد الطلاب للسنة المحددة
        let studentsQuery = supabase
          .from('students')
          .select('*', { count: 'exact', head: true });
        if (currentYear) {
          studentsQuery = studentsQuery.eq('academic_year', currentYear);
        }
        const { count: totalStudents } = await studentsQuery;

        // 2. إجمالي عدد الفصول
        const { count: totalClasses } = await supabase
          .from('classes')
          .select('*', { count: 'exact', head: true });

        // 3. إجمالي عدد المعلمين (من جدول employees)
        const { count: totalTeachers } = await supabase
          .from('employees')
          .select('*', { count: 'exact', head: true })
          .eq('employee_type', 'معلم');

        // 4. عدد المعلمين الغائبين اليوم
        const absentTeachersToday = 0;

        // 5. البيانات المالية - الإيرادات من general_transactions
        let revenueQuery = supabase
          .from('general_transactions')
          .select('amount')
          .eq('transaction_type', 'إيراد');
        if (currentYear) {
          revenueQuery = revenueQuery.eq('academic_year_code', currentYear);
        }
        const { data: revenueData } = await revenueQuery;
        const totalRevenue = revenueData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

        // 6. البيانات المالية - المصروفات من general_transactions
        let expenseQuery = supabase
          .from('general_transactions')
          .select('amount')
          .eq('transaction_type', 'مصروف');
        if (currentYear) {
          expenseQuery = expenseQuery.eq('academic_year_code', currentYear);
        }
        const { data: expenseData } = await expenseQuery;
        const totalExpenses = expenseData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

        // 7. مدفوعات الطلاب من financial_transactions
        let paymentsQuery = supabase
          .from('financial_transactions')
          .select('amount')
          .eq('transaction_type', 'دفعة');
        if (currentYear) {
          paymentsQuery = paymentsQuery.eq('academic_year_code', currentYear);
        }
        const { data: studentPayments } = await paymentsQuery;
        const totalStudentPayments = studentPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        // 7.1 خصومات الطلاب من financial_transactions (نوع 'خصم')
        let discountsQuery = supabase
          .from('financial_transactions')
          .select('amount')
          .eq('transaction_type', 'خصم');
        if (currentYear) {
          discountsQuery = discountsQuery.eq('academic_year_code', currentYear);
        }
        const { data: discountsData } = await discountsQuery;
        const totalStudentDiscounts = discountsData?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;

        // 8. المستحقات المتبقية (مع احتساب الخصومات)
        let feesQuery = supabase
          .from('school_fees')
          .select('total_amount, advance_payment');
        if (currentYear) {
          feesQuery = feesQuery.eq('academic_year_code', currentYear);
        }
        const { data: feesData } = await feesQuery;
        const totalFeesExpected = feesData?.reduce((sum, f) => sum + (f.total_amount || 0), 0) || 0;
        const totalAdvancePayments = feesData?.reduce((sum, f) => sum + (f.advance_payment || 0), 0) || 0;
        // المستحق = الرسوم - المدفوعات - المقدمات - الخصومات
        const pendingPayments = totalFeesExpected - totalStudentPayments - totalAdvancePayments - totalStudentDiscounts;

        // 9. بيانات الرواتب من جدول salaries
        let salariesQuery = supabase
          .from('salaries')
          .select('base_salary, total_allowances, total_deductions, net_salary');
        if (currentYear) {
          salariesQuery = salariesQuery.eq('academic_year_code', currentYear);
        }
        const { data: salariesData } = await salariesQuery;
        const totalBaseSalaries = salariesData?.reduce((sum, s) => sum + (s.base_salary || 0), 0) || 0;
        const totalBonuses = salariesData?.reduce((sum, s) => sum + (s.total_allowances || 0), 0) || 0;
        const totalDeductions = salariesData?.reduce((sum, s) => sum + (s.total_deductions || 0), 0) || 0;
        const netPayroll = salariesData?.reduce((sum, s) => sum + (s.net_salary || 0), 0) || 0;

        // 10. توزيع الطلاب حسب المراحل
        let stagesQuery = supabase
          .from('students')
          .select('stage');
        if (currentYear) {
          stagesQuery = stagesQuery.eq('academic_year', currentYear);
        }
        const { data: studentsWithStages } = await stagesQuery;

        const stageColors: Record<string, string> = {
          'رياض الأطفال': '#F59E0B',
          'الإبتدائية': '#3B82F6',
          'الإعدادية': '#8B5CF6',
          'الثانوية': '#10B981',
        };

        const stageCounts: Record<string, number> = {};
        studentsWithStages?.forEach(s => {
          const stage = s.stage || 'غير محدد';
          stageCounts[stage] = (stageCounts[stage] || 0) + 1;
        });

        const studentsByStage = Object.entries(stageCounts).map(([name, value]) => ({
          name,
          value,
          color: stageColors[name] || '#6B7280',
        }));

        // تحديث الإحصائيات
        setStats({
          totalStudents: totalStudents || 0,
          totalClasses: totalClasses || 0,
          totalTeachers: totalTeachers || 0,
          absentTeachersToday: absentTeachersToday || 0,
          totalRevenue: totalRevenue + totalStudentPayments + totalAdvancePayments,
          totalExpenses,
          netProfit: (totalRevenue + totalStudentPayments + totalAdvancePayments) - totalExpenses,
          pendingPayments: Math.max(0, pendingPayments),
          totalStudentDiscounts,
          totalBaseSalaries,
          totalBonuses,
          totalDeductions,
          netPayroll,
          studentsByStage,
        });

      } catch (error) {
        console.error('خطأ في جلب إحصائيات لوحة التحكم:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [selectedYear]);

  // تنسيق الأرقام - استخدام الأرقام الإنجليزية
  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };

  // Chart data for different sections
  const revenueChartData = [
    { name: "الرسوم الدراسية", value: stats.totalRevenue * 0.53, color: "#3B82F6" },
    { name: "الرسوم الإضافية", value: stats.totalRevenue * 0.21, color: "#8B5CF6" },
    { name: "الأنشطة", value: stats.totalRevenue * 0.14, color: "#10B981" },
    { name: "الكتب والزي", value: stats.totalRevenue * 0.12, color: "#F59E0B" },
  ];

  const expensesChartData = [
    { name: "الرواتب", value: stats.totalBaseSalaries, color: "#EF4444" },
    { name: "الصيانة", value: stats.totalExpenses * 0.15, color: "#F97316" },
    { name: "الكتب والمواد", value: stats.totalExpenses * 0.12, color: "#06B6D4" },
    { name: "المرافق", value: stats.totalExpenses * 0.09, color: "#84CC16" },
    { name: "أخرى", value: stats.totalExpenses * 0.1, color: "#EC4899" },
  ];

  const studentsChartData = stats.studentsByStage.length > 0
    ? stats.studentsByStage
    : [
      { name: "لا توجد بيانات", value: 1, color: "#6B7280" },
    ];

  const performanceChartData = [
    { name: "ممتاز", value: 25, color: "#10B981" },
    { name: "جيد جداً", value: 35, color: "#3B82F6" },
    { name: "جيد", value: 25, color: "#F59E0B" },
    { name: "مقبول", value: 10, color: "#F97316" },
    { name: "ضعيف", value: 5, color: "#EF4444" },
  ];

  const dashboardData = useMemo(() => [
    {
      title: "اجمالي عدد الطلاب",
      value: loading ? "..." : formatNumber(stats.totalStudents),
      description: "طالب وطالبة",
      icon: Users,
      gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
      route: "/students",
      accountingLogic: "عدد جميع الطلاب المسجلين في النظام",
    },
    {
      title: "اجمالي الفصول",
      value: loading ? "..." : formatNumber(stats.totalClasses),
      description: "فصل دراسي",
      icon: School,
      gradient: "bg-gradient-to-br from-purple-500 to-purple-600",
      route: "/settings/stages-classes",
      accountingLogic: "عدد الفصول الدراسية المسجلة بجميع المراحل",
    },
    {
      title: "عدد المعلمين",
      value: loading ? "..." : formatNumber(stats.totalTeachers),
      description: "معلم ومعلمة",
      icon: UserCheck,
      gradient: "bg-gradient-to-br from-green-500 to-green-600",
      route: "/teachers",
      accountingLogic: "عدد الموظفين من نوع 'معلم' في النظام",
    },
    {
      title: "عدد غياب المعلمين",
      value: loading ? "..." : formatNumber(stats.absentTeachersToday),
      description: "اليوم",
      icon: UserX,
      gradient: "bg-gradient-to-br from-orange-500 to-orange-600",
      route: "/teachers/attendance",
      accountingLogic: "عدد المعلمين الغائبين في اليوم الحالي",
    },
    {
      title: "إجمالي إيرادات المدرسة",
      value: loading ? "..." : formatNumber(stats.totalRevenue),
      description: "جنيه مصري",
      icon: TrendingUp,
      gradient: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      route: "/finance/revenue",
      accountingLogic: "إيرادات عامة + مدفوعات الطلاب + المقدمات",
    },
    {
      title: "إجمالي مصروفات المدرسة",
      value: loading ? "..." : formatNumber(stats.totalExpenses),
      description: "جنيه مصري",
      icon: TrendingDown,
      gradient: "bg-gradient-to-br from-red-500 to-red-600",
      route: "/finance/expenses",
      accountingLogic: "مجموع جميع المصروفات العامة المسجلة",
    },
    {
      title: "صافي أرباح المدرسة",
      value: loading ? "..." : formatNumber(stats.netProfit),
      description: "جنيه مصري",
      icon: Wallet,
      gradient: "bg-gradient-to-br from-teal-500 to-teal-600",
      route: "/finance",
      accountingLogic: "إجمالي الإيرادات − إجمالي المصروفات",
    },
    {
      title: "المبالغ المستحقة للتحصيل",
      value: loading ? "..." : formatNumber(stats.pendingPayments),
      description: "جنيه مصري",
      icon: CreditCard,
      gradient: "bg-gradient-to-br from-amber-500 to-amber-600",
      route: "/finance",
      accountingLogic: "إجمالي الرسوم − المدفوع − المقدمات − الخصومات",
    },
    {
      title: "إجمالي خصومات الطلاب",
      value: loading ? "..." : formatNumber(stats.totalStudentDiscounts),
      description: "جنيه مصري",
      icon: Percent,
      gradient: "bg-gradient-to-br from-purple-500 to-purple-600",
      route: "/finance",
      accountingLogic: "مجموع الخصومات الممنوحة للطلاب",
    },
    {
      title: "إجمالي الرواتب الأساسية",
      value: loading ? "..." : formatNumber(stats.totalBaseSalaries),
      description: "جنيه مصري",
      icon: Banknote,
      gradient: "bg-gradient-to-br from-indigo-500 to-indigo-600",
      route: "/finance/salaries",
      accountingLogic: "مجموع الرواتب الأساسية لجميع الموظفين",
    },
    {
      title: "إجمالي مكافآت الموظفين",
      value: loading ? "..." : formatNumber(stats.totalBonuses),
      description: "جنيه مصري",
      icon: Gift,
      gradient: "bg-gradient-to-br from-pink-500 to-pink-600",
      route: "/finance/salaries",
      accountingLogic: "مجموع البدلات والمكافآت لجميع الموظفين",
    },
    {
      title: "إجمالي خصومات الموظفين",
      value: loading ? "..." : formatNumber(stats.totalDeductions),
      description: "جنيه مصري",
      icon: Minus,
      gradient: "bg-gradient-to-br from-rose-500 to-rose-600",
      route: "/finance/salaries",
      accountingLogic: "مجموع الخصومات والاستقطاعات من الرواتب",
    },
    {
      title: "صافي مستحقات الموظفين",
      value: loading ? "..." : formatNumber(stats.netPayroll),
      description: "جنيه مصري",
      icon: CircleDollarSign,
      gradient: "bg-gradient-to-br from-cyan-500 to-cyan-600",
      route: "/finance/salaries",
      accountingLogic: "الراتب الأساسي + المكافآت − الخصومات",
    },
    {
      title: "نظام تتبع التاريخ",
      value: "متوفر الآن",
      description: "تتبع جميع تعديلات الطلاب",
      icon: History,
      gradient: "bg-gradient-to-br from-violet-500 to-violet-600",
      route: "/students",
    },
    {
      title: "سجل بصمة الموظفين",
      value: "تتبع الآن",
      description: "نظام الحضور الذكي",
      icon: Clock,
      gradient: "bg-gradient-to-br from-blue-700 to-indigo-800",
      route: "/hr/attendance",
      accountingLogic: "النظام الشامل لمتابعة حضور وانصراف جميع الموظفين (HR)",
    },
  ], [loading, stats]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">لوحة التحكم</h2>
            <p className="text-muted-foreground">نظرة عامة على أداء المدرسة</p>
          </div>

          {/* اختيار السنة الدراسية */}
          <div className="flex items-center gap-3 bg-card border border-border rounded-lg p-3 shadow-sm">
            <Calendar className="h-5 w-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium">السنة الدراسية</span>
              <Select
                value={selectedYear || ''}
                onValueChange={setSelectedYear}
                disabled={yearsLoading}
              >
                <SelectTrigger className="w-[180px] border-0 p-0 h-auto text-base font-semibold focus:ring-0">
                  <SelectValue placeholder={yearsLoading ? "جاري التحميل..." : "اختر السنة"} />
                </SelectTrigger>
                <SelectContent>
                  {academicYears
                    .sort((a: any, b: any) => a.year_code.localeCompare(b.year_code))
                    .map((year: any) => (
                      <SelectItem key={year.year_code} value={year.year_code}>
                        {year.year_code}
                        {year.is_active && ' (الحالية)'}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Dashboard Cards Section */}
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-green-600" />
            نظرة عامة سريعة
            {selectedYear && (
              <span className="text-sm font-normal text-muted-foreground mr-2">
                ({selectedYear})
              </span>
            )}
          </h3>
          <p className="text-muted-foreground">مؤشرات الأداء الرئيسية</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {dashboardData.map((item, index) => (
            <DashboardCard
              key={index}
              title={item.title}
              value={item.value}
              description={item.description}
              icon={item.icon}
              gradient={item.gradient}
              onClick={() => navigate(item.route)}
              accountingLogic={item.accountingLogic}
            />
          ))}
        </div>

        {/* Data Analysis Section with Charts */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <PieChart className="h-6 w-6 text-blue-600" />
              تحليل البيانات
            </h3>
            <p className="text-muted-foreground">تحليل بصري لبيانات المدرسة</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
            <CircularChart
              title="توزيع الإيرادات"
              data={revenueChartData}
              icon={BarChart3}
              gradient="bg-gradient-to-br from-blue-500 to-blue-600"
              total="850,000 جنيه"
              description="توزيع مصادر الدخل السنوي"
            />

            <CircularChart
              title="توزيع المصروفات"
              data={expensesChartData}
              icon={Wallet}
              gradient="bg-gradient-to-br from-red-500 to-red-600"
              total="520,000 جنيه"
              description="توزيع بنود المصروفات السنوية"
            />

            <CircularChart
              title="توزيع الطلاب"
              data={studentsChartData}
              icon={Users}
              gradient="bg-gradient-to-br from-green-500 to-green-600"
              total="850 طالب"
              description="توزيع الطلاب حسب المراحل الدراسية"
            />

            <CircularChart
              title="الأداء الأكاديمي"
              data={performanceChartData}
              icon={Target}
              gradient="bg-gradient-to-br from-purple-500 to-purple-600"
              total="100%"
              description="توزيع درجات الطلاب الأكاديمية"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;