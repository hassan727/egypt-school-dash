import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

const env = dotenv.parse(fs.readFileSync('.env'));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

console.log('🔧 جاري إصلاح البيانات (تعيين السنة الدراسية للتقارير المفقودة)...\n');

// تحديث التقارير التي لا تملك كود سنة
const { data, error } = await supabase
    .from('manual_attendance_reports')
    .update({ academic_year_code: '2025-2026' })
    .is('academic_year_code', null)
    .select();

if (error) {
    console.error('❌ خطأ في التحديث:', error.message);
} else {
    console.log(`✅ تم تحديث ${data.length} تقرير.`);
    data.forEach(r => console.log(`   - تم إصلاح التقرير: ${r.report_title} (${r.id})`));
}
