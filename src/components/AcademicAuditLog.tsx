import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Clock, User, FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useAcademicAuditLog, AcademicAuditLogEntry } from '@/hooks/useAcademicAuditLog';

interface AcademicAuditLogProps {
  studentId: string;
  limit?: number;
}

/**
 * مكون عرض سجل التغييرات الأكاديمية
 */
export function AcademicAuditLog({ studentId, limit = 5 }: AcademicAuditLogProps) {
  const [auditLogs, setAuditLogs] = useState<AcademicAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const { getAuditLogForStudent } = useAcademicAuditLog();

  useEffect(() => {
    const fetchAuditLogs = async () => {
      if (!studentId) return;

      setLoading(true);
      try {
        const logs = await getAuditLogForStudent(studentId, limit);
        setAuditLogs(logs);
      } catch (error) {
        console.error('خطأ في جلب سجل التدقيق:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [studentId, limit]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'CREATE':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'UPDATE':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'DELETE':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionBadgeColor = (actionType: string) => {
    switch (actionType) {
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFieldChange = (entry: AcademicAuditLogEntry) => {
    if (!entry.fieldName) return 'تم إنشاء التقييم';

    let fieldDisplayName = entry.fieldName;
    switch (entry.fieldName) {
      case 'final_grade':
        fieldDisplayName = 'الدرجة النهائية';
        break;
      case 'original_grade':
        fieldDisplayName = 'الدرجة الأصلية';
        break;
      case 'teacher_notes':
        fieldDisplayName = 'ملاحظات المعلم';
        break;
      case 'assessment_date':
        fieldDisplayName = 'تاريخ التقييم';
        break;
      case 'grade_level':
        fieldDisplayName = 'مستوى الدرجة';
        break;
    }

    if (entry.oldValue && entry.newValue) {
      return `${fieldDisplayName}: ${entry.oldValue} → ${entry.newValue}`;
    } else if (entry.newValue) {
      return `إضافة ${fieldDisplayName}: ${entry.newValue}`;
    } else if (entry.oldValue) {
      return `حذف ${fieldDisplayName}: ${entry.oldValue}`;
    }

    return `تعديل ${fieldDisplayName}`;
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="mr-2 text-sm text-gray-600">جاري تحميل السجل...</span>
        </div>
      </Card>
    );
  }

  if (auditLogs.length === 0) {
    return (
      <Card className="p-4">
        <div className="text-center py-4 text-gray-500">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">لا توجد تغييرات مسجلة لهذا الطالب</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full p-4 hover:bg-gray-50 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                سجل التغييرات الأكاديمية
              </h3>
              <Badge variant="secondary" className="text-xs">
                آخر {auditLogs.length} تغيير
              </Badge>
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            {auditLogs.map((entry) => {
              const { date, time } = formatDateTime(entry.changeTimestamp);
              return (
                <div
                  key={entry.id}
                  className="border border-gray-100 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActionIcon(entry.actionType)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          className={`text-xs ${getActionBadgeColor(entry.actionType)}`}
                        >
                          {entry.actionType === 'CREATE' ? 'إنشاء' :
                           entry.actionType === 'UPDATE' ? 'تعديل' : 'حذف'}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {date} - {time}
                        </div>
                      </div>

                      <div className="text-sm text-gray-800 mb-1">
                        {formatFieldChange(entry)}
                      </div>

                      <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                        <User className="h-3 w-3" />
                        المستخدم: {entry.userId}
                      </div>

                      {entry.changeReason && (
                        <div className="text-xs text-gray-600 bg-white p-2 rounded border-l-2 border-blue-200">
                          <strong>السبب:</strong> {entry.changeReason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {auditLogs.length >= limit && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm" className="text-xs">
                  عرض المزيد من التغييرات
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}