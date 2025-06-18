-- Add all_time_points column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS all_time_points INTEGER NOT NULL DEFAULT 0;

-- Update default for existing rows
UPDATE public.profiles SET all_time_points = COALESCE(all_time_points, 0);

-- Ensure handle_new_user inserts with 0
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, avatar_url, student_id, all_time_points)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'user_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'student_id',
    0
  );
  RETURN NEW;
END;
$$;

-- Update credit_wifi_time RPC (if exists) to also increment all_time_points
-- We defensively drop then recreate
DROP FUNCTION IF EXISTS public.credit_wifi_time(duration_ms_input bigint);

CREATE OR REPLACE FUNCTION public.credit_wifi_time(duration_ms_input bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  minutes_to_credit integer;
BEGIN
  IF duration_ms_input IS NULL OR duration_ms_input <= 0 THEN
    RAISE EXCEPTION 'Invalid duration';
  END IF;
  minutes_to_credit := FLOOR(duration_ms_input / 60000);
  IF minutes_to_credit = 0 THEN
    RETURN;
  END IF;

  UPDATE public.profiles
  SET total_points = total_points + minutes_to_credit,
      all_time_points = all_time_points + minutes_to_credit
  WHERE id = auth.uid();
END;
$$;

-- Recreate leaderboard view / RPC to use all_time_points
DROP FUNCTION IF EXISTS public.get_leaderboard();

CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  rank integer,
  user_id uuid,
  username text,
  avatar_url text,
  all_time_points integer,
  student_id text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY p.all_time_points DESC) AS rank,
    p.id AS user_id,
    COALESCE(p.username, 'Anonymous') AS username,
    p.avatar_url,
    p.all_time_points,
    p.student_id
  FROM public.profiles p
  ORDER BY p.all_time_points DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 