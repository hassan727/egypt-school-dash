import { Link } from 'react-router-dom';

interface StudentNameLinkProps {
  studentId: string;
  studentName: string;
  className?: string;
}

/**
 * مكون لعرض اسم الطالب كرابط قابل للنقر
 * يوجه إلى صفحة بروفايل الطالب
 */
export const StudentNameLink = ({ studentId, studentName, className = '' }: StudentNameLinkProps) => {
  return (
    <Link
      to={`/student/${studentId}/dashboard`}
      className={`text-blue-600 hover:text-blue-800 hover:underline font-medium ${className}`}
    >
      {studentName}
    </Link>
  );
};