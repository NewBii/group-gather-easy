
-- ISSUE 1: Tighten participants SELECT policy to prevent email exposure to anonymous users
-- Remove the broad "anonymous event" leg that exposes all columns (including email) to anyone
DROP POLICY IF EXISTS "Users can view their own participant record" ON public.participants;

CREATE POLICY "Users can view their own participant record"
ON public.participants
FOR SELECT
USING (
  -- Authenticated user owns this participant
  ((auth.uid() IS NOT NULL) AND (user_id = auth.uid()))
  OR
  -- Authenticated user is a participant of the same event (can see co-participants)
  ((auth.uid() IS NOT NULL) AND is_participant_of_event(event_id, auth.uid()))
  OR
  -- Authenticated user is the event organizer
  ((auth.uid() IS NOT NULL) AND (EXISTS (
    SELECT 1 FROM events e WHERE e.id = participants.event_id AND e.created_by = auth.uid()
  )))
);

-- ISSUE 2: Fix get_participant_by_id to mask email for anonymous callers
-- The anonymous path previously returned full email for any unauthenticated caller
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
  v_calling_user_id := auth.uid();
  
  SELECT p.user_id, p.event_id INTO v_participant_user_id, v_participant_event_id
  FROM participants p
  WHERE p.id = p_participant_id;
  
  IF v_participant_event_id IS NULL THEN
    RETURN;
  END IF;
  
  SELECT e.created_by INTO v_event_created_by
  FROM events e
  WHERE e.id = v_participant_event_id;
  
  -- Authenticated user owns this participant: return full data including email
  IF v_calling_user_id IS NOT NULL AND v_participant_user_id = v_calling_user_id THEN
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.user_id, p.is_organizer
    FROM participants p
    WHERE p.id = p_participant_id;
    RETURN;
  END IF;
  
  -- Anonymous participant restoring own session in anonymous event:
  -- Return name and ID but MASK email to prevent enumeration attacks
  IF v_calling_user_id IS NULL AND v_participant_user_id IS NULL AND v_event_created_by IS NULL THEN
    RETURN QUERY
    SELECT p.id, p.name, NULL::text AS email, p.user_id, p.is_organizer
    FROM participants p
    WHERE p.id = p_participant_id;
    RETURN;
  END IF;
  
  -- No access for anyone else
  RETURN;
END;
$function$;
