/**
 * صفحة الجداول الدراسية - نظام الموارد البشرية
 */
import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Plus, Edit, Printer, Download } from 'lucide-react';

const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const periods = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة'];

const mockSchedule = {
    'الأحد': ['رياضيات - 4أ', 'عربي - 5ب', 'علوم - 3أ', 'فراغ', 'رياضيات - 6أ', 'عربي - 4ب'],
    'الاثنين': ['علوم - 4أ', 'رياضيات - 5أ', 'فراغ', 'عربي - 3ب', 'علوم - 6ب', 'رياضيات - 4أ'],
    'الثلاثاء': ['عربي - 4أ', 'فراغ', 'رياضيات - 3أ', 'علوم - 5ب', 'عربي - 6أ', 'علوم - 4ب'],
    'الأربعاء': ['فراغ', 'علوم - 4أ', 'عربي - 5أ', 'رياضيات - 3ب', 'علوم - 6أ', 'عربي - 4أ'],
    'الخميس': ['رياضيات - 4ب', 'عربي - 5أ', 'علوم - 3ب', 'عربي - 4أ', 'فراغ', 'رياضيات - 6ب'],
};

const HRSchedules = () => {
    const [selectedTeacher, setSelectedTeacher] = useState('all');
    const [selectedSemester, setSelectedSemester] = useState('الفصل الأول');

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3"><Calendar className="h-8 w-8 text-indigo-600" />الجداول الدراسية</h1>
                        <p className="text-gray-500">إدارة جداول الحصص للمعلمين</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline"><Printer className="h-4 w-4 ml-2" />طباعة</Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="h-4 w-4 ml-2" />إنشاء جدول</Button>
                    </div>
                </div>

                <Card className="p-4">
                    <div className="flex gap-4">
                        <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                            <SelectTrigger className="w-[200px]"><SelectValue placeholder="اختر المعلم" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">جميع المعلمين</SelectItem>
                                <SelectItem value="1">أحمد محمد</SelectItem>
                                <SelectItem value="2">سارة أحمد</SelectItem>
                                <SelectItem value="3">محمود علي</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="الفصل الأول">الفصل الأول</SelectItem>
                                <SelectItem value="الفصل الثاني">الفصل الثاني</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </Card>

                <Card>
                    <CardHeader><CardTitle>جدول الحصص الأسبوعي</CardTitle></CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="text-center font-bold">الحصة</TableHead>
                                    {days.map(day => <TableHead key={day} className="text-center font-bold">{day}</TableHead>)}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {periods.map((period, idx) => (
                                    <TableRow key={period}>
                                        <TableCell className="text-center font-semibold bg-gray-50">{period}</TableCell>
                                        {days.map(day => (
                                            <TableCell key={day} className="text-center">
                                                {mockSchedule[day as keyof typeof mockSchedule][idx] === 'فراغ' ? (
                                                    <Badge variant="outline" className="bg-gray-100">فراغ</Badge>
                                                ) : (
                                                    <Badge className="bg-indigo-100 text-indigo-800">{mockSchedule[day as keyof typeof mockSchedule][idx]}</Badge>
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-3 gap-4">
                    <Card className="p-4 bg-indigo-50"><div className="text-center"><p className="text-3xl font-bold text-indigo-600">24</p><p className="text-sm text-indigo-600">إجمالي الحصص</p></div></Card>
                    <Card className="p-4 bg-green-50"><div className="text-center"><p className="text-3xl font-bold text-green-600">18</p><p className="text-sm text-green-600">حصص فعلية</p></div></Card>
                    <Card className="p-4 bg-gray-50"><div className="text-center"><p className="text-3xl font-bold text-gray-600">6</p><p className="text-sm text-gray-600">فترات فراغ</p></div></Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default HRSchedules;
