import { useState, useEffect } from 'react';
import { useSystemSchoolId } from '@/context/SystemContext';
import { PageLayout } from "@/components/PageLayout";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Award, Search, Download, Eye, Plus } from "lucide-react";
import { supabase } from '@/lib/supabase';

interface Certificate {
  id: string;
  student_id: string;
  certificate_type: string;
  academic_year: string;
  stage: string;
  class: string;
  issue_date: string;
  expiry_date?: string;
  overall_grade: number;
  overall_gpa: number;
  grade_level: string;
  status: string;
  issued_by: string;
  notes: string;
  certificate_number: string;
  student_name?: string;
}

const Certificates = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const schoolId = useSystemSchoolId();

  useEffect(() => {
    if (schoolId) fetchCertificates();
  }, [schoolId]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('certificates')
        .select(`
          *,
          students:student_id (
            full_name_ar
          )
        `)
        .eq('school_id', schoolId)
        .order('issue_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      const formattedCertificates: Certificate[] = (data || []).map(cert => ({
        ...cert,
        student_name: cert.students?.full_name_ar
      }));

      setCertificates(formattedCertificates);
    } catch (error) {
      console.error('خطأ في جلب الشهادات:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = cert.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.certificate_number.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || cert.certificate_type === filterType;
    const matchesYear = filterYear === 'all' || cert.academic_year === filterYear;

    return matchesSearch && matchesType && matchesYear;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'صالح': return 'bg-green-100 text-green-800';
      case 'منتهي': return 'bg-yellow-100 text-yellow-800';
      case 'ملغي': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG');
  };

  const handlePrintCertificate = (certificate: Certificate) => {
    // فتح نافذة طباعة مع بيانات الشهادة
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>شهادة - ${certificate.certificate_number}</title>
            <style>
              body { font-family: Arial, sans-serif; direction: rtl; text-align: center; padding: 50px; }
              .certificate { border: 5px solid gold; padding: 50px; max-width: 800px; margin: 0 auto; }
              .header { font-size: 36px; font-weight: bold; margin-bottom: 30px; }
              .content { font-size: 18px; line-height: 1.6; }
              .signature { margin-top: 50px; font-size: 16px; }
            </style>
          </head>
          <body>
            <div class="certificate">
              <div class="header">شهادة تقدير</div>
              <div class="content">
                <p>يسر مدرسة جاد الله أن تمنح</p>
                <p><strong>${certificate.student_name}</strong></p>
                <p>رقم الطالب: ${certificate.student_id}</p>
                <p>هذه الشهادة للعام الدراسي ${certificate.academic_year}</p>
                <p>المرحلة: ${certificate.stage} - الفصل: ${certificate.class}</p>
                <p>المعدل العام: ${certificate.overall_grade.toFixed(2)}%</p>
                <p>المعدل التراكمي: ${certificate.overall_gpa.toFixed(2)}</p>
                <p>التقدير: <strong>${certificate.grade_level}</strong></p>
                <p>تاريخ الإصدار: ${formatDate(certificate.issue_date)}</p>
                <p>رقم الشهادة: ${certificate.certificate_number}</p>
              </div>
              <div class="signature">
                <p>مدير المدرسة</p>
                <p>___________________________</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <DashboardLayout>
      <PageLayout title="الشهادات" description="إدارة وطباعة شهادات الطلاب">
        <div className="space-y-6">
          {/* رأس الصفحة مع الإحصائيات */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{certificates.length}</div>
                <div className="text-sm text-blue-800">إجمالي الشهادات</div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-r from-green-50 to-green-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {certificates.filter(c => c.status === 'صالح').length}
                </div>
                <div className="text-sm text-green-800">شهادات صالحة</div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {certificates.filter(c => c.certificate_type === 'تقدير نهائي').length}
                </div>
                <div className="text-sm text-yellow-800">تقديرات نهائية</div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-r from-purple-50 to-purple-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(certificates.map(c => c.academic_year)).size}
                </div>
                <div className="text-sm text-purple-800">سنوات دراسية</div>
              </div>
            </Card>
          </div>

          {/* أدوات البحث والفلترة */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="البحث بالاسم أو رقم الطالب أو رقم الشهادة..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="نوع الشهادة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="تقدير نهائي">تقدير نهائي</SelectItem>
                  <SelectItem value="إتمام مرحلة">إتمام مرحلة</SelectItem>
                  <SelectItem value="شهادة حضور">شهادة حضور</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="السنة الدراسية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع السنوات</SelectItem>
                  <SelectItem value="2024-2025">2024-2025</SelectItem>
                  <SelectItem value="2025-2026">2025-2026</SelectItem>
                  <SelectItem value="2026-2027">2026-2027</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* جدول الشهادات */}
          <Card>
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">جاري تحميل الشهادات...</p>
              </div>
            ) : filteredCertificates.length === 0 ? (
              <div className="p-12 text-center">
                <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">لا توجد شهادات</p>
                <p className="text-gray-400 text-sm mt-2">
                  {certificates.length === 0
                    ? 'لم يتم إنشاء أي شهادات بعد'
                    : 'لا توجد شهادات تطابق معايير البحث'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الطالب</TableHead>
                      <TableHead className="text-right">نوع الشهادة</TableHead>
                      <TableHead className="text-right">السنة الدراسية</TableHead>
                      <TableHead className="text-right">التقدير</TableHead>
                      <TableHead className="text-right">المعدل</TableHead>
                      <TableHead className="text-right">تاريخ الإصدار</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCertificates.map((certificate) => (
                      <TableRow key={certificate.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{certificate.student_name}</div>
                            <div className="text-sm text-gray-500">{certificate.student_id}</div>
                          </div>
                        </TableCell>
                        <TableCell>{certificate.certificate_type}</TableCell>
                        <TableCell>{certificate.academic_year}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {certificate.grade_level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{certificate.overall_grade.toFixed(2)}%</div>
                            <div className="text-gray-500">GPA: {certificate.overall_gpa.toFixed(2)}</div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(certificate.issue_date)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(certificate.status)}>
                            {certificate.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrintCertificate(certificate)}
                              className="h-8 w-8 p-0"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </div>
      </PageLayout>
    </DashboardLayout>
  );
};

export default Certificates;
