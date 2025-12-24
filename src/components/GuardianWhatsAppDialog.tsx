import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { MessageCircle, Send, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

// تعريف العلاقة بين تصنيف القالب ورمز نوع الإشعار
const CATEGORY_TO_TYPE_CODE: Record<string, string> = {
    'عام': 'general',
    'مالي': 'financial',
    'إداري': 'administrative',
    'حضور': 'attendance',
    'سلوك': 'behavioral',
    'أكاديمي': 'academic',
};

export const COUNTRY_CODES: Record<string, string> = {
    'مصري': '20', 'سعودي': '966', 'إماراتي': '971', 'كويتي': '965',
    'قطري': '974', 'بحريني': '973', 'عماني': '968', 'يمني': '967',
    'أردني': '962', 'لبناني': '961', 'سوري': '963', 'عراقي': '964',
    'فلسطيني': '970', 'سوداني': '249', 'ليبي': '218', 'تونسي': '216',
    'جزائري': '213', 'مغربي': '212',
};

export function formatPhoneNumber(phone: string, nationality: string = 'مصري'): string {
    if (!phone) return '';
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length <= 10 && cleanPhone.startsWith('0')) {
        cleanPhone = cleanPhone.substring(1);
    }
    const countryCode = COUNTRY_CODES[nationality] || '20';
    return cleanPhone.length > 10 ? cleanPhone : countryCode + cleanPhone;
}

// دالة مساعدة للحصول على notification_type_id
async function getNotificationTypeId(category: string): Promise<string | null> {
    const typeCode = CATEGORY_TO_TYPE_CODE[category] || 'general';
    const { data } = await supabase
        .from('notification_types')
        .select('id')
        .eq('type_code', typeCode)
        .single();
    return data?.id || null;
}

