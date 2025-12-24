import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { StudentProfile } from '@/types/student';

interface BatchOperation {
    id: string;
    studentIds: string[];
    operationType: 'transfer' | 'statusUpdate' | 'assignAdvisor' | 'importData' | 'sendNotification' | 'printDocuments' | 'toggleAccounts' | 'recordAttendance' | 'promoteYear' | 'deleteArchive' | 'linkActivity' | 'copyData' | 'delete' | 'update' | 'export' | 'import';
    dataType: string;
    changes: Record<string, unknown>;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    errorMessage?: string;
    createdAt: Date;
    completedAt?: Date;
    undoData?: Record<string, unknown>;
    operationName: string;
    performedBy?: string;
    classId?: string;
    newClassId?: string;
}

interface BatchOperationSnapshot {
    operationId: string;
    studentIds: string[];
    previousData: Array<Record<string, unknown>>;
    timestamp: Date;
}

export function useBatchOperations() {
    const [operations, setOperations] = useState<BatchOperation[]>([]);
    const [activeOperation, setActiveOperation] = useState<BatchOperation | null>(null);
    const [snapshots, setSnapshots] = useState<BatchOperationSnapshot[]>([]);

    const generateOperationId = () => Math.random().toString(36).substr(2, 9);

    const createSnapshot = async (studentIds: string[], operationId: string) => {
        try {
            const { data } = await supabase
                .from('students')
                .select('*')
                .in('student_id', studentIds);

            if (data) {
                setSnapshots(prev => [...prev, {
                    operationId,
                    studentIds,
                    previousData: data,
                    timestamp: new Date(),
                }]);
            }
        } catch (err) {
            console.error('فشل إنشاء لقطة:', err);
        }
    };

    const logAuditTrail = async (operationId: string, operationType: string, details: Record<string, unknown>) => {
        try {
            await supabase
                .from('batch_operation_audit_log')
                .insert([{
                    operation_id: operationId,
                    operation_type: operationType,
                    student_count: details.studentCount,
                    performed_by: details.performedBy,
                    details: JSON.stringify(details),
                    created_at: new Date().toISOString(),
                }]);
        } catch (err) {
            console.error('فشل تسجيل سجل التدقيق:', err);
        }
    };

    const updateOperationProgress = (operationId: string, progress: number) => {
        setOperations(prev => prev.map(op =>
            op.id === operationId ? { ...op, progress } : op
        ));
    };

    // 1. نقل الطلاب إلى فصل دراسي جديد
    const batchTransferToClass = async (
        studentIds: string[],
        newClassId: string,
        newStage: string
    ): Promise<BatchOperation> => {
        const operationId = generateOperationId();
        const operation: BatchOperation = {
            id: operationId,
            studentIds,
            operationType: 'transfer',
            dataType: 'ClassTransfer',
            changes: { class: newClassId, stage: newStage },
            status: 'processing',
            progress: 0,
            createdAt: new Date(),
            operationName: 'نقل الطلاب إلى فصل جديد',
            newClassId,
        };

        setOperations(prev => [...prev, operation]);
        setActiveOperation(operation);
        await createSnapshot(studentIds, operationId);

        try {
            const totalStudents = studentIds.length;
            let processed = 0;

            for (const studentId of studentIds) {
                const { error } = await supabase
                    .from('students')
                    .update({ class: newClassId, stage: newStage })
                    .eq('student_id', studentId);

                if (error) throw error;
                processed++;
                updateOperationProgress(operationId, Math.round((processed / totalStudents) * 100));
            }

            await logAuditTrail(operationId, 'transfer', {
                studentCount: totalStudents,
                newClass: newClassId,
                newStage,
            });

            const completedOp: BatchOperation = { ...operation, status: 'completed', progress: 100, completedAt: new Date() };
            setOperations(prev => prev.map(op => op.id === operationId ? completedOp : op));
            setActiveOperation(completedOp);
            return completedOp;
        } catch (err) {
            const failedOp = { ...operation, status: 'failed' as const, errorMessage: err instanceof Error ? err.message : 'خطأ' };
            setOperations(prev => prev.map(op => op.id === operationId ? failedOp : op));
            throw err;
        }
    };

    // 2. تحديث حالة الطالب الدراسية
    const batchUpdateStudentStatus = async (
        studentIds: string[],
        newStatus: 'نشط' | 'منقطع' | 'موقوف' | 'منقول' | 'متخرج'
    ): Promise<BatchOperation> => {
        const operationId = generateOperationId();
        const operation: BatchOperation = {
            id: operationId,
            studentIds,
            operationType: 'statusUpdate',
            dataType: 'StudentStatus',
            changes: { status: newStatus },
            status: 'processing',
            progress: 0,
            createdAt: new Date(),
            operationName: `تحديث الحالة إلى: ${newStatus}`,
        };

        setOperations(prev => [...prev, operation]);
        setActiveOperation(operation);
        await createSnapshot(studentIds, operationId);

        try {
            const totalStudents = studentIds.length;
            let processed = 0;

            for (const studentId of studentIds) {
                const { error } = await supabase
                    .from('students')
                    .update({ enrollment_status: newStatus })
                    .eq('student_id', studentId);

                if (error) throw error;
                processed++;
                updateOperationProgress(operationId, Math.round((processed / totalStudents) * 100));
            }

            await logAuditTrail(operationId, 'statusUpdate', { studentCount: totalStudents, newStatus });

            const completedOp = { ...operation, status: 'completed' as const, progress: 100, completedAt: new Date() };
            setOperations(prev => prev.map(op => op.id === operationId ? completedOp : op));
            setActiveOperation(completedOp);
            return completedOp;
        } catch (err) {
            const failedOp = { ...operation, status: 'failed' as const, errorMessage: err instanceof Error ? err.message : 'خطأ' };
            setOperations(prev => prev.map(op => op.id === operationId ? failedOp : op));
            throw err;
        }
    };

    // 3. تعيين مرشد أكاديمي
    const batchAssignAdvisor = async (
        studentIds: string[],
        advisorId: string
    ): Promise<BatchOperation> => {
        const operationId = generateOperationId();
        const operation: BatchOperation = {
            id: operationId,
            studentIds,
            operationType: 'assignAdvisor',
            dataType: 'AdvisorAssignment',
            changes: { advisor_id: advisorId },
            status: 'processing',
            progress: 0,
            createdAt: new Date(),
            operationName: 'تعيين مرشد أكاديمي',
        };

        setOperations(prev => [...prev, operation]);
        setActiveOperation(operation);
        await createSnapshot(studentIds, operationId);

        try {
            const totalStudents = studentIds.length;
            let processed = 0;

            for (const studentId of studentIds) {
                const { error } = await supabase
                    .from('students')
                    .update({ advisor_id: advisorId })
                    .eq('student_id', studentId);

                if (error) throw error;
                processed++;
                updateOperationProgress(operationId, Math.round((processed / totalStudents) * 100));
            }

            await logAuditTrail(operationId, 'assignAdvisor', { studentCount: totalStudents, advisorId });

            const completedOp = { ...operation, status: 'completed' as const, progress: 100, completedAt: new Date() };
            setOperations(prev => prev.map(op => op.id === operationId ? completedOp : op));
            setActiveOperation(completedOp);
            return completedOp;
        } catch (err) {
            const failedOp = { ...operation, status: 'failed' as const, errorMessage: err instanceof Error ? err.message : 'خطأ' };
            setOperations(prev => prev.map(op => op.id === operationId ? failedOp : op));
            throw err;
        }
    };

    // 4. تحديث البيانات الأساسية من ملف
    const batchImportData = async (
        studentIds: string[],
        importData: Record<string, Record<string, unknown>>
    ): Promise<BatchOperation> => {
        const operationId = generateOperationId();
        const operation: BatchOperation = {
            id: operationId,
            studentIds,
            operationType: 'importData',
            dataType: 'BulkImport',
            changes: importData,
            status: 'processing',
            progress: 0,
            createdAt: new Date(),
            operationName: 'استيراد البيانات الأساسية',
        };

        setOperations(prev => [...prev, operation]);
        setActiveOperation(operation);
        await createSnapshot(studentIds, operationId);

        try {
            const totalStudents = studentIds.length;
            let processed = 0;

            for (const studentId of studentIds) {
                const studentData = importData[studentId];
                if (studentData) {
                    const { error } = await supabase
                        .from('students')
                        .update(studentData)
                        .eq('student_id', studentId);

                    if (error) throw error;
                }
                processed++;
                updateOperationProgress(operationId, Math.round((processed / totalStudents) * 100));
            }

            await logAuditTrail(operationId, 'importData', { studentCount: totalStudents });

            const completedOp = { ...operation, status: 'completed' as const, progress: 100, completedAt: new Date() };
            setOperations(prev => prev.map(op => op.id === operationId ? completedOp : op));
            setActiveOperation(completedOp);
            return completedOp;
        } catch (err) {
            const failedOp = { ...operation, status: 'failed' as const, errorMessage: err instanceof Error ? err.message : 'خطأ' };
            setOperations(prev => prev.map(op => op.id === operationId ? failedOp : op));
            throw err;
        }
    };

    // 5. إرسال إشعارات جماعية
    const batchSendNotifications = async (
        studentIds: string[],
        message: string,
        recipients: 'students' | 'guardians' | 'both'
    ): Promise<BatchOperation> => {
        const operationId = generateOperationId();
        const operation: BatchOperation = {
            id: operationId,
            studentIds,
            operationType: 'sendNotification',
            dataType: 'BulkNotification',
            changes: { message, recipients },
            status: 'processing',
            progress: 0,
            createdAt: new Date(),
            operationName: 'إرسال إشعارات جماعية',
        };

        setOperations(prev => [...prev, operation]);
        setActiveOperation(operation);

        try {
            const totalStudents = studentIds.length;
            let processed = 0;

            for (const studentId of studentIds) {
                const { error } = await supabase
                    .from('notifications')
                    .insert({
                        student_id: studentId,
                        message,
                        recipient_type: recipients,
                        created_at: new Date().toISOString(),
                    });

                if (error) throw error;
                processed++;
                updateOperationProgress(operationId, Math.round((processed / totalStudents) * 100));
            }

            await logAuditTrail(operationId, 'sendNotification', { studentCount: totalStudents, recipients });

            const completedOp = { ...operation, status: 'completed' as const, progress: 100, completedAt: new Date() };
            setOperations(prev => prev.map(op => op.id === operationId ? completedOp : op));
            setActiveOperation(completedOp);
            return completedOp;
        } catch (err) {
            const failedOp = { ...operation, status: 'failed' as const, errorMessage: err instanceof Error ? err.message : 'خطأ' };
            setOperations(prev => prev.map(op => op.id === operationId ? failedOp : op));
            throw err;
        }
    };

    // 6. طباعة مستندات جماعية
    const batchPrintDocuments = async (
        studentIds: string[],
        documentType: 'cards' | 'registration' | 'attendance' | 'certificates'
    ): Promise<BatchOperation> => {
        const operationId = generateOperationId();
        const operation: BatchOperation = {
            id: operationId,
            studentIds,
            operationType: 'printDocuments',
            dataType: 'BulkPrint',
            changes: { documentType },
            status: 'processing',
            progress: 0,
            createdAt: new Date(),
            operationName: `طباعة ${documentType}`,
        };

        setOperations(prev => [...prev, operation]);
        setActiveOperation(operation);

        try {
            await logAuditTrail(operationId, 'printDocuments', { studentCount: studentIds.length, documentType });

            const completedOp = { ...operation, status: 'completed' as const, progress: 100, completedAt: new Date() };
            setOperations(prev => prev.map(op => op.id === operationId ? completedOp : op));
            setActiveOperation(completedOp);
            return completedOp;
        } catch (err) {
            const failedOp = { ...operation, status: 'failed' as const, errorMessage: err instanceof Error ? err.message : 'خطأ' };
            setOperations(prev => prev.map(op => op.id === operationId ? failedOp : op));
            throw err;
        }
    };

    // 7. تفعيل/تعطيل الحسابات الرقمية
    const batchToggleAccounts = async (
        studentIds: string[],
        enabled: boolean
    ): Promise<BatchOperation> => {
        const operationId = generateOperationId();
        const operation: BatchOperation = {
            id: operationId,
            studentIds,
            operationType: 'toggleAccounts',
            dataType: 'AccountToggle',
            changes: { account_enabled: enabled },
            status: 'processing',
            progress: 0,
            createdAt: new Date(),
            operationName: enabled ? 'تفعيل الحسابات' : 'تعطيل الحسابات',
        };

        setOperations(prev => [...prev, operation]);
        setActiveOperation(operation);
        await createSnapshot(studentIds, operationId);

        try {
            const totalStudents = studentIds.length;
            let processed = 0;

            for (const studentId of studentIds) {
                const { error } = await supabase
                    .from('students')
                    .update({ account_enabled: enabled })
                    .eq('student_id', studentId);

                if (error) throw error;
                processed++;
                updateOperationProgress(operationId, Math.round((processed / totalStudents) * 100));
            }

            await logAuditTrail(operationId, 'toggleAccounts', { studentCount: totalStudents, enabled });

            const completedOp = { ...operation, status: 'completed' as const, progress: 100, completedAt: new Date() };
            setOperations(prev => prev.map(op => op.id === operationId ? completedOp : op));
            setActiveOperation(completedOp);
            return completedOp;
        } catch (err) {
            const failedOp = { ...operation, status: 'failed' as const, errorMessage: err instanceof Error ? err.message : 'خطأ' };
            setOperations(prev => prev.map(op => op.id === operationId ? failedOp : op));
            throw err;
        }
    };

    // 8. تسجيل الحضور جماعياً
    const batchRecordAttendance = async (
        studentIds: string[],
        date: string,
        status: 'حاضر' | 'غائب' | 'متأخر' | 'معذور'
    ): Promise<BatchOperation> => {
        const operationId = generateOperationId();
        const operation: BatchOperation = {
            id: operationId,
            studentIds,
            operationType: 'recordAttendance',
            dataType: 'BulkAttendance',
            changes: { date, status },
            status: 'processing',
            progress: 0,
            createdAt: new Date(),
            operationName: `تسجيل حضور جماعي - ${status}`,
        };

        setOperations(prev => [...prev, operation]);
        setActiveOperation(operation);
        await createSnapshot(studentIds, operationId);

        try {
            const totalStudents = studentIds.length;
            let processed = 0;

            for (const studentId of studentIds) {
                const { error } = await supabase
                    .from('attendance_records')
                    .insert({
                        student_id: studentId,
                        date,
                        status,
                        created_at: new Date().toISOString(),
                    });

                if (error) throw error;
                processed++;
                updateOperationProgress(operationId, Math.round((processed / totalStudents) * 100));
            }

            await logAuditTrail(operationId, 'recordAttendance', { studentCount: totalStudents, date, status });

            const completedOp = { ...operation, status: 'completed' as const, progress: 100, completedAt: new Date() };
            setOperations(prev => prev.map(op => op.id === operationId ? completedOp : op));
            setActiveOperation(completedOp);
            return completedOp;
        } catch (err) {
            const failedOp = { ...operation, status: 'failed' as const, errorMessage: err instanceof Error ? err.message : 'خطأ' };
            setOperations(prev => prev.map(op => op.id === operationId ? failedOp : op));
            throw err;
        }
    };

    // 9. ترقية جماعية للسنة الدراسية التالية
    const batchPromoteYear = async (
        studentIds: string[],
        newStage: string,
        newAcademicYear: string
    ): Promise<BatchOperation> => {
        const operationId = generateOperationId();
        const operation: BatchOperation = {
            id: operationId,
            studentIds,
            operationType: 'promoteYear',
            dataType: 'YearPromotion',
            changes: { stage: newStage, academic_year: newAcademicYear },
            status: 'processing',
            progress: 0,
            createdAt: new Date(),
            operationName: `ترقية إلى ${newStage} - ${newAcademicYear}`,
        };

        setOperations(prev => [...prev, operation]);
        setActiveOperation(operation);
        await createSnapshot(studentIds, operationId);

        try {
            const totalStudents = studentIds.length;
            let processed = 0;

            for (const studentId of studentIds) {
                const { error } = await supabase
                    .from('students')
                    .update({ stage: newStage, academic_year: newAcademicYear })
                    .eq('student_id', studentId);

                if (error) throw error;
                processed++;
                updateOperationProgress(operationId, Math.round((processed / totalStudents) * 100));
            }

            await logAuditTrail(operationId, 'promoteYear', { studentCount: totalStudents, newStage, newAcademicYear });

            const completedOp = { ...operation, status: 'completed' as const, progress: 100, completedAt: new Date() };
            setOperations(prev => prev.map(op => op.id === operationId ? completedOp : op));
            setActiveOperation(completedOp);
            return completedOp;
        } catch (err) {
            const failedOp = { ...operation, status: 'failed' as const, errorMessage: err instanceof Error ? err.message : 'خطأ' };
            setOperations(prev => prev.map(op => op.id === operationId ? failedOp : op));
            throw err;
        }
    };

    // 10. حذف/أرشفة جماعية
    const batchDeleteOrArchive = async (
        studentIds: string[],
        action: 'archive' | 'delete'
    ): Promise<BatchOperation> => {
        const operationId = generateOperationId();
        const operation: BatchOperation = {
            id: operationId,
            studentIds,
            operationType: 'deleteArchive',
            dataType: 'DeleteArchive',
            changes: { action },
            status: 'processing',
            progress: 0,
            createdAt: new Date(),
            operationName: action === 'archive' ? 'أرشفة الطلاب' : 'حذف الطلاب',
        };

        setOperations(prev => [...prev, operation]);
        setActiveOperation(operation);
        await createSnapshot(studentIds, operationId);

        try {
            const totalStudents = studentIds.length;
            let processed = 0;

            for (const studentId of studentIds) {
                if (action === 'archive') {
                    const { error } = await supabase
                        .from('students')
                        .update({ is_archived: true, archived_at: new Date().toISOString() })
                        .eq('student_id', studentId);
                    if (error) throw error;
                } else {
                    const { error } = await supabase
                        .from('students')
                        .delete()
                        .eq('student_id', studentId);
                    if (error) throw error;
                }
                processed++;
                updateOperationProgress(operationId, Math.round((processed / totalStudents) * 100));
            }

            await logAuditTrail(operationId, 'deleteArchive', { studentCount: totalStudents, action });

            const completedOp = { ...operation, status: 'completed' as const, progress: 100, completedAt: new Date() };
            setOperations(prev => prev.map(op => op.id === operationId ? completedOp : op));
            setActiveOperation(completedOp);
            return completedOp;
        } catch (err) {
            const failedOp = { ...operation, status: 'failed' as const, errorMessage: err instanceof Error ? err.message : 'خطأ' };
            setOperations(prev => prev.map(op => op.id === operationId ? failedOp : op));
            throw err;
        }
    };

    // 11. ربط/فصل من الأنشطة
    const batchLinkActivity = async (
        studentIds: string[],
        activityId: string,
        action: 'link' | 'unlink'
    ): Promise<BatchOperation> => {
        const operationId = generateOperationId();
        const operation: BatchOperation = {
            id: operationId,
            studentIds,
            operationType: 'linkActivity',
            dataType: 'ActivityLink',
            changes: { activityId, action },
            status: 'processing',
            progress: 0,
            createdAt: new Date(),
            operationName: action === 'link' ? 'تسجيل في نشاط' : 'إلغاء تسجيل من نشاط',
        };

        setOperations(prev => [...prev, operation]);
        setActiveOperation(operation);

        try {
            const totalStudents = studentIds.length;
            let processed = 0;

            for (const studentId of studentIds) {
                if (action === 'link') {
                    const { error } = await supabase
                        .from('student_activities')
                        .insert({ student_id: studentId, activity_id: activityId });
                    if (error) throw error;
                } else {
                    const { error } = await supabase
                        .from('student_activities')
                        .delete()
                        .eq('student_id', studentId)
                        .eq('activity_id', activityId);
                    if (error) throw error;
                }
                processed++;
                updateOperationProgress(operationId, Math.round((processed / totalStudents) * 100));
            }

            await logAuditTrail(operationId, 'linkActivity', { studentCount: totalStudents, activityId, action });

            const completedOp = { ...operation, status: 'completed' as const, progress: 100, completedAt: new Date() };
            setOperations(prev => prev.map(op => op.id === operationId ? completedOp : op));
            setActiveOperation(completedOp);
            return completedOp;
        } catch (err) {
            const failedOp = { ...operation, status: 'failed' as const, errorMessage: err instanceof Error ? err.message : 'خطأ' };
            setOperations(prev => prev.map(op => op.id === operationId ? failedOp : op));
            throw err;
        }
    };

    // 12. نسخ البيانات
    const batchCopyData = async (
        studentIds: string[],
        sourceClassId: string
    ): Promise<BatchOperation> => {
        const operationId = generateOperationId();
        const operation: BatchOperation = {
            id: operationId,
            studentIds,
            operationType: 'copyData',
            dataType: 'DataCopy',
            changes: { sourceClass: sourceClassId },
            status: 'processing',
            progress: 0,
            createdAt: new Date(),
            operationName: 'نسخ البيانات',
        };

        setOperations(prev => [...prev, operation]);
        setActiveOperation(operation);

        try {
            const totalStudents = studentIds.length;
            let processed = 0;

            for (const studentId of studentIds) {
                processed++;
                updateOperationProgress(operationId, Math.round((processed / totalStudents) * 100));
            }

            await logAuditTrail(operationId, 'copyData', { studentCount: totalStudents, sourceClass: sourceClassId });

            const completedOp = { ...operation, status: 'completed' as const, progress: 100, completedAt: new Date() };
            setOperations(prev => prev.map(op => op.id === operationId ? completedOp : op));
            setActiveOperation(completedOp);
            return completedOp;
        } catch (err) {
            const failedOp = { ...operation, status: 'failed' as const, errorMessage: err instanceof Error ? err.message : 'خطأ' };
            setOperations(prev => prev.map(op => op.id === operationId ? failedOp : op));
            throw err;
        }
    };

    // الحصول على حالة العملية
    const getOperationStatus = (operationId: string): BatchOperation | null => {
        return operations.find(op => op.id === operationId) || null;
    };

    // التراجع عن العملية
    const undoOperation = async (operationId: string) => {
        const snapshot = snapshots.find(s => s.operationId === operationId);
        if (!snapshot) throw new Error('لا توجد لقطة لهذه العملية');

        for (const previousData of snapshot.previousData) {
            const student_id = (previousData as Record<string, unknown>).student_id as string;
            await supabase
                .from('students')
                .update(previousData)
                .eq('student_id', student_id);
        }

        setSnapshots(prev => prev.filter(s => s.operationId !== operationId));
        return true;
    };

    // حذف العملية من السجل
    const clearOperation = (operationId: string) => {
        setOperations(prev => prev.filter(op => op.id !== operationId));
        if (activeOperation?.id === operationId) {
            setActiveOperation(null);
        }
    };

    // الحصول على آخر العمليات
    const getRecentOperations = (limit: number = 10) => {
        return operations.slice(-limit);
    };

    return {
        operations,
        activeOperation,
        batchTransferToClass,
        batchUpdateStudentStatus,
        batchAssignAdvisor,
        batchImportData,
        batchSendNotifications,
        batchPrintDocuments,
        batchToggleAccounts,
        batchRecordAttendance,
        batchPromoteYear,
        batchDeleteOrArchive,
        batchLinkActivity,
        batchCopyData,
        getOperationStatus,
        undoOperation,
        clearOperation,
        getRecentOperations,
        snapshots,
    };
}
