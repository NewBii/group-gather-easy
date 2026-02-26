CREATE OR REPLACE FUNCTION public.join_event_as_participant(
  p_event_id uuid,
  p_name text,
  p_email text DEFAULT NULL::text
)
RETURNS TABLE(id uuid, name text, email text, user_id uuid, is_organizer boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_participant_id uuid;
  v_email_trimmed text;
BEGIN
  -- Get current user (may be null for anonymous)
  v_user_id := auth.uid();

  -- Validate name
  IF p_name IS NULL OR length(trim(p_name)) < 1 THEN
    RAISE EXCEPTION 'Name cannot be empty';
  END IF;

  IF length(trim(p_name)) > 100 THEN
    RAISE EXCEPTION 'Name must be 100 characters or less';
  END IF;

  -- Validate email format if provided
  v_email_trimmed := nullif(trim(p_email), '');
  IF v_email_trimmed IS NOT NULL THEN
    IF length(v_email_trimmed) > 255 THEN
      RAISE EXCEPTION 'Email must be 255 characters or less';
    END IF;

    IF NOT v_email_trimmed ~ '^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$' THEN
      RAISE EXCEPTION 'Invalid email format';
    END IF;
  END IF;

  -- Check event exists
  IF NOT EXISTS (SELECT 1 FROM public.events WHERE public.events.id = p_event_id) THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  -- Insert participant
  INSERT INTO public.participants (event_id, name, email, user_id, is_organizer)
  VALUES (p_event_id, trim(p_name), v_email_trimmed, v_user_id, false)
  RETURNING public.participants.id INTO v_participant_id;

  RETURN QUERY
  SELECT p.id, p.name, p.email, p.user_id, p.is_organizer
  FROM public.participants p
  WHERE p.id = v_participant_id;
END;
$function$;