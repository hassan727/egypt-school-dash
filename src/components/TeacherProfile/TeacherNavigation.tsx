import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    User,
    DollarSign,
    BookOpen,
    Star,
    Calendar,
    Bell,
    History,
    Briefcase
} from 'lucide-react';

interface TeacherNavigationProps {
    teacherId: string;
    activeSection?: string;
}

/**
 * شريط التنقل بين أقسام بيانات المعلم
 * مصمم بنفس معايير StudentNavigation
 */
export function TeacherNavigation({ teacherId, activeSection }: TeacherNavigationProps) {
    const navItems = [
        {
            path: `/teacher/${teacherId}/dashboard`,
            label: 'لوحة التحكم',
            icon: <Briefcase className="h-4 w-4" />,
            key: 'dashboard'
        },
        {
            path: `/teacher/${teacherId}/basic-data`,
            label: 'البيانات الأساسية',
            icon: <User className="h-4 w-4" />,
            key: 'basic-data'
        },
        {
            path: `/teacher/${teacherId}/financial`,
            label: 'الإدارة المالية',
            icon: <DollarSign className="h-4 w-4" />,
            key: 'financial'
        },
        {
            path: `/teacher/${teacherId}/professional`,
            label: 'المهني والتدريسي',
            icon: <BookOpen className="h-4 w-4" />,
            key: 'professional'
        },
        {
            path: `/teacher/${teacherId}/evaluations`,
            label: 'التقييمات والسلوك',
            icon: <Star className="h-4 w-4" />,
            key: 'evaluations'
        },
        {
            path: `/teacher/${teacherId}/attendance`,
            label: 'الحضور والإجازات',
            icon: <Calendar className="h-4 w-4" />,
            key: 'attendance'
        },
        {
            path: `/teacher/${teacherId}/notifications`,
            label: 'الإشعارات',
            icon: <Bell className="h-4 w-4" />,
            key: 'notifications'
        },
        {
            path: `/teacher/${teacherId}/log`,
            label: 'سجل التغييرات',
            icon: <History className="h-4 w-4" />,
            key: 'log'
        },
    ];

    return (
        <div className="flex flex-wrap gap-2 bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 shadow-sm">
            {navItems.map((item) => (
                <Link key={item.key} to={item.path}>
                    <Button
                        variant={activeSection === item.key ? 'default' : 'outline'}
                        size="sm"
                        className={`gap-2 transition-all duration-200 ${activeSection === item.key
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                            : 'text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'
                            }`}
                    >
                        {item.icon}
                        {item.label}
                    </Button>
                </Link>
            ))}
        </div>
    );
}
