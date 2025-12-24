import { PageLayout } from "@/components/PageLayout";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Star } from "lucide-react";

const TeachersEvaluation = () => {
  return (
    <DashboardLayout>
      <PageLayout title="تقييمات المعلمين" description="تقييم أداء المعلمين">
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <div className="p-4 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600">
            <Star className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-xl font-semibold">تقييمات المعلمين</h3>
          <p className="text-muted-foreground max-w-md">
            هنا سيتم عرض نظام تقييم أداء المعلمين والتقارير التفصيلية
          </p>
        </div>
      </PageLayout>
    </DashboardLayout>
  );
};

export default TeachersEvaluation;
