import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

const env = dotenv.parse(fs.readFileSync('.env'));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

console.log('🔍 Deep string inspection...\n');

// Fetch unique academic_year_code values
const { data: reports } = await supabase
    .from('manual_attendance_reports')
    .select('academic_year_code, id');

if (!reports || reports.length === 0) {
    console.log('No reports found.');
    process.exit(0);
}

reports.forEach(r => {
    const code = r.academic_year_code;
    console.log(`Report ID: ${r.id}`);
    console.log(`Value: "${code}"`);
    console.log(`Length: ${code ? code.length : 'NULL'}`);
    if (code) {
        console.log('Char codes:', Array.from(code).map(c => c.charCodeAt(0)));
    }
    console.log('---');
});

// Also check the academic_years table
const { data: years } = await supabase
    .from('academic_years')
    .select('year_code');

console.log('\nGlobal Academic Years:');
years.forEach(y => {
    const code = y.year_code;
    console.log(`Value: "${code}"`);
    console.log(`Length: ${code ? code.length : 'NULL'}`);
    if (code) {
        console.log('Char codes:', Array.from(code).map(c => c.charCodeAt(0)));
    }
    console.log('---');
});
