/**
 * Salary Items Dialog - إدارة بنود الراتب
 * Manage salary allowances and deductions
 */

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Plus,
    Trash2,
    Loader2,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Calculator,
} from 'lucide-react';
import { Salary, SalaryItem } from '@/types/finance';
import { toast } from 'sonner';

interface SalaryItemsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    salary: Salary | null;
    onSave?: (salaryId: string, items: SalaryItem[]) => Promise<void>;
}

// Default allowance types
const ALLOWANCE_TYPES = [
    { code: 'housing', name: 'بدل سكن' },
    { code: 'transport', name: 'بدل انتقال' },
    { code: 'overtime', name: 'عمل إضافي' },
    { code: 'bonus', name: 'مكافأة' },
    { code: 'performance', name: 'بدل أداء' },
    { code: 'phone', name: 'بدل هاتف' },
    { code: 'other_allowance', name: 'بدل آخر' },
];

// Default deduction types
const DEDUCTION_TYPES = [
    { code: 'insurance', name: 'تأمينات' },
    { code: 'taxes', name: 'ضرائب' },
    { code: 'loan', name: 'سلفة' },
    { code: 'absence', name: 'خصم غياب' },
    { code: 'late', name: 'خصم تأخير' },
    { code: 'penalty', name: 'جزاء' },
    { code: 'other_deduction', name: 'خصم آخر' },
];

