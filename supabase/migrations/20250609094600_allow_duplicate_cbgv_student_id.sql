-- Allow duplicates for student_id 'CBGV'
-- This migration drops the existing unique constraint on student_id
-- and recreates it as a partial unique index so that duplicates
-- are still disallowed for all values EXCEPT the special value 'CBGV'.

-- Drop the old unique constraint if it exists
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_student_id_key;

-- Ensure no conflicting index exists
DROP INDEX IF EXISTS profiles_student_id_unique_idx;

-- Re-create uniqueness with a partial unique index excluding 'CBGV' and NULLs
CREATE UNIQUE INDEX profiles_student_id_unique_idx
  ON public.profiles (student_id)
  WHERE student_id IS NOT NULL AND student_id <> 'CBGV'; 