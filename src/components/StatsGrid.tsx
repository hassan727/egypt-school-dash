import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, AlertCircle, DollarSign, Calendar } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/utils/helpers';

interface StatItem {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    icon?: React.ReactNode;
    color?: string;
}

interface StatsGridProps {
    stats: StatItem[];
    columns?: 2 | 3 | 4;
    loading?: boolean;
}

export const StatsGrid = ({ stats, columns = 4, loading = false }: StatsGridProps) => {
    const getGridClass = () => {
        switch (columns) {
            case 2:
                return 'sm:grid-cols-2';
            case 3:
                return 'sm:grid-cols-2 lg:grid-cols-3';
            case 4:
                return 'sm:grid-cols-2 lg:grid-cols-4';
            default:
                return 'sm:grid-cols-2 lg:grid-cols-4';
        }
    };

    const getColorClass = (color?: string) => {
        const colorMap: Record<string, string> = {
            'blue': 'bg-blue-50 text-blue-700',
            'green': 'bg-green-50 text-green-700',
            'red': 'bg-red-50 text-red-700',
            'yellow': 'bg-yellow-50 text-yellow-700',
            'purple': 'bg-purple-50 text-purple-700',
            'indigo': 'bg-indigo-50 text-indigo-700',
        };
        return colorMap[color || 'blue'] || colorMap['blue'];
    };

    if (loading) {
        return (
            <div className={`grid grid-cols-1 gap-4 ${getGridClass()}`}>
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-4 w-24"></div>
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className={`grid grid-cols-1 gap-4 ${getGridClass()}`}>
            {stats.map((stat, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>

                            {stat.trendValue && stat.trend && (
                                <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${stat.trend === 'up' ? 'text-green-600' :
                                        stat.trend === 'down' ? 'text-red-600' :
                                            'text-gray-600'
                                    }`}>
                                    {stat.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                                    {stat.trend === 'down' && <TrendingDown className="h-3 w-3" />}
                                    {stat.trendValue}
                                </div>
                            )}
                        </div>

                        {stat.icon && (
                            <div className={`p-3 rounded-lg ${getColorClass(stat.color)}`}>
                                {stat.icon}
                            </div>
                        )}
                    </div>
                </Card>
            ))}
        </div>
    );
};

// Predefined stat card generators
export const createStudentStat = (count: number, label: string = 'الطلاب') => ({
    label,
    value: count,
    icon: <Users className="h-5 w-5" />,
    color: 'blue',
});

export const createFinancialStat = (amount: number, label: string = 'المستحقات') => ({
    label,
    value: formatCurrency(amount),
    icon: <DollarSign className="h-5 w-5" />,
    color: 'green',
});

export const createAttendanceStat = (percentage: number, label: string = 'الحضور') => ({
    label,
    value: formatPercentage(percentage),
    icon: <Calendar className="h-5 w-5" />,
    color: 'indigo',
});

export const createAlertStat = (count: number, label: string = 'تنبيهات') => ({
    label,
    value: count,
    icon: <AlertCircle className="h-5 w-5" />,
    color: 'red',
});