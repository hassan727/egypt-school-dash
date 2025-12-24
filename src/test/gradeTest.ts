import { supabase } from '@/lib/supabase';

async function testGradeOperations() {
  console.log('Testing grade operations...');
  
  // Test inserting a grade
  const { data, error } = await supabase
    .from('grades')
    .insert([{
      student_id: 'STU20252647',
      subject_name: 'الرياضيات',
      teacher_name: 'أحمد محمد',
      assessment_type: 'امتحان نهاية الفصل',
      semester: 'الترم الأول',
      original_grade: 95,
      final_grade: 95,
      grade_level: 'ممتاز',
      weight: 0.3,
      created_by: 'أحمد محمد',
    }])
    .select();

  if (error) {
    console.error('Error inserting grade:', error);
    return;
  }

  console.log('Grade inserted successfully:', data);

  // Test querying grades
  const { data: grades, error: queryError } = await supabase
    .from('grades')
    .select('*')
    .eq('student_id', 'STU20252647');

  if (queryError) {
    console.error('Error querying grades:', queryError);
    return;
  }

  console.log('Grades retrieved successfully:', grades);

  // Test deleting the grade
  if (data && data[0] && data[0].id) {
    const { error: deleteError } = await supabase
      .from('grades')
      .delete()
      .eq('id', data[0].id);

    if (deleteError) {
      console.error('Error deleting grade:', deleteError);
      return;
    }

    console.log('Grade deleted successfully');
  }
}

// Run the test
testGradeOperations().catch(console.error);