// قوالب رسائل المعاملات - ديناميكية ومرنة
export const TRANSACTION_TEMPLATES = [
    {
        id: 'verification',
        category: 'عام',
        title: '🔐 التحقق من الهوية',
        message: `السلام عليكم ورحمة الله وبركاته

السيد/ة {{guardian_name}}،
ولي أمر الطالب/ة: {{student_name}}

نحيطكم علماً بأن شخصاً يدعي أنه مخول بإجراء معاملات نيابة عن الطالب/ة المذكور.

يرجى الرد على هذه الرسالة لتأكيد أنكم على علم بهذه المعاملة أو التواصل معنا فوراً في حالة عدم معرفتكم.

مع تحيات إدارة المدرسة 🏫`
    },
    {
        id: 'payment_received',
        category: 'مالي',
        title: '💰 تأكيد دفعة مالية',
        message: `السلام عليكم ورحمة الله وبركاته

السيد/ة {{guardian_name}}،
ولي أمر الطالب/ة: {{student_name}}

نحيطكم علماً بأنه تم استلام دفعة مالية.

📅 التاريخ: {{date}}
💳 المبلغ: [المبلغ] جنيه
📝 البيان: [القسط الأول/القسط الثاني/رسوم إضافية]

شكراً لثقتكم بنا.
مع تحيات إدارة المدرسة 🏫`
    },
    {
        id: 'payment_reminder',
        category: 'مالي',
        title: '⏰ تذكير بسداد القسط',
        message: `السلام عليكم ورحمة الله وبركاته

السيد/ة {{guardian_name}}،
ولي أمر الطالب/ة: {{student_name}}

نود تذكيركم بموعد استحقاق القسط القادم.

📅 تاريخ الاستحقاق: [التاريخ]
💰 المبلغ المستحق: [المبلغ] جنيه

يرجى السداد في الموعد المحدد.
مع تحيات إدارة المدرسة 🏫`
    },
    {
        id: 'document_request',
        category: 'إداري',
        title: '📄 طلب مستند',
        message: `السلام عليكم ورحمة الله وبركاته

السيد/ة {{guardian_name}}،
ولي أمر الطالب/ة: {{student_name}}

نحيطكم علماً بأنه تم طلب إصدار مستند رسمي:
📋 نوع المستند: [شهادة قيد/إفادة/شهادة درجات]

سيكون المستند جاهزاً للاستلام خلال [الفترة الزمنية].

مع تحيات إدارة المدرسة 🏫`
    },
    {
        id: 'attendance_report',
        category: 'حضور',
        title: '📊 تقرير الحضور',
        message: `السلام عليكم ورحمة الله وبركاته

السيد/ة {{guardian_name}}،
ولي أمر الطالب/ة: {{student_name}}

نود إحاطتكم بتقرير الحضور:
✅ أيام الحضور: [عدد الأيام]
❌ أيام الغياب: [عدد الأيام]
⚠️ أيام التأخير: [عدد الأيام]

نسبة الحضور: [النسبة]%

مع تحيات إدارة المدرسة 🏫`
    },
    {
        id: 'absence_notice',
        category: 'حضور',
        title: '❌ إشعار غياب',
        message: `السلام عليكم ورحمة الله وبركاته

السيد/ة {{guardian_name}}،
ولي أمر الطالب/ة: {{student_name}}

نحيطكم علماً بأن الطالب/ة تغيب عن المدرسة اليوم {{date}}.

يرجى إفادتنا بسبب الغياب أو التواصل معنا.

مع تحيات إدارة المدرسة 🏫`
    },
    {
        id: 'behavioral_report',
        category: 'سلوك',
        title: '📋 تقرير سلوكي',
        message: `السلام عليكم ورحمة الله وبركاته

السيد/ة {{guardian_name}}،
ولي أمر الطالب/ة: {{student_name}}

نود إحاطتكم بملاحظة سلوكية:
📝 الموضوع: [وصف الموضوع]
📅 التاريخ: {{date}}

نرجو التواصل مع المدرسة لمناقشة هذا الموضوع.

مع تحيات إدارة المدرسة 🏫`
    },
    {
        id: 'grade_update',
        category: 'أكاديمي',
        title: '📚 تحديث الدرجات',
        message: `السلام عليكم ورحمة الله وبركاته

السيد/ة {{guardian_name}}،
ولي أمر الطالب/ة: {{student_name}}

نحيطكم علماً بتحديث درجات الطالب/ة:
📘 المادة: [اسم المادة]
📝 نوع التقييم: [اختبار/واجب/مشروع]
📊 الدرجة: [الدرجة]

مع تحيات إدارة المدرسة 🏫`
    },
    {
        id: 'meeting_invitation',
        category: 'إداري',
        title: '📅 دعوة اجتماع',
        message: `السلام عليكم ورحمة الله وبركاته

السيد/ة {{guardian_name}}،
ولي أمر الطالب/ة: {{student_name}}

ندعوكم لحضور اجتماع خاص:
📅 التاريخ: [تاريخ الاجتماع]
⏰ الوقت: [وقت الاجتماع]
📍 المكان: [مكان الاجتماع]
📝 الموضوع: [موضوع الاجتماع]

يرجى التأكيد على الحضور.

مع تحيات إدارة المدرسة 🏫`
    },
    {
        id: 'data_update',
        category: 'إداري',
        title: '📝 تحديث بيانات',
        message: `السلام عليكم ورحمة الله وبركاته

السيد/ة {{guardian_name}}،
ولي أمر الطالب/ة: {{student_name}}

نحيطكم علماً بأنه تم تحديث بيانات الطالب/ة:
📋 البيان المحدث: [نوع التحديث]
📅 التاريخ: {{date}}

للاستفسار يرجى التواصل معنا.

مع تحيات إدارة المدرسة 🏫`
    },
    {
        id: 'custom',
        category: 'عام',
        title: '✏️ رسالة مخصصة',
        message: ''
    }
];

interface GuardianWhatsAppDialogProps {
    studentId?: string;
    studentName: string;
    guardianName: string;
    formattedPhoneNumber: string;
    displayPhoneNumber?: string;
    transactionType?: string;
    transactionDetails?: Record<string, any>;
    children?: React.ReactNode;
    defaultTemplateId?: string;
}

