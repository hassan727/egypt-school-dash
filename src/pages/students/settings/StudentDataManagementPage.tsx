/**
 * StudentDataManagementPage - صفحة إدارة بيانات الطلاب
 * Redirects to the main students list with management capabilities
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function StudentDataManagementPage() {
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect to the main students list
        navigate('/students/list', { replace: true });
    }, [navigate]);

    return null;
}
