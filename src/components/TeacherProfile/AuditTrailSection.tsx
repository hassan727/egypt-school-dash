import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    History,
    Download,
    Search,
    Filter,
    ChevronDown,
    User,
    DollarSign,
    Calendar,
    Briefcase,
    Star,
    FileText
} from 'lucide-react';
import { useState } from 'react';
import { TeacherAuditTrail } from '@/types/teacher';

interface AuditTrailSectionProps {
    auditTrail: TeacherAuditTrail[];
}

export function AuditTrailSection({ auditTrail }: AuditTrailSectionProps) {
    const [filter, setFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // تصنيف التغييرات
    const changeTypes = [
        { value: 'all', label: 'الكل' },
        { value: 'Personal Data', label: 'بيانات شخصية' },
        { value: 'Employment Data', label: 'بيانات وظيفية' },
        { value: 'Salary', label: 'راتب' },
        { value: 'Attendance', label: 'حضور' },
        { value: 'Leave Request', label: 'إجازات' },
        { value: 'Evaluation', label: 'تقييم' },
    ];

    // فلترة السجلات
    const filteredRecords = auditTrail.filter(record => {
        const matchesFilter = filter === 'all' || record.changeType === filter;
        const matchesSearch = searchQuery === '' ||
            record.changeType.includes(searchQuery) ||
            record.changedBy.includes(searchQuery);
        return matchesFilter && matchesSearch;
    });

    const getChangeIcon = (type: string) => {
        switch (type) {
            case 'Personal Data': return <User className="h-4 w-4 text-blue-600" />;
            case 'Employment Data': return <Briefcase className="h-4 w-4 text-green-600" />;
            case 'Salary': return <DollarSign className="h-4 w-4 text-yellow-600" />;
            case 'Attendance': return <Calendar className="h-4 w-4 text-purple-600" />;
            case 'Evaluation': return <Star className="h-4 w-4 text-orange-600" />;
            default: return <FileText className="h-4 w-4 text-gray-600" />;
        }
    };

    const exportToCsv = () => {
        const headers = ['التاريخ', 'نوع التغيير', 'التغييرات', 'بواسطة', 'السبب'];
        const rows = filteredRecords.map(r => [
            new Date(r.createdAt).toLocaleString('ar-EG'),
            r.changeType,
            JSON.stringify(r.changedFields),
            r.changedBy,
            r.changeReason || '-'
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.join(','))
            .join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `teacher_audit_trail_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <div className="space-y-6">
            {/* شريط الأدوات */}
            <Card className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {/* فلتر النوع */}
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="border rounded-lg p-2 text-sm min-w-[150px]"
                        >
                            {changeTypes.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>

                        {/* البحث */}
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="بحث..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="border rounded-lg py-2 pr-10 pl-4 text-sm w-64"
                            />
                        </div>
                    </div>

                    {/* تصدير */}
                    <Button variant="outline" size="sm" onClick={exportToCsv} className="gap-2">
                        <Download className="h-4 w-4" />
                        تصدير CSV
                    </Button>
                </div>
            </Card>

            {/* سجل التغييرات */}
            <Card className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <History className="h-5 w-5 text-blue-600" />
                    سجل التغييرات
                    <span className="text-sm font-normal text-gray-500">
                        ({filteredRecords.length} سجل)
                    </span>
                </h3>

                {filteredRecords.length > 0 ? (
                    <div className="relative">
                        {/* الخط الزمني */}
                        <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                        <div className="space-y-4">
                            {filteredRecords.map((record, index) => (
                                <div key={index} className="relative pr-10">
                                    {/* النقطة */}
                                    <div className="absolute right-2.5 top-4 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow"></div>

                                    <div className="bg-gray-50 p-4 rounded-lg border hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {getChangeIcon(record.changeType)}
                                                <span className="font-semibold">{record.changeType}</span>
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {new Date(record.createdAt).toLocaleString('ar-EG')}
                                            </span>
                                        </div>

                                        {/* التغييرات */}
                                        <div className="bg-white p-3 rounded border text-sm my-2">
                                            {record.oldValues && record.newValues ? (
                                                <div className="space-y-1">
                                                    {Object.keys(record.newValues).map((key) => (
                                                        <div key={key} className="flex items-center gap-2">
                                                            <span className="text-gray-500">{key}:</span>
                                                            <span className="line-through text-red-500">
                                                                {String(record.oldValues?.[key] || '-')}
                                                            </span>
                                                            <span>→</span>
                                                            <span className="text-green-600 font-medium">
                                                                {String(record.newValues?.[key] || '-')}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <pre className="text-xs overflow-auto">
                                                    {JSON.stringify(record.changedFields, null, 2)}
                                                </pre>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span>بواسطة: {record.changedBy}</span>
                                            {record.changeReason && (
                                                <span>السبب: {record.changeReason}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <History className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>لا توجد سجلات تغيير</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
