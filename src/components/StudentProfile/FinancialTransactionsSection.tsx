import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FinancialTransaction } from '@/types/student';
import { Trash2, Plus } from 'lucide-react';
import { getEgyptianDateString } from '@/utils/helpers';

interface FinancialTransactionsSectionProps {
    data?: FinancialTransaction[];
    onSave?: (data: FinancialTransaction[]) => Promise<void>;
    isReadOnly?: boolean;
}

/**
 * قسم المعاملات المالية
 * يحتوي على تسجيل جميع المعاملات المالية للطالب
 */
export function FinancialTransactionsSection({
    data,
    onSave,
    isReadOnly = false,
}: FinancialTransactionsSectionProps) {
    const [transactions, setTransactions] = useState<FinancialTransaction[]>(
        data || []
    );
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(!isReadOnly);

    const handleAddTransaction = () => {
        const newTransaction: FinancialTransaction = {
            transactionType: 'دفعة',
            amount: 0,
            description: '',
            paymentMethod: 'نقدي',
            transactionDate: getEgyptianDateString(),
            receiptNumber: '',
            createdBy: '',
        };
        setTransactions([...transactions, newTransaction]);
    };

    const handleUpdateTransaction = (
        index: number,
        field: keyof FinancialTransaction,
        value: any
    ) => {
        const updated = [...transactions];
        updated[index] = {
            ...updated[index],
            [field]: value,
        };
        setTransactions(updated);
    };

    const handleDeleteTransaction = (index: number) => {
        setTransactions(transactions.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            if (onSave) {
                await onSave(transactions);
            }
            setIsEditing(false);
        } catch (error) {
            console.error('خطأ في حفظ المعاملات المالية:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const getTotalAmount = () => {
        return transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    };

    return (
        <Card className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">💰 المعاملات المالية</h2>
                {!isReadOnly && (
                    <Button
                        onClick={() => setIsEditing(!isEditing)}
                        variant="outline"
                        size="sm"
                    >
                        {isEditing ? 'إلغاء' : 'تعديل'}
                    </Button>
                )}
            </div>

            {/* قائمة المعاملات */}
            <div className="space-y-4 mb-6">
                {transactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        لا توجد معاملات مالية مسجلة حالياً
                    </div>
                ) : (
                    transactions.map((transaction, index) => (
                        <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* نوع المعاملة */}
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                                        نوع المعاملة
                                    </Label>
                                    <select
                                        value={transaction.transactionType || 'دفعة'}
                                        onChange={(e) =>
                                            handleUpdateTransaction(
                                                index,
                                                'transactionType',
                                                e.target.value as any
                                            )
                                        }
                                        disabled={isReadOnly || !isEditing}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="دفعة">دفعة</option>
                                        <option value="مصروف إضافي">مصروف إضافي</option>
                                        <option value="خصم">خصم</option>
                                        <option value="غرامة">غرامة</option>
                                    </select>
                                </div>

                                {/* المبلغ */}
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                                        المبلغ (جنيه)
                                    </Label>
                                    <Input
                                        type="number"
                                        value={transaction.amount || 0}
                                        onChange={(e) =>
                                            handleUpdateTransaction(
                                                index,
                                                'amount',
                                                parseFloat(e.target.value)
                                            )
                                        }
                                        disabled={isReadOnly || !isEditing}
                                        placeholder="0"
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                </div>

                                {/* طريقة الدفع */}
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                                        طريقة الدفع
                                    </Label>
                                    <select
                                        value={transaction.paymentMethod || 'نقدي'}
                                        onChange={(e) =>
                                            handleUpdateTransaction(
                                                index,
                                                'paymentMethod',
                                                e.target.value
                                            )
                                        }
                                        disabled={isReadOnly || !isEditing}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    >
                                        <option>نقدي</option>
                                        <option>شيك</option>
                                        <option>تحويل بنكي</option>
                                        <option>بطاقة ائتمان</option>
                                    </select>
                                </div>

                                {/* تاريخ المعاملة */}
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                                        تاريخ المعاملة
                                    </Label>
                                    <Input
                                        type="date"
                                        value={transaction.transactionDate || ''}
                                        onChange={(e) =>
                                            handleUpdateTransaction(
                                                index,
                                                'transactionDate',
                                                e.target.value
                                            )
                                        }
                                        disabled={isReadOnly || !isEditing}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                </div>

                                {/* رقم الإيصال */}
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                                        رقم الإيصال
                                    </Label>
                                    <Input
                                        value={transaction.receiptNumber || ''}
                                        onChange={(e) =>
                                            handleUpdateTransaction(
                                                index,
                                                'receiptNumber',
                                                e.target.value
                                            )
                                        }
                                        disabled={isReadOnly || !isEditing}
                                        placeholder="أدخل رقم الإيصال"
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                </div>

                                {/* من قام بالمعاملة */}
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                                        من قام بالمعاملة
                                    </Label>
                                    <Input
                                        value={transaction.createdBy || ''}
                                        onChange={(e) =>
                                            handleUpdateTransaction(
                                                index,
                                                'createdBy',
                                                e.target.value
                                            )
                                        }
                                        disabled={isReadOnly || !isEditing}
                                        placeholder="اسم الموظف"
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>

                            {/* الوصف */}
                            <div className="mt-4">
                                <Label className="block text-sm font-medium text-gray-700 mb-2">
                                    الوصف
                                </Label>
                                <textarea
                                    value={transaction.description || ''}
                                    onChange={(e) =>
                                        handleUpdateTransaction(
                                            index,
                                            'description',
                                            e.target.value
                                        )
                                    }
                                    disabled={isReadOnly || !isEditing}
                                    placeholder="أدخل وصف المعاملة"
                                    rows={3}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                />
                            </div>

                            {/* حذف */}
                            {isEditing && !isReadOnly && (
                                <div className="mt-4 flex justify-end">
                                    <Button
                                        onClick={() => handleDeleteTransaction(index)}
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        حذف
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* الإجمالي */}
            {transactions.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="text-lg font-bold text-blue-900">
                        إجمالي المعاملات: {(getTotalAmount() || 0).toFixed(2)} جنيه
                    </div>
                </div>
            )}

            {/* أزرار التحكم */}
            {isEditing && !isReadOnly && (
                <div className="flex gap-3">
                    <Button
                        onClick={handleAddTransaction}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        إضافة معاملة جديدة
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isSaving ? 'جاري الحفظ...' : 'حفظ المعاملات'}
                    </Button>
                </div>
            )}
        </Card>
    );
}