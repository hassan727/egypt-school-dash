import { PageLayout } from "@/components/PageLayout";
import { DashboardLayout } from "@/components/DashboardLayout";
import { UserPlus } from "lucide-react";

const NewTeacher = () => {
  return (
    <DashboardLayout>
      <PageLayout title="تعيين معلم جديد" description="إضافة معلم جديد للمدرسة">
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <div className="p-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
            <UserPlus className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-xl font-semibold">تعيين معلم جديد</h3>
          <p className="text-muted-foreground max-w-md">
            هنا سيتم عرض نموذج تعيين معلم جديد يتضمن المعلومات الشخصية والمؤهلات
          </p>
        </div>
      </PageLayout>
    </DashboardLayout>
  );
};

export default NewTeacher;
