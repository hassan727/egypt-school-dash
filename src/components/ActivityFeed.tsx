import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/utils/helpers';
import { Activity, AlertCircle, CheckCircle, Clock, User } from 'lucide-react';

export interface Activity {
    id: string;
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    description?: string;
    timestamp: string;
    user?: string;
    icon?: React.ReactNode;
}

interface ActivityFeedProps {
    activities: Activity[];
    maxItems?: number;
    showTimestamp?: boolean;
    loading?: boolean;
}

export const ActivityFeed = ({
    activities,
    maxItems = 5,
    showTimestamp = true,
    loading = false,
}: ActivityFeedProps) => {
    const getActivityColor = (type: string) => {
        switch (type) {
            case 'success':
                return 'bg-green-50 border-green-200';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200';
            case 'error':
                return 'bg-red-50 border-red-200';
            case 'info':
                return 'bg-blue-50 border-blue-200';
            default:
                return 'bg-gray-50 border-gray-200';
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'warning':
                return <AlertCircle className="h-5 w-5 text-yellow-600" />;
            case 'error':
                return <AlertCircle className="h-5 w-5 text-red-600" />;
            case 'info':
                return <Activity className="h-5 w-5 text-blue-600" />;
            default:
                return <Clock className="h-5 w-5 text-gray-600" />;
        }
    };

    const getBadgeVariant = (type: string) => {
        switch (type) {
            case 'success':
                return 'bg-green-100 text-green-800';
            case 'warning':
                return 'bg-yellow-100 text-yellow-800';
            case 'error':
                return 'bg-red-100 text-red-800';
            case 'info':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">الأنشطة الحديثة</h3>
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                </div>
            </Card>
        );
    }

    const displayActivities = activities.slice(0, maxItems);

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">الأنشطة الحديثة</h3>
                {activities.length > 0 && (
                    <Badge variant="outline">{activities.length} نشاط</Badge>
                )}
            </div>

            <div className="space-y-3">
                {displayActivities.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">لا توجد أنشطة حديثة</p>
                ) : (
                    displayActivities.map((activity) => (
                        <div
                            key={activity.id}
                            className={`flex gap-3 p-3 rounded-lg border ${getActivityColor(activity.type)}`}
                        >
                            <div className="flex-shrink-0 pt-0.5">
                                {activity.icon || getActivityIcon(activity.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-medium text-sm text-gray-900">
                                            {activity.title}
                                        </p>
                                        {activity.description && (
                                            <p className="text-xs text-gray-600 mt-1">
                                                {activity.description}
                                            </p>
                                        )}
                                    </div>
                                    <Badge className={getBadgeVariant(activity.type)}>
                                        {activity.type === 'success' ? 'نجح' :
                                            activity.type === 'warning' ? 'تحذير' :
                                                activity.type === 'error' ? 'خطأ' : 'معلومة'}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                                    {activity.user && (
                                        <span className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {activity.user}
                                        </span>
                                    )}
                                    {showTimestamp && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatDateTime(activity.timestamp)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {activities.length > maxItems && (
                <div className="mt-4 text-center">
                    <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                        عرض جميع الأنشطة ({activities.length})
                    </a>
                </div>
            )}
        </Card>
    );
};