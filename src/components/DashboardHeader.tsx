import { SidebarTrigger } from "@/components/ui/sidebar";
import { GlobalSearchFilter } from "@/components/GlobalSearchFilter";
import { School } from "lucide-react";

export const DashboardHeader = () => {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex flex-col h-auto py-4 gap-4 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-mr-2" />
            <div className="flex items-center gap-2">
              <School className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">مدرسة جاد الله</h1>
            </div>
          </div>
        </div>

        <div className="w-full">
          <GlobalSearchFilter />
        </div>
      </div>
    </header>
  );
};
