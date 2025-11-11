import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';

interface StudentNavigationProps {
    studentId: string;
}

/**
 * شريط التنقل بين أقسام بيانات الطالب
 */
export function StudentNavigation({ studentId }: StudentNavigationProps) {
    return (
        <div className="flex flex-wrap gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <Link to={`/student/${studentId}/dashboard`}>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                >
                    🏠 الرئيسية
                </Button>
            </Link>
            <Link to={`/student/${studentId}/basic-data`}>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                >
                    👤 البيانات الأساسية
                </Button>
            </Link>
            <Link to={`/student/${studentId}/financial-management`}>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                >
                    💰 الإدارة المالية
                </Button>
            </Link>
            <Link to={`/student/${studentId}/academic-management`}>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                >
                    📊 الإدارة الأكاديمية
                </Button>
            </Link>
            <Link to={`/student/${studentId}/attendance-management`}>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                >
                    📅 إدارة الحضور
                </Button>
            </Link>
            <Link to={`/student/${studentId}/behavioral-management`}>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                >
                    ⭐ الإدارة السلوكية
                </Button>
            </Link>
            <Link to={`/student/${studentId}/log`}>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                >
                    <History className="h-4 w-4" />
                    السجل
                </Button>
            </Link>
        </div>
    );
}