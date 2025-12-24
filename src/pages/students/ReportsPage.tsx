import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGlobalFilter } from '@/context/GlobalFilterContext';
import { useBatchStudents } from '@/hooks/useBatchStudents';
import { AnalyticsService } from '@/services/analyticsService';
import { ReportsService } from '@/services/reportsService';
import { AttendanceReportPrint } from '@/components/AttendanceReportPrint';
import { ManualReportPrint } from '@/components/ManualReportPrint';
import { ManualReportsService, ManualReportSummary } from '@/services/manualReportsService';
import { groupStagesByLevel, LevelReport, calculateSchoolSummary, sortStagesByName, getEducationalLevelForSorting, getGradeNumber } from '@/utils/reportUtils';
import * as XLSX from 'xlsx';
import {
  FileText,
  Users,
  Building2,
  Calendar,
  Download,
  Printer,
  Loader2,
  BarChart3,
  TrendingDown,
  School,
  ClipboardCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

type ReportType = 'class' | 'stage' | 'school' | 'manual';
type DateMode = 'single' | 'range';

// واجهة إدخال البيانات اليدوية
interface ManualClassEntry {
  stageId: string;
  stageName: string;
  classId: string;
  className: string;
  enrolled: number;
  present: number;
  absent: number;
  attendanceRate: number;
  absenceRate: number;
}

interface DailyRecord {
  date: string;
  dayName: string;
  enrolled: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  absenceRate: number;
}

interface ClassRecord {
  index: number;
  classId: string;
  className: string;
  enrolled: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  activeDays?: number;
  avgPresent?: number;
  avgAbsent?: number;
  absenceRate: number;
  attendanceRate: number;
}

interface StageReport {
  stageId: string;
  stageName: string;
  classes: ClassRecord[];
  summary: {
    totalClasses: number;
    totalEnrolled: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    totalExcused: number;
    avgAbsenceRate: number;
  } | null;
}

interface StudentRecord {
  index: number;
  studentId: string;
  name: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  totalDays: number;
  attendanceRate: number;
  absenceRate: number;
}

const ReportsPage = () => {
  const { selectedYear, stagesClasses, selectedClass, setSelectedClass, selectedStage, setSelectedStage } = useGlobalFilter();
  const [searchParams] = useSearchParams();
  const classId = selectedClass && selectedClass !== 'all' ? selectedClass : '';
  const { students } = useBatchStudents(classId || null);

  // States
  const [reportType, setReportType] = useState<ReportType>('class');
  const [dateMode, setDateMode] = useState<DateMode>('range');
  const [singleDate, setSingleDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [supervisorNotes, setSupervisorNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Report Data States
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [studentRecords, setStudentRecords] = useState<StudentRecord[]>([]);
  const [classInfo, setClassInfo] = useState<{ className: string; stageName: string } | null>(null);
  const [classSummary, setClassSummary] = useState<any>(null);

  const [stageClasses, setStageClasses] = useState<ClassRecord[]>([]);
  const [stageInfo, setStageInfo] = useState<{ stageId: string; stageName: string } | null>(null);
  const [stageSummary, setStageSummary] = useState<any>(null);

  const [schoolStages, setSchoolStages] = useState<StageReport[]>([]);
  const [schoolSummary, setSchoolSummary] = useState<any>(null);
  const [levelReports, setLevelReports] = useState<LevelReport[]>([]);

  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  // Manual Entry States
  const [manualEntries, setManualEntries] = useState<ManualClassEntry[]>([]);
  const [manualStage, setManualStage] = useState<string>('');
  const [manualClass, setManualClass] = useState<string>('');
  const [manualEnrolled, setManualEnrolled] = useState<string>('');
  const [manualPresent, setManualPresent] = useState<string>('');
  const [manualAbsent, setManualAbsent] = useState<string>('');
  const [manualReportDate, setManualReportDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [manualReportTitle, setManualReportTitle] = useState<string>('');
  const [savedReports, setSavedReports] = useState<ManualReportSummary[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [showAllYears, setShowAllYears] = useState(false);

  // استخراج المراحل الفريدة
  const uniqueStages = useMemo(() => {
    const stages = new Map();
    stagesClasses.forEach(c => {
      if (c.stage_id && c.stage_name) {
        stages.set(c.stage_id, c.stage_name);
      }
    });
    return Array.from(stages.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => sortStagesByName({ name: a.name }, { name: b.name }));
  }, [stagesClasses]);

  // فلترة الفصول بناءً على المرحلة المختارة
  const filteredClasses = useMemo(() => {
    const classes = selectedStage === 'all'
      ? stagesClasses
      : stagesClasses.filter(c => String(c.stage_id) === String(selectedStage));

    return [...classes].sort((a, b) => {
      // ترتيب حسب المرحلة أولاً
      const stageA = a.stage_name || '';
      const stageB = b.stage_name || '';
      if (stageA !== stageB) {
        const cmp = sortStagesByName({ name: stageA }, { name: stageB });
        if (cmp !== 0) return cmp;
      }
      // ثم ترتيب حسب اسم الفصل
      return (a.class_name || '').localeCompare(b.class_name || '', 'ar');
    });
  }, [selectedStage, stagesClasses]);

  const selectedClassName = useMemo(() => {
    const c = stagesClasses.find(c => String(c.id) === String(selectedClass));
    return c ? c.class_name : '';
  }, [stagesClasses, selectedClass]);

  const selectedStageName = useMemo(() => {
    const s = uniqueStages.find(s => String(s.id) === String(selectedStage));
    return s ? s.name : '';
  }, [uniqueStages, selectedStage]);

  const canGenerate = useMemo(() => {
    if (reportType === 'class') {
      return classId && (dateMode === 'single' ? singleDate : (startDate && endDate));
    } else if (reportType === 'stage') {
      return selectedStage && selectedStage !== 'all' && startDate && endDate;
    } else {
      return startDate && endDate;
    }
  }, [reportType, classId, selectedStage, dateMode, singleDate, startDate, endDate]);

  // جلب معلومات المدرسة
  useEffect(() => {
    const fetchSchoolInfo = async () => {
      try {
        const info = await AnalyticsService.getSchoolInfo();
        setSchoolInfo(info);
      } catch (err) {
        console.error('Error fetching school info:', err);
      }
    };
    fetchSchoolInfo();
  }, []);

  // تهيئة التواريخ
  useEffect(() => {
    if (!startDate && !endDate) {
      const today = new Date();
      const iso = (d: Date) => d.toISOString().slice(0, 10);
      const from = new Date(today);
      from.setDate(today.getDate() - 7);
      setStartDate(iso(from));
      setEndDate(iso(today));
      setSingleDate(iso(today));
    }
    const classIdParam = searchParams.get('classId');
    if (classIdParam) {
      setSelectedClass(classIdParam);
    }
  }, [startDate, endDate, searchParams, setSelectedClass]);

  // توليد التقرير
  const handleGenerate = async () => {
    if (!canGenerate) return;
    setIsLoading(true);

    try {
      const effectiveStartDate = dateMode === 'single' ? singleDate : startDate;
      const effectiveEndDate = dateMode === 'single' ? singleDate : endDate;

      if (reportType === 'class' && classId) {
        // تقرير الفصل اليومي
        const dailyReport = await AnalyticsService.getDailyClassAttendanceReport(
          classId,
          effectiveStartDate,
          effectiveEndDate
        );
        setDailyRecords(dailyReport.dailyRecords);
        setClassSummary(dailyReport.summary);

        // تقرير تفاصيل الطلاب
        const classReport = await AnalyticsService.getClassAttendanceReport(
          classId,
          effectiveStartDate,
          effectiveEndDate
        );
        setStudentRecords(classReport.students);
        setClassInfo(classReport.classInfo);

      } else if (reportType === 'stage' && selectedStage && selectedStage !== 'all') {
        // تقرير المرحلة
        const stageReport = await AnalyticsService.getStageAttendanceReport(
          selectedStage,
          effectiveStartDate,
          effectiveEndDate
        );
        // Sort classes within the stage
        stageReport.classes.sort((a: any, b: any) => a.className.localeCompare(b.className, 'ar'));
        setStageClasses(stageReport.classes);
        setStageInfo(stageReport.stageInfo);
        setStageSummary(stageReport.summary);

      } else if (reportType === 'school') {
        // تقرير المدرسة
        const schoolReport = await AnalyticsService.getSchoolAttendanceReport(
          effectiveStartDate,
          effectiveEndDate
        );
        // Sort stages
        schoolReport.stages.sort((a: any, b: any) => sortStagesByName({ name: a.stageName }, { name: b.stageName }));
        setSchoolStages(schoolReport.stages);
        // إعادة حساب ملخص المدرسة للتأكد من صحة البيانات
        const recalculatedSummary = calculateSchoolSummary(schoolReport.stages);
        setSchoolSummary(recalculatedSummary);
        setLevelReports(groupStagesByLevel(schoolReport.stages));
      }
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== Manual Report Database Functions =====
  const loadSavedReports = async () => {
    const yearToFetch = showAllYears ? null : selectedYear;
    const reports = await ManualReportsService.getReportsList(yearToFetch);
    setSavedReports(reports);
  };

  const handleSaveManualReport = async () => {
    if (manualEntries.length === 0) return;
    setIsSaving(true);

    const entries = manualEntries.map(e => ({
      stage_id: e.stageId,
      stage_name: e.stageName,
      class_id: e.classId,
      class_name: e.className,
      enrolled: e.enrolled,
      present: e.present,
      absent: e.absent,
      attendance_rate: e.attendanceRate,
      absence_rate: e.absenceRate
    }));

    let result;

    if (editingReportId) {
      // حالة التعديل: تحديث التقرير الحالي
      const success = await ManualReportsService.updateReport(
        editingReportId,
        entries,
        manualReportTitle || `تقرير ${manualReportDate}`,
        ''
      );
      result = { success };
    } else {
      // حالة جديد: إنشاء تقرير جديد
      if (!selectedYear) {
        alert('⚠️ خطأ: لم يتم تحديد السنة الدراسية. يرجى اختيار السنة الدراسية أولاً.');
        setIsSaving(false);
        return;
      }

      result = await ManualReportsService.saveReport(
        entries,
        manualReportDate,
        selectedYear,
        manualReportTitle || `تقرير ${manualReportDate}`,
        ''
      );
    }

    setIsSaving(false);

    if (result.success) {
      alert(editingReportId ? '✅ تم تحديث التقرير بنجاح!' : '✅ تم حفظ التقرير بنجاح!');
      setManualEntries([]);
      setManualReportTitle('');
      setEditingReportId(null);
      loadSavedReports();
    } else {
      alert('❌ خطأ في حفظ التقرير: ' + (result as any).error);
    }
  };

  const handleLoadReport = async (reportId: string) => {
    const report = await ManualReportsService.getReportById(reportId);
    if (report && report.entries) {
      setManualEntries(report.entries.map((e: any) => ({
        stageId: e.stage_id,
        stageName: e.stage_name,
        classId: e.class_id,
        className: e.class_name,
        enrolled: e.enrolled,
        present: e.present,
        absent: e.absent,
        attendanceRate: e.attendance_rate,
        absenceRate: e.absence_rate
      })));
      setManualReportDate(report.report_date);
      setManualReportTitle(report.report_title || '');
      // عند التحميل العادي، لا نضع ID التعديل لكي يتم الحفظ كجديد
      setEditingReportId(null);
      setShowHistoryPanel(false);
    }
  };

  const handleEditReport = async (reportId: string) => {
    const report = await ManualReportsService.getReportById(reportId);
    if (report && report.entries) {
      setManualEntries(report.entries.map((e: any) => ({
        stageId: e.stage_id,
        stageName: e.stage_name,
        classId: e.class_id,
        className: e.class_name,
        enrolled: e.enrolled,
        present: e.present,
        absent: e.absent,
        attendanceRate: e.attendance_rate,
        absenceRate: e.absence_rate
      })));
      setManualReportDate(report.report_date);
      setManualReportTitle(report.report_title || '');
      // هنا نضع ID التعديل ليتم التحديث على نفس السجل
      setEditingReportId(reportId);
      setShowHistoryPanel(false);
    }
  };

  const handleCancelEdit = () => {
    setManualEntries([]);
    setManualReportTitle('');
    setEditingReportId(null);
    setManualReportDate(new Date().toISOString().slice(0, 10));
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التقرير؟')) return;
    const success = await ManualReportsService.deleteReport(reportId);
    if (success) {
      loadSavedReports();
    }
  };

  // Load reports when switching to manual tab
  // Load reports when switching to manual tab
  useEffect(() => {
    if (reportType === 'manual') {
      loadSavedReports();
    }
  }, [reportType, selectedYear, showAllYears]);

  // ترتيب البيانات اليدوية حسب المرحلة والصف والفصل
  const sortedManualEntries = useMemo(() => {
    if (manualEntries.length === 0) return manualEntries;

    // نسخ المصفوفة وترتيبها
    return [...manualEntries].sort((a, b) => {
      // 1. ترتيب حسب المرحلة التعليمية
      const levelA = getEducationalLevelForSorting(a.stageName);
      const levelB = getEducationalLevelForSorting(b.stageName);
      if (levelA !== levelB) return levelA - levelB;

      // 2. ترتيب حسب رقم الصف
      const gradeA = getGradeNumber(a.stageName);
      const gradeB = getGradeNumber(b.stageName);
      if (gradeA !== gradeB) return gradeA - gradeB;

      // 3. ترتيب حسب اسم المرحلة أبجدياً (للحالات المتطابقة)
      const stageCompare = a.stageName.localeCompare(b.stageName, 'ar');
      if (stageCompare !== 0) return stageCompare;

      // 4. ترتيب حسب اسم الفصل أبجدياً
      return a.className.localeCompare(b.className, 'ar');
    });
  }, [manualEntries]);

  // تصدير Excel
  const exportExcel = () => {
    let rows: any[] = [];
    let fileName = '';

    if (reportType === 'class') {
      rows = studentRecords.map((s) => ({
        'م': s.index,
        'اسم الطالب': s.name,
        'أيام الحضور': s.present,
        'أيام الغياب': s.absent,
        'أيام التأخير': s.late,
        'نسبة الحضور %': s.attendanceRate,
        'نسبة الغياب %': s.absenceRate,
      }));
      fileName = `تقرير_الفصل_${classInfo?.className || 'غير محدد'}_${startDate}_إلى_${endDate}`;
    } else if (reportType === 'stage') {
      rows = stageClasses.map((c) => {
        if (dateMode === 'single') {
          // منطق التقرير اليومي: أرقام مطلقة
          return {
            'م': c.index,
            'الفصل': c.className,
            'عدد المقيد': c.enrolled,
            'الحاضرين': c.present + c.late,
            'الغائبين': c.absent,
            'نسبة الحضور %': c.attendanceRate,
            'نسبة الغياب %': c.absenceRate,
            'ملاحظات': '-'
          };
        } else {
          // منطق التقرير الفتروي: متوسطات ونسب
          return {
            'م': c.index,
            'الفصل': c.className,
            'عدد المقيد': c.enrolled,
            'نسبة الحضور %': c.attendanceRate,
            'نسبة الغياب %': c.absenceRate,
            'متوسط الحاضرين': c.avgPresent || 0,
            'متوسط الغائبين': c.avgAbsent || 0,
            'ملاحظات': '-'
          };
        }
      });
      fileName = `تقرير_المرحلة_${stageInfo?.stageName || 'غير محدد'}_${startDate}_إلى_${endDate}`;
    } else {
      schoolStages.forEach((stage) => {
        stage.classes.forEach((c) => {
          rows.push({
            'المرحلة': stage.stageName,
            'الفصل': c.className,
            'عدد المقيد': c.enrolled,
            'أيام الحضور': c.present + c.late,
            'أيام الغياب': c.absent,
            'نسبة الحضور %': c.attendanceRate,
            'نسبة الغياب %': c.absenceRate,
            'ملاحظات': '-'
          });
        });
      });
      fileName = `تقرير_المدرسة_الكامل_${startDate}_إلى_${endDate}`;
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'التقرير');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  // تصدير CSV
  const exportCSV = () => {
    let rows: any[] = [];
    let fileName = '';

    if (reportType === 'class') {
      rows = studentRecords.map((s) => ({
        'م': s.index,
        'اسم_الطالب': s.name,
        'أيام_الحضور': s.present,
        'أيام_الغياب': s.absent,
        'نسبة_الحضور': `${s.attendanceRate}%`,
        'نسبة_الغياب': `${s.absenceRate}%`,
      }));
      fileName = `تقرير_الفصل_${classInfo?.className || 'غير محدد'}`;
    } else if (reportType === 'stage') {
      rows = stageClasses.map((c) => {
        if (dateMode === 'single') {
          return {
            'م': c.index,
            'الفصل': c.className,
            'عدد_المقيد': c.enrolled,
            'الحاضرين': c.present + c.late,
            'الغائبين': c.absent,
            'نسبة_الحضور': `${c.attendanceRate}%`,
            'نسبة_الغياب': `${c.absenceRate}%`,
            'ملاحظات': '-'
          };
        } else {
          return {
            'م': c.index,
            'الفصل': c.className,
            'عدد_المقيد': c.enrolled,
            'نسبة_الحضور': `${c.attendanceRate}%`,
            'نسبة_الغياب': `${c.absenceRate}%`,
            'متوسط_الحاضرين': c.avgPresent || 0,
            'متوسط_الغائبين': c.avgAbsent || 0,
            'ملاحظات': '-'
          };
        }
      });
      fileName = `تقرير_المرحلة_${stageInfo?.stageName || 'غير محدد'}`;
    } else {
      schoolStages.forEach((stage) => {
        stage.classes.forEach((c) => {
          rows.push({
            'المرحلة': stage.stageName,
            'الفصل': c.className,
            'عدد_المقيد': c.enrolled,
            'أيام_الحضور': c.present + c.late,
            'أيام_الغياب': c.absent,
            'نسبة_الحضور': `${c.attendanceRate}%`,
            'نسبة_الغياب': `${c.absenceRate}%`,
            'ملاحظات': '-'
          });
        });
      });
      fileName = `تقرير_المدرسة_الكامل`;
    }

    ReportsService.exportToCSV(rows as any[], fileName);
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'class': return 'تقرير الفصل اليومي';
      case 'stage': return 'تقرير المرحلة الكامل';
      case 'school': return 'تقرير المدرسة الكامل';
      default: return 'تقرير الحضور والغياب';
    }
  };

  const getReportSubtitle = () => {
    if (reportType === 'class') {
      return `${classInfo?.stageName || selectedStageName || ''} - ${classInfo?.className || selectedClassName || 'غير محدد'}`;
    } else if (reportType === 'stage') {
      return stageInfo?.stageName || selectedStageName || 'غير محدد';
    }
    return 'جميع المراحل والفصول';
  };

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
          .report-table .summary-row {
            background-color: #fef3c7 !important;
            font-weight: bold;
          }
          .report-table .stage-summary-row {
            background-color: #dbeafe !important;
            font-weight: bold;
          }
          .report-table .school-total-row {
            background-color: #dcfce7 !important;
            font-weight: bold;
            font-size: 15px;
          }
          
          /* تنسيقات الطباعة */
          @media print {
            .no-print { display: none !important; }
            .sidebar, nav, header { display: none !important; }
            
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            
            body { font-size: 11px !important; }
            
            /* الهيدر الرسمي */
            .print-official-header {
              display: block !important;
              border: 2px solid #000 !important;
              margin-bottom: 15px !important;
              page-break-inside: avoid;
            }
            
            .print-header-row {
              display: flex !important;
              justify-content: space-between !important;
              align-items: center !important;
              padding: 8px 15px !important;
              border-bottom: 1px solid #000 !important;
            }
            
            .print-header-row:last-child {
              border-bottom: none !important;
            }
            
            .ministry-text {
              font-size: 12px !important;
              font-weight: bold !important;
            }
            
            .school-name {
              font-size: 16px !important;
              font-weight: bold !important;
              text-align: center !important;
            }
            
            .report-title-print {
              font-size: 14px !important;
              font-weight: bold !important;
              text-align: center !important;
              background-color: #f3f4f6 !important;
              padding: 8px !important;
            }
            
            /* تنسيق الجدول للطباعة */
            .report-table {
              font-size: 10px !important;
            }
            .report-table th,
            .report-table td {
              border: 1.5px solid #000 !important;
              padding: 4px 6px !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .report-table th {
              background-color: #e5e7eb !important;
            }
            .report-table .summary-row {
              background-color: #fef3c7 !important;
            }
            .report-table .stage-summary-row {
              background-color: #dbeafe !important;
            }
            .report-table .school-total-row {
              background-color: #dcfce7 !important;
            }
            
            /* منع فصل المحتوى */
            .avoid-break {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            
            /* الملخص */
            .print-summary {
              border: 1.5px solid #000 !important;
              margin: 15px 0 !important;
            }
            .print-summary-grid {
              display: grid !important;
              grid-template-columns: repeat(4, 1fr) !important;
            }
            .print-summary-cell {
              border: 1px solid #000 !important;
              padding: 6px !important;
              text-align: center !important;
            }
            .print-summary-label {
              background-color: #f3f4f6 !important;
              font-weight: bold !important;
            }
            
            /* التوقيعات */
            .print-signatures {
              display: grid !important;
              grid-template-columns: repeat(3, 1fr) !important;
              gap: 10px !important;
              margin-top: 20px !important;
            }
            .print-signatures > div {
              border: 1px solid #000 !important;
              padding: 8px !important;
              text-align: center !important;
              min-height: 60px !important;
            }
            
            @page { 
              size: A4; 
              margin: 10mm; 
            }
          }
        `}
        </style>

        {/* الهيدر الرسمي للطباعة */}
        <div className="hidden print:block print-official-header">
          <div className="print-header-row">
            <div className="ministry-text">
              {schoolInfo?.ministry_header || 'وزارة التربية والتعليم'}
              <br />
              {schoolInfo?.directorate || 'مديرية التربية والتعليم'}
            </div>
            <div className="school-name">
              {schoolInfo?.name || 'المدرسة'}
            </div>
            <div className="ministry-text text-left">
              العام الدراسي: {selectedYear}
              <br />
              التاريخ: {format(new Date(), 'yyyy/MM/dd', { locale: ar })}
            </div>
          </div>
          <div className="report-title-print">
            {getReportTitle()} - {getReportSubtitle()}
            <br />
            <span style={{ fontSize: '11px', fontWeight: 'normal' }}>
              الفترة من: {dateMode === 'single' ? singleDate : startDate} إلى: {dateMode === 'single' ? singleDate : endDate}
            </span>
          </div>
        </div>

        <Card>
          <CardHeader className="no-print">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">نظام تقارير الحضور والغياب</CardTitle>
                  <CardDescription className="mt-1">عام دراسي: {selectedYear}</CardDescription>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Link to="/students/batch/attendance">
                  <Button className="bg-green-600 hover:bg-green-700 text-white" size="sm">
                    <ClipboardCheck className="w-4 h-4 ml-2" />
                    تسجيل الحضور
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={exportCSV} disabled={isLoading}>
                  <Download className="w-4 h-4 ml-2" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={exportExcel} disabled={isLoading}>
                  <Download className="w-4 h-4 ml-2" />
                  Excel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowPrintDialog(true)}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Printer className="w-4 h-4 ml-2" />
                  طباعة احترافية
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* تبويبات أنواع التقارير */}
            <Tabs
              value={reportType}
              onValueChange={(v) => setReportType(v as ReportType)}
              className="no-print mb-6"
            >
              <TabsList className="grid w-full grid-cols-4 h-auto p-1">
                <TabsTrigger
                  value="class"
                  className="flex items-center gap-2 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">تقرير الفصل</span>
                  <span className="sm:hidden">الفصل</span>
                </TabsTrigger>
                <TabsTrigger
                  value="stage"
                  className="flex items-center gap-2 py-3 data-[state=active]:bg-green-600 data-[state=active]:text-white"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">تقرير المرحلة</span>
                  <span className="sm:hidden">المرحلة</span>
                </TabsTrigger>
                <TabsTrigger
                  value="school"
                  className="flex items-center gap-2 py-3 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                >
                  <Building2 className="w-4 h-4" />
                  <span className="hidden sm:inline">تقرير المدرسة</span>
                  <span className="sm:hidden">المدرسة</span>
                </TabsTrigger>
                <TabsTrigger
                  value="manual"
                  className="flex items-center gap-2 py-3 data-[state=active]:bg-amber-600 data-[state=active]:text-white"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">إدخال يدوي</span>
                  <span className="sm:hidden">يدوي</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* الفلاتر */}
            <div className="bg-slate-50 p-4 rounded-lg border mb-6 no-print">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* المرحلة */}
                {(reportType === 'class' || reportType === 'stage') && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-500 font-medium">المرحلة</label>
                    <Select value={String(selectedStage)} onValueChange={setSelectedStage}>
                      <SelectTrigger className="h-10 bg-white">
                        <SelectValue placeholder="اختر المرحلة" />
                      </SelectTrigger>
                      <SelectContent>
                        {reportType === 'class' && <SelectItem value="all">جميع المراحل</SelectItem>}
                        {uniqueStages.map(s => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* الفصل */}
                {reportType === 'class' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-500 font-medium">الفصل</label>
                    <Select value={String(selectedClass)} onValueChange={setSelectedClass}>
                      <SelectTrigger className="h-10 bg-white">
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
                )}

                {/* نوع التاريخ */}
                {reportType === 'class' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-500 font-medium">نوع التاريخ</label>
                    <div className="flex gap-1">
                      <Button
                        variant={dateMode === 'single' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 h-10"
                        onClick={() => setDateMode('single')}
                      >
                        يوم واحد
                      </Button>
                      <Button
                        variant={dateMode === 'range' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 h-10"
                        onClick={() => setDateMode('range')}
                      >
                        فترة
                      </Button>
                    </div>
                  </div>
                )}

                {/* التاريخ */}
                {reportType === 'class' && dateMode === 'single' ? (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-500 font-medium">التاريخ</label>
                    <input
                      type="date"
                      className="h-10 border rounded-md px-3 py-2 text-sm bg-white"
                      value={singleDate}
                      onChange={e => setSingleDate(e.target.value)}
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-gray-500 font-medium">من</label>
                      <input
                        type="date"
                        className="h-10 border rounded-md px-3 py-2 text-sm bg-white"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-gray-500 font-medium">إلى</label>
                      <input
                        type="date"
                        className="h-10 border rounded-md px-3 py-2 text-sm bg-white"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* زر التوليد */}
                <div className="flex flex-col gap-2 justify-end">
                  <label className="text-xs text-gray-500 font-medium opacity-0">توليد</label>
                  <Button
                    onClick={handleGenerate}
                    disabled={!canGenerate || isLoading}
                    className="h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    ) : (
                      <BarChart3 className="w-4 h-4 ml-2" />
                    )}
                    توليد التقرير
                  </Button>
                </div>
              </div>
            </div>

            {/* === نموذج الإدخال اليدوي === */}
            {reportType === 'manual' && (
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-6 no-print">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-amber-600" />
                    <span className="font-semibold text-lg text-amber-800">
                      {editingReportId ? 'تعديل بيانات تقرير (وضع التعديل)' : 'إدخال بيانات الحضور يدوياً'}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHistoryPanel(!showHistoryPanel)}
                    className="border-amber-400 text-amber-700 hover:bg-amber-100"
                  >
                    <FileText className="w-4 h-4 ml-1" />
                    {showHistoryPanel ? 'إخفاء السجل' : 'التقارير المحفوظة'} ({savedReports.length})
                  </Button>
                </div>

                {/* لوحة التقارير المحفوظة */}
                {showHistoryPanel && (
                  <div className="bg-white border border-amber-200 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg">التقارير المحفوظة</h3>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showAllYears}
                            onChange={(e) => setShowAllYears(e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          عرض كل السنوات
                        </label>
                        <Button variant="outline" size="sm" onClick={loadSavedReports}>
                          تحديث القائمة
                        </Button>
                      </div>
                    </div>
                    {savedReports.length === 0 ? (
                      <p className="text-gray-500 text-sm">لا توجد تقارير محفوظة لهذا العام الدراسي.</p>
                    ) : (
                      <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-amber-100">
                              <th className="p-2 text-right">التاريخ</th>
                              <th className="p-2 text-right">العنوان</th>
                              <th className="p-2 text-center">المقيد</th>
                              <th className="p-2 text-center">الحاضر</th>
                              <th className="p-2 text-center">الغياب%</th>
                              <th className="p-2 text-center">إجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {savedReports.map(report => (
                              <tr key={report.id} className="border-b hover:bg-amber-50">
                                <td className="p-2">{report.report_date}</td>
                                <td className="p-2">{report.report_title}</td>
                                <td className="p-2 text-center">{report.total_enrolled}</td>
                                <td className="p-2 text-center text-green-700">{report.total_present}</td>
                                <td className="p-2 text-center text-red-700">{report.absence_rate}%</td>
                                <td className="p-2 text-center">
                                  <Button size="sm" variant="ghost" onClick={() => handleEditReport(report.id)} className="text-amber-600 hover:bg-amber-50">
                                    تعديل
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleEditReport(report.id)} className="text-amber-600 hover:bg-amber-50">
                                    تعديل
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleLoadReport(report.id)} className="text-blue-600 hover:bg-blue-50">
                                    تحميل
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDeleteReport(report.id)} className="text-red-600 hover:bg-red-50">
                                    حذف
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* حقول التاريخ والعنوان */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 bg-white p-3 rounded-lg border">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-600 font-medium">تاريخ التقرير</label>
                    <input
                      type="date"
                      className="h-10 border rounded-md px-3 py-2 text-sm bg-white"
                      value={manualReportDate}
                      onChange={e => setManualReportDate(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-3">
                    <label className="text-xs text-gray-600 font-medium">عنوان التقرير (اختياري)</label>
                    <input
                      type="text"
                      className="h-10 border rounded-md px-3 py-2 text-sm bg-white"
                      value={manualReportTitle}
                      onChange={e => setManualReportTitle(e.target.value)}
                      placeholder="مثال: تقرير الحضور الأسبوعي"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
                  {/* المرحلة */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-600 font-medium">المرحلة</label>
                    <Select value={manualStage} onValueChange={(v) => { setManualStage(v); setManualClass(''); }}>
                      <SelectTrigger className="h-10 bg-white">
                        <SelectValue placeholder="اختر المرحلة" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueStages.map(s => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* الفصل */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-600 font-medium">الفصل</label>
                    <Select value={manualClass} onValueChange={setManualClass} disabled={!manualStage}>
                      <SelectTrigger className="h-10 bg-white">
                        <SelectValue placeholder="اختر الفصل" />
                      </SelectTrigger>
                      <SelectContent>
                        {stagesClasses
                          .filter(c => String(c.stage_id) === manualStage)
                          .map(c => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.class_name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* عدد المقيد */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-600 font-medium">عدد المقيد</label>
                    <input
                      type="number"
                      min="0"
                      className="h-10 border rounded-md px-3 py-2 text-sm bg-white"
                      value={manualEnrolled}
                      onChange={e => {
                        const val = e.target.value;
                        setManualEnrolled(val);
                        // Auto-calculate absent
                        const enrolled = parseInt(val) || 0;
                        const present = parseInt(manualPresent) || 0;
                        if (enrolled >= present) {
                          setManualAbsent((enrolled - present).toString());
                        }
                      }}
                      placeholder="0"
                    />
                  </div>

                  {/* عدد الحاضر */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-600 font-medium">عدد الحاضر</label>
                    <input
                      type="number"
                      min="0"
                      className="h-10 border rounded-md px-3 py-2 text-sm bg-white"
                      value={manualPresent}
                      onChange={e => {
                        const val = e.target.value;
                        setManualPresent(val);
                        // Auto-calculate absent
                        const present = parseInt(val) || 0;
                        const enrolled = parseInt(manualEnrolled) || 0;
                        if (enrolled >= present) {
                          setManualAbsent((enrolled - present).toString());
                        }
                      }}
                      placeholder="0"
                    />
                  </div>

                  {/* عدد الغائب */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-600 font-medium">عدد الغائب</label>
                    <input
                      type="number"
                      min="0"
                      className="h-10 border rounded-md px-3 py-2 text-sm bg-white"
                      value={manualAbsent}
                      onChange={e => setManualAbsent(e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  {/* زر الإضافة */}
                  <div className="flex flex-col gap-2 justify-end">
                    <label className="text-xs text-gray-600 font-medium opacity-0">إضافة</label>
                    <Button
                      onClick={() => {
                        if (!manualStage || !manualClass) return;
                        const enrolled = parseInt(manualEnrolled) || 0;
                        const present = parseInt(manualPresent) || 0;
                        const absent = parseInt(manualAbsent) || 0;
                        const attendanceRate = enrolled > 0 ? Math.round((present / enrolled) * 100) : 0;
                        const absenceRate = enrolled > 0 ? Math.round((absent / enrolled) * 100) : 0;
                        const stageData = uniqueStages.find(s => String(s.id) === manualStage);
                        const classData = stagesClasses.find(c => String(c.id) === manualClass);

                        setManualEntries([...manualEntries, {
                          stageId: manualStage,
                          stageName: stageData?.name || '',
                          classId: manualClass,
                          className: classData?.class_name || '',
                          enrolled,
                          present,
                          absent,
                          attendanceRate,
                          absenceRate
                        }]);

                        // Reset form
                        setManualClass('');
                        setManualEnrolled('');
                        setManualPresent('');
                        setManualAbsent('');
                      }}
                      disabled={!manualStage || !manualClass || !manualEnrolled}
                      className="h-10 bg-amber-600 hover:bg-amber-700"
                    >
                      إضافة الفصل
                    </Button>
                  </div>
                </div>

                {/* جدول المدخلات */}
                {manualEntries.length > 0 && (
                  <div className="border border-amber-200 rounded-lg overflow-hidden mt-4">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>م</th>
                          <th>المرحلة</th>
                          <th>الفصل</th>
                          <th>المقيد</th>
                          <th>الحاضر</th>
                          <th>الغائب</th>
                          <th>نسبة الحضور</th>
                          <th>نسبة الغياب</th>
                          <th>حذف</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedManualEntries.map((entry, idx) => (
                          <tr key={`${entry.classId}-${idx}`}>
                            <td>{idx + 1}</td>
                            <td>{entry.stageName}</td>
                            <td>{entry.className}</td>
                            <td>{entry.enrolled}</td>
                            <td className="text-green-700 font-medium">{entry.present}</td>
                            <td className="text-red-700 font-medium">{entry.absent}</td>
                            <td>{entry.attendanceRate}%</td>
                            <td>{entry.absenceRate}%</td>
                            <td>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                onClick={() => setManualEntries(manualEntries.filter((_, i) => i !== manualEntries.findIndex(e => e.classId === entry.classId && e.stageName === entry.stageName)))}
                              >
                                ✕
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* أزرار الطباعة والمسح */}
                {manualEntries.length > 0 && (
                  <div className="flex gap-3 mt-4">
                    <Button
                      onClick={() => ManualReportPrint({
                        entries: sortedManualEntries,
                        academicYear: selectedYear,
                        schoolName: 'مدرسة جاد الله'
                      })}
                      className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                    >
                      <Printer className="w-4 h-4 ml-2" />
                      طباعة التقرير اليدوي
                    </Button>
                    <Button
                      onClick={handleSaveManualReport}
                      disabled={isSaving}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 ml-2" />
                      )}
                      حفظ في قاعدة البيانات
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setManualEntries([])}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      مسح الكل
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* معلومات التقرير الحالي */}
            <div className="flex justify-between items-center mb-4 no-print">
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50">
                    {getReportTitle()}
                  </Badge>
                  <span className="text-gray-600">{getReportSubtitle()}</span>
                </div>
                <div className="text-gray-500">
                  الفترة: من {dateMode === 'single' ? singleDate : startDate} إلى {dateMode === 'single' ? singleDate : endDate}
                </div>
              </div>
            </div>

            {/* === تقرير الفصل === */}
            {reportType === 'class' && (
              <>
                {/* جدول الحضور اليومي */}
                {dailyRecords.length > 0 && (
                  <div className="mb-6 avoid-break">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-lg">السجل اليومي للحضور</span>
                    </div>
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <table className="report-table">
                        <thead>
                          <tr>
                            <th>التاريخ</th>
                            <th>اليوم</th>
                            <th>عدد المقيد</th>
                            <th>أيام الحضور</th>
                            <th>أيام الغياب</th>
                            <th>نسبة الحضور</th>
                            <th>نسبة الغياب</th>
                            <th>ملاحظات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyRecords.map((record, idx) => (
                            <tr key={idx}>
                              <td>{record.date}</td>
                              <td>{record.dayName}</td>
                              <td>{record.enrolled}</td>
                              <td className="text-green-700 font-medium">{record.present + record.late}</td>
                              <td className="text-red-700 font-medium">{record.absent}</td>
                              <td>
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                  {record.enrolled > 0 ? Math.round(((record.present + record.late) / record.enrolled) * 100) : 0}%
                                </Badge>
                              </td>
                              <td>
                                <Badge variant={record.absenceRate > 10 ? 'destructive' : 'secondary'}>
                                  {record.absenceRate}%
                                </Badge>
                              </td>
                              <td className="text-gray-500">-</td>
                            </tr>
                          ))}
                          {classSummary && (
                            <tr className="summary-row">
                              <td colSpan={2}>المتوسط / الإجمالي</td>
                              <td>-</td>
                              <td>{classSummary.avgPresent}</td>
                              <td>{classSummary.avgAbsent}</td>
                              <td>{classSummary.avgPresent && classSummary.totalDays ? Math.round((classSummary.avgPresent / (classSummary.avgPresent + classSummary.avgAbsent)) * 100) : 0}%</td>
                              <td>{classSummary.avgAbsenceRate}%</td>
                              <td>-</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* جدول تفاصيل الطلاب */}
                {studentRecords.length > 0 && (
                  <div className="mb-6 avoid-break">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-lg">تقرير تفصيلي للطلاب</span>
                    </div>
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <table className="report-table">
                        <thead>
                          <tr>
                            <th>م</th>
                            <th>اسم الطالب</th>
                            <th>أيام الحضور</th>
                            <th>أيام الغياب</th>
                            <th>نسبة الحضور</th>
                            <th>نسبة الغياب</th>
                            <th>ملاحظات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentRecords.map((student) => (
                            <tr key={student.studentId}>
                              <td>{student.index}</td>
                              <td className="text-right">{student.name}</td>
                              <td className="text-green-700 font-medium">{student.present + student.late}</td>
                              <td className="text-red-700 font-medium">{student.absent}</td>
                              <td>{student.attendanceRate}%</td>
                              <td>
                                <Badge variant={student.absenceRate > 20 ? 'destructive' : 'secondary'}>
                                  {student.absenceRate}%
                                </Badge>
                              </td>
                              <td className="text-gray-500">-</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* === تقرير المرحلة === */}
            {reportType === 'stage' && stageClasses.length > 0 && (
              <div className="mb-6 avoid-break">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-lg">
                    تقرير المرحلة: {stageInfo?.stageName || 'غير محدد'}
                  </span>
                </div>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>م</th>
                        <th>الفصل</th>
                        <th>عدد المقيد</th>
                        {dateMode === 'single' ? (
                          <>
                            <th>الحاضرين</th>
                            <th>الغائبين</th>
                          </>
                        ) : (
                          <>
                            <th>نسبة الحضور</th>
                            <th>نسبة الغياب</th>
                            <th>متوسط الحاضرين</th>
                            <th>متوسط الغائبين</th>
                          </>
                        )}
                        {dateMode === 'single' && (
                          <>
                            <th>نسبة الحضور</th>
                            <th>نسبة الغياب</th>
                          </>
                        )}
                        <th>ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stageClasses.map((c) => (
                        <tr key={c.classId}>
                          <td>{c.index}</td>
                          <td className="text-right font-medium">{c.className}</td>
                          <td>{c.enrolled}</td>

                          {dateMode === 'single' ? (
                            <>
                              <td className="text-green-700 font-medium">{c.present + c.late}</td>
                              <td className="text-red-700 font-medium">{c.absent}</td>
                              <td className="font-medium">{c.attendanceRate}%</td>
                              <td>
                                <Badge variant={c.absenceRate > 10 ? 'destructive' : 'secondary'}>
                                  {c.absenceRate}%
                                </Badge>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="font-medium text-green-800">{c.attendanceRate}%</td>
                              <td>
                                <Badge variant={c.absenceRate > 10 ? 'destructive' : 'secondary'}>
                                  {c.absenceRate}%
                                </Badge>
                              </td>
                              <td>{c.avgPresent}</td>
                              <td>{c.avgAbsent}</td>
                            </>
                          )}

                          <td className="text-gray-500">-</td>
                        </tr>
                      ))}
                      {stageSummary && (
                        <tr className="summary-row">
                          <td colSpan={2}>الإجمالي / المتوسط</td>
                          <td>{stageSummary.totalEnrolled}</td>

                          {dateMode === 'single' ? (
                            <>
                              <td>{stageSummary.totalPresent + (stageSummary.totalLate || 0)}</td>
                              <td>{stageSummary.totalAbsent}</td>
                              <td>
                                {stageSummary.totalEnrolled > 0 && stageSummary.totalClasses > 0 ?
                                  Math.round(((stageSummary.totalPresent + stageSummary.totalLate) / (stageSummary.totalPresent + stageSummary.totalLate + stageSummary.totalAbsent)) * 100)
                                  : 0}%
                              </td>
                              <td>{stageSummary.avgAbsenceRate}%</td>
                            </>
                          ) : (
                            <>
                              <td>{stageSummary.avgAttendanceRate}%</td>
                              <td>{stageSummary.avgAbsenceRate}%</td>
                              <td>{stageSummary.avgPresent}</td>
                              <td>{stageSummary.avgAbsent}</td>
                            </>
                          )}
                          <td>-</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* === تقرير المدرسة === */}
            {reportType === 'school' && schoolStages.length > 0 && (
              <div className="mb-6 avoid-break">
                <div className="flex items-center gap-2 mb-3">
                  <School className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-lg">تقرير المدرسة الكامل</span>
                </div>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>م</th>
                        <th>المرحلة الدراسية</th>
                        <th>عدد المقيد</th>
                        <th>إجمالي الحاضر</th>
                        <th>إجمالي الغائب</th>
                        <th>نسبة الحضور</th>
                        <th>نسبة الغياب</th>
                        <th>ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {levelReports.map((level) => (
                        <React.Fragment key={level.id}>
                          {/* رأس المرحلة الرئيسية */}
                          <tr className="bg-slate-100">
                            <td colSpan={dateMode === 'single' ? 8 : 8} className="text-right font-bold py-3 px-4 text-purple-800">
                              {level.name}
                            </td>
                          </tr>

                          {/* صفوف المراحل الدراسية (الصفوف) داخل المرحلة الرئيسية */}
                          {level.stages
                            .filter(stage => stage.summary && stage.summary.totalEnrolled > 0)
                            .map((stage, idx) => (
                              <tr key={stage.stageId}>
                                <td>{idx + 1}</td>
                                <td className="text-right font-medium pr-8">{stage.stageName}</td>
                                <td>{stage.summary?.totalEnrolled || 0}</td>

                                <td className="text-green-700 font-medium">
                                  {dateMode === 'single'
                                    ? (stage.summary?.totalPresent || 0) + (stage.summary?.totalLate || 0)
                                    : stage.summary?.avgPresent || 0}
                                </td>
                                <td className="text-red-700 font-medium">
                                  {dateMode === 'single'
                                    ? stage.summary?.totalAbsent || 0
                                    : stage.summary?.avgAbsent || 0}
                                </td>

                                <td>
                                  {dateMode === 'single' ? (
                                    stage.summary && stage.summary.totalEnrolled > 0 ?
                                      Math.round(((stage.summary.totalPresent + stage.summary.totalLate) / stage.summary.totalEnrolled) * 100)
                                      : 0
                                  ) : (
                                    stage.summary?.avgAttendanceRate || 0
                                  )}%
                                </td>

                                <td>
                                  <Badge variant={(stage.summary?.avgAbsenceRate || 0) > 15 ? 'destructive' : 'secondary'}>
                                    {stage.summary?.avgAbsenceRate || 0}%
                                  </Badge>
                                </td>

                                <td className="text-gray-500">-</td>
                              </tr>
                            ))}

                          {/* ملخص المرحلة الرئيسية */}
                          <tr className="stage-summary-row border-t-2 border-purple-200">
                            <td colSpan={2} className="text-right font-bold text-purple-900">
                              إجمالي {level.name}
                            </td>
                            <td className="font-bold">{level.summary.totalEnrolled}</td>

                            <td className="font-bold text-green-700">
                              {dateMode === 'single'
                                ? level.summary.totalPresent + level.summary.totalLate
                                : level.summary.avgPresent}
                            </td>
                            <td className="font-bold text-red-700">
                              {dateMode === 'single'
                                ? level.summary.totalAbsent
                                : level.summary.avgAbsent}
                            </td>

                            <td className="font-bold">
                              {level.summary.avgAttendanceRate}%
                            </td>
                            <td>
                              <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent ${level.summary.avgAbsenceRate > 15 ? 'bg-destructive text-destructive-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                                {level.summary.avgAbsenceRate}%
                              </div>
                            </td>
                            <td className="text-gray-500">-</td>
                          </tr>
                        </React.Fragment>
                      ))}
                      {schoolSummary && (
                        <tr className="school-total-row">
                          <td colSpan={2} className="font-bold">إجمالي المدرسة</td>
                          <td className="font-bold">{schoolSummary.totalEnrolled}</td>

                          <td className="font-bold text-green-700">
                            {dateMode === 'single'
                              ? schoolSummary.totalPresent + schoolSummary.totalLate
                              : schoolSummary.avgPresent
                            }
                          </td>
                          <td className="font-bold text-red-700">
                            {dateMode === 'single'
                              ? schoolSummary.totalAbsent
                              : schoolSummary.avgAbsent
                            }
                          </td>
                          <td className="font-bold">
                            {schoolSummary.avgAttendanceRate}%
                          </td>
                          <td>
                            <Badge variant="outline" className="bg-green-100 text-green-800 font-bold">
                              {schoolSummary.avgAbsenceRate}%
                            </Badge>
                          </td>

                          <td className="text-gray-500">-</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* الملخص */}
            {((reportType === 'class' && classSummary) ||
              (reportType === 'stage' && stageSummary) ||
              (reportType === 'school' && schoolSummary)) && (
                <div className="mb-6 print-summary avoid-break">
                  <div className="flex items-center gap-2 mb-3 no-print">
                    <TrendingDown className="w-5 h-5 text-amber-600" />
                    <span className="font-semibold text-lg">ملخص التقرير</span>
                  </div>
                  <div className="border border-gray-300 rounded-lg overflow-hidden print-summary-grid">
                    <div className="grid grid-cols-2 md:grid-cols-8 text-center">
                      <div className="bg-gray-100 p-3 border-b md:border-b-0 border-l border-gray-300 font-bold print-summary-cell print-summary-label">
                        {reportType === 'school' ? 'عدد المراحل الفعلية' : reportType === 'stage' ? 'عدد الفصول' : 'إجمالي الطلاب'}
                      </div>
                      <div className="p-3 border-b md:border-b-0 border-gray-300 bg-white print-summary-cell">
                        {reportType === 'school' ? schoolStages.filter(s => s.summary && s.summary.totalEnrolled > 0).length :
                          reportType === 'stage' ? stageSummary?.totalClasses :
                            studentRecords.length}
                      </div>
                      <div className="bg-gray-100 p-3 border-b md:border-b-0 border-l border-gray-300 font-bold print-summary-cell print-summary-label">
                        {reportType === 'class' ? 'أيام الدراسة' : 'إجمالي المقيد'}
                      </div>
                      <div className="p-3 border-b md:border-b-0 border-gray-300 bg-white print-summary-cell">
                        {reportType === 'class' ? classSummary?.totalDays :
                          reportType === 'stage' ? stageSummary?.totalEnrolled :
                            schoolSummary?.totalEnrolled}
                      </div>
                      <div className="bg-gray-100 p-3 border-l border-gray-300 font-bold print-summary-cell print-summary-label">
                        إجمالي الحاضر
                      </div>
                      <div className="p-3 border-gray-300 bg-white text-green-700 font-medium print-summary-cell">
                        {reportType === 'class' ? (classSummary?.avgPresent || 0) * (classSummary?.totalDays || 0) :
                          reportType === 'stage' ? stageSummary?.totalPresent :
                            schoolSummary?.totalPresent}
                      </div>
                      <div className="bg-gray-100 p-3 border-l border-gray-300 font-bold print-summary-cell print-summary-label">
                        إجمالي الغياب
                      </div>
                      <div className="p-3 bg-white text-red-700 font-medium print-summary-cell">
                        {reportType === 'class' ? (classSummary?.avgAbsent || 0) * (classSummary?.totalDays || 0) :
                          reportType === 'stage' ? stageSummary?.totalAbsent :
                            schoolSummary?.totalAbsent}
                      </div>
                      <div className="bg-gray-100 p-3 border-l border-gray-300 font-bold print-summary-cell print-summary-label">
                        نسبة الحضور
                      </div>
                      <div className="p-3 bg-white print-summary-cell">
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {reportType === 'class' ? classSummary?.avgAttendanceRate :
                            reportType === 'stage' ? stageSummary?.avgAttendanceRate :
                              schoolSummary?.avgAttendanceRate}%
                        </Badge>
                      </div>
                      <div className="bg-gray-100 p-3 border-l border-gray-300 font-bold print-summary-cell print-summary-label">
                        نسبة الغياب
                      </div>
                      <div className="p-3 bg-white print-summary-cell">
                        <Badge variant="outline" className="bg-red-50 text-red-700">
                          {reportType === 'class' ? classSummary?.avgAbsenceRate :
                            reportType === 'stage' ? stageSummary?.avgAbsenceRate :
                              schoolSummary?.avgAbsenceRate}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {/* ملاحظات المشرف */}
            <div className="border rounded-lg p-4 mb-6 no-print">
              <div className="font-semibold mb-2">ملاحظات المشرف</div>
              <textarea
                className="w-full border rounded-md px-3 py-2 text-sm"
                rows={3}
                value={supervisorNotes}
                onChange={e => setSupervisorNotes(e.target.value)}
                placeholder="أضف ملاحظاتك هنا..."
              />
            </div>

            {/* التوقيعات */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print-signatures avoid-break">
              <div className="border rounded-lg p-4 text-center">
                <div className="font-medium mb-8">مشرف الغياب</div>
                <div className="border-t pt-2">________________</div>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="font-medium mb-8">وكيل المدرسة</div>
                <div className="border-t pt-2">________________</div>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="font-medium mb-8">مدير المدرسة</div>
                <div className="border-t pt-2">________________</div>
              </div>
            </div>
          </CardContent>
        </Card >
      </div >

      {/* مكون الطباعة الاحترافية */}
      {
        showPrintDialog && (
          <AttendanceReportPrint
            data={{
              reportType: reportType as 'class' | 'stage' | 'school',
              dateRange: {
                startDate: dateMode === 'single' ? singleDate : startDate,
                endDate: dateMode === 'single' ? singleDate : endDate,
              },
              classInfo,
              dailyRecords,
              studentRecords,
              classSummary,
              stageInfo,
              stageClasses,
              stageSummary,
              schoolStages,
              schoolSummary,
              levelReports,
              selectedYear,
              supervisorNotes,
            }}
            onClose={() => setShowPrintDialog(false)}
          />
        )
      }
    </DashboardLayout >
  );
};

export default ReportsPage;
