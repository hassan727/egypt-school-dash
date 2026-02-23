/**
 * Finance Navigation Component - شريط التنقل المالي
 * Unified navigation for all finance pages with quick stats
 */

import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    TrendingUp,
    TrendingDown,
    Wallet,
    Users,
    Receipt,
    PiggyBank,
    BarChart3,
    ArrowLeft,
    RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NavItem {
    path: string;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeColor?: string;
}

interface FinanceNavigationProps {
    summary?: {
        totalRevenue?: number;
        totalExpenses?: number;
        pendingSalaries?: number;
        overdueStudents?: number;
    };
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

export function FinanceNavigation({
    summary,
    onRefresh,
    isRefreshing = false,
}: FinanceNavigationProps) {
    const location = useLocation();
    const currentPath = location.pathname;

    const navItems: NavItem[] = [
        {
            path: '/finance',
            label: 'لوحة التحكم',
            icon: <LayoutDashboard className="h-4 w-4" />,
        },
        {
            path: '/finance/revenue',
            label: 'الإيرادات',
            icon: <TrendingUp className="h-4 w-4" />,
        },
        {
            path: '/finance/expenses',
            label: 'المصروفات',
            icon: <TrendingDown className="h-4 w-4" />,
        },
        {
            path: '/finance/salaries',
            label: 'الرواتب',
            icon: <Wallet className="h-4 w-4" />,
            badge: summary?.pendingSalaries,
            badgeColor: 'bg-orange-100 text-orange-700',
        },
        {
            path: '/finance/receivables',
            label: 'المستحقات',
            icon: <Users className="h-4 w-4" />,
            badge: summary?.overdueStudents,
            badgeColor: 'bg-red-100 text-red-700',
        },
    ];

    const quickStats = [
        {
            label: 'الإيرادات',
            value: summary?.totalRevenue || 0,
            icon: <TrendingUp className="h-3 w-3" />,
            color: 'text-green-600',
        },
        {
            label: 'المصروفات',
            value: summary?.totalExpenses || 0,
            icon: <TrendingDown className="h-3 w-3" />,
            color: 'text-red-600',
        },
    ];

    return (
        <div className="bg-white border-b sticky top-0 z-10">
            {/* Navigation Links */}
            <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-1">
                    {/* Back to Main Dashboard */}
                    <Link to="/">
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                            <ArrowLeft className="h-4 w-4 ml-1" />
                            الرئيسية
                        </Button>
                    </Link>

                    <div className="h-6 w-px bg-gray-200 mx-2" />

                    {/* Finance Navigation Items */}
                    <nav className="flex items-center gap-1">
                        {navItems.map((item) => (
                            <Link key={item.path} to={item.path}>
                                <Button
                                    variant={currentPath === item.path ? 'default' : 'ghost'}
                                    size="sm"
                                    className={cn(
                                        'gap-2 transition-all',
                                        currentPath === item.path
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    )}
                                >
                                    {item.icon}
                                    <span className="hidden md:inline">{item.label}</span>
                                    {item.badge !== undefined && item.badge > 0 && (
                                        <Badge
                                            variant="secondary"
                                            className={cn(
                                                'text-xs px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center',
                                                item.badgeColor || 'bg-gray-100 text-gray-700'
                                            )}
                                        >
                                            {item.badge}
                                        </Badge>
                                    )}
                                </Button>
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Quick Stats & Refresh */}
                <div className="flex items-center gap-4">
                    {/* Quick Stats (Desktop only) */}
                    <div className="hidden lg:flex items-center gap-4">
                        {quickStats.map((stat, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                                <span className={cn('flex items-center gap-1', stat.color)}>
                                    {stat.icon}
                                    {stat.label}:
                                </span>
                                <span className="font-semibold">
                                    {stat.value.toLocaleString()} ج.م
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Refresh Button */}
                    {onRefresh && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            className="gap-2"
                        >
                            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                            <span className="hidden md:inline">تحديث</span>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Finance Quick Actions Component
 * Quick action buttons for common finance operations
 */
interface QuickAction {
    label: string;
    icon: React.ReactNode;
    onClick?: () => void;
    href?: string;
    variant?: 'default' | 'outline' | 'secondary' | 'destructive';
    className?: string;
}

interface FinanceQuickActionsProps {
    actions: QuickAction[];
}

export function FinanceQuickActions({ actions }: FinanceQuickActionsProps) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            {actions.map((action, idx) => {
                const ButtonComponent = (
                    <Button
                        key={idx}
                        variant={action.variant || 'outline'}
                        size="sm"
                        onClick={action.onClick}
                        className={cn('gap-2', action.className)}
                    >
                        {action.icon}
                        {action.label}
                    </Button>
                );

                if (action.href) {
                    return (
                        <Link key={idx} to={action.href}>
                            {ButtonComponent}
                        </Link>
                    );
                }

                return ButtonComponent;
            })}
        </div>
    );
}

/**
 * Finance Summary Cards Component
 * Quick summary cards for finance overview
 */
interface SummaryCard {
    title: string;
    value: number | string;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: {
        value: number;
        direction: 'up' | 'down';
    };
    color: string;
    href?: string;
}

interface FinanceSummaryCardsProps {
    cards: SummaryCard[];
}

export function FinanceSummaryCards({ cards }: FinanceSummaryCardsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map((card, idx) => {
                const CardContent = (
                    <div
                        className={cn(
                            'p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer',
                            `bg-gradient-to-br ${card.color}`
                        )}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm opacity-80">{card.title}</p>
                                <p className="text-xl font-bold mt-1">
                                    {typeof card.value === 'number'
                                        ? card.value.toLocaleString()
                                        : card.value}
                                </p>
                                {card.subtitle && (
                                    <p className="text-xs opacity-70 mt-1">{card.subtitle}</p>
                                )}
                            </div>
                            <div className="p-2 rounded-lg bg-white/20">
                                {card.icon}
                            </div>
                        </div>
                        {card.trend && (
                            <div className="flex items-center gap-1 mt-2 text-xs">
                                {card.trend.direction === 'up' ? (
                                    <TrendingUp className="h-3 w-3" />
                                ) : (
                                    <TrendingDown className="h-3 w-3" />
                                )}
                                <span>
                                    {card.trend.direction === 'up' ? '+' : '-'}
                                    {Math.abs(card.trend.value)}%
                                </span>
                            </div>
                        )}
                    </div>
                );

                if (card.href) {
                    return (
                        <Link key={idx} to={card.href}>
                            {CardContent}
                        </Link>
                    );
                }

                return <div key={idx}>{CardContent}</div>;
            })}
        </div>
    );
}

export default FinanceNavigation;
