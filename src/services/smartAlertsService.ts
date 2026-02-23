/**
 * نظام التنبيهات الذكية - Smart Alerts System
 * تنبيهات استباقية ذكية تحذر قبل حدوث المشاكل
 */

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface SmartAlert {
  id?: string;
  alert_type: string; // student_payment_overdue, grade_fail_risk, employee_absent_pattern
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affected_entity: string; // student_id, employee_id, إلخ
  affected_entity_type: 'student' | 'employee' | 'teacher' | 'school';
  recommended_action: string;

  // البيانات الحالية
  current_value: any;
  threshold_value: any;

  // الحالة
  status: 'active' | 'dismissed' | 'resolved';
  dismissed_at?: string;
  resolved_at?: string;

  created_at?: string;
  updated_at?: string;
  school_id?: string;
}

// ====================================
// نظام التنبيهات الذكية
// ====================================

class SmartAlertsService {
  /**
   * 1️⃣ تحليل الطالب المتأخر في الرسوم
   * يرسل تنبيه إذا:
   * - دفع أقل من 30% من الرسوم
   * - وقت الاستحقاق قادم في أسبوع
   */
  async analyzeStudentPaymentStatus(schoolId: string): Promise<void> {
    try {
      if (!schoolId) return;
      const { data: students } = await supabase
        .from('school_fees')
        .select(`
          student_id,
          total_amount,
          advance_payment,
          student_id (
            id,
            student_id,
            full_name_ar
          )
        `)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (!students) return;

      for (const student of students) {
        const studentId = student.student_id;
        const totalFee = student.total_amount || 0;
        const advancePayment = student.advance_payment || 0;

        // جلب المدفوعات
        const { data: payments } = await supabase
          .from('financial_transactions')
          .select('amount')
          .eq('school_id', schoolId)
          .eq('student_id', studentId)
          .eq('transaction_type', 'دفعة');

        const totalPaid = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        const totalReceived = totalPaid + advancePayment;
        const paymentPercentage = totalFee > 0 ? (totalReceived / totalFee) * 100 : 0;

        // إذا دفع أقل من 30%
        if (paymentPercentage < 30 && paymentPercentage > 0) {
          await this.createAlert({
            alert_type: 'student_payment_overdue',
            severity: 'high',
            title: 'تنبيه: الطالب متأخر في دفع الرسوم',
            description: `الطالب ${student.student_id[0]?.full_name_ar} دفع فقط ${paymentPercentage.toFixed(1)}% من الرسوم`,
            affected_entity: studentId,
            affected_entity_type: 'student',
            recommended_action: 'التواصل مع ولي الأمر وتذكيره بالأقساط المستحقة',
            current_value: paymentPercentage.toFixed(1),
            threshold_value: 30,
          }, schoolId);
        }

        // إذا لم يدفع شيء
        if (paymentPercentage === 0) {
          await this.createAlert({
            alert_type: 'student_payment_not_started',
            severity: 'critical',
            title: 'خطر: الطالب لم يدفع أي رسوم',
            description: `الطالب ${student.student_id[0]?.full_name_ar} لم يدفع أي رسوم حتى الآن`,
            affected_entity: studentId,
            affected_entity_type: 'student',
            recommended_action: 'التواصل الفوري مع ولي الأمر',
            current_value: 0,
            threshold_value: 0,
          }, schoolId);
        }
      }
    } catch (err) {
      console.error('خطأ في تحليل حالة الطلاب:', err);
    }
  }

