import { PageLayout } from "@/components/PageLayout";
import { DashboardLayout } from "@/components/DashboardLayout";
import { School } from "lucide-react";

const ClassesList = () => {
  return (
    <DashboardLayout>
      <PageLayout title="إجمالي الفصول" description="إدارة الفصول الدراسية">
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <div className="p-4 rounded-full bg-gradient-to-br from-purple-500 to-purple-600">
            <School className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-xl font-semibold">الفصول الدراسية</h3>
          <p className="text-muted-foreground max-w-md">
            هنا سيتم عرض قائمة الفصول الدراسية مع عدد الطلاب والمعلمين المسؤولين
          </p>
        </div>
      </PageLayout>
    </DashboardLayout>
  );
};

export default ClassesList;
