import React, { useState, useEffect } from "react";
import { useBatchContext } from "@/components/batch/BatchContext";
import { useBatchStudents } from "@/hooks/useBatchStudents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2, Send, MessageSquare, Users, History, AlertCircle, Mail, Save, User, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { StudentNameLink } from "@/components/StudentProfile/StudentNameLink";

const TEMPLATES = [
    { id: "absence", title: "تنبيه غياب", subject: "تنبيه غياب طالب", body: "السيد ولي أمر الطالب {{student.name}}، نحيطكم علماً بأن الطالب تغيب اليوم عن المدرسة. يرجى التواصل معنا." },
    { id: "exam", title: "موعد اختبار", subject: "تذكير بموعد اختبار", body: "عزيزي الطالب {{student.name}}، نذكرك بموعد اختبار مادة [المادة] يوم [اليوم]. بالتوفيق." },
    { id: "meeting", title: "اجتماع أولياء أمور", subject: "دعوة لاجتماع", body: "ندعوكم لحضور اجتماع أولياء الأمور يوم [التاريخ] لمناقشة مستوى الطالب {{student.name}}." },
    { id: "general", title: "رسالة عامة", subject: "", body: "" },
];

interface NotificationLog {
    id: string;
    created_at: string;
    type: 'internal' | 'whatsapp';
    status: string;
    title?: string;
    content: string;
    student_id: string;
    students?: {
        full_name_ar: string;
        guardian_full_name: string;
        guardian_phone?: string;
    };
}

