import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageLayout } from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBatchOperations } from '@/hooks/useBatchOperations';
import { useCrossTabSync } from '@/hooks/useCrossTabSync';
import { Zap, AlertCircle, CheckCircle2, Clock, Loader, ArrowLeft } from 'lucide-react';

export default function BatchOperationsPage() {
    const navigate = useNavigate();
    const { notify } = useCrossTabSync();
    const {
        batchUpdateAcademic,
        batchUpdateAttendance,
        batchUpdateBehavioral,
        batchDeleteStudents,
        status,
        progress,
    } = useBatchOperations();

    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [operationType, setOperationType] = useState<'academic' | 'attendance' | 'behavioral' | 'delete'>('academic');
    const [formData, setFormData] = useState<Record<string, unknown>>({});
    const [loading, setLoading] = useState(false);

    const handleBatchOperation = async () => {
        if (selectedStudents.length === 0) {
            notify('يرجى اختيار طالب واحد على الأقل', 'warning');
            return;
        }

        setLoading(true);
        try {
            switch (operationType) {
                case 'academic':
                    await batchUpdateAcademic(selectedStudents, formData);
                    notify('تم تحديث البيانات الأكاديمية بنجاح', 'success');
                    break;
                case 'attendance':
                    await batchUpdateAttendance(selectedStudents, formData);
                    notify('تم تحديث سجلات الحضور بنجاح', 'success');
                    break;
                case 'behavioral':
                    await batchUpdateBehavioral(selectedStudents, formData);
                    notify('تم تحديث البيانات السلوكية بنجاح', 'success');
                    break;
                case 'delete':
                    if (window.confirm('هل أنت متأكد من حذف الطلاب المختارين؟')) {
                        await batchDeleteStudents(selectedStudents);
                        notify('تم حذف الطلاب بنجاح', 'success');
                        setSelectedStudents([]);
                    }
                    break;
            }
        } catch (error) {
            notify(`خطأ: ${error instanceof Error ? error.message : 'حدث خطأ'}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <PageLayout title="العمليات الجماعية" description="تنفيذ عمليات متعددة على طلاب في نفس الوقت">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <Zap className="h-6 w-6 text-yellow-600" />
                                العمليات الجماعية
                            </h2>
                            <p className="text-gray-600 text-sm mt-1">طبق عمليات متعددة على مجموعة من الطلاب</p>
                        </div>
                        <Button
                            onClick={() => navigate('/students')}
                            variant="outline"
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            عودة
                        </Button>
                    </div>

                    {/* Operation Type Selection */}
                    <Card className="p-6 bg-white border border-gray-200 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">اختر نوع العملية</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                                { value: 'academic', label: '📚 تحديث أكاديمي', desc: 'تحديث الدرجات والمعدلات' },
                                { value: 'attendance', label: '📅 تحديث الحضور', desc: 'تسجيل الحضور/الغياب' },
                                { value: 'behavioral', label: '⭐ تحديث سلوكي', desc: 'تحديث البيانات السلوكية' },
                                { value: 'delete', label: '🗑️ حذف', desc: 'حذف سجلات الطلاب', danger: true },
                            ].map(op => (
                                <button
                                    key={op.value}
                                    onClick={() => setOperationType(op.value as typeof operationType)}
                                    className={`p-4 rounded-lg border-2 transition-all text-left ${operationType === op.value
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                        } ${op.danger ? 'hover:border-red-500' : ''}`}
                                >
                                    <p className="font-semibold">{op.label}</p>
                                    <p className="text-sm text-gray-600">{op.desc}</p>
                                </button>
                            ))}
                        </div>
                    </Card>

                    {/* Student Selection */}
                    <Card className="p-6 bg-white border border-gray-200 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">اختر الطلاب</h3>
                        <div className="space-y-3">
                            <Input
                                placeholder="أدخل رقم الطالب أو الاسم (مفصول بفواصل)"
                                onChange={(e) => {
                                    const values = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                    setSelectedStudents(values);
                                }}
                                className="py-2"
                            />
                            {selectedStudents.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {selectedStudents.map((student, idx) => (
                                        <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                            {student}
                                            <button
                                                onClick={() => setSelectedStudents(selectedStudents.filter((_, i) => i !== idx))}
                                                className="ml-2 font-bold hover:text-blue-900"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Form Data for Operation */}
                    {operationType !== 'delete' && (
                        <Card className="p-6 bg-white border border-gray-200 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4">بيانات التحديث</h3>
                            <div className="space-y-3">
                                {operationType === 'academic' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">المعدل التراكمي (GPA)</label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="4"
                                                placeholder="3.5"
                                                onChange={(e) => setFormData({ ...formData, gpa: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">متوسط الدرجات</label>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                placeholder="85"
                                                onChange={(e) => setFormData({ ...formData, averageMarks: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                    </>
                                )}

                                {operationType === 'attendance' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">التاريخ</label>
                                            <Input
                                                type="date"
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">الحالة</label>
                                            <select
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            >
                                                <option value="">اختر...</option>
                                                <option value="حاضر">حاضر</option>
                                                <option value="غائب">غائب</option>
                                                <option value="متأخر">متأخر</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                {operationType === 'behavioral' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">تقييم السلوك</label>
                                            <select
                                                onChange={(e) => setFormData({ ...formData, conductRating: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            >
                                                <option value="">اختر...</option>
                                                <option value="ممتاز">ممتاز</option>
                                                <option value="جيد جداً">جيد جداً</option>
                                                <option value="جيد">جيد</option>
                                                <option value="مقبول">مقبول</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">ملاحظات</label>
                                            <Input
                                                placeholder="أضف ملاحظات..."
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Progress Display */}
                    {(status === 'processing' || progress > 0) && (
                        <Card className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                {status === 'processing' ? (
                                    <Loader className="h-5 w-5 animate-spin text-blue-600 mt-1 flex-shrink-0" />
                                ) : (
                                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                                )}
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-800">
                                        {status === 'processing' ? 'جاري المعالجة' : 'تم الانتهاء'}
                                    </p>
                                    <div className="mt-3 bg-white rounded-full overflow-hidden h-2">
                                        <div
                                            className="bg-blue-600 h-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2">{Math.round(progress)}%</p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Execute Button */}
                    <div className="flex gap-3">
                        <Button
                            onClick={handleBatchOperation}
                            disabled={loading || selectedStudents.length === 0}
                            className={`flex-1 gap-2 py-2 ${operationType === 'delete'
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <Loader className="h-4 w-4 animate-spin" />
                                    جاري المعالجة...
                                </>
                            ) : (
                                <>
                                    <Zap className="h-4 w-4" />
                                    تنفيذ العملية
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={() => navigate('/students')}
                            variant="outline"
                        >
                            إلغاء
                        </Button>
                    </div>

                    {/* Info Box */}
                    <Card className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-900">
                                <p className="font-semibold mb-1">ملاحظة مهمة</p>
                                <p>ستتم العملية على جميع الطلاب المختارين في نفس الوقت. يمكن التراجع عن التغييرات إذا لزم الأمر.</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </PageLayout>
        </DashboardLayout>
    );
}