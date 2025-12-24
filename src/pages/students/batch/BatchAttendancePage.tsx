import React, { useState, useEffect } from "react";
import { useBatchContext } from "@/components/batch/BatchContext";
import { useBatchStudents } from "@/hooks/useBatchStudents";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
    Calendar as CalendarIcon,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Save,
    Loader2,
    Users,
    CheckSquare,
    RotateCcw,
    ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

interface StudentAttendanceState {
    studentId: string;
    studentName: string;
    status: AttendanceStatus | null;
    notes?: string;
}

const BatchAttendancePage = () => {
    const { classId, className, stageId } = useBatchContext();
    const { students, isLoading: studentsLoading } = useBatchStudents(classId, stageId);

    const [date, setDate] = useState<Date>(new Date());
    const [attendanceState, setAttendanceState] = useState<Record<string, AttendanceStatus>>({});
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState("");

    // Filter students based on search query
    const filteredStudents = students.filter(student =>
        student.full_name_ar.includes(searchQuery)
    );

    // Initialize attendance state when students load
    useEffect(() => {
        if (students.length > 0) {
            // Check if we have attendance for this date
            checkExistingAttendance();
        }
    }, [students, date]);

    const checkExistingAttendance = async () => {
        setIsLoadingAttendance(true);
        try {
            const dateStr = format(date, 'yyyy-MM-dd');
            const ids = students.map(s => s.student_id);
            if (ids.length === 0) {
                setAttendanceState({});
                return;
            }
            const { data, error } = await supabase
                .from('attendance_records')
                .select('student_id, status')
                .eq('date', dateStr)
                .in('student_id', ids);
            if (error) throw error;
            const next: Record<string, AttendanceStatus> = {};
            (data || []).forEach(r => {
                const code = getStatusCodeFromLabel(r.status as string);
                if (code) next[r.student_id as string] = code;
            });
            setAttendanceState(next);
        } catch (error) {
            console.error("Error fetching attendance:", error);
            setAttendanceState({});
        } finally {
            setIsLoadingAttendance(false);
        }
    };

    const handleMarkAll = (status: AttendanceStatus) => {
        const newState = { ...attendanceState };
        // Apply only to filtered students
        filteredStudents.forEach(student => {
            newState[student.student_id] = status;
        });
        setAttendanceState(newState);
        toast.info(`تم تحديد ${filteredStudents.length} طالب كـ ${getStatusLabel(status)}`);
    };

    const handleMarkSelected = (status: AttendanceStatus) => {
        if (selectedStudents.size === 0) {
            toast.warning("الرجاء تحديد طلاب أولاً");
            return;
        }
        const newState = { ...attendanceState };
        selectedStudents.forEach(studentId => {
            newState[studentId] = status;
        });
        setAttendanceState(newState);
        toast.success(`تم تحديد ${selectedStudents.size} طالب كـ ${getStatusLabel(status)}`);
    };

    const toggleSelectAll = () => {
        // Toggle based on filtered students
        const allFilteredSelected = filteredStudents.every(s => selectedStudents.has(s.student_id));
        const newSelected = new Set(selectedStudents);

        if (allFilteredSelected) {
            // Deselect all visible
            filteredStudents.forEach(s => newSelected.delete(s.student_id));
        } else {
            // Select all visible
            filteredStudents.forEach(s => newSelected.add(s.student_id));
        }
        setSelectedStudents(newSelected);
    };

    const toggleSelectStudent = (studentId: string) => {
        const newSelected = new Set(selectedStudents);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedStudents(newSelected);
    };

    const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
        setAttendanceState(prev => {
            const current = prev[studentId];
            // Toggle off if already selected
            if (current === status) {
                const next = { ...prev };
                delete next[studentId];
                return next;
            }
            return { ...prev, [studentId]: status };
        });
    };

    const handleClearStatus = (studentId: string) => {
        setAttendanceState(prev => {
            const next = { ...prev };
            delete next[studentId];
            return next;
        });
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "present": return "حاضر";
            case "absent": return "غائب";
            case "late": return "متأخر";
            case "excused": return "معذور";
            default: return status;
        }
    };

    const getStatusCodeFromLabel = (label: string): AttendanceStatus | null => {
        if (label === "حاضر") return "present";
        if (label === "غائب") return "absent";
        if (label === "متأخر") return "late";
        if (label === "معذور") return "excused";
        return null;
    };

    const getStatusColor = (status: string | undefined) => {
        switch (status) {
            case "present": return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
            case "absent": return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200";
            case "late": return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200";
            case "excused": return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200";
            default: return "bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200";
        }
    };

    const getStatusIcon = (status: string | undefined) => {
        switch (status) {
            case "present": return <CheckCircle2 className="w-4 h-4" />;
            case "absent": return <XCircle className="w-4 h-4" />;
            case "late": return <Clock className="w-4 h-4" />;
            case "excused": return <AlertCircle className="w-4 h-4" />;
            default: return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
        }
    };

    const handleClearAll = () => {
        const newState = { ...attendanceState };
        // Remove status for filtered students
        filteredStudents.forEach(student => {
            delete newState[student.student_id];
        });
        setAttendanceState(newState);
        toast.info("تم إلغاء تحديد جميع الطلاب المعروضين");
    };

    const handleSave = async () => {
        const dateStr = format(date, 'yyyy-MM-dd');

        // We need to delete records for ALL students currently in the batch, 
        // not just the ones with a status, to properly handle "unmarking" students.
        const allStudentIds = students.map(s => s.student_id);

        if (allStudentIds.length === 0) {
            toast.warning("لا يوجد طلاب لحفظ سجلهم");
            return;
        }

        const entries = Object.entries(attendanceState);
        const recordsToSave = entries.map(([studentId, status]) => ({
            student_id: studentId,
            date: dateStr,
            status: getStatusLabel(status),
        }));

        try {
            setIsSaving(true);

            // 1. Delete ALL existing records for these students on this date
            const { error: deleteError } = await supabase
                .from('attendance_records')
                .delete()
                .eq('date', dateStr)
                .in('student_id', allStudentIds);

            if (deleteError) {
                toast.error("فشل حذف السجلات السابقة");
                throw deleteError;
            }

            // 2. Insert new records if there are any
            if (recordsToSave.length > 0) {
                const { error: insertError } = await supabase
                    .from('attendance_records')
                    .insert(recordsToSave);

                if (insertError) {
                    toast.error("فشل حفظ سجلات الحضور");
                    throw insertError;
                }
            }

            toast.success("تم حفظ سجل الحضور بنجاح");
        } catch (err) {
            console.error("Error saving attendance records:", err);
        } finally {
            setIsSaving(false);
        }
    };

    if (studentsLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const presentCount = Object.values(attendanceState).filter(s => s === "present").length;
    const absentCount = Object.values(attendanceState).filter(s => s === "absent").length;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.history.back()}
                                    className="gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                >
                                    <ArrowRight className="w-4 h-4" />
                                    رجوع
                                </Button>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-6 h-6 text-green-600" />
                                    تسجيل الحضور والغياب الجماعي
                                </CardTitle>
                            </div>
                            <CardDescription>
                                تسجيل الحضور ليوم: {format(date, "EEEE d MMMM yyyy", { locale: ar })}
                            </CardDescription>
                        </div>

                        <div className="flex items-center gap-3">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP", { locale: ar }) : <span>اختر التاريخ</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={(d) => d && setDate(d)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>

                            <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                                حفظ السجل
                            </Button>
                            <Button variant="outline" onClick={() => window.print()}>
                                طباعة
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Search and Quick Filters */}
                    <div className="mb-6">
                        <div className="relative">
                            <Users className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                placeholder="بحث عن طالب..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-green-50/50 p-4 rounded-lg border border-green-100 mb-6 space-y-3">
                        <div className="flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="bg-white hover:bg-green-50 text-green-700 border-green-200" onClick={() => handleMarkAll("present")}>
                                    <CheckCircle2 className="w-4 h-4 ml-2" />
                                    تحديد المعروض (حاضر)
                                </Button>
                                <Button size="sm" variant="outline" className="bg-white hover:bg-red-50 text-red-700 border-red-200" onClick={() => handleMarkAll("absent")}>
                                    <XCircle className="w-4 h-4 ml-2" />
                                    تحديد المعروض (غائب)
                                </Button>
                                <Button size="sm" variant="outline" className="bg-white hover:bg-gray-50 text-gray-700 border-gray-200" onClick={handleClearAll}>
                                    <RotateCcw className="w-4 h-4 ml-2" />
                                    تفريغ الكل (إلغاء التحديد)
                                </Button>
                            </div>

                            <div className="flex gap-4 text-sm font-medium">
                                <span className="text-green-700">حاضر: {presentCount}</span>
                                <span className="text-red-700">غائب: {absentCount}</span>
                                <span className="text-gray-500">غير مسجل: {students.length - Object.keys(attendanceState).length}</span>
                                <span className="text-blue-600">المعروض: {filteredStudents.length}</span>
                            </div>
                        </div>

                        {/* Batch Actions for Selected Students */}
                        {selectedStudents.size > 0 && (
                            <div className="flex flex-wrap gap-2 items-center pt-3 border-t border-green-200">
                                <span className="text-sm font-medium text-gray-700">إجراءات على المحددين ({selectedStudents.size}):</span>
                                <Button size="sm" variant="outline" className="bg-white hover:bg-green-50 text-green-700 border-green-300" onClick={() => handleMarkSelected("present")}>
                                    <CheckCircle2 className="w-3 h-3 ml-1" />
                                    حاضر
                                </Button>
                                <Button size="sm" variant="outline" className="bg-white hover:bg-red-50 text-red-700 border-red-300" onClick={() => handleMarkSelected("absent")}>
                                    <XCircle className="w-3 h-3 ml-1" />
                                    غائب
                                </Button>
                                <Button size="sm" variant="outline" className="bg-white hover:bg-yellow-50 text-yellow-700 border-yellow-300" onClick={() => handleMarkSelected("late")}>
                                    <Clock className="w-3 h-3 ml-1" />
                                    متأخر
                                </Button>
                                <Button size="sm" variant="outline" className="bg-white hover:bg-blue-50 text-blue-700 border-blue-300" onClick={() => handleMarkSelected("excused")}>
                                    <AlertCircle className="w-3 h-3 ml-1" />
                                    معذور
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Students Table */}
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-blue-50 border-b border-gray-200">
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-l border-gray-200">
                                        <input
                                            type="checkbox"
                                            checked={filteredStudents.length > 0 && filteredStudents.every(s => selectedStudents.has(s.student_id))}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-l border-gray-200">#</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-l border-gray-200">اسم الطالب</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-l border-gray-200">الفصل</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-l border-gray-200">الحالة</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">الإجراء</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                            {searchQuery ? "لا توجد نتائج للبحث" : "لا يوجد طلاب في هذا الفصل/المرحلة"}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((student, index) => (
                                        <tr key={student.student_id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-center border-l border-gray-200">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStudents.has(student.student_id)}
                                                    onChange={() => toggleSelectStudent(student.student_id)}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 border-l border-gray-200">{index + 1}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 border-l border-gray-200">{student.full_name_ar}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 border-l border-gray-200">
                                                {student.classes?.name || "غير محدد"}
                                            </td>
                                            <td className="px-4 py-3 text-center border-l border-gray-200">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "font-medium",
                                                        attendanceState[student.student_id] === "present" && "bg-green-100 text-green-800 border-green-200",
                                                        attendanceState[student.student_id] === "absent" && "bg-red-100 text-red-800 border-red-200",
                                                        attendanceState[student.student_id] === "late" && "bg-yellow-100 text-yellow-800 border-yellow-200",
                                                        attendanceState[student.student_id] === "excused" && "bg-blue-100 text-blue-800 border-blue-200",
                                                        !attendanceState[student.student_id] && "bg-gray-100 text-gray-600 border-gray-200"
                                                    )}
                                                >
                                                    {attendanceState[student.student_id] ? getStatusLabel(attendanceState[student.student_id]) : "غير محدد"}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex justify-center gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className={cn(
                                                            "h-8 w-8 p-0",
                                                            attendanceState[student.student_id] === "present" && "bg-green-100 text-green-700 hover:bg-green-200"
                                                        )}
                                                        onClick={() => handleSetStatus(student.student_id, "present")}
                                                        title="حاضر"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className={cn(
                                                            "h-8 w-8 p-0",
                                                            attendanceState[student.student_id] === "absent" && "bg-red-100 text-red-700 hover:bg-red-200"
                                                        )}
                                                        onClick={() => handleSetStatus(student.student_id, "absent")}
                                                        title="غائب"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className={cn(
                                                            "h-8 w-8 p-0",
                                                            attendanceState[student.student_id] === "late" && "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                                        )}
                                                        onClick={() => handleSetStatus(student.student_id, "late")}
                                                        title="متأخر"
                                                    >
                                                        <Clock className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className={cn(
                                                            "h-8 w-8 p-0",
                                                            attendanceState[student.student_id] === "excused" && "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                                        )}
                                                        onClick={() => handleSetStatus(student.student_id, "excused")}
                                                        title="معذور"
                                                    >
                                                        <AlertCircle className="w-4 h-4" />
                                                    </Button>

                                                    {attendanceState[student.student_id] && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                                            onClick={() => handleClearStatus(student.student_id)}
                                                            title="إلغاء الحالة"
                                                        >
                                                            <RotateCcw className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default BatchAttendancePage;
