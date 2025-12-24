/**
 * صفحة إدارة الرواتب والموظفين - نسخة متطورة
 * Enterprise Salaries and Employee Management Page
 * 
 * نظام متكامل وذكي لإدارة الموظفين ورواتبهم
 */

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Wallet,
  Plus,
  Search,
  Users,
  Calendar,
  Loader2,
  CheckCircle,
  Clock,
  UserPlus,
  CreditCard,
  Building,
  Phone,
  Mail,
  Briefcase,
  DollarSign,
  Play,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Download,
  Printer,
  RefreshCw,
  Eye,
  Edit,
  Settings,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  Calculator,
  FileText,
  Link as LinkIcon,
} from 'lucide-react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useSalaryAnalytics } from '@/hooks/useSalaryAnalytics';
import { FinanceNavigation } from '@/components/finance/FinanceNavigation';
import { SalaryItemsDialog } from '@/components/finance/SalaryItemsDialog';
import { toast } from 'sonner';
import { Employee, Salary, EmployeeType } from '@/types/finance';
import { Link } from 'react-router-dom';

const Salaries = () => {
  const {
    loading,
    employees,
    salaries,
    summary,
    addEmployee,
    paySalary,
    generateMonthlySalaries,
    fetchSalaries,
    refreshData,
  } = useFinanceData();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<Salary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSalaryItemsOpen, setIsSalaryItemsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'analytics'>('list');

  // Analytics hook
  const analytics = useSalaryAnalytics({
    employees,
    salaries,
    currentMonth: selectedMonth,
  });

  // نموذج إضافة موظف
  const [newEmployee, setNewEmployee] = useState({
    fullName: '',
    nationalId: '',
    employeeType: 'معلم' as EmployeeType,
    position: '',
    department: '',
    phone: '',
    email: '',
    hireDate: '',
    baseSalary: '',
    contractType: 'دائم',
    bankAccount: '',
    bankName: '',
  });

  // نموذج صرف الراتب
  const [paymentData, setPaymentData] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'تحويل بنكي',
  });

  // إضافة موظف جديد
  const handleAddEmployee = async () => {
    if (!newEmployee.fullName || !newEmployee.baseSalary) {
      toast.error('يرجى إدخال الاسم والراتب الأساسي');
      return;
    }

    setIsSubmitting(true);
    try {
      await addEmployee({
        fullName: newEmployee.fullName,
        nationalId: newEmployee.nationalId,
        employeeType: newEmployee.employeeType,
        position: newEmployee.position,
        department: newEmployee.department,
        phone: newEmployee.phone,
        email: newEmployee.email,
        hireDate: newEmployee.hireDate,
        baseSalary: parseFloat(newEmployee.baseSalary),
      });

      toast.success('تم إضافة الموظف بنجاح');
      setIsAddEmployeeOpen(false);
      setNewEmployee({
        fullName: '',
        nationalId: '',
        employeeType: 'معلم',
        position: '',
        department: '',
        phone: '',
        email: '',
        hireDate: '',
        baseSalary: '',
        contractType: 'دائم',
        bankAccount: '',
        bankName: '',
      });
    } catch (err) {
      toast.error('حدث خطأ أثناء إضافة الموظف');
    } finally {
      setIsSubmitting(false);
    }
  };

  // إنشاء رواتب الشهر
  const handleGenerateSalaries = async () => {
    setIsGenerating(true);
    try {
      const count = await generateMonthlySalaries(selectedMonth);
      if (count > 0) {
        toast.success(`تم إنشاء ${count} راتب لشهر ${selectedMonth}`);
      } else {
        toast.info('جميع الرواتب موجودة مسبقاً لهذا الشهر');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء إنشاء الرواتب');
    } finally {
      setIsGenerating(false);
    }
  };

  // صرف الراتب
  const handlePaySalary = async () => {
    if (!selectedSalary) return;

    setIsSubmitting(true);
    try {
      await paySalary(
        selectedSalary.id,
        paymentData.paymentDate,
        paymentData.paymentMethod
      );
      toast.success('تم صرف الراتب بنجاح');
      setIsPayDialogOpen(false);
      setSelectedSalary(null);
    } catch (err) {
      toast.error('حدث خطأ أثناء صرف الراتب');
    } finally {
      setIsSubmitting(false);
    }
  };

  // صرف جميع الرواتب المستحقة
  const handlePayAllPending = async () => {
    const pending = monthSalaries.filter(s => s.status === 'مستحق');
    if (pending.length === 0) {
      toast.info('لا توجد رواتب مستحقة للصرف');
      return;
    }

    setIsSubmitting(true);
    let success = 0;
    let failed = 0;

    for (const salary of pending) {
      try {
        await paySalary(
          salary.id,
          new Date().toISOString().split('T')[0],
          'تحويل بنكي'
        );
        success++;
      } catch {
        failed++;
      }
    }

    toast.success(`تم صرف ${success} راتب بنجاح${failed > 0 ? ` وفشل ${failed}` : ''}`);
    setIsSubmitting(false);
  };

  // فتح dialog صرف الراتب
  const openPayDialog = (salary: Salary) => {
    setSelectedSalary(salary);
    setIsPayDialogOpen(true);
  };

  // فتح dialog بنود الراتب
  const openSalaryItems = (salary: Salary) => {
    setSelectedSalary(salary);
    setIsSalaryItemsOpen(true);
  };

  // فتح سجل رواتب الموظف
  const openEmployeeHistory = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsHistoryOpen(true);
  };

  // فلترة الموظفين
  const filteredEmployees = employees.filter(emp => {
    if (!emp.isActive) return false;
    if (searchTerm && !emp.fullName.includes(searchTerm)) return false;
    if (filterType !== 'all' && emp.employeeType !== filterType) return false;
    return true;
  });

  // رواتب الشهر المحدد
  const monthSalaries = salaries.filter(s => s.month === selectedMonth);
  const pendingSalaries = monthSalaries.filter(s => s.status === 'مستحق');
  const paidSalaries = monthSalaries.filter(s => s.status === 'تم الصرف');

  // الإحصائيات
  const stats = {
    totalEmployees: employees.filter(e => e.isActive).length,
    teachers: employees.filter(e => e.isActive && e.employeeType === 'معلم').length,
    admins: employees.filter(e => e.isActive && e.employeeType === 'إداري').length,
    workers: employees.filter(e => e.isActive && e.employeeType === 'عامل').length,
    totalPending: pendingSalaries.reduce((sum, s) => sum + s.netSalary, 0),
    totalPaid: paidSalaries.reduce((sum, s) => sum + s.netSalary, 0),
  };

  // تصدير البيانات
  const handleExport = () => {
    const data = monthSalaries.map(s => ({
      'الاسم': s.employee?.fullName || '',
      'النوع': s.employee?.employeeType || '',
      'الراتب الأساسي': s.baseSalary,
      'البدلات': s.totalAllowances,
      'الخصومات': s.totalDeductions,
      'الصافي': s.netSalary,
      'الحالة': s.status,
      'تاريخ الصرف': s.paymentDate || '',
    }));

    // Convert to CSV
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');

    // Download
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `salaries-${selectedMonth}.csv`;
    link.click();

    toast.success('تم تصدير البيانات بنجاح');
  };

  // Show loading state AFTER all hooks have been called
  if (loading) {
    return (
      <DashboardLayout>
        <FinanceNavigation
          summary={summary || undefined}
          isRefreshing={true}
        />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
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

      <PageLayout
        title="إدارة الرواتب والموظفين"
        description="نظام متكامل لإدارة الموظفين ورواتبهم مع تحليلات ذكية"
      >
        <Tabs defaultValue="salaries" className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="salaries" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                الرواتب
              </TabsTrigger>
              <TabsTrigger value="employees" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                الموظفين
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                التحليلات
              </TabsTrigger>
            </TabsList>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 ml-1" />
                تصدير
              </Button>
              <Link to="/finance/expenses">
                <Button variant="outline" size="sm">
                  <LinkIcon className="h-4 w-4 ml-1" />
                  المصروفات
                </Button>
              </Link>
            </div>
          </div>

          {/* قسم الرواتب */}
          <TabsContent value="salaries" className="space-y-6">
            {/* Smart Alerts */}
            {analytics.alerts.length > 0 && (
              <div className="space-y-2">
                {analytics.alerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg flex items-center gap-3 ${alert.type === 'danger'
                      ? 'bg-red-50 border border-red-200 text-red-700'
                      : alert.type === 'warning'
                        ? 'bg-orange-50 border border-orange-200 text-orange-700'
                        : alert.type === 'success'
                          ? 'bg-green-50 border border-green-200 text-green-700'
                          : 'bg-blue-50 border border-blue-200 text-blue-700'
                      }`}
                  >
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-sm opacity-80">{alert.message}</p>
                    </div>
                    {alert.amount && (
                      <Badge variant="secondary">
                        {alert.amount.toLocaleString()} ج.م
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ملخص الرواتب */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-700">رواتب مستحقة</p>
                      <p className="text-2xl font-bold text-orange-800">
                        {stats.totalPending.toLocaleString()} ج.م
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        {pendingSalaries.length} راتب
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-orange-200">
                      <Clock className="h-6 w-6 text-orange-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700">تم صرفها</p>
                      <p className="text-2xl font-bold text-green-800">
                        {stats.totalPaid.toLocaleString()} ج.م
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {paidSalaries.length} راتب
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-green-200">
                      <CheckCircle className="h-6 w-6 text-green-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700">إجمالي الشهر</p>
                      <p className="text-2xl font-bold text-blue-800">
                        {(stats.totalPending + stats.totalPaid).toLocaleString()} ج.م
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        {monthSalaries.length} موظف
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-200">
                      <Wallet className="h-6 w-6 text-blue-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-violet-700">نسبة الصرف</p>
                      <p className="text-2xl font-bold text-violet-800">
                        {analytics.paymentRate.toFixed(0)}%
                      </p>
                      <Progress value={analytics.paymentRate} className="h-2 mt-2" />
                    </div>
                    <div className="p-3 rounded-full bg-violet-200">
                      <PieChart className="h-6 w-6 text-violet-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* اختيار الشهر وإنشاء الرواتب */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <Label className="mb-2 block">الشهر</Label>
                      <Input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => {
                          setSelectedMonth(e.target.value);
                          fetchSalaries(e.target.value);
                        }}
                        className="w-48"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleGenerateSalaries}
                      disabled={isGenerating}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      ) : (
                        <Play className="h-4 w-4 ml-2" />
                      )}
                      إنشاء رواتب الشهر
                    </Button>
                    {pendingSalaries.length > 0 && (
                      <Button
                        onClick={handlePayAllPending}
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        ) : (
                          <Banknote className="h-4 w-4 ml-2" />
                        )}
                        صرف الكل ({pendingSalaries.length})
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* قائمة الرواتب */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">رواتب شهر {selectedMonth}</CardTitle>
                <CardDescription>
                  اضغط على الراتب لعرض التفاصيل أو "صرف" لتسجيل صرف الراتب
                </CardDescription>
              </CardHeader>
              <CardContent>
                {monthSalaries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Wallet className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>لا توجد رواتب لهذا الشهر</p>
                    <p className="text-sm">اضغط على "إنشاء رواتب الشهر" للبدء</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {monthSalaries.map((salary) => (
                      <div
                        key={salary.id}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-md ${salary.status === 'مستحق'
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-green-50 border-green-200'
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${salary.status === 'مستحق' ? 'bg-orange-100' : 'bg-green-100'
                            }`}>
                            {salary.status === 'مستحق' ? (
                              <Clock className="h-5 w-5 text-orange-600" />
                            ) : (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{salary.employee?.fullName || 'موظف'}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Badge variant="secondary" className="text-xs">
                                {salary.employee?.employeeType || 'غير محدد'}
                              </Badge>
                              <span>{salary.employee?.position || ''}</span>
                            </div>
                            {/* Salary breakdown */}
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                              <span>أساسي: {salary.baseSalary.toLocaleString()}</span>
                              {salary.totalAllowances > 0 && (
                                <span className="text-green-600">
                                  +{salary.totalAllowances.toLocaleString()}
                                </span>
                              )}
                              {salary.totalDeductions > 0 && (
                                <span className="text-red-600">
                                  -{salary.totalDeductions.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-left">
                            <p className={`font-bold ${salary.status === 'مستحق' ? 'text-orange-700' : 'text-green-700'
                              }`}>
                              {salary.netSalary.toLocaleString()} ج.م
                            </p>
                            <p className="text-xs text-gray-500">
                              {salary.status === 'تم الصرف' && salary.paymentDate}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {/* Edit Items Button */}
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openSalaryItems(salary)}
                              className="h-8 w-8"
                            >
                              <Calculator className="h-4 w-4" />
                            </Button>

                            {salary.status === 'مستحق' && (
                              <Button
                                size="sm"
                                onClick={() => openPayDialog(salary)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CreditCard className="h-4 w-4 ml-1" />
                                صرف
                              </Button>
                            )}
                            {salary.status === 'تم الصرف' && (
                              <Badge className="bg-green-100 text-green-700">
                                تم الصرف
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* قسم الموظفين */}
          <TabsContent value="employees" className="space-y-6">
            {/* إحصائيات الموظفين */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold">{stats.totalEmployees}</p>
                  <p className="text-sm text-gray-500">إجمالي الموظفين</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Briefcase className="h-8 w-8 mx-auto mb-2 text-violet-600" />
                  <p className="text-2xl font-bold">{stats.teachers}</p>
                  <p className="text-sm text-gray-500">المعلمين</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Building className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                  <p className="text-2xl font-bold">{stats.admins}</p>
                  <p className="text-sm text-gray-500">الإداريين</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <p className="text-2xl font-bold">{stats.workers}</p>
                  <p className="text-sm text-gray-500">العاملين</p>
                </CardContent>
              </Card>
            </div>

            {/* أدوات البحث */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-1 gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="بحث بالاسم..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="كل الأنواع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الأنواع</SelectItem>
                    <SelectItem value="معلم">معلم</SelectItem>
                    <SelectItem value="إداري">إداري</SelectItem>
                    <SelectItem value="عامل">عامل</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <UserPlus className="h-4 w-4 ml-2" />
                    إضافة موظف
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>إضافة موظف جديد</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto">
                    <div>
                      <Label>الاسم الكامل *</Label>
                      <Input
                        placeholder="أدخل اسم الموظف"
                        value={newEmployee.fullName}
                        onChange={(e) => setNewEmployee({ ...newEmployee, fullName: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>نوع الموظف *</Label>
                        <Select
                          value={newEmployee.employeeType}
                          onValueChange={(v) => setNewEmployee({ ...newEmployee, employeeType: v as EmployeeType })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="معلم">معلم</SelectItem>
                            <SelectItem value="إداري">إداري</SelectItem>
                            <SelectItem value="عامل">عامل</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>المسمى الوظيفي</Label>
                        <Input
                          placeholder="مثال: معلم رياضيات"
                          value={newEmployee.position}
                          onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>القسم</Label>
                      <Input
                        placeholder="مثال: قسم اللغة العربية"
                        value={newEmployee.department}
                        onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>الرقم القومي</Label>
                        <Input
                          placeholder="14 رقم"
                          value={newEmployee.nationalId}
                          onChange={(e) => setNewEmployee({ ...newEmployee, nationalId: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>تاريخ التعيين</Label>
                        <Input
                          type="date"
                          value={newEmployee.hireDate}
                          onChange={(e) => setNewEmployee({ ...newEmployee, hireDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>رقم الهاتف</Label>
                        <Input
                          placeholder="01xxxxxxxxx"
                          value={newEmployee.phone}
                          onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>البريد الإلكتروني</Label>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          value={newEmployee.email}
                          onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label>الراتب الأساسي (ج.م) *</Label>
                      <Input
                        type="number"
                        placeholder="5000"
                        value={newEmployee.baseSalary}
                        onChange={(e) => setNewEmployee({ ...newEmployee, baseSalary: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>اسم البنك</Label>
                        <Input
                          placeholder="البنك الأهلي"
                          value={newEmployee.bankName}
                          onChange={(e) => setNewEmployee({ ...newEmployee, bankName: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>رقم الحساب</Label>
                        <Input
                          placeholder="رقم الحساب البنكي"
                          value={newEmployee.bankAccount}
                          onChange={(e) => setNewEmployee({ ...newEmployee, bankAccount: e.target.value })}
                        />
                      </div>
                    </div>

                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={handleAddEmployee}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      ) : (
                        <UserPlus className="h-4 w-4 ml-2" />
                      )}
                      إضافة الموظف
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* قائمة الموظفين */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">قائمة الموظفين</CardTitle>
                <CardDescription>
                  {filteredEmployees.length} موظف نشط
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredEmployees.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>لا يوجد موظفين</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredEmployees.map((emp) => (
                      <div
                        key={emp.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-white hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-full ${emp.employeeType === 'معلم' ? 'bg-violet-100' :
                            emp.employeeType === 'إداري' ? 'bg-emerald-100' : 'bg-orange-100'
                            }`}>
                            {emp.employeeType === 'معلم' ? (
                              <Briefcase className="h-5 w-5 text-violet-600" />
                            ) : emp.employeeType === 'إداري' ? (
                              <Building className="h-5 w-5 text-emerald-600" />
                            ) : (
                              <Users className="h-5 w-5 text-orange-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-lg">{emp.fullName}</p>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              <Badge variant="secondary">{emp.employeeType}</Badge>
                              {emp.position && <span>{emp.position}</span>}
                              {emp.department && <span className="text-xs">• {emp.department}</span>}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                              {emp.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {emp.phone}
                                </span>
                              )}
                              {emp.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {emp.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-left">
                            <p className="font-bold text-lg text-blue-700">
                              {emp.baseSalary.toLocaleString()} ج.م
                            </p>
                            <p className="text-xs text-gray-500">الراتب الأساسي</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEmployeeHistory(emp)}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* قسم التحليلات */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Salary Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  اتجاه الرواتب (آخر 6 أشهر)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.salaryTrends.map((trend, idx) => (
                    <div key={trend.month} className="flex items-center gap-4">
                      <div className="w-20 text-sm text-gray-500">{trend.monthName}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="h-6 bg-gradient-to-r from-blue-400 to-blue-600 rounded"
                            style={{ width: `${Math.max((trend.totalNet / (analytics.salaryTrends[0]?.totalNet || 1)) * 100, 10)}%` }}
                          />
                          <span className="text-sm font-medium">
                            {trend.totalNet.toLocaleString()} ج.م
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="text-green-600">مصروف: {trend.paidCount}</span>
                          <span className="text-orange-600">مستحق: {trend.pendingCount}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Employee Type Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-violet-600" />
                    توزيع الموظفين
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.employeeTypeStats.map(stat => (
                      <div key={stat.type} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">{stat.type}</Badge>
                          <span className="text-sm text-gray-500">
                            {stat.count} موظف
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={stat.percentage} className="w-20" />
                          <span className="text-sm font-medium">
                            {stat.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    توقعات الرواتب
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.salaryForecast.map((forecast, idx) => (
                      <div key={forecast.month} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div>
                          <p className="font-medium">{forecast.month}</p>
                          <p className="text-xs text-gray-500">{forecast.employeeCount} موظف</p>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-blue-700">
                            {forecast.expectedAmount.toLocaleString()} ج.م
                          </p>
                          <p className="text-xs text-gray-500">متوقع</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-gray-500">متوسط الراتب</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {analytics.avgSalary.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">ج.م</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-gray-500">أعلى راتب</p>
                  <p className="text-2xl font-bold text-green-700">
                    {analytics.maxSalary.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">ج.م</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-gray-500">أقل راتب</p>
                  <p className="text-2xl font-bold text-orange-700">
                    {analytics.minSalary.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">ج.م</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-gray-500">التغير الشهري</p>
                  <p className={`text-2xl font-bold ${analytics.monthOverMonthGrowth >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {analytics.monthOverMonthGrowth >= 0 ? '+' : ''}{analytics.monthOverMonthGrowth.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-400">مقارنة بالشهر السابق</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog صرف الراتب */}
        <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>صرف الراتب</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="font-medium">{selectedSalary?.employee?.fullName}</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  {selectedSalary?.netSalary.toLocaleString()} ج.م
                </p>
                <p className="text-sm text-gray-500">شهر {selectedSalary?.month}</p>
              </div>

              <div>
                <Label>تاريخ الصرف</Label>
                <Input
                  type="date"
                  value={paymentData.paymentDate}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                />
              </div>

              <div>
                <Label>طريقة الصرف</Label>
                <Select
                  value={paymentData.paymentMethod}
                  onValueChange={(v) => setPaymentData({ ...paymentData, paymentMethod: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                    <SelectItem value="نقدي">نقدي</SelectItem>
                    <SelectItem value="شيك">شيك</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <p className="text-yellow-700">
                    سيتم تسجيل هذا الراتب تلقائياً في المصروفات العامة
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsPayDialogOpen(false)}>
                إلغاء
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handlePaySalary}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 ml-2" />
                )}
                تأكيد الصرف
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog بنود الراتب */}
        <SalaryItemsDialog
          open={isSalaryItemsOpen}
          onOpenChange={setIsSalaryItemsOpen}
          salary={selectedSalary}
        />

        {/* Dialog سجل رواتب الموظف */}
        <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                سجل رواتب {selectedEmployee?.fullName}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-3">
              {selectedEmployee && (() => {
                const history = analytics.getEmployeeSalaryHistory(selectedEmployee.id);
                if (!history || history.salaries.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p>لا يوجد سجل رواتب</p>
                    </div>
                  );
                }
                return (
                  <>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="p-3 rounded-lg bg-green-50 text-center">
                        <p className="text-xs text-green-600">إجمالي المصروف</p>
                        <p className="font-bold text-green-700">
                          {history.totalPaid.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-orange-50 text-center">
                        <p className="text-xs text-orange-600">المستحق</p>
                        <p className="font-bold text-orange-700">
                          {history.totalPending.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-blue-50 text-center">
                        <p className="text-xs text-blue-600">متوسط الراتب</p>
                        <p className="font-bold text-blue-700">
                          {history.avgNetSalary.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {history.salaries.map(sal => (
                      <div
                        key={sal.id}
                        className={`p-3 rounded-lg border ${sal.status === 'تم الصرف' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{sal.month}</p>
                            <div className="text-xs text-gray-500">
                              {sal.status === 'تم الصرف' && sal.paymentDate && `صرف في: ${sal.paymentDate}`}
                            </div>
                          </div>
                          <div className="text-left">
                            <p className={`font-bold ${sal.status === 'تم الصرف' ? 'text-green-700' : 'text-orange-700'}`}>
                              {sal.netSalary.toLocaleString()} ج.م
                            </p>
                            <Badge className={sal.status === 'تم الصرف' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                              {sal.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>
      </PageLayout>
    </DashboardLayout>
  );
};

export default Salaries;
