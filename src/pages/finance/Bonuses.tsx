import { PageLayout } from "@/components/PageLayout";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Gift } from "lucide-react";

const Bonuses = () => {
  return (
    <DashboardLayout>
      <PageLayout title="إجمالي مكافآت الموظفين" description="إدارة المكافآت والحوافز">
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <div className="p-4 rounded-full bg-gradient-to-br from-pink-500 to-pink-600">
            <Gift className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-xl font-semibold">مكافآت الموظفين</h3>
          <p className="text-muted-foreground max-w-md">
            هنا سيتم عرض تفاصيل المكافآت والحوافز الممنوحة للموظفين
          </p>
        </div>
      </PageLayout>
    </DashboardLayout>
  );
};

export default Bonuses;
