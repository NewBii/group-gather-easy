-- Drop existing SELECT policy for participants
DROP POLICY IF EXISTS "Participants can view event participants" ON participants;

-- Create updated policy that allows users to view their own participant record
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
  OR
  -- Users can always view their OWN participant record (needed for insert...returning)
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
);