-- Fix get_participant_by_id function to include authorization checks
-- This prevents unauthorized access to participant data (including emails)

CREATE OR REPLACE FUNCTION public.get_participant_by_id(p_participant_id uuid)
RETURNS TABLE(id uuid, name text, email text, user_id uuid, is_organizer boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_calling_user_id uuid;
  v_participant_user_id uuid;
  v_participant_event_id uuid;
  v_event_created_by uuid;
BEGIN
  -- Get the calling user (may be NULL for anonymous)
  v_calling_user_id := auth.uid();
  
  -- Get participant info
  SELECT p.user_id, p.event_id INTO v_participant_user_id, v_participant_event_id
  FROM participants p
  WHERE p.id = p_participant_id;
  
  -- If participant not found, return nothing
  IF v_participant_event_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Get event creator
  SELECT e.created_by INTO v_event_created_by
  FROM events e
  WHERE e.id = v_participant_event_id;
  
  -- Authorization checks:
  -- 1. Authenticated user owns this participant
  IF v_calling_user_id IS NOT NULL AND v_participant_user_id = v_calling_user_id THEN
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.user_id, p.is_organizer
    FROM participants p
    WHERE p.id = p_participant_id;
    RETURN;
  END IF;
  
  -- 2. Authenticated user is the event creator
  IF v_calling_user_id IS NOT NULL AND v_event_created_by = v_calling_user_id THEN
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.user_id, p.is_organizer
    FROM participants p
    WHERE p.id = p_participant_id;
    RETURN;
  END IF;
  
  -- 3. Anonymous participant in anonymous event (session restoration)
  -- The participant must be anonymous (user_id IS NULL) AND event must be anonymous (created_by IS NULL)
  IF v_calling_user_id IS NULL AND v_participant_user_id IS NULL AND v_event_created_by IS NULL THEN
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.user_id, p.is_organizer
    FROM participants p
    WHERE p.id = p_participant_id;
    RETURN;
  END IF;
  
  -- Default: deny access - return nothing
  RETURN;
END;
$function$;