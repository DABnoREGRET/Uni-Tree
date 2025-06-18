-- Fix get_leaderboard() return columns to include both total_points and all_time_points
DROP FUNCTION IF EXISTS public.get_leaderboard();

CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  rank integer,
  user_id uuid,
  username text,
  avatar_url text,
  total_points integer,
  all_time_points integer,
  student_id text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY p.all_time_points DESC) AS rank,
    p.id,
    COALESCE(p.username, 'Anonymous') AS username,
    p.avatar_url,
    p.total_points,
    p.all_time_points,
    p.student_id
  FROM public.profiles p
  ORDER BY p.all_time_points DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 