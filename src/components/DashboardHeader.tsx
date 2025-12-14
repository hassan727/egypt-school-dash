import { SidebarTrigger } from "@/components/ui/sidebar";
import { GlobalSearchFilter } from "@/components/GlobalSearchFilter";
import { School, Search, X, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const DashboardHeader = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex flex-col gap-4 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-mr-2" />
            <div className="flex items-center gap-2">
              <School className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground hidden sm:block">مدرسة جاد الله</h1>
            </div>
          </div>

          {/* Mobile Search Toggle - Visible on mobile/tablet, hidden on large screens */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            {isSearchOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Search Section - Collapsible on mobile, always visible on large screens */}
        <div className={cn(
          "w-full transition-all duration-300 ease-in-out overflow-hidden lg:block lg:max-h-none lg:opacity-100",
          isSearchOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 lg:max-h-none lg:opacity-100 hidden lg:block"
        )}>
          <GlobalSearchFilter />
        </div>
      </div>
    </header>
  );
};
