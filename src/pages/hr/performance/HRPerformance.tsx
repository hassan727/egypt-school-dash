/**
 * صفحة تقييم الأداء - نظام الموارد البشرية
 */
import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Star, Search, Plus, Eye, TrendingUp, Award, Users } from 'lucide-react';

const mockEvaluations = [
    { id: '1', employee: 'أحمد محمد', type: 'معلم', period: '2023-2024', score: 92, rating: 'ممتاز', status: 'معتمد' },
    { id: '2', employee: 'سارة أحمد', type: 'إداري', period: '2023-2024', score: 85, rating: 'جيد جداً', status: 'معتمد' },
    { id: '3', employee: 'محمود علي', type: 'معلم', period: '2023-2024', score: 78, rating: 'جيد', status: 'مسودة' },
];

const HRPerformance = () => {
    const [evaluations] = useState(mockEvaluations);
    const [searchQuery, setSearchQuery] = useState('');

    const getRatingBadge = (rating: string) => {
        const styles: Record<string, string> = { 'ممتاز': 'bg-green-100 text-green-800', 'جيد جداً': 'bg-blue-100 text-blue-800', 'جيد': 'bg-yellow-100 text-yellow-800', 'مقبول': 'bg-orange-100 text-orange-800', 'ضعيف': 'bg-red-100 text-red-800' };
        return styles[rating] || 'bg-gray-100';
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 80) return 'text-blue-600';
        if (score >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    const avgScore = Math.round(evaluations.reduce((s, e) => s + e.score, 0) / evaluations.length);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3"><Star className="h-8 w-8 text-amber-500" />تقييم الأداء</h1>
                        <p className="text-gray-500">متابعة تقييمات الموظفين</p>
                    </div>
                    <Button className="bg-amber-500 hover:bg-amber-600"><Plus className="h-4 w-4 ml-2" />تقييم جديد</Button>
                </div>

                <div className="grid grid-cols-4 gap-4">
                    <Card className="p-4 bg-amber-50"><div className="flex items-center gap-3"><Star className="h-8 w-8 text-amber-500" /><div><p className="text-sm text-amber-600">متوسط التقييم</p><p className="text-2xl font-bold">{avgScore}%</p></div></div></Card>
                    <Card className="p-4 bg-green-50"><div className="flex items-center gap-3"><Award className="h-8 w-8 text-green-600" /><div><p className="text-sm text-green-600">ممتاز</p><p className="text-2xl font-bold">{evaluations.filter(e => e.rating === 'ممتاز').length}</p></div></div></Card>
                    <Card className="p-4 bg-blue-50"><div className="flex items-center gap-3"><TrendingUp className="h-8 w-8 text-blue-600" /><div><p className="text-sm text-blue-600">جيد جداً</p><p className="text-2xl font-bold">{evaluations.filter(e => e.rating === 'جيد جداً').length}</p></div></div></Card>
                    <Card className="p-4 bg-gray-50"><div className="flex items-center gap-3"><Users className="h-8 w-8 text-gray-600" /><div><p className="text-sm text-gray-600">إجمالي</p><p className="text-2xl font-bold">{evaluations.length}</p></div></div></Card>
                </div>

                <Card className="p-4">
                    <div className="flex gap-4">
                        <div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10" /></div>
                        <Select defaultValue="2023-2024"><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="2023-2024">2023-2024</SelectItem><SelectItem value="2022-2023">2022-2023</SelectItem></SelectContent></Select>
                    </div>
                </Card>

                <Card>
                    <Table>
                        <TableHeader><TableRow className="bg-gray-50"><TableHead>الموظف</TableHead><TableHead>النوع</TableHead><TableHead>الفترة</TableHead><TableHead>الدرجة</TableHead><TableHead>التقدير</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {evaluations.map(e => (
                                <TableRow key={e.id}>
                                    <TableCell className="font-semibold">{e.employee}</TableCell>
                                    <TableCell><Badge variant="outline">{e.type}</Badge></TableCell>
                                    <TableCell>{e.period}</TableCell>
                                    <TableCell><div className="flex items-center gap-2"><span className={`font-bold ${getScoreColor(e.score)}`}>{e.score}%</span><Progress value={e.score} className="w-20 h-2" /></div></TableCell>
                                    <TableCell><Badge className={getRatingBadge(e.rating)}>{e.rating}</Badge></TableCell>
                                    <TableCell><Badge variant="outline">{e.status}</Badge></TableCell>
                                    <TableCell><Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default HRPerformance;
