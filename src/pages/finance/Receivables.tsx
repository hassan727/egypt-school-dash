/**
 * صفحة متابعة مستحقات الطلاب - نسخة متطورة
 * Enterprise Student Receivables Page
 * 
 * نظام ذكي لتتبع حالة سداد الطلاب والمتأخرات
 */

import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  Send,
  BarChart3,
  PieChart,
  Building,
  GraduationCap,
  AlertCircle,
  MessageSquare,
  Download,
  RefreshCw,
  ArrowUpRight,
  Calendar,
  Phone,
  User,
  ChevronDown,
  ChevronUp,
  Banknote,
  FileText,
  Link as LinkIcon,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { useGlobalFilter } from '@/context/GlobalFilterContext';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useReceivablesAnalytics } from '@/hooks/useReceivablesAnalytics';
import { FinanceNavigation } from '@/components/finance/FinanceNavigation';
import { useSystemSchoolId } from '@/context/SystemContext';
import { InstallmentTimeline } from '@/components/finance/InstallmentTimeline';
import { GuardianWhatsAppDialog, formatPhoneNumber } from '@/components/GuardianWhatsAppDialog';
import { toast } from 'sonner';

interface StudentReceivable {
  studentId: string;
  studentName: string;
  classId: string;
  className?: string;
  stageName?: string;
  totalFees: number;
  totalPaid: number;
  totalDiscounts: number;
  remaining: number;
  paymentProgress: number;
  status: 'مكتمل' | 'جاري السداد' | 'متأخر' | 'لم يسدد';
  lastPaymentDate?: string;
  guardianName: string;
  guardianPhone: string;
  guardianNationality?: string;
  installments?: any[];
}