export function GuardianWhatsAppDialog({
    studentId,
    studentName,
    guardianName,
    formattedPhoneNumber,
    displayPhoneNumber,
    transactionType,
    transactionDetails,
    children,
    defaultTemplateId
}: GuardianWhatsAppDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [messageBody, setMessageBody] = useState<string>('');
    const [isSending, setIsSending] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (defaultTemplateId && isOpen) {
            applyTemplate(defaultTemplateId);
        }
    }, [defaultTemplateId, isOpen]);

    const applyTemplate = (templateId: string) => {
        const template = TRANSACTION_TEMPLATES.find(t => t.id === templateId);
        if (template) {
            setSelectedTemplate(templateId);
            const today = new Date().toLocaleDateString('ar-EG', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            let message = template.message
                .replace(/\{\{student_name\}\}/g, studentName)
                .replace(/\{\{guardian_name\}\}/g, guardianName)
                .replace(/\{\{date\}\}/g, today);

            if (transactionDetails) {
                Object.entries(transactionDetails).forEach(([key, value]) => {
                    message = message.replace(new RegExp(`\\[${key}\\]`, 'g'), String(value));
                });
            }

            setMessageBody(message);
            setIsSaved(false);
        }
    };

    const saveNotificationToDatabase = async () => {
        try {
            const template = TRANSACTION_TEMPLATES.find(t => t.id === selectedTemplate);

            // الحصول على notification_type_id بناءً على تصنيف القالب
            const notificationTypeId = await getNotificationTypeId(template?.category || 'عام');

            // إنشاء عنوان ذكي - أولاً من القالب، ثم من أول سطر من الرسالة
            const smartTitle = template?.title ||
                messageBody.split('\n').find(line => line.trim().length > 0)?.substring(0, 50) ||
                '📲 رسالة واتساب';

            const notificationData = {
                student_id: studentId,
                notification_type_id: notificationTypeId,
                type: 'whatsapp',
                title: smartTitle,
                content: messageBody,
                status: 'sent',
                phone_number: formattedPhoneNumber,
                send_mode: 'manual',
                priority: 'normal',
                created_by: 'System',
            };

            const { error } = await supabase
                .from('notifications')
                .insert(notificationData);

            if (error) {
                console.error('Error saving notification:', error);
            }

            return true;
        } catch (error) {
            console.error('Error in saveNotificationToDatabase:', error);
            return false;
        }
    };

    const handleSend = async () => {
        if (!messageBody.trim()) {
            toast.error('يرجى إدخال نص الرسالة');
            return;
        }

        setIsSending(true);

        try {
            await saveNotificationToDatabase();
            setIsSaved(true);

            const encodedMessage = encodeURIComponent(messageBody);
            const url = `https://wa.me/${formattedPhoneNumber}?text=${encodedMessage}`;
            window.open(url, 'whatsapp_window');

            toast.success('✅ تم فتح واتساب وتسجيل الرسالة في قاعدة البيانات');

            setTimeout(() => {
                setIsOpen(false);
                setMessageBody('');
                setSelectedTemplate('');
                setIsSaved(false);
            }, 1500);

        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('حدث خطأ أثناء إرسال الرسالة');
        } finally {
            setIsSending(false);
        }
    };

    const groupedTemplates = TRANSACTION_TEMPLATES.reduce((acc, template) => {
        const category = template.category;
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(template);
        return acc;
    }, {} as Record<string, typeof TRANSACTION_TEMPLATES>);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                        <MessageCircle className="h-4 w-4" />
                        إرسال رسالة
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <MessageCircle className="h-5 w-5 text-green-600" />
                        </div>
                        إرسال رسالة واتساب للوصي القانوني
                    </DialogTitle>
                    <DialogDescription className="text-right">
                        سيتم حفظ الرسالة في قاعدة البيانات وفتح واتساب للإرسال
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 space-y-2 border">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">الطالب:</span>
                            <span className="font-semibold">{studentName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">الوصي القانوني:</span>
                            <span className="font-semibold">{guardianName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">رقم الواتساب:</span>
                            <span className="font-mono font-semibold text-green-600 dir-ltr">+{formattedPhoneNumber}</span>
                        </div>
                        {transactionType && (
                            <div className="flex items-center justify-between pt-2 border-t">
                                <span className="text-sm text-gray-600">نوع المعاملة:</span>
                                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded">{transactionType}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-indigo-600" />
                            اختر قالب الرسالة
                        </Label>
                        <Select value={selectedTemplate} onValueChange={applyTemplate}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="اختر نوع المعاملة أو القالب..." />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(groupedTemplates).map(([category, templates]) => (
                                    <div key={category}>
                                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                                            {category}
                                        </div>
                                        {templates.map((template) => (
                                            <SelectItem key={template.id} value={template.id}>
                                                {template.title}
                                            </SelectItem>
                                        ))}
                                    </div>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="messageBody">نص الرسالة</Label>
                        <Textarea
                            id="messageBody"
                            value={messageBody}
                            onChange={(e) => {
                                setMessageBody(e.target.value);
                                setIsSaved(false);
                            }}
                            placeholder="اكتب رسالتك هنا أو اختر قالباً من القائمة..."
                            rows={12}
                            className="resize-y min-h-[200px] text-right"
                            dir="rtl"
                        />
                        <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>💡 يمكنك تعديل النص كما تشاء قبل الإرسال</span>
                            <span>{messageBody.length} حرف</span>
                        </div>
                    </div>

                    {isSaved && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                            <CheckCircle2 className="h-4 w-4" />
                            تم حفظ الرسالة في قاعدة البيانات
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                        إلغاء
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={!messageBody.trim() || isSending}
                        className="bg-green-600 hover:bg-green-700 gap-2"
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                جاري الإرسال...
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4" />
                                إرسال عبر واتساب
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// =============================================
// دالة مساعدة لإرسال إشعار واتساب تلقائي
// يمكن استخدامها من أي صفحة في التطبيق
// =============================================
export async function sendGuardianWhatsAppNotification(params: {
    studentId: string;
    studentName: string;
    guardianName: string;
    guardianPhone: string;
    guardianNationality?: string;
    templateId: string;
    transactionType?: string;
    transactionDetails?: Record<string, any>;
    autoOpen?: boolean;
}): Promise<{ success: boolean; whatsappUrl?: string }> {
    const {
        studentId,
        studentName,
        guardianName,
        guardianPhone,
        guardianNationality,
        templateId,
        transactionType,
        transactionDetails,
        autoOpen = true
    } = params;

    const formattedPhone = formatPhoneNumber(guardianPhone, guardianNationality);

    const template = TRANSACTION_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
        return { success: false };
    }

    const today = new Date().toLocaleDateString('ar-EG', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    let message = template.message
        .replace(/\{\{student_name\}\}/g, studentName)
        .replace(/\{\{guardian_name\}\}/g, guardianName)
        .replace(/\{\{date\}\}/g, today);

    if (transactionDetails) {
        Object.entries(transactionDetails).forEach(([key, value]) => {
            message = message.replace(new RegExp(`\\[${key}\\]`, 'g'), String(value));
        });
    }

    try {
        // الحصول على notification_type_id بناءً على تصنيف القالب
        const notificationTypeId = await getNotificationTypeId(template.category || 'عام');

        // إنشاء عنوان ذكي
        const smartTitle = template.title ||
            message.split('\n').find(line => line.trim().length > 0)?.substring(0, 50) ||
            '📲 رسالة واتساب';

        await supabase.from('notifications').insert({
            student_id: studentId,
            notification_type_id: notificationTypeId,
            type: 'whatsapp',
            title: smartTitle,
            content: message,
            status: 'sent',
            phone_number: formattedPhone,
            send_mode: 'auto_triggered',
            priority: 'normal',
            created_by: 'System',
        });
    } catch (error) {
        console.error('Error saving notification:', error);
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

    if (autoOpen && typeof window !== 'undefined') {
        window.open(whatsappUrl, 'whatsapp_window');
    }

    return { success: true, whatsappUrl };
}
