import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, FileText, File } from "lucide-react";
import { useState } from "react";

interface PrintOptionsModalProps {
    studentId: string;
    studentName: string;
    trigger?: React.ReactNode;
}

export function PrintOptionsModal({ studentId, studentName, trigger }: PrintOptionsModalProps) {
    const [open, setOpen] = useState(false);

    const handlePrint = (mode: 'filled' | 'empty') => {
        // Construct URL
        const url = `/print/application-form/${studentId}?mode=${mode}`;

        // Open in new window
        window.open(url, '_blank', 'width=1000,height=800,scrollbars=yes');

        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0">
                        <Printer className="w-4 h-4" />
                        طباعة طلب التحاق
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>طباعة طلب التحاق بالمدرسة</DialogTitle>
                    <DialogDescription>
                        اختر نوع الطباعة للطالب: <span className="font-semibold text-primary">{studentName}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-4 py-4" dir="rtl">
                    <Button
                        variant="outline"
                        className="h-auto p-6 flex items-start justify-start gap-4 hover:border-primary hover:bg-primary/5 transition-all group relative overflow-hidden whitespace-normal text-right w-full"
                        onClick={() => handlePrint('filled')}
                    >
                        <div className="absolute inset-0 bg-gradient-to-l from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors shrink-0 z-10">
                            <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 space-y-2 z-10 w-full">
                            <span className="font-bold block text-lg group-hover:text-primary transition-colors">
                                طباعة طلب ممتلئ بالبيانات
                            </span>
                            <span className="text-sm text-muted-foreground block leading-relaxed">
                                إنشاء نموذج طلب التحاق يحتوي على كافة بيانات الطالب المسجلة في النظام.
                            </span>
                        </div>
                    </Button>

                    <Button
                        variant="outline"
                        className="h-auto p-6 flex items-start justify-start gap-4 hover:border-gray-400 hover:bg-gray-50 transition-all group relative overflow-hidden whitespace-normal text-right w-full"
                        onClick={() => handlePrint('empty')}
                    >
                        <div className="absolute inset-0 bg-gradient-to-l from-gray-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="p-3 bg-gray-100 rounded-full group-hover:bg-gray-200 transition-colors shrink-0 z-10">
                            <File className="w-6 h-6 text-gray-600" />
                        </div>
                        <div className="flex-1 space-y-2 z-10 w-full">
                            <span className="font-bold block text-lg group-hover:text-gray-800 transition-colors">
                                طباعة طلب فارغ (نموذج)
                            </span>
                            <span className="text-sm text-muted-foreground block leading-relaxed">
                                طباعة نموذج طلب التحاق فارغ للكتابة عليه يدوياً.
                            </span>
                        </div>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
