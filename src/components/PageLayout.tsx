import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface PageLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  showBackButton?: boolean;
}

export const PageLayout = ({ title, description, children, showBackButton = true }: PageLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowRight className="h-5 w-5" />
          </Button>
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          {description && <p className="text-muted-foreground mt-1">{description}</p>}
        </div>
      </div>
      <div className="bg-card rounded-lg border border-border p-6 min-h-[400px]">
        {children}
      </div>
    </div>
  );
};