const BatchNotificationsPage = () => {
    const { classId, stageId } = useBatchContext();
    const { students, isLoading: studentsLoading } = useBatchStudents(classId, stageId);

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
    const [messageType, setMessageType] = useState<string>("internal"); // internal | whatsapp
    const [recipientType, setRecipientType] = useState<string>("guardian");
    const [subject, setSubject] = useState("");
    const [messageBody, setMessageBody] = useState("");
    const [isSending, setIsSending] = useState(false);

    // History
    const [history, setHistory] = useState<NotificationLog[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Editable Contact Info
    const [contactInfo, setContactInfo] = useState<Record<string, { email: string; phone: string }>>({});

    useEffect(() => {
        if (students.length > 0) {
            const info: Record<string, { email: string; phone: string }> = {};
            students.forEach(s => {
                info[s.id] = {
                    email: s.guardian_email || s.mother_email || "",
                    phone: s.guardian_phone || ""
                };
            });
            setContactInfo(info);
        }
    }, [students]);

    const handleContactUpdate = (id: string, field: 'email' | 'phone', value: string) => {
        setContactInfo(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    };

    const saveContactInfo = async (studentId: string) => {
        const info = contactInfo[studentId];
        if (!info) return;

        try {
            const { error } = await supabase
                .from('students')
                .update({
                    guardian_email: info.email,
                    guardian_phone: info.phone
                })
                .eq('id', studentId);

            if (error) throw error;
            toast.success("تم تحديث بيانات الاتصال بنجاح");
        } catch (err) {
            console.error(err);
            toast.error("فشل تحديث البيانات");
        }
    };

    useEffect(() => {
        if (students.length > 0) {
            fetchHistory();
        }
    }, [students]);

    const fetchHistory = async () => {
        try {
            setHistoryLoading(true);
            const studentIds = students.map(s => s.student_id);
            if (studentIds.length === 0) return;

            const { data, error } = await supabase
                .from('notifications')
                .select(`
                    *,
                    students (
                        full_name_ar,
                        guardian_full_name,
                        guardian_phone
                    )
                `)
                .in('student_id', studentIds)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setHistory(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setHistoryLoading(false);
        }
    };

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

    const applyTemplate = (templateId: string) => {
        const template = TEMPLATES.find(t => t.id === templateId);
        if (template) {
            setSubject(template.subject);
            setMessageBody(template.body);
        }
    };

    const handleSend = async () => {
        if (selectedStudents.length === 0) {
            toast.error("يرجى اختيار مستلمين");
            return;
        }
        if (!messageBody) {
            toast.error("يرجى إدخال نص الرسالة");
            return;
        }
        if (messageType === 'internal' && !subject) {
            toast.error("يرجى إدخال عنوان الرسالة");
            return;
        }

        if (messageType === 'whatsapp' && selectedStudents.length > 1) {
            toast.error("عذراً، إرسال واتساب الجماعي غير مدعوم حالياً. يرجى الإرسال لطالب واحد فقط أو استخدام الرسائل الداخلية.");
            return;
        }

        try {
            setIsSending(true);

            // Fetch selected students details
            const targets = students.filter(s => selectedStudents.includes(s.id));

            if (messageType === 'whatsapp') {
                // Handling Single WhatsApp (Manual Trigger)
                const target = targets[0];
                const phone = contactInfo[target.id]?.phone || target.guardian_phone || "";

                if (!phone) {
                    toast.error("لا يوجد رقم هاتف مسجل لهذا الطالب");
                    return;
                }

                const dbLog = {
                    student_id: target.student_id,
                    type: 'whatsapp',
                    content: messageBody.replace("{{student.name}}", target.full_name_ar),
                    status: 'wa_opened',
                    created_by: 'System'
                };

                const { error } = await supabase.from('notifications').insert(dbLog);
                if (error) throw error;

                const encodedMessage = encodeURIComponent(messageBody.replace("{{student.name}}", target.full_name_ar));
                const url = `https://wa.me/${phone}?text=${encodedMessage}`;
                window.open(url, '_blank');
                toast.success("تم فتح واتساب وتسجيل المحاولة");

            } else if (messageType === 'email') {
                // Email Handling (Mailto)
                const validRecipients = targets.filter(s => contactInfo[s.id]?.email);

                if (validRecipients.length === 0) {
                    toast.error("لا توجد عناوين بريد إلكتروني صالحة للطلاب المحددين");
                    return;
                }

                const emails = validRecipients.map(s => contactInfo[s.id].email).join(',');
                const mailSubject = encodeURIComponent(subject);
                const mailBody = encodeURIComponent(messageBody);

                // Log to DB
                const notifications = validRecipients.map(student => ({
                    student_id: student.student_id,
                    type: 'internal',
                    title: `Email: ${subject}`,
                    content: messageBody.replace("{{student.name}}", student.full_name_ar),
                    status: 'email_sent',
                    created_by: 'System'
                }));

                const { error } = await supabase.from('notifications').insert(notifications);
                if (error) console.error("Error logging emails", error);

                // Open Mail Client
                window.location.href = `mailto:?bcc=${emails}&subject=${mailSubject}&body=${mailBody}`;
                toast.success(`تم فتح برنامج البريد الإلكتروني لـ ${validRecipients.length} مستلم`);

                // Clear
                setSubject("");
                setMessageBody("");
                setSelectedStudents([]);

            } else {
                // Internal Message Batch
                const notifications = targets.map(student => ({
                    student_id: student.student_id,
                    type: 'internal',
                    title: subject,
                    content: messageBody.replace("{{student.name}}", student.full_name_ar),
                    status: 'sent',
                    created_by: 'System'
                }));

                const { error } = await supabase.from('notifications').insert(notifications);
                if (error) throw error;

                toast.success(`تم إرسال الرسالة إلى ${selectedStudents.length} مستلم بنجاح`);
                // Clear form
                setSubject("");
                setMessageBody("");
                setSelectedStudents([]);
            }

            // Refresh history
            fetchHistory();

        } catch (error) {
            console.error("Error sending notifications:", error);
            toast.error("حدث خطأ أثناء إرسال الرسائل");
        } finally {
            setIsSending(false);
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
        <div className="space-y-6">
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

            {/* Floating Selection Bar */}
            {selectedStudents.length > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className="flex items-center gap-2">
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">{selectedStudents.length}</span>
                        <span className="text-sm font-medium">طالب محدد</span>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Message Composer */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-purple-600" />
                                إنشاء رسالة جديدة
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">نوع الرسالة</label>
                                <Select value={messageType} onValueChange={setMessageType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="internal">إشعار داخلي (نظام)</SelectItem>
                                        <SelectItem value="email">بريد إلكتروني (E-mail)</SelectItem>
                                        <SelectItem value="whatsapp">واتساب (فردي فقط)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">قالب جاهز</label>
                                <Select onValueChange={applyTemplate}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر قالب..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TEMPLATES.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {(messageType === 'internal' || messageType === 'email') && (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium">عنوان الرسالة</label>
                                        <span className="text-xs text-green-600">✓ بدون حد</span>
                                    </div>
                                    <Input
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder={messageType === 'email' ? "موضوع الإيميل" : "مثال: تنبيه هام"}
                                        className="text-base"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">نص الرسالة</label>
                                <Textarea
                                    value={messageBody}
                                    onChange={(e) => setMessageBody(e.target.value)}
                                    placeholder="اكتب نص الرسالة هنا... يمكنك كتابة نص طويل بدون حد أقصى"
                                    rows={12}
                                    className="resize-y min-h-[200px]"
                                />
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-gray-500">
                                        المتغيرات: {"{{student.name}}"}
                                    </p>
                                    <p className="text-xs text-green-600 font-medium">
                                        ✓ لا يوجد حد أقصى لعدد الكلمات أو الأحرف
                                    </p>
                                </div>
                            </div>

                            {messageType === 'whatsapp' && selectedStudents.length > 1 && (
                                <div className="bg-yellow-50 p-2 text-xs text-yellow-800 rounded flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 mt-0.5" />
                                    <span>تنبيه: لا يمكن إرسال واتساب لعدة طلاب دفعة واحدة. يرجى اختيار طالب واحد.</span>
                                </div>
                            )}

                            <Button
                                onClick={handleSend}
                                disabled={isSending || selectedStudents.length === 0 || (messageType === 'whatsapp' && selectedStudents.length > 1)}
                                className="w-full bg-purple-600 hover:bg-purple-700"
                            >
                                {isSending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Send className="w-4 h-4 ml-2" />}
                                إرسال ({selectedStudents.length})
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Recipients & History */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Recipients List */}
                    <Card className="h-[300px] flex flex-col">
                        <CardHeader className="py-3">
                            <CardTitle className="flex items-center justify-between text-base">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-gray-600" />
                                    قائمة الطلاب ({students.length})
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={selectedStudents.length > 0 ? "default" : "secondary"}>
                                        {selectedStudents.length} محدد
                                    </Badge>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto p-0">
                            <div className="border-t">
                                <Table>
                                    <TableHeader className="bg-gray-50/50">
                                        <TableRow className="h-10 hover:bg-transparent">
                                            <TableHead className="w-[50px]">
                                                <Checkbox
                                                    checked={
                                                        students.length > 0 && selectedStudents.length === students.length
                                                            ? true
                                                            : selectedStudents.length > 0
                                                                ? "indeterminate"
                                                                : false
                                                    }
                                                    onCheckedChange={(checked) => handleSelectAll(checked === true)}
                                                />
                                            </TableHead>
                                            <TableHead className="text-right py-2">اسم الطالب</TableHead>
                                            <TableHead className="text-right py-2 w-[180px]">رقم الهاتف</TableHead>
                                            <TableHead className="text-right py-2 w-[250px]">البريد الإلكتروني</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {students.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                                    لا يوجد طلاب
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            students.map((student: any) => (
                                                <TableRow key={student.id} className={`h-12 ${selectedStudents.includes(student.id) ? "bg-purple-50" : ""}`}>
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedStudents.includes(student.id)}
                                                            onCheckedChange={(checked) => handleSelectStudent(student.id, checked === true)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-medium py-2 text-sm">
                                                        <StudentNameLink
                                                            studentId={student.student_id}
                                                            studentName={student.full_name_ar}
                                                            className="text-blue-600 hover:underline"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="py-2">
                                                        <div className="flex items-center gap-1">
                                                            <Input
                                                                className="h-8 text-xs font-mono dir-ltr text-right w-full"
                                                                value={contactInfo[student.id]?.phone || ""}
                                                                onChange={(e) => handleContactUpdate(student.id, 'phone', e.target.value)}
                                                                placeholder="رقم الهاتف"
                                                            />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-2">
                                                        <div className="flex items-center gap-1">
                                                            <Input
                                                                className="h-8 text-xs font-mono dir-ltr text-right w-full"
                                                                value={contactInfo[student.id]?.email || ""}
                                                                onChange={(e) => handleContactUpdate(student.id, 'email', e.target.value)}
                                                                placeholder="البريد الإلكتروني"
                                                            />
                                                            {(contactInfo[student.id]?.email !== (student.guardian_email || student.mother_email) ||
                                                                contactInfo[student.id]?.phone !== student.guardian_phone) && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                        onClick={() => saveContactInfo(student.id)}
                                                                        title="حفظ التعديلات"
                                                                    >
                                                                        <Save className="w-4 h-4" />
                                                                    </Button>
                                                                )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notifications History */}
                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <History className="w-4 h-4 text-gray-500" />
                                سجل الإشعارات للفصل
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="border-t">
                                <Table>
                                    <TableHeader className="bg-gray-50/50">
                                        <TableRow className="h-10">
                                            <TableHead className="text-right">التاريخ</TableHead>
                                            <TableHead className="text-right">الطالب</TableHead>
                                            <TableHead className="text-right">النوع</TableHead>
                                            <TableHead className="text-right">العنوان / المحتوى</TableHead>
                                            <TableHead className="text-right">الحالة</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {historyLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8">
                                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                                </TableCell>
                                            </TableRow>
                                        ) : history.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                                                    لا توجد إشعارات سابقة
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            history.map((log) => (
                                                <TableRow key={log.id} className="h-12">
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {format(new Date(log.created_at), 'dd/MM/yyyy p', { locale: ar })}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-sm">
                                                        {log.students?.full_name_ar}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={log.type === 'whatsapp' ? 'secondary' : 'default'} className="text-xs">
                                                            {log.type === 'whatsapp' ? 'واتساب' : 'داخلي'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px] truncate text-sm" title={log.content}>
                                                        {log.type === 'internal' ? (
                                                            <span className="font-semibold block text-xs">{log.title}</span>
                                                        ) : null}
                                                        <span className="text-muted-foreground text-xs">{log.content}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {log.status === 'wa_opened' ? (
                                                            <span className="text-green-600 text-xs">تم الفتح</span>
                                                        ) : log.status === 'email_sent' ? (
                                                            <span className="text-purple-600 text-xs">إيميل</span>
                                                        ) : (
                                                            <span className="text-blue-600 text-xs">تم اﻹرسال</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default BatchNotificationsPage;
