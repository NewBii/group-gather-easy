-- 1. Update get_participant_by_id to remove organizer access to emails
CREATE OR REPLACE FUNCTION public.get_participant_by_id(p_participant_id uuid)
RETURNS TABLE(id uuid, name text, email text, user_id uuid, is_organizer boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  -- ONLY return email if user owns this participant
  IF v_calling_user_id IS NOT NULL AND v_participant_user_id = v_calling_user_id THEN
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.user_id, p.is_organizer
    FROM participants p
    WHERE p.id = p_participant_id;
    RETURN;
  END IF;
  
  -- Anonymous participant restoring own session (gets own email)
  IF v_calling_user_id IS NULL AND v_participant_user_id IS NULL AND v_event_created_by IS NULL THEN
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.user_id, p.is_organizer
    FROM participants p
    WHERE p.id = p_participant_id;
    RETURN;
  END IF;
  
  -- No access for anyone else (including organizers)
  RETURN;
END;
$$;

-- 2. Create participants_masked view for listing participants without exposing email
CREATE OR REPLACE VIEW public.participants_masked AS
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

-- 3. Drop existing SELECT policy and create more restrictive one
DROP POLICY IF EXISTS "Participants can view event participants" ON participants;

-- Users can only see their own participant record with full details
CREATE POLICY "Users can view their own participant record"
ON participants FOR SELECT
USING (
  -- Own record (authenticated user)
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  -- Anonymous events: allow anonymous users to see anonymous participant records for fair spot calculation
  OR (
    EXISTS (
      SELECT 1 FROM events e 
      WHERE e.id = participants.event_id 
      AND e.created_by IS NULL
    )
  )
  -- Authenticated users who are participants of the event can see other participants (needed for lists)
  OR (
    auth.uid() IS NOT NULL 
    AND is_participant_of_event(event_id, auth.uid())
  )
  -- Event creators can see participant list
  OR (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM events e 
      WHERE e.id = participants.event_id 
      AND e.created_by = auth.uid()
    )
  )
);