import { supabase } from '@/lib/supabase';

async function createSampleGrades() {
  console.log('Creating sample grades for student STU20252647...');
  
  // Sample grades data
  const sampleGrades = [
    {
      student_id: 'STU20252647',
      subject_name: 'الرياضيات',
      teacher_name: 'أحمد محمد',
      assessment_type: 'تقييم أسبوعي',
      month: 'أكتوبر',
      original_grade: 18,
      final_grade: 18,
      grade_level: 'ممتاز',
      weight: 0.1,
      created_by: 'أحمد محمد',
      teacher_notes: 'ممتاز في الفهم والتطبيق'
    },
    {
      student_id: 'STU20252647',
      subject_name: 'الرياضيات',
      teacher_name: 'أحمد محمد',
      assessment_type: 'امتحان شهري',
      month: 'أكتوبر',
      original_grade: 45,
      final_grade: 45,
      grade_level: 'ممتاز',
      weight: 0.2,
      created_by: 'أحمد محمد',
      teacher_notes: 'أداء متميز في جميع الأسئلة'
    },
    {
      student_id: 'STU20252647',
      subject_name: 'الرياضيات',
      teacher_name: 'أحمد محمد',
      assessment_type: 'امتحان منتصف الفصل',
      semester: 'الترم الأول',
      original_grade: 88,
      final_grade: 88,
      grade_level: 'ممتاز',
      weight: 0.25,
      created_by: 'أحمد محمد',
      teacher_notes: 'نجح في حل جميع المسائل المعقدة'
    },
    {
      student_id: 'STU20252647',
      subject_name: 'اللغة العربية',
      teacher_name: 'فاطمة علي',
      assessment_type: 'تقييم أسبوعي',
      month: 'أكتوبر',
      original_grade: 19,
      final_grade: 19,
      grade_level: 'ممتاز',
      weight: 0.1,
      created_by: 'فاطمة علي',
      teacher_notes: 'ممتاز في الإعراب والصرف'
    },
    {
      student_id: 'STU20252647',
      subject_name: 'اللغة العربية',
      teacher_name: 'فاطمة علي',
      assessment_type: 'امتحان شهري',
      month: 'أكتوبر',
      original_grade: 47,
      final_grade: 47,
      grade_level: 'ممتاز',
      weight: 0.2,
      created_by: 'فاطمة علي',
      teacher_notes: 'أداء متميز في التحليل الأدبي'
    },
    {
      student_id: 'STU20252647',
      subject_name: 'العلوم',
      teacher_name: 'محمد سعيد',
      assessment_type: 'تقييم أسبوعي',
      month: 'أكتوبر',
      original_grade: 17,
      final_grade: 17,
      grade_level: 'ممتاز',
      weight: 0.1,
      created_by: 'محمد سعيد',
      teacher_notes: 'فهم ممتاز للمفاهيم العلمية'
    },
    {
      student_id: 'STU20252647',
      subject_name: 'العلوم',
      teacher_name: 'محمد سعيد',
      assessment_type: 'امتحان شهري',
      month: 'أكتوبر',
      original_grade: 46,
      final_grade: 46,
      grade_level: 'ممتاز',
      weight: 0.2,
      created_by: 'محمد سعيد',
      teacher_notes: 'أداء متميز في التجارب العملية'
    }
  ];

  // Insert sample grades
  for (const grade of sampleGrades) {
    const { data, error } = await supabase
      .from('grades')
      .insert([grade])
      .select();

    if (error) {
      console.error('Error inserting grade:', error);
      continue;
    }

    console.log('Grade inserted successfully:', data[0].subject_name, '-', data[0].assessment_type);
  }

  console.log('Sample grades creation completed!');
}

// Run the function
createSampleGrades().catch(console.error);