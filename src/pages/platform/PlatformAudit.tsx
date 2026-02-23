import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollText, RefreshCw, User, Shield, Server } from 'lucide-react';
import { fetchAuditLog } from '@/services/platformService';
import type { AuditLogEntry } from '@/types/platform';

const actorIcons: Record<string, any> = { owner: Shield, school_user: User, system: Server };
const actorColors: Record<string, string> = { owner: 'bg-indigo-50 text-indigo-600', school_user: 'bg-blue-50 text-blue-600', system: 'bg-gray-100 text-gray-600' };
const actionLabels: Record<string, string> = {
    create_school: 'إنشاء مدرسة', change_plan: 'تغيير خطة', enable_feature: 'تفعيل خاصية',
    disable_feature: 'تعطيل خاصية', login: 'تسجيل دخول', impersonate: 'وضع المحاكاة',
};

export default function PlatformAudit() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const reload = () => { setLoading(true); fetchAuditLog(100).then(setLogs).catch(console.error).finally(() => setLoading(false)); };
    useEffect(() => { reload(); }, []);

    const formatTime = (iso: string) => {
        const diffMs = Date.now() - new Date(iso).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays < 7) return `منذ ${diffDays} يوم`;
        return new Date(iso).toLocaleDateString('ar-EG');
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">سجل العمليات</h1>
                        <p className="text-muted-foreground mt-1">جميع العمليات المسجلة في المنصة</p>
                    </div>
                    <Button variant="outline" className="gap-2" onClick={reload}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> تحديث
                    </Button>
                </div>

                {loading ? (
                    <div className="space-y-2">{[...Array(8)].map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="p-4 h-16" /></Card>)}</div>
                ) : logs.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-16 text-muted-foreground">
                            <ScrollText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>لا توجد عمليات مسجلة حتى الآن</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {logs.map(log => {
                            const ActorIcon = actorIcons[log.actor_type] || User;
                            return (
                                <Card key={log.id} className="hover:shadow-sm transition-shadow">
                                    <div className="p-3 flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${actorColors[log.actor_type] || actorColors.system}`}>
                                            <ActorIcon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-foreground font-medium">{log.actor_name || 'نظام'}</span>
                                                <span className="text-muted-foreground">—</span>
                                                <span className="text-foreground">{actionLabels[log.action] || log.action}</span>
                                                {log.target_name && (
                                                    <>
                                                        <span className="text-muted-foreground">→</span>
                                                        <span className="text-primary">{log.target_name}</span>
                                                    </>
                                                )}
                                            </div>
                                            {log.details && Object.keys(log.details).length > 0 && (
                                                <p className="text-muted-foreground text-xs mt-0.5 truncate">{JSON.stringify(log.details)}</p>
                                            )}
                                        </div>
                                        <div className="text-muted-foreground text-xs whitespace-nowrap">{formatTime(log.created_at)}</div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
