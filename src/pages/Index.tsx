import { DashboardCard } from "@/components/DashboardCard";
import { CircularChart } from "@/components/CircularChart";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  
  // Check if environment variables are loaded
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('Supabase URL from env:', supabaseUrl);
  console.log('Supabase Anon Key from env:', supabaseAnonKey ? '[KEY HIDDEN]' : 'undefined');
  
  // Chart data for different sections
  const revenueChartData = [
    { name: "الرسوم الدراسية", value: 450000, color: "#3B82F6" },
    { name: "الرسوم الإضافية", value: 180000, color: "#8B5CF6" },
    { name: "الأنشطة", value: 120000, color: "#10B981" },
    { name: "الكتب والزي", value: 100000, color: "#F59E0B" },
  ];

  const expensesChartData = [
    { name: "الرواتب", value: 280000, color: "#EF4444" },
    { name: "الصيانة", value: 80000, color: "#F97316" },
    { name: "الكتب والمواد", value: 60000, color: "#06B6D4" },
    { name: "المرافق", value: 45000, color: "#84CC16" },
    { name: "أخرى", value: 55000, color: "#EC4899" },
  ];

  const studentsChartData = [
    { name: "المرحلة الإبتدائية", value: 320, color: "#3B82F6" },
    { name: "المرحلة الإعدادية", value: 280, color: "#8B5CF6" },
    { name: "المرحلة الثانوية", value: 250, color: "#10B981" },
  ];

  const performanceChartData = [
    { name: "ممتاز", value: 25, color: "#10B981" },
    { name: "جيد جداً", value: 35, color: "#3B82F6" },
    { name: "جيد", value: 25, color: "#F59E0B" },
    { name: "مقبول", value: 10, color: "#F97316" },
    { name: "ضعيف", value: 5, color: "#EF4444" },
  ];
  
  const dashboardData = [
    {
      title: "اجمالي عدد الطلاب",
      value: "850",
      description: "طالب وطالبة",
      icon: Users,
      gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
      trend: <span className="text-success flex items-center gap-1 font-semibold"><TrendingUp className="h-4 w-4" /> 12%</span>,
      route: "/students",
    },
    {
      title: "اجمالي الفصول",
      value: "24",
      description: "فصل دراسي",
      icon: School,
      gradient: "bg-gradient-to-br from-purple-500 to-purple-600",
      route: "/classes",
    },
    {
      title: "عدد المعلمين",
      value: "45",
      description: "معلم ومعلمة",
      icon: UserCheck,
      gradient: "bg-gradient-to-br from-green-500 to-green-600",
      route: "/teachers",
    },
    {
      title: "عدد غياب المعلمين",
      value: "3",
      description: "اليوم",
      icon: UserX,
      gradient: "bg-gradient-to-br from-orange-500 to-orange-600",
      route: "/teachers/attendance",
    },
    {
      title: "إجمالي إيرادات المدرسة",
      value: "850,000",
      description: "جنيه مصري",
      icon: TrendingUp,
      gradient: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      trend: <span className="text-success flex items-center gap-1 font-semibold"><TrendingUp className="h-4 w-4" /> 8%</span>,
      route: "/finance/revenue",
    },
    {
      title: "إجمالي مصروفات المدرسة",
      value: "520,000",
      description: "جنيه مصري",
      icon: TrendingDown,
      gradient: "bg-gradient-to-br from-red-500 to-red-600",
      route: "/finance/expenses",
    },
    {
      title: "صافي أرباح المدرسة",
      value: "330,000",
      description: "جنيه مصري",
      icon: Wallet,
      gradient: "bg-gradient-to-br from-teal-500 to-teal-600",
      trend: <span className="text-success flex items-center gap-1 font-semibold"><TrendingUp className="h-4 w-4" /> 15%</span>,
      route: "/finance/profits",
    },
    {
      title: "المبالغ المستحقة للتحصيل",
      value: "125,000",
      description: "جنيه مصري",
      icon: CreditCard,
      gradient: "bg-gradient-to-br from-amber-500 to-amber-600",
      route: "/finance/receivables",
    },
    {
      title: "إجمالي الرواتب الأساسية",
      value: "280,000",
      description: "جنيه مصري",
      icon: Banknote,
      gradient: "bg-gradient-to-br from-indigo-500 to-indigo-600",
      route: "/finance/base-salaries",
    },
    {
      title: "إجمالي مكافآت الموظفين",
      value: "45,000",
      description: "جنيه مصري",
      icon: Gift,
      gradient: "bg-gradient-to-br from-pink-500 to-pink-600",
      route: "/finance/bonuses",
    },
    {
      title: "إجمالي خصومات الموظفين",
      value: "12,500",
      description: "جنيه مصري",
      icon: Minus,
      gradient: "bg-gradient-to-br from-rose-500 to-rose-600",
      route: "/finance/deductions",
    },
    {
      title: "صافي مستحقات الموظفين",
      value: "312,500",
      description: "جنيه مصري",
      icon: CircleDollarSign,
      gradient: "bg-gradient-to-br from-cyan-500 to-cyan-600",
      route: "/finance/net-payroll",
    },
    {
      title: "نظام تتبع التاريخ",
      value: "متوفر الآن",
      description: "تتبع جميع تعديلات الطلاب",
      icon: History,
      gradient: "bg-gradient-to-br from-violet-500 to-violet-600",
      route: "/students",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-foreground">لوحة التحكم</h2>
          <p className="text-muted-foreground">نظرة عامة على أداء المدرسة</p>
        </div>
        
        {/* Dashboard Cards Section */}
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-green-600" />
            نظرة عامة سريعة
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
              trend={item.trend}
              onClick={() => navigate(item.route)}
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