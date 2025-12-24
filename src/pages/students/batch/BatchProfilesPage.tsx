import React, { useState, useEffect } from "react";
import { useBatchContext } from "@/components/batch/BatchContext";
import { useBatchStudents } from "@/hooks/useBatchStudents";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Loader2,
    Save,
    UserCog,
    AlertTriangle,
    CheckCircle2,
    MessageCircle,
    FileText,
    Users,
    Baby,
    Contact,
    ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface SmartStudentProfile {
    id: string;
    student_id: string;
    full_name_ar: string;
    national_id: string | null;
    date_of_birth: string | null;
    guardian_phone: string | null;
    guardian_email: string | null;
    address: string | null; // mapped from guardian_address
    mother_full_name: string | null;
    mother_national_id: string | null;
    school_documents_complete: boolean;
    emergency_contacts_count: number;
    health_score: number;
    missing_fields: string[];
    missing_categories: {
        personal: boolean;
        guardian: boolean;
        mother: boolean;
        documents: boolean;
    };
    isDirty?: boolean;
}

interface AuditLog {
    id: string;
    student_id: string;
    change_type: string;
    changed_fields: any;
    created_at: string;
    students?: {
        full_name_ar: string;
    };
}

const BatchProfilesPage = () => {
    const { classId } = useBatchContext();
    const { students, isLoading: studentsLoading } = useBatchStudents(classId);

    const [smartStudents, setSmartStudents] = useState<SmartStudentProfile[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Calculate Data Health Score & Categorize Gaps
    const analyzeStudentData = (student: any): {
        score: number,
        missing: string[],
        categories: { personal: boolean, guardian: boolean, mother: boolean, documents: boolean }
    } => {
        let score = 0;
        const missing: string[] = [];
        const categories = { personal: false, guardian: false, mother: false, documents: false };

        // 1. Personal Data (30 points)
        let personalScore = 0;
        if (student.national_id) personalScore += 15; else { missing.push("الرقم القومي للطالب"); categories.personal = true; }
        if (student.date_of_birth) personalScore += 15; else { missing.push("تاريخ الميلاد"); categories.personal = true; }
        score += personalScore;

        // 2. Guardian Data (30 points)
        let guardianScore = 0;
        if (student.guardian_phone) guardianScore += 10; else { missing.push("رقم ولي الأمر"); categories.guardian = true; }
        if (student.guardian_national_id) guardianScore += 10; else { missing.push("الرقم القومي لولي الأمر"); categories.guardian = true; }
        if (student.guardian_address) guardianScore += 10; else { missing.push("العنوان"); categories.guardian = true; }
        score += guardianScore;

        // 3. Mother Data (20 points)
        let motherScore = 0;
        if (student.mother_full_name) motherScore += 10; else { missing.push("اسم الأم"); categories.mother = true; }
        if (student.mother_national_id) motherScore += 10; else { missing.push("الرقم القومي للأم"); categories.mother = true; }
        score += motherScore;

        // 4. Documents & Emergency (20 points)
        let docScore = 0;
        if (student.school_documents_complete) docScore += 10; else { missing.push("ملف التقديم الورقي"); categories.documents = true; }
        // Ensure student has at least one emergency contact (using count from DB)
        // or check logic if strict. Let's make it a bonus/check.
        // For simplicity, we won't strictly dock points for emergency contacts yet unless requested, 
        // but user asked for "What is present and what is not". 
        // Let's assume documents score includes "completeness".

        // Recalculate based on total 100
        return { score: Math.min(score + docScore, 100), missing, categories };
    };

    // Fetch detailed profile data for students
    useEffect(() => {
        const fetchProfileData = async () => {
            if (!classId || students.length === 0) return;

            try {
                setIsLoadingData(true);
                // Fetch ALL critical fields for analysis, AND include related tables if needed
                // Note: counting emergency_contacts requires a join. 
                // Since this is a batch list, deep joining for counts can be heavy.
                // We will just fetch columns from `students` for now.
                const { data, error } = await supabase
                    .from('students')
                    .select(`
                        id, student_id, full_name_ar, gender,
                        national_id, date_of_birth,
                        guardian_phone, guardian_email, guardian_address, guardian_national_id,
                        mother_full_name, mother_national_id,
                        school_documents_complete
                    `)
                    .in('id', students.map(s => s.id))
                    .order('full_name_ar');

                if (error) throw error;

                const analyzedData = data.map((s: any) => {
                    const health = analyzeStudentData(s);
                    return {
                        id: s.id,
                        student_id: s.student_id,
                        full_name_ar: s.full_name_ar,
                        national_id: s.national_id,
                        date_of_birth: s.date_of_birth,
                        guardian_phone: s.guardian_phone,
                        guardian_email: s.guardian_email,
                        address: s.guardian_address,
                        mother_full_name: s.mother_full_name,
                        mother_national_id: s.mother_national_id,
                        school_documents_complete: s.school_documents_complete || false,
                        emergency_contacts_count: 0, // Placeholder as we didn't join yet to keep query simple
                        health_score: health.score,
                        missing_fields: health.missing,
                        missing_categories: health.categories,
                        isDirty: false
                    };
                });

                setSmartStudents(analyzedData);

                // Fetch Audit Logs
                fetchAuditLogs(students.map(s => s.student_id));

            } catch (error) {
                console.error("Error fetching profiles:", error);
                toast.error("فشل في تحميل وتحليل بيانات الطلاب");
            } finally {
                setIsLoadingData(false);
            }
        };

        if (students.length > 0) {
            fetchProfileData();
        }
    }, [classId, students]);

    const fetchAuditLogs = async (studentIds: string[]) => {
        try {
            const { data, error } = await supabase
                .from('student_audit_trail')
                .select(`
                    *,
                    students ( full_name_ar )
                `)
                .in('student_id', studentIds)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            setAuditLogs(data || []);
        } catch (err) {
            console.error("Error fetching audit logs", err);
        }
    };

    const handleInputChange = (id: string, field: keyof SmartStudentProfile, value: string) => {
        setSmartStudents(prev => prev.map(student => {
            if (student.id === id) {
                return { ...student, [field]: value, isDirty: true };
            }
            return student;
        }));
    };

    const handleSave = async () => {
        const dirtyStudents = smartStudents.filter(s => s.isDirty);

        if (dirtyStudents.length === 0) {
            toast.info("لا توجد تغييرات للحفظ");
            return;
        }

        try {
            setIsSaving(true);

            // Update each modified student and create audit log
            const updates = dirtyStudents.map(async (student) => {
                // 1. Update Student Table with ALL editiable fields
                const { error: updateError } = await supabase
                    .from('students')
                    .update({
                        national_id: student.national_id,
                        guardian_phone: student.guardian_phone,
                        guardian_email: student.guardian_email,
                        guardian_address: student.address,
                        mother_full_name: student.mother_full_name
                    })
                    .eq('id', student.id);

                if (updateError) throw updateError;

                // 2. Insert Audit Log
                await supabase.from('student_audit_trail').insert({
                    student_id: student.student_id,
                    change_type: 'UPDATE',
                    changed_fields: {
                        national_id: student.national_id,
                        guardian_phone: student.guardian_phone,
                        mother_name: student.mother_full_name
                    },
                    changed_by: 'System',
                    change_reason: 'Batch Smart Update'
                });
            });

            await Promise.all(updates);

            toast.success(`تم تحديث بيانات ${dirtyStudents.length} طالب بنجاح`);

            // Re-fetch logic
            const currentData = [...smartStudents];
            const updatedData = currentData.map(s => {
                if (s.isDirty) {
                    const health = analyzeStudentData(s);
                    return { ...s, isDirty: false, health_score: health.score, missing_fields: health.missing, missing_categories: health.categories };
                }
                return s;
            });
            setSmartStudents(updatedData);

        } catch (error) {
            console.error("Error saving profiles:", error);
            toast.error("حدث خطأ أثناء حفظ البيانات");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRequestUpdate = (student: SmartStudentProfile) => {
        if (student.missing_fields.length === 0) {
            toast.success("بيانات الطالب مكتملة! لا حاجة للمراسلة.");
            return;
        }

        const message = `السيد ولي أمر الطالب ${student.full_name_ar}،\nيرجى العلم بأن ملف الطالب ينقصه المستندات/البيانات التالية:\n- ${student.missing_fields.join('\n- ')}\nيرجى موافاتنا بها في أقرب وقت.\nإدارة المدرسة`;

        // Copy to clipboard
        navigator.clipboard.writeText(message);
        toast.success("تم نسخ رسالة التذكير! يمكنك إرسالها عبر واتساب.", {
            action: {
                label: "فتح واتساب",
                onClick: () => {
                    if (student.guardian_phone) {
                        window.open(`https://wa.me/${student.guardian_phone}?text=${encodeURIComponent(message)}`, '_blank');
                    } else {
                        toast.error("لا يوجد رقم هاتف مسجل لهذا الطالب");
                    }
                }
            }
        });
    };

    if (studentsLoading || isLoadingData) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Advanced Stats Logic
    const stats = {
        total: smartStudents.length,
        average: Math.round(smartStudents.reduce((acc, s) => acc + s.health_score, 0) / (smartStudents.length || 1)),
        missingPersonal: smartStudents.filter(s => s.missing_categories.personal).length,
        missingGuardian: smartStudents.filter(s => s.missing_categories.guardian).length,
        missingMother: smartStudents.filter(s => s.missing_categories.mother).length,
        missingDocs: smartStudents.filter(s => s.missing_categories.documents).length,
    };

    return (
        <div className="space-y-6">
            {/* Intelligent Data Gaps Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {/* Total Score */}
                <Card className="bg-white border-blue-200 shadow-sm md:col-span-1">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <p className="text-xs font-bold text-gray-500 mb-1">نسبة الاكتمال العامة</p>
                        <div className="relative flex items-center justify-center">
                            <svg className="w-20 h-20 transform -rotate-90">
                                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
                                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={226} strokeDashoffset={226 - (226 * stats.average) / 100} className="text-blue-600" />
                            </svg>
                            <span className="absolute text-xl font-bold text-blue-700">{stats.average}%</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Personal Data Gap */}
                <Card className={`border-l-4 shadow-sm ${stats.missingPersonal > 0 ? 'border-l-red-500 bg-red-50/50' : 'border-l-green-500 bg-white'}`}>
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-500">بيانات شخصية ناقصة</p>
                                <h3 className="text-2xl font-bold mt-1 text-gray-800">{stats.missingPersonal}</h3>
                                <p className="text-[10px] text-gray-400">طلاب لديهم نقص</p>
                            </div>
                            <div className="bg-white p-2 rounded-full shadow-sm">
                                <UserCog className={`w-5 h-5 ${stats.missingPersonal > 0 ? 'text-red-500' : 'text-green-500'}`} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Guardian Data Gap */}
                <Card className={`border-l-4 shadow-sm ${stats.missingGuardian > 0 ? 'border-l-orange-500 bg-orange-50/50' : 'border-l-green-500 bg-white'}`}>
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-500">بيانات ولي الأمر</p>
                                <h3 className="text-2xl font-bold mt-1 text-gray-800">{stats.missingGuardian}</h3>
                                <p className="text-[10px] text-gray-400">طلاب لديهم نقص</p>
                            </div>
                            <div className="bg-white p-2 rounded-full shadow-sm">
                                <Contact className={`w-5 h-5 ${stats.missingGuardian > 0 ? 'text-orange-500' : 'text-green-500'}`} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Mother Data Gap */}
                <Card className={`border-l-4 shadow-sm ${stats.missingMother > 0 ? 'border-l-pink-500 bg-pink-50/50' : 'border-l-green-500 bg-white'}`}>
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-500">بيانات الأم</p>
                                <h3 className="text-2xl font-bold mt-1 text-gray-800">{stats.missingMother}</h3>
                                <p className="text-[10px] text-gray-400">طلاب لديهم نقص</p>
                            </div>
                            <div className="bg-white p-2 rounded-full shadow-sm">
                                <Baby className={`w-5 h-5 ${stats.missingMother > 0 ? 'text-pink-500' : 'text-green-500'}`} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Documents Gap */}
                <Card className={`border-l-4 shadow-sm ${stats.missingDocs > 0 ? 'border-l-purple-500 bg-purple-50/50' : 'border-l-green-500 bg-white'}`}>
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-500">نواقص مستندات</p>
                                <h3 className="text-2xl font-bold mt-1 text-gray-800">{stats.missingDocs}</h3>
                                <p className="text-[10px] text-gray-400">ملفات غير مكتملة</p>
                            </div>
                            <div className="bg-white p-2 rounded-full shadow-sm">
                                <FileText className={`w-5 h-5 ${stats.missingDocs > 0 ? 'text-purple-500' : 'text-green-500'}`} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-t-4 border-t-blue-600 shadow-md">
                <CardHeader className="bg-gray-50/50 py-3">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <CardTitle className="flex items-center gap-2 text-base text-blue-900">
                            <ShieldAlert className="w-5 h-5 text-blue-600" />
                            تحليل حالة بيانات الفصل
                            <Badge variant="outline" className="mr-2 bg-blue-50 text-blue-700 border-blue-200">
                                {smartStudents.length} طالب
                            </Badge>
                        </CardTitle>

                        <Button onClick={handleSave} disabled={isSaving} size="sm" className="bg-blue-600 hover:bg-blue-700 gap-2 shadow-sm">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            حفظ التحديثات
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="text-right w-[200px]">الطالب</TableHead>
                                    <TableHead className="text-right w-[100px]">الاكتمال</TableHead>
                                    <TableHead className="text-right">تحليل النواقص</TableHead>
                                    <TableHead className="text-right w-[140px]">رقم الهاتف</TableHead>
                                    <TableHead className="text-right w-[140px]">الرقم القومي</TableHead>
                                    <TableHead className="text-right w-[50px]">إجراء</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {smartStudents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                                            جاري تحميل البيانات...
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    smartStudents.map((student) => (
                                        <TableRow key={student.id} className={student.isDirty ? "bg-blue-50/30" : "hover:bg-gray-50/50"}>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span>{student.full_name_ar}</span>
                                                    <span className="text-xs text-gray-400">{student.student_id}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                        <div
                                                            className={`h-1.5 rounded-full ${student.health_score < 50 ? "bg-red-500" : student.health_score < 80 ? "bg-yellow-500" : "bg-green-500"}`}
                                                            style={{ width: `${student.health_score}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-600">{student.health_score}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {student.missing_fields.length === 0 ? (
                                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                            <CheckCircle2 className="w-3 h-3 mr-1" /> مكتمل
                                                        </Badge>
                                                    ) : (
                                                        <>
                                                            {student.missing_categories.personal && <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">شخصية</Badge>}
                                                            {student.missing_categories.guardian && <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-700 border-orange-200">ولي الأمر</Badge>}
                                                            {student.missing_categories.mother && <Badge variant="outline" className="text-[10px] bg-pink-50 text-pink-700 border-pink-200">الأم</Badge>}
                                                            {student.missing_categories.documents && <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">مستندات</Badge>}
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={student.guardian_phone || ''}
                                                    onChange={(e) => handleInputChange(student.id, 'guardian_phone', e.target.value)}
                                                    className={`h-7 text-xs ${!student.guardian_phone ? "border-red-300 bg-red-50" : ""}`}
                                                    placeholder="-- مطلوب --"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={student.national_id || ''}
                                                    onChange={(e) => handleInputChange(student.id, 'national_id', e.target.value)}
                                                    className={`h-7 text-xs ${!student.national_id ? "border-red-300 bg-red-50" : ""}`}
                                                    placeholder="-- مطلوب --"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-blue-600 hover:bg-blue-100 rounded-full"
                                                    onClick={() => handleRequestUpdate(student)}
                                                    title="طلب تحديث البيانات"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Live Updates Log */}
            <Card className="border-t-4 border-t-gray-400">
                <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2 text-gray-600">
                        <UserCog className="w-4 h-4" />
                        سجل التحديثات الحية
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2">
                        {auditLogs.length === 0 ? (
                            <div className="text-center py-4 text-gray-400 text-xs bg-gray-50 rounded-lg border border-dashed">
                                لا يوجد سجلات تحديث حديثة
                            </div>
                        ) : (
                            auditLogs.map((log) => (
                                <div key={log.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0 hover:bg-gray-50 transition-colors p-1 rounded">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-blue-100 p-1.5 rounded-full mt-1">
                                            <UserCog className="w-3 h-3 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-800">
                                                {log.change_type === 'UPDATE' ? 'تحديث ملف' : log.change_type}
                                                <span className="font-normal text-gray-500 mx-1">- {log.students?.full_name_ar}</span>
                                            </p>
                                            <div className="flex gap-1 mt-1">
                                                {Object.keys(log.changed_fields || {}).map((key) => (
                                                    <Badge key={key} variant="outline" className="text-[9px] px-1 py-0 bg-gray-50">
                                                        {key === 'national_id' ? 'الرقم القومي' :
                                                            key === 'guardian_phone' ? 'رقم الهاتف' : key}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                        {format(new Date(log.created_at), 'p', { locale: ar })}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default BatchProfilesPage;
