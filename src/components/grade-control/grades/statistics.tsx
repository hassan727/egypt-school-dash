'use client';

import { useData } from '../lib/data-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export function Statistics() {
  const {
    selectedSubject,
    selectedClass,
    categories,
    getStudentsByClass,
    getCategoryAverages,
    getTotalAverage,
  } = useData();

  if (!selectedSubject || !selectedClass) {
    return null;
  }

  const students = getStudentsByClass(selectedClass);

  // Prepare data for category averages chart
  const categoryChartData = categories.map((cat) => {
    const averages = students.map((student) =>
      getCategoryAverages(student.id, selectedSubject).find(
        (avg) => avg.categoryId === cat.id
      )
    );

    const validAverages = averages
      .filter((a) => a !== undefined)
      .map((a) => a!.averageScore);

    const avg =
      validAverages.length > 0
        ? Math.round((validAverages.reduce((a, b) => a + b, 0) / validAverages.length) * 100) / 100
        : 0;

    return {
      name: cat.name.substring(0, 10),
      average: avg,
      max: cat.maxScore,
      percentage: Math.round((avg / cat.maxScore) * 100),
    };
  });

  // Prepare data for student total averages
  const studentChartData = students.map((student) => {
    const totalAvg = getTotalAverage(student.id, selectedSubject);
    return {
      name: student.name.substring(0, 8),
      average: totalAvg?.totalAverage ?? 0,
    };
  });

  // Calculate statistics
  const allAverages = students
    .map((student) => getTotalAverage(student.id, selectedSubject))
    .filter((a) => a !== null)
    .map((a) => a!.totalAverage);

  const classAverage =
    allAverages.length > 0
      ? Math.round((allAverages.reduce((a, b) => a + b, 0) / allAverages.length) * 100) / 100
      : 0;

  const highestScore = allAverages.length > 0 ? Math.max(...allAverages) : 0;
  const lowestScore = allAverages.length > 0 ? Math.min(...allAverages) : 0;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Class Statistics Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground text-right">متوسط الفصل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classAverage.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">من 5.00</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground text-right">أعلى درجة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{highestScore.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">من 5.00</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground text-right">أقل درجة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowestScore.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">من 5.00</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground text-right">عدد الطلاب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground mt-1">طالب / طالبة</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-right">متوسطات الفئات</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => value.toFixed(2)}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '0.5rem',
                  }}
                />
                <Bar dataKey="average" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-right">متوسطات الطلاب</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={studentChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => value.toFixed(2)}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '0.5rem',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="#3b82f6"
                  dot={{ fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
