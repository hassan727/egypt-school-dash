import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface ColumnConfig {
    key: string;
    label: string;
    width?: string;
    sortable?: boolean;
    render?: (value: any, row: any) => React.ReactNode;
    type?: 'text' | 'number' | 'date' | 'status' | 'badge';
}

interface DataGridProps {
    columns: ColumnConfig[];
    data: any[];
    loading?: boolean;
    pageSize?: number;
    sortable?: boolean;
    searchable?: boolean;
    exportable?: boolean;
    onRowClick?: (row: any) => void;
    rowClassName?: (row: any) => string;
}

export const DataGrid = ({
    columns,
    data,
    loading = false,
    pageSize = 10,
    sortable = true,
    searchable = true,
    exportable = false,
    onRowClick,
    rowClassName,
}: DataGridProps) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const sortedData = useMemo(() => {
        if (!sortable || !sortField) return data;

        return [...data].sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];

            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            if (typeof aValue === 'string') {
                return sortDirection === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortField, sortDirection, sortable]);

    const totalPages = Math.ceil(sortedData.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

    const handleSort = (key: string) => {
        if (sortField === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(key);
            setSortDirection('asc');
        }
    };

    const handleExport = () => {
        const headers = columns.map((c) => c.label).join(',');
        const rows = sortedData.map((row) =>
            columns
                .map((col) => {
                    const value = row[col.key];
                    return typeof value === 'string' && value.includes(',')
                        ? `"${value}"`
                        : value;
                })
                .join(',')
        );

        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `data_${new Date().toISOString()}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {exportable && (
                <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="ml-2 h-4 w-4" />
                        تصدير
                    </Button>
                </div>
            )}

            <div className="overflow-x-auto rounded-lg border">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            {columns.map((column) => (
                                <TableHead
                                    key={column.key}
                                    className={`${column.width || ''} ${sortable && column.sortable !== false
                                            ? 'cursor-pointer hover:bg-gray-100'
                                            : ''
                                        }`}
                                    onClick={() => {
                                        if (sortable && column.sortable !== false) {
                                            handleSort(column.key);
                                        }
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{column.label}</span>
                                        {sortable && column.sortable !== false && sortField === column.key && (
                                            <span className="ml-2">
                                                {sortDirection === 'asc' ? '▲' : '▼'}
                                            </span>
                                        )}
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                                    لا توجد بيانات
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedData.map((row, index) => (
                                <TableRow
                                    key={index}
                                    className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''
                                        } ${rowClassName?.(row)}`}
                                    onClick={() => onRowClick?.(row)}
                                >
                                    {columns.map((column) => {
                                        const value = row[column.key];
                                        const renderedValue = column.render
                                            ? column.render(value, row)
                                            : value;

                                        if (column.type === 'status') {
                                            return (
                                                <TableCell key={column.key}>
                                                    <Badge
                                                        variant={
                                                            value === 'نشط' || value === true ? 'default' : 'secondary'
                                                        }
                                                    >
                                                        {value ? 'نشط' : 'معطل'}
                                                    </Badge>
                                                </TableCell>
                                            );
                                        }

                                        if (column.type === 'date') {
                                            return (
                                                <TableCell key={column.key}>
                                                    {new Date(value).toLocaleDateString('ar-EG')}
                                                </TableCell>
                                            );
                                        }

                                        return (
                                            <TableCell key={column.key}>{renderedValue}</TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        الصفحة {currentPage} من {totalPages} ({sortedData.length} صف)
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(
                                (p) => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)
                            )
                            .map((page, index, arr) => (
                                <div key={page}>
                                    {index > 0 && arr[index - 1] !== page - 1 && <span className="px-2">...</span>}
                                    <Button
                                        variant={page === currentPage ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </Button>
                                </div>
                            ))}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};