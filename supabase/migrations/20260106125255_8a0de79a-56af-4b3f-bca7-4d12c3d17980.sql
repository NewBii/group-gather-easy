-- Fix security definer view issue by recreating with SECURITY INVOKER (default)
DROP VIEW IF EXISTS public.participants_masked;

CREATE VIEW public.participants_masked 
WITH (security_invoker = true) AS
SELECT 
  id,
  event_id,
  name,
  is_organizer,
  location_lat,
  location_lng,
  transport_mode,
  created_at,
  updated_at,
  CASE 
    WHEN user_id = auth.uid() THEN email
    ELSE NULL
  END as email,
  CASE 
    WHEN user_id = auth.uid() THEN user_id
    ELSE NULL
  END as user_id
FROM participants;