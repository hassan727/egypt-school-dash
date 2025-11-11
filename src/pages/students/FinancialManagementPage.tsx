import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { SchoolFeesSection } from '@/components/StudentProfile/SchoolFeesSection';
import { FinancialTransactionsSection } from '@/components/StudentProfile/FinancialTransactionsSection';
import { useStudentData } from '@/hooks/useStudentData';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useDataCache } from '@/hooks/useDataCache';
import { useCrossTabSync } from '@/hooks/useCrossTabSync';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader, DollarSign, TrendingDown, CreditCard, Wallet, RotateCcw, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useState } from 'react';

/**
 * صفحة الإدارة المالية
 * تجمع 2 قسم:
 * 1. المصروفات الدراسية والنفقات الأخرى
 * 2. المعاملات المالية
 * 
 * هذه صفحة جماعية تدعم تعديلات متعددة وحفظ جميع التعديلات دفعة واحدة
 */
export default function FinancialManagementPage() {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const { notify } = useCrossTabSync();
    const [formData, setFormData] = useState({ totalAmount: '', advancePayment: '' });

    const {
        studentProfile,
        loading,
        error,
        updateSchoolFees,
        addOtherExpense,
        updateFinancialTransactions,
        refreshStudentData,
        saveAuditTrail,
        undoLastChange,
    } = useStudentData(studentId || '');

    // Form validation
    const { validate, errors, touched, handleBlur } = useFormValidation({
        totalAmount: { rules: { required: true, min: 0 } },
        advancePayment: { rules: { required: true, min: 0 } },
    });

    // Cache financial data for performance
    const { data: cachedFinancialData, set: setCachedFinancialData } = useDataCache(
        `financial_${studentId}`,
        studentProfile?.schoolFees || null,
        300 // 5 minute cache
    );

    if (!studentId) {
        return (
            <DashboardLayout>
                <div className="text-center py-10">
                    <p className="text-red-500">لم يتم تحديد معرّف الطالب</p>
                </div>
            </DashboardLayout>
        );
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="text-center py-16">
                    <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-500">جاري تحميل البيانات...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="text-center py-10">
                    <p className="text-red-500">حدث خطأ: {error}</p>
                </div>
            </DashboardLayout>
        );
    }

    const handleUpdateSchoolFees = async (feesData: any, installments: any, auditLog: any) => {
        try {
            const data = { ...feesData, installments, auditLog };
            await saveAuditTrail('Financial Data', studentProfile?.schoolFees, data);
            if (data && data.id) {
                await updateSchoolFees(data);
                toast.success('تم تحديث بيانات المصروفات بنجاح');
            } else {
                await createSchoolFees(data);
                toast.success('تم إنشاء بيانات المصروفات بنجاح');
            }
            await refreshStudentData();
        } catch (error) {
            toast.error('حدث خطأ أثناء تحديث بيانات المصروفات');
            console.error(error);
        }
    };

    const handleAddOtherExpense = async (otherExpenses: any, optionalExpenses: any) => {
        try {
            const data = { otherExpenses, optionalExpenses };
            await saveAuditTrail('Other Expenses', { other: studentProfile?.otherExpenses, optional: studentProfile?.optionalExpenses }, data);
            await addOtherExpense(data);
            await refreshStudentData();
        } catch (err) {
            console.error('خطأ في إضافة مصروف:', err);
            toast.error('حدث خطأ أثناء إضافة المصروفات');
        }
    };

const handleUpdateFinancialTransactions = async (
    transactions: Array<Record<string, unknown>>
) => {
    try {
        await saveAuditTrail('Financial Data', studentProfile?.financialTransactions, transactions);
        await updateFinancialTransactions(transactions);
        await refreshStudentData();
    } catch (err) {
        console.error('خطأ في تحديث المعاملات المالية:', err);
    }
};

const handleUndoLastChange = async () => {
    try {
        await undoLastChange();
        await refreshStudentData();
    } catch (err) {
        console.error('خطأ في التراجع عن آخر تغيير:', err);
    }
};

// حساب الإحصائيات
const schoolFees = studentProfile?.schoolFees;
const totalAmount = schoolFees?.totalAmount || 0;
const advancePayment = schoolFees?.advancePayment || 0;
const remaining = totalAmount - advancePayment;
const financialTransactions = studentProfile?.financialTransactions || [];

