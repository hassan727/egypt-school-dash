import {
    PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, AreaChart, Area,
} from 'recharts';
import { Card } from '@/components/ui/card';

interface ChartData {
    name: string;
    value?: number;
    [key: string]: any;
}

interface PieChartProps {
    data: ChartData[];
    title: string;
    colors?: string[];
}

interface LineChartProps {
    data: ChartData[];
    title: string;
    dataKey: string;
    stroke?: string;
}

interface BarChartProps {
    data: ChartData[];
    title: string;
    dataKey: string;
    fill?: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export const PieChartComponent = ({
    data,
    title,
    colors = COLORS,
}: PieChartProps) => {
    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </Card>
    );
};

export const LineChartComponent = ({
    data,
    title,
    dataKey,
    stroke = '#3b82f6',
}: LineChartProps) => {
    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey={dataKey}
                        stroke={stroke}
                        strokeWidth={2}
                        dot={{ fill: stroke }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
};

export const BarChartComponent = ({
    data,
    title,
    dataKey,
    fill = '#3b82f6',
}: BarChartProps) => {
    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                    />
                    <Legend />
                    <Bar
                        dataKey={dataKey}
                        fill={fill}
                        radius={[8, 8, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </Card>
    );
};

export const AreaChartComponent = ({
    data,
    title,
    dataKey,
    fill = '#3b82f6',
}: BarChartProps) => {
    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={fill} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={fill} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                    />
                    <Legend />
                    <Area
                        type="monotone"
                        dataKey={dataKey}
                        stroke={fill}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </Card>
    );
};

export const MultiLineChart = ({
    data,
    title,
    dataKeys,
    colors = COLORS,
}: {
    data: ChartData[];
    title: string;
    dataKeys: string[];
    colors?: string[];
}) => {
    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
            <ResponsiveContainer width="100%" height={350}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                    />
                    <Legend />
                    {dataKeys.map((key, index) => (
                        <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={colors[index % colors.length]}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
};