export function SalaryItemsDialog({
    open,
    onOpenChange,
    salary,
    onSave,
}: SalaryItemsDialogProps) {
    const [items, setItems] = useState<SalaryItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New item form
    const [newItem, setNewItem] = useState({
        itemType: 'بدل' as 'بدل' | 'خصم',
        itemName: '',
        amount: '',
        notes: '',
    });

    // Initialize items from salary
    useEffect(() => {
        if (salary?.items) {
            setItems(salary.items);
        } else {
            setItems([]);
        }
    }, [salary]);

    // Calculate totals
    const allowances = items.filter(i => i.itemType === 'بدل');
    const deductions = items.filter(i => i.itemType === 'خصم');
    const totalAllowances = allowances.reduce((sum, i) => sum + i.amount, 0);
    const totalDeductions = deductions.reduce((sum, i) => sum + i.amount, 0);
    const baseSalary = salary?.baseSalary || 0;
    const calculatedNetSalary = baseSalary + totalAllowances - totalDeductions;

    // Add new item
    const handleAddItem = () => {
        if (!newItem.itemName || !newItem.amount) {
            toast.error('يرجى إدخال اسم البند والمبلغ');
            return;
        }

        const amount = parseFloat(newItem.amount);
        if (isNaN(amount) || amount <= 0) {
            toast.error('يرجى إدخال مبلغ صحيح');
            return;
        }

        setItems(prev => [
            ...prev,
            {
                id: `temp-${Date.now()}`,
                itemType: newItem.itemType,
                itemName: newItem.itemName,
                amount,
                notes: newItem.notes,
            },
        ]);

        // Reset form
        setNewItem({
            itemType: 'بدل',
            itemName: '',
            amount: '',
            notes: '',
        });
    };

    // Remove item
    const handleRemoveItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    // Save changes
    const handleSave = async () => {
        if (!salary || !onSave) return;

        setIsSubmitting(true);
        try {
            await onSave(salary.id, items);
            toast.success('تم حفظ بنود الراتب بنجاح');
            onOpenChange(false);
        } catch (error) {
            toast.error('حدث خطأ أثناء حفظ البنود');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-blue-600" />
                        إدارة بنود الراتب
                        {salary?.employee?.fullName && (
                            <span className="text-gray-500 font-normal">
                                - {salary.employee.fullName}
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Salary Summary */}
                    <div className="grid grid-cols-4 gap-3">
                        <div className="p-3 rounded-lg bg-gray-50 text-center">
                            <p className="text-xs text-gray-500">الراتب الأساسي</p>
                            <p className="text-lg font-bold text-gray-700">
                                {baseSalary.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-50 text-center">
                            <p className="text-xs text-green-600">البدلات</p>
                            <p className="text-lg font-bold text-green-700">
                                +{totalAllowances.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-3 rounded-lg bg-red-50 text-center">
                            <p className="text-xs text-red-600">الخصومات</p>
                            <p className="text-lg font-bold text-red-700">
                                -{totalDeductions.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-50 text-center">
                            <p className="text-xs text-blue-600">صافي الراتب</p>
                            <p className="text-lg font-bold text-blue-700">
                                {calculatedNetSalary.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Add New Item Form */}
                    <div className="p-4 rounded-lg border bg-gray-50 space-y-4">
                        <p className="font-medium text-sm text-gray-700">إضافة بند جديد</p>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                                <Label className="text-xs">النوع</Label>
                                <Select
                                    value={newItem.itemType}
                                    onValueChange={(v) => setNewItem(prev => ({
                                        ...prev,
                                        itemType: v as 'بدل' | 'خصم',
                                        itemName: ''
                                    }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="بدل">
                                            <span className="flex items-center gap-2">
                                                <TrendingUp className="h-3 w-3 text-green-600" />
                                                بدل
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="خصم">
                                            <span className="flex items-center gap-2">
                                                <TrendingDown className="h-3 w-3 text-red-600" />
                                                خصم
                                            </span>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs">البند</Label>
                                <Select
                                    value={newItem.itemName}
                                    onValueChange={(v) => setNewItem(prev => ({ ...prev, itemName: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر البند" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(newItem.itemType === 'بدل' ? ALLOWANCE_TYPES : DEDUCTION_TYPES).map(type => (
                                            <SelectItem key={type.code} value={type.name}>
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs">المبلغ (ج.م)</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={newItem.amount}
                                    onChange={(e) => setNewItem(prev => ({ ...prev, amount: e.target.value }))}
                                />
                            </div>

                            <div className="flex items-end">
                                <Button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                    <Plus className="h-4 w-4 ml-1" />
                                    إضافة
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Items Lists */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Allowances */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <span className="font-medium text-green-700">البدلات</span>
                                <Badge variant="secondary" className="bg-green-100 text-green-700">
                                    {allowances.length}
                                </Badge>
                            </div>
                            {allowances.length === 0 ? (
                                <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg text-center">
                                    لا توجد بدلات
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {allowances.map((item, idx) => (
                                        <div
                                            key={item.id || idx}
                                            className="flex items-center justify-between p-2 rounded-lg bg-green-50 border border-green-100"
                                        >
                                            <div>
                                                <p className="font-medium text-sm">{item.itemName}</p>
                                                <p className="text-xs text-gray-500">{item.notes}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-green-700">
                                                    +{item.amount.toLocaleString()}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleRemoveItem(items.indexOf(item))}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Deductions */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <TrendingDown className="h-4 w-4 text-red-600" />
                                <span className="font-medium text-red-700">الخصومات</span>
                                <Badge variant="secondary" className="bg-red-100 text-red-700">
                                    {deductions.length}
                                </Badge>
                            </div>
                            {deductions.length === 0 ? (
                                <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg text-center">
                                    لا توجد خصومات
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {deductions.map((item, idx) => (
                                        <div
                                            key={item.id || idx}
                                            className="flex items-center justify-between p-2 rounded-lg bg-red-50 border border-red-100"
                                        >
                                            <div>
                                                <p className="font-medium text-sm">{item.itemName}</p>
                                                <p className="text-xs text-gray-500">{item.notes}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-red-700">
                                                    -{item.amount.toLocaleString()}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleRemoveItem(items.indexOf(item))}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        إلغاء
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        ) : (
                            <DollarSign className="h-4 w-4 ml-2" />
                        )}
                        حفظ التغييرات
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default SalaryItemsDialog;
