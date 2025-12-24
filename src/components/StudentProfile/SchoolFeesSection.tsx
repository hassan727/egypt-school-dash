import { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { SchoolFees, OtherExpense, Installment } from '@/types/student';
import { EXPENSE_TYPES, STAGES_DATA } from '@/data/studentConstants';
import { Trash2, Plus } from 'lucide-react';
import { getEgyptianDateString } from '@/utils/helpers';

interface SchoolFeesSectionProps {
    feesData?: SchoolFees;
    expensesData?: OtherExpense[];
    enrollmentData?: { stage: string; class: string };
    onSaveFees?: (data: SchoolFees, installments: Installment[], auditLog: any[]) => Promise<void> | void;
    onSaveExpenses?: (data: OtherExpense[], optionalExpenses: any) => Promise<void> | void;
    isReadOnly?: boolean;
}

/**
 * قسم المصروفات
 * يحتوي على المصروفات الدراسية والأقساط والمصروفات الأخرى
 */
export function SchoolFeesSection({
    feesData,
    expensesData,
    enrollmentData,
    onSaveFees,
    onSaveExpenses,
    isReadOnly = false,
}: SchoolFeesSectionProps) {
    // حالة المصروفات الدراسية
    const [formData, setFormData] = useState<SchoolFees>(
        feesData || {
            studentId: '',
            totalAmount: 0,
            installmentCount: 1,
            advancePayment: 0,
            installments: [],
        }
    );

    useEffect(() => {
        if (feesData) {
            setFormData(feesData);
        }
    }, [feesData]);

    // المرحلة الدراسية (لتحديد المبلغ الإجمالي تلقائيًا)
    const [selectedStage, setSelectedStage] = useState<string>('');

    // عند تغيير بيانات القيد الدراسي، تحديث المرحلة تلقائيًا
    useEffect(() => {
        if (enrollmentData?.stage && enrollmentData.stage !== selectedStage) {
            setSelectedStage(enrollmentData.stage);
            handleStageChange(enrollmentData.stage);
        }
    }, [enrollmentData?.stage]);

    // حالة المصروفات الأخرى
    const [otherExpenses, setOtherExpenses] = useState<OtherExpense[]>(
        expensesData || [{
            studentId: '',
            expenseType: '',
            quantity: 1,
            totalPrice: 0,
            date: getEgyptianDateString(),
        }]
    );

    // حالة المصروفات الاختيارية
    const [optionalExpenses, setOptionalExpenses] = useState({
        transportation: {
            enabled: false,
            monthlyPrice: 500,
            months: 1,
            total: 500,
        },
        uniform: {
            enabled: false,
            jacket: { price: 250, quantity: 0, total: 0 },
            pants: { price: 200, quantity: 0, total: 0 },
            tshirt: { price: 150, quantity: 0, total: 0 },
            total: 0,
        },
        digitalPlatforms: {
            enabled: false,
            price: 150,
            total: 150,
        },
        trips: {
            enabled: false,
            activityType: '',
            price: 500,
            quantity: 1,
            total: 500,
        },
        events: {
            enabled: false,
            eventType: '',
            ticketPrice: 300,
            tickets: 1,
            total: 300,
        },
        books: {
            enabled: false,
            price: 200,
            quantity: 1,
            total: 200,
        },
    });

    const [isSaving, setIsSaving] = useState(false);
    // في وضع الإضافة (isReadOnly = false)، الحقول مفعّلة بشكل افتراضي
    const [isEditing, setIsEditing] = useState(!isReadOnly);

    // حالة نظام الخصومات
    const [discountType, setDiscountType] = useState<string>('');
    const [discountAmount, setDiscountAmount] = useState<number>(0);
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [discountApplied, setDiscountApplied] = useState<boolean>(false);
    const [discountErrorMessage, setDiscountErrorMessage] = useState<string>('');
    const [discountSuccessMessage, setDiscountSuccessMessage] = useState<string>('');

    // سجل الأنشطة (Audit Log)
    const [auditLog, setAuditLog] = useState<Array<{ action: string, timestamp: string, user: string }>>([]);

    // حساب الأقساط ديناميكياً
    const installments = useMemo(() => {
        const count = formData.installmentCount || 1;
        const remaining = (formData.totalAmount || 0) - (formData.advancePayment || 0);

        // حساب الأقساط مع تقريب الأرقام وإضافة الفرق للقسط الأخير
        const installmentsArray = [];
        let totalCalculated = 0;

        for (let i = 0; i < count; i++) {
            const existingInstallment = formData.installments?.[i];

            let amount;
            if (i === count - 1) {
                // القسط الأخير يحتوي على الفرق الناتج عن التقريب
                amount = remaining - totalCalculated;
            } else {
                // تقريب المبلغ إلى أقرب جنيه
                amount = Math.round(remaining / count);
            }

            totalCalculated += amount;

            // حساب التاريخ تلقائيًا (بداية العام الدراسي أو اليوم)
            let dueDate;
            if (existingInstallment?.dueDate) {
                dueDate = existingInstallment.dueDate;
            } else {
                // استخدام بداية العام الدراسي (سبتمبر) أو اليوم
                const baseDate = new Date(new Date().getFullYear(), 8, 1); // 1 سبتمبر من العام الحالي
                dueDate = new Date(baseDate.setMonth(baseDate.getMonth() + i))
                    .toISOString()
                    .split('T')[0];
            }

            installmentsArray.push({
                id: existingInstallment?.id,
                installmentNumber: i + 1,
                amount: parseFloat(amount.toFixed(2)),
                dueDate: dueDate,
                paid: existingInstallment?.paid || false,
                paidDate: existingInstallment?.paidDate,
            } as Installment);
        }

        return installmentsArray;
    }, [formData.totalAmount, formData.installmentCount, formData.advancePayment, formData.installments]);

    // خريطة المراحل إلى الأسعار
    const stagePrices: Record<string, number> = {
        'KG': 20000,
        'ابتدائي': 30000,
        'إعدادي': 35000,
        'ثانوي': 40000,
    };

    // تحديد المبلغ الإجمالي تلقائيًا عند اختيار المرحلة
    const handleStageChange = (stage: string) => {
        setSelectedStage(stage);

        // تحديد الفئة العامة للمرحلة
        let category = '';
        if (stage.includes('KG')) {
            category = 'KG';
        } else if (stage.includes('ابتدائي')) {
            category = 'ابتدائي';
        } else if (stage.includes('إعدادي')) {
            category = 'إعدادي';
        } else if (stage.includes('ثانوي')) {
            category = 'ثانوي';
        }

        // تحديد المبلغ الإجمالي تلقائيًا
        const amount = stagePrices[category] || 0;
        handleFeesChange('totalAmount', amount);
    };

    const handleFeesChange = (field: keyof SchoolFees, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));

        // إضافة إلى سجل الأنشطة
        const action = `تغيير ${field.toString()} إلى ${value}`;
        setAuditLog(prev => [...prev, {
            action,
            timestamp: new Date().toLocaleString('ar-EG'),
            user: 'المستخدم الحالي'
        }]);
    };

    // عند تغيير قيمة الخصم، إظهار حقل كلمة السر
    const handleDiscountAmountChange = (value: number) => {
        setDiscountAmount(value);
        if (value > 0) {
            setShowPassword(true);
        } else {
            setShowPassword(false);
            setPassword('');
            setDiscountErrorMessage('');
        }
    };

    // تطبيق الخصم بعد التحقق من كلمة السر
    const applyDiscount = () => {
        // إعادة تعيين الرسائل
        setDiscountErrorMessage('');
        setDiscountSuccessMessage('');

        // تطبيق الخصم مباشرة بدون كلمة سر
        const newTotal = Math.max(0, (formData.totalAmount || 0) - discountAmount);
        setFormData(prev => ({
            ...prev,
            totalAmount: newTotal,
        }));

        setDiscountApplied(true);
        setDiscountSuccessMessage('تم تطبيق الخصم بنجاح.');

        // إضافة إلى سجل الأنشطة
        setAuditLog(prev => [...prev, {
            action: `تطبيق خصم ${discountAmount} جنيه - نوع: ${discountType}`,
            timestamp: new Date().toLocaleString('ar-EG'),
            user: 'المستخدم الحالي'
        }]);
    };

    // إزالة الخصم
    const removeDiscount = () => {
        setDiscountType('');
        setDiscountAmount(0);
        setPassword('');
        setShowPassword(false);
        setDiscountApplied(false);
        setDiscountErrorMessage('');
        setDiscountSuccessMessage('');

        // إعادة المبلغ الإجمالي إلى القيمة الأصلية
        const originalAmount = stagePrices[selectedStage] || 0;
        setFormData(prev => ({
            ...prev,
            totalAmount: originalAmount,
        }));

        // إضافة إلى سجل الأنشطة
        setAuditLog(prev => [...prev, {
            action: 'إزالة الخصم',
            timestamp: new Date().toLocaleString('ar-EG'),
            user: 'المستخدم الحالي'
        }]);
    };

    const handleInstallmentChange = (index: number, field: string, value: any) => {
        const updatedInstallments = [...installments];
        updatedInstallments[index] = {
            ...updatedInstallments[index],
            [field]: value,
        };
        setFormData(prev => ({
            ...prev,
            installments: updatedInstallments,
        }));

        // إضافة إلى سجل الأنشطة
        setAuditLog(prev => [...prev, {
            action: `تعديل قسط #${index + 1} - ${field}: ${value}`,
            timestamp: new Date().toLocaleString('ar-EG'),
            user: 'المستخدم الحالي'
        }]);
    };

    const handleExpenseChange = (index: number, field: keyof OtherExpense, value: any) => {
        const updatedExpenses = [...otherExpenses];
        updatedExpenses[index] = {
            ...updatedExpenses[index],
            [field]: value,
        };
        setOtherExpenses(updatedExpenses);
    };

    // تحديث المصروفات الاختيارية
    const updateOptionalExpense = (category: string, field: string, value: any) => {
        setOptionalExpenses(prev => {
            const updated = { ...prev };

            if (category === 'transportation') {
                updated.transportation = { ...updated.transportation, [field]: value };
                // إعادة حساب الإجمالي
                if (field === 'monthlyPrice' || field === 'months') {
                    updated.transportation.total =
                        updated.transportation.monthlyPrice * updated.transportation.months;
                }
            } else if (category === 'uniform') {
                if (field in updated.uniform) {
                    updated.uniform = { ...updated.uniform, [field]: value };
                } else {
                    // تحديث عنصر الزي (جاكيت، بنطلون، تيشيرت)
                    const item = field.split('.')[0];
                    const prop = field.split('.')[1];
                    if (item && prop) {
                        if (item === 'jacket') {
                            updated.uniform.jacket = {
                                ...updated.uniform.jacket,
                                [prop]: value
                            };
                        } else if (item === 'pants') {
                            updated.uniform.pants = {
                                ...updated.uniform.pants,
                                [prop]: value
                            };
                        } else if (item === 'tshirt') {
                            updated.uniform.tshirt = {
                                ...updated.uniform.tshirt,
                                [prop]: value
                            };
                        }
                    }
                }
                // إعادة حساب إجمالي الزي
                updated.uniform.total =
                    (updated.uniform.jacket?.quantity || 0) * (updated.uniform.jacket?.price || 0) +
                    (updated.uniform.pants?.quantity || 0) * (updated.uniform.pants?.price || 0) +
                    (updated.uniform.tshirt?.quantity || 0) * (updated.uniform.tshirt?.price || 0);
            } else if (category === 'digitalPlatforms') {
                updated.digitalPlatforms = { ...updated.digitalPlatforms, [field]: value };
                // إعادة حساب الإجمالي
                if (field === 'price') {
                    updated.digitalPlatforms.total = updated.digitalPlatforms.price;
                }
            } else if (category === 'trips') {
                updated.trips = { ...updated.trips, [field]: value };
                // إعادة حساب الإجمالي
                if (field === 'price' || field === 'quantity') {
                    updated.trips.total = updated.trips.price * updated.trips.quantity;
                }
            } else if (category === 'events') {
                updated.events = { ...updated.events, [field]: value };
                // إعادة حساب الإجمالي
                if (field === 'ticketPrice' || field === 'tickets') {
                    updated.events.total = updated.events.ticketPrice * updated.events.tickets;
                }
            } else if (category === 'books') {
                updated.books = { ...updated.books, [field]: value };
                // إعادة حساب الإجمالي
                if (field === 'price' || field === 'quantity') {
                    updated.books.total = updated.books.price * updated.books.quantity;
                }
            }

            return updated;
        });
    };

    // تفعيل/إلغاء مصروف اختياري
    const toggleOptionalExpense = (category: string) => {
        setOptionalExpenses(prev => ({
            ...prev,
            [category]: {
                ...prev[category as keyof typeof prev],
                enabled: !prev[category as keyof typeof prev].enabled
            }
        }));
    };

    const addExpense = () => {
        setOtherExpenses([
            ...otherExpenses,
            {
                studentId: '',
                expenseType: '',
                quantity: 1,
                totalPrice: 0,
                date: getEgyptianDateString(),
            },
        ]);
    };

    const removeExpense = (index: number) => {
        if (otherExpenses.length > 1) {
            setOtherExpenses(otherExpenses.filter((_, i) => i !== index));
        }
    };

    const totalExpenses = otherExpenses.reduce((sum, expense) => sum + (expense.totalPrice || 0), 0);

    // حساب إجمالي المصروفات الاختيارية
    const totalOptionalExpenses = useMemo(() => {
        let total = 0;
        if (optionalExpenses.transportation.enabled) {
            total += optionalExpenses.transportation.total || 0;
        }
        if (optionalExpenses.uniform.enabled) {
            total += optionalExpenses.uniform.total || 0;
        }
        if (optionalExpenses.digitalPlatforms.enabled) {
            total += optionalExpenses.digitalPlatforms.total || 0;
        }
        if (optionalExpenses.trips.enabled) {
            total += optionalExpenses.trips.total || 0;
        }
        if (optionalExpenses.events.enabled) {
            total += optionalExpenses.events.total || 0;
        }
        if (optionalExpenses.books.enabled) {
            total += optionalExpenses.books.total || 0;
        }
        return total;
    }, [optionalExpenses]);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            if (onSaveFees) {
                const result = onSaveFees(formData, installments, auditLog);
                if (result instanceof Promise) {
                    await result;
                }
            }
            if (onSaveExpenses) {
                const result = onSaveExpenses(otherExpenses, optionalExpenses);
                if (result instanceof Promise) {
                    await result;
                }
            }
            setIsEditing(false);
        } catch (error) {
            console.error('خطأ في حفظ البيانات:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* قسم المصروفات الدراسية */}
            <Card className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                {/* رأس القسم */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">🪙 المصروفات الدراسية</h2>
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

                {/* شبكة الحقول */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* المرحلة الدراسية */}
                    <div>
                        <Label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-2">
                            المرحلة الدراسية
                        </Label>
                        <Select value={selectedStage} onValueChange={handleStageChange} disabled={isReadOnly || !isEditing}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="اختر المرحلة الدراسية" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="KG">KG - 20,000 جنيه</SelectItem>
                                <SelectItem value="ابتدائي">ابتدائي - 30,000 جنيه</SelectItem>
                                <SelectItem value="إعدادي">إعدادي - 35,000 جنيه</SelectItem>
                                <SelectItem value="ثانوي">ثانوي - 40,000 جنيه</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* المبلغ الإجمالي */}
                    <div>
                        <Label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-2">
                            المبلغ الإجمالي
                        </Label>
                        <Input
                            id="totalAmount"
                            type="number"
                            value={formData.totalAmount}
                            onChange={(e) => handleFeesChange('totalAmount', parseFloat(e.target.value) || 0)}
                            placeholder="يتم تحديد المبلغ تلقائيًا عند اختيار المرحلة"
                            disabled={isReadOnly || !isEditing}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* عدد الأقساط */}
                    <div>
                        <Label htmlFor="installmentCount" className="block text-sm font-medium text-gray-700 mb-2">
                            عدد الأقساط
                        </Label>
                        <Select value={formData.installmentCount?.toString()} onValueChange={(value) => handleFeesChange('installmentCount', parseInt(value))} disabled={isReadOnly || !isEditing}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="اختر عدد الأقساط" />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4, 6, 8, 10, 12].map((count) => (
                                    <SelectItem key={count} value={count.toString()}>
                                        {count} أقساط
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* الدفعة المقدمة */}
                    <div className="md:col-span-2">
                        <Label htmlFor="advancePayment" className="block text-sm font-medium text-gray-700 mb-2">
                            الدفعة المقدمة
                        </Label>
                        <Input
                            id="advancePayment"
                            type="number"
                            value={formData.advancePayment}
                            onChange={(e) => handleFeesChange('advancePayment', parseFloat(e.target.value) || 0)}
                            placeholder="أدخل الدفعة المقدمة"
                            disabled={isReadOnly || !isEditing}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* نظام الخصومات */}
                    <div className="md:col-span-2 border-t pt-6 mt-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">نظام الخصومات</h3>

                        {/* نوع الخصم */}
                        <div className="mb-4">
                            <Label htmlFor="discountType" className="block text-sm font-medium text-gray-700 mb-2">
                                اختر نوع الخصم
                            </Label>
                            <Select value={discountType} onValueChange={setDiscountType} disabled={isReadOnly || !isEditing || discountApplied}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="اختر نوع الخصم" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="brother-second">خصم الأخوة (الطالب الثاني)</SelectItem>
                                    <SelectItem value="brother-third">خصم الأخوة (الطالب الثالث فأكثر)</SelectItem>
                                    <SelectItem value="employee-children">خصم أبناء العاملين</SelectItem>
                                    <SelectItem value="academic-excellence">خصم تفوق دراسي</SelectItem>
                                    <SelectItem value="special">خصم خاص (إداري)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* قيمة الخصم */}
                        {discountType && (
                            <div className="mb-4">
                                <Label htmlFor="discountAmount" className="block text-sm font-medium text-gray-700 mb-2">
                                    قيمة الخصم (جنيه)
                                </Label>
                                <Input
                                    id="discountAmount"
                                    type="number"
                                    value={discountAmount}
                                    onChange={(e) => handleDiscountAmountChange(parseFloat(e.target.value) || 0)}
                                    placeholder="أدخل قيمة الخصم"
                                    disabled={isReadOnly || !isEditing || discountApplied}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        )}


                        {/* زر تطبيق الخصم */}
                        {discountType && discountAmount > 0 && !discountApplied && (
                            <div className="mb-4">
                                <Button
                                    onClick={applyDiscount}
                                    className="bg-blue-600 hover:bg-blue-700"
                                    disabled={isReadOnly || !isEditing}
                                >
                                    تطبيق الخصم
                                </Button>
                            </div>
                        )}

                        {/* رسائل الخطأ والنجاح */}
                        {discountErrorMessage && (
                            <div className="text-red-500 text-sm mb-2">{discountErrorMessage}</div>
                        )}
                        {discountSuccessMessage && (
                            <div className="text-green-500 text-sm mb-2">{discountSuccessMessage}</div>
                        )}

                        {/* زر إزالة الخصم */}
                        {discountApplied && (
                            <Button
                                onClick={removeDiscount}
                                variant="outline"
                                className="mt-2 text-red-600 border-red-600 hover:bg-red-50"
                                disabled={isReadOnly || !isEditing}
                            >
                                إزالة الخصم
                            </Button>
                        )}
                    </div>
                </div>

                {/* جدول الأقساط */}
                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">جدول الأقساط</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse border border-gray-300">
                            <thead className="bg-blue-100">
                                <tr>
                                    <th className="p-3 text-right text-sm font-bold text-blue-900 border border-blue-200">القسط</th>
                                    <th className="p-3 text-right text-sm font-bold text-blue-900 border border-blue-200">المبلغ</th>
                                    <th className="p-3 text-right text-sm font-bold text-blue-900 border border-blue-200">تاريخ الاستحقاق</th>
                                    <th className="p-3 text-right text-sm font-bold text-blue-900 border border-blue-200">مدفوع؟</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {installments.map((installment, index) => (
                                    <tr key={index} className="hover:bg-blue-50 transition-colors">
                                        <td className="p-3 text-right text-sm border border-gray-200 font-medium">{installment.installmentNumber}</td>
                                        <td className="p-3 text-right text-sm border border-gray-200 font-medium">{(installment.amount || 0).toFixed(2)}</td>
                                        <td className="p-3 border border-gray-200">
                                            <Input
                                                type="date"
                                                value={installment.dueDate}
                                                onChange={(e) => handleInstallmentChange(index, 'dueDate', e.target.value)}
                                                disabled={isReadOnly || !isEditing}
                                                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                            />
                                        </td>
                                        <td className="p-3 border border-gray-200">
                                            <Checkbox
                                                checked={installment.paid}
                                                onCheckedChange={(checked) => handleInstallmentChange(index, 'paid', checked)}
                                                disabled={isReadOnly || !isEditing}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ملخص المصروفات */}
                <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">ملخص المصروفات</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-600">المبلغ الإجمالي</p>
                            <p className="text-2xl font-bold text-blue-600">{(formData.totalAmount || 0).toFixed(2)} جنيه</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-gray-600">الدفعة المقدمة</p>
                            <p className="text-2xl font-bold text-green-600">{(formData.advancePayment || 0).toFixed(2)} جنيه</p>
                        </div>
                        <div className="p-4 bg-red-50 rounded-lg">
                            <p className="text-sm text-gray-600">الخصم</p>
                            <p className="text-2xl font-bold text-red-600">{(discountAmount || 0).toFixed(2)} جنيه</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                            <p className="text-sm text-gray-600">المبلغ المتبقي</p>
                            <p className="text-2xl font-bold text-purple-600">{((formData.totalAmount || 0) - (formData.advancePayment || 0) - (discountAmount || 0)).toFixed(2)} جنيه</p>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-lg">
                            <p className="text-sm text-gray-600">المصروفات الأخرى</p>
                            <p className="text-2xl font-bold text-amber-600">{(totalExpenses + totalOptionalExpenses).toFixed(2)} جنيه</p>
                        </div>
                    </div>

                    {/* ملخص الأقساط */}
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">إجمالي الأقساط</p>
                        <p className="text-xl font-bold text-gray-800">
                            {installments.reduce((sum, inst) => sum + (inst.amount || 0), 0).toFixed(2)} جنيه
                            ({installments.length} أقساط)
                        </p>
                        {/* تنبيه إذا كان الإجمالي الفعلي مختلفًا عن المبلغ الأصلي */}
                        {Math.abs(installments.reduce((sum, inst) => sum + (inst.amount || 0), 0) - ((formData.totalAmount || 0) - (formData.advancePayment || 0))) > 0.01 && (
                            <p className="text-sm text-orange-600 mt-2">
                                ⚠️ الإجمالي الفعلي: {installments.reduce((sum, inst) => sum + (inst.amount || 0), 0).toFixed(2)} جنيه
                                {installments.reduce((sum, inst) => sum + (inst.amount || 0), 0) > ((formData.totalAmount || 0) - (formData.advancePayment || 0)) ? ' (أكثر من المبلغ الأصلي)' : ' (أقل من المبلغ الأصلي)'}
                            </p>
                        )}
                    </div>

                    {/* الإجمالي الكلي */}
                    <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
                        <p className="text-sm text-gray-600">الإجمالي الكلي</p>
                        <p className="text-2xl font-bold text-indigo-600">
                            {((formData.totalAmount || 0) + totalExpenses + totalOptionalExpenses).toFixed(2)} جنيه
                        </p>
                    </div>

                    {/* سجل الأنشطة */}
                    {auditLog.length > 0 && (
                        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                            <h4 className="text-md font-semibold text-gray-800 mb-2">سجل الأنشطة</h4>
                            <ul className="text-sm text-gray-600 max-h-40 overflow-y-auto">
                                {auditLog.map((log, index) => (
                                    <li key={index} className="mb-1">
                                        <span className="font-medium">{log.timestamp}</span> - {log.action} ({log.user})
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* سجل الأنشطة */}
                    {auditLog.length > 0 && (
                        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                            <h4 className="text-md font-semibold text-gray-800 mb-2">سجل الأنشطة</h4>
                            <ul className="text-sm text-gray-600 max-h-40 overflow-y-auto">
                                {auditLog.map((log, index) => (
                                    <li key={index} className="mb-1">
                                        <span className="font-medium">{log.timestamp}</span> - {log.action} ({log.user})
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* سجل الأنشطة */}
                    {auditLog.length > 0 && (
                        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                            <h4 className="text-md font-semibold text-gray-800 mb-2">سجل الأنشطة</h4>
                            <ul className="text-sm text-gray-600 max-h-40 overflow-y-auto">
                                {auditLog.map((log, index) => (
                                    <li key={index} className="mb-1">
                                        <span className="font-medium">{log.timestamp}</span> - {log.action} ({log.user})
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* سجل الأنشطة */}
                    {auditLog.length > 0 && (
                        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                            <h4 className="text-md font-semibold text-gray-800 mb-2">سجل الأنشطة</h4>
                            <ul className="text-sm text-gray-600 max-h-40 overflow-y-auto">
                                {auditLog.map((log, index) => (
                                    <li key={index} className="mb-1">
                                        <span className="font-medium">{log.timestamp}</span> - {log.action} ({log.user})
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </Card>

            {/* قسم المصروفات الأخرى */}
            <Card className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                {/* رأس القسم */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">💼 المصروفات الأخرى</h2>
                </div>

                {/* المصروفات الاختيارية */}
                <div className="mb-8 border-b pb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">المصروفات الاختيارية</h3>



                    {/* النقل والمواصلات */}
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center mb-3">
                            <Checkbox
                                id="transportation"
                                checked={optionalExpenses.transportation.enabled}
                                onCheckedChange={() => toggleOptionalExpense('transportation')}
                                disabled={isReadOnly || !isEditing}
                            />
                            <Label htmlFor="transportation" className="mr-2 font-medium text-gray-700">
                                النقل والمواصلات
                            </Label>
                        </div>

                        {optionalExpenses.transportation.enabled && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                                        السعر الشهري
                                    </Label>
                                    <Input
                                        type="number"
                                        value={optionalExpenses.transportation.monthlyPrice}
                                        onChange={(e) => updateOptionalExpense('transportation', 'monthlyPrice', parseFloat(e.target.value) || 0)}
                                        disabled={isReadOnly || !isEditing}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                                        عدد الشهور
                                    </Label>
                                    <Input
                                        type="number"
                                        value={optionalExpenses.transportation.months}
                                        onChange={(e) => updateOptionalExpense('transportation', 'months', parseInt(e.target.value) || 0)}
                                        disabled={isReadOnly || !isEditing}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                                        الإجمالي
                                    </Label>
                                    <p className="text-sm font-medium text-gray-700 mt-2">
                                        {(optionalExpenses.transportation.total || 0).toFixed(2)} جنيه
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* الزي المدرسي */}
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center mb-3">
                            <Checkbox
                                id="uniform"
                                checked={optionalExpenses.uniform.enabled}
                                onCheckedChange={() => toggleOptionalExpense('uniform')}
                                disabled={isReadOnly || !isEditing}
                            />
                            <Label htmlFor="uniform" className="mr-2 font-medium text-gray-700">
                                الزي المدرسي
                            </Label>
                        </div>

                        {optionalExpenses.uniform.enabled && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                                        جاكيت (سعر القطعة: {optionalExpenses.uniform.jacket.price} جنيه)
                                    </Label>
                                    <Input
                                        type="number"
                                        value={optionalExpenses.uniform.jacket.quantity}
                                        onChange={(e) => updateOptionalExpense('uniform', 'jacket.quantity', parseInt(e.target.value) || 0)}
                                        placeholder="العدد"
                                        disabled={isReadOnly || !isEditing}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                    <p className="text-sm text-gray-600 mt-1">
                                        المجموع: {((optionalExpenses.uniform.jacket.quantity || 0) * (optionalExpenses.uniform.jacket.price || 0)).toFixed(2)} جنيه
                                    </p>
                                </div>
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                                        بنطلون (سعر القطعة: {optionalExpenses.uniform.pants.price} جنيه)
                                    </Label>
                                    <Input
                                        type="number"
                                        value={optionalExpenses.uniform.pants.quantity}
                                        onChange={(e) => updateOptionalExpense('uniform', 'pants.quantity', parseInt(e.target.value) || 0)}
                                        placeholder="العدد"
                                        disabled={isReadOnly || !isEditing}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                    <p className="text-sm text-gray-600 mt-1">
                                        المجموع: {((optionalExpenses.uniform.pants.quantity || 0) * (optionalExpenses.uniform.pants.price || 0)).toFixed(2)} جنيه
                                    </p>
                                </div>
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                                        تيشيرت (سعر القطعة: {optionalExpenses.uniform.tshirt.price} جنيه)
                                    </Label>
                                    <Input
                                        type="number"
                                        value={optionalExpenses.uniform.tshirt.quantity}
                                        onChange={(e) => updateOptionalExpense('uniform', 'tshirt.quantity', parseInt(e.target.value) || 0)}
                                        placeholder="العدد"
                                        disabled={isReadOnly || !isEditing}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                    <p className="text-sm text-gray-600 mt-1">
                                        المجموع: {((optionalExpenses.uniform.tshirt.quantity || 0) * (optionalExpenses.uniform.tshirt.price || 0)).toFixed(2)} جنيه
                                    </p>
                                </div>
                                <div className="md:col-span-3">
                                    <p className="text-sm font-medium text-gray-700">
                                        إجمالي الزي: {(optionalExpenses.uniform.total || 0).toFixed(2)} جنيه
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* المنصات الرقمية */}
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center mb-3">
                            <Checkbox
                                id="digitalPlatforms"
                                checked={optionalExpenses.digitalPlatforms.enabled}
                                onCheckedChange={() => toggleOptionalExpense('digitalPlatforms')}
                                disabled={isReadOnly || !isEditing}
                            />
                            <Label htmlFor="digitalPlatforms" className="mr-2 font-medium text-gray-700">
                                المنصات الرقمية
                            </Label>
                        </div>

                        {optionalExpenses.digitalPlatforms.enabled && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                                        السعر الشهري أو السنوي
                                    </Label>
                                    <Input
                                        type="number"
                                        value={optionalExpenses.digitalPlatforms.price}
                                        onChange={(e) => updateOptionalExpense('digitalPlatforms', 'price', parseFloat(e.target.value) || 0)}
                                        disabled={isReadOnly || !isEditing}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mt-6">
                                        الإجمالي: {(optionalExpenses.digitalPlatforms.total || 0).toFixed(2)} جنيه
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* الرحلات والمعسكرات */}
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center mb-3">
                            <Checkbox
                                id="trips"
                                checked={optionalExpenses.trips.enabled}
                                onCheckedChange={() => toggleOptionalExpense('trips')}
                                disabled={isReadOnly || !isEditing}
                            />
                            <Label htmlFor="trips" className="mr-2 font-medium text-gray-700">
                                الرحلات والمعسكرات
                            </Label>
                        </div>

                        {optionalExpenses.trips.enabled && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                                        نوع النشاط
                                    </Label>
                                    <select
                                        value={optionalExpenses.trips.activityType}
                                        onChange={(e) => updateOptionalExpense('trips', 'activityType', e.target.value)}
                                        disabled={isReadOnly || !isEditing}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="">اختر النوع</option>
                                        <option value="local-trip">رحلة محلية</option>
                                        <option value="external-trip">رحلة خارجية</option>
                                        <option value="summer-camp">معسكر صيفي</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                                        سعر النشاط الواحد
                                    </Label>
                                    <Input
                                        type="number"
                                        value={optionalExpenses.trips.price}
                                        onChange={(e) => updateOptionalExpense('trips', 'price', parseFloat(e.target.value) || 0)}
                                        disabled={isReadOnly || !isEditing}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                                        العدد
                                    </Label>
                                    <Input
                                        type="number"
                                        value={optionalExpenses.trips.quantity}
                                        onChange={(e) => updateOptionalExpense('trips', 'quantity', parseInt(e.target.value) || 0)}
                                        disabled={isReadOnly || !isEditing}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <p className="text-sm font-medium text-gray-700">
                                        الإجمالي: {(optionalExpenses.trips.total || 0).toFixed(2)} جنيه
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* حفلات التخرج أو المناسبات */}
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center mb-3">
                            <Checkbox
                                id="events"
                                checked={optionalExpenses.events.enabled}
                                onCheckedChange={() => toggleOptionalExpense('events')}
                                disabled={isReadOnly || !isEditing}
                            />
                            <Label htmlFor="events" className="mr-2 font-medium text-gray-700">
                                حفلات التخرج أو المناسبات
                            </Label>
                        </div>

                        {optionalExpenses.events.enabled && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                                        نوع الحدث
                                    </Label>
                                    <select
                                        value={optionalExpenses.events.eventType}
                                        onChange={(e) => updateOptionalExpense('events', 'eventType', e.target.value)}
                                        disabled={isReadOnly || !isEditing}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="">اختر النوع</option>
                                        <option value="graduation">حفل تخرج</option>
                                        <option value="end-year">احتفال نهاية العام</option>
                                        <option value="theatrical">عرض مسرحي</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                                        سعر التذكرة
                                    </Label>
                                    <Input
                                        type="number"
                                        value={optionalExpenses.events.ticketPrice}
                                        onChange={(e) => updateOptionalExpense('events', 'ticketPrice', parseFloat(e.target.value) || 0)}
                                        disabled={isReadOnly || !isEditing}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                                        عدد التذاكر
                                    </Label>
                                    <Input
                                        type="number"
                                        value={optionalExpenses.events.tickets}
                                        onChange={(e) => updateOptionalExpense('events', 'tickets', parseInt(e.target.value) || 0)}
                                        disabled={isReadOnly || !isEditing}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <p className="text-sm font-medium text-gray-700">
                                        الإجمالي: {(optionalExpenses.events.total || 0).toFixed(2)} جنيه
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* الكتب */}
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center mb-3">
                            <Checkbox
                                id="books"
                                checked={optionalExpenses.books.enabled}
                                onCheckedChange={() => toggleOptionalExpense('books')}
                                disabled={isReadOnly || !isEditing}
                            />
                            <Label htmlFor="books" className="mr-2 font-medium text-gray-700">
                                الكتب
                            </Label>
                        </div>

                        {optionalExpenses.books.enabled && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                                        سعر مصاريف الكتب
                                    </Label>
                                    <Input
                                        type="number"
                                        value={optionalExpenses.books.price}
                                        onChange={(e) => updateOptionalExpense('books', 'price', parseFloat(e.target.value) || 0)}
                                        disabled={isReadOnly || !isEditing}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                                        العدد
                                    </Label>
                                    <Input
                                        type="number"
                                        value={optionalExpenses.books.quantity}
                                        onChange={(e) => updateOptionalExpense('books', 'quantity', parseInt(e.target.value) || 0)}
                                        disabled={isReadOnly || !isEditing}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700">
                                        الإجمالي: {(optionalExpenses.books.total || 0).toFixed(2)} جنيه
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* قائمة المصروفات */}
                <div className="space-y-4 mb-6">
                    {otherExpenses.map((expense, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative">
                            {/* زر الحذف */}
                            {isEditing && !isReadOnly && otherExpenses.length > 1 && (
                                <button
                                    onClick={() => removeExpense(index)}
                                    className="absolute top-2 left-2 text-red-500 hover:text-red-700 cursor-pointer transition-colors"
                                    title="حذف"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* نوع المصروف */}
                                <div>
                                    <Label htmlFor={`expenseType-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                                        نوع المصروف
                                    </Label>
                                    <Select value={expense.expenseType} onValueChange={(value) => handleExpenseChange(index, 'expenseType', value)} disabled={isReadOnly || !isEditing}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="اختر النوع" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {EXPENSE_TYPES.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* العدد */}
                                <div>
                                    <Label htmlFor={`quantity-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                                        العدد
                                    </Label>
                                    <Input
                                        id={`quantity-${index}`}
                                        type="number"
                                        value={expense.quantity || 1}
                                        onChange={(e) => handleExpenseChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                        placeholder="أدخل العدد"
                                        disabled={isReadOnly || !isEditing}
                                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {/* المبلغ */}
                                <div>
                                    <Label htmlFor={`totalPrice-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                                        المبلغ الإجمالي
                                    </Label>
                                    <Input
                                        id={`totalPrice-${index}`}
                                        type="number"
                                        value={expense.totalPrice}
                                        onChange={(e) => handleExpenseChange(index, 'totalPrice', parseFloat(e.target.value) || 0)}
                                        placeholder="أدخل المبلغ"
                                        disabled={isReadOnly || !isEditing}
                                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {/* التاريخ */}
                                <div>
                                    <Label htmlFor={`date-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                                        التاريخ
                                    </Label>
                                    <Input
                                        id={`date-${index}`}
                                        type="date"
                                        value={expense.date}
                                        onChange={(e) => handleExpenseChange(index, 'date', e.target.value)}
                                        disabled={isReadOnly || !isEditing}
                                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* زر إضافة مصروف */}
                {isEditing && !isReadOnly && (
                    <div className="mb-6">
                        <Button
                            onClick={addExpense}
                            variant="outline"
                            className="w-full md:w-auto"
                        >
                            <Plus size={18} className="ml-2" />
                            إضافة مصروف
                        </Button>
                    </div>
                )}

                {/* ملخص المصروفات */}
                <div className="border-t pt-4 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-600">إجمالي المصروفات الأخرى</p>
                            <p className="text-2xl font-bold text-blue-600">{(totalExpenses + totalOptionalExpenses).toFixed(2)}</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-gray-600">إجمالي المصروفات الدراسية</p>
                            <p className="text-2xl font-bold text-green-600">{(formData.totalAmount || 0).toFixed(2)}</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                            <p className="text-sm text-gray-600">الإجمالي الكلي</p>
                            <p className="text-2xl font-bold text-purple-600">{((formData.totalAmount || 0) + totalExpenses + totalOptionalExpenses).toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* أزرار الحفظ */}
            {isEditing && !isReadOnly && (
                <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                        إلغاء
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                        {isSaving ? 'جاري الحفظ...' : (feesData?.id ? 'تحديث البيانات' : 'إنشاء السجل المالي')}
                    </Button>
                </div>
            )}
        </div>
    );
}