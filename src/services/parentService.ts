/**
 * Parent Service - خدمة إدارة أولياء الأمور
 * Smart Parent Management with Student Linking
 */

import { supabase } from '@/lib/supabase';
import type { Parent, StudentParentLink } from '@/types/auth';
import type { GuardianData, MotherData } from '@/types/student';

// =============================================
// PARENT CRUD OPERATIONS - عمليات ولي الأمر
// =============================================

/**
 * Find or create parent based on national ID and school
 * البحث عن ولي أمر أو إنشاؤه
 */
export const findOrCreateParent = async (
    data: {
        fullName: string;
        nationalId?: string;
        phone?: string;
        whatsapp?: string;
        email?: string;
        job?: string;
        workplace?: string;
        educationLevel?: string;
        address?: string;
        relationshipType: string;
    },
    schoolId: string
): Promise<Parent | null> => {
    try {
        // If national ID exists, try to find existing parent
        if (data.nationalId) {
            const { data: existing, error: findError } = await supabase
                .from('parents')
                .select('*')
                .eq('school_id', schoolId)
                .eq('national_id', data.nationalId)
                .single();

            if (!findError && existing) {
                // Update existing parent with new data
                const { data: updated, error: updateError } = await supabase
                    .from('parents')
                    .update({
                        full_name: data.fullName,
                        phone: data.phone,
                        whatsapp: data.whatsapp,
                        email: data.email,
                        job: data.job,
                        workplace: data.workplace,
                        education_level: data.educationLevel,
                        address: data.address,
                        relationship_type: data.relationshipType
                    })
                    .eq('id', existing.id)
                    .select()
                    .single();

                if (!updateError && updated) {
                    return mapParentFromDB(updated);
                }
                return mapParentFromDB(existing);
            }
        }

        // Create new parent
        const { data: newParent, error: createError } = await supabase
            .from('parents')
            .insert({
                school_id: schoolId,
                full_name: data.fullName,
                national_id: data.nationalId,
                phone: data.phone,
                whatsapp: data.whatsapp,
                email: data.email,
                job: data.job,
                workplace: data.workplace,
                education_level: data.educationLevel,
                address: data.address,
                relationship_type: data.relationshipType
            })
            .select()
            .single();

        if (createError) {
            console.error('Error creating parent:', createError);
            return null;
        }

        return mapParentFromDB(newParent);
    } catch (error) {
        console.error('Error in findOrCreateParent:', error);
        return null;
    }
};

/**
 * Link parent to student
 * ربط ولي الأمر بالطالب
 */
export const linkParentToStudent = async (
    parentId: string,
    studentId: string,
    isPrimary: boolean = false,
    relationship?: string
): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('student_parent')
            .upsert({
                student_id: studentId,
                parent_id: parentId,
                is_primary: isPrimary,
                relationship: relationship
            }, {
                onConflict: 'student_id,parent_id'
            });

        return !error;
    } catch (error) {
        console.error('Error linking parent to student:', error);
        return false;
    }
};

/**
 * Get parents by student ID
 * جلب أولياء أمور الطالب
 */
export const getParentsByStudent = async (
    studentId: string
): Promise<(Parent & { isPrimary: boolean })[]> => {
    try {
        const { data, error } = await supabase
            .from('student_parent')
            .select(`
                is_primary,
                relationship,
                parents!inner(*)
            `)
            .eq('student_id', studentId);

        if (error) throw error;

        return (data || []).map((link: any) => ({
            ...mapParentFromDB(link.parents),
            isPrimary: link.is_primary
        }));
    } catch (error) {
        console.error('Error fetching parents:', error);
        return [];
    }
};

/**
 * Get students by parent ID
 * جلب طلاب ولي الأمر
 */
