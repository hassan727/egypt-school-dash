/**
 * صفحة المصروفات
 * Expenses Page
 * 
 * تعرض جميع مصروفات المدرسة بما في ذلك الرواتب
 * مع إمكانية إضافة مصروفات جديدة
 */

import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  TrendingDown,
  Plus,
  Search,
  Filter,
  DollarSign,
  Wallet,
  Calendar,
  Loader2,
  ArrowDownRight,
  Users,
} from 'lucide-react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { FinanceNavigation } from '@/components/finance/FinanceNavigation';

const Expenses = () => {
  const {
    loading,
    transactions,
    expenseCategories,
    salaries,
    summary,
    addTransaction,
  } = useFinanceData();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // نموذج المصروف الجديد
  const [newExpense, setNewExpense] = useState({
    transactionDate: new Date().toISOString().split('T')[0],
    categoryId: '',
    amount: '',
    description: '',
    paymentMethod: 'نقدي',
    receiptNumber: '',
    notes: '',
  });

  // إضافة مصروف جديد
  const handleAddExpense = async () => {
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction({
        transactionDate: newExpense.transactionDate,
        transactionType: 'مصروف',
        categoryId: newExpense.categoryId || undefined,
        amount: parseFloat(newExpense.amount),
        description: newExpense.description,
        paymentMethod: newExpense.paymentMethod,
        receiptNumber: newExpense.receiptNumber,
        notes: newExpense.notes,
      });

      toast.success('تم إضافة المصروف بنجاح');
      setIsAddDialogOpen(false);
      setNewExpense({
        transactionDate: new Date().toISOString().split('T')[0],
        categoryId: '',
        amount: '',
        description: '',
        paymentMethod: 'نقدي',
        receiptNumber: '',
        notes: '',
      });
    } catch (err) {
      toast.error('حدث خطأ أثناء إضافة المصروف');
    } finally {
      setIsSubmitting(false);
    }
  };

  // حساب الإجماليات
  const paidSalaries = salaries
    .filter(s => s.status === 'تم الصرف')
    .reduce((sum, s) => sum + s.netSalary, 0);

  const generalExpenses = transactions
    .filter(t => t.transactionType === 'مصروف')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = generalExpenses; // الرواتب تُضاف تلقائياً عند الصرف

  // فلترة المصروفات
  const filteredTransactions = transactions.filter(t => {
    if (t.transactionType !== 'مصروف') return false;
    if (searchTerm && !t.description?.includes(searchTerm)) return false;
    if (filterCategory !== 'all' && t.categoryId !== filterCategory) return false;
    return true;
  });

  // فصل الرواتب عن المصروفات الأخرى
  const salaryTransactions = filteredTransactions.filter(t => t.referenceType === 'salary');
  const otherTransactions = filteredTransactions.filter(t => t.referenceType !== 'salary');

  if (loading) {
    return (
      <DashboardLayout>
        <FinanceNavigation
          summary={summary || undefined}
          isRefreshing={true}
        />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-red-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Finance Navigation */}
      <FinanceNavigation
        summary={summary || undefined}
        isRefreshing={loading}
      />

      <PageLayout title="مصروفات المدرسة" description="متابعة وإدارة جميع مصروفات المدرسة">
        <div className="space-y-6">
          {/* ملخص المصروفات */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-700">إجمالي المصروفات</p>
                    <p className="text-2xl font-bold text-red-800">
                      {(summary?.totalExpenses || 0).toLocaleString('ar-EG')} ج.م
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-red-200">
                    <TrendingDown className="h-6 w-6 text-red-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-700">الرواتب المدفوعة</p>
                    <p className="text-2xl font-bold text-orange-800">
                      {paidSalaries.toLocaleString('ar-EG')} ج.م
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      {salaries.filter(s => s.status === 'تم الصرف').length} راتب
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-orange-200">
                    <Wallet className="h-6 w-6 text-orange-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700">مصروفات تشغيلية</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {(generalExpenses - salaryTransactions.reduce((s, t) => s + t.amount, 0)).toLocaleString('ar-EG')} ج.م
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      {otherTransactions.length} حركة
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-200">
                    <DollarSign className="h-6 w-6 text-purple-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* أدوات البحث والإضافة */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="بحث في المصروفات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="كل التصنيفات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل التصنيفات</SelectItem>
                  {expenseCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.categoryNameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700">
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة مصروف
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>إضافة مصروف جديد</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>التاريخ</Label>
                      <Input
                        type="date"
                        value={newExpense.transactionDate}
                        onChange={(e) => setNewExpense({ ...newExpense, transactionDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>المبلغ (ج.م)</Label>
                      <Input
                        type="number"
                        placeholder="1000"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>التصنيف</Label>
                    <Select
                      value={newExpense.categoryId}
                      onValueChange={(v) => setNewExpense({ ...newExpense, categoryId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر التصنيف" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.categoryNameAr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>الوصف</Label>
                    <Input
                      placeholder="وصف المصروف"
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>طريقة الدفع</Label>
                      <Select
                        value={newExpense.paymentMethod}
                        onValueChange={(v) => setNewExpense({ ...newExpense, paymentMethod: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="نقدي">نقدي</SelectItem>
                          <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                          <SelectItem value="شيك">شيك</SelectItem>
                          <SelectItem value="بطاقة">بطاقة ائتمان</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>رقم الفاتورة</Label>
                      <Input
                        placeholder="اختياري"
                        value={newExpense.receiptNumber}
                        onChange={(e) => setNewExpense({ ...newExpense, receiptNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>ملاحظات</Label>
                    <Textarea
                      placeholder="ملاحظات إضافية"
                      value={newExpense.notes}
                      onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                    />
                  </div>

                  <Button
                    className="w-full bg-red-600 hover:bg-red-700"
                    onClick={handleAddExpense}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      <Plus className="h-4 w-4 ml-2" />
                    )}
                    إضافة المصروف
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* الرواتب المدفوعة */}
          {salaryTransactions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-orange-600" />
                      الرواتب المدفوعة (تلقائي)
                    </CardTitle>
                    <CardDescription>
                      الرواتب التي تم صرفها - تُضاف تلقائياً للمصروفات
                    </CardDescription>
                  </div>
                  <Link to="/finance/salaries">
                    <Button variant="outline" size="sm">
                      إدارة الرواتب
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {salaryTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-orange-100">
                          <ArrowDownRight className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium">{tx.description || 'راتب موظف'}</p>
                          <p className="text-xs text-gray-500">{tx.transactionDate}</p>
                        </div>
                      </div>
                      <span className="font-bold text-orange-700">
                        -{tx.amount.toLocaleString('ar-EG')} ج.م
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* المصروفات الأخرى */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-red-600" />
                المصروفات التشغيلية
              </CardTitle>
              <CardDescription>
                المصروفات غير المرتبطة بالرواتب
              </CardDescription>
            </CardHeader>
            <CardContent>
              {otherTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>لا توجد مصروفات تشغيلية مسجلة</p>
                  <p className="text-sm">اضغط على "إضافة مصروف" لإضافة مصروف جديد</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {otherTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-red-100">
                          <ArrowDownRight className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium">{tx.description || 'مصروف عام'}</p>
                          <p className="text-xs text-gray-500">
                            {tx.transactionDate} • {tx.paymentMethod || 'غير محدد'}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-red-700">
                        -{tx.amount.toLocaleString('ar-EG')} ج.م
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    </DashboardLayout>
  );
};

export default Expenses;
