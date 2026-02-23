import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

const env = dotenv.parse(fs.readFileSync('.env'));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

console.log('🔧 جاري إصلاح البيانات (القيم الفارغة)...\n');

// 1. تحديث القيم الفارغة سلسلة نصية فارغة
const { data: emptyStringData, error: err1 } = await supabase
    .from('manual_attendance_reports')
    .update({ academic_year_code: '2025-2026' })
    .eq('academic_year_code', '')
    .select();

if (err1) console.error('Error 1:', err1);
else console.log(`✅ تم تحديث ${emptyStringData.length} تقرير (كانت فارغة).`);

// 2. تحديث قيم 'test' (اختياري)
const { data: testData, error: err2 } = await supabase
    .from('manual_attendance_reports')
    .update({ academic_year_code: '2025-2026' })
    .eq('academic_year_code', 'test')
    .select();

if (err2) console.error('Error 2:', err2);
else console.log(`✅ تم تحديث ${testData.length} تقرير (كانت test).`);