const Receivables = () => {
  const [loading, setLoading] = useState(true);
  const [receivables, setReceivables] = useState<StudentReceivable[]>([]);
  const [installmentsData, setInstallmentsData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('remaining-desc');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentReceivable | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'grouped' | 'analytics'>('list');

  const { selectedYear: academicYear } = useGlobalFilter();
  const schoolId = useSystemSchoolId();
  const { summary, refreshData } = useFinanceData();

  // جلب بيانات المستحقات
  useEffect(() => {
    const fetchReceivables = async () => {
      setLoading(true);
      if (!schoolId) {
        setLoading(false);
        return;
      }

      try {
        // جلب رسوم الطلاب
        const { data: fees, error: feesError } = await supabase
          .from('school_fees')
          .select(`
            id,
            student_id,
            total_amount,
            advance_payment,
            students!inner (
              full_name_ar,
              class_id,
              student_id,
              stage,
              class,
              guardian_full_name,
              guardian_phone,
              guardian_nationality
            )
          `)
          .eq('academic_year_code', academicYear)
          .eq('school_id', schoolId); // Enforce School Identity

        if (feesError) throw feesError;

        // جلب المعاملات المالية (دفعات وخصومات)
        const { data: transactions, error: transactionsError } = await supabase
          .from('financial_transactions')
          .select('student_id, amount, transaction_date, transaction_type')
          .eq('school_id', schoolId) // Enforce School Identity
          .eq('academic_year_code', academicYear)
          .in('transaction_type', ['دفعة', 'خصم']);

        if (transactionsError) throw transactionsError;

        // جلب الأقساط
        const feeIds = (fees || []).map(f => f.id);

        let installments: any[] = [];
        if (feeIds.length > 0) {
          const { data } = await supabase
            .from('fee_installments')
            .select('*')
            .in('fee_id', feeIds);
          installments = data || [];
        }

        setInstallmentsData(installments || []);

        // حساب المستحقات لكل طالب
        const receivablesData: StudentReceivable[] = (fees || []).map(fee => {
          // Debugging log
          // console.log(`Fee Record for ${field.student_id}:`, fee); 
          // console.log(`Advance Payment:`, fee.advance_payment);

          const studentTransactions = transactions?.filter(t => t.student_id === fee.student_id) || [];
          const studentInstallments = (installments || []).filter(i => i.fee_id === fee.id);

          // حساب المدفوعات (الدفعات + المقدمات)
          const payments = studentTransactions.filter(t => t.transaction_type === 'دفعة');
          const totalInstallments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
          const advancePayment = fee.advance_payment || 0;
          const totalPaid = totalInstallments + advancePayment;

          // حساب الخصومات
          const discounts = studentTransactions.filter(t => t.transaction_type === 'خصم');
          const totalDiscounts = discounts.reduce((sum, d) => sum + (d.amount || 0), 0);

          // آخر دفعة
          const lastPayment = payments.sort((a, b) =>
            new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
          )[0];

          const totalFees = fee.total_amount || 0;
          // المتبقي = الإجمالي - المدفوع (شامل المقدم) - الخصم
          const remaining = Math.max(0, totalFees - totalPaid - totalDiscounts);

          // حساب نسبة التقدم بناءً على الصافي (بعد الخصم)
          const netFees = totalFees - totalDiscounts;
          const progress = netFees > 0 ? (totalPaid / netFees) * 100 : (totalPaid > 0 ? 100 : 0);

          // Determine stage from class
          const stage = (fee.students as any)?.stage || 'غير محدد';
          const classId = (fee.students as any)?.class || (fee.students as any)?.class_id || '';

          let status: StudentReceivable['status'];
          if (remaining === 0) {
            status = 'مكتمل';
          } else if (progress >= 50) {
            status = 'جاري السداد';
          } else if (progress > 0) {
            status = 'جاري السداد';
          } else {
            status = 'لم يسدد';
          }

          // Check for overdue installments
          const hasOverdue = studentInstallments.some(inst => {
            if (inst.paid) return false;
            return new Date(inst.due_date) < new Date();
          });
          if (hasOverdue && status !== 'مكتمل') {
            status = 'متأخر';
          }

          return {
            studentId: (fee.students as any)?.student_id || fee.student_id,
            studentName: (fee.students as any)?.full_name_ar || 'غير معروف',
            classId,
            className: classId,
            stageName: stage,
            totalFees,
            totalPaid,
            totalDiscounts,
            remaining,
            paymentProgress: Math.min(progress, 100),
            status,
            lastPaymentDate: lastPayment?.transaction_date,
            guardianName: (fee.students as any)?.guardian_full_name || 'غير متوفر',
            guardianPhone: (fee.students as any)?.guardian_phone || '',
            guardianNationality: (fee.students as any)?.guardian_nationality,
            installments: studentInstallments,
          };
        });

        setReceivables(receivablesData);
      } catch (err) {
        console.error('خطأ في جلب المستحقات:', err);
        toast.error('حدث خطأ في جلب البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchReceivables();
  }, [academicYear, schoolId]);

  // Analytics hook
  const analytics = useReceivablesAnalytics({
    receivables,
    installments: installmentsData,
  });

  // Get unique stages and classes
  const stages = useMemo(() => {
    const stageSet = new Set(receivables.map(r => r.stageName).filter(Boolean));
    return Array.from(stageSet);
  }, [receivables]);

  const classes = useMemo(() => {
    const classSet = new Set(receivables.map(r => r.classId).filter(Boolean));
    return Array.from(classSet);
  }, [receivables]);

  // فلترة وترتيب البيانات
  const filteredReceivables = useMemo(() => {
    let filtered = receivables.filter(r => {
      if (searchTerm && !r.studentName.includes(searchTerm) && !r.studentId.includes(searchTerm)) {
        return false;
      }
      if (filterStatus !== 'all' && r.status !== filterStatus) {
        return false;
      }
      if (filterStage !== 'all' && r.stageName !== filterStage) {
        return false;
      }
      if (filterClass !== 'all' && r.classId !== filterClass) {
        return false;
      }
      return true;
    });

    // Sort
    switch (sortBy) {
      case 'remaining-desc':
        filtered.sort((a, b) => b.remaining - a.remaining);
        break;
      case 'remaining-asc':
        filtered.sort((a, b) => a.remaining - b.remaining);
        break;
      case 'progress-desc':
        filtered.sort((a, b) => b.paymentProgress - a.paymentProgress);
        break;
      case 'progress-asc':
        filtered.sort((a, b) => a.paymentProgress - b.paymentProgress);
        break;
      case 'name':
        filtered.sort((a, b) => a.studentName.localeCompare(b.studentName));
        break;
    }

    return filtered;
  }, [receivables, searchTerm, filterStatus, filterStage, filterClass, sortBy]);

  // Group by stage
  const groupedByStage = useMemo(() => {
    const groups = new Map<string, StudentReceivable[]>();
    filteredReceivables.forEach(r => {
      const stage = r.stageName || 'غير محدد';
      const existing = groups.get(stage) || [];
      groups.set(stage, [...existing, r]);
    });
    return groups;
  }, [filteredReceivables]);

  // Toggle group expansion
  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };

  // Open student details
  const openStudentDetails = (student: StudentReceivable) => {
    setSelectedStudent(student);
    setIsDetailsOpen(true);
  };

  // Export data
  const handleExport = () => {
    const data = filteredReceivables.map(r => ({
      'كود الطالب': r.studentId,
      'اسم الطالب': r.studentName,
      'المرحلة': r.stageName,
      'الفصل': r.classId,
      'الإجمالي': r.totalFees,
      'المدفوع': r.totalPaid,
      'الخصومات': r.totalDiscounts,
      'المتبقي': r.remaining,
      'نسبة السداد': `${r.paymentProgress.toFixed(0)}%`,
      'الحالة': r.status,
      'ولي الأمر': r.guardianName,
      'الهاتف': r.guardianPhone,
    }));

    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receivables-${academicYear}.csv`;
    link.click();

    toast.success('تم تصدير البيانات بنجاح');
  };

  const getStatusColor = (status: StudentReceivable['status']) => {
    switch (status) {
      case 'مكتمل': return 'bg-green-100 text-green-700';
      case 'جاري السداد': return 'bg-blue-100 text-blue-700';
      case 'متأخر': return 'bg-orange-100 text-orange-700';
      case 'لم يسدد': return 'bg-red-100 text-red-700';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress > 0) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
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
        title="متابعة مستحقات الطلاب"
        description="نظام ذكي لتتبع حالة سداد الطلاب والمتأخرات مع تحليلات متقدمة"
      >
        <div className="space-y-6">
          {/* Smart Alerts */}
          {analytics.alerts.length > 0 && (
            <div className="space-y-2">
              {analytics.alerts.slice(0, 3).map(alert => (
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
                  {alert.actionLink && (
                    <Link to={alert.actionLink}>
                      <Button size="sm" variant="outline">عرض</Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ملخص المستحقات */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-violet-700">إجمالي المستحقات</p>
                    <p className="text-2xl font-bold text-violet-800">
                      {analytics.totalFees.toLocaleString()} ج.م
                    </p>
                    <p className="text-xs text-violet-600 mt-1">
                      {analytics.totalStudents} طالب
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-violet-200">
                    <DollarSign className="h-6 w-6 text-violet-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700">تم تحصيله</p>
                    <p className="text-2xl font-bold text-green-800">
                      {analytics.totalCollected.toLocaleString()} ج.م
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {analytics.collectionRate.toFixed(0)}% من الإجمالي
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-green-200">
                    <TrendingUp className="h-6 w-6 text-green-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-700">المتبقي</p>
                    <p className="text-2xl font-bold text-orange-800">
                      {analytics.totalRemaining.toLocaleString()} ج.م
                    </p>
                    <Progress value={100 - analytics.collectionRate} className="h-2 mt-2" />
                  </div>
                  <div className="p-3 rounded-full bg-orange-200">
                    <Clock className="h-6 w-6 text-orange-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-700">طلاب متأخرين</p>
                    <p className="text-2xl font-bold text-red-800">
                      {analytics.totalOverdueStudents}
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      {analytics.totalOverdueAmount.toLocaleString()} ج.م
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-red-200">
                    <AlertTriangle className="h-6 w-6 text-red-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* View Mode Tabs */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <TabsList>
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  قائمة
                </TabsTrigger>
                <TabsTrigger value="grouped" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  حسب المرحلة
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
                <Link to="/finance/revenue">
                  <Button variant="outline" size="sm">
                    <LinkIcon className="h-4 w-4 ml-1" />
                    الإيرادات
                  </Button>
                </Link>
              </div>
            </div>

            {/* إحصائيات الحالة */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {analytics.paymentStatusStats.map(stat => (
                <Card key={stat.status} className="text-center cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setFilterStatus(stat.status)}
                >
                  <CardContent className="pt-6">
                    <div
                      className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: stat.color + '20' }}
                    >
                      {stat.status === 'مكتمل' ? <CheckCircle className="h-6 w-6" style={{ color: stat.color }} /> :
                        stat.status === 'جاري السداد' ? <Clock className="h-6 w-6" style={{ color: stat.color }} /> :
                          <AlertTriangle className="h-6 w-6" style={{ color: stat.color }} />}
                    </div>
                    <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.count}</p>
                    <p className="text-sm text-gray-500">{stat.status}</p>
                    <p className="text-xs text-gray-400">{stat.percentage.toFixed(0)}%</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* أدوات البحث والفلترة */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="بحث بالاسم أو الكود..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الحالات</SelectItem>
                      <SelectItem value="مكتمل">مكتمل</SelectItem>
                      <SelectItem value="جاري السداد">جاري السداد</SelectItem>
                      <SelectItem value="متأخر">متأخر</SelectItem>
                      <SelectItem value="لم يسدد">لم يسدد</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStage} onValueChange={setFilterStage}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="المرحلة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل المراحل</SelectItem>
                      {stages.map(stage => (
                        <SelectItem key={stage} value={stage!}>{stage}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="الترتيب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remaining-desc">المتبقي (الأعلى)</SelectItem>
                      <SelectItem value="remaining-asc">المتبقي (الأقل)</SelectItem>
                      <SelectItem value="progress-desc">التقدم (الأعلى)</SelectItem>
                      <SelectItem value="progress-asc">التقدم (الأقل)</SelectItem>
                      <SelectItem value="name">الاسم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* List View */}
            <TabsContent value="list" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-violet-600" />
                    حالة سداد الطلاب
                  </CardTitle>
                  <CardDescription>
                    عرض {filteredReceivables.length} من {receivables.length} طالب
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredReceivables.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p>لا توجد بيانات</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredReceivables.slice(0, 50).map((student) => (
                        <div
                          key={student.studentId}
                          className="p-4 rounded-lg border bg-white hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <p className="font-medium text-lg">{student.studentName}</p>
                                <Badge className={getStatusColor(student.status)}>
                                  {student.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                <span className="flex items-center gap-1">
                                  <GraduationCap className="h-3 w-3" />
                                  {student.stageName} - {student.classId}
                                </span>
                                <span>كود: {student.studentId}</span>
                                {student.lastPaymentDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    آخر دفعة: {student.lastPaymentDate}
                                  </span>
                                )}
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>التقدم في السداد</span>
                                  <span className="font-medium">
                                    {Math.round(student.paymentProgress)}%
                                  </span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${getProgressColor(student.paymentProgress)} transition-all`}
                                    style={{ width: `${student.paymentProgress}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                              <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                  <p className="text-xs text-gray-500">الإجمالي</p>
                                  <p className="font-bold text-violet-700">
                                    {student.totalFees.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">المدفوع</p>
                                  <p className="font-bold text-green-700">
                                    {student.totalPaid.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">المتبقي</p>
                                  <p className="font-bold text-orange-700">
                                    {student.remaining.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openStudentDetails(student)}
                                >
                                  <Eye className="h-4 w-4 ml-1" />
                                  تفاصيل
                                </Button>
                                <Link to={`/student/${student.studentId}/financial-management`}>
                                  <Button size="sm" variant="outline">
                                    <Banknote className="h-4 w-4 ml-1" />
                                    دفع
                                  </Button>
                                </Link>
                                {student.status !== 'مكتمل' && (
                                  <GuardianWhatsAppDialog
                                    studentId={student.studentId}
                                    studentName={student.studentName}
                                    guardianName={student.guardianName}
                                    formattedPhoneNumber={formatPhoneNumber(student.guardianPhone, student.guardianNationality)}
                                    defaultTemplateId="payment_reminder"
                                    transactionDetails={{
                                      'المبلغ': student.remaining.toLocaleString('ar-EG'),
                                      'التاريخ': new Date().toLocaleDateString('ar-EG')
                                    }}
                                  >
                                    <Button size="sm" variant="outline" className="text-blue-600 hover:bg-blue-50">
                                      <Send className="h-4 w-4 ml-1" />
                                      تذكير
                                    </Button>
                                  </GuardianWhatsAppDialog>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {filteredReceivables.length > 50 && (
                        <div className="text-center py-4 text-gray-500">
                          عرض 50 من {filteredReceivables.length} - استخدم البحث للتضييق
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Grouped View */}
            <TabsContent value="grouped" className="space-y-4">
              {Array.from(groupedByStage.entries()).map(([stage, students]) => (
                <Card key={stage}>
                  <CardHeader
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleGroup(stage)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-violet-600" />
                        <div>
                          <CardTitle className="text-lg">{stage}</CardTitle>
                          <CardDescription>
                            {students.length} طالب •
                            {students.filter(s => s.status === 'مكتمل').length} مكتمل •
                            {students.filter(s => s.status === 'متأخر').length} متأخر
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <p className="text-sm text-gray-500">المتبقي</p>
                          <p className="font-bold text-orange-700">
                            {students.reduce((sum, s) => sum + s.remaining, 0).toLocaleString()} ج.م
                          </p>
                        </div>
                        {expandedGroups.has(stage) ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {expandedGroups.has(stage) && (
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {students.map(student => (
                          <div
                            key={student.studentId}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              <Badge className={getStatusColor(student.status)}>
                                {student.status}
                              </Badge>
                              <div>
                                <p className="font-medium">{student.studentName}</p>
                                <p className="text-xs text-gray-500">{student.classId}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="w-24">
                                <Progress value={student.paymentProgress} className="h-2" />
                              </div>
                              <div className="text-left w-24">
                                <p className="font-bold text-orange-700">
                                  {student.remaining.toLocaleString()}
                                </p>
                              </div>
                              <Button size="sm" variant="ghost" onClick={() => openStudentDetails(student)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </TabsContent>

            {/* Analytics View */}
            <TabsContent value="analytics" className="space-y-6">
              {/* Stage Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-violet-600" />
                    تحليل المراحل الدراسية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.stageStats.map(stat => (
                      <div key={stat.stageName} className="flex items-center gap-4">
                        <div className="w-32">
                          <p className="font-medium text-sm">{stat.stageName}</p>
                          <p className="text-xs text-gray-500">{stat.totalStudents} طالب</p>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1 text-xs">
                            <span>نسبة التحصيل: {stat.collectionRate.toFixed(0)}%</span>
                            <span className="text-red-600">{stat.overdueStudents} متأخر</span>
                          </div>
                          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-400 to-green-600"
                              style={{ width: `${stat.collectionRate}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-left w-28">
                          <p className="text-xs text-gray-500">المتبقي</p>
                          <p className="font-bold text-orange-700">
                            {stat.totalRemaining.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Debtors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      أعلى المديونيات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.topDebtors.slice(0, 5).map((student, idx) => (
                        <div key={student.studentId} className="flex items-center justify-between p-2 rounded-lg bg-red-50">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-700 text-sm font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{student.studentName}</p>
                              <p className="text-xs text-gray-500">{student.stageName}</p>
                            </div>
                          </div>
                          <p className="font-bold text-red-700">
                            {student.remaining.toLocaleString()} ج.م
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      مستويات التأخير
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics.overdueLevels.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p>لا توجد أقساط متأخرة</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {analytics.overdueLevels.map(level => (
                          <div key={level.level} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: level.color + '10' }}>
                            <div>
                              <p className="font-medium" style={{ color: level.color }}>{level.level}</p>
                              <p className="text-xs text-gray-500">{level.daysRange}</p>
                            </div>
                            <div className="text-left">
                              <p className="font-bold" style={{ color: level.color }}>
                                {level.count} قسط
                              </p>
                              <p className="text-xs text-gray-500">
                                {level.totalAmount.toLocaleString()} ج.م
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Student Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-violet-600" />
                تفاصيل الطالب
              </DialogTitle>
            </DialogHeader>
            {selectedStudent && (
              <div className="space-y-6 mt-4">
                {/* Student Info */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{selectedStudent.studentName}</h3>
                    <p className="text-gray-500">{selectedStudent.stageName} - {selectedStudent.classId}</p>
                    <p className="text-sm text-gray-400">كود: {selectedStudent.studentId}</p>
                  </div>
                  <Badge className={getStatusColor(selectedStudent.status)}>
                    {selectedStudent.status}
                  </Badge>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-violet-50 text-center">
                    <p className="text-xs text-violet-600">المطلوب</p>
                    <p className="font-bold text-violet-700">{selectedStudent.totalFees.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50 text-center">
                    <p className="text-xs text-green-600">المدفوع</p>
                    <p className="font-bold text-green-700">{selectedStudent.totalPaid.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 text-center">
                    <p className="text-xs text-blue-600">الخصومات</p>
                    <p className="font-bold text-blue-700">{selectedStudent.totalDiscounts.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-50 text-center">
                    <p className="text-xs text-orange-600">المتبقي</p>
                    <p className="font-bold text-orange-700">{selectedStudent.remaining.toLocaleString()}</p>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>نسبة السداد</span>
                    <span className="font-bold">{selectedStudent.paymentProgress.toFixed(0)}%</span>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressColor(selectedStudent.paymentProgress)} transition-all`}
                      style={{ width: `${selectedStudent.paymentProgress}%` }}
                    />
                  </div>
                </div>

                {/* Installments Timeline */}
                {selectedStudent.installments && selectedStudent.installments.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      الأقساط
                    </h4>
                    <InstallmentTimeline
                      installments={selectedStudent.installments.map(i => ({
                        id: i.id,
                        installmentNumber: i.installment_number,
                        amount: i.amount,
                        dueDate: i.due_date,
                        paid: i.paid,
                        paidDate: i.paid_date,
                      }))}
                    />
                  </div>
                )}

                <Separator />

                {/* Guardian Info */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">ولي الأمر</p>
                    <p className="font-medium">{selectedStudent.guardianName}</p>
                    {selectedStudent.guardianPhone && (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedStudent.guardianPhone}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/student/${selectedStudent.studentId}/financial-management`}>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Banknote className="h-4 w-4 ml-1" />
                        الإدارة المالية
                      </Button>
                    </Link>
                    {selectedStudent.status !== 'مكتمل' && (
                      <GuardianWhatsAppDialog
                        studentId={selectedStudent.studentId}
                        studentName={selectedStudent.studentName}
                        guardianName={selectedStudent.guardianName}
                        formattedPhoneNumber={formatPhoneNumber(selectedStudent.guardianPhone, selectedStudent.guardianNationality)}
                        defaultTemplateId="payment_reminder"
                        transactionDetails={{
                          'المبلغ': selectedStudent.remaining.toLocaleString('ar-EG'),
                          'التاريخ': new Date().toLocaleDateString('ar-EG')
                        }}
                      >
                        <Button variant="outline">
                          <Send className="h-4 w-4 ml-1" />
                          تذكير واتساب
                        </Button>
                      </GuardianWhatsAppDialog>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </PageLayout>
    </DashboardLayout>
  );
};

export default Receivables;
