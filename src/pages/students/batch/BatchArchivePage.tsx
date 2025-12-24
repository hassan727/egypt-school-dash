import React, { useState } from "react";
import { useBatchContext } from "@/components/batch/BatchContext";
import { useBatchStudents } from "@/hooks/useBatchStudents";
import { useDatabaseStagesClasses } from "@/hooks/useDatabaseStagesClasses";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
import { Loader2, Archive, ArrowUpCircle, LogOut, AlertTriangle, Users, User, Star, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const BatchArchivePage = () => {
    const { classId, stageId, stageName } = useBatchContext();
    const { students, isLoading: studentsLoading, refetch } = useBatchStudents(classId, stageId);
    const { stages, getClassesByStage } = useDatabaseStagesClasses();

    // Normalization Functions
    const normalizeGender = (g: string | undefined | null) => {
        if (!g) return 'other';
        const clean = g.toString().trim().toLowerCase();
        if (['ذكر', 'male', 'ولد', 'm'].includes(clean)) return 'male';
        if (['أنثى', 'female', 'انثي', 'أنثي', 'بنت', 'f', 'انثى', 'آنسة'].includes(clean)) return 'female';
        return 'other';
    };

    const normalizeReligion = (r: string | undefined | null) => {
        if (!r) return 'other';
        const clean = r.toString().replace(/[\/\s\-_]/g, '').toLowerCase();
        if (clean.includes('مسلم') || clean.includes('islam') || clean.includes('مسمل')) return 'muslim';
        if (clean.includes('مسيح') || clean.includes('christian') || clean.includes('qibt')) return 'christian';
        return 'other';
    };

    // Calculate Stats
    const stats = React.useMemo(() => {
        const counts = {
            total: students.length,
            boys: 0,
            girls: 0,
            muslim: 0,
            christian: 0,
            other: 0
        };

        students.forEach(s => {
            const gender = normalizeGender(s.gender);
            const religion = normalizeReligion(s.religion);

            if (gender === 'male') counts.boys++;
            else if (gender === 'female') counts.girls++;

            if (religion === 'muslim') counts.muslim++;
            else if (religion === 'christian') counts.christian++;
            else counts.other++;
        });

        return counts;
    }, [students]);

    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [actionType, setActionType] = useState<"promote" | "transfer" | "archive">("promote");

    // Promotion State
    const [targetYear, setTargetYear] = useState("2026-2027");
    const [targetStageId, setTargetStageId] = useState("");
    const [targetClassId, setTargetClassId] = useState("");

    // Transfer State
    const [transferReason, setTransferReason] = useState("");
    const [destinationSchool, setDestinationSchool] = useState("");

    const [isProcessing, setIsProcessing] = useState(false);

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

    const handleExecute = async () => {
        if (selectedStudents.length === 0) {
            toast.error("يرجى اختيار طلاب أولاً");
            return;
        }

        try {
            setIsProcessing(true);

            if (actionType === "promote") {
                if (!targetStageId) {
                    toast.error("يرجى تحديد المرحلة المستهدفة");
                    return;
                }

                // If strictly in Class Mode (classId is set), require target class
                // If in Stage Mode (!classId), target class is optional (unassigned)
                if (classId && !targetClassId) {
                    toast.error("يرجى تحديد الفصل المستهدف");
                    return;
                }

                // Prepare update payload
                const updatePayload: any = {
                    academic_year: targetYear,
                    enrollment_type: 'منقول',
                    // registration_status: 'active' // Ensure they stay active
                };

                if (targetClassId) {
                    updatePayload.class_id = targetClassId;
                } else {
                    // Moving to stage without specific class (Unassigned)
                    updatePayload.class_id = null;
                }

                // Perform Update
                const { error } = await supabase
                    .from('students')
                    .update(updatePayload)
                    .in('id', selectedStudents);

                if (error) throw error;
                toast.success(`تم ترقية ${selectedStudents.length} طالب بنجاح`);

            } else if (actionType === "transfer") {
                if (!transferReason) {
                    toast.error("يرجى ذكر سبب النقل");
                    return;
                }

                const { error } = await supabase
                    .from('students')
                    .update({
                        registration_status: 'transferred',
                        transfer_reason: transferReason,
                        previous_school: destinationSchool ? `منقول إلى: ${destinationSchool}` : null
                    })
                    .in('id', selectedStudents);

                if (error) throw error;
                toast.success(`تم نقل ${selectedStudents.length} طالب خارج المدرسة`);

            } else if (actionType === "archive") {
                const { error } = await supabase
                    .from('students')
                    .update({
                        registration_status: 'archived',
                        file_status: 'archived'
                    })
                    .in('id', selectedStudents);

                if (error) throw error;
                toast.success(`تم أرشفة ${selectedStudents.length} طالب`);
            }

            setSelectedStudents([]);
            await refetch();

        } catch (error) {
            console.error("Error executing batch action:", error);
            toast.error("حدث خطأ أثناء تنفيذ العملية");
        } finally {
            setIsProcessing(false);
        }
    };

    if (studentsLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 relative pb-20">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">إجمالي الطلبة</p>
                            <p className="text-2xl font-bold">{stats.total}</p>
                        </div>
                        <Users className="h-8 w-8 text-blue-500 opacity-20" />
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">الذكور</p>
                            <p className="text-2xl font-bold">{stats.boys}</p>
                        </div>
                        <User className="h-8 w-8 text-cyan-500 opacity-20" />
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">الإناث</p>
                            <p className="text-2xl font-bold">{stats.girls}</p>
                        </div>
                        <User className="h-8 w-8 text-pink-500 opacity-20" />
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">مسلم</p>
                            <p className="text-2xl font-bold">{stats.muslim}</p>
                        </div>
                        <Star className="h-8 w-8 text-green-500 opacity-20" />
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">مسيحي</p>
                            <p className="text-2xl font-bold">{stats.christian}</p>
                        </div>
                        <Star className="h-8 w-8 text-amber-500 opacity-20" />
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">أخرى</p>
                            <p className="text-2xl font-bold">{stats.other}</p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-gray-500 opacity-20" />
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Archive className="w-6 h-6 text-red-600" />
                        الترقية والترحيل السنوي (نهاية العام)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Action Configuration Panel */}
                    <div className="bg-red-50/50 p-6 rounded-lg border border-red-100 mb-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Action Type Selection */}
                            <div className="w-full md:w-1/4 space-y-4">
                                <h3 className="font-semibold text-red-900">نوع العملية</h3>
                                <div className="space-y-2">
                                    <div
                                        className={`p-3 rounded-md border cursor-pointer flex items-center gap-2 ${actionType === 'promote' ? 'bg-white border-red-500 ring-1 ring-red-500' : 'bg-transparent border-gray-200 hover:bg-white'}`}
                                        onClick={() => setActionType('promote')}
                                    >
                                        <ArrowUpCircle className="w-5 h-5 text-green-600" />
                                        <span>ترقية للسنة القادمة</span>
                                    </div>
                                    <div
                                        className={`p-3 rounded-md border cursor-pointer flex items-center gap-2 ${actionType === 'transfer' ? 'bg-white border-red-500 ring-1 ring-red-500' : 'bg-transparent border-gray-200 hover:bg-white'}`}
                                        onClick={() => setActionType('transfer')}
                                    >
                                        <LogOut className="w-5 h-5 text-orange-600" />
                                        <span>نقل خارج المدرسة</span>
                                    </div>
                                    <div
                                        className={`p-3 rounded-md border cursor-pointer flex items-center gap-2 ${actionType === 'archive' ? 'bg-white border-red-500 ring-1 ring-red-500' : 'bg-transparent border-gray-200 hover:bg-white'}`}
                                        onClick={() => setActionType('archive')}
                                    >
                                        <Archive className="w-5 h-5 text-gray-600" />
                                        <span>أرشفة (تخرج/انقطاع)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Details */}
                            <div className="w-full md:w-3/4 space-y-4 border-r pr-6 mr-6">
                                <h3 className="font-semibold text-gray-900">تفاصيل العملية ({selectedStudents.length} طالب محدد)</h3>

                                {actionType === 'promote' && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">السنة الدراسية الجديدة</label>
                                            <Select value={targetYear} onValueChange={setTargetYear}>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="2025-2026">2025-2026</SelectItem>
                                                    <SelectItem value="2026-2027">2026-2027</SelectItem>
                                                    <SelectItem value="2027-2028">2027-2028</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">المرحلة المستهدفة</label>
                                            <Select value={targetStageId} onValueChange={(val) => { setTargetStageId(val); setTargetClassId(""); }}>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="اختر المرحلة" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {stages.map((stage) => (
                                                        <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                الفصل المستهدف
                                                {!classId && <span className="text-xs text-muted-foreground font-normal"> (اختياري للمرحلة)</span>}
                                            </label>
                                            <Select value={targetClassId} onValueChange={setTargetClassId} disabled={!targetStageId}>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder={!classId ? "اختر الفصل (أو اتركه فارغاً)" : "اختر الفصل"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="unassigned_placeholder" className="hidden">اختر الفصل</SelectItem>
                                                    {availableClasses.map((cls) => (
                                                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}

                                {actionType === 'transfer' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">سبب النقل</label>
                                            <Input
                                                value={transferReason}
                                                onChange={(e) => setTransferReason(e.target.value)}
                                                placeholder="مثال: انتقال سكن، رغبة ولي الأمر..."
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">المدرسة المحول إليها (اختياري)</label>
                                            <Input
                                                value={destinationSchool}
                                                onChange={(e) => setDestinationSchool(e.target.value)}
                                                placeholder="اسم المدرسة..."
                                                className="bg-white"
                                            />
                                        </div>
                                    </div>
                                )}

                                {actionType === 'archive' && (
                                    <div className="animate-in fade-in">
                                        <Alert className="bg-gray-50 border-gray-200">
                                            <AlertTriangle className="h-4 w-4 text-gray-600" />
                                            <AlertTitle>تنبيه الأرشفة</AlertTitle>
                                            <AlertDescription>
                                                سيتم تغيير حالة الطلاب إلى "مؤرشف". لن يظهروا في القوائم النشطة ولكن ستبقى بياناتهم محفوظة في النظام.
                                            </AlertDescription>
                                        </Alert>
                                    </div>
                                )}

                                <div className="pt-4">
                                    <Button
                                        onClick={handleExecute}
                                        disabled={isProcessing || selectedStudents.length === 0}
                                        className="bg-red-600 hover:bg-red-700 w-full md:w-auto min-w-[200px]"
                                    >
                                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Archive className="w-4 h-4 ml-2" />}
                                        تنفيذ الإجراء
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Students Table */}
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={
                                                students.length > 0 && selectedStudents.length === students.length
                                                    ? true
                                                    : selectedStudents.length > 0
                                                        ? "indeterminate"
                                                        : false
                                            }
                                            onCheckedChange={handleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead className="text-right">اسم الطالب</TableHead>
                                    <TableHead className="text-right">الفصل الحالي</TableHead>
                                    <TableHead className="text-right">الحالة</TableHead>
                                    <TableHead className="text-right">تاريخ التسجيل</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                            لا يوجد طلاب في هذا الفصل
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    students.map((student) => (
                                        <TableRow key={student.id} className={selectedStudents.includes(student.id) ? "bg-red-50" : ""}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedStudents.includes(student.id)}
                                                    onCheckedChange={(checked) => handleSelectStudent(student.id, checked)}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{student.full_name_ar}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-gray-100">
                                                    {student.classes?.name}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={student.registration_status === 'active' ? 'default' : 'secondary'}>
                                                    {student.registration_status === 'active' ? 'نشط' : student.registration_status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-gray-500 text-sm">
                                                --
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            {/* Floating Selection Bar */}
            {selectedStudents.length > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-red-900 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className="flex items-center gap-2">
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">{selectedStudents.length}</span>
                        <span className="text-sm font-medium">طالب محدد لل{actionType === 'promote' ? 'ترقية' : actionType === 'transfer' ? 'نقل' : 'أرشفة'}</span>
                    </div>
                    <div className="h-4 w-px bg-white/20 mx-2"></div>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs hover:bg-white/20 text-white hover:text-white"
                        onClick={() => setSelectedStudents([])}
                    >
                        إلغاء التحديد
                    </Button>
                </div>
            )}
        </div>
    );
};

export default BatchArchivePage;
