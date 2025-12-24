import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

const env = dotenv.parse(fs.readFileSync('.env'));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

console.log('🔍 فحص مشكلة السنة الدراسية...\n');

// 1. فحص البيانات المحفوظة
const { data: reports } = await supabase
    .from('manual_attendance_reports')
    .select('id, report_date, academic_year_code, academic_year_id, report_title')
    .order('created_at', { ascending: false });

console.log('📊 التقارير المحفوظة:');
console.log(JSON.stringify(reports, null, 2));

// 2. فحص جدول academic_years
const { data: years } = await supabase
    .from('academic_years')
    .select('*')
    .order('year_code', { ascending: false });

console.log('\n📅 السنوات الدراسية المتاحة:');
console.log(JSON.stringify(years, null, 2));
