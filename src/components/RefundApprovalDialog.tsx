import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, DollarSign, User, Calendar, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { StudentService } from '@/services/studentService';
import { getEgyptianDateString } from '@/utils/helpers';
import type { Refund } from '@/types/student';

interface RefundApprovalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    refund: Refund | null;
    studentName?: string;
    onApprovalComplete?: (refundId: string, status: 'موافق عليه' | 'مرفوض') => void;
}

export function RefundApprovalDialog({
    open,
    onOpenChange,
    refund,
    studentName = 'غير محدد',
    onApprovalComplete
}: RefundApprovalDialogProps) {
    const [loading, setLoading] = useState(false);
    const [approvalAction, setApprovalAction] = useState<'موافق عليه' | 'مرفوض' | null>(null);
    const [formData, setFormData] = useState({
        approverName: '',
        paymentMethod: 'تحويل بنكي',
        bankAccountInfo: '',
        receiptNumber: '',
        rejectionReason: ''
    });

    const handleApprove = async () => {
        if (!refund || !formData.approverName) {
            toast.error('يرجى إدخال اسم المعتمد');
            return;
        }

        try {
            setLoading(true);

            // 1. تحديث حالة الاسترداد
            await StudentService.updateRefundStatus(refund.id!, 'موافق عليه', {
                approverName: formData.approverName,
                approvalDate: getEgyptianDateString(),
                paymentMethod: formData.paymentMethod,
                bankAccountInfo: formData.bankAccountInfo,
                receiptNumber: formData.receiptNumber
            });

            // 2. تسجيل المعاملة المالية (الاسترداد)
            await StudentService.recordRefundTransaction(
                refund.studentId,
                refund.academicYearCode,
                refund.finalRefundAmount || 0,
                `استرداد أموال - طلب رقم ${refund.id}`,
                refund.id
            );

            toast.success('تم الموافقة على طلب الاسترداد وتسجيل المعاملة المالية ✓');

            if (onApprovalComplete) {
                onApprovalComplete(refund.id!, 'موافق عليه');
            }

            resetForm();
            onOpenChange(false);
        } catch (error) {
            console.error('خطأ في الموافقة:', error);
            toast.error('حدث خطأ أثناء الموافقة على الطلب');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!refund || !formData.rejectionReason) {
            toast.error('يرجى إدخال سبب الرفض');
            return;
        }

        try {
            setLoading(true);

            await StudentService.updateRefundStatus(refund.id!, 'مرفوض', {
                approverName: formData.approverName || 'النظام',
                rejectionReason: formData.rejectionReason,
                approvalDate: getEgyptianDateString()
            });

            toast.success('تم رفض طلب الاسترداد');

            if (onApprovalComplete) {
                onApprovalComplete(refund.id!, 'مرفوض');
            }

            resetForm();
            onOpenChange(false);
        } catch (error) {
            console.error('خطأ في رفض الطلب:', error);
            toast.error('حدث خطأ أثناء رفض الطلب');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setApprovalAction(null);
        setFormData({
            approverName: '',
            paymentMethod: 'تحويل بنكي',
            bankAccountInfo: '',
            receiptNumber: '',
            rejectionReason: ''
        });
    };

    if (!refund) return null;

    const getStatusColor = (status: string) => {
        const colorMap: Record<string, string> = {
            'معلق': 'bg-yellow-100 text-yellow-800',
            'موافق عليه': 'bg-green-100 text-green-800',
            'مرفوض': 'bg-red-100 text-red-800',
            'مدفوع': 'bg-blue-100 text-blue-800'
        };
        return colorMap[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusIcon = (status: string) => {
        const iconMap: Record<string, React.ElementType> = {
            'معلق': AlertTriangle,
            'موافق عليه': CheckCircle,
            'مرفوض': XCircle,
            'مدفوع': CheckCircle
        };
        const Icon = iconMap[status] || AlertTriangle;
        return <Icon className="w-4 h-4" />;
    };

    return (
        <Dialog open={open} onOpenChange={(newOpen) => {
            if (!newOpen) {
                resetForm();
            }
            onOpenChange(newOpen);
        }}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span>مراجعة طلب الاسترداد</span>
                        <Badge className={getStatusColor(refund.status)}>
                            {refund.status}
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        {studentName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* معلومات الطلب */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">معلومات الطلب</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <div>
                                        <p className="text-gray-600">تاريخ الطلب</p>
                                        <p className="font-medium">{refund.requestDate}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <div>
                                        <p className="text-gray-600">تاريخ الانسحاب</p>
                                        <p className="font-medium">{refund.withdrawalDate || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* تفاصيل مالية */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">التفاصيل المالية</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">إجمالي المدفوعات</span>
                                    <span className="font-semibold">{refund.totalPaid.toFixed(2)} ج.م</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">المبلغ القابل للاسترداد</span>
                                    <span className="font-semibold">{refund.totalRefundable?.toFixed(2) || 0} ج.م</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-red-600">
                                    <span>إجمالي الخصومات</span>
                                    <span className="font-semibold">-{refund.totalDeductions.toFixed(2)} ج.م</span>
                                </div>
                                <div className="pt-2 border-t flex justify-between items-center">
                                    <span className="font-semibold flex items-center gap-2">
                                        <DollarSign className="w-4 h-4" />
                                        المبلغ المسترد
                                    </span>
                                    <span className="text-lg font-bold text-green-600">
                                        {refund.finalRefundAmount?.toFixed(2) || 0} ج.م
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* تفاصيل الخصومات */}
                    {refund.deductions && refund.deductions.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">تفاصيل الخصومات</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {refund.deductions.map((d, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm pb-2 border-b last:border-b-0">
                                            <div>
                                                <p className="font-medium">{d.deductionType}</p>
                                                {d.description && <p className="text-xs text-gray-600">{d.description}</p>}
                                            </div>
                                            <span className="font-semibold">-{d.amount.toFixed(2)} ج.م</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* ملاحظات الطالب */}
                    {refund.notes && (
                        <Card className="border-blue-200 bg-blue-50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">ملاحظات الطلب</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-blue-900 whitespace-pre-wrap">{refund.notes}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* خيارات المعالجة */}
                    {!approvalAction ? (
                        <Alert className="border-orange-200 bg-orange-50">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-sm text-orange-700">
                                يرجى اختيار إجراء: الموافقة على الاسترداد أو رفضه
                            </AlertDescription>
                        </Alert>
                    ) : null}

                    {/* نموذج الموافقة */}
                    {approvalAction === 'موافق عليه' && (
                        <Card className="border-green-200 bg-green-50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    الموافقة على الاسترداد
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="approverName">اسم المعتمد *</Label>
                                    <Input
                                        id="approverName"
                                        placeholder="أدخل اسمك كاملاً"
                                        value={formData.approverName}
                                        onChange={(e) => setFormData({ ...formData, approverName: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="paymentMethod">طريقة الدفع</Label>
                                    <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                                            <SelectItem value="شيك">شيك</SelectItem>
                                            <SelectItem value="كاش">نقدي</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.paymentMethod === 'تحويل بنكي' && (
                                    <div>
                                        <Label htmlFor="bankAccountInfo">بيانات الحساب البنكي</Label>
                                        <Textarea
                                            id="bankAccountInfo"
                                            placeholder="رقم الحساب - اسم البنك - صاحب الحساب"
                                            value={formData.bankAccountInfo}
                                            onChange={(e) => setFormData({ ...formData, bankAccountInfo: e.target.value })}
                                            rows={2}
                                        />
                                    </div>
                                )}

                                <div>
                                    <Label htmlFor="receiptNumber">رقم الإيصال (اختياري)</Label>
                                    <Input
                                        id="receiptNumber"
                                        placeholder="رقم الإيصال أو المرجع"
                                        value={formData.receiptNumber}
                                        onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* نموذج الرفض */}
                    {approvalAction === 'مرفوض' && (
                        <Card className="border-red-200 bg-red-50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <XCircle className="w-4 h-4 text-red-600" />
                                    رفض الاسترداد
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="approverName">اسم المعتمد (اختياري)</Label>
                                    <Input
                                        id="approverName"
                                        placeholder="أدخل اسمك كاملاً"
                                        value={formData.approverName}
                                        onChange={(e) => setFormData({ ...formData, approverName: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="rejectionReason">سبب الرفض *</Label>
                                    <Textarea
                                        id="rejectionReason"
                                        placeholder="أدخل سبب رفض طلب الاسترداد..."
                                        value={formData.rejectionReason}
                                        onChange={(e) => setFormData({ ...formData, rejectionReason: e.target.value })}
                                        rows={4}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => {
                            resetForm();
                            onOpenChange(false);
                        }}
                        disabled={loading}
                    >
                        إغلاق
                    </Button>

                    {!approvalAction ? (
                        <>
                            <Button
                                variant="destructive"
                                onClick={() => setApprovalAction('مرفوض')}
                                disabled={loading}
                            >
                                رفض
                            </Button>
                            <Button
                                onClick={() => setApprovalAction('موافق عليه')}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                موافقة
                            </Button>
                        </>
                    ) : approvalAction === 'موافق عليه' ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setApprovalAction(null)}
                                disabled={loading}
                            >
                                رجوع
                            </Button>
                            <Button
                                onClick={handleApprove}
                                disabled={loading || !formData.approverName}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {loading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                                تأكيد الموافقة
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setApprovalAction(null)}
                                disabled={loading}
                            >
                                رجوع
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleReject}
                                disabled={loading || !formData.rejectionReason}
                            >
                                {loading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                                تأكيد الرفض
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