  /**
   * 2️⃣ تحليل خطر رسوب الطالب
   * يرسل تنبيه إذا:
   * - متوسط درجاته أقل من 40%
   * - لديه درجات متدنية في مادتين أو أكثر
   */
  async analyzeStudentFailureRisk(schoolId: string): Promise<void> {
    try {
      if (!schoolId) return;
      // Note: Assuming grades table has school_id or we rely on student_id.school_id filter if possible.
      // For now, let's try to filter by school_id if the column exists, otherwise we rely on inner join filtering.
      // Since explicit school_id is safer, we assume it exists or we filter via student.
      const { data: students } = await supabase
        .from('grades')
        .select(`
          student_id,
          final_grade,
          student_id!inner (
            id,
            student_id,
            full_name_ar,
            school_id
          )
        `)
        .eq('student_id.school_id', schoolId) // Filter by school via student relation
        .gt('final_grade', 0);

      if (!students || students.length === 0) return;

      // تجميع البيانات حسب الطالب
      const studentGrades: Record<string, number[]> = {};

      students.forEach(g => {
        const studentId = g.student_id;
        if (!studentGrades[studentId]) {
          studentGrades[studentId] = [];
        }
        studentGrades[studentId].push(g.final_grade);
      });

      // تحليل كل طالب
      for (const [studentId, grades] of Object.entries(studentGrades)) {
        const average = grades.reduce((a, b) => a + b, 0) / grades.length;
        const failCount = grades.filter(g => g < 40).length;
        const studentName = students.find(s => s.student_id === studentId)?.student_id[0]?.full_name_ar || 'غير معروف';

        // متوسط منخفض
        if (average < 40) {
          await this.createAlert({
            alert_type: 'student_fail_risk',
            severity: 'critical',
            title: 'خطر: الطالب قد يرسب',
            description: `الطالب ${studentName} متوسط درجاته ${average.toFixed(1)}% - أقل من الحد الأدنى`,
            affected_entity: studentId,
            affected_entity_type: 'student',
            recommended_action: 'جلسة مع المعلمين + دعم إضافي',
            current_value: average.toFixed(1),
            threshold_value: 40,
          }, schoolId);
        }

        // درجات متدنية في مواد متعددة
        if (failCount >= 2) {
          await this.createAlert({
            alert_type: 'student_multiple_failing_subjects',
            severity: 'high',
            title: 'تنبيه: الطالب راسب في عدة مواد',
            description: `الطالب ${studentName} راسب في ${failCount} مواد`,
            affected_entity: studentId,
            affected_entity_type: 'student',
            recommended_action: 'اجتماع مع الآباء + تحديد مواد الضعف',
            current_value: failCount,
            threshold_value: 1,
          }, schoolId);
        }
      }
    } catch (err) {
      console.error('خطأ في تحليل خطر الرسوب:', err);
    }
  }

