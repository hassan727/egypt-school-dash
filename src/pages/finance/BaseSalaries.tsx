import { PageLayout } from "@/components/PageLayout";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Banknote } from "lucide-react";

const BaseSalaries = () => {
  return (
    <DashboardLayout>
      <PageLayout title="إجمالي الرواتب الأساسية" description="تفاصيل الرواتب الأساسية">
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <div className="p-4 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600">
            <Banknote className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-xl font-semibold">الرواتب الأساسية</h3>
          <p className="text-muted-foreground max-w-md">
            هنا سيتم عرض تفاصيل الرواتب الأساسية لجميع الموظفين
          </p>
        </div>
      </PageLayout>
    </DashboardLayout>
  );
};

export default BaseSalaries;
