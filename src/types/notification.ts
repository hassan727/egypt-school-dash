// =============================================
// NOTIFICATION SYSTEM - TypeScript Type Definitions
// تعريفات الأنواع لنظام الإشعارات المتكامل
// =============================================

// =============================================
// Core Enums
// =============================================

export enum NotificationTypeCode {
    ACADEMIC = 'academic',
    ASSIGNMENTS = 'assignments',
    BEHAVIORAL = 'behavioral',
    ATTENDANCE = 'attendance',
    FINANCIAL = 'financial',
    ADMINISTRATIVE = 'administrative',
    EMERGENCY = 'emergency',
    PRIVATE_MESSAGE = 'private_message',
    DATA_UPDATE = 'data_update',
    GENERAL = 'general',
}

export enum RecipientType {
    INDIVIDUAL = 'individual',
    CLASS = 'class',
    STAGE = 'stage',
    ACADEMIC_YEAR = 'academic_year',
    NEW_STUDENTS = 'new_students',
    GUARDIANS_ONLY = 'guardians_only',
    TEACHERS = 'teachers',
    ADMINISTRATORS = 'administrators',
    CUSTOM_GROUP = 'custom_group',
    ALL = 'all',
}

export enum NotificationChannelCode {
    IN_APP = 'in_app',
    WHATSAPP = 'whatsapp',
    SMS = 'sms',
    EMAIL = 'email',
    PUSH = 'push',
}

export enum NotificationStatus {
    DRAFT = 'draft',
    SCHEDULED = 'scheduled',
    SENT = 'sent',
    DELIVERED = 'delivered',
    READ = 'read',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
}

export enum DeliveryStatus {
    PENDING = 'pending',
    SENT = 'sent',
    DELIVERED = 'delivered',
    READ = 'read',
    FAILED = 'failed',
}

export enum NotificationPriority {
    LOW = 'low',
    NORMAL = 'normal',
    HIGH = 'high',
    URGENT = 'urgent',
}

export enum SendMode {
    MANUAL = 'manual',
    BULK = 'bulk',
    AUTO_TRIGGERED = 'auto_triggered',
}

export enum ActionType {
    CREATED = 'created',
    UPDATED = 'updated',
    SCHEDULED = 'scheduled',
    SENT = 'sent',
    DELIVERED = 'delivered',
    READ = 'read',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
    RESENT = 'resent',
}

// =============================================
// Database Table Types
// =============================================

