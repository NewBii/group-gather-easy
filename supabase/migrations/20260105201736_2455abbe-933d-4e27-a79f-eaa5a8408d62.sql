-- Create a function to join an event that returns the participant
-- Uses SECURITY DEFINER to bypass RLS for the return operation
CREATE OR REPLACE FUNCTION public.join_event_as_participant(
  p_event_id uuid,
  p_name text,
  p_email text DEFAULT NULL
)
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
DECLARE
  v_user_id uuid;
  v_participant_id uuid;
BEGIN
  -- Get current user (may be null for anonymous)
  v_user_id := auth.uid();
  
  -- Validate input
  IF p_name IS NULL OR length(trim(p_name)) < 1 THEN
    RAISE EXCEPTION 'Name cannot be empty';
  END IF;
  
  IF length(trim(p_name)) > 100 THEN
    RAISE EXCEPTION 'Name must be 100 characters or less';
  END IF;
  
  -- Insert the participant
  INSERT INTO participants (event_id, name, email, user_id, is_organizer)
  VALUES (p_event_id, trim(p_name), nullif(trim(p_email), ''), v_user_id, false)
  RETURNING participants.id INTO v_participant_id;
  
  -- Return the inserted participant
  RETURN QUERY
  SELECT p.id, p.name, p.email, p.user_id, p.is_organizer
  FROM participants p
  WHERE p.id = v_participant_id;
END;
$$;