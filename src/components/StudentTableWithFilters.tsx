import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronUp, ChevronDown, Download, Filter, X } from 'lucide-react';
import { getFileStatusColor } from '@/utils/helpers';

interface StudentTableProps {
    students: any[];
    loading?: boolean;
    onSelectStudent?: (studentId: string) => void;
    onExport?: () => void;
    selectable?: boolean;
    sortable?: boolean;
}

export const StudentTableWithFilters = ({
    students,
    loading = false,
    onSelectStudent,
    onExport,
    selectable = false,
    sortable = true,
}: StudentTableProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [stageFilter, setStageFilter] = useState('all');
    const [classFilter, setClassFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortField, setSortField] = useState('full_name_ar');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

    // تصفية البيانات
    const filteredStudents = useMemo(() => {
        let result = [...students];

        if (searchTerm) {
            result = result.filter(
                (s) =>
                    s.full_name_ar?.includes(searchTerm) ||
                    s.student_id?.includes(searchTerm)
            );
        }

        if (stageFilter && stageFilter !== 'all') result = result.filter((s) => s.stage === stageFilter);
        if (classFilter && classFilter !== 'all') result = result.filter((s) => s.class === classFilter);
        if (statusFilter && statusFilter !== 'all') result = result.filter((s) => s.file_status === statusFilter);

        // ترتيب البيانات
        if (sortable) {
            result.sort((a, b) => {
                const aValue = a[sortField];
                const bValue = b[sortField];

                if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [students, searchTerm, stageFilter, classFilter, statusFilter, sortField, sortDirection, sortable]);

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const toggleSelectAll = () => {
        if (selectedRows.size === filteredStudents.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(filteredStudents.map((s) => s.student_id)));
        }
    };

    const toggleSelectRow = (studentId: string) => {
        const newSelected = new Set(selectedRows);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedRows(newSelected);
    };

    const stages = [...new Set(students.map((s) => s.stage).filter(Boolean))];
    const classes = [...new Set(students.map((s) => s.class).filter(Boolean))];
    const statuses = [...new Set(students.map((s) => s.file_status).filter(Boolean))];

    return (
        <div className="space-y-4">
            {/* فلاتر البحث */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Input
                    placeholder="ابحث باسم أو رقم الطالب"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-right"
                />

                {stages.length > 0 && (
                    <Select value={stageFilter} onValueChange={setStageFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="الصف" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">الكل</SelectItem>
                            {stages.map((stage) => (
                                <SelectItem key={stage} value={stage}>
                                    {stage}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {classes.length > 0 && (
                    <Select value={classFilter} onValueChange={setClassFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="الفصل" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">الكل</SelectItem>
                            {classes.map((cls) => (
                                <SelectItem key={cls} value={cls}>
                                    {cls}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {statuses.length > 0 && (
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="الحالة" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">الكل</SelectItem>
                            {statuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                    {status}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex flex-wrap gap-2">
                {(searchTerm || (stageFilter && stageFilter !== 'all') || (classFilter && classFilter !== 'all') || (statusFilter && statusFilter !== 'all')) && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setSearchTerm('');
                            setStageFilter('all');
                            setClassFilter('all');
                            setStatusFilter('all');
                        }}
                    >
                        <X className="ml-2 h-4 w-4" />
                        مسح الفلاتر
                    </Button>
                )}
                {onExport && (
                    <Button variant="outline" size="sm" onClick={onExport}>
                        <Download className="ml-2 h-4 w-4" />
                        تصدير
                    </Button>
                )}
                {selectedRows.size > 0 && (
                    <Badge variant="secondary">{selectedRows.size} مختار</Badge>
                )}
            </div>

            {/* الجدول */}
            <div className="overflow-x-auto rounded-lg border">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            {selectable && (
                                <TableHead className="w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.size === filteredStudents.length && filteredStudents.length > 0}
                                        onChange={toggleSelectAll}
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                </TableHead>
                            )}
                            <TableHead className="cursor-pointer hover:bg-gray-100">
                                <div
                                    className="flex items-center gap-2"
                                    onClick={() => handleSort('full_name_ar')}
                                >
                                    الاسم
                                    {sortField === 'full_name_ar' && (
                                        sortDirection === 'asc' ? (
                                            <ChevronUp className="h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" />
                                        )
                                    )}
                                </div>
                            </TableHead>
                            <TableHead>الرقم</TableHead>
                            <TableHead>الصف</TableHead>
                            <TableHead>الفصل</TableHead>
                            <TableHead>الحالة</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={selectable ? 6 : 5} className="text-center py-8">
                                    جاري التحميل...
                                </TableCell>
                            </TableRow>
                        ) : filteredStudents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={selectable ? 6 : 5} className="text-center py-8 text-gray-500">
                                    لا توجد نتائج
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredStudents.map((student) => (
                                <TableRow
                                    key={student.id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => !selectable && onSelectStudent?.(student.student_id)}
                                >
                                    {selectable && (
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.has(student.student_id)}
                                                onChange={() => toggleSelectRow(student.student_id)}
                                                className="h-4 w-4 rounded border-gray-300"
                                            />
                                        </TableCell>
                                    )}
                                    <TableCell className="font-medium">{student.full_name_ar}</TableCell>
                                    <TableCell>{student.student_id}</TableCell>
                                    <TableCell>{student.stage}</TableCell>
                                    <TableCell>{student.class}</TableCell>
                                    <TableCell>
                                        <Badge className={getFileStatusColor(student.file_status)}>
                                            {student.file_status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
                <span>عرض {filteredStudents.length} من {students.length} طالب</span>
            </div>
        </div>
    );
};