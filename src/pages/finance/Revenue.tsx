/**
 * صفحة الإيرادات
 * Revenue Page
 * 
 * تعرض جميع إيرادات المدرسة بما في ذلك مدفوعات الطلاب
 * مع إمكانية إضافة إيرادات جديدة وتسجيل مدفوعات الطلاب
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TrendingUp,
  Plus,
  Search,
  Filter,
  DollarSign,
  Users,
  Calendar,
  FileText,
  Loader2,
  ArrowUpRight,
  RefreshCw,
  Building2,
  UserSearch,
  ArrowLeft,
} from 'lucide-react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useGlobalFilter } from '@/context/GlobalFilterContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { FinanceNavigation } from '@/components/finance/FinanceNavigation';

interface StudentPayment {
  id: string;
  studentId: string;
  studentName?: string;
  amount: number;
  transactionDate: string;
  paymentMethod?: string;
  description?: string;
}

const Revenue = () => {
  const navigate = useNavigate();

  // استخدام السنة الدراسية من Context العام
  const { selectedYear, setSelectedYear, academicYears, loading: yearsLoading } = useGlobalFilter();

  const {
    loading,
    transactions,
    revenueCategories,
    summary,
    addTransaction,
    refreshData,
  } = useFinanceData(selectedYear);

  const [studentPayments, setStudentPayments] = useState<StudentPayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // حالات البحث عن الطالب
  const [isStudentSearchOpen, setIsStudentSearchOpen] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; studentId: string; fullName: string; stage: string; class: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  // التصنيفات المخصصة للإيرادات العامة (غير المرتبطة بالطلاب)
  // استثناء تصنيفات الطلاب والحصول على الإيرادات العامة فقط من قاعدة البيانات
  const STUDENT_RELATED_CATEGORIES = ['TUITION', 'BUS', 'ACTIVITIES', 'BOOKS', 'UNIFORM'];
  const generalRevenueCategories = revenueCategories.filter(
    cat => !STUDENT_RELATED_CATEGORIES.includes(cat.categoryCode || '')
  );

  // نموذج الإيراد الجديد
  const [newRevenue, setNewRevenue] = useState({
    transactionDate: new Date().toISOString().split('T')[0],
    categoryId: '',
    amount: '',
    description: '',
    paymentMethod: 'نقدي',
    receiptNumber: '',
    notes: '',
  });

  // جلب مدفوعات الطلاب
  useEffect(() => {
    const fetchStudentPayments = async () => {
      if (!selectedYear) return; // انتظر حتى يتم تحميل السنة الدراسية

      try {
        setLoadingPayments(true);

        const { data: payments, error } = await supabase
          .from('financial_transactions')
          .select(`
                        id,
                        student_id,
                        amount,
                        transaction_date,
                        payment_method,
                        description,
                        students!inner (
                            full_name_ar
                        )
                    `)
          .eq('transaction_type', 'دفعة')
          .eq('academic_year_code', selectedYear)
          .order('transaction_date', { ascending: false });

        if (error) throw error;

        setStudentPayments(payments?.map(p => ({
          id: p.id,
          studentId: p.student_id,
          studentName: (p.students as any)?.full_name_ar,
          amount: p.amount,
          transactionDate: p.transaction_date,
          paymentMethod: p.payment_method,
          description: p.description,
        })) || []);
      } catch (err) {
        console.error('خطأ في جلب مدفوعات الطلاب:', err);
      } finally {
        setLoadingPayments(false);
      }
    };

    fetchStudentPayments();
  }, [selectedYear]);

  // إضافة إيراد جديد
  const handleAddRevenue = async () => {
    if (!newRevenue.amount || parseFloat(newRevenue.amount) <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction({
        transactionDate: newRevenue.transactionDate,
        transactionType: 'إيراد',
        categoryId: newRevenue.categoryId || undefined,
        amount: parseFloat(newRevenue.amount),
        description: newRevenue.description,
        paymentMethod: newRevenue.paymentMethod,
        receiptNumber: newRevenue.receiptNumber,
        notes: newRevenue.notes,
      });

      toast.success('تم إضافة الإيراد بنجاح');
      setIsAddDialogOpen(false);
      setNewRevenue({
        transactionDate: new Date().toISOString().split('T')[0],
        categoryId: '',
        amount: '',
        description: '',
        paymentMethod: 'نقدي',
        receiptNumber: '',
        notes: '',
      });
    } catch (err) {
      toast.error('حدث خطأ أثناء إضافة الإيراد');
    } finally {
      setIsSubmitting(false);
    }
  };

  // البحث عن الطالب
  const handleStudentSearch = async (term: string) => {
    setStudentSearchTerm(term);
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, student_id, full_name_ar, stage, class')
        .or(`full_name_ar.ilike.%${term}%,student_id.ilike.%${term}%`)
        .limit(10);

      if (error) throw error;

      setSearchResults(data?.map(s => ({
        id: s.id,
        studentId: s.student_id,
        fullName: s.full_name_ar,
        stage: s.stage || '',
        class: s.class || '',
      })) || []);
    } catch (err) {
      console.error('خطأ في البحث عن الطالب:', err);
      toast.error('حدث خطأ أثناء البحث');
    } finally {
      setIsSearching(false);
    }
  };

  // الانتقال لصفحة الإدارة المالية للطالب
  const handleSelectStudent = (studentId: string) => {
    setIsStudentSearchOpen(false);
    setStudentSearchTerm('');
    setSearchResults([]);
    navigate(`/student/${studentId}/financial-management`);
  };

  // حساب الإجماليات
  // نستخدم القيم من summary لضمان تطابق البيانات مع لوحة التحكم الرئيسية ومع قاعدة البيانات
  // حيث أن summary يتضمن المقدمات (Advance Payments) التي لا تظهر في جدول المعاملات
  const totalStudentPayments = summary?.studentPayments || studentPayments.reduce((sum, p) => sum + p.amount, 0);

  const totalGeneralRevenue = transactions
    .filter(t => t.transactionType === 'إيراد')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRevenue = summary?.totalRevenue || (totalStudentPayments + totalGeneralRevenue);

  // فلترة الإيرادات العامة
  const filteredTransactions = transactions.filter(t => {
    if (t.transactionType !== 'إيراد') return false;
    if (searchTerm && !t.description?.includes(searchTerm)) return false;
    if (filterCategory !== 'all' && t.categoryId !== filterCategory) return false;
    return true;
  });

  if (loading || yearsLoading) {
    return (
      <DashboardLayout>
        <FinanceNavigation
          summary={summary || undefined}
          isRefreshing={true}
        />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Finance Navigation */}
      <FinanceNavigation
        summary={summary || undefined}
        onRefresh={refreshData}
        isRefreshing={loading}
      />

      <PageLayout title="إيرادات المدرسة" description="متابعة وإدارة جميع إيرادات المدرسة">
        <div className="space-y-6">
          {/* شريط السنة الدراسية */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="اختر السنة الدراسية" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year: any) => (
                    <SelectItem key={year.year_code} value={year.year_code}>
                      {year.year_name_ar || year.year_code}
                      {year.is_active && ' (الحالية)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ملخص الإيرادات */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-700">إجمالي الإيرادات</p>
                    <p className="text-2xl font-bold text-emerald-800">
                      {totalRevenue.toLocaleString('ar-EG')} ج.م
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-emerald-200">
                    <TrendingUp className="h-6 w-6 text-emerald-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700">مدفوعات الطلاب</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {totalStudentPayments.toLocaleString('ar-EG')} ج.م
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {studentPayments.length} دفعة
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-200">
                    <Users className="h-6 w-6 text-blue-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-violet-700">إيرادات أخرى</p>
                    <p className="text-2xl font-bold text-violet-800">
                      {totalGeneralRevenue.toLocaleString('ar-EG')} ج.م
                    </p>
                    <p className="text-xs text-violet-600 mt-1">
                      {filteredTransactions.length} حركة
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-violet-200">
                    <DollarSign className="h-6 w-6 text-violet-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* أزرار الإجراءات الرئيسية */}
          <div className="flex flex-wrap gap-3">
            {/* زر إضافة إيراد عام */}
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Building2 className="h-4 w-4 ml-2" />
              إضافة إيراد عام (غير مرتبط بالطلاب)
            </Button>

            {/* زر تسجيل مدفوعات الطلاب */}
            <Button
              onClick={() => setIsStudentSearchOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <UserSearch className="h-4 w-4 ml-2" />
              تسجيل مدفوعات الطلاب
            </Button>
          </div>

          {/* نافذة البحث عن الطالب */}
          <Dialog open={isStudentSearchOpen} onOpenChange={setIsStudentSearchOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <UserSearch className="h-5 w-5 text-blue-600" />
                  البحث عن طالب لتسجيل دفعة
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="اكتب اسم الطالب أو رقم الملف..."
                    value={studentSearchTerm}
                    onChange={(e) => handleStudentSearch(e.target.value)}
                    className="pr-10 text-lg"
                    autoFocus
                  />
                </div>

                {isSearching && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                )}

                {!isSearching && searchResults.length > 0 && (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {searchResults.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => handleSelectStudent(student.studentId)}
                        className="flex items-center justify-between p-3 rounded-lg bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-blue-100">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{student.fullName}</p>
                            <p className="text-xs text-gray-500">
                              {student.studentId} • {student.stage} - {student.class}
                            </p>
                          </div>
                        </div>
                        <ArrowLeft className="h-4 w-4 text-blue-500" />
                      </div>
                    ))}
                  </div>
                )}

                {!isSearching && studentSearchTerm.length >= 2 && searchResults.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <UserSearch className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>لم يتم العثور على طلاب بهذا الاسم</p>
                  </div>
                )}

                {studentSearchTerm.length < 2 && (
                  <div className="text-center py-8 text-gray-400">
                    <Search className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>اكتب حرفين على الأقل للبحث</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* أدوات البحث والفلترة */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="بحث في الإيرادات..."
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
                  {revenueCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.categoryNameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* نافذة إضافة إيراد عام */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  إضافة إيراد عام (غير مرتبط بالطلاب)
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>التاريخ</Label>
                    <Input
                      type="date"
                      value={newRevenue.transactionDate}
                      onChange={(e) => setNewRevenue({ ...newRevenue, transactionDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>المبلغ (ج.م)</Label>
                    <Input
                      type="number"
                      placeholder="1000"
                      value={newRevenue.amount}
                      onChange={(e) => setNewRevenue({ ...newRevenue, amount: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>التصنيف</Label>
                  <Select
                    value={newRevenue.categoryId}
                    onValueChange={(v) => setNewRevenue({ ...newRevenue, categoryId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      {generalRevenueCategories.map(cat => (
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
                    placeholder="وصف الإيراد"
                    value={newRevenue.description}
                    onChange={(e) => setNewRevenue({ ...newRevenue, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>طريقة الدفع</Label>
                    <Select
                      value={newRevenue.paymentMethod}
                      onValueChange={(v) => setNewRevenue({ ...newRevenue, paymentMethod: v })}
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
                    <Label>رقم الإيصال</Label>
                    <Input
                      placeholder="اختياري"
                      value={newRevenue.receiptNumber}
                      onChange={(e) => setNewRevenue({ ...newRevenue, receiptNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>ملاحظات</Label>
                  <Textarea
                    placeholder="ملاحظات إضافية"
                    value={newRevenue.notes}
                    onChange={(e) => setNewRevenue({ ...newRevenue, notes: e.target.value })}
                  />
                </div>

                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleAddRevenue}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  ) : (
                    <Plus className="h-4 w-4 ml-2" />
                  )}
                  إضافة الإيراد
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* قسم مدفوعات الطلاب */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                مدفوعات الطلاب (تلقائي)
              </CardTitle>
              <CardDescription>
                المدفوعات المسجلة من الملفات المالية للطلاب - تُضاف تلقائياً للإيرادات
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPayments ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : studentPayments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>لا توجد مدفوعات من الطلاب</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {studentPayments.slice(0, 10).map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-blue-100">
                          <ArrowUpRight className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{payment.studentName || payment.studentId}</p>
                          <p className="text-xs text-gray-500">
                            {payment.transactionDate} • {payment.paymentMethod || 'غير محدد'}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-blue-700">
                        +{payment.amount.toLocaleString('ar-EG')} ج.م
                      </span>
                    </div>
                  ))}
                  {studentPayments.length > 10 && (
                    <p className="text-center text-sm text-gray-500 pt-2">
                      و {studentPayments.length - 10} مدفوعات أخرى...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* الإيرادات العامة */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                الإيرادات العامة
              </CardTitle>
              <CardDescription>
                الإيرادات الأخرى غير المرتبطة بالطلاب
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>لا توجد إيرادات عامة مسجلة</p>
                  <p className="text-sm">اضغط على "إضافة إيراد" لإضافة إيراد جديد</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-emerald-100">
                          <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium">{tx.description || 'إيراد عام'}</p>
                          <p className="text-xs text-gray-500">
                            {tx.transactionDate} • {tx.paymentMethod || 'غير محدد'}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-700">
                        +{tx.amount.toLocaleString('ar-EG')} ج.م
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

export default Revenue;
