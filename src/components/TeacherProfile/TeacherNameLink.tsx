import { Link } from 'react-router-dom';

interface TeacherNameLinkProps {
    teacherId: string;
    teacherName: string;
    className?: string;
}

/**
 * مكون لعرض اسم المعلم كرابط قابل للنقر
 * يوجه إلى صفحة بروفايل المعلم
 */
export const TeacherNameLink = ({ teacherId, teacherName, className = '' }: TeacherNameLinkProps) => {
    return (
        <Link
            to={`/teacher/${teacherId}/dashboard`}
            className={`text-blue-600 hover:text-blue-800 hover:underline font-medium ${className}`}
        >
            {teacherName}
        </Link>
    );
};
