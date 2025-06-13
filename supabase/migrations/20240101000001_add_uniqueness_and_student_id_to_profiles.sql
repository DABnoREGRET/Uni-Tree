-- Add student_id column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'student_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN student_id TEXT;
  END IF;
END;
$$;

-- Add unique constraint on email if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND constraint_name = 'profiles_email_key'
    AND constraint_type = 'UNIQUE'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
  END IF;
END;
$$;

-- Add unique constraint on username if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND constraint_name = 'profiles_username_key'
    AND constraint_type = 'UNIQUE'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
END;
$$;

-- Add unique constraint on student_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND constraint_name = 'profiles_student_id_key'
    AND constraint_type = 'UNIQUE'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_student_id_key UNIQUE (student_id);
  END IF;
END;
$$;

-- Update the function to include student_id and handle empty strings for uniqueness
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, avatar_url, student_id)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'user_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'student_id'
  );
  RETURN new;
END;
$$; 