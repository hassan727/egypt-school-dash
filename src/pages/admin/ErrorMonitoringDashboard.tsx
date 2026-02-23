/**
 * صفحة مراقبة الأخطاء - Dashboard للمسؤولين
 * Error Monitoring Dashboard for Administrators
 */

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  AlertTriangle,
  Bug,
  CheckCircle,
  Clock,
  Database,
  Network,
  Shield,
  TrendingUp,
  Zap,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { errorTrackingService, ErrorLog, ErrorStatistics } from '@/services/errorTrackingService';

const ErrorMonitoringDashboard = () => {
  const [statistics, setStatistics] = useState<ErrorStatistics | null>(null);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [filteredErrors, setFilteredErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshInterval, setRefreshInterval] = useState<number | null>(30000); // 30 seconds

  // جلب الإحصائيات والأخطاء
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // جلب الإحصائيات
        const stats = await errorTrackingService.getErrorStatistics(7);
        setStatistics(stats);

        // جلب جميع الأخطاء
        const { data } = await supabase
          .from('error_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        setErrors(data || []);
      } catch (err) {
        console.error('خطأ في جلب البيانات:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // تحديث دوري
    let interval: NodeJS.Timeout | null = null;
    if (refreshInterval) {
      interval = setInterval(fetchData, refreshInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [refreshInterval]);

  // تطبيق الفلاتر
  useEffect(() => {
    let filtered = errors;

    if (searchTerm) {
      filtered = filtered.filter(
        e =>
          e.error_code.includes(searchTerm) ||
          e.error_message.includes(searchTerm) ||
          e.module.includes(searchTerm)
      );
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(e => e.severity === severityFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    setFilteredErrors(filtered);
  }, [errors, searchTerm, severityFilter, statusFilter]);

  // الألوان حسب الخطورة
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-700 bg-red-100 border-red-300';
      case 'high':
        return 'text-orange-700 bg-orange-100 border-orange-300';
      case 'medium':
        return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'low':
        return 'text-green-700 bg-green-100 border-green-300';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5" />;
      case 'high':
        return <AlertCircle className="h-5 w-5" />;
      case 'medium':
        return <Clock className="h-5 w-5" />;
      case 'low':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Bug className="h-5 w-5" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'network':
        return <Network className="h-4 w-4" />;
      case 'auth':
        return <Shield className="h-4 w-4" />;
      case 'validation':
        return <Zap className="h-4 w-4" />;
      default:
        return <Bug className="h-4 w-4" />;
    }
  };

  if (loading && !statistics) {
    return (
      <DashboardLayout>
        <div className="text-center py-10">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p>جاري تحميل بيانات الأخطاء...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
        {/* الرأس */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">مراقبة الأخطاء</h1>
            <p className="text-gray-600 mt-1">نظام تتبع الأخطاء والتنبيهات الذكي</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setRefreshInterval(refreshInterval ? null : 30000)}
              variant={refreshInterval ? 'default' : 'outline'}
              className="gap-2"
            >
              {refreshInterval ? (
                <>
                  <Eye className="h-4 w-4" />
                  تحديث مباشر
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" />
                  إيقاف التحديث
                </>
              )}
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              تحديث
            </Button>
          </div>
        </div>

        {/* الإحصائيات الرئيسية */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* إجمالي الأخطاء */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">إجمالي الأخطاء</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{statistics.total_errors}</div>
                <p className="text-xs text-gray-500 mt-1">آخر 7 أيام</p>
              </CardContent>
            </Card>

            {/* الأخطاء الحرجة */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600">حرجة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-700">{statistics.critical_count}</div>
                <p className="text-xs text-red-500 mt-1">تحتاج انتباه فوري</p>
              </CardContent>
            </Card>

            {/* الأخطاء العالية */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-600">عالية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-700">{statistics.high_count}</div>
                <p className="text-xs text-orange-500 mt-1">يجب مراقبتها</p>
              </CardContent>
            </Card>

            {/* المعدل اليومي */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-600">الاتجاه</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700">
                  {statistics.error_trend.length > 0
                    ? statistics.error_trend[statistics.error_trend.length - 1].count
                    : 0}
                </div>
                <p className="text-xs text-blue-500 mt-1">اليوم الأخير</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* الرسوم البيانية */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* اتجاه الأخطاء */}
          {statistics && statistics.error_trend.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">اتجاه الأخطاء</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={statistics.error_trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* الأخطاء حسب النوع */}
          {statistics && Object.keys(statistics.by_type).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">الأخطاء حسب النوع</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={Object.entries(statistics.by_type).map(([name, value]) => ({
                        name,
                        value,
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#ef4444" />
                      <Cell fill="#f97316" />
                      <Cell fill="#eab308" />
                      <Cell fill="#84cc16" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* الأخطاء الحرجة الأخيرة */}
        {statistics && statistics.recent_errors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>أحدث الأخطاء الحرجة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statistics.recent_errors.slice(0, 5).map(error => (
                  <div
                    key={error.id}
                    className={`p-3 border rounded-lg flex gap-3 ${getSeverityColor(error.severity)}`}
                  >
                    {getSeverityIcon(error.severity)}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{error.error_code}</p>
                      <p className="text-xs mt-1">{error.error_message}</p>
                      <p className="text-xs mt-2 opacity-75">
                        {new Date(error.created_at || '').toLocaleString('ar-EG')}
                      </p>
                    </div>
                    <Badge variant="outline">{error.module}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* جدول الأخطاء المفصل */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>سجل الأخطاء المفصل</CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="بحث..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-40"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger onClick={() => setSeverityFilter('all')}>الكل</TabsTrigger>
                <TabsTrigger onClick={() => setSeverityFilter('critical')}>🔴 حرج</TabsTrigger>
                <TabsTrigger onClick={() => setSeverityFilter('high')}>🟠 عالي</TabsTrigger>
                <TabsTrigger onClick={() => setStatusFilter('new')}>جديد</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-2 mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-right p-2">الخطورة</th>
                        <th className="text-right p-2">الكود</th>
                        <th className="text-right p-2">الرسالة</th>
                        <th className="text-right p-2">النوع</th>
                        <th className="text-right p-2">الوقت</th>
                        <th className="text-right p-2">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredErrors.map(error => (
                        <tr key={error.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <Badge className={`gap-1 ${getSeverityColor(error.severity)}`}>
                              {getSeverityIcon(error.severity)}
                              {error.severity}
                            </Badge>
                          </td>
                          <td className="p-2 font-mono text-xs">{error.error_code}</td>
                          <td className="p-2 text-xs truncate max-w-xs">{error.error_message}</td>
                          <td className="p-2">
                            <Badge variant="outline" className="gap-1">
                              {getTypeIcon(error.error_type)}
                              {error.error_type}
                            </Badge>
                          </td>
                          <td className="p-2 text-xs">
                            {new Date(error.created_at || '').toLocaleString('ar-EG')}
                          </td>
                          <td className="p-2">
                            <Badge variant={error.status === 'new' ? 'destructive' : 'secondary'}>
                              {error.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredErrors.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600" />
                    <p>لا توجد أخطاء مطابقة</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ErrorMonitoringDashboard;
