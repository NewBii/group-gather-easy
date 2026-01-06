-- Create a function to safely get a participant by ID (for session restore)
-- Uses SECURITY DEFINER to bypass RLS, allowing anonymous users to restore their session
CREATE OR REPLACE FUNCTION public.get_participant_by_id(p_participant_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  user_id uuid,
  is_organizer boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.email, p.user_id, p.is_organizer
  FROM participants p
  WHERE p.id = p_participant_id;
END;
$$;