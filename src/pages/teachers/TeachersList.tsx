import { PageLayout } from "@/components/PageLayout";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Users } from "lucide-react";

const TeachersList = () => {
  return (
    <DashboardLayout>
      <PageLayout title="قائمة المعلمين" description="إدارة بيانات المعلمين">
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <div className="p-4 rounded-full bg-gradient-to-br from-green-500 to-green-600">
            <Users className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-xl font-semibold">قائمة المعلمين</h3>
          <p className="text-muted-foreground max-w-md">
            هنا سيتم عرض جدول تفصيلي بجميع المعلمين مع بياناتهم ومواد التدريس
          </p>
        </div>
      </PageLayout>
    </DashboardLayout>
  );
};

export default TeachersList;
