
import { useState, useEffect } from 'react';
import { useCalendarSettings } from '@/hooks/useCalendarSettings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CalendarIcon, Loader2, Save, Trash2, ShieldCheck, Coins } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function SmartCalendar() {
    const { overrides, loading, fetchOverrides, saveOverride, deleteOverride } = useCalendarSettings();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form State
    const [dayType, setDayType] = useState('work');
    const [payRate, setPayRate] = useState('1.0');
    const [bonus, setBonus] = useState('0');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [note, setNote] = useState('');

    useEffect(() => {
        const start = new Date(new Date().getFullYear(), 0, 1);
        const end = new Date(new Date().getFullYear(), 11, 31);
        fetchOverrides(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
    }, []);

    const handleDayClick = (day: Date | undefined) => {
        if (!day) return;
        const dateStr = format(day, 'yyyy-MM-dd');
        setSelectedDate(day);

        // Find existing override
        const existing = overrides.find(o => o.date === dateStr);
        if (existing) {
            setDayType(existing.day_type);
            setPayRate(existing.pay_rate?.toString() || '1.0');
            setBonus(existing.bonus_fixed?.toString() || '0');
            setCustomStart(existing.custom_start_time || '');
            setCustomEnd(existing.custom_end_time || '');
            setNote(existing.note || '');
        } else {
            // Defaults
            setDayType('work');
            setPayRate('1.0');
            setBonus('0');
            setCustomStart('');
            setCustomEnd('');
            setNote('');
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!selectedDate) return;
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            await saveOverride({
                date: dateStr,
                day_type: dayType,
                pay_rate: parseFloat(payRate),
                bonus_fixed: parseFloat(bonus),
                custom_start_time: customStart || null,
                custom_end_time: customEnd || null,
                note: note
            });
            toast.success("تم حفظ إعدادات اليوم بنجاح");
            setIsDialogOpen(false);
        } catch (err) {
            toast.error("حدث خطأ أثناء الحفظ");
        }
    };

    const handleDelete = async () => {
        if (!selectedDate) return;
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            await deleteOverride(dateStr);
            setIsDialogOpen(false);
        } catch (err) {
            // Error handled by hook
        }
    };

    // Custom Day Renderer for Calendar
    const modifiers = {
        off: (date: Date) => overrides.some(o => o.date === format(date, 'yyyy-MM-dd') && o.day_type.startsWith('off')),
        special: (date: Date) => overrides.some(o => o.date === format(date, 'yyyy-MM-dd') && o.pay_rate > 1.0),
        bonus: (date: Date) => overrides.some(o => o.date === format(date, 'yyyy-MM-dd') && o.bonus_fixed > 0),
    };

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">التقويم الذكي</h2>
                    <p className="text-muted-foreground mt-1">إدارة الاستثناءات، العطلات، والمناسبات الخاصة للرواتب.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm"><CalendarIcon className="ml-2 h-4 w-4" /> عرض العام</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Calendar View */}
                <Card className="md:col-span-8">
                    <CardHeader>
                        <CardTitle>الجدول الزمني</CardTitle>
                        <CardDescription>اضغط على أي يوم لتعديل إعداداته</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center p-6">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDayClick}
                            className="rounded-md border shadow p-4 w-full max-w-2xl"
                            modifiers={modifiers}
                            modifiersClassNames={{
                                off: "bg-red-100 text-red-700 font-bold hover:bg-red-200",
                                special: "bg-blue-100 text-blue-700 font-bold hover:bg-blue-200",
                                bonus: "ring-2 ring-yellow-400"
                            }}
                            locale={ar}
                            components={{
                                DayContent: (props) => {
                                    const dStr = format(props.date, 'yyyy-MM-dd');
                                    const ov = overrides.find(o => o.date === dStr);
                                    return (
                                        <div className="w-full h-full flex flex-col items-center justify-center relative p-1">
                                            <span>{props.date.getDate()}</span>
                                            {ov && (
                                                <div className="flex gap-0.5 absolute bottom-1">
                                                    {ov.day_type.startsWith('off') && <div className="h-1.5 w-1.5 rounded-full bg-red-500" title="عطلة" />}
                                                    {(ov.pay_rate > 1) && <div className="h-1.5 w-1.5 rounded-full bg-blue-500" title="علاوة" />}
                                                    {(ov.bonus_fixed > 0) && <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" title="مكافأة" />}
                                                </div>
                                            )}
                                        </div>
                                    )
                                }
                            }}
                        />
                    </CardContent>
                </Card>

                {/* Legend & Stats */}
                <div className="md:col-span-4 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>مفتاح الألوان</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-4 w-4 rounded-full bg-red-500" />
                                <span className="text-sm">عطلة رسمية (Off)</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-4 w-4 rounded-full bg-blue-500" />
                                <span className="text-sm">يوم عمل بنسبة إضافية</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-4 w-4 rounded-full bg-yellow-500" />
                                <span className="text-sm">يوم بمكافأة ثابتة</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-primary">
                                <ShieldCheck className="h-5 w-5" /> معلومة ذكية
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                الإعدادات التي تقوم بضبطها هنا في التقويم "تغلب" وتلغي أي إعدادات افتراضية للأسبوع.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>إعدادات يوم: {selectedDate ? format(selectedDate, 'dd MMMM yyyy', { locale: ar }) : ''}</DialogTitle>
                        <DialogDescription>
                            قم بتغيير طبيعة هذا اليوم. سيتم تطبيق هذه الإعدادات على جميع الموظفين.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* 1. Day Type */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="dayType" className="text-right">نوع اليوم</Label>
                            <Select value={dayType} onValueChange={setDayType}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="اختر نوع اليوم" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="work">يوم عمل (Work)</SelectItem>
                                    <SelectItem value="off_paid">عطلة مدفوعة (Paid Off)</SelectItem>
                                    <SelectItem value="off_unpaid">عطلة غير مدفوعة (Unpaid)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 2. Pay Rate */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="payRate" className="text-right">نسبة اليوم</Label>
                            <div className="col-span-3 flex items-center gap-2">
                                <Input
                                    id="payRate"
                                    type="number"
                                    step="0.1"
                                    value={payRate}
                                    onChange={(e) => setPayRate(e.target.value)}
                                    className="w-24"
                                />
                                <span className="text-xs text-muted-foreground">
                                    (1.0 = عادي، 1.5 = مرة ونصف)
                                </span>
                            </div>
                        </div>

                        {/* 3. Bonus */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="bonus" className="text-right">مكافأة ثابتة</Label>
                            <div className="col-span-3 relative">
                                <Coins className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="bonus"
                                    type="number"
                                    value={bonus}
                                    onChange={(e) => setBonus(e.target.value)}
                                    className="pr-9"
                                />
                            </div>
                        </div>

                        {/* 4. Times */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">مواعيد خاصة</Label>
                            <div className="col-span-3 flex gap-2">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-muted-foreground">بدء</span>
                                    <Input
                                        type="time"
                                        value={customStart}
                                        onChange={(e) => setCustomStart(e.target.value)}
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-muted-foreground">انتهاء</span>
                                    <Input
                                        type="time"
                                        value={customEnd}
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                        className="h-8 text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 5. Note */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="note" className="text-right">ملاحظة</Label>
                            <Input
                                id="note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="col-span-3"
                                placeholder="سبب التغيير..."
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex justify-between sm:justify-between w-full">
                        <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={handleDelete}>
                            <Trash2 className="h-4 w-4 ml-2" /> إزالة التغيير
                        </Button>
                        <Button onClick={handleSave} disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
                            حفظ التعديلات
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
