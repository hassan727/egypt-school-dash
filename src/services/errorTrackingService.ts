/**
 * نظام تتبع الأخطاء الذكي - Smart Error Tracking System
 * يسجل جميع الأخطاء مع السياق والبيانات الإضافية
 * يرسل تنبيهات فورية للمشرفين
 */

import { supabase } from '@/lib/supabase';

// ====================================
// 1. أنواع البيانات (Types)
// ====================================

export interface ErrorLog {
  id?: string;
  error_code: string; // مثل: ERR_001_GRADE_NOT_FOUND
  error_message: string; // الرسالة الأساسية
  error_type: 'validation' | 'database' | 'network' | 'auth' | 'unknown';
  severity: 'critical' | 'high' | 'medium' | 'low';
  
  // السياق
  module: string; // مثل: StudentAcademic, EmployeePayroll
  function_name: string; // اسم الدالة
  user_id?: string;
  user_role?: string;
  
  // البيانات الإضافية
  context: Record<string, any>; // student_id, grade_id, إلخ
  stack_trace?: string;
  
  // المتصفح والنظام
  user_agent?: string;
  ip_address?: string;
  browser_info?: string;
  
  // الحالة
  status: 'new' | 'investigating' | 'resolved' | 'ignored';
  resolution_notes?: string;
  
  // الوقت
  occurred_at?: string;
  created_at?: string;
}

export interface ErrorAlert {
  id?: string;
  error_log_id: string;
  sent_to: string[]; // emails of admins
  alert_type: 'email' | 'whatsapp' | 'in_app';
  sent_at?: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
}

export interface ErrorStatistics {
  total_errors: number;
  critical_count: number;
  high_count: number;
  by_module: Record<string, number>;
  by_type: Record<string, number>;
  recent_errors: ErrorLog[];
  error_trend: { date: string; count: number }[];
}

// ====================================
// 2. نظام تسجيل الأخطاء (Error Logger)
// ====================================

