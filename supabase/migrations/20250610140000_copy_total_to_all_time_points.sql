-- Backfill all_time_points with existing total_points for all rows
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS all_time_points INTEGER NOT NULL DEFAULT 0;

UPDATE public.profiles
  SET all_time_points = total_points
  WHERE (all_time_points IS NULL OR all_time_points = 0) AND total_points IS NOT NULL; 