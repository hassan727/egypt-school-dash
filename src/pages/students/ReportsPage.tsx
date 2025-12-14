import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGlobalFilter } from '@/context/GlobalFilterContext';
import { useBatchStudents } from '@/hooks/useBatchStudents';
import { AnalyticsService } from '@/services/analyticsService';
import { ReportsService } from '@/services/reportsService';
import * as XLSX from 'xlsx';

type PeriodType = 'daily' | 'weekly';

const ReportsPage = () => {
  const { selectedYear, stagesClasses, selectedClass, setSelectedClass, selectedStage, setSelectedStage } = useGlobalFilter();
  const [searchParams] = useSearchParams();
  const classId = selectedClass && selectedClass !== 'all' ? selectedClass : '';
  const { students } = useBatchStudents(classId || null);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [periodType, setPeriodType] = useState<PeriodType>('daily');
  const [supervisorNotes, setSupervisorNotes] = useState<string>('');
  const [studentDetails, setStudentDetails] = useState<{
    student_id: string;
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
    attendance_rate: number;
  }[]>([]);
  const [dailyAggregates, setDailyAggregates] = useState<{
    date: string;
    present: number;
    absent: number;
    total: number;
    attendance_rate: number;
  }[]>([]);

  // استخراج المراحل الفريدة
  const uniqueStages = useMemo(() => {
    const stages = new Map();
    stagesClasses.forEach(c => {
      if (c.stage_id && c.stage_name) {
        stages.set(c.stage_id, c.stage_name);
      }
    });
    return Array.from(stages.entries()).map(([id, name]) => ({ id, name }));
  }, [stagesClasses]);

  // فلترة الفصول بناءً على المرحلة المختارة
  const filteredClasses = useMemo(() => {
    if (selectedStage === 'all') return stagesClasses;
    return stagesClasses.filter(c => String(c.stage_id) === String(selectedStage));
  }, [selectedStage, stagesClasses]);

  const selectedClassName = useMemo(() => {
    const c = stagesClasses.find(c => String(c.id) === String(selectedClass));
    return c ? c.class_name : '';
  }, [stagesClasses, selectedClass]);

  const canGenerate = useMemo(() => {
    return classId && startDate && endDate;
  }, [classId, startDate, endDate]);

  const totalStudents = useMemo(() => students.length, [students]);

  const totalDays = useMemo(() => {
    return dailyAggregates.length;
  }, [dailyAggregates]);

  const attendancePercentage = useMemo(() => {
    if (studentDetails.length === 0) return 0;
    const sum = studentDetails.reduce((acc, s) => acc + (s.attendance_rate || 0), 0);
    return Math.round((sum / studentDetails.length) * 100) / 100;
  }, [studentDetails]);

  const absencePercentage = useMemo(() => {
    return Math.round((100 - attendancePercentage) * 100) / 100;
  }, [attendancePercentage]);

  const handleGenerate = async () => {
    if (!canGenerate) return;
    const ids = students.map(s => s.student_id);
    const details = await AnalyticsService.getAttendanceDetailsByRangeForStudents(startDate, endDate, ids);
    setStudentDetails(details);
    const daily = await AnalyticsService.getAttendanceDailyAggregatesByRange(startDate, endDate, ids);
    setDailyAggregates(daily);
  };

  const exportCSV = () => {
    const rows = studentDetails.map((s, idx) => {
      const st = students.find(ss => ss.student_id === s.student_id);
      const name = st ? st.full_name_ar : 'غير معروف';
      return {
        رقم: idx + 1,
        اسم_الطالب: name,
        عدد_أيام_الحضور: s.present,
        عدد_أيام_الغياب: s.absent,
        نسبة_الحضور: `${s.attendance_rate.toFixed(2)}%`,
        نسبة_الغياب: `${(100 - s.attendance_rate).toFixed(2)}%`,
      };
    });
    const filename = `تقرير_الحضور_${selectedClassName || 'الفصل'}_${startDate}_إلى_${endDate}`;
    ReportsService.exportToCSV(rows as any[], filename);
  };

  const exportExcel = () => {
    const rows = studentDetails.map((s, idx) => {
      const st = students.find(ss => ss.student_id === s.student_id);
      const name = st ? st.full_name_ar : 'غير معروف';
      return {
        رقم: idx + 1,
        اسم_الطالب: name,
        عدد_أيام_الحضور: s.present,
        عدد_أيام_الغياب: s.absent,
        نسبة_الحضور: Number(s.attendance_rate.toFixed(2)),
        نسبة_الغياب: Number((100 - s.attendance_rate).toFixed(2)),
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    const sheetName = `الحضور_${startDate}_إلى_${endDate}`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const fileName = `تقرير_الحضور_${selectedClassName || 'الفصل'}_${startDate}_إلى_${endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const weeklyRows = useMemo(() => {
    if (periodType !== 'weekly') return [];
    const byWeek: Record<string, { present: number; absent: number; total: number }> = {};
    dailyAggregates.forEach(r => {
      const d = new Date(r.date);
      const day = d.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const monday = new Date(d);
      monday.setDate(d.getDate() + mondayOffset);
      const weekKey = `${monday.getFullYear()}-W${Math.ceil((monday.getDate()) / 7)}`;
      if (!byWeek[weekKey]) byWeek[weekKey] = { present: 0, absent: 0, total: 0 };
      byWeek[weekKey].present += r.present;
      byWeek[weekKey].absent += r.absent;
      byWeek[weekKey].total += r.total;
    });
    return Object.entries(byWeek).map(([wk, s]) => ({
      key: wk,
      present: s.present,
      absent: s.absent,
      rate: s.total ? Math.round((s.present / s.total) * 100) : 0,
    }));
  }, [periodType, dailyAggregates]);

  useEffect(() => {
    // Initialize date range
    if (!startDate && !endDate) {
      const today = new Date();
      const iso = (d: Date) => d.toISOString().slice(0, 10);
      const from = new Date(today);
      from.setDate(today.getDate() - 7);
      setStartDate(iso(from));
      setEndDate(iso(today));
    }
    // Initialize class from query param
    const classIdParam = searchParams.get('classId');
    if (classIdParam) {
      setSelectedClass(classIdParam);
    }
  }, [startDate, endDate, searchParams, setSelectedClass]);

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        <style>
          {`
          /* تنسيقات الجداول - شاشة العرض */
          .report-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
          }
          .report-table th,
          .report-table td {
            border: 1px solid #374151;
            padding: 8px 12px;
            text-align: center;
          }
          .report-table th {
            background-color: #f3f4f6;
            font-weight: 600;
            color: #1f2937;
          }
          .report-table tbody tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .report-table tbody tr:hover {
            background-color: #e5e7eb;
          }
          
          /* تنسيقات الطباعة - محسّنة */
          @media print {
            .no-print { display: none !important; }
            .sidebar, nav, header { display: none !important; }
            
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            
            .space-y-6 > * + * { margin-top: 8px !important; }
            .mb-6 { margin-bottom: 8px !important; }
            .p-4 { padding: 6px !important; }
            
            /* الهيدر المدمج */
            .print-header {
              display: flex !important;
              flex-direction: row !important;
              justify-content: space-between !important;
              align-items: center !important;
              border: 1px solid #000 !important;
              padding: 6px 10px !important;
              margin-bottom: 8px !important;
              background-color: #f3f4f6 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .print-header-title {
              font-size: 14px !important;
              font-weight: bold !important;
            }
            
            .print-header-info {
              display: flex !important;
              gap: 15px !important;
              font-size: 10px !important;
            }
            
            /* تنسيق الجدول للطباعة */
            .report-table {
              font-size: 9px !important;
            }
            .report-table th,
            .report-table td {
              border: 1.5px solid #000 !important;
              padding: 3px 4px !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            /* منع فصل المحتوى في الطباعة */
            .avoid-break {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            /* ملخص التقرير الجديد للطباعة */
            .report-summary-container {
               margin-bottom: 10px !important;
            }
            .report-summary-grid {
              border: 1.5px solid #000 !important;
              font-size: 10px !important;
              display: grid !important;
              grid-template-columns: repeat(4, 1fr) !important;
            }
            .report-summary-cell {
              border: 1px solid #000 !important;
              padding: 4px !important;
              text-align: center !important;
             }
            .report-summary-label {
              background-color: #f3f4f6 !important;
              font-weight: bold !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            /* التوقيعات */
            .print-signatures {
              display: grid !important;
              grid-template-columns: repeat(3, 1fr) !important;
              gap: 8px !important;
              font-size: 9px !important;
              margin-top: 10px !important;
            }
            
            .print-signatures > div {
              border: 1px solid #000 !important;
              padding: 4px !important;
              text-align: center !important;
            }
            
            @page { 
              size: A4; 
              margin: 8mm; 
            }
            
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        `}
        </style>
        <Card>
          <CardHeader className="no-print">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle>تقرير الغياب والحضور</CardTitle>
                <CardDescription className="mt-2">عام دراسي: {selectedYear}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportCSV}>تصدير CSV</Button>
                <Button variant="outline" onClick={exportExcel}>تصدير Excel</Button>
                <Button variant="outline" onClick={() => window.print()}>طباعة</Button>
              </div>
            </div>
          </CardHeader>

          <div className="hidden print:block print-header">
            <div className="print-header-title">تقرير الغياب والحضور - {stagesClasses.find(c => String(c.stage_id) === String(selectedStage))?.stage_name || ''} - {selectedClassName || 'غير محدد'}</div>
            <div className="print-header-info">
              <span>عام: {selectedYear}</span>
              <span>من: {startDate}</span>
              <span>إلى: {endDate}</span>
              <span>النوع: {periodType === 'daily' ? 'يومي' : 'أسبوعي'}</span>
            </div>
          </div>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 no-print">
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500 mb-1 block">المرحلة</label>
                <Select value={String(selectedStage)} onValueChange={setSelectedStage}>
                  <SelectTrigger className="h-10 text-right">
                    <SelectValue placeholder="اختر المرحلة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المراحل</SelectItem>
                    {uniqueStages.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500 mb-1 block">الفصل</label>
                <Select value={String(selectedClass)} onValueChange={setSelectedClass}>
                  <SelectTrigger className="h-10 text-right">
                    <SelectValue placeholder="اختر الفصل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الفصول</SelectItem>
                    {filteredClasses.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.class_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500 mb-1 block">من</label>
                <input type="date" className="h-10 border rounded px-3 py-2 text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500 mb-1 block">إلى</label>
                <input type="date" className="h-10 border rounded px-3 py-2 text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500 mb-1 block">النوع</label>
                <div className="flex gap-2">
                  <Button variant={periodType === 'daily' ? 'default' : 'outline'} className="h-10 flex-1 px-2" onClick={() => setPeriodType('daily')}>يومي</Button>
                  <Button variant={periodType === 'weekly' ? 'default' : 'outline'} className="h-10 flex-1 px-2" onClick={() => setPeriodType('weekly')}>أسبوعي</Button>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mb-4 no-print">
              <div className="text-sm">
                <div>الفصل الدراسي: {selectedClassName || 'غير محدد'}</div>
                <div>المدة: {periodType === 'daily' ? 'يومي' : 'أسبوعي'}</div>
                <div>من {startDate} إلى {endDate}</div>
              </div>
              <Button onClick={handleGenerate} disabled={!canGenerate}>توليد التقرير</Button>
            </div>

            <div className="mb-6">
              <div className="font-semibold mb-3 text-lg">تقرير تفصيلي للطلاب</div>
              <div className="border border-gray-400 rounded-lg overflow-hidden">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>رقم</th>
                      <th>اسم الطالب</th>
                      <th>عدد أيام الحضور</th>
                      <th>عدد أيام الغياب</th>
                      <th>نسبة الحضور</th>
                      <th>نسبة الغياب</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, idx) => {
                      const det = studentDetails.find(d => d.student_id === s.student_id);
                      const present = det ? det.present : 0;
                      const absent = det ? det.absent : 0;
                      const attendRate = det ? det.attendance_rate : 0;
                      return (
                        <tr key={s.student_id}>
                          <td>{idx + 1}</td>
                          <td className="text-right">{s.full_name_ar}</td>
                          <td>{present}</td>
                          <td>{absent}</td>
                          <td>{attendRate.toFixed(2)}%</td>
                          <td>{(100 - attendRate).toFixed(2)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {periodType === 'weekly' && (
              <div className="mb-6">
                <div className="font-semibold mb-3 text-lg">ملخص أسبوعي</div>
                <div className="border border-gray-400 rounded-lg overflow-hidden">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>الأسبوع</th>
                        <th>عدد أيام الحضور</th>
                        <th>عدد أيام الغياب</th>
                        <th>نسبة الحضور</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weeklyRows.length > 0 ? (
                        weeklyRows.map(row => (
                          <tr key={row.key}>
                            <td>{row.key}</td>
                            <td>{row.present}</td>
                            <td>{row.absent}</td>
                            <td>{row.rate}%</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center text-gray-500 py-4">لا توجد بيانات متاحة</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ملخص التقرير النهائي - تصميم احترافي */}
            <div className="mb-6 report-summary-container avoid-break">
              <div className="font-semibold mb-3 text-lg">ملخص التقرير</div>
              <div className="border border-gray-400 rounded-lg overflow-hidden report-summary-grid">
                <div className="grid grid-cols-2 md:grid-cols-4 text-center print:contents">
                  {/* إجمالي الطلاب */}
                  <div className="bg-gray-100 p-3 border-b md:border-b-0 border-l border-gray-300 font-bold report-summary-cell report-summary-label">إجمالي الطلاب</div>
                  <div className="p-3 border-b md:border-b-0 border-l md:border-l-0 border-gray-300 bg-white report-summary-cell">{totalStudents}</div>

                  {/* أيام الدراسة */}
                  <div className="bg-gray-100 p-3 border-b md:border-b-0 border-l border-gray-300 font-bold report-summary-cell report-summary-label">أيام الدراسة</div>
                  <div className="p-3 border-b md:border-b-0 border-l md:border-l-0 border-gray-300 bg-white report-summary-cell">{totalDays}</div>

                  {/* نسبة الحضور */}
                  <div className="bg-gray-100 p-3 border-b md:border-b-0 border-l border-gray-300 font-bold report-summary-cell report-summary-label">نسبة الحضور</div>
                  <div className="p-3 border-b md:border-b-0 border-l md:border-l-0 border-gray-300 bg-white report-summary-cell">{attendancePercentage}%</div>

                  {/* نسبة الغياب */}
                  <div className="bg-gray-100 p-3 border-l md:border-l-0 border-gray-300 font-bold report-summary-cell report-summary-label">نسبة الغياب</div>
                  <div className="p-3 bg-white report-summary-cell">{absencePercentage}%</div>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 mb-6 no-print">
              <div className="font-semibold mb-2">ملاحظات المشرف</div>
              <textarea className="w-full border rounded px-3 py-2 text-sm" rows={3} value={supervisorNotes} onChange={e => setSupervisorNotes(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print-signatures avoid-break">
              <div className="border rounded-lg p-4">توقيع مشرف الغياب: ________________</div>
              <div className="border rounded-lg p-4">توقيع وكيل المدرسة: ________________</div>
              <div className="border rounded-lg p-4">توقيع مدير المدرسة: ________________</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
