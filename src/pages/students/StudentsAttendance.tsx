import { PageLayout } from "@/components/PageLayout";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Calendar } from "lucide-react";

const StudentsAttendance = () => {
  return (
    <DashboardLayout>
      <PageLayout title="حضور وغياب الطلاب" description="متابعة حضور وغياب الطلاب">
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <div className="p-4 rounded-full bg-gradient-to-br from-purple-500 to-purple-600">
            <Calendar className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-xl font-semibold">حضور وغياب الطلاب</h3>
          <p className="text-muted-foreground max-w-md">
            هنا سيتم عرض نظام تسجيل الحضور والغياب اليومي مع إحصائيات تفصيلية
          </p>
        </div>
      </PageLayout>
    </DashboardLayout>
  );
};

export default StudentsAttendance;