export const getStudentsByParent = async (
    parentId: string
): Promise<{ studentId: string; fullName: string; stage: string; class: string; isPrimary: boolean }[]> => {
    try {
        const { data, error } = await supabase
            .from('student_parent')
            .select(`
                is_primary,
                students!inner(
                    student_id,
                    full_name_ar,
                    stage,
                    class
                )
            `)
            .eq('parent_id', parentId);

        if (error) throw error;

        return (data || []).map((link: any) => ({
            studentId: link.students.student_id,
            fullName: link.students.full_name_ar,
            stage: link.students.stage || '',
            class: link.students.class || '',
            isPrimary: link.is_primary
        }));
    } catch (error) {
        console.error('Error fetching students by parent:', error);
        return [];
    }
};

/**
 * Set primary parent for student
 * تعيين ولي الأمر الأساسي
 */
export const setPrimaryParent = async (
    studentId: string,
    parentId: string
): Promise<boolean> => {
    try {
        // First, remove primary from all parents of this student
        await supabase
            .from('student_parent')
            .update({ is_primary: false })
            .eq('student_id', studentId);

        // Then set the new primary
        const { error } = await supabase
            .from('student_parent')
            .update({ is_primary: true })
            .eq('student_id', studentId)
            .eq('parent_id', parentId);

        return !error;
    } catch (error) {
        console.error('Error setting primary parent:', error);
        return false;
    }
};

/**
 * Unlink parent from student
 * فك ارتباط ولي الأمر بالطالب
 */
export const unlinkParentFromStudent = async (
    parentId: string,
    studentId: string
): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('student_parent')
            .delete()
            .eq('parent_id', parentId)
            .eq('student_id', studentId);

        return !error;
    } catch (error) {
        console.error('Error unlinking parent:', error);
        return false;
    }
};

// =============================================
// HELPER: Process Guardian/Mother from Student Form
// =============================================

/**
 * Process guardian data from student form and create/link parent
 */
export const processGuardianData = async (
    guardianData: GuardianData,
    studentId: string,
    schoolId: string
): Promise<boolean> => {
    try {
        // Create or find guardian
        const parent = await findOrCreateParent({
            fullName: guardianData.fullName,
            nationalId: guardianData.nationalId,
            phone: guardianData.phone,
            whatsapp: guardianData.whatsappNumber,
            email: guardianData.email,
            job: guardianData.job,
            workplace: guardianData.workplace,
            educationLevel: guardianData.educationLevel,
            address: guardianData.address,
            relationshipType: guardianData.relationship
        }, schoolId);

        if (!parent) return false;

        // Link to student as primary
        return await linkParentToStudent(
            parent.id,
            studentId,
            true,
            guardianData.relationship
        );
    } catch (error) {
        console.error('Error processing guardian data:', error);
        return false;
    }
};

/**
 * Process mother data from student form and create/link parent
 */
export const processMotherData = async (
    motherData: MotherData,
    studentId: string,
    schoolId: string
): Promise<boolean> => {
    try {
        // Skip if no mother data
        if (!motherData.fullName) return true;

        // Create or find mother
        const parent = await findOrCreateParent({
            fullName: motherData.fullName,
            nationalId: motherData.nationalId,
            phone: motherData.phone,
            whatsapp: motherData.whatsappNumber,
            email: motherData.email,
            job: motherData.job,
            workplace: motherData.workplace,
            educationLevel: motherData.educationLevel,
            address: motherData.address,
            relationshipType: 'أم'
        }, schoolId);

        if (!parent) return false;

        // Link to student (not primary)
        return await linkParentToStudent(
            parent.id,
            studentId,
            false,
            'أم'
        );
    } catch (error) {
        console.error('Error processing mother data:', error);
        return false;
    }
};

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Map database row to Parent interface
 */
const mapParentFromDB = (row: any): Parent => ({
    id: row.id,
    schoolId: row.school_id,
    fullName: row.full_name,
    nationalId: row.national_id,
    phone: row.phone,
    phoneSecondary: row.phone_secondary,
    whatsapp: row.whatsapp,
    email: row.email,
    job: row.job,
    workplace: row.workplace,
    educationLevel: row.education_level,
    address: row.address,
    governorate: row.governorate,
    city: row.city,
    relationshipType: row.relationship_type,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
});
