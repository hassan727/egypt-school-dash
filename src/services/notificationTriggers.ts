// =============================================
// NOTIFICATION TRIGGERS - Auto-triggered Notifications
// محفزات الإشعارات التلقائية
// =============================================

import { supabase } from '@/lib/supabase';
import { createNotification } from './notificationService';
import type { CreateNotificationRequest } from '@/types/notification';
import { NotificationPriority, SendMode } from '@/types/notification';

// =============================================
// Grade-related Triggers
// =============================================

/**
 * Trigger notification when a new grade is submitted
 */
export async function onGradeSubmitted(data: {
    studentId: string;
    studentName: string;
    subject: string;
    grade: number;
    totalGrade: number;
    assessmentType: string;
}) {
    const notificationData: CreateNotificationRequest = {
        notification_type_id: await getTypeId('academic'),
        title: `درجة جديدة: ${data.subject}`,
        content: `تم رصد درجة جديدة للطالب ${data.studentName} في مادة ${data.subject}. الدرجة: ${data.grade}/${data.totalGrade}. نوع التقييم: ${data.assessmentType}.`,
        student_id: data.studentId,
        send_mode: SendMode.AUTO_TRIGGERED,
        priority: NotificationPriority.NORMAL,
        related_entity_type: 'grade',
        channel_ids: [await getChannelId('in_app')],
        metadata: {
            subject: data.subject,
            grade: data.grade,
            total_grade: data.totalGrade,
            assessment_type: data.assessmentType,
        },
    };

    return await createNotification(notificationData);
}

// =============================================
// Attendance-related Triggers
// =============================================

/**
 * Trigger notification when student is marked absent
 */
export async function onStudentAbsent(data: {
    studentId: string;
    studentName: string;
    date: string;
    reason?: string;
}) {
    const notificationData: CreateNotificationRequest = {
        notification_type_id: await getTypeId('attendance'),
        title: `تنبيه: غياب الطالب ${data.studentName}`,
        content: `نحيطكم علماً بأن الطالب ${data.studentName} تغيب بتاريخ ${data.date}${data.reason ? `. السبب: ${data.reason}` : ''}. يرجى التواصل معنا في حال وجود أي استفسار.`,
        student_id: data.studentId,
        send_mode: SendMode.AUTO_TRIGGERED,
        priority: NotificationPriority.HIGH,
        related_entity_type: 'attendance',
        channel_ids: [await getChannelId('in_app'), await getChannelId('whatsapp')],
        metadata: {
            absence_date: data.date,
            reason: data.reason,
        },
    };

    return await createNotification(notificationData);
}

/**
 * Trigger notification when student is marked late
 */
export async function onStudentTardy(data: {
    studentId: string;
    studentName: string;
    date: string;
    minutesLate: number;
}) {
    const notificationData: CreateNotificationRequest = {
        notification_type_id: await getTypeId('attendance'),
        title: `تنبيه: تأخير الطالب ${data.studentName}`,
        content: `نحيطكم علماً بأن الطالب ${data.studentName} تأخر عن الحضور بتاريخ ${data.date} بمقدار ${data.minutesLate} دقيقة.`,
        student_id: data.studentId,
        send_mode: SendMode.AUTO_TRIGGERED,
        priority: NotificationPriority.NORMAL,
        related_entity_type: 'attendance',
        channel_ids: [await getChannelId('in_app')],
        metadata: {
            tardy_date: data.date,
            minutes_late: data.minutesLate,
        },
    };

    return await createNotification(notificationData);
}

// =============================================
// Financial-related Triggers
// =============================================

/**
 * Trigger notification when fee payment is received
 */
