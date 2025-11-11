import { PageLayout } from "@/components/PageLayout";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TrendingUp } from "lucide-react";

const Revenue = () => {
  return (
    <DashboardLayout>
      <PageLayout title="إجمالي إيرادات المدرسة" description="متابعة وإدارة الإيرادات">
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <div className="p-4 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600">
            <TrendingUp className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-xl font-semibold">إيرادات المدرسة</h3>
          <p className="text-muted-foreground max-w-md">
            هنا سيتم عرض تفاصيل الإيرادات مع إمكانية إضافة إيرادات جديدة وتصدير التقارير
          </p>
        </div>
      </PageLayout>
    </DashboardLayout>
  );
};

export default Revenue;
