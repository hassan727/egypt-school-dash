# 🚀 دليل النظام الذكي - Smart System Guide

## 📋 ملخص ما تم إضافته

تم تحويل نظام المدرسة من نظام **تقليدي** إلى نظام **ذكي منافس للشركات الكبرى** بإضافة:

### ✅ 1. نظام تتبع الأخطاء الذكي (Error Tracking)
- تسجيل تلقائي لكل الأخطاء مع السياق الكامل
- تنبيهات فورية للأخطاء الحرجة
- لوحة معلومات للمراقبة والإحصائيات
- اكتشاف الأنماط المتكررة

**الملفات:**
- `src/services/errorTrackingService.ts` - الخدمة الأساسية
- `supabase/migrations/20251223_error_tracking_system.sql` - قاعدة البيانات
- `src/pages/admin/ErrorMonitoringDashboard.tsx` - لوحة المراقبة

### ✅ 2. نظام التنبيهات الذكية (Smart Alerts)
تنبيهات استباقية **قبل حدوث المشاكل**:
- 🎓 تنبيهات طلاب متأخرين في الرسوم
- ⚠️ تنبيهات خطر رسوب الطالب
- 🏢 تنبيهات موظفين متغيبين
- 💰 تنبيهات رواتب متأخرة

**الملفات:**
- `src/services/smartAlertsService.ts` - الخدمة الأساسية
- `supabase/migrations/20251223_smart_alerts_system.sql` - قاعدة البيانات
- `src/hooks/useSmartAlerts.ts` - React Hook

---

## 🚀 كيفية البدء

### المرحلة 1: تطبيق الـ Migrations

```bash
# تطبيق migrations قاعدة البيانات
supabase migration up
```

**أو يدويًا عبر Supabase Studio:**
1. انتقل إلى `SQL Editor`
2. انسخ محتوى `20251223_error_tracking_system.sql`
3. اضغط `Run`
4. كرر نفس الشيء لـ `20251223_smart_alerts_system.sql`

### المرحلة 2: دمج الخدمات في التطبيق

**أ) تسجيل الأخطاء تلقائياً:**

```typescript
// في أي صفحة أو hook
import { errorTracker } from '@/services/errorTrackingService';

try {
  // عملية حساسة
  await updateStudentGrade(studentId, gradeData);
} catch (error) {
  // تسجيل تلقائي للخطأ
  await errorTracker.logDatabaseError(
    'UPDATE',
    'grades',
    error.message,
    { student_id: studentId, grade_data: gradeData }
  );
}
```

**ب) تشغيل التنبيهات الذكية:**

```typescript
// في Dashboard الرئيسي أو صفحة مسؤول
import { useSmartAlerts } from '@/hooks/useSmartAlerts';

export default function Dashboard() {
  const { alerts, stats, runAnalytics } = useSmartAlerts();

  return (
    <div>
      <button onClick={runAnalytics}>تشغيل التحليلات الذكية</button>
      
      {/* عرض الإحصائيات */}
      <p>تنبيهات حرجة: {stats.critical}</p>
      
      {/* عرض التنبيهات */}
      {alerts.map(alert => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
```

### المرحلة 3: إضافة لوحة المراقبة

1. أضف الصفحة للـ routing في `App.tsx`:

```typescript
import ErrorMonitoringDashboard from './pages/admin/ErrorMonitoringDashboard';

<Route path="/admin/errors" element={<ErrorMonitoringDashboard />} />
```

2. أضف رابط في القائمة الجانبية:

```typescript
<NavLink to="/admin/errors" icon={<Bug className="h-5 w-5" />}>
  مراقبة الأخطاء
</NavLink>
```

---

## 📊 أمثلة على الاستخدام

### مثال 1: تسجيل خطأ تحقق

```typescript
import { errorTracker } from '@/services/errorTrackingService';

const validateStudentGrade = (grade: number) => {
  if (grade < 0 || grade > 100) {
    errorTracker.logValidationError(
      'grade',
      'الدرجة يجب أن تكون بين 0 و 100',
      { attempted_grade: grade }
    );
    return false;
  }
  return true;
};
```

### مثال 2: تشغيل التحليلات الذكية يومياً

```typescript
// في ملف Hook أو في صفحة Dashboard
import { smartAlerts } from '@/services/smartAlertsService';

useEffect(() => {
  // تشغيل التحليلات كل يوم في الساعة 8 صباحاً
  const runDailyAnalytics = () => {
    const now = new Date();
    if (now.getHours() === 8 && now.getMinutes() === 0) {
      smartAlerts.runAllAnalytics();
    }
  };

  const interval = setInterval(runDailyAnalytics, 60000); // كل دقيقة
  return () => clearInterval(interval);
}, []);
```

### مثال 3: عرض التنبيهات في الـ UI

```typescript
import { useSmartAlerts } from '@/hooks/useSmartAlerts';

export default function AlertsPanel() {
  const { alerts, dismissAlert, resolveAlert } = useSmartAlerts();

  return (
    <div className="space-y-2">
      {alerts.map(alert => (
        <div key={alert.id} className={`p-3 border rounded ${getSeverityClass(alert.severity)}`}>
          <h3>{alert.title}</h3>
          <p>{alert.description}</p>
          <p className="text-sm mt-2">💡 {alert.recommended_action}</p>
          
          <div className="flex gap-2 mt-3">
            <button onClick={() => resolveAlert(alert.id)}>✅ تم حل</button>
            <button onClick={() => dismissAlert(alert.id)}>❌ إغلاق</button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 🔧 التخصيص والإعدادات

### تغيير معايير التنبيهات

```sql
-- تغيير معيار نسبة الدفع من 30% إلى 20%
UPDATE alert_thresholds
SET threshold_value = '{"percentage": 20}'::jsonb
WHERE alert_type = 'student_payment_overdue';
```

### إضافة تنبيه جديد

```typescript
// 1. أضفه في smartAlertsService.ts:
async analyzeNewAlert(): Promise<void> {
  // منطق التحليل
}

// 2. أضفه في runAllAnalytics():
async runAllAnalytics(): Promise<void> {
  await Promise.all([
    // الأخرى...
    this.analyzeNewAlert(), // الجديد
  ]);
}

// 3. أضفه في جدول alert_thresholds:
INSERT INTO alert_thresholds (alert_type, ...)
VALUES ('new_alert_type', ...);
```

---

## 📈 الإحصائيات والتقارير

### الحصول على إحصائيات الأخطاء:

```typescript
import { errorTracker } from '@/services/errorTrackingService';

const stats = await errorTracker.getErrorStatistics(7); // آخر 7 أيام
console.log(stats);
// {
//   total_errors: 45,
//   critical_count: 5,
//   high_count: 12,
//   by_module: { StudentAcademic: 20, EmployeePayroll: 15, ... },
//   by_type: { database: 25, validation: 15, ... },
//   recent_errors: [...],
//   error_trend: [...]
// }
```

### الحصول على التنبيهات النشطة:

```typescript
import { smartAlerts } from '@/services/smartAlertsService';

const activeAlerts = await smartAlerts.getActiveAlerts();
console.log(activeAlerts);
// [
//   {
//     alert_type: 'student_payment_overdue',
//     affected_entity: 'S001',
//     severity: 'high',
//     ...
//   }
// ]
```

---

## 🔐 الأمان والصلاحيات

- **RLS مفعل**: فقط المسؤولون يرون الأخطاء والتنبيهات
- **تسجيل السياق الكامل**: IP، المتصفح، وقت التغيير، من قام به
- **سجل تاريخي**: تتبع كامل لكل تغيير على التنبيهات
- **تصنيف الخطورة**: critical, high, medium, low

---

## ⚡ الأداء والتحسينات

### Indexes المضافة:
```sql
-- للبحث السريع
INDEX idx_error_code (error_code)
INDEX idx_severity (severity)
INDEX idx_alert_type (alert_type)
INDEX idx_created_at (created_at)
```

### التحديث الدوري:
- تحديث تلقائي للإحصائيات اليومية
- كشف الأنماط المتكررة تلقائياً
- تنبيهات فورية للأخطاء الحرجة

---

## 🚨 الخطوات التالية (الأولويات)

### قريب (هذا الأسبوع):
- [ ] دمج نظام الأخطاء في جميع الـ API calls
- [ ] تشغيل التنبيهات الذكية كل ساعة
- [ ] إضافة لوحة التنبيهات في Dashboard الرئيسي

### متوسط (الأسبوع التالي):
- [ ] إضافة تنبيهات عبر البريد الإلكتروني
- [ ] إضافة تنبيهات عبر WhatsApp
- [ ] تقارير أسبوعية/شهرية للمسؤولين

### طويل (الشهر التالي):
- [ ] **التنبؤات (Predictive Analytics)**
  - توقع متى سيرسب الطالب
  - توقع المصروفات المستقبلية
  - توقع احتياجات التوظيف
- [ ] **Machine Learning**
  - تصنيف تلقائي للأخطاء
  - الكشف عن الشذوذ (Anomaly Detection)
- [ ] **تحسينات أداء**
  - Caching الذكي
  - Pagination للبيانات الكبيرة

---

## 🆘 استكشاف الأخطاء

### المشكلة: لا تظهر الأخطاء في لوحة المراقبة
**الحل:**
1. تحقق من RLS: `ALTER TABLE error_logs DISABLE ROW LEVEL SECURITY`
2. تأكد من migrations: `supabase migration list`
3. جرب manually: `INSERT INTO error_logs (...) VALUES (...)`

### المشكلة: التنبيهات تظهر مكررة
**الحل:**
يتم تخزين تنبيه واحد فقط نشط لكل entity و alert_type
إذا أردت تنبيه جديد، احل التنبيه القديم أولاً:
```sql
UPDATE smart_alerts SET status = 'resolved' WHERE id = 'alert_id';
```

---

## 📚 المراجع والموارد

- [Supabase Error Handling](https://supabase.com/docs)
- [React Best Practices](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**تم الإنشاء:** 2025-12-23  
**آخر تحديث:** 2025-12-23  
**الإصدار:** 1.0.0 (Beta)

---

**هل تحتاج إلى مساعدة أخرى؟**
