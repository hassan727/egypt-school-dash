import { Home, Users, DollarSign, GraduationCap, ChevronDown } from "lucide-react";
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

const menuItems = [
  {
    title: "الرئيسية",
    icon: Home,
    url: "/",
  },
  {
    title: "إدارة الطلاب",
    icon: GraduationCap,
    items: [
        { title: "قائمة الطلاب", url: "/students/list" },
        { title: "تسجيل طالب جديد", url: "/students/create" },
        { title: "الحضور والغياب", url: "/students/attendance" },
        { title: "الشهادات", url: "/students/certificates" },
      ],
  },
  {
    title: "الإدارة المالية",
    icon: DollarSign,
    items: [
      { title: "الإيرادات", url: "/finance/revenue" },
      { title: "المصروفات", url: "/finance/expenses" },
      { title: "الرواتب", url: "/finance/salaries" },
      { title: "المستحقات", url: "/finance/receivables" },
    ],
  },
  {
    title: "إدارة المعلمين",
    icon: Users,
    items: [
      { title: "قائمة المعلمين", url: "/teachers" },
      { title: "تعيين معلم جديد", url: "/teachers/new" },
      { title: "الحضور والغياب", url: "/teachers/attendance" },
      { title: "التقييمات", url: "/teachers/evaluation" },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const [openItems, setOpenItems] = useState<string[]>(["إدارة الطلاب"]);

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
              {menuItems.map((item) => {
                const isOpen = openItems.includes(item.title);
                const hasSubmenu = item.items && item.items.length > 0;

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