export interface NotificationType {
    id: string;
    type_code: NotificationTypeCode;
    type_name_ar: string;
    type_name_en: string;
    description?: string;
    icon?: string;
    color?: string;
    priority_level: NotificationPriority;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface NotificationChannel {
    id: string;
    channel_code: NotificationChannelCode;
    channel_name_ar: string;
    channel_name_en: string;
    description?: string;
    is_active: boolean;
    config?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface NotificationRecipient {
    id: string;
    recipient_type: RecipientType;
    recipient_name_ar: string;
    recipient_name_en: string;
    description?: string;
    filter_criteria?: Record<string, any>;
    is_active: boolean;
    created_at: string;
}

export interface NotificationTemplate {
    id: string;
    template_code: string;
    template_name_ar: string;
    template_name_en: string;
    notification_type_id?: string;
    subject_template?: string;
    body_template: string;
    variables?: Record<string, string>;
    is_active: boolean;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface NotificationAttachment {
    name: string;
    url: string;
    size?: number;
    type?: string;
}

export interface Notification {
    id: string;
    notification_code?: string;

    // Type and categorization
    notification_type_id?: string;
    recipient_type_id?: string;

    // Content
    title?: string;
    content: string;
    link_url?: string;
    attachments?: NotificationAttachment[];

    // Targeting
    student_id?: string;
    academic_year_id?: string;
    class_id?: string;
    stage_id?: string;

    // Send mode and scheduling
    send_mode: SendMode;
    priority: NotificationPriority;
    scheduled_at?: string;
    expires_at?: string;

    // Status
    status: NotificationStatus;

    // Related entities
    related_entity_type?: string;
    related_entity_id?: string;

    // Metadata
    metadata?: Record<string, any>;

    // Audit trail
    created_by?: string;
    created_at: string;
    updated_at: string;
    sent_at?: string;

    // Legacy fields
    type?: string;
    phone_number?: string;

    // Relations (populated via joins)
    notification_type?: NotificationType;
    recipient_type?: NotificationRecipient;
    students?: {
        full_name_ar: string;
        guardian_full_name?: string;
        guardian_phone?: string;
        guardian_email?: string;
    };
}

export interface NotificationDelivery {
    id: string;
    notification_id: string;
    student_id: string;
    channel_id?: string;

    // Delivery status
    delivery_status: DeliveryStatus;

    // Contact information
    contact_info?: string;

    // Timestamps
    sent_at?: string;
    delivered_at?: string;
    read_at?: string;
    failed_at?: string;

    // Error tracking
    failure_reason?: string;
    retry_count: number;
    last_retry_at?: string;

    // Metadata
    delivery_metadata?: Record<string, any>;

    created_at: string;
    updated_at: string;

    // Relations
    notification?: Notification;
    channel?: NotificationChannel;
    students?: {
        full_name_ar: string;
        guardian_full_name?: string;
    };
}

export interface NotificationLog {
    id: string;
    notification_id: string;

    // Action tracking
    action_type: ActionType;
    action_description?: string;

    // Who performed the action
    performed_by?: string;
    performed_at: string;

    // Details
    details?: Record<string, any>;

    // Security tracking
    ip_address?: string;
    user_agent?: string;

    // Relations
    notification?: Notification;
}

export interface NotificationPreferences {
    id: string;
    student_id: string;
    guardian_id?: string;

    // Channel preferences
    channel_preferences?: Record<string, string[]>;

    // Quiet hours
    quiet_hours_start?: string;
    quiet_hours_end?: string;

    // Global enable/disable
    is_enabled: boolean;

    // Language preference
    preferred_language: 'ar' | 'en';

    created_at: string;
    updated_at: string;
}

// =============================================
// API Request/Response Types
// =============================================

export interface CreateNotificationRequest {
    notification_type_id?: string;
    recipient_type_id?: string;
    title?: string;
    content: string;
    link_url?: string;
    attachments?: NotificationAttachment[];

    // Targeting
    student_id?: string;
    student_ids?: string[]; // For bulk
    academic_year_id?: string;
    class_id?: string;
    stage_id?: string;

    // Channels
    channel_ids: string[];

    // Send mode
    send_mode?: SendMode;
    priority?: NotificationPriority;
    scheduled_at?: string;

    // Related entity
    related_entity_type?: string;
    related_entity_id?: string;

    // Metadata
    metadata?: Record<string, any>;
}

export interface NotificationFilter {
    notification_type_id?: string;
    student_id?: string;
    class_id?: string;
    stage_id?: string;
    academic_year_id?: string;
    status?: NotificationStatus;
    priority?: NotificationPriority;
    send_mode?: SendMode;
    date_from?: string;
    date_to?: string;
    search_query?: string;
}

export interface NotificationStats {
    total_sent: number;
    total_delivered: number;
    total_read: number;
    total_failed: number;
    delivery_rate: number;
    read_rate: number;
    by_type: Record<string, number>;
    by_channel: Record<string, number>;
    recent_notifications: Notification[];
}

// =============================================
// UI Component Props Types
// =============================================

export interface NotificationCardProps {
    notification: Notification;
    onMarkAsRead?: (id: string) => void;
    onDelete?: (id: string) => void;
    compact?: boolean;
}

export interface NotificationListProps {
    notifications: Notification[];
    loading?: boolean;
    onLoadMore?: () => void;
    hasMore?: boolean;
    filter?: NotificationFilter;
    onFilterChange?: (filter: NotificationFilter) => void;
}

export interface NotificationComposerProps {
    onSubmit: (data: CreateNotificationRequest) => Promise<void>;
    initialData?: Partial<CreateNotificationRequest>;
    templates?: NotificationTemplate[];
}

export interface RecipientSelectorProps {
    value: {
        recipient_type_id?: string;
        student_ids?: string[];
        class_id?: string;
        stage_id?: string;
        academic_year_id?: string;
    };
    onChange: (value: any) => void;
}

// =============================================
// Utility Types
// =============================================

export type NotificationWithDelivery = Notification & {
    delivery_records?: NotificationDelivery[];
    delivery_summary?: {
        total: number;
        sent: number;
        delivered: number;
        read: number;
        failed: number;
    };
};

export type NotificationWithLogs = Notification & {
    logs?: NotificationLog[];
};
