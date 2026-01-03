-- Replace the owns_participant function using CREATE OR REPLACE (keeps dependencies)
-- Using plpgsql to avoid potential recursion issues with the participants table RLS

CREATE OR REPLACE FUNCTION public.owns_participant(p_participant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_event_id uuid;
  v_event_created_by uuid;
BEGIN
  -- Get participant info directly (bypasses RLS due to SECURITY DEFINER)
  SELECT user_id, event_id INTO v_user_id, v_event_id
  FROM participants
  WHERE id = p_participant_id;
  
  -- If participant not found, deny access
  IF v_event_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if authenticated user owns this participant
  IF auth.uid() IS NOT NULL AND v_user_id = auth.uid() THEN
    RETURN TRUE;
  END IF;
  
  -- For anonymous participants (user_id IS NULL) in anonymous events
  IF v_user_id IS NULL THEN
    -- Get event creator
    SELECT created_by INTO v_event_created_by
    FROM events
    WHERE id = v_event_id;
    
    -- Allow if event is anonymous (created_by IS NULL)
    IF v_event_created_by IS NULL THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$$;