class ErrorTrackingService {
  /**
   * تسجيل خطأ مع جميع التفاصيل
   */
  async logError(error: ErrorLog): Promise<string | null> {
    try {
      // إضافة معلومات آلية
      const enhancedError: ErrorLog = {
        ...error,
        user_agent: navigator.userAgent,
        browser_info: this.getBrowserInfo(),
        ip_address: await this.getIpAddress(),
        occurred_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      // حفظ في قاعدة البيانات
      const { data, error: dbError } = await supabase
        .from('error_logs')
        .insert([enhancedError])
        .select('id')
        .single();

      if (dbError) {
        console.error('فشل في حفظ سجل الخطأ:', dbError);
        return null;
      }

      const errorLogId = data?.id;

      // إذا كان الخطأ حرج → إرسال تنبيهات فورية
      if (error.severity === 'critical') {
        await this.sendCriticalAlert(errorLogId);
      }

      // تسجيل في console (للتطوير)
      console.error(`[${error.error_code}] ${error.error_message}`, enhancedError);

      return errorLogId;
    } catch (err) {
      console.error('خطأ في نظام تتبع الأخطاء:', err);
      return null;
    }
  }

  /**
   * تسجيل خطأ التحقق من البيانات (Validation Error)
   */
  async logValidationError(
    field: string,
    message: string,
    context: Record<string, any>
  ): Promise<void> {
    await this.logError({
      error_code: `ERR_VALIDATION_${field.toUpperCase()}`,
      error_message: message,
      error_type: 'validation',
      severity: 'medium',
      module: 'ValidationService',
      function_name: 'validate',
      context,
    });
  }

  /**
   * تسجيل خطأ قاعدة البيانات (Database Error)
   */
  async logDatabaseError(
    operation: string,
    table: string,
    message: string,
    context: Record<string, any>
  ): Promise<void> {
    await this.logError({
      error_code: `ERR_DB_${table.toUpperCase()}_${operation.toUpperCase()}`,
      error_message: message,
      error_type: 'database',
      severity: 'critical',
      module: `Database.${table}`,
      function_name: operation,
      context,
      stack_trace: this.getStackTrace(),
    });
  }

  /**
   * تسجيل خطأ الشبكة (Network Error)
   */
  async logNetworkError(
    endpoint: string,
    message: string,
    statusCode?: number
  ): Promise<void> {
    await this.logError({
      error_code: `ERR_NETWORK_${statusCode || 'UNKNOWN'}`,
      error_message: message,
      error_type: 'network',
      severity: statusCode === 503 ? 'critical' : 'high',
      module: 'NetworkService',
      function_name: 'fetch',
      context: { endpoint, statusCode },
    });
  }

  /**
   * تسجيل خطأ مصادقة (Authentication Error)
   */
  async logAuthError(message: string, context: Record<string, any>): Promise<void> {
    await this.logError({
      error_code: 'ERR_AUTH_FAILED',
      error_message: message,
      error_type: 'auth',
      severity: 'high',
      module: 'AuthService',
      function_name: 'authenticate',
      context,
    });
  }

  // ====================================
  // 3. نظام التنبيهات (Alert System)
  // ====================================

  /**
   * إرسال تنبيه للأخطاء الحرجة
   */
  private async sendCriticalAlert(errorLogId: string): Promise<void> {
    try {
      // جلب بيانات الخطأ
      const { data: errorLog } = await supabase
        .from('error_logs')
        .select('*')
        .eq('id', errorLogId)
        .single();

      if (!errorLog) return;

      // جلب قائمة المسؤولين
      const { data: admins } = await supabase
        .from('system_users')
        .select('email')
        .eq('role', 'system_admin')
        .eq('is_active', true);

      const adminEmails = admins?.map(a => a.email) || [];

      // إنشاء تنبيه
      if (adminEmails.length > 0) {
        await supabase.from('error_alerts').insert([
          {
            error_log_id: errorLogId,
            sent_to: adminEmails,
            alert_type: 'email',
            sent_at: new Date().toISOString(),
          },
        ]);
      }

      // إرسال بريد إلكتروني (يحتاج integration مع خدمة بريد)
      // await this.sendEmailAlert(errorLog, adminEmails);
    } catch (err) {
      console.error('فشل في إرسال التنبيه:', err);
    }
  }

  /**
   * إرسال تنبيه عبر البريد الإلكتروني (يحتاج تنفيذ)
   */
  private async sendEmailAlert(errorLog: ErrorLog, emails: string[]): Promise<void> {
    // هذا يحتاج backend endpoint
    // await fetch('/api/send-alert-email', {
    //   method: 'POST',
    //   body: JSON.stringify({ errorLog, emails }),
    // });
    console.log('تنبيه بريدي لـ:', emails);
  }

  // ====================================
  // 4. نظام الإحصائيات (Statistics)
  // ====================================

  /**
   * جلب إحصائيات الأخطاء
   */
  async getErrorStatistics(days: number = 7): Promise<ErrorStatistics> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // جلب جميع الأخطاء
      const { data: errors } = await supabase
        .from('error_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (!errors || errors.length === 0) {
        return {
          total_errors: 0,
          critical_count: 0,
          high_count: 0,
          by_module: {},
          by_type: {},
          recent_errors: [],
          error_trend: [],
        };
      }

      // حساب الإحصائيات
      const critical_count = errors.filter(e => e.severity === 'critical').length;
      const high_count = errors.filter(e => e.severity === 'high').length;

      const by_module: Record<string, number> = {};
      const by_type: Record<string, number> = {};

      errors.forEach(error => {
        by_module[error.module] = (by_module[error.module] || 0) + 1;
        by_type[error.error_type] = (by_type[error.error_type] || 0) + 1;
      });

      // حساب الاتجاه اليومي
      const error_trend = this.calculateDailyTrend(errors);

      return {
        total_errors: errors.length,
        critical_count,
        high_count,
        by_module,
        by_type,
        recent_errors: errors.slice(0, 10),
        error_trend,
      };
    } catch (err) {
      console.error('فشل في جلب إحصائيات الأخطاء:', err);
      return {
        total_errors: 0,
        critical_count: 0,
        high_count: 0,
        by_module: {},
        by_type: {},
        recent_errors: [],
        error_trend: [],
      };
    }
  }

  /**
   * حساب الاتجاه اليومي للأخطاء
   */
  private calculateDailyTrend(
    errors: ErrorLog[]
  ): { date: string; count: number }[] {
    const trend: Record<string, number> = {};

    errors.forEach(error => {
      const date = new Date(error.created_at || '').toISOString().split('T')[0];
      trend[date] = (trend[date] || 0) + 1;
    });

    return Object.entries(trend)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // ====================================
  // 5. مساعدات (Helpers)
  // ====================================

  /**
   * الحصول على معلومات المتصفح
   */
  private getBrowserInfo(): string {
    const ua = navigator.userAgent;
    let browserName = 'Unknown';
    let version = 'Unknown';

    if (ua.includes('Chrome')) {
      browserName = 'Chrome';
      version = ua.split('Chrome/')[1]?.split(' ')[0] || 'Unknown';
    } else if (ua.includes('Safari')) {
      browserName = 'Safari';
      version = ua.split('Version/')[1]?.split(' ')[0] || 'Unknown';
    } else if (ua.includes('Firefox')) {
      browserName = 'Firefox';
      version = ua.split('Firefox/')[1] || 'Unknown';
    }

    return `${browserName} ${version}`;
  }

  /**
   * الحصول على عنوان IP (يحتاج API)
   */
  private async getIpAddress(): Promise<string | undefined> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return undefined;
    }
  }

  /**
   * الحصول على Stack Trace
   */
  private getStackTrace(): string {
    const error = new Error();
    return error.stack || 'No stack trace available';
  }
}

// Export singleton instance
export const errorTrackingService = new ErrorTrackingService();
