import { supabase } from '@/lib/supabase';

/**
 * خدمة التحليلات والإحصائيات المتقدمة
 */
export class AnalyticsService {
  // إحصائيات الأداء الأكاديمي
  static async getAcademicStats(stage?: string) {
    try {
      let query = supabase.from('academic_records').select('current_gpa, passing_status, student_id');

      if (stage) {
        query = query.in('student_id', []);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        averageGPA: data?.reduce((sum, r) => sum + (r.current_gpa || 0), 0) / (data?.length || 1) || 0,
        passingCount: data?.filter((r) => r.passing_status === 'ناجح').length || 0,
        failingCount: data?.filter((r) => r.passing_status === 'راسب').length || 0,
        totalRecords: data?.length || 0,
      };

      return stats;
    } catch (err) {
      console.error('خطأ في جلب إحصائيات الأداء:', err);
      throw err;
    }
  }

  // إحصائيات الحضور
  static async getAttendanceStats(studentId?: string) {
    try {
      let query = supabase.from('attendance_records').select('status, student_id, date');

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        present: data?.filter((r) => r.status === 'حاضر').length || 0,
        absent: data?.filter((r) => r.status === 'غائب').length || 0,
        late: data?.filter((r) => r.status === 'متأخر').length || 0,
        excused: data?.filter((r) => r.status === 'معذور').length || 0,
        total: data?.length || 0,
        attendanceRate: data
          ? ((data?.filter((r) => r.status === 'حاضر').length || 0) / data.length) * 100
          : 0,
      };

      return stats;
    } catch (err) {
      console.error('خطأ في جلب إحصائيات الحضور:', err);
      throw err;
    }
  }

  static async getAttendanceStatsByRange(startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('status, student_id, date')
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      const present = data?.filter((r) => r.status === 'حاضر').length || 0;
      const absent = data?.filter((r) => r.status === 'غائب').length || 0;
      const late = data?.filter((r) => r.status === 'متأخر').length || 0;
      const excused = data?.filter((r) => r.status === 'معذور').length || 0;
      const total = data?.length || 0;
      const attendanceRate = total ? (present / total) * 100 : 0;

      return { present, absent, late, excused, total, attendanceRate, records: data || [] };
    } catch (err) {
      console.error('خطأ في جلب إحصائيات الحضور حسب المدة:', err);
      throw err;
    }
  }

  static async getAttendanceDetailsByRange(startDate: string, endDate: string) {
    try {
      const query = supabase
        .from('attendance_records')
        .select('student_id, date, status')
        .gte('date', startDate)
        .lte('date', endDate);

      const { data, error } = await query;

      if (error) throw error;

      const byStudent: Record<string, { present: number; absent: number; late: number; excused: number; total: number }> = {};
      ((data || []) as { student_id: string; status: string }[]).forEach((r) => {
        const key = r.student_id as string;
        if (!byStudent[key]) {
          byStudent[key] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
        }
        byStudent[key].total += 1;
        if (r.status === 'حاضر') byStudent[key].present += 1;
        else if (r.status === 'غائب') byStudent[key].absent += 1;
        else if (r.status === 'متأخر') byStudent[key].late += 1;
        else if (r.status === 'معذور') byStudent[key].excused += 1;
      });

      const rows = Object.entries(byStudent).map(([studentId, s]) => ({
        student_id: studentId,
        present: s.present,
        absent: s.absent,
        late: s.late,
        excused: s.excused,
        total: s.total,
        attendance_rate: s.total ? Math.round((s.present / s.total) * 100) : 0,
      }));

      return rows;
    } catch (err) {
      console.error('خطأ في جلب تفاصيل الحضور حسب المدة:', err);
      throw err;
    }
  }

  static async getAttendanceDetailsByRangeForStudents(
    startDate: string,
    endDate: string,
    studentIds: string[]
  ) {
    try {
      const query = supabase
        .from('attendance_records')
        .select('student_id, date, status')
        .gte('date', startDate)
        .lte('date', endDate)
        .in('student_id', studentIds);

      const { data, error } = await query;
      if (error) throw error;

      const byStudent: Record<string, { present: number; absent: number; late: number; excused: number; total: number }> = {};
      ((data || []) as { student_id: string; status: string }[]).forEach((r) => {
        const key = r.student_id as string;
        if (!byStudent[key]) {
          byStudent[key] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
        }
        byStudent[key].total += 1;
        if (r.status === 'حاضر') byStudent[key].present += 1;
        else if (r.status === 'غائب') byStudent[key].absent += 1;
        else if (r.status === 'متأخر') byStudent[key].late += 1;
        else if (r.status === 'معذور') byStudent[key].excused += 1;
      });

      const rows = Object.entries(byStudent).map(([studentId, s]) => ({
        student_id: studentId,
        present: s.present,
        absent: s.absent,
        late: s.late,
        excused: s.excused,
        total: s.total,
        attendance_rate: s.total ? Math.round((s.present / s.total) * 100) : 0,
      }));

      return rows;
    } catch (err) {
      console.error('خطأ في جلب تفاصيل الحضور حسب المدة لطلاب محددين:', err);
      throw err;
    }
  }

  static async getAttendanceDailyAggregatesByRange(
    startDate: string,
    endDate: string,
    studentIds?: string[]
  ) {
    try {
      let query = supabase
        .from('attendance_records')
        .select('date, status, student_id')
        .gte('date', startDate)
        .lte('date', endDate);

      if (studentIds && studentIds.length > 0) {
        query = query.in('student_id', studentIds);
      }

      const { data, error } = await query;
      if (error) throw error;

      const byDate: Record<string, { present: number; absent: number; late: number; excused: number; total: number }> = {};
      ((data || []) as { date: string; status: string }[]).forEach((r) => {
        const d = r.date as string;
        if (!byDate[d]) {
          byDate[d] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
        }
        byDate[d].total += 1;
        if (r.status === 'حاضر') byDate[d].present += 1;
        else if (r.status === 'غائب') byDate[d].absent += 1;
        else if (r.status === 'متأخر') byDate[d].late += 1;
        else if (r.status === 'معذور') byDate[d].excused += 1;
      });

      const rows = Object.entries(byDate)
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([date, s]) => ({
          date,
          present: s.present,
          absent: s.absent,
          total: s.total,
          attendance_rate: s.total ? Math.round((s.present / s.total) * 100) : 0,
        }));

      return rows;
    } catch (err) {
      console.error('خطأ في جلب تجميع الحضور اليومي للفترة:', err);
      throw err;
    }
  }

  // إحصائيات مالية
  static async getFinancialStats() {
    try {
      const { data: fees, error: feesError } = await supabase
        .from('school_fees')
        .select('total_amount, student_id');

      if (feesError) throw feesError;

      const { data: transactions, error: transError } = await supabase
        .from('financial_transactions')
        .select('amount, student_id');

      if (transError) throw transError;

      const totalDue = fees?.reduce((sum, f) => sum + (f.total_amount || 0), 0) || 0;
      const totalPaid = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      return {
        totalDue,
        totalPaid,
        remaining: totalDue - totalPaid,
        paymentRate: totalDue > 0 ? (totalPaid / totalDue) * 100 : 0,
        studentsWithDue: new Set(fees?.map((f) => f.student_id)).size || 0,
      };
    } catch (err) {
      console.error('خطأ في جلب الإحصائيات المالية:', err);
      throw err;
    }
  }

  // إحصائيات سلوكية
  static async getBehavioralStats() {
    try {
      const { data, error } = await supabase
        .from('behavioral_records')
        .select('conduct_rating, disciplinary_issues');

      if (error) throw error;

      const stats = {
        excellent: data?.filter((s) => s.conduct_rating === 'ممتاز').length || 0,
        good: data?.filter((s) => s.conduct_rating === 'جيد').length || 0,
        fair: data?.filter((s) => s.conduct_rating === 'مقبول').length || 0,
        poor: data?.filter((s) => s.conduct_rating === 'ضعيف').length || 0,
        withIssues: data?.filter((s) => s.disciplinary_issues === true).length || 0,
        total: data?.length || 0,
      };

      return stats;
    } catch (err) {
      console.error('خطأ في جلب الإحصائيات السلوكية:', err);
      throw err;
    }
  }

  // التوزيع حسب المراحل
  static async getDistributionByStage() {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('stage');

      if (error) throw error;

      const distribution = {} as Record<string, number>;
      data?.forEach((student) => {
        if (student.stage) {
          distribution[student.stage] = (distribution[student.stage] || 0) + 1;
        }
      });

      return Object.entries(distribution).map(([stage, count]) => ({
        name: stage,
        value: count,
      }));
    } catch (err) {
      console.error('خطأ في جلب التوزيع:', err);
      throw err;
    }
  }

  // الاتجاهات الشهرية
  static async getMonthlyTrends() {
    try {
      const { data, error } = await supabase
        .from('student_audit_trail')
        .select('created_at');

      if (error) throw error;

      const monthlyData = {} as Record<string, number>;

      data?.forEach((entry) => {
        const date = new Date(entry.created_at);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[month] = (monthlyData[month] || 0) + 1;
      });

      return Object.entries(monthlyData)
        .sort()
        .map(([month, count]) => ({
          name: month,
          value: count,
        }));
    } catch (err) {
      console.error('خطأ في جلب الاتجاهات:', err);
      throw err;
    }
  }

  // تقرير شامل
  static async getComprehensiveReport() {
    try {
      const [academic, attendance, financial, behavioral] = await Promise.all([
        this.getAcademicStats(),
        this.getAttendanceStats(),
        this.getFinancialStats(),
        this.getBehavioralStats(),
      ]);

      return {
        academic,
        attendance,
        financial,
        behavioral,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      console.error('خطأ في جلب التقرير الشامل:', err);
      throw err;
    }
  }

  // أعلى الطلاب أداءً
  static async getTopPerformers(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('academic_records')
        .select('student_id, current_gpa')
        .order('current_gpa', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('خطأ في جلب أعلى الأداء:', err);
      throw err;
    }
  }

  // الطلاب بحاجة للدعم
  static async getStudentsNeedingSupport() {
    try {
      const { data: academic, error: academicError } = await supabase
        .from('academic_records')
        .select('student_id')
        .lt('current_gpa', 2.0);

      if (academicError) throw academicError;

      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('student_id')
        .eq('status', 'غائب')
        .limit(100);

      if (attendanceError) throw attendanceError;

      const studentsIds = new Set([
        ...(academic?.map((s) => s.student_id) || []),
        ...(attendance?.map((s) => s.student_id) || []),
      ]);

      return Array.from(studentsIds);
    } catch (err) {
      console.error('خطأ في جلب الطلاب بحاجة للدعم:', err);
      throw err;
    }
  }

  // =========================================
  // تقارير الحضور والغياب المتقدمة
  // =========================================

  /**
   * تقرير الفصل اليومي التفصيلي
   * يُظهر حضور كل يوم لفصل محدد مع التفاصيل الكاملة
   */
  static async getDailyClassAttendanceReport(
    classId: string,
    startDate: string,
    endDate: string
  ) {
    try {
      // جلب الطلاب في الفصل (بدون فلتر حالة التسجيل لتشمل جميع الحالات)
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('student_id, full_name_ar, class_id')
        .eq('class_id', classId)
        .not('class_id', 'is', null);

      if (studentsError) throw studentsError;

      const studentIds = (students || []).map(s => s.student_id);
      const totalEnrolled = studentIds.length;

      if (totalEnrolled === 0) {
        return { dailyRecords: [], totalEnrolled: 0, summary: null };
      }

      // جلب سجلات الحضور
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('student_id, date, status')
        .in('student_id', studentIds)
        .gte('date', startDate)
        .lte('date', endDate);

      if (attendanceError) throw attendanceError;

      // تجميع حسب اليوم
      const byDate: Record<string, { present: number; absent: number; late: number; excused: number }> = {};

      (attendance || []).forEach((r: any) => {
        if (!byDate[r.date]) {
          byDate[r.date] = { present: 0, absent: 0, late: 0, excused: 0 };
        }
        if (r.status === 'حاضر') byDate[r.date].present += 1;
        else if (r.status === 'غائب') byDate[r.date].absent += 1;
        else if (r.status === 'متأخر') byDate[r.date].late += 1;
        else if (r.status === 'معذور') byDate[r.date].excused += 1;
      });

      // إنشاء السجلات اليومية
      const dailyRecords = Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, stats]) => {
          const dayName = new Date(date).toLocaleDateString('ar-EG', { weekday: 'long' });
          const totalPresent = stats.present + stats.late; // المتأخر يُعتبر حاضراً
          const totalAbsent = stats.absent;
          const absenceRate = totalEnrolled > 0 ? Math.round((totalAbsent / totalEnrolled) * 100 * 100) / 100 : 0;

          return {
            date,
            dayName,
            enrolled: totalEnrolled,
            present: totalPresent,
            absent: totalAbsent,
            late: stats.late,
            excused: stats.excused,
            absenceRate
          };
        });

      // حساب الملخص
      const totalDays = dailyRecords.length;
      const totalPresent = dailyRecords.reduce((sum, d) => sum + d.present, 0);
      const totalAbsent = dailyRecords.reduce((sum, d) => sum + d.absent, 0);
      const avgAbsenceRate = totalDays > 0
        ? Math.round((totalAbsent / (totalEnrolled * totalDays)) * 100 * 100) / 100
        : 0;

      return {
        dailyRecords,
        totalEnrolled,
        summary: {
          totalDays,
          avgPresent: totalDays > 0 ? Math.round(totalPresent / totalDays) : 0,
          avgAbsent: totalDays > 0 ? Math.round(totalAbsent / totalDays) : 0,
          avgAbsenceRate
        }
      };
    } catch (err) {
      console.error('خطأ في جلب تقرير الفصل اليومي:', err);
      throw err;
    }
  }

  /**
   * تقرير الفصل الشامل مع تفاصيل الطلاب
   */
  static async getClassAttendanceReport(
    classId: string,
    startDate: string,
    endDate: string
  ) {
    try {
      // جلب الطلاب مع بيانات الفصل والمرحلة
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select(`
                    student_id,
                    full_name_ar,
                    class_id,
                    classes!inner (
                        id,
                        name,
                        stage_id,
                        stages (
                            id,
                            name
                        )
                    )
                `)
        .eq('class_id', classId)
        .not('class_id', 'is', null)
        .order('full_name_ar');

      if (studentsError) throw studentsError;

      const studentIds = (students || []).map((s: any) => s.student_id);

      if (studentIds.length === 0) {
        return { students: [], classInfo: null, summary: null };
      }

      // جلب سجلات الحضور
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('student_id, date, status')
        .in('student_id', studentIds)
        .gte('date', startDate)
        .lte('date', endDate);

      if (attendanceError) throw attendanceError;

      // تجميع الحضور حسب الطالب
      const byStudent: Record<string, { present: number; absent: number; late: number; excused: number; total: number }> = {};

      (attendance || []).forEach((r: any) => {
        if (!byStudent[r.student_id]) {
          byStudent[r.student_id] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
        }
        byStudent[r.student_id].total += 1;
        if (r.status === 'حاضر') byStudent[r.student_id].present += 1;
        else if (r.status === 'غائب') byStudent[r.student_id].absent += 1;
        else if (r.status === 'متأخر') byStudent[r.student_id].late += 1;
        else if (r.status === 'معذور') byStudent[r.student_id].excused += 1;
      });

      // إعداد بيانات الطلاب
      const studentRecords = (students || []).map((s: any, idx: number) => {
        const stats = byStudent[s.student_id] || { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
        const attendanceRate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100 * 100) / 100 : 0;
        const absenceRate = stats.total > 0 ? Math.round((stats.absent / stats.total) * 100 * 100) / 100 : 0;

        return {
          index: idx + 1,
          studentId: s.student_id,
          name: s.full_name_ar,
          present: stats.present,
          absent: stats.absent,
          late: stats.late,
          excused: stats.excused,
          totalDays: stats.total,
          attendanceRate,
          absenceRate
        };
      });

      // معلومات الفصل
      const firstStudent = students?.[0] as any;
      const classInfo = firstStudent ? {
        classId: classId,
        className: Array.isArray(firstStudent.classes) ? firstStudent.classes[0]?.name : firstStudent.classes?.name,
        stageName: Array.isArray(firstStudent.classes)
          ? (Array.isArray(firstStudent.classes[0]?.stages) ? firstStudent.classes[0]?.stages[0]?.name : firstStudent.classes[0]?.stages?.name)
          : (Array.isArray(firstStudent.classes?.stages) ? firstStudent.classes?.stages[0]?.name : firstStudent.classes?.stages?.name),
        stageId: Array.isArray(firstStudent.classes)
          ? firstStudent.classes[0]?.stage_id
          : firstStudent.classes?.stage_id
      } : null;

      // الملخص
      const totalEnrolled = studentRecords.length;
      const totalPresent = studentRecords.reduce((sum, s) => sum + s.present, 0);
      const totalAbsent = studentRecords.reduce((sum, s) => sum + s.absent, 0);
      const totalDays = studentRecords[0]?.totalDays || 0;

      return {
        students: studentRecords,
        classInfo,
        summary: {
          totalEnrolled,
          totalDays,
          totalPresent,
          totalAbsent,
          avgAttendanceRate: totalEnrolled > 0
            ? Math.round((studentRecords.reduce((sum, s) => sum + s.attendanceRate, 0) / totalEnrolled) * 100) / 100
            : 0,
          avgAbsenceRate: totalEnrolled > 0
            ? Math.round((studentRecords.reduce((sum, s) => sum + s.absenceRate, 0) / totalEnrolled) * 100) / 100
            : 0
        }
      };
    } catch (err) {
      console.error('خطأ في جلب تقرير الفصل:', err);
      throw err;
    }
  }

  /**
   * تقرير المرحلة الكامل - يجمع جميع الفصول في مرحلة واحدة
   */
  static async getStageAttendanceReport(
    stageId: string,
    startDate: string,
    endDate: string
  ) {
    try {
      // جلب جميع الفصول في المرحلة
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id, name, stage_id, stages(id, name)')
        .eq('stage_id', stageId);

      if (classesError) throw classesError;

      if (!classes || classes.length === 0) {
        return { classes: [], stageInfo: null, summary: null };
      }

      const classIds = classes.map(c => c.id);

      // جلب جميع الطلاب في هذه الفصول
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('student_id, full_name_ar, class_id')
        .in('class_id', classIds)
        .not('class_id', 'is', null);

      if (studentsError) throw studentsError;

      const studentIds = (students || []).map(s => s.student_id);

      if (studentIds.length === 0) {
        const stageInfo = classes[0]?.stages;
        return {
          classes: [],
          stageInfo: {
            stageId,
            stageName: Array.isArray(stageInfo) ? stageInfo[0]?.name : (stageInfo as any)?.name || 'غير محدد'
          },
          summary: null
        };
      }

      // جلب سجلات الحضور
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('student_id, date, status')
        .in('student_id', studentIds)
        .gte('date', startDate)
        .lte('date', endDate);

      if (attendanceError) throw attendanceError;

      // تجميع حسب الفصل وتتبع الأيام النشطة
      const studentToClass: Record<string, string> = {};
      (students || []).forEach(s => {
        studentToClass[s.student_id] = s.class_id;
      });

      const byClass: Record<string, {
        enrolled: number;
        present: number;
        absent: number;
        late: number;
        excused: number;
        totalRecords: number;
        dates: Set<string>;
      }> = {};

      // تهيئة الفصول
      classes.forEach(c => {
        byClass[c.id] = {
          enrolled: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          totalRecords: 0,
          dates: new Set()
        };
      });

      // حساب عدد الطلاب المسجلين في كل فصل
      (students || []).forEach(s => {
        if (byClass[s.class_id]) {
          byClass[s.class_id].enrolled += 1;
        }
      });

      // تجميع الحضور
      (attendance || []).forEach((r: any) => {
        const classId = studentToClass[r.student_id];
        if (classId && byClass[classId]) {
          byClass[classId].totalRecords += 1;
          byClass[classId].dates.add(r.date);

          if (r.status === 'حاضر') byClass[classId].present += 1;
          else if (r.status === 'غائب') byClass[classId].absent += 1;
          else if (r.status === 'متأخر') byClass[classId].late += 1;
          else if (r.status === 'معذور') byClass[classId].excused += 1;
        }
      });

      // إعداد بيانات الفصول
      const classRecords = classes.map((c, idx) => {
        const stats = byClass[c.id];
        const activeDays = stats.dates.size || 1; // تجنب القسمة على صفر

        // حساب المتوسطات اليومية
        // ملاحظة: المتأخر يحسب كحاضر في النسبة
        const totalPresentWithLate = stats.present + stats.late;
        const avgPresent = Math.round(totalPresentWithLate / activeDays);
        const avgAbsent = Math.round(stats.absent / activeDays);

        // حساب النسب بناءً على المتوسط اليومي وعدد المقيدين
        const attendanceRate = stats.enrolled > 0
          ? Math.round((avgPresent / stats.enrolled) * 100 * 100) / 100
          : 0;

        const absenceRate = stats.enrolled > 0
          ? Math.round((avgAbsent / stats.enrolled) * 100 * 100) / 100
          : 0;

        return {
          index: idx + 1,
          classId: c.id,
          className: c.name,
          enrolled: stats.enrolled,
          present: stats.present, // الإجمالي التراكمي (للمعلومات الداخلية)
          absent: stats.absent,   // الإجمالي التراكمي
          late: stats.late,
          excused: stats.excused,
          activeDays,
          avgPresent,
          avgAbsent,
          absenceRate,
          attendanceRate
        };
      });

      // معلومات المرحلة
      const stageInfo = classes[0]?.stages;
      const stageData = {
        stageId,
        stageName: Array.isArray(stageInfo) ? stageInfo[0]?.name : (stageInfo as any)?.name || 'غير محدد'
      };

      // الملخص الإجمالي للمرحلة (متوسطات)
      const totalEnrolled = classRecords.reduce((sum, c) => sum + c.enrolled, 0);

      // متوسطات المرحلة ككل = مجموع متوسطات الفصول
      const avgPresentTotal = classRecords.reduce((sum, c) => sum + c.avgPresent, 0);
      const avgAbsentTotal = classRecords.reduce((sum, c) => sum + c.avgAbsent, 0);

      const stageAttendanceRate = totalEnrolled > 0
        ? Math.round((avgPresentTotal / totalEnrolled) * 100 * 100) / 100
        : 0;

      const stageAbsenceRate = totalEnrolled > 0
        ? Math.round((avgAbsentTotal / totalEnrolled) * 100 * 100) / 100
        : 0;

      return {
        classes: classRecords,
        stageInfo: stageData,
        summary: {
          totalClasses: classRecords.length,
          totalEnrolled,
          avgPresent: avgPresentTotal,
          avgAbsent: avgAbsentTotal,
          avgAttendanceRate: stageAttendanceRate,
          avgAbsenceRate: stageAbsenceRate,
          // الاحتفاظ بالقيم القديمة للتوافق إذا لزم الأمر
          totalPresent: classRecords.reduce((sum, c) => sum + c.present, 0),
          totalAbsent: classRecords.reduce((sum, c) => sum + c.absent, 0),
          totalLate: classRecords.reduce((sum, c) => sum + c.late, 0),
          totalExcused: classRecords.reduce((sum, c) => sum + c.excused, 0)
        }
      };
    } catch (err) {
      console.error('خطأ في جلب تقرير المرحلة:', err);
      throw err;
    }
  }

  /**
   * تقرير المدرسة الكامل - يجمع جميع المراحل والفصول
   */
  static async getSchoolAttendanceReport(startDate: string, endDate: string) {
    try {
      // جلب جميع المراحل
      const { data: stages, error: stagesError } = await supabase
        .from('stages')
        .select('id, name')
        .order('name');

      if (stagesError) throw stagesError;

      if (!stages || stages.length === 0) {
        return { stages: [], summary: null };
      }

      // جلب تقرير كل مرحلة
      const stageReports = await Promise.all(
        stages.map(async (stage) => {
          const report = await this.getStageAttendanceReport(stage.id, startDate, endDate);
          return {
            stageId: stage.id,
            stageName: stage.name,
            classes: report.classes,
            summary: report.summary
          };
        })
      );

      // الملخص الإجمالي للمدرسة
      const totalEnrolled = stageReports.reduce((sum, s) => sum + (s.summary?.totalEnrolled || 0), 0);
      const totalPresent = stageReports.reduce((sum, s) => sum + (s.summary?.totalPresent || 0), 0);
      const totalAbsent = stageReports.reduce((sum, s) => sum + (s.summary?.totalAbsent || 0), 0);
      const totalLate = stageReports.reduce((sum, s) => sum + (s.summary?.totalLate || 0), 0);
      const totalExcused = stageReports.reduce((sum, s) => sum + (s.summary?.totalExcused || 0), 0);
      const totalClasses = stageReports.reduce((sum, s) => sum + (s.summary?.totalClasses || 0), 0);
      const totalRecords = totalPresent + totalAbsent + totalLate + totalExcused;

      return {
        stages: stageReports,
        summary: {
          totalStages: stageReports.length,
          totalClasses,
          totalEnrolled,
          totalPresent,
          totalAbsent,
          totalLate,
          totalExcused,
          avgAbsenceRate: totalRecords > 0
            ? Math.round((totalAbsent / totalRecords) * 100 * 100) / 100
            : 0
        }
      };
    } catch (err) {
      console.error('خطأ في جلب تقرير المدرسة:', err);
      throw err;
    }
  }

  /**
   * جلب معلومات المدرسة للترويسة الرسمية
   */
  static async getSchoolInfo() {
    try {
      const { data, error } = await supabase
        .from('school_settings')
        .select('*')
        .single();

      if (error) {
        // إرجاع قيم افتراضية في حالة عدم وجود الإعدادات
        return {
          name: 'المدرسة',
          name_en: 'School',
          logo: null,
          address: '',
          phone: '',
          email: '',
          ministry_header: 'وزارة التربية والتعليم',
          directorate: 'مديرية التربية والتعليم',
          administration: 'إدارة'
        };
      }

      return data;
    } catch (err) {
      console.error('خطأ في جلب معلومات المدرسة:', err);
      return {
        name: 'المدرسة',
        name_en: 'School',
        logo: null,
        address: '',
        phone: '',
        email: '',
        ministry_header: 'وزارة التربية والتعليم',
        directorate: 'مديرية التربية والتعليم',
        administration: 'إدارة'
      };
    }
  }

}
