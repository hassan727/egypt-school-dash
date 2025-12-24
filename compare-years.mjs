import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

const env = dotenv.parse(fs.readFileSync('.env'));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

console.log('🔍 مقارنة دقيقة للسنوات الدراسية...\n');

// 1. جلب السنوات من جدول التعريفات
const { data: years } = await supabase
    .from('academic_years')
    .select('year_code')
    .order('year_code');

console.log('📋 السنوات في جدول academic_years:');
years.forEach(y => {
    console.log(`'${y.year_code}'`);
});

// 2. جلب السنوات من التقارير
const { data: reports } = await supabase
    .from('manual_attendance_reports')
    .select('academic_year_code')
    .order('academic_year_code');

console.log('\n📋 السنوات في جدول التقارير manual_attendance_reports:');
reports.forEach(r => {
    console.log(`'${r.academic_year_code}'`);
});

// 3. مقارنة
const year = '2025-2026';
const report = reports[0];
if (report && report.academic_year_code === year) {
    console.log(`\n✅ تطابق تام: '${report.academic_year_code}' === '${year}'`);
} else if (report) {
    console.log(`\n❌ عدم تطابق: '${report.academic_year_code}' !== '${year}'`);
    console.log(`Codes: Report=${report.academic_year_code.charCodeAt(0)}, Target=${year.charCodeAt(0)}`);
}
