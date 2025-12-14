import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle, XCircle, Clock, Eye, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { StudentService } from '@/services/studentService';
import type { Refund } from '@/types/student';

interface RefundTrackingProps {
    studentId?: string;
    showPendingOnly?: boolean;
    showAllRequests?: boolean;
}

export function RefundTracking({ studentId, showPendingOnly = false, showAllRequests = false }: RefundTrackingProps) {
    const [refunds, setRefunds] = useState<Refund[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('كل');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadRefunds();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentId, showPendingOnly, showAllRequests]);

    const loadRefunds = async () => {
        try {
            setLoading(true);
            let data: Refund[] = [];

            if (showAllRequests) {
                data = await StudentService.getPendingRefunds();
            } else if (studentId) {
                data = await StudentService.getStudentRefunds(studentId);
            }

            if (showPendingOnly) {
                data = data.filter(r => r.status === 'معلق');
            }

            setRefunds(data);
        } catch (error) {
            console.error('خطأ في تحميل طلبات الاسترداد:', error);
            toast.error('حدث خطأ أثناء تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

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
            'معلق': Clock,
            'موافق عليه': CheckCircle,
            'مرفوض': XCircle,
            'مدفوع': CheckCircle
        };
        const Icon = iconMap[status] || AlertCircle;
        return <Icon className="w-4 h-4" />;
    };

    const filteredRefunds = refunds.filter(refund => {
        const statusMatch = filterStatus === 'كل' || refund.status === filterStatus;
        const searchMatch = 
            !searchTerm || 
            refund.studentId.includes(searchTerm) ||
            refund.academicYearCode.includes(searchTerm);
        return statusMatch && searchMatch;
    });

    if (loading && refunds.length === 0) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-40">
                    <Loader className="w-6 h-6 animate-spin text-gray-500" />
                    <span className="mr-2 text-gray-600">جاري التحميل...</span>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* فلاتر البحث */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm">فلاتر البحث</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-2">
                    <Input
                        placeholder="ابحث عن رقم الطالب أو السنة الدراسية..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1"
                    />
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="كل">الكل</SelectItem>
                            <SelectItem value="معلق">معلق</SelectItem>
                            <SelectItem value="موافق عليه">موافق عليه</SelectItem>
                            <SelectItem value="مرفوض">مرفوض</SelectItem>
                            <SelectItem value="مدفوع">مدفوع</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={loadRefunds} disabled={loading}>
                        تحديث
                    </Button>
                </CardContent>
            </Card>

            {/* قائمة الطلبات */}
            <div className="space-y-3">
                {filteredRefunds.length === 0 ? (
                    <Card>
                        <CardContent className="flex items-center justify-center h-32 text-gray-500">
                            لا توجد طلبات استرداد
                        </CardContent>
                    </Card>
                ) : (
                    filteredRefunds.map((refund) => (
                        <Card key={refund.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold">{refund.studentId}</span>
                                            <Badge className={getStatusColor(refund.status)}>
                                                {refund.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600">السنة الدراسية: {refund.academicYearCode}</p>
                                    </div>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedRefund(refund)}
                                            >
                                                <Eye className="w-4 h-4 mr-1" />
                                                التفاصيل
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl">
                                            <DialogHeader>
                                                <DialogTitle>تفاصيل طلب الاسترداد</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                {/* المعلومات الأساسية */}
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-gray-600">رقم الطالب</p>
                                                        <p className="font-medium">{selectedRefund?.studentId}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">السنة الدراسية</p>
                                                        <p className="font-medium">{selectedRefund?.academicYearCode}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">تاريخ الطلب</p>
                                                        <p className="font-medium">{selectedRefund?.requestDate}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">تاريخ الانسحاب</p>
                                                        <p className="font-medium">{selectedRefund?.withdrawalDate || '-'}</p>
                                                    </div>
                                                </div>

                                                {/* التفاصيل المالية */}
                                                <Card className="bg-gray-50">
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-sm">التفاصيل المالية</CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span>إجمالي المدفوعات</span>
                                                            <span className="font-medium">{selectedRefund?.totalPaid?.toFixed(2) || 0} ج.م</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>المبلغ القابل للاسترداد</span>
                                                            <span className="font-medium">{selectedRefund?.totalRefundable?.toFixed(2) || 0} ج.م</span>
                                                        </div>
                                                        <div className="flex justify-between text-red-600">
                                                            <span>الخصومات</span>
                                                            <span className="font-medium">-{selectedRefund?.totalDeductions?.toFixed(2) || 0} ج.م</span>
                                                        </div>
                                                        <div className="pt-2 border-t flex justify-between font-semibold text-green-600">
                                                            <span>المبلغ المسترد النهائي</span>
                                                            <span>{selectedRefund?.finalRefundAmount?.toFixed(2) || 0} ج.م</span>
                                                        </div>
                                                    </CardContent>
                                                </Card>

                                                {/* الخصومات */}
                                                {selectedRefund?.deductions && selectedRefund.deductions.length > 0 && (
                                                    <Card className="bg-gray-50">
                                                        <CardHeader className="pb-2">
                                                            <CardTitle className="text-sm">تفاصيل الخصومات</CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="space-y-2 text-sm">
                                                            {selectedRefund.deductions.map((d, idx) => (
                                                                <div key={idx} className="flex justify-between pb-1 border-b last:border-b-0">
                                                                    <span>{d.deductionType}</span>
                                                                    <span className="font-medium">-{d.amount?.toFixed(2) || 0} ج.م</span>
                                                                </div>
                                                            ))}
                                                        </CardContent>
                                                    </Card>
                                                )}

                                                {/* ملاحظات */}
                                                {selectedRefund?.notes && (
                                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                                                        <p className="font-medium text-blue-900 mb-1">الملاحظات:</p>
                                                        <p className="text-blue-800 whitespace-pre-wrap">{selectedRefund.notes}</p>
                                                    </div>
                                                )}

                                                {/* سبب الرفض */}
                                                {selectedRefund?.rejectionReason && (
                                                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm">
                                                        <p className="font-medium text-red-900 mb-1">سبب الرفض:</p>
                                                        <p className="text-red-800">{selectedRefund.rejectionReason}</p>
                                                    </div>
                                                )}

                                                {/* معلومات الموافقة والدفع */}
                                                {(selectedRefund?.approverName || selectedRefund?.paymentDate) && (
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        {selectedRefund.approverName && (
                                                            <div>
                                                                <p className="text-gray-600">المعتمد</p>
                                                                <p className="font-medium">{selectedRefund.approverName}</p>
                                                            </div>
                                                        )}
                                                        {selectedRefund.approvalDate && (
                                                            <div>
                                                                <p className="text-gray-600">تاريخ الموافقة</p>
                                                                <p className="font-medium">{selectedRefund.approvalDate}</p>
                                                            </div>
                                                        )}
                                                        {selectedRefund.paymentDate && (
                                                            <div>
                                                                <p className="text-gray-600">تاريخ الدفع</p>
                                                                <p className="font-medium">{selectedRefund.paymentDate}</p>
                                                            </div>
                                                        )}
                                                        {selectedRefund.paymentMethod && (
                                                            <div>
                                                                <p className="text-gray-600">طريقة الدفع</p>
                                                                <p className="font-medium">{selectedRefund.paymentMethod}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                {/* الملخص المالي */}
                                <div className="grid grid-cols-3 gap-3 text-sm">
                                    <div className="p-2 bg-gray-50 rounded">
                                        <p className="text-gray-600 text-xs">المبلغ المسترد</p>
                                        <p className="font-semibold text-green-600">{refund.finalRefundAmount?.toFixed(2) || 0} ج.م</p>
                                    </div>
                                    <div className="p-2 bg-gray-50 rounded">
                                        <p className="text-gray-600 text-xs">الخصومات</p>
                                        <p className="font-semibold text-red-600">{refund.totalDeductions?.toFixed(2) || 0} ج.م</p>
                                    </div>
                                    <div className="p-2 bg-gray-50 rounded">
                                        <p className="text-gray-600 text-xs">المدفوع</p>
                                        <p className="font-semibold">{refund.totalPaid?.toFixed(2) || 0} ج.م</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* ملخص الإحصائيات */}
            {refunds.length > 0 && (
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">الملخص الإحصائي</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-gray-600 text-xs">الإجمالي</p>
                            <p className="font-semibold">{refunds.length}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-xs">معلق</p>
                            <p className="font-semibold text-yellow-600">{refunds.filter(r => r.status === 'معلق').length}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-xs">موافق عليه</p>
                            <p className="font-semibold text-green-600">{refunds.filter(r => r.status === 'موافق عليه').length}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-xs">مدفوع</p>
                            <p className="font-semibold text-blue-600">{refunds.filter(r => r.status === 'مدفوع').length}</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
