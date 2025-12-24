import React, { useEffect, useState } from "react";
import { Outlet, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { BatchContext, BatchContextType } from "./BatchContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, School, Users, Calendar, Bell, FileText, Archive, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useDatabaseStagesClasses } from "@/hooks/useDatabaseStagesClasses";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DashboardLayout } from "@/components/DashboardLayout";

const BatchOperationsLayout = () => {
    const [searchParams] = useSearchParams();
    const classId = searchParams.get("classId");
    const stageIdParam = searchParams.get("stageId");
    const navigate = useNavigate();
    const location = useLocation();
    const { stages, classes, loading: loadingStages } = useDatabaseStagesClasses();
    const [academicYear, setAcademicYear] = useState<string | null>(null);

    // Generate available academic years (matching global logic)
    const currentYear = new Date().getFullYear();
    const availableYears = Array.from({ length: 8 }, (_, i) => {
        const startYear = currentYear - 2 + i;
        const endYear = startYear + 1;
        return `${startYear}-${endYear}`;
    });

    const [contextData, setContextData] = useState<Omit<BatchContextType, "refreshContext" | "setAcademicYear" | "academicYear">>({
        classId: classId,
        className: null,
        stageId: null,
        stageName: null,
        isLoading: true,
    });

    const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

    const fetchClassDetails = async () => {
        if (!classId && !stageIdParam) {
            setContextData(prev => ({ ...prev, isLoading: false }));
            return;
        }

        try {
            setContextData(prev => ({ ...prev, isLoading: true }));

            if (classId) {
                // Fetch class and stage details
                const { data, error } = await supabase
                    .from('classes')
                    .select(`
              id,
              name,
              stages (
                id,
                name
              )
            `)
                    .eq('id', classId)
                    .maybeSingle();

                if (error) throw error;

                if (data) {
                    setContextData({
                        classId: data.id,
                        className: data.name,
                        stageId: Array.isArray(data.stages) ? data.stages[0]?.id : (data.stages as any)?.id || null,
                        stageName: Array.isArray(data.stages) ? data.stages[0]?.name : (data.stages as any)?.name || null,
                        isLoading: false,
                    });
                    // Set selected stage for the dropdown if we have data
                    const stageId = Array.isArray(data.stages) ? data.stages[0]?.id : (data.stages as any)?.id;
                    if (stageId) setSelectedStageId(stageId);
                }
            } else if (stageIdParam) {
                // Fetch stage details only
                const { data, error } = await supabase
                    .from('stages')
                    .select('id, name')
                    .eq('id', stageIdParam)
                    .single();

                if (error) throw error;

                if (data) {
                    setContextData({
                        classId: null,
                        className: "جميع الفصول",
                        stageId: data.id,
                        stageName: data.name,
                        isLoading: false,
                    });
                    setSelectedStageId(data.id);
                }
            }
        } catch (error) {
            console.error("Error fetching details:", error);
            toast.error("فشل في تحميل البيانات");
            setContextData(prev => ({ ...prev, isLoading: false }));
        }
    };

    useEffect(() => {
        fetchClassDetails();
    }, [classId, stageIdParam]);

    const refreshContext = () => {
        fetchClassDetails();
    };

    // Navigation helper
    const navigateTo = (path: string) => {
        const params = new URLSearchParams();
        if (classId) params.set("classId", classId);
        if (stageIdParam && !classId) params.set("stageId", stageIdParam); // Keep stage if no class

        navigate(`${path}?${params.toString()}`);
    };

    const handleClassSelect = (newClassId: string) => {
        const currentPath = location.pathname;
        if (newClassId === "all") {
            navigate(`${currentPath}?stageId=${selectedStageId}`);
        } else {
            navigate(`${currentPath}?classId=${newClassId}`);
        }
    };

    const handleStageSelect = (newStageId: string) => {
        setSelectedStageId(newStageId);
        // Reset to "all classes" for the new stage by default or just switch context
        const currentPath = location.pathname;
        navigate(`${currentPath}?stageId=${newStageId}`);
    };

    const isActive = (path: string) => location.pathname === path;

    // Filter classes based on selected stage
    const filteredClasses = selectedStageId
        ? classes.filter(c => c.stage_id === selectedStageId)
        : [];

    return (
        <BatchContext.Provider value={{ ...contextData, refreshContext, academicYear, setAcademicYear }}>
            <DashboardLayout>
                <div className="space-y-6" dir="rtl">
                    {/* Academic Year Selection Enforcement */}
                    {!academicYear ? (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                            <div className="text-center space-y-2">
                                <h1 className="text-3xl font-bold text-gray-900">العمليات الجماعية</h1>
                                <p className="text-gray-500">يرجى اختيار السنة الدراسية للبدء</p>
                            </div>

                            <Card className="w-full max-w-md p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">السنة الدراسية</label>
                                        <Select onValueChange={setAcademicYear}>
                                            <SelectTrigger className="w-full bg-white">
                                                <SelectValue placeholder="اختر السنة الدراسية..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableYears.map((year) => (
                                                    <SelectItem key={year} value={year}>
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="bg-blue-100/50 p-3 rounded text-xs text-blue-700 flex items-start gap-2">
                                        <Bell className="w-4 h-4 mt-0.5" />
                                        <span>جميع العمليات التي ستقوم بها سيتم تسجيلها ضمن السنة الدراسية المختارة.</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                    <span className="cursor-pointer hover:text-primary" onClick={() => navigate("/students")}>الطلاب</span>
                                    <ArrowRight className="w-4 h-4 rotate-180" />
                                    <span className="cursor-pointer hover:text-primary" onClick={() => navigate("/classes")}>الفصول</span>
                                    <ArrowRight className="w-4 h-4 rotate-180" />
                                    <span className="font-medium text-foreground">العمليات الجماعية</span>
                                </div>

                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900">
                                            {contextData.isLoading ? "جاري التحميل..." :
                                                contextData.className ? `العمليات الجماعية: ${contextData.stageName} - ${contextData.className}` :
                                                    "العمليات الجماعية"}
                                        </h1>
                                        <p className="text-gray-500 mt-1">
                                            إدارة ذكية للعمليات الجماعية في سياق الفصل الدراسي
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <Select
                                                value={selectedStageId || ""}
                                                onValueChange={handleStageSelect}
                                            >
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue placeholder="اختر المرحلة" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {stages.map((stage) => (
                                                        <SelectItem key={stage.id} value={stage.id}>
                                                            {stage.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            <Select
                                                value={classId || "all"}
                                                onValueChange={handleClassSelect}
                                                disabled={!selectedStageId}
                                            >
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue placeholder="اختر الفصل" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">كل الفصول</SelectItem>
                                                    {filteredClasses.map((cls) => (
                                                        <SelectItem key={cls.id} value={cls.id}>
                                                            {cls.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button variant="outline" onClick={() => navigate("/classes")}>
                                            عودة للقائمة
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation Tabs */}
                            <div className="flex flex-wrap gap-2 mb-8 border-b pb-1 overflow-x-auto">
                                <NavButton
                                    active={isActive("/students/batch/operations")}
                                    onClick={() => navigateTo("/students/batch/operations")}
                                    icon={<School className="w-4 h-4" />}
                                    label="لوحة القيادة"
                                />
                                <NavButton
                                    active={isActive("/students/batch/academic")}
                                    onClick={() => navigateTo("/students/batch/academic")}
                                    icon={<Users className="w-4 h-4" />}
                                    label="نقل وتسكين الفصول"
                                />
                                <NavButton
                                    active={isActive("/students/batch/attendance")}
                                    onClick={() => navigateTo("/students/batch/attendance")}
                                    icon={<Calendar className="w-4 h-4" />}
                                    label="الحضور والغياب"
                                />
                                <NavButton
                                    active={isActive("/students/batch/notifications")}
                                    onClick={() => navigateTo("/students/batch/notifications")}
                                    icon={<Bell className="w-4 h-4" />}
                                    label="الإشعارات"
                                />
                                <NavButton
                                    active={isActive("/students/batch/profiles")}
                                    onClick={() => navigateTo("/students/batch/profiles")}
                                    icon={<FileText className="w-4 h-4" />}
                                    label="إدارة البيانات"
                                />
                                <NavButton
                                    active={isActive("/students/batch/archive")}
                                    onClick={() => navigateTo("/students/batch/archive")}
                                    icon={<Archive className="w-4 h-4" />}
                                    label="الترقية والترحيل السنوي"
                                />
                                <NavButton
                                    active={isActive("/students/reports")}
                                    onClick={() => navigateTo("/students/reports")}
                                    icon={<FileText className="w-4 h-4" />}
                                    label="تقارير الحضور"
                                />
                            </div>

                            {/* Content Area */}
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <Outlet />
                            </div>
                        </>
                    )}
                </div>
            </DashboardLayout>
        </BatchContext.Provider>
    );
};

const NavButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
    <Button
        variant={active ? "default" : "ghost"}
        className={`gap-2 ${active ? "bg-primary text-primary-foreground" : "text-gray-600 hover:text-primary hover:bg-primary/5"}`}
        onClick={onClick}
    >
        {icon}
        {label}
    </Button>
);

export default BatchOperationsLayout;