export async function onFeePaymentReceived(data: {
    studentId: string;
    studentName: string;
    amount: number;
    paymentDate: string;
    receiptNumber: string;
    paymentMethod: string;
}) {
    const notificationData: CreateNotificationRequest = {
        notification_type_id: await getTypeId('financial'),
        title: `تأكيد سداد: ${data.amount} جنيه`,
        content: `تم استلام دفعة بقيمة ${data.amount} جنيه للطالب ${data.studentName} بتاريخ ${data.paymentDate}. رقم الإيصال: ${data.receiptNumber}. طريقة الدفع: ${data.paymentMethod}. شكراً لكم.`,
        student_id: data.studentId,
        send_mode: SendMode.AUTO_TRIGGERED,
        priority: NotificationPriority.NORMAL,
        related_entity_type: 'financial_transaction',
        channel_ids: [await getChannelId('in_app'), await getChannelId('email')],
        metadata: {
            amount: data.amount,
            payment_date: data.paymentDate,
            receipt_number: data.receiptNumber,
            payment_method: data.paymentMethod,
        },
    };

    return await createNotification(notificationData);
}

/**
 * Trigger notification when fee payment is overdue
 */
export async function onFeePaymentOverdue(data: {
    studentId: string;
    studentName: string;
    amount: number;
    dueDate: string;
    daysOverdue: number;
}) {
    const notificationData: CreateNotificationRequest = {
        notification_type_id: await getTypeId('financial'),
        title: `تنبيه: قسط متأخر`,
        content: `نحيطكم علماً بوجود قسط متأخر بقيمة ${data.amount} جنيه للطالب ${data.studentName}. تاريخ الاستحقاق كان ${data.dueDate} (متأخر ${data.daysOverdue} يوم). يرجى السداد في أقرب وقت ممكن.`,
        student_id: data.studentId,
        send_mode: SendMode.AUTO_TRIGGERED,
        priority: NotificationPriority.HIGH,
        related_entity_type: 'fee_installment',
        channel_ids: [await getChannelId('in_app'), await getChannelId('whatsapp')],
        metadata: {
            amount: data.amount,
            due_date: data.dueDate,
            days_overdue: data.daysOverdue,
        },
    };

    return await createNotification(notificationData);
}

// =============================================
// Behavioral-related Triggers
// =============================================

/**
 * Trigger notification when behavioral incident is reported
 */
export async function onBehavioralIncident(data: {
    studentId: string;
    studentName: string;
    incidentType: string;
    severity: string;
    date: string;
    description: string;
}) {
    const notificationData: CreateNotificationRequest = {
        notification_type_id: await getTypeId('behavioral'),
        title: `تنبيه: حادثة سلوكية - ${data.incidentType}`,
        content: `السيد/ة ولي أمر الطالب ${data.studentName}، نود إبلاغكم بحدوث موقف سلوكي بتاريخ ${data.date}. النوع: ${data.incidentType}. الخطورة: ${data.severity}. يرجى التواصل مع إدارة المدرسة في أقرب وقت ممكن.`,
        student_id: data.studentId,
        send_mode: SendMode.AUTO_TRIGGERED,
        priority: data.severity === 'عالية' ? NotificationPriority.URGENT : NotificationPriority.HIGH,
        related_entity_type: 'incident_report',
        channel_ids: [await getChannelId('in_app'), await getChannelId('whatsapp')],
        metadata: {
            incident_type: data.incidentType,
            severity: data.severity,
            incident_date: data.date,
            description: data.description,
        },
    };

    return await createNotification(notificationData);
}

/**
 * Trigger notification when warning is issued
 */
export async function onWarningIssued(data: {
    studentId: string;
    studentName: string;
    warningType: string;
    warningLevel: number;
    reason: string;
    date: string;
}) {
    const notificationData: CreateNotificationRequest = {
        notification_type_id: await getTypeId('behavioral'),
        title: `إنذار ${data.warningLevel}: ${data.warningType}`,
        content: `تم إصدار إنذار رقم ${data.warningLevel} للطالب ${data.studentName} بتاريخ ${data.date}. النوع: ${data.warningType}. السبب: ${data.reason}. يرجى الاطلاع والتوقيع على الإنذار.`,
        student_id: data.studentId,
        send_mode: SendMode.AUTO_TRIGGERED,
        priority: NotificationPriority.URGENT,
        related_entity_type: 'warning',
        channel_ids: [await getChannelId('in_app'), await getChannelId('whatsapp')],
        metadata: {
            warning_type: data.warningType,
            warning_level: data.warningLevel,
            reason: data.reason,
            warning_date: data.date,
        },
    };

    return await createNotification(notificationData);
}

// =============================================
// Enrollment-related Triggers
// =============================================

