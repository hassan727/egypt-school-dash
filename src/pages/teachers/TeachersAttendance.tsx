import { PageLayout } from "@/components/PageLayout";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Calendar } from "lucide-react";

const TeachersAttendance = () => {
  return (
    <DashboardLayout>
      <PageLayout title="حضور وغياب المعلمين" description="متابعة حضور وغياب المعلمين">
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <div className="p-4 rounded-full bg-gradient-to-br from-orange-500 to-orange-600">
            <Calendar className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-xl font-semibold">حضور وغياب المعلمين</h3>
          <p className="text-muted-foreground max-w-md">
            هنا سيتم عرض نظام تسجيل حضور وغياب المعلمين مع التقارير الشهرية
          </p>
        </div>
      </PageLayout>
    </DashboardLayout>
  );
};

export default TeachersAttendance;
