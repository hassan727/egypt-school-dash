-- Create an RPC to securely create an auth user for a specific school
-- Required since we don't have a backend to use the admin API, and signup logs the current user out.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.create_school_admin_user(
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT,
    p_school_id UUID,
    p_role TEXT DEFAULT 'school_admin'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER   -- Run with the privileges of the creator
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID;
    v_encrypted_password TEXT;
BEGIN
    -- 1. Check if the email already exists in auth.users
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
        RAISE EXCEPTION 'هذا البريد الإلكتروني مسجل بالفعل';
    END IF;

    -- 2. Generate new UUID for the user
    v_user_id := gen_random_uuid();
    v_encrypted_password := crypt(p_password, gen_salt('bf'));

    -- 3. Insert into auth.users (Internal Supabase Auth Schema)
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        p_email,
        v_encrypted_password,
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}',
        json_build_object('full_name', p_full_name, 'school_id', p_school_id),
        now(),
        now(),
        '',
        '',
        '',
        ''
    );

    -- 4. Insert into auth.identities (Required for sign in)
    INSERT INTO auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        v_user_id,
        v_user_id::text,
        format('{"sub":"%s","email":"%s"}', v_user_id::text, p_email)::jsonb,
        'email',
        now(),
        now(),
        now()
    );

    -- 5. Insert into public.system_users (Frontend facing user table)
    INSERT INTO public.system_users (
        auth_user_id,
        full_name,
        email,
        role,
        school_id,
        is_active
    ) VALUES (
        v_user_id,
        p_full_name,
        p_email,
        p_role,
        p_school_id,
        true
    ) ON CONFLICT (email) DO UPDATE SET
        auth_user_id = EXCLUDED.auth_user_id,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        school_id = EXCLUDED.school_id;

    RETURN v_user_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'فشل إنشاء المستخدم: %', SQLERRM;
END;
$$;
