import { PageLayout } from "@/components/PageLayout";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Award } from "lucide-react";

const Certificates = () => {
  return (
    <DashboardLayout>
      <PageLayout title="الشهادات" description="إدارة شهادات الطلاب">
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <div className="p-4 rounded-full bg-gradient-to-br from-amber-500 to-amber-600">
            <Award className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-xl font-semibold">الشهادات</h3>
          <p className="text-muted-foreground max-w-md">
            هنا سيتم عرض وإدارة شهادات الطلاب وطباعتها
          </p>
        </div>
      </PageLayout>
    </DashboardLayout>
  );
};

export default Certificates;
