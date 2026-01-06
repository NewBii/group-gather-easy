-- ============================================
-- REBUILD PARTICIPANT JOINING FLOW
-- ============================================

-- 1. Drop existing function to recreate cleanly
DROP FUNCTION IF EXISTS public.join_event_as_participant(uuid, text, text);

-- 2. Create join_event_as_participant with explicit RLS bypass inside function body
CREATE OR REPLACE FUNCTION public.join_event_as_participant(
  p_event_id uuid,
  p_name text,
  p_email text DEFAULT NULL
)
RETURNS TABLE (id uuid, name text, email text, user_id uuid, is_organizer boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_participant_id uuid;
BEGIN
  -- Explicitly disable RLS for this transaction
  PERFORM set_config('row_security', 'off', true);
  
  -- Get current user (may be null for anonymous)
  v_user_id := auth.uid();
  
  -- Validate input
  IF p_name IS NULL OR length(trim(p_name)) < 1 THEN
    RAISE EXCEPTION 'Name cannot be empty';
  END IF;
  
  IF length(trim(p_name)) > 100 THEN
    RAISE EXCEPTION 'Name must be 100 characters or less';
  END IF;
  
  -- Check event exists
  IF NOT EXISTS (SELECT 1 FROM events WHERE events.id = p_event_id) THEN
    RAISE EXCEPTION 'Event not found';
  END IF;
  
  -- Insert the participant directly
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

-- 3. Grant execute to all users (including anonymous)
GRANT EXECUTE ON FUNCTION public.join_event_as_participant(uuid, text, text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_event_as_participant(uuid, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.join_event_as_participant(uuid, text, text) TO authenticated;

-- 4. Drop and recreate INSERT policy for participants
DROP POLICY IF EXISTS "Anyone can add themselves as participant" ON participants;

CREATE POLICY "Anyone can add themselves as participant" 
ON participants FOR INSERT
WITH CHECK (
  -- Event must exist (basic validation)
  EXISTS (SELECT 1 FROM events WHERE events.id = event_id)
);

-- 5. Update get_participant_by_id function with same RLS bypass pattern
DROP FUNCTION IF EXISTS public.get_participant_by_id(uuid);

CREATE OR REPLACE FUNCTION public.get_participant_by_id(p_participant_id uuid)
RETURNS TABLE(id uuid, name text, email text, user_id uuid, is_organizer boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Bypass RLS for this query
  PERFORM set_config('row_security', 'off', true);
  
  RETURN QUERY
  SELECT p.id, p.name, p.email, p.user_id, p.is_organizer
  FROM participants p
  WHERE p.id = p_participant_id;
END;
$$;

-- 6. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_participant_by_id(uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_participant_by_id(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_participant_by_id(uuid) TO authenticated;

-- 7. Create a public view for participant lists (hides PII)
DROP VIEW IF EXISTS public.participants_public;

CREATE VIEW public.participants_public AS
SELECT id, event_id, name, is_organizer, created_at
FROM participants;

-- 8. Grant access to the view
GRANT SELECT ON public.participants_public TO PUBLIC;
GRANT SELECT ON public.participants_public TO anon;
GRANT SELECT ON public.participants_public TO authenticated;