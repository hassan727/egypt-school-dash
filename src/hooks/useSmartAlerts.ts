/**
 * Hook لاستخدام نظام التنبيهات الذكية
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { smartAlerts, SmartAlert } from '@/services/smartAlertsService';

export function useSmartAlerts() {
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // جلب التنبيهات
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const activeAlerts = await smartAlerts.getActiveAlerts();
      setAlerts(activeAlerts);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('خطأ في جلب التنبيهات:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // تشغيل التحليلات الذكية
  const runAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      await smartAlerts.runAllAnalytics();
      // إعادة جلب التنبيهات بعد التحليلات
      setTimeout(() => fetchAlerts(), 1000);
    } catch (err) {
      console.error('خطأ في تشغيل التحليلات:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchAlerts]);

  // إغلاق تنبيه
  const dismissAlert = useCallback(async (alertId: string) => {
    try {
      await smartAlerts.dismissAlert(alertId);
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (err) {
      console.error('خطأ في إغلاق التنبيه:', err);
    }
  }, [alerts]);

  // حل تنبيه
  const resolveAlert = useCallback(async (alertId: string) => {
    try {
      await smartAlerts.resolveAlert(alertId);
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (err) {
      console.error('خطأ في حل التنبيه:', err);
    }
  }, [alerts]);

  // جلب التنبيهات عند التحميل
  useEffect(() => {
    fetchAlerts();

    // تحديث دوري كل 5 دقائق
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // الإحصائيات
  const stats = {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length,
  };

  return {
    alerts,
    loading,
    lastRefresh,
    stats,
    fetchAlerts,
    runAnalytics,
    dismissAlert,
    resolveAlert,
  };
}
