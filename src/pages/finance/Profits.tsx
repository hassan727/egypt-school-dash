import { PageLayout } from "@/components/PageLayout";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Wallet } from "lucide-react";

const Profits = () => {
  return (
    <DashboardLayout>
      <PageLayout title="صافي أرباح المدرسة" description="متابعة صافي الأرباح">
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <div className="p-4 rounded-full bg-gradient-to-br from-teal-500 to-teal-600">
            <Wallet className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-xl font-semibold">صافي الأرباح</h3>
          <p className="text-muted-foreground max-w-md">
            هنا سيتم عرض حساب صافي الأرباح مع الرسوم البيانية والمقارنات الشهرية
          </p>
        </div>
      </PageLayout>
    </DashboardLayout>
  );
};

export default Profits;
