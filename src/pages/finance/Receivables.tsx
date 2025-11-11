import { PageLayout } from "@/components/PageLayout";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CreditCard } from "lucide-react";

const Receivables = () => {
  return (
    <DashboardLayout>
      <PageLayout title="المبالغ المستحقة للتحصيل" description="متابعة المستحقات المالية">
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <div className="p-4 rounded-full bg-gradient-to-br from-amber-500 to-amber-600">
            <CreditCard className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-xl font-semibold">المستحقات المالية</h3>
          <p className="text-muted-foreground max-w-md">
            هنا سيتم عرض المبالغ المستحقة من أولياء الأمور مع إمكانية تسجيل الدفعات
          </p>
        </div>
      </PageLayout>
    </DashboardLayout>
  );
};

export default Receivables;
