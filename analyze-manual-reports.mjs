import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// تحميل متغيرات البيئة
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ خطأ: لم يتم العثور على VITE_SUPABASE_URL أو VITE_SUPABASE_ANON_KEY في ملف .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 فحص جداول التقارير اليدوية...\n');
console.log('='.repeat(80));

async function analyzeManualReports() {
    try {
        // 1. فحص جدول التقارير الرئيسي
        console.log('\n📊 جدول التقارير الرئيسي (manual_attendance_reports):');
        console.log('-'.repeat(80));

        const { data: reports, error: reportsError, count: reportsCount } = await supabase
            .from('manual_attendance_reports')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (reportsError) {
            console.error('❌ خطأ في جلب التقارير:', reportsError.message);
        } else {
            console.log(`✅ عدد التقارير المحفوظة: ${reportsCount || 0}`);

            if (reports && reports.length > 0) {
                console.log('\n📋 آخر 5 تقارير:\n');
                reports.slice(0, 5).forEach((report, index) => {
                    console.log(`${index + 1}. ${report.report_title || 'بدون عنوان'}`);
                    console.log(`   - ID: ${report.id}`);
                    console.log(`   - التاريخ: ${report.report_date}`);
                    console.log(`   - العام الدراسي: ${report.academic_year_code || 'غير محدد'}`);
                    console.log(`   - إجمالي المقيدين: ${report.total_enrolled}`);
                    console.log(`   - إجمالي الحاضرين: ${report.total_present}`);
                    console.log(`   - إجمالي الغائبين: ${report.total_absent}`);
                    console.log(`   - نسبة الحضور: ${report.attendance_rate}%`);
                    console.log(`   - نسبة الغياب: ${report.absence_rate}%`);
                    console.log(`   - تاريخ الإنشاء: ${new Date(report.created_at).toLocaleString('ar-EG')}`);
                    console.log('');
                });
            } else {
                console.log('⚠️  لا توجد تقارير محفوظة حالياً');
            }
        }

        // 2. فحص جدول الإدخالات التفصيلية
        console.log('\n📝 جدول الإدخالات التفصيلية (manual_attendance_entries):');
        console.log('-'.repeat(80));

        const { data: entries, error: entriesError, count: entriesCount } = await supabase
            .from('manual_attendance_entries')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .limit(10);

        if (entriesError) {
            console.error('❌ خطأ في جلب الإدخالات:', entriesError.message);
        } else {
            console.log(`✅ عدد الإدخالات المحفوظة: ${entriesCount || 0}`);

            if (entries && entries.length > 0) {
                console.log('\n📋 آخر 10 إدخالات:\n');
                entries.forEach((entry, index) => {
                    console.log(`${index + 1}. ${entry.stage_name} - ${entry.class_name}`);
                    console.log(`   - Report ID: ${entry.report_id}`);
                    console.log(`   - المقيدين: ${entry.enrolled}, الحاضرين: ${entry.present}, الغائبين: ${entry.absent}`);
                    console.log(`   - نسبة الحضور: ${entry.attendance_rate}%, نسبة الغياب: ${entry.absence_rate}%`);
                    console.log('');
                });
            } else {
                console.log('⚠️  لا توجد إدخالات محفوظة حالياً');
            }
        }

        // 3. إحصائيات عامة
        console.log('\n📈 إحصائيات عامة:');
        console.log('-'.repeat(80));

        if (reports && reports.length > 0) {
            const totalEnrolled = reports.reduce((sum, r) => sum + (r.total_enrolled || 0), 0);
            const totalPresent = reports.reduce((sum, r) => sum + (r.total_present || 0), 0);
            const totalAbsent = reports.reduce((sum, r) => sum + (r.total_absent || 0), 0);
            const avgAttendanceRate = reports.reduce((sum, r) => sum + (r.attendance_rate || 0), 0) / reports.length;

            console.log(`إجمالي الطلاب في جميع التقارير: ${totalEnrolled}`);
            console.log(`إجمالي الحاضرين: ${totalPresent}`);
            console.log(`إجمالي الغائبين: ${totalAbsent}`);
            console.log(`متوسط نسبة الحضور: ${avgAttendanceRate.toFixed(2)}%`);

            // توزيع التقارير حسب العام الدراسي
            const yearDistribution = reports.reduce((acc, r) => {
                const year = r.academic_year_code || 'غير محدد';
                acc[year] = (acc[year] || 0) + 1;
                return acc;
            }, {});

            console.log('\nتوزيع التقارير حسب العام الدراسي:');
            Object.entries(yearDistribution).forEach(([year, count]) => {
                console.log(`  - ${year}: ${count} تقرير`);
            });
        }

        // 4. فحص الـ RPC Function
        console.log('\n🔧 فحص وظيفة RPC (save_manual_report_transaction):');
        console.log('-'.repeat(80));

        try {
            // محاولة استدعاء الدالة بمعاملات اختبارية (لن تحفظ شيئاً لأن p_report_id سيكون null)
            const { data: functionTest, error: functionError } = await supabase.rpc('save_manual_report_transaction', {
                p_report_id: '00000000-0000-0000-0000-000000000000', // UUID وهمي للتحديث (لن يجد شيئاً)
                p_report_date: '2025-01-01',
                p_academic_year_code: 'test',
                p_report_title: 'اختبار',
                p_notes: '',
                p_total_enrolled: 0,
                p_total_present: 0,
                p_total_absent: 0,
                p_attendance_rate: 0,
                p_absence_rate: 0,
                p_entries: []
            });

            if (functionError) {
                if (functionError.message.includes('does not exist') || functionError.code === '42883') {
                    console.log('❌ الدالة غير موجودة في قاعدة البيانات!');
                    console.log('   يجب تشغيل: npx supabase db push --include-all');
                } else {
                    console.log('✅ الدالة موجودة وتعمل (اختبار ناجح)');
                }
            } else {
                console.log('✅ الدالة موجودة وتعمل بشكل صحيح');
            }
        } catch (err) {
            console.log('❌ خطأ في اختبار الدالة:', err.message);
        }

        console.log('\n' + '='.repeat(80));
        console.log('✅ انتهى الفحص');

    } catch (error) {
        console.error('❌ خطأ عام:', error);
    }
}

// تشغيل التحليل
analyzeManualReports();