/**
 * Trigger notification when student stage/class changes
 */
export async function onStageClassChange(data: {
    studentId: string;
    studentName: string;
    oldStage: string;
    oldClass: string;
    newStage: string;
    newClass: string;
    changeDate: string;
    reason?: string;
}) {
    const notificationData: CreateNotificationRequest = {
        notification_type_id: await getTypeId('data_update'),
        title: `تحديث: تغيير الفصل الدراسي`,
        content: `تم تحديث بيانات الطالب ${data.studentName}. التغيير: من ${data.oldStage} - ${data.oldClass} إلى ${data.newStage} - ${data.newClass}. تاريخ التغيير: ${data.changeDate}${data.reason ? `. السبب: ${data.reason}` : ''}.`,
        student_id: data.studentId,
        send_mode: SendMode.AUTO_TRIGGERED,
        priority: NotificationPriority.NORMAL,
        related_entity_type: 'student',
        channel_ids: [await getChannelId('in_app')],
        metadata: {
            old_stage: data.oldStage,
            old_class: data.oldClass,
            new_stage: data.newStage,
            new_class: data.newClass,
            change_date: data.changeDate,
            reason: data.reason,
        },
    };

    return await createNotification(notificationData);
}

// =============================================
// Legal Guardian Verification Trigger
// محفز التحقق من الوصاية القانونية
// =============================================

/**
 * Trigger WhatsApp verification notification to legal guardian
 * يتم استدعاؤه عند أي معاملة تتطلب التحقق من الوصي
 */
export async function onLegalGuardianVerification(data: {
    studentId: string;
    studentName: string;
    guardianName: string;
    transactionType: string;
    transactionDescription?: string;
}) {
    const notificationData: CreateNotificationRequest = {
        notification_type_id: await getTypeId('administrative'),
        title: `🔐 التحقق من الوصاية: ${data.transactionType}`,
        content: `السيد/ة ${data.guardianName}، ولي أمر الطالب ${data.studentName}. نحيطكم علماً بأن شخصاً يقوم بإجراء معاملة "${data.transactionType}" نيابة عن الطالب/ة. ${data.transactionDescription || ''} يرجى التأكيد أو التواصل معنا فوراً.`,
        student_id: data.studentId,
        send_mode: SendMode.AUTO_TRIGGERED,
        priority: NotificationPriority.HIGH,
        related_entity_type: 'legal_guardian_verification',
        channel_ids: [await getChannelId('whatsapp')],
        metadata: {
            transaction_type: data.transactionType,
            transaction_description: data.transactionDescription,
            guardian_name: data.guardianName,
            verified_at: null,
        },
    };

    return await createNotification(notificationData);
}

/**
 * Trigger notification when student data is updated
 * يتم استدعاؤه عند تحديث بيانات الطالب
 */
export async function onStudentDataUpdated(data: {
    studentId: string;
    studentName: string;
    updateType: string;
    updatedFields: string[];
}) {
    const notificationData: CreateNotificationRequest = {
        notification_type_id: await getTypeId('data_update'),
        title: `📝 تحديث بيانات: ${data.updateType}`,
        content: `تم تحديث بيانات الطالب ${data.studentName}. الحقول المحدثة: ${data.updatedFields.join('، ')}.`,
        student_id: data.studentId,
        send_mode: SendMode.AUTO_TRIGGERED,
        priority: NotificationPriority.NORMAL,
        related_entity_type: 'student',
        channel_ids: [await getChannelId('in_app')],
        metadata: {
            update_type: data.updateType,
            updated_fields: data.updatedFields,
        },
    };

    return await createNotification(notificationData);
}

// =============================================
// Helper Functions
// =============================================



/**
 * Get notification type ID by code
 */
async function getTypeId(typeCode: string): Promise<string | undefined> {
    const { data } = await supabase
        .from('notification_types')
        .select('id')
        .eq('type_code', typeCode)
        .single();
    return data?.id;
}

/**
 * Get channel ID by code
 */
async function getChannelId(channelCode: string): Promise<string> {
    const { data } = await supabase
        .from('notification_channels')
        .select('id')
        .eq('channel_code', channelCode)
        .single();
    return data?.id || '';
}

