import { PageLayout } from "@/components/PageLayout";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Minus } from "lucide-react";

const Deductions = () => {
  return (
    <DashboardLayout>
      <PageLayout title="إجمالي خصومات الموظفين" description="إدارة الخصومات">
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <div className="p-4 rounded-full bg-gradient-to-br from-rose-500 to-rose-600">
            <Minus className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-xl font-semibold">خصومات الموظفين</h3>
          <p className="text-muted-foreground max-w-md">
            هنا سيتم عرض تفاصيل الخصومات من رواتب الموظفين
          </p>
        </div>
      </PageLayout>
    </DashboardLayout>
  );
};

export default Deductions;
