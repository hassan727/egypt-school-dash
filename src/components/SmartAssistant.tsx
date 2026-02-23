import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, X, AlertCircle, CheckCircle, TrendingDown } from 'lucide-react';

export interface Suggestion {
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    action?: string;
    actionLabel?: string;
    icon?: React.ReactNode;
}

interface SmartAssistantProps {
    suggestions: Suggestion[];
    onActionClick?: (action: string) => void;
    onDismiss?: (id: string) => void;
}

export const SmartAssistant = ({
    suggestions,
    onActionClick,
    onDismiss,
}: SmartAssistantProps) => {
    const [visible, setVisible] = useState(true);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    if (!visible || suggestions.length === 0) {
        return null;
    }

    const visibleSuggestions = suggestions.filter((s) => !dismissed.has(s.id));

    if (visibleSuggestions.length === 0) {
        return null;
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-50 border-red-200';
            case 'medium':
                return 'bg-yellow-50 border-yellow-200';
            case 'low':
                return 'bg-blue-50 border-blue-200';
            default:
                return 'bg-gray-50 border-gray-200';
        }
    };

    const getPriorityBadgeColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'low':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityLabel = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'عالية الأولوية';
            case 'medium':
                return 'متوسطة';
            case 'low':
                return 'منخفضة';
            default:
                return '';
        }
    };

    const handleDismiss = (id: string) => {
        setDismissed(new Set([...dismissed, id]));
        onDismiss?.(id);
    };

    const handleAction = (action?: string) => {
        if (action) {
            onActionClick?.(action);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-600" />
                    <h3 className="font-semibold text-gray-900">المساعد الذكي</h3>
                    <Badge variant="secondary">{visibleSuggestions.length}</Badge>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVisible(false)}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="space-y-2">
                {visibleSuggestions.map((suggestion) => (
                    <Card
                        key={suggestion.id}
                        className={`p-4 border-l-4 ${getPriorityColor(suggestion.priority)}`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    {suggestion.icon && (
                                        <div className="flex-shrink-0">
                                            {suggestion.icon}
                                        </div>
                                    )}
                                    <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
                                    <Badge className={getPriorityBadgeColor(suggestion.priority)}>
                                        {getPriorityLabel(suggestion.priority)}
                                    </Badge>
                                </div>

                                <p className="text-sm text-gray-600">{suggestion.description}</p>

                                {suggestion.action && suggestion.actionLabel && (
                                    <div className="mt-3">
                                        <Button
                                            size="sm"
                                            variant="default"
                                            onClick={() => handleAction(suggestion.action)}
                                        >
                                            {suggestion.actionLabel}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDismiss(suggestion.id)}
                                className="flex-shrink-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

// مولد الاقتراحات الذكية
export const generateSmartSuggestions = (stats: any): Suggestion[] => {
    const suggestions: Suggestion[] = [];

    // اقتراحات مالية
    if (stats?.financial?.paymentRate < 50) {
        suggestions.push({
            id: 'financial-low-payment',
            title: 'معدل دفع منخفض',
            description: `معدل الدفع حالياً ${(stats.financial.paymentRate || 0).toFixed(0)}%، قد تحتاج إلى متابعة الطلاب`,
            priority: 'high',
            action: 'view-financial',
            actionLabel: 'عرض التفاصيل المالية',
            icon: <AlertCircle className="h-4 w-4 text-red-600" />,
        });
    }

    // اقتراحات أكاديمية
    if (stats?.academic?.failingCount > 0) {
        suggestions.push({
            id: 'academic-failing-students',
            title: 'طلاب راسبون',
            description: `هناك ${stats.academic.failingCount} طالب بحاجة إلى متابعة أكاديمية`,
            priority: 'high',
            action: 'view-academic',
            actionLabel: 'عرض الأداء الأكاديمي',
            icon: <TrendingDown className="h-4 w-4 text-red-600" />,
        });
    }

    if ((stats?.academic?.averageGPA || 0) < 2.5) {
        suggestions.push({
            id: 'academic-low-gpa',
            title: 'المعدل الإجمالي منخفض',
            description: `المعدل الإجمالي ${(stats.academic.averageGPA || 0).toFixed(2)}، قد تحتاج إلى تحسين جودة التدريس`,
            priority: 'medium',
            action: 'view-academic',
            actionLabel: 'عرض التقرير الأكاديمي',
            icon: <AlertCircle className="h-4 w-4 text-yellow-600" />,
        });
    }

    // اقتراحات الحضور
    if (stats?.attendance?.attendanceRate < 80) {
        suggestions.push({
            id: 'attendance-low-rate',
            title: 'معدل حضور منخفض',
            description: `معدل الحضور ${(stats.attendance.attendanceRate || 0).toFixed(0)}%، أقل من الحد الأدنى المقبول 80%`,
            priority: 'high',
            action: 'view-attendance',
            actionLabel: 'عرض سجل الحضور',
            icon: <AlertCircle className="h-4 w-4 text-red-600" />,
        });
    }

    // اقتراحات سلوكية
    if (stats?.behavioral?.withIssues > 0) {
        suggestions.push({
            id: 'behavioral-issues',
            title: 'مشاكل سلوكية مسجلة',
            description: `هناك ${stats.behavioral.withIssues} طالب بمشاكل سلوكية، قد تحتاج إلى متابعة`,
            priority: 'medium',
            action: 'view-behavioral',
            actionLabel: 'عرض البيانات السلوكية',
            icon: <AlertCircle className="h-4 w-4 text-yellow-600" />,
        });
    }

    // اقتراح إيجابي
    if (stats?.academic?.passingCount > (stats?.academic?.totalRecords || 1) * 0.9) {
        suggestions.push({
            id: 'academic-success',
            title: 'أداء أكاديمي ممتاز',
            description: `معظم الطلاب ناجحون، استمر في هذا الأداء الممتاز`,
            priority: 'low',
            icon: <CheckCircle className="h-4 w-4 text-green-600" />,
        });
    }

    return suggestions;
};