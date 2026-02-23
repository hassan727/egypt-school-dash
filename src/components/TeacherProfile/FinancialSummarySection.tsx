import { Card } from '@/components/ui/card';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Wallet,
    CreditCard,
    BadgeCheck,
    Clock,
    AlertCircle
} from 'lucide-react';
import { TeacherSalary, SalaryPayment, TeacherBonus } from '@/types/teacher';

interface FinancialSummarySectionProps {
    salary?: TeacherSalary;
    payments: SalaryPayment[];
    bonuses: TeacherBonus[];
}

export function FinancialSummarySection({
    salary,
    payments,
    bonuses
}: FinancialSummarySectionProps) {
    // حسابات ديناميكية
    const totalPaidThisYear = payments
        .filter(p => p.paymentStatus === 'مدفوع')
        .reduce((sum, p) => sum + p.netAmount, 0);

    const pendingPayments = payments.filter(p => p.paymentStatus === 'معلق');
    const overduePayments = payments.filter(p => p.paymentStatus === 'متأخر');

    const totalBonuses = bonuses.reduce((sum, b) => sum + b.amount, 0);
    const pendingBonuses = bonuses
        .filter(b => b.paymentStatus === 'معلق')
        .reduce((sum, b) => sum + b.amount, 0);

    const lastPayment = payments.find(p => p.paymentStatus === 'مدفوع');

    return (
        <div className="space-y-6">
            {/* بطاقات الملخص المالي */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* الراتب الصافي */}
                <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-green-600 font-medium mb-1">الراتب الصافي</p>
                            <p className="text-3xl font-bold text-green-700">
                                {salary?.netSalary?.toLocaleString() || 0}
                            </p>
                            <p className="text-xs text-green-500 mt-1">جنيه/شهر</p>
                        </div>
                        <div className="p-3 rounded-full bg-green-200">
                            <DollarSign className="h-6 w-6 text-green-700" />
                        </div>
                    </div>
                </Card>

                {/* إجمالي البدلات */}
                <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-blue-600 font-medium mb-1">إجمالي البدلات</p>
                            <p className="text-3xl font-bold text-blue-700">
                                {salary?.totalAllowances?.toLocaleString() || 0}
                            </p>
                            <p className="text-xs text-blue-500 mt-1">جنيه/شهر</p>
                        </div>
                        <div className="p-3 rounded-full bg-blue-200">
                            <TrendingUp className="h-6 w-6 text-blue-700" />
                        </div>
                    </div>
                </Card>

                {/* إجمالي الاستقطاعات */}
                <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-red-600 font-medium mb-1">إجمالي الاستقطاعات</p>
                            <p className="text-3xl font-bold text-red-700">
                                {salary?.totalDeductions?.toLocaleString() || 0}
                            </p>
                            <p className="text-xs text-red-500 mt-1">جنيه/شهر</p>
                        </div>
                        <div className="p-3 rounded-full bg-red-200">
                            <TrendingDown className="h-6 w-6 text-red-700" />
                        </div>
                    </div>
                </Card>

                {/* المكافآت المعلقة */}
                <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-purple-600 font-medium mb-1">مكافآت معلقة</p>
                            <p className="text-3xl font-bold text-purple-700">
                                {pendingBonuses.toLocaleString()}
                            </p>
                            <p className="text-xs text-purple-500 mt-1">جنيه</p>
                        </div>
                        <div className="p-3 rounded-full bg-purple-200">
                            <BadgeCheck className="h-6 w-6 text-purple-700" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* تفاصيل الراتب */}
            <Card className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-gray-600" />
                    تفاصيل الراتب الشهري
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* البدلات */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            البدلات
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">الراتب الأساسي</span>
                                <span className="font-medium">{salary?.baseSalary?.toLocaleString() || 0} ج</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">بدل السكن</span>
                                <span className="font-medium">{salary?.housingAllowance?.toLocaleString() || 0} ج</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">بدل المواصلات</span>
                                <span className="font-medium">{salary?.transportationAllowance?.toLocaleString() || 0} ج</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">بدل الهاتف</span>
                                <span className="font-medium">{salary?.phoneAllowance?.toLocaleString() || 0} ج</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">بدل الأعباء التدريسية</span>
                                <span className="font-medium">{salary?.teachingLoadAllowance?.toLocaleString() || 0} ج</span>
                            </div>
                            <div className="flex justify-between border-t pt-2 mt-2">
                                <span className="font-semibold text-green-700">الإجمالي</span>
                                <span className="font-bold text-green-700">{salary?.grossSalary?.toLocaleString() || 0} ج</span>
                            </div>
                        </div>
                    </div>

                    {/* الاستقطاعات */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                            <TrendingDown className="h-4 w-4" />
                            الاستقطاعات
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">التأمين الاجتماعي</span>
                                <span className="font-medium">{salary?.socialInsurance?.toLocaleString() || 0} ج</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">التأمين الصحي</span>
                                <span className="font-medium">{salary?.healthInsurance?.toLocaleString() || 0} ج</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">ضريبة الدخل</span>
                                <span className="font-medium">{salary?.incomeTax?.toLocaleString() || 0} ج</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">أقساط قروض</span>
                                <span className="font-medium">{salary?.loanDeduction?.toLocaleString() || 0} ج</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">استقطاعات أخرى</span>
                                <span className="font-medium">{salary?.otherDeductions?.toLocaleString() || 0} ج</span>
                            </div>
                            <div className="flex justify-between border-t pt-2 mt-2">
                                <span className="font-semibold text-red-700">الإجمالي</span>
                                <span className="font-bold text-red-700">{salary?.totalDeductions?.toLocaleString() || 0} ج</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* سجل المدفوعات */}
            <Card className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                    سجل مدفوعات الرواتب
                </h3>

                {/* تنبيهات */}
                {overduePayments.length > 0 && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <span className="text-red-700 font-medium">
                            يوجد {overduePayments.length} دفعة متأخرة
                        </span>
                    </div>
                )}

                {payments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-right p-3">الشهر</th>
                                    <th className="text-right p-3">السنة</th>
                                    <th className="text-right p-3">المبلغ الأساسي</th>
                                    <th className="text-right p-3">البدلات</th>
                                    <th className="text-right p-3">الاستقطاعات</th>
                                    <th className="text-right p-3">الصافي</th>
                                    <th className="text-right p-3">الحالة</th>
                                    <th className="text-right p-3">تاريخ الدفع</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {payments.slice(0, 12).map((payment, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="p-3">{getMonthName(payment.paymentMonth)}</td>
                                        <td className="p-3">{payment.paymentYear}</td>
                                        <td className="p-3">{payment.baseAmount.toLocaleString()} ج</td>
                                        <td className="p-3 text-green-600">+{payment.allowancesAmount.toLocaleString()}</td>
                                        <td className="p-3 text-red-600">-{payment.deductionsAmount.toLocaleString()}</td>
                                        <td className="p-3 font-bold">{payment.netAmount.toLocaleString()} ج</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.paymentStatus === 'مدفوع' ? 'bg-green-100 text-green-700' :
                                                    payment.paymentStatus === 'متأخر' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {payment.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="p-3">{payment.paymentDate || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>لا توجد مدفوعات مسجلة</p>
                    </div>
                )}
            </Card>

            {/* المكافآت */}
            {bonuses.length > 0 && (
                <Card className="p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <BadgeCheck className="h-5 w-5 text-purple-600" />
                        المكافآت والحوافز
                    </h3>
                    <div className="space-y-3">
                        {bonuses.map((bonus, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                <div>
                                    <p className="font-medium">{bonus.bonusType}</p>
                                    <p className="text-sm text-gray-500">{bonus.reason}</p>
                                    <p className="text-xs text-gray-400">{bonus.bonusDate}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-purple-700">{bonus.amount.toLocaleString()} ج</p>
                                    <span className={`text-xs px-2 py-1 rounded-full ${bonus.paymentStatus === 'مدفوع' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {bonus.paymentStatus}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}

// دالة مساعدة للحصول على اسم الشهر
function getMonthName(month: number): string {
    const months = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[month - 1] || '-';
}