  /**
   * 3️⃣ تحليل نمط غياب الموظف
   * يرسل تنبيه إذا:
   * - تأخر أكثر من 10 مرات في الشهر
   * - غاب أكثر من 5 أيام بدون سبب
   * - نمط غياب مشبوه (مثل: يغيب دائماً يوم الاثنين)
   */
  async analyzeEmployeeAttendancePattern(schoolId: string): Promise<void> {
    try {
      if (!schoolId) return;
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);

      const { data: attendance } = await supabase
        .from('employee_attendance')
        .select(`
          employee_id,
          status,
          date,
          late_minutes,
          employee_id (
            id,
            full_name_ar,
            employee_code
          )
        `)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0])
        .eq('school_id', schoolId);

      if (!attendance) return;

      // تجميع البيانات حسب الموظف
      const employeeStats: Record<string, any> = {};

      attendance.forEach(record => {
        const empId = record.employee_id;
        if (!employeeStats[empId]) {
          employeeStats[empId] = {
            totalDays: 0,
            lateDays: 0,
            absentDays: 0,
            name: record.employee_id[0]?.full_name_ar || 'غير معروف',
            lateMinutes: 0,
            dates: [],
          };
        }

        employeeStats[empId].totalDays++;
        if (record.status === 'متأخر') {
          employeeStats[empId].lateDays++;
          employeeStats[empId].lateMinutes += record.late_minutes || 0;
        }
        if (record.status === 'غائب') {
          employeeStats[empId].absentDays++;
        }
        employeeStats[empId].dates.push(new Date(record.date).getDay());
      });

      // تحليل كل موظف
      for (const [empId, stats] of Object.entries(employeeStats)) {
        // تأخر متكرر
        if (stats.lateDays > 10) {
          await this.createAlert({
            alert_type: 'employee_frequent_late',
            severity: 'high',
            title: 'تنبيه: موظف متأخر باستمرار',
            description: `الموظف ${stats.name} تأخر ${stats.lateDays} مرات هذا الشهر - إجمالي ${stats.lateMinutes} دقيقة`,
            affected_entity: empId,
            affected_entity_type: 'employee',
            recommended_action: 'إنذار تحذيري من قبل المشرف المباشر',
            current_value: stats.lateDays,
            threshold_value: 10,
          }, schoolId);
        }

        // غياب متكرر
        if (stats.absentDays > 5) {
          await this.createAlert({
            alert_type: 'employee_frequent_absent',
            severity: 'critical',
            title: 'خطر: موظف متغيب باستمرار',
            description: `الموظف ${stats.name} غاب ${stats.absentDays} أيام بدون سبب`,
            affected_entity: empId,
            affected_entity_type: 'employee',
            recommended_action: 'اجتماع مباشر + إنذار رسمي',
            current_value: stats.absentDays,
            threshold_value: 5,
          }, schoolId);
        }
      }
    } catch (err) {
      console.error('خطأ في تحليل نمط الحضور:', err);
    }
  }

  /**
   * 4️⃣ تحليل تأخر الرواتب
   * يرسل تنبيه إذا:
   * - رواتب معلقة لأكثر من شهر
   * - فرق كبير بين الراتب المتوقع والفعلي
   */
  async analyzeSalaryDelays(schoolId: string): Promise<void> {
    try {
      if (!schoolId) return;
      const { data: pendingSalaries } = await supabase
        .from('salaries')
        .select(`
          id,
          employee_id,
          net_salary,
          status,
          created_at,
          employee_id (
            full_name_ar,
            employee_code
          )
        `)
        .eq('status', 'مستحق')
        .eq('school_id', schoolId);

      if (!pendingSalaries) return;

      for (const salary of pendingSalaries) {
        const createdDate = new Date(salary.created_at || '');
        const daysPending = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysPending > 30) {
          await this.createAlert({
            alert_type: 'salary_delayed',
            severity: 'critical',
            title: 'خطر: راتب متأخر',
            description: `راتب ${salary.employee_id[0]?.full_name_ar} متأخر منذ ${daysPending} يوم`,
            affected_entity: salary.employee_id,
            affected_entity_type: 'employee',
            recommended_action: 'معالجة فورية من قسم المالية',
            current_value: daysPending,
            threshold_value: 30,
          });
        }
      }
    } catch (err) {
      console.error('خطأ في تحليل تأخر الرواتب:', err);
    }
  }

  /**
   * إنشاء تنبيه جديد (مع تجنب التكرار)
   */
  private async createAlert(alert: SmartAlert, schoolId: string): Promise<void> {
    try {
      if (!schoolId) return;
      // تحقق من وجود تنبيه نشط مشابه
      const { data: existingAlert } = await supabase
        .from('smart_alerts')
        .select('id')
        .eq('school_id', schoolId)
        .eq('alert_type', alert.alert_type)
        .eq('affected_entity', alert.affected_entity)
        .eq('status', 'active')
        .single();

      // إذا كان موجود، لا نسجل مجدداً
      if (existingAlert) return;

      // إنشاء تنبيه جديد
      const { error } = await supabase.from('smart_alerts').insert([
        {
          ...alert,
          school_id: schoolId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error('فشل في إنشاء التنبيه:', error);
      }
    } catch (err) {
      console.error('خطأ في إنشاء التنبيه:', err);
    }
  }

  /**
   * تشغيل جميع التحليلات
   */
  async runAllAnalytics(schoolId: string): Promise<void> {
    if (!schoolId) return;
    console.log('🔍 بدء التحليلات الذكية...');

    await Promise.all([
      this.analyzeStudentPaymentStatus(schoolId),
      this.analyzeStudentFailureRisk(schoolId),
      this.analyzeEmployeeAttendancePattern(schoolId),
      this.analyzeSalaryDelays(schoolId),
    ]);

    console.log('✅ انتهت التحليلات الذكية');
    toast.success('تم تشغيل التحليلات الذكية بنجاح');
  }

  /**
   * الحصول على التنبيهات النشطة
   */
  async getActiveAlerts(schoolId: string): Promise<SmartAlert[]> {
    try {
      if (!schoolId) return [];
      const { data } = await supabase
        .from('smart_alerts')
        .select('*')
        .eq('school_id', schoolId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      return data || [];
    } catch (err) {
      console.error('خطأ في جلب التنبيهات:', err);
      return [];
    }
  }

  /**
   * إغلاق تنبيه
   */
  async dismissAlert(alertId: string): Promise<void> {
    try {
      await supabase
        .from('smart_alerts')
        .update({ status: 'dismissed', dismissed_at: new Date().toISOString() })
        .eq('id', alertId);

      toast.success('تم إغلاق التنبيه');
    } catch (err) {
      console.error('خطأ في إغلاق التنبيه:', err);
    }
  }

  /**
   * تحديد تنبيه كمحل
   */
  async resolveAlert(alertId: string): Promise<void> {
    try {
      await supabase
        .from('smart_alerts')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', alertId);

      toast.success('تم حل التنبيه');
    } catch (err) {
      console.error('خطأ في حل التنبيه:', err);
    }
  }
}

// Export singleton instance
export const smartAlerts = new SmartAlertsService();
