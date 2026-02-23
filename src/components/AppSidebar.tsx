import { Home, Users, DollarSign, GraduationCap, ChevronDown, Settings, Briefcase, UserCog, AlertCircle, Calendar, Shield, Crown } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

import { useSchoolFeatures } from "@/context/SystemContext";
import { useAuth } from "@/context/AuthContext";

export function AppSidebar() {
  const { state } = useSidebar();
  const [openItems, setOpenItems] = useState<string[]>(["إدارة الطلاب"]);
  const features = useSchoolFeatures();
  const { user } = useAuth();
  const isPlatformOwner = user?.role === 'admin';

  const menuItems = [
    {
      title: "الرئيسية",
      icon: Home,
      url: "/",
      visible: true,
      locked: false
    },
    {
      title: "إدارة الطلاب",
      icon: GraduationCap,
      visible: true,
      locked: !features.students,
      items: [
        { title: "قائمة الطلاب", url: "/students/list" },
        { title: "تسجيل طالب جديد", url: "/students/create" },
        { title: "العمليات الجماعية", url: "/students/batch/operations" },
        { title: "الحضور والغياب", url: "/students/batch/attendance" },
        { title: "الشهادات", url: "/students/certificates" },
      ],
    },
    {
      title: "الكنترول المدرسي",
      icon: Calendar,
      visible: true,
      locked: false,
      items: [
        { title: "رصد الدرجات", url: "/school-control" },
      ],
    },
    {
      title: "الإدارة المالية",
      icon: DollarSign,
      visible: true,
      locked: !features.finance,
      items: [
        { title: "لوحة التحكم المالية", url: "/finance/dashboard" },
        { title: "الإيرادات", url: "/finance/revenue" },
        { title: "المصروفات", url: "/finance/expenses" },
        { title: "الرواتب والموظفين", url: "/finance/salaries" },
        { title: "متابعة المستحقات", url: "/finance/receivables" },
      ],
    },
    {
      title: "الموارد البشرية",
      icon: Briefcase,
      visible: true,
      locked: !features.hr,
      items: [
        { title: "📋 قائمة الموظفين", url: "/hr/employees" },
        { title: "➕ تسجيل موظف جديد", url: "/hr/employees/new" },
        { title: "📁 المنتهية خدمتهم", url: "/hr/employees/terminated" },
        { title: "⏰ سجل البصمة", url: "/hr/attendance" },
        { title: "🔄 ضبط الورديات", url: "/hr/attendance/shifts" },
        { title: "⚙️ إعدادات الحضور", url: "/hr/attendance/settings" },
        { title: "📊 تقارير الحضور", url: "/hr/attendance/reports" },
        { title: "🏖️ إدارة الإجازات", url: "/hr/leaves" },
        { title: "✅ الموافقات", url: "/hr/leaves/approvals" },
        { title: "💰 رواتب HR", url: "/hr/payroll" },
        { title: "📤 إرسال للمالية", url: "/hr/payroll/export" },
        { title: "📄 العقود", url: "/hr/contracts" },
        { title: "⭐ تقييم الأداء", url: "/hr/performance" },
        { title: "📚 التدريب", url: "/hr/training" },
        { title: "⚠️ المخالفات والإنذارات", url: "/hr/violations" },
        { title: "🚪 نهاية الخدمة", url: "/hr/offboarding" },
        { title: "📈 تقارير HR", url: "/hr/reports" },
        { title: "⚙️ إعدادات HR", url: "/hr/settings" },
      ],
    },
    {
      title: "إعدادات الطلاب",
      icon: UserCog,
      visible: true,
      locked: !features.students,
      items: [
        { title: "📋 بيانات الطلاب", url: "/students/settings/data" },
        { title: "🔐 حسابات الطلاب", url: "/students/settings/accounts" },
        { title: "📥 استيراد Excel", url: "/students/settings/import" },
      ],
    },
    {
      title: "مراقبة النظام",
      icon: AlertCircle,
      visible: isPlatformOwner,
      locked: false,
      items: [
        { title: "🔴 مراقبة الأخطاء", url: "/admin/error-monitoring" },
      ],
    },
    {
      title: "إدارة المنصة",
      icon: Shield,
      visible: isPlatformOwner,
      locked: false,
      items: [
        { title: "📊 لوحة التحكم", url: "/platform" },
        { title: "🏫 إدارة المدارس", url: "/platform/schools" },
        { title: "📦 إدارة الباقات", url: "/platform/plans" },
        { title: "🧩 إدارة الخصائص", url: "/platform/features" },
        { title: "📡 مراقبة النظام", url: "/platform/monitoring" },
        { title: "📋 سجل العمليات", url: "/platform/audit" },
      ],
    },
    {
      title: "إعدادات النظام",
      icon: Settings,
      visible: true,
      locked: false,
      items: [
        { title: "👥 إدارة المستخدمين", url: "/settings/users" },
        { title: "🏫 إدارة المدارس", url: "/settings/schools" },
        { title: "📚 المراحل والفصول", url: "/settings/stages-classes" },
        { title: "🔐 تسجيل الدخول", url: "/login" },
      ],
    },
  ];

  const toggleItem = (title: string) => {
    setOpenItems((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    );
  };

  return (
    <Sidebar collapsible="icon" side="right" className="border-l-0 border-r border-sidebar-border">
      <SidebarContent className="gap-0">
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold px-4 py-6 text-sidebar-foreground">
            {state === "collapsed" ? "إ" : "إدارة المدرسة"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.filter(item => item.visible !== false).map((item) => {
                const isOpen = openItems.includes(item.title);
                const hasSubmenu = item.items && item.items.length > 0;

                if (item.locked) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton tooltip={`${item.title} (ميزة إضافية)`} asChild className="text-muted-foreground hover:text-amber-600 hover:bg-amber-50">
                        <a href="/upgrade" className="flex items-center gap-3 px-3 py-2 w-full justify-between">
                          <div className="flex items-center gap-3">
                            <item.icon className="h-5 w-5 opacity-70" />
                            <span className="font-medium">{item.title}</span>
                          </div>
                          {state !== "collapsed" && <Crown className="h-4 w-4 text-amber-500 shrink-0" />}
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                if (!hasSubmenu) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton tooltip={item.title} asChild>
                        <a href={item.url} className="flex items-center gap-3 px-3 py-2">
                          <item.icon className="h-5 w-5" />
                          <span className="font-medium">{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <Collapsible
                    key={item.title}
                    open={isOpen}
                    onOpenChange={() => toggleItem(item.title)}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title} className="w-full">
                          <div className="flex items-center gap-3 flex-1">
                            <item.icon className="h-5 w-5" />
                            <span className="font-medium">{item.title}</span>
                          </div>
                          {state !== "collapsed" && (
                            <ChevronDown
                              className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                                }`}
                            />
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {state !== "collapsed" && (
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items?.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild>
                                  <a href={subItem.url} className="pr-8">
                                    <span>{subItem.title}</span>
                                  </a>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      )}
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}