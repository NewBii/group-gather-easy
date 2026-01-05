-- Create helper function to check participant membership (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_participant_of_event(p_event_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM participants 
    WHERE event_id = p_event_id 
    AND user_id = p_user_id
  );
$$;

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Participants can view event participants" ON participants;

-- Recreate policy using the helper function to avoid recursion
CREATE POLICY "Participants can view event participants" ON participants
FOR SELECT USING (
  -- Anonymous events (created_by IS NULL) are visible to everyone
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.created_by IS NULL)
  OR
  -- Logged-in participants of the same event can view
  (auth.uid() IS NOT NULL AND public.is_participant_of_event(event_id, auth.uid()))
  OR
  -- Event creators can view all participants
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM events e WHERE e.id = event_id AND e.created_by = auth.uid()
  ))
);