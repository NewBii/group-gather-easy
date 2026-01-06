-- Fix the view to explicitly use SECURITY INVOKER (default, but explicit is better)
DROP VIEW IF EXISTS public.participants_public;

CREATE VIEW public.participants_public 
WITH (security_invoker = true)
AS
SELECT id, event_id, name, is_organizer, created_at
FROM participants;

-- Grant access to the view
GRANT SELECT ON public.participants_public TO PUBLIC;
GRANT SELECT ON public.participants_public TO anon;
GRANT SELECT ON public.participants_public TO authenticated;