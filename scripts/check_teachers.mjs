// Script to check teachers table and insert seed data
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xwccjbeqfvyzdaxsabhy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3Y2NqYmVxZnZ5emRheHNhYmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MzQxODMsImV4cCI6MjA3ODMxMDE4M30.TGXkz6MPIIEU1hZnV1O_7ZlSJKL1v07gWpuxbJyf_6g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndInsertTeachers() {
    console.log('=== Checking teachers table ===\n');

    // Check if teachers table exists and has data
    const { data: existingTeachers, error: selectError } = await supabase
        .from('teachers')
        .select('teacher_id, full_name_ar, employment_status')
        .limit(10);

    if (selectError) {
        console.log('Error querying teachers:', selectError.message);
        console.log('\nTable might not exist or have RLS issues');
    } else {
        console.log('Existing teachers:', existingTeachers?.length || 0);
        if (existingTeachers && existingTeachers.length > 0) {
            console.log('Teachers found:');
            existingTeachers.forEach(t => console.log(`  - ${t.teacher_id}: ${t.full_name_ar} (${t.employment_status})`));
        }
    }

    // If no teachers, insert sample data
    if (!existingTeachers || existingTeachers.length === 0) {
        console.log('\n=== Inserting sample teachers ===\n');

        const sampleTeachers = [
            {
                teacher_id: 'TCH-2024-001',
                full_name_ar: 'أحمد محمد علي حسن',
                full_name_en: 'Ahmed Mohamed Ali',
                national_id: '28501150100123',
                date_of_birth: '1985-01-15',
                nationality: 'مصري',
                gender: 'ذكر',
                religion: 'مسلم',
                marital_status: 'متزوج',
                phone: '01012345678',
                whatsapp_number: '01012345678',
                email: 'ahmed.hassan@school.edu.eg',
                address: '15 شارع النيل، الدقي',
                city: 'الجيزة',
                governorate: 'الجيزة',
                employee_number: 'EMP-001',
                hire_date: '2015-09-01',
                contract_type: 'دائم',
                employment_status: 'نشط',
                highest_qualification: 'ماجستير',
                qualification_field: 'اللغة العربية',
                school_branch: 'الفرع الرئيسي',
                department: 'قسم اللغة العربية',
                job_title: 'معلم أول',
                specialization: 'اللغة العربية'
            },
            {
                teacher_id: 'TCH-2024-002',
                full_name_ar: 'فاطمة أحمد محمود السيد',
                full_name_en: 'Fatma Ahmed Mahmoud',
                national_id: '29003200200456',
                date_of_birth: '1990-03-20',
                nationality: 'مصري',
                gender: 'أنثى',
                religion: 'مسلم',
                marital_status: 'متزوج',
                phone: '01098765432',
                whatsapp_number: '01098765432',
                email: 'fatma.elsayed@school.edu.eg',
                address: '25 شارع المعز، القاهرة',
                city: 'القاهرة',
                governorate: 'القاهرة',
                employee_number: 'EMP-002',
                hire_date: '2018-09-01',
                contract_type: 'دائم',
                employment_status: 'نشط',
                highest_qualification: 'بكالوريوس',
                qualification_field: 'الرياضيات',
                school_branch: 'الفرع الرئيسي',
                department: 'قسم الرياضيات',
                job_title: 'معلم',
                specialization: 'الرياضيات'
            },
            {
                teacher_id: 'TCH-2024-003',
                full_name_ar: 'محمد إبراهيم عبد الرحمن',
                full_name_en: 'Mohamed Ibrahim',
                national_id: '28807100300789',
                date_of_birth: '1988-07-10',
                nationality: 'مصري',
                gender: 'ذكر',
                religion: 'مسلم',
                marital_status: 'متزوج',
                phone: '01155556666',
                whatsapp_number: '01155556666',
                email: 'mohamed.ibrahim@school.edu.eg',
                address: '10 شارع الهرم، الجيزة',
                city: 'الجيزة',
                governorate: 'الجيزة',
                employee_number: 'EMP-003',
                hire_date: '2016-09-01',
                contract_type: 'دائم',
                employment_status: 'نشط',
                highest_qualification: 'ماجستير',
                qualification_field: 'العلوم',
                school_branch: 'الفرع الرئيسي',
                department: 'قسم العلوم',
                job_title: 'معلم أول',
                specialization: 'الفيزياء'
            }
        ];

        const { data: insertedData, error: insertError } = await supabase
            .from('teachers')
            .insert(sampleTeachers)
            .select();

        if (insertError) {
            console.log('Error inserting teachers:', insertError.message);
            console.log('Details:', insertError.details);
        } else {
            console.log('Successfully inserted', insertedData?.length, 'teachers');
        }
    }

    // Check all available tables
    console.log('\n=== Listing all tables ===\n');
    const { data: tables, error: tablesError } = await supabase
        .rpc('get_tables');

    if (tablesError) {
        console.log('Could not list tables:', tablesError.message);
    } else {
        console.log('Available tables:', tables);
    }
}

checkAndInsertTeachers().catch(console.error);
