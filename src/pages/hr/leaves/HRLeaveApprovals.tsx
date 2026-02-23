/**
 * صفحة الموافقات - نظام الموارد البشرية
 */
import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, User, Calendar, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const mockPending = [
    { id: '1', employee_name: 'سارة أحمد', type: 'إجازة مرضية', start_date: '2024-01-18', end_date: '2024-01-20', days: 3, reason: 'مرض', requested_at: '2024-01-16' },
    { id: '2', employee_name: 'محمود علي', type: 'تعديل حضور', date: '2024-01-15', current: '08:45', requested: '07:30', reason: 'عطل في جهاز البصمة', requested_at: '2024-01-16' },
    { id: '3', employee_name: 'فاطمة حسن', type: 'إجازة سنوية', start_date: '2024-01-25', end_date: '2024-01-30', days: 5, reason: 'إجازة عائلية', requested_at: '2024-01-17' },
];

const HRLeaveApprovals = () => {
    const [pending, setPending] = useState(mockPending);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectDialog, setShowRejectDialog] = useState(false);

    const handleApprove = (id: string) => {
        setPending(pending.filter(p => p.id !== id));
        toast.success('تمت الموافقة على الطلب');
    };

    const handleReject = () => {
        if (!rejectReason) { toast.error('يرجى إدخال سبب الرفض'); return; }
        setPending(pending.filter(p => p.id !== selectedItem?.id));
        setShowRejectDialog(false);
        setRejectReason('');
        toast.success('تم رفض الطلب');
    };

    const openRejectDialog = (item: any) => {
        setSelectedItem(item);
        setShowRejectDialog(true);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3"><Clock className="h-8 w-8 text-orange-600" />الموافقات المعلقة</h1>
                    <p className="text-gray-500">طلبات تنتظر الموافقة أو الرفض</p>
                </div>

                <Card className="p-4 bg-orange-50 border-orange-200">
                    <div className="flex items-center gap-3">
                        <Clock className="h-8 w-8 text-orange-600" />
                        <div><p className="text-orange-800 font-semibold">لديك {pending.length} طلبات معلقة تنتظر الموافقة</p></div>
                    </div>
                </Card>

                <div className="space-y-4">
                    {pending.length === 0 ? (
                        <Card className="p-10 text-center text-gray-500"><CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-300" /><p className="text-lg">لا توجد طلبات معلقة</p></Card>
                    ) : (
                        pending.map(item => (
                            <Card key={item.id} className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">{item.employee_name.charAt(0)}</div>
                                            <div>
                                                <h3 className="text-lg font-bold">{item.employee_name}</h3>
                                                <Badge variant="outline">{item.type}</Badge>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{item.start_date || item.date} {item.end_date && `- ${item.end_date}`}</span>
                                            {item.days && <span className="font-semibold text-blue-600">{item.days} أيام</span>}
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600"><MessageSquare className="h-4 w-4" />{item.reason}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={() => handleApprove(item.id)} className="bg-green-600 hover:bg-green-700"><CheckCircle className="h-4 w-4 ml-2" />موافقة</Button>
                                        <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => openRejectDialog(item)}><XCircle className="h-4 w-4 ml-2" />رفض</Button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>سبب الرفض</DialogTitle></DialogHeader>
                        <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="أدخل سبب الرفض..." rows={4} />
                        <DialogFooter><Button variant="outline" onClick={() => setShowRejectDialog(false)}>إلغاء</Button><Button onClick={handleReject} className="bg-red-600 hover:bg-red-700">تأكيد الرفض</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default HRLeaveApprovals;
