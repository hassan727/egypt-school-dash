import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

const env = dotenv.parse(fs.readFileSync('.env'));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

console.log('🔍 فحص شامل لكل التقارير...\n');

const { data: reports, error } = await supabase
    .from('manual_attendance_reports')
    .select('id, report_title, report_date, academic_year_code, created_at')
    .order('created_at', { ascending: false });

if (error) {
    console.error('Error:', error);
} else {
    console.log(`تم العثور على ${reports.length} تقرير:\n`);
    reports.forEach((r, idx) => {
        console.log(`${idx + 1}. [${r.report_title}]`);
        console.log(`   ID: ${r.id}`);
        console.log(`   Date: ${r.report_date}`);
        console.log(`   Year Code: "${r.academic_year_code}" (Type: ${typeof r.academic_year_code})`);
        console.log(`   Created At: ${r.created_at}`);

        // Check if it matches '2025-2026'
        const matches = r.academic_year_code === '2025-2026';
        console.log(`   Matches '2025-2026'? ${matches ? '✅ Yes' : '❌ No'}`);
        console.log('---');
    });
}
