import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send, Phone, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface MessageModalProps {
    studentId: string;
    studentName: string;
    parentPhone: string;
    parentName?: string;
    trigger?: React.ReactNode;
}

const TEMPLATES = [
    { id: "absence", title: "تنبيه غياب", text: "السيد ولي أمر الطالب {{student.name}}، نحيطكم علماً بأن الطالب تغيب اليوم عن المدرسة. يرجى التواصل معنا." },
    { id: "exam", title: "تذكير اختبار", text: "عزيزي ولي الأمر، نود تذكيركم بموعد اختبار مادة [المادة] للطالب {{student.name}} غداً." },
    { id: "meeting", title: "اجتماع", text: "ندعوكم لحضور اجتماع أولياء الأمور يوم [التاريخ] لمناقشة مستوى الطالب {{student.name}}." },
    { id: "general", title: "عام", text: "" },
];

export const MessageModal: React.FC<MessageModalProps> = ({
    studentId,
    studentName,
    parentPhone,
    parentName,
    trigger
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("whatsapp");
    const [message, setMessage] = useState("");
    const [subject, setSubject] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Editable phone state
    const [targetPhone, setTargetPhone] = useState(parentPhone);

    // Smart formatting on init
    useEffect(() => {
        if (parentPhone) {
            setTargetPhone(formatEgyptianPhone(parentPhone));
        }
    }, [parentPhone, isOpen]);

    const formatEgyptianPhone = (phone: string) => {
        let clean = phone.replace(/\D/g, ''); // Remove non-digits

        // If empty
        if (!clean) return "";

        // If starts with 01 (e.g., 011, 010, 012, 015) -> convert to 201...
        if (clean.startsWith("01")) {
            return "2" + clean;
        }

        // If clean is already 12 digits starting with 20... assume correct
        if (clean.startsWith("20") && clean.length === 12) {
            return clean;
        }

        // If just 10 digits starting with 1 (incomplete local without 0) -> add 20
        if (clean.startsWith("1") && clean.length === 10) {
            return "20" + clean;
        }

        return clean; // Return as is if we can't guess
    };

    const handleTemplateChange = (templateId: string) => {
        const template = TEMPLATES.find(t => t.id === templateId);
        if (template) {
            let text = template.text.replace("{{student.name}}", studentName);
            setMessage(text);
            if (activeTab === 'internal') {
                setSubject(template.title);
            }
        }
    };

    const handleSendInternal = async () => {
        if (!message || !subject) {
            toast.error("يرجى إدخال العنوان ونص الرسالة");
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.from('notifications').insert({
                student_id: studentId,
                type: 'internal',
                title: subject,
                content: message,
                status: 'sent',
                created_by: 'System'
            });

            if (error) throw error;

            toast.success("تم إرسال الإشعار الداخلي بنجاح");
            setIsOpen(false);
            setMessage("");
            setSubject("");
        } catch (err) {
            console.error(err);
            toast.error("فشل إرسال الإشعار");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenWhatsApp = async () => {
        if (!message) {
            toast.error("يرجى كتابة نص الرسالة");
            return;
        }

        const finalPhone = targetPhone.replace(/\D/g, '');

        // Basic length validation (Egyptian numbers are usually 12 digits with country code)
        // Allowing broader range just in case, but warning via toast if weird
        if (finalPhone.length < 10) {
            toast.error("رقم الهاتف يبدو غير صحيح (قصير جداً)");
            return;
        }

        setIsLoading(true);
        try {
            // Log the attempt
            const { error } = await supabase.from('notifications').insert({
                student_id: studentId,
                type: 'whatsapp',
                content: message,
                phone_number: finalPhone,
                status: 'whatsapp_opened',
                created_by: 'System'
            });

            if (error) console.error("Log error:", error);

            // Construct URL
            const encodedMessage = encodeURIComponent(message);
            const url = `https://wa.me/${finalPhone}?text=${encodedMessage}`;

            // Open WhatsApp
            window.open(url, '_blank');
            setIsOpen(false);
        } catch (err) {
            console.error(err);
            toast.error("حدث خطأ ما");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                        <MessageSquare className="w-4 h-4" />
                        تواصل
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>تواصل مع ولي أمر: {studentName}</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="whatsapp" className="gap-2">
                            <Phone className="w-4 h-4" />
                            واتساب
                        </TabsTrigger>
                        <TabsTrigger value="internal" className="gap-2">
                            <MessageSquare className="w-4 h-4" />
                            إشعار داخلي
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">قالب جاهز</label>
                            <Select onValueChange={handleTemplateChange}>
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

                        {activeTab === 'internal' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">عنوان الإشعار</label>
                                <Input
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="عنوان الرسالة..."
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {activeTab === 'whatsapp' ? 'نص رسالة واتساب' : 'محتوى الإشعار'}
                            </label>
                            <Textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={6}
                                placeholder="اكتب رسالتك هنا..."
                            />
                        </div>

                        {activeTab === 'whatsapp' && (
                            <div className="space-y-2 bg-green-50 p-3 rounded border border-green-100">
                                <label className="text-xs font-semibold text-green-800 block mb-1">
                                    رقم الهاتف المرسل إليه (واتساب)
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        value={targetPhone}
                                        onChange={(e) => setTargetPhone(e.target.value)}
                                        className="bg-white h-9 dir-ltr font-mono"
                                        placeholder="201xxxxxxxxx"
                                    />
                                </div>
                                <p className="text-[10px] text-green-700 mt-1">
                                    * تأكد من وجود كود الدولة (20 لمصر) قبل الرقم. يمكنك تعديل الرقم هنا لهذه الرسالة فقط.
                                </p>
                            </div>
                        )}

                        <Button
                            onClick={activeTab === 'whatsapp' ? handleOpenWhatsApp : handleSendInternal}
                            className={`w-full ${activeTab === 'whatsapp' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                            disabled={isLoading}
                        >
                            {isLoading ? "جاري المعالجة..." : (activeTab === 'whatsapp' ? "فتح واتساب" : "إرسال إشعار")}
                        </Button>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};
