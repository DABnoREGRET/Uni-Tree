-- Convert existing dicebear SVG avatars to PNG for mobile rendering
UPDATE public.profiles
SET avatar_url = regexp_replace(avatar_url, '/svg\?', '/png?')
WHERE avatar_url LIKE '%api.dicebear.com%/svg?%'; 