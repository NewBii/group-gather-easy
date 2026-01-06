-- Update join_event_as_participant to properly bypass RLS
-- The key is using SET row_security = off in the function definition
CREATE OR REPLACE FUNCTION public.join_event_as_participant(p_event_id uuid, p_name text, p_email text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, name text, email text, user_id uuid, is_organizer boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET row_security TO off
AS $function$
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
  
  -- Insert the participant (row_security = off allows this to bypass RLS)
  INSERT INTO participants (event_id, name, email, user_id, is_organizer)
  VALUES (p_event_id, trim(p_name), nullif(trim(p_email), ''), v_user_id, false)
  RETURNING participants.id INTO v_participant_id;
  
  -- Return the inserted participant
  RETURN QUERY
  SELECT p.id, p.name, p.email, p.user_id, p.is_organizer
  FROM participants p
  WHERE p.id = v_participant_id;
END;
$function$;

-- Ensure the function is accessible
GRANT EXECUTE ON FUNCTION public.join_event_as_participant(uuid, text, text) TO PUBLIC;