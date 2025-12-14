/**
 * أداة مراقبة الأداء لتتبع وتحسين أداء التطبيق
 */

interface PerformanceMetric {
    name: string;
    duration: number;
    timestamp: number;
    category: 'api' | 'render' | 'navigation' | 'custom';
    metadata?: Record<string, any>;
}

interface PerformanceReport {
    metrics: PerformanceMetric[];
    summary: {
        avgResponseTime: number;
        slowestOperation: PerformanceMetric | null;
        fastestOperation: PerformanceMetric | null;
        totalOperations: number;
    };
}

class PerformanceMonitor {
    private metrics: PerformanceMetric[] = [];
    private startTimes: Map<string, number> = new Map();
    private readonly MAX_METRICS = 1000;

    /**
     * بدء قياس الأداء
     */
    startMeasure(name: string): void {
        this.startTimes.set(name, performance.now());
    }

    /**
     * إنهاء قياس الأداء
     */
    endMeasure(
        name: string,
        category: PerformanceMetric['category'] = 'custom',
        metadata?: Record<string, any>
    ): PerformanceMetric | null {
        const startTime = this.startTimes.get(name);
        if (!startTime) {
            console.warn(`لم يتم العثور على بداية قياس لـ: ${name}`);
            return null;
        }

        const duration = performance.now() - startTime;
        const metric: PerformanceMetric = {
            name,
            duration,
            timestamp: Date.now(),
            category,
            metadata,
        };

        this.metrics.push(metric);
        this.startTimes.delete(name);

        // الاحتفاظ بعدد محدود من المقاييس
        if (this.metrics.length > this.MAX_METRICS) {
            this.metrics = this.metrics.slice(-this.MAX_METRICS);
        }

        // تسجيل العمليات البطيئة (أكثر من 1000 ميلي ثانية)
        if (duration > 1000) {
            console.warn(`⚠️ عملية بطيئة: ${name} (${duration.toFixed(2)}ms)`);
        }

        return metric;
    }

    /**
     * قياس عملية async
     */
    async measureAsync<T>(
        name: string,
        fn: () => Promise<T>,
        category: PerformanceMetric['category'] = 'custom',
        metadata?: Record<string, any>
    ): Promise<T> {
        this.startMeasure(name);
        try {
            const result = await fn();
            this.endMeasure(name, category, metadata);
            return result;
        } catch (err) {
            this.endMeasure(name, category, { ...metadata, error: true });
            throw err;
        }
    }

    /**
     * قياس عملية synchronous
     */
    measureSync<T>(
        name: string,
        fn: () => T,
        category: PerformanceMetric['category'] = 'custom',
        metadata?: Record<string, any>
    ): T {
        this.startMeasure(name);
        try {
            const result = fn();
            this.endMeasure(name, category, metadata);
            return result;
        } catch (err) {
            this.endMeasure(name, category, { ...metadata, error: true });
            throw err;
        }
    }

    /**
     * الحصول على جميع المقاييس
     */
    getAllMetrics(): PerformanceMetric[] {
        return [...this.metrics];
    }

    /**
     * الحصول على مقاييس حسب الفئة
     */
    getMetricsByCategory(category: PerformanceMetric['category']): PerformanceMetric[] {
        return this.metrics.filter(m => m.category === category);
    }

    /**
     * الحصول على أبطأ العمليات
     */
    getSlowestOperations(count: number = 10): PerformanceMetric[] {
        return [...this.metrics]
            .sort((a, b) => b.duration - a.duration)
            .slice(0, count);
    }

    /**
     * الحصول على أسرع العمليات
     */
    getFastestOperations(count: number = 10): PerformanceMetric[] {
        return [...this.metrics]
            .sort((a, b) => a.duration - b.duration)
            .slice(0, count);
    }

    /**
     * الحصول على متوسط وقت العملية
     */
    getAverageTime(name?: string): number {
        let filtered = this.metrics;

        if (name) {
            filtered = this.metrics.filter(m => m.name.includes(name));
        }

        if (filtered.length === 0) return 0;

        const sum = filtered.reduce((acc, m) => acc + m.duration, 0);
        return sum / filtered.length;
    }

    /**
     * الحصول على تقرير الأداء
     */
    getPerformanceReport(): PerformanceReport {
        const sorted = [...this.metrics].sort((a, b) => b.duration - a.duration);

        return {
            metrics: this.metrics,
            summary: {
                avgResponseTime: this.getAverageTime(),
                slowestOperation: sorted[0] || null,
                fastestOperation: sorted[sorted.length - 1] || null,
                totalOperations: this.metrics.length,
            },
        };
    }

    /**
     * مسح جميع المقاييس
     */
    clear(): void {
        this.metrics = [];
        this.startTimes.clear();
    }

    /**
     * طباعة تقرير الأداء
     */
    printReport(): void {
        const report = this.getPerformanceReport();
        console.table(report.metrics.map(m => ({
            'الاسم': m.name,
            'المدة (ms)': m.duration.toFixed(2),
            'الفئة': m.category,
        })));

        console.log('\n📊 ملخص الأداء:');
        console.log(`متوسط الوقت: ${report.summary.avgResponseTime.toFixed(2)}ms`);
        console.log(`أبطأ عملية: ${report.summary.slowestOperation?.name} (${report.summary.slowestOperation?.duration.toFixed(2)}ms)`);
        console.log(`أسرع عملية: ${report.summary.fastestOperation?.name} (${report.summary.fastestOperation?.duration.toFixed(2)}ms)`);
        console.log(`إجمالي العمليات: ${report.summary.totalOperations}`);
    }

    /**
     * تصدير التقرير كـ JSON
     */
    exportReport(): string {
        return JSON.stringify(this.getPerformanceReport(), null, 2);
    }

    /**
     * الحصول على إحصائيات الذاكرة
     */
    getMemoryUsage(): { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } | null {
        if ((performance as any).memory) {
            return {
                usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
                totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
                jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
            };
        }
        return null;
    }

    /**
     * الحصول على معلومات التصفح
     */
    getNavigationTiming(): Record<string, number> {
        const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

        if (!timing) return {};

        return {
            'وقت التنقل': timing.navigationStart,
            'وقت الطلب': timing.requestStart - timing.navigationStart,
            'وقت الاستجابة': timing.responseEnd - timing.requestStart,
            'وقت المعالجة': timing.domInteractive - timing.responseEnd,
            'وقت التحميل الكامل': timing.loadEventEnd - timing.navigationStart,
        };
    }
}

// تصدير مثيل واحد للاستخدام العام
export const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;