// بيانات الرسم البياني العمودي
const chartData = [
    { name: 'المستحق', value: totalAmount, fill: '#3B82F6' },
    { name: 'المسدد', value: advancePayment, fill: '#10B981' },
    { name: 'المتبقي', value: remaining, fill: '#EF4444' },
];

// بيانات الرسم البياني الدائري
const pieData = [
    { name: 'المسدد', value: advancePayment },
    { name: 'المتبقي', value: remaining },
];
const COLORS = ['#10B981', '#EF4444'];

return (
    <DashboardLayout>
        <div className="space-y-8 max-w-6xl mx-auto py-6 px-4">
            {/* Header with navigation */}
            <div className="mb-8 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <DollarSign className="h-8 w-8" />
                            <h1 className="text-4xl font-bold">
                                الإدارة المالية
                            </h1>
                        </div>
                        <p className="text-purple-100">
                            معرّف الطالب: <span className="font-semibold">{studentId}</span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleUndoLastChange}
                            variant="outline"
                            className="flex items-center gap-2 bg-yellow-500 text-white hover:bg-yellow-600 border-none"
                        >
                            <RotateCcw className="h-4 w-4" />
                            التراجع
                        </Button>
                        <Button
                            onClick={() => navigate(`/student/${studentId}/dashboard`)}
                            variant="outline"
                            className="flex items-center gap-2 bg-white text-purple-600 hover:bg-purple-50 border-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            العودة
                        </Button>
                    </div>
                </div>
            </div>

            {/* Summary Stats with Icons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-gray-600 text-sm mb-2 flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-blue-600" />
                                إجمالي المستحق
                            </p>
                            <p className="text-3xl font-bold text-blue-600">
                                {totalAmount.toLocaleString()} ج
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-gray-600 text-sm mb-2 flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-green-600" />
                                المسدد
                            </p>
                            <p className="text-3xl font-bold text-green-600">
                                {advancePayment.toLocaleString()} ج
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                {totalAmount > 0 ? `${Math.round((advancePayment / totalAmount) * 100)}%` : '0%'}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border border-red-200 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-gray-600 text-sm mb-2 flex items-center gap-2">
                                <TrendingDown className="h-4 w-4 text-red-600" />
                                المتبقي
                            </p>
                            <p className={`text-3xl font-bold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {remaining.toLocaleString()} ج
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                {remaining > 0 ? '⚠️ متأخر' : '✅ مدفوع'}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <Card className="p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-purple-600" />
                        الملخص المالي
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => `${value.toLocaleString()} ج`} />
                            <Bar dataKey="value" fill="#8B5CF6" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                {/* Pie Chart */}
                <Card className="p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-purple-600" />
                        نسبة السداد
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name}: ${value.toLocaleString()} ج`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {COLORS.map((color, index) => (
                                    <Cell key={`cell-${index}`} fill={color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value.toLocaleString()} ج`} />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            {/* Info Card */}
            <Card className="p-6 bg-purple-50 border border-purple-200">
                <p className="text-gray-700 text-sm">
                    ℹ️ يمكنك تعديل المصروفات والمعاملات المالية أدناه. قم بإدخال أو تعديل
                    البيانات والنقر على "حفظ جميع التعديلات" عند الانتهاء.
                </p>
            </Card>

            {/* القسم الأول: المصروفات والنفقات */}
            <SchoolFeesSection
                feesData={studentProfile?.schoolFees}
                expensesData={studentProfile?.otherExpenses}
                onSaveFees={handleUpdateSchoolFees}
                onSaveExpenses={handleAddOtherExpense}
                isReadOnly={false}
            />

            {/* القسم الثاني: المعاملات المالية */}
            <FinancialTransactionsSection
                data={financialTransactions}
                onSave={handleUpdateFinancialTransactions}
                isReadOnly={false}
            />

            {/* Footer Navigation */}
            <div className="flex justify-between pt-6 border-t">
                <Button
                    onClick={() => navigate(`/student/${studentId}/dashboard`)}
                    variant="outline"
                >
                    العودة
                </Button>
                <div className="text-sm text-gray-500">
                    آخر تحديث: الآن
                </div>
            </div>
        </div>
    </DashboardLayout>
  );
}