import { supabase } from '@/lib/supabase';

export interface AcademicAuditLogEntry {
  id: string;
  studentId: string;
  gradeId: string;
  userId: string;
  actionType: 'CREATE' | 'UPDATE' | 'DELETE';
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  changeReason: string;
  changeTimestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Hook لإدارة سجل التدقيق الأكاديمي
 */
export function useAcademicAuditLog() {

  /**
   * إنشاء سجل تدقيق جديد
   */
  const createAuditLog = async (
    studentId: string,
    gradeId: string,
    userId: string,
    actionType: 'CREATE' | 'UPDATE' | 'DELETE',
    fieldName?: string,
    oldValue?: any,
    newValue?: any,
    changeReason: string = ''
  ): Promise<boolean> => {
    try {
      const auditEntry = {
        student_id: studentId,
        grade_id: gradeId,
        user_id: userId,
        action_type: actionType,
        field_name: fieldName,
        old_value: oldValue ? JSON.stringify(oldValue) : null,
        new_value: newValue ? JSON.stringify(newValue) : null,
        change_reason: changeReason,
        change_timestamp: new Date().toISOString(),
        ip_address: null, // يمكن إضافته لاحقاً
        user_agent: navigator?.userAgent || null
      };

      const { error } = await supabase
        .from('academic_audit_log')
        .insert(auditEntry);

      if (error) {
        console.error('خطأ في إنشاء سجل التدقيق:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('خطأ في إنشاء سجل التدقيق:', error);
      return false;
    }
  };

  /**
   * جلب سجل التدقيق لطالب معين
   */
  const getAuditLogForStudent = async (
    studentId: string,
    limit: number = 50
  ): Promise<AcademicAuditLogEntry[]> => {
    try {
      const { data, error } = await supabase
        .from('academic_audit_log')
        .select('*')
        .eq('student_id', studentId)
        .order('change_timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('خطأ في جلب سجل التدقيق:', error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        studentId: item.student_id,
        gradeId: item.grade_id,
        userId: item.user_id,
        actionType: item.action_type,
        fieldName: item.field_name,
        oldValue: item.old_value,
        newValue: item.new_value,
        changeReason: item.change_reason,
        changeTimestamp: item.change_timestamp,
        ipAddress: item.ip_address,
        userAgent: item.user_agent
      }));
    } catch (error) {
      console.error('خطأ في جلب سجل التدقيق:', error);
      return [];
    }
  };

  /**
   * جلب سجل التدقيق لتقييم معين
   */
  const getAuditLogForGrade = async (
    gradeId: string
  ): Promise<AcademicAuditLogEntry[]> => {
    try {
      const { data, error } = await supabase
        .from('academic_audit_log')
        .select('*')
        .eq('grade_id', gradeId)
        .order('change_timestamp', { ascending: false });

      if (error) {
        console.error('خطأ في جلب سجل التدقيق للتقييم:', error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        studentId: item.student_id,
        gradeId: item.grade_id,
        userId: item.user_id,
        actionType: item.action_type,
        fieldName: item.field_name,
        oldValue: item.old_value,
        newValue: item.new_value,
        changeReason: item.change_reason,
        changeTimestamp: item.change_timestamp,
        ipAddress: item.ip_address,
        userAgent: item.user_agent
      }));
    } catch (error) {
      console.error('خطأ في جلب سجل التدقيق للتقييم:', error);
      return [];
    }
  };

  /**
   * البحث في سجل التدقيق
   */
  const searchAuditLog = async (
    filters: {
      studentId?: string;
      userId?: string;
      actionType?: string;
      dateFrom?: string;
      dateTo?: string;
      subject?: string;
      assessmentType?: string;
    },
    limit: number = 100
  ): Promise<AcademicAuditLogEntry[]> => {
    try {
      let query = supabase
        .from('academic_audit_log')
        .select('*');

      if (filters.studentId) {
        query = query.eq('student_id', filters.studentId);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.actionType) {
        query = query.eq('action_type', filters.actionType);
      }
      if (filters.dateFrom) {
        query = query.gte('change_timestamp', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('change_timestamp', filters.dateTo);
      }

      const { data, error } = await query
        .order('change_timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('خطأ في البحث في سجل التدقيق:', error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        studentId: item.student_id,
        gradeId: item.grade_id,
        userId: item.user_id,
        actionType: item.action_type,
        fieldName: item.field_name,
        oldValue: item.old_value,
        newValue: item.new_value,
        changeReason: item.change_reason,
        changeTimestamp: item.change_timestamp,
        ipAddress: item.ip_address,
        userAgent: item.user_agent
      }));
    } catch (error) {
      console.error('خطأ في البحث في سجل التدقيق:', error);
      return [];
    }
  };

  return {
    createAuditLog,
    getAuditLogForStudent,
    getAuditLogForGrade,
    searchAuditLog
  };
}