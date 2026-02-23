import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, Info } from "lucide-react";
import { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DashboardCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  gradient: string;
  trend?: ReactNode;
  onClick?: () => void;
  accountingLogic?: string;
}

export const DashboardCard = ({
  title,
  value,
  description,
  icon: Icon,
  gradient,
  trend,
  onClick,
  accountingLogic,
}: DashboardCardProps) => {
  return (
    <Card
      className="group hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] border-border/40 overflow-hidden relative"
      onClick={onClick}
    >
      <div className={`absolute top-0 left-0 w-full h-1 ${gradient}`} />
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-2xl ${gradient} shadow-md`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="flex items-center gap-2">
            {trend && <div className="text-sm font-medium">{trend}</div>}
            {accountingLogic && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="p-1 hover:bg-muted rounded-full transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Info className="h-4 w-4 text-muted-foreground hover:text-primary" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-right">
                  <p className="text-xs leading-relaxed">{accountingLogic}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
          <p className="text-3xl font-bold text-foreground bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground font-medium">{description}</p>
          )}
          {accountingLogic && (
            <p className="text-xs text-foreground/80 font-medium leading-relaxed border-t border-border pt-2 mt-2">
              📊 {accountingLogic}
            </p>
          )}
          <button className="text-sm text-primary hover:underline font-semibold mt-3 group-hover:translate-x-[-4px] transition-transform duration-200 flex items-center gap-1">
            عرض التفاصيل
            <span className="text-lg">←</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
