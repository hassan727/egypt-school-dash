import { PageLayout } from "@/components/PageLayout";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TrendingDown } from "lucide-react";

const Expenses = () => {
  return (
    <DashboardLayout>
      <PageLayout title="إجمالي مصروفات المدرسة" description="متابعة وإدارة المصروفات">
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <div className="p-4 rounded-full bg-gradient-to-br from-red-500 to-red-600">
            <TrendingDown className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-xl font-semibold">مصروفات المدرسة</h3>
          <p className="text-muted-foreground max-w-md">
            هنا سيتم عرض تفاصيل المصروفات مع تصنيفها وإمكانية إضافة مصروفات جديدة
          </p>
        </div>
      </PageLayout>
    </DashboardLayout>
  );
};

export default Expenses;
