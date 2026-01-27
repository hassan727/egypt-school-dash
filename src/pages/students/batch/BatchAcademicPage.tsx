import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBatchContext } from "@/components/batch/BatchContext";
import { useBatchStudents } from "@/hooks/useBatchStudents";
import { useDatabaseStagesClasses } from "@/hooks/useDatabaseStagesClasses";
import { useSystemSchoolId } from '@/context/SystemContext';
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Save, AlertCircle, CheckCircle2, ArrowRight, GraduationCap, Users, History, UserCog } from "lucide-react";
import { toast } from "sonner";

const BatchAcademicPage = () => {
    const { classId, className, stageName, refreshContext } = useBatchContext();
    const { students, isLoading: studentsLoading, refetch } = useBatchStudents(classId);
    const { stages, getClassesByStage, loading: stagesLoading } = useDatabaseStagesClasses();
    const schoolId = useSystemSchoolId();

    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [targetStageId, setTargetStageId] = useState<string>("");
    const [targetClassId, setTargetClassId] = useState<string>("");
    const [targetStatus, setTargetStatus] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);

    // ----------------------------------------------------------------------
    // REAL-TIME LOGS INTEGRATION
    // ----------------------------------------------------------------------
    const [recentLogs, setRecentLogs] = useState<any[]>([]);

    const fetchRecentLogs = async () => {
        try {
            // Fetch the last 5 updated students
            let query = supabase
                .from('students')
                .select(`
                    id, 
                    full_name_ar, 
                    updated_at,
                    classes ( name ),
                    registration_status
                `)
                .order('updated_at', { ascending: false })
                .eq('school_id', schoolId)
                .limit(5);

            if (classId) {
                query = query.eq('class_id', classId);
            }

            const { data, error } = await query;
            if (data) {
                setRecentLogs(data);
            }
        } catch (err) {
            console.error("Error fetching logs", err);
        }
    };

    React.useEffect(() => {
        if (schoolId) fetchRecentLogs();
    }, [classId, isSaving, schoolId]); // Re-fetch when context changes or after a save operation

    // Filter classes based on selected target stage
    const availableClasses = targetStageId ? getClassesByStage(targetStageId) : [];

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedStudents(students.map((s) => s.id));
        } else {
            setSelectedStudents([]);
        }
    };

    const handleSelectStudent = (studentId: string, checked: boolean) => {
        if (checked) {
            setSelectedStudents((prev) => [...prev, studentId]);
        } else {
            setSelectedStudents((prev) => prev.filter((id) => id !== studentId));
        }
    };

    const validateTransfer = () => {
        if (!targetStageId && !targetClassId && !targetStatus) {
            toast.error("يرجى اختيار إجراء واحد على الأقل (مرحلة/فصل أو حالة)");
            return false;
        }

        // Must select class if stage is selected
        if (targetStageId && !targetClassId) {
            toast.error("يرجى اختيار الفصل الدراسي المراد النقل إليه");
            return false;
        }

        // Smart Validation: Prevent illogical stage moves
        if (targetStageId && students.length > 0) {
            const currentStageId = students[0]?.classes?.stage_id;
            if (currentStageId && targetStageId !== currentStageId) {
                // Warning handled by UI Alert, but we proceed
            }
        }

        return true;
    };

    const handleSaveChanges = async () => {
        if (selectedStudents.length === 0) {
            toast.error("يرجى اختيار طلاب أولاً");
            return;
        }

        if (!validateTransfer()) return;

        try {
            setIsSaving(true);
            const updates: any = {};

            if (targetClassId) updates.class_id = targetClassId;
            // Note: In this schema, stage is derived from class, but we might store it for legacy or denormalization
            // If we update class_id, the stage relation updates automatically.

            if (targetStatus) updates.registration_status = targetStatus;

            const { error } = await supabase
                .from('students')
                .update(updates)
                .eq('school_id', schoolId)
                .in('id', selectedStudents);

            if (error) throw error;

            toast.success(`تم تحديث بيانات ${selectedStudents.length} طالب بنجاح`);

            // Clear selections
            setSelectedStudents([]);
            setTargetStageId("");
            setTargetClassId("");
            setTargetStatus("");

            // Refresh data
            await refetch();
            // If we moved students OUT of this class, we might want to refresh the context or just the list
            // Since the context is based on the URL classId, and we are IN that class view, 
            // the moved students will disappear from the list (which is correct).

        } catch (error) {
            console.error("Error updating students:", error);
            toast.error("حدث خطأ أثناء حفظ التغييرات");
        } finally {
            setIsSaving(false);
        }
    };

    const [contextStageId, setContextStageId] = useState<string>("");
    const [contextClassId, setContextClassId] = useState<string>("");
    const navigate = useNavigate();

    // ----------------------------------------------------------------------
    // PHASE 1: NO CONTEXT SELECTED
    // ----------------------------------------------------------------------
    if (!classId) {
        return (
            <div className="max-w-3xl mx-auto space-y-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2 mb-8">
                    <div className="bg-blue-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <GraduationCap className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">بدء العمليات الأكاديمية الجماعية</h2>
                    <p className="text-gray-500 max-w-lg mx-auto">
                        يرجى تحديد السياق (المرحلة والفصل) للبدء في إدارة الطلاب.
                        <br />
                        <span className="text-xs text-gray-400">نظام ذكي يمنع الأخطاء الغير مقصودة</span>
                    </p>
                </div>

                <Card className="w-full border shadow-md bg-white">
                    <CardHeader className="bg-gray-50/50 border-b pb-4">
                        <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-blue-600" />
                            إعداد نطاق العمل
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Stage Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-700">المرحلة الدراسية</label>
                                <Select
                                    value={contextStageId}
                                    onValueChange={(val) => { setContextStageId(val); setContextClassId(""); }}
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="اختر المرحلة..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {stages.map((stage) => (
                                            <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Class Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-700">الفصل الدراسي</label>
                                <Select
                                    value={contextClassId}
                                    onValueChange={setContextClassId}
                                    disabled={!contextStageId}
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="اختر الفصل..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {getClassesByStage(contextStageId).map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button
                            className="w-full h-11 text-base bg-blue-600 hover:bg-blue-700 transition-all font-semibold"
                            disabled={!contextStageId || !contextClassId}
                            onClick={() => navigate(`?classId=${contextClassId}`)}
                        >
                            بدء العمليات الجماعية
                            <ArrowRight className="w-5 h-5 mr-2 rotate-180" />
                        </Button>
                    </CardContent>
                </Card>

                <Alert className="bg-blue-50 border-blue-200">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">تلميح ذكي</AlertTitle>
                    <AlertDescription className="text-blue-700">
                        سيتم تحميل الطلاب المرتبطين بالسياق المختار فقط، مما يتيح لك إجراء عمليات النقل أو تغيير الحالة بدقة.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // ----------------------------------------------------------------------
    // PHASE 2: CONTEXT ACTIVE (Existing View)
    // ----------------------------------------------------------------------
    if (studentsLoading || stagesLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border shadow-sm">
                <CardHeader className="border-b bg-gray-50/40 pb-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                                <Users className="w-5 h-5 text-blue-600" />
                                تسكين وتنقلات الفصول (داخلي)
                            </CardTitle>
                            <p className="text-sm text-gray-500 mt-1">توزيع الطلاب على الفصول، وتصحيح الفصول (للعام الحالي فقط)</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium border border-blue-100">
                                {stageName} - {className}
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => navigate('?')} className="text-gray-400 hover:text-gray-600">
                                تغيير
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {/* Action Panel */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
                        <h3 className="font-bold mb-6 text-gray-900 flex items-center gap-2 border-b pb-2">
                            <span className="bg-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs text-white">1</span>
                            إعداد إجراءات التعديل
                            {selectedStudents.length > 0 && <span className="text-xs font-normal text-blue-600 mr-2 bg-blue-50 px-2 py-0.5 rounded-full">({selectedStudents.length} طالب محدد)</span>}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">

                            {/* Target Stage */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">نقل إلى مرحلة</label>
                                <Select value={targetStageId} onValueChange={(val) => { setTargetStageId(val); setTargetClassId(""); }}>
                                    <SelectTrigger className="bg-white h-10 border-gray-300 focus:ring-blue-500">
                                        <SelectValue placeholder="-- اختر المرحلة الهدف --" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {stages.map((stage) => (
                                            <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Target Class */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">نقل إلى فصل</label>
                                <Select value={targetClassId} onValueChange={setTargetClassId} disabled={!targetStageId}>
                                    <SelectTrigger className="bg-white h-10 border-gray-300 focus:ring-blue-500">
                                        <SelectValue placeholder="-- اختر الفصل الهدف --" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableClasses.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Target Status */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">تغيير الحالة</label>
                                <Select value={targetStatus} onValueChange={setTargetStatus}>
                                    <SelectTrigger className="bg-white h-10 border-gray-300 focus:ring-blue-500">
                                        <SelectValue placeholder="-- اختر الحالة الجديدة --" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">نشط (Active)</SelectItem>
                                        <SelectItem value="provisionally_registered">تسجيل مبدئي</SelectItem>
                                        <SelectItem value="suspended">موقوف</SelectItem>
                                        <SelectItem value="transferred">منقول</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Save Button */}
                            <Button
                                onClick={handleSaveChanges}
                                disabled={isSaving}
                                className="w-full h-10 shadow-sm transition-all bg-blue-600 hover:bg-blue-700"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                                تطبيق التغييرات
                            </Button>
                        </div>

                        {/* Visual Arrow for Move */}
                        {targetStageId && (
                            <div className="mt-6 flex items-center justify-center gap-4 bg-white p-3 rounded-lg border border-dashed border-gray-300 text-sm">
                                <span className="font-bold text-gray-700">{stageName} / {className}</span>
                                <ArrowRight className="w-5 h-5 text-gray-400 rotate-180" />
                                <span className="font-bold text-blue-700">
                                    {stages.find(s => s.id === targetStageId)?.name}
                                    {targetClassId ? ` / ${availableClasses.find(c => c.id === targetClassId)?.name}` : ''}
                                </span>
                            </div>
                        )}

                        {/* Warning if moving to different stage */}
                        {targetStageId && targetStageId !== (students[0]?.classes?.stage_id) && (
                            <Alert className="mt-4 bg-yellow-50 border-yellow-200">
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                <AlertTitle className="text-yellow-800">تنبيه تغيير المرحلة</AlertTitle>
                                <AlertDescription className="text-yellow-700">
                                    أنت تقوم بنقل الطلاب إلى مرحلة دراسية مختلفة. تأكد من أن هذا الإجراء صحيح أكاديمياً.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>


                    {/* Students Table */}
                    <div className="border rounded-md shadow-sm overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                            <h4 className="font-semibold text-gray-700">قائمة الطلاب ({students.length})</h4>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={selectedStudents.length === students.length && students.length > 0}
                                            onCheckedChange={handleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead className="text-right">اسم الطالب</TableHead>
                                    <TableHead className="text-right">النوع</TableHead>
                                    <TableHead className="text-right">الفصل الحالي</TableHead>
                                    <TableHead className="text-right">الحالة</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="bg-gray-100 p-3 rounded-full">
                                                    <Users className="w-6 h-6 text-gray-400" />
                                                </div>
                                                <p>لا يوجد طلاب مسجلين في هذا الفصل</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    students.map((student) => (
                                        <TableRow key={student.id} className={`transition-colors ${selectedStudents.includes(student.id) ? "bg-blue-50/70" : "hover:bg-gray-50"} cursor-pointer`} onClick={() => handleSelectStudent(student.id, !selectedStudents.includes(student.id))}>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={selectedStudents.includes(student.id)}
                                                    onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium text-gray-900">{student.full_name_ar}</TableCell>
                                            <TableCell className="text-gray-500">{student.gender}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-white hover:bg-white text-gray-700">
                                                    {student.classes?.name}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={student.registration_status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-200 border-0' : 'bg-gray-100 text-gray-700 border-0'}>
                                                    {student.registration_status === 'active' ? 'نشط' : student.registration_status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Context & History */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1 border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-gray-800">تكوين الفصل</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-gray-600">إجمالي السعة</span>
                                <span className="font-bold">40</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-gray-600">المسجلين حالياً</span>
                                <span className="font-bold text-blue-600">{students.length}</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-gray-600">المقاعد المتاحة</span>
                                <span className="font-bold text-green-600">{Math.max(0, 40 - students.length)}</span>
                            </div>
                            <div className="pt-2">
                                <div className="w-full bg-gray-100 rounded-full h-2.5 mb-1 overflow-hidden">
                                    <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (students.length / 40) * 100)}%` }}></div>
                                </div>
                                <div className="text-xs text-right text-gray-500">% نسبة الإشغال</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-gray-800">سجل التنقلات الأخير</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentLogs.length > 0 ? (
                                recentLogs.map((log) => (
                                    <div key={log.id} className="border rounded-lg p-3 bg-gray-50 flex items-center gap-3">
                                        <div className="bg-blue-100 p-2 rounded-full">
                                            <UserCog className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                تم تحديث: {log.full_name_ar}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(log.updated_at).toLocaleDateString('en-GB', { timeZone: 'Africa/Cairo' })} • {log.classes?.name || 'بدون فصل'}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-400 py-4">
                                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">لا توجد تحديثات حديثة</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default BatchAcademicPage;
