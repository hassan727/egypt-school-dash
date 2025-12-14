import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { ChevronDown, ChevronUp, History, User, Clock, AlertCircle } from 'lucide-react';

interface AcademicAuditEntry {
    id: string;
    student_id: string;
    grade_id: string;
    user_id: string;
    action_type: string;
    field_name: string;
    old_value: string;
    new_value: string;
    change_reason: string;
    change_timestamp: string;
}

/**
 * مكون سجل التعديلات الأكاديمية
 * يعرض آخر 5 تغييرات أكاديمية للطالب
 */
export function AcademicAuditLog() {
    const { studentId } = useParams<{ studentId: string }>();
    const [auditEntries, setAuditEntries] = useState<AcademicAuditEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (!studentId) return;

        const fetchAuditLog = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('academic_audit_log')
                    .select('*')
                    .eq('student_id', studentId)
                    .order('change_timestamp', { ascending: false })
                    .limit(5);

                if (error) throw error;
                setAuditEntries(data || []);
            } catch (err) {
                console.error('خطأ في جلب سجل التعديلات الأكاديمية:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAuditLog();
    }, [studentId]);

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatFieldName = (fieldName: string): string => {
        const fieldNames: Record<string, string> = {
            'final_grade': 'الدرجة النهائية',
            'original_grade': 'الدرجة الأصلية',
            'teacher_notes': 'ملاحظات المعلم',
            'assessment_type': 'نوع التقييم',
            'subject_name': 'اسم المادة',
            'assessment_date': 'تاريخ التقييم',
        };
        return fieldNames[fieldName] || fieldName;
    };

    if (loading) {
        return (
            <Card className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            {/* رأس القسم - قابل للطي */}
            <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <History className="h-6 w-6 text-indigo-600" />
                        <h3 className="text-lg font-semibold text-gray-800">
                            سجل التغييرات الأكاديمية
                        </h3>
                        {auditEntries.length > 0 && (
                            <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                                آخر {auditEntries.length} تغيير
                            </span>
                        )}
                    </div>
                    <Button variant="ghost" size="sm" className="p-1">
                        {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-gray-500" />
                        ) : (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                    </Button>
                </div>
            </div>

            {/* محتوى السجل - يظهر عند الطي */}
            {isExpanded && (
                <div className="border-t border-gray-100">
                    {auditEntries.length > 0 ? (
                        <div className="p-6 space-y-4">
                            {auditEntries.map((entry, index) => (
                                <div
                                    key={entry.id}
                                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                                >
                                    {/* رأس البطاقة */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <AlertCircle className="h-4 w-4 text-blue-600" />
                                                <span className="font-medium text-gray-800">
                                                    تعديل {formatFieldName(entry.field_name)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    <span>{entry.user_id}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{formatDateTime(entry.change_timestamp)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* تفاصيل التعديل */}
                                    <div className="bg-white rounded p-3 border">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-red-600 line-through font-medium">
                                                {entry.old_value || 'غير محدد'}
                                            </span>
                                            <span className="text-gray-400">→</span>
                                            <span className="text-green-600 font-medium">
                                                {entry.new_value || 'غير محدد'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* سبب التعديل */}
                                    {entry.change_reason && (
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                            <p className="text-sm text-gray-700">
                                                <span className="font-medium">السبب: </span>
                                                {entry.change_reason}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center bg-gray-50">
                            <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-sm">لا توجد تغييرات أكاديمية مسجلة</p>
                            <p className="text-gray-400 text-xs mt-1">
                                سيتم عرض التعديلات هنا عند إجراء أي تغييرات على التقييمات
                            </p>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}