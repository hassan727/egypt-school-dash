import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  gradient: string;
  trend?: ReactNode;
  onClick?: () => void;
}

export const DashboardCard = ({
  title,
  value,
  description,
  icon: Icon,
  gradient,
  trend,
  onClick,
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
          {trend && <div className="text-sm font-medium">{trend}</div>}
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
          <p className="text-3xl font-bold text-foreground bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground font-medium">{description}</p>
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
