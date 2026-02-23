import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

const env = dotenv.parse(fs.readFileSync('.env'));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

console.log('🔧 FORCE FIXING REPORTS...\n');

// Get all reports
const { data: reports, error } = await supabase
    .from('manual_attendance_reports')
    .select('*');

if (error) {
    console.error('Error fetching:', error);
    process.exit(1);
}

console.log(`Found ${reports.length} reports.`);

for (const report of reports) {
    console.log(`Processing ${report.id} - Current Code: "${report.academic_year_code}"`);

    // Check if invalid (null, empty, or 'test')
    if (!report.academic_year_code || report.academic_year_code === '' || report.academic_year_code === 'test') {
        console.log(`   -> Needs update to '2025-2026'`);

        const { error: updateError } = await supabase
            .from('manual_attendance_reports')
            .update({ academic_year_code: '2025-2026' })
            .eq('id', report.id);

        if (updateError) {
            console.error(`   ❌ Failed to update: ${updateError.message}`);
        } else {
            console.log(`   ✅ Updated successfully.`);
        }
    } else {
        console.log(`   -> Valid, skipping.`);
    }
}
