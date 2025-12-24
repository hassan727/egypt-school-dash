import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader, FileText, Download, Filter, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useStudentData } from '@/hooks/useStudentData';

/**
 * صفحة السجل - Log Page
 * تعرض سجل جميع التغييرات التي تمت على بيانات الطالب
 * صفحة للعرض فقط دون إمكانية التعديل
 * 
 * تتضمن:
 * - تاريخ التغيير
 * - نوع البيانات المتغيرة
 * - القيم القديمة والجديدة
 * - من قام بالتغيير
 * - سبب التغيير (إن وجد)
 */
export default function LogPage() {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const { undoLastChange, refreshStudentData } = useStudentData(studentId || '');

    const [auditTrail, setAuditTrail] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState('all');

    const handleUndoLastChange = async () => {
        try {
            await undoLastChange();
            await refreshStudentData();
            // Refresh the audit trail after undo
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (err) {
            console.error('خطأ في التراجع عن آخر تغيير:', err);
        }
    };

    useEffect(() => {
        if (!studentId) return;

        const fetchAuditTrail = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('student_audit_trail')
                    .select('*')
                    .eq('student_id', studentId)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setAuditTrail(data || []);
            } catch (err) {
                console.error('Error fetching audit trail:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAuditTrail();
    }, [studentId]);

    if (!studentId) {
        return (
            <DashboardLayout>
                <div className="text-center py-10">
                    <p className="text-red-500">لم يتم تحديد معرّف الطالب</p>
                </div>
            </DashboardLayout>
        );
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="text-center py-16">
                    <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-500">جاري تحميل السجلات...</p>
                </div>
            </DashboardLayout>
        );
    }

    // Filter logic
    const filteredAuditTrail =
        selectedFilter === 'all'
            ? auditTrail
            : auditTrail.filter((record) => record.change_type === selectedFilter);

    // Get unique change types
    const changeTypes = [...new Set(auditTrail.map((r) => r.change_type))];

    // Format change type for display
    const formatChangeType = (type: string): string => {
        const types: Record<string, string> = {
            'Personal Data': 'بيانات شخصية',
            'Enrollment Data': 'بيانات قيد',
            'Guardian Data': 'بيانات ولي الأمر',
            'Mother Data': 'بيانات الأم',
            'Academic Data': 'بيانات أكاديمية',
            'Behavioral Data': 'بيانات سلوكية',
            'Financial Data': 'بيانات مالية',
            'Attendance Data': 'بيانات حضور',
            'Administrative Data': 'بيانات إدارية',
        };
        return types[type] || type;
    };

    // Download report as CSV
    const downloadReport = () => {
        const headers = [
            'التاريخ',
            'نوع التغيير',
            'التفاصيل',
            'من قام بالتعديل',
            'السبب',
        ];
        const rows = filteredAuditTrail.map((record) => [
            new Date(record.created_at).toLocaleDateString('ar-EG'),
            formatChangeType(record.change_type),
            record.changed_fields ? JSON.stringify(record.changed_fields) : '-',
            record.changed_by || '-',
            record.change_reason || '-',
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `سجل-الطالب-${studentId}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 max-w-6xl mx-auto py-6 px-4">
                {/* Header with navigation */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <FileText className="h-8 w-8 text-gray-600" />
                            <h1 className="text-4xl font-bold text-gray-900">
                                سجل التغييرات
                            </h1>
                        </div>
                        <p className="text-gray-600">
                            معرّف الطالب: <span className="font-semibold">{studentId}</span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleUndoLastChange}
                            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white"
                        >
                            <RotateCcw className="h-4 w-4" />
                            التراجع
                        </Button>
                        <Button
                            onClick={() => navigate(`/student/${studentId}/dashboard`)}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            العودة
                        </Button>
                    </div>
                </div>

                {/* Info Card - Read Only */}
                <Card className="p-6 bg-gray-50 border border-gray-200">
                    <p className="text-gray-700 text-sm">
                        ℹ️ هذه الصفحة للعرض فقط. تعرض جميع التغييرات التي تمت على بيانات
                        الطالب مع التفاصيل الكاملة. يمكنك تحميل التقرير كملف CSV.
                    </p>
                </Card>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                        <p className="text-gray-600 text-sm mb-2">إجمالي التغييرات</p>
                        <p className="text-3xl font-bold text-blue-600">
                            {auditTrail.length}
                        </p>
                    </Card>
                    <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                        <p className="text-gray-600 text-sm mb-2">أنواع التغييرات</p>
                        <p className="text-3xl font-bold text-green-600">
                            {changeTypes.length}
                        </p>
                    </Card>
                    <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                        <p className="text-gray-600 text-sm mb-2">آخر تحديث</p>
                        <p className="text-lg font-bold text-purple-600">
                            {auditTrail.length > 0
                                ? new Date(
                                    auditTrail[0].created_at
                                ).toLocaleDateString('ar-EG')
                                : 'لا توجد تغييرات'}
                        </p>
                    </Card>
                </div>

                {/* Filters and Download */}
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Filter className="h-4 w-4 inline mr-2" />
                            نوع التغيير
                        </label>
                        <select
                            value={selectedFilter}
                            onChange={(e) => setSelectedFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">جميع التغييرات</option>
                            {changeTypes.map((type) => (
                                <option key={type} value={type}>
                                    {formatChangeType(type as string)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Button
                        onClick={downloadReport}
                        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                    >
                        <Download className="h-4 w-4" />
                        تحميل التقرير
                    </Button>
                </div>

                {/* Audit Trail Records */}
                {filteredAuditTrail.length > 0 ? (
                    <div className="space-y-4">
                        {filteredAuditTrail.map((record, index) => (
                            <Card
                                key={index}
                                className="p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                            >
                                {/* Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            {formatChangeType(record.change_type)}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {new Date(
                                                record.created_at
                                            ).toLocaleString('ar-EG')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">
                                            من قام بالتعديل:
                                        </p>
                                        <p className="font-semibold text-gray-800">
                                            {record.changed_by || 'نظام'}
                                        </p>
                                    </div>
                                </div>

                                {/* Changed Fields */}
                                {record.changed_fields && (
                                    <div className="mb-4">
                                        <p className="text-sm font-semibold text-gray-700 mb-2">
                                            التفاصيل:
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                            {Object.entries(
                                                record.changed_fields as Record<string, any>
                                            ).map(([field, change], idx) => (
                                                <div key={idx} className="text-sm">
                                                    <p className="font-medium text-gray-700">
                                                        {field}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-red-600 line-through">
                                                            {change.oldValue || '-'}
                                                        </span>
                                                        <span className="text-gray-400">→</span>
                                                        <span className="text-green-600">
                                                            {change.newValue || '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Change Reason */}
                                {record.change_reason && (
                                    <div className="pt-3 border-t border-gray-200">
                                        <p className="text-sm text-gray-600">
                                            <span className="font-semibold">السبب: </span>
                                            {record.change_reason}
                                        </p>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="p-12 text-center bg-gray-50 border border-gray-200">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">لا توجد تغييرات مسجلة</p>
                        <p className="text-gray-400 text-sm mt-2">
                            سيتم عرض جميع التغييرات هنا عند إجراء أي تعديلات على بيانات الطالب
                        </p>
                    </Card>
                )}

                {/* Footer Navigation */}
                <div className="flex justify-between pt-6 border-t">
                    <Button
                        onClick={() => navigate(`/student/${studentId}/dashboard`)}
                        variant="outline"
                    >
                        العودة
                    </Button>
                    <div className="text-sm text-gray-500">
                        العرض: {filteredAuditTrail.length} من {auditTrail.length}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}