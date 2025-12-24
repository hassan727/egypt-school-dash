import { PageLayout } from "@/components/PageLayout";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CircleDollarSign } from "lucide-react";

const NetPayroll = () => {
  return (
    <DashboardLayout>
      <PageLayout title="صافي مستحقات الموظفين" description="حساب صافي المستحقات">
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <div className="p-4 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600">
            <CircleDollarSign className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-xl font-semibold">صافي المستحقات</h3>
          <p className="text-muted-foreground max-w-md">
            هنا سيتم عرض صافي المستحقات بعد إضافة المكافآت وخصم الاستقطاعات
          </p>
        </div>
      </PageLayout>
    </DashboardLayout>
  );
};

export default NetPayroll;
