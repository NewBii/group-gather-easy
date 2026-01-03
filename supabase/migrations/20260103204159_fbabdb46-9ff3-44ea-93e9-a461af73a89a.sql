-- Drop existing overly permissive RLS policies on voting tables

-- date_votes policies
DROP POLICY IF EXISTS "Participants can insert their votes" ON date_votes;
DROP POLICY IF EXISTS "Participants can update their own votes" ON date_votes;
DROP POLICY IF EXISTS "Participants can delete their own votes" ON date_votes;

-- activity_votes policies
DROP POLICY IF EXISTS "Participants can insert their votes" ON activity_votes;
DROP POLICY IF EXISTS "Participants can update their own votes" ON activity_votes;
DROP POLICY IF EXISTS "Participants can delete their own votes" ON activity_votes;

-- location_votes policies
DROP POLICY IF EXISTS "Participants can insert their votes" ON location_votes;
DROP POLICY IF EXISTS "Participants can update their own votes" ON location_votes;
DROP POLICY IF EXISTS "Participants can delete their own votes" ON location_votes;

-- Create security definer function to check participant ownership
CREATE OR REPLACE FUNCTION public.owns_participant(p_participant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM participants
    WHERE id = p_participant_id
    AND (
      -- Authenticated user owns this participant
      (auth.uid() IS NOT NULL AND user_id = auth.uid())
      OR
      -- Anonymous participant in anonymous event (user_id is NULL)
      -- These rely on client-side participant_id storage with session expiration
      (user_id IS NULL AND EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = participants.event_id
        AND e.created_by IS NULL
      ))
    )
  )
$$;

-- Create new secure RLS policies for date_votes

-- INSERT: Only allow if user owns the participant
CREATE POLICY "Users can insert votes for their participants"
ON date_votes FOR INSERT
WITH CHECK (
  public.owns_participant(participant_id)
);

-- UPDATE: Only allow if user owns the participant in the vote
CREATE POLICY "Users can update their own votes"
ON date_votes FOR UPDATE
USING (
  public.owns_participant(participant_id)
);

-- DELETE: Only allow if user owns the participant in the vote
CREATE POLICY "Users can delete their own votes"
ON date_votes FOR DELETE
USING (
  public.owns_participant(participant_id)
);

-- Create new secure RLS policies for activity_votes

CREATE POLICY "Users can insert votes for their participants"
ON activity_votes FOR INSERT
WITH CHECK (
  public.owns_participant(participant_id)
);

CREATE POLICY "Users can update their own votes"
ON activity_votes FOR UPDATE
USING (
  public.owns_participant(participant_id)
);

CREATE POLICY "Users can delete their own votes"
ON activity_votes FOR DELETE
USING (
  public.owns_participant(participant_id)
);

-- Create new secure RLS policies for location_votes

CREATE POLICY "Users can insert votes for their participants"
ON location_votes FOR INSERT
WITH CHECK (
  public.owns_participant(participant_id)
);

CREATE POLICY "Users can update their own votes"
ON location_votes FOR UPDATE
USING (
  public.owns_participant(participant_id)
);

CREATE POLICY "Users can delete their own votes"
ON location_votes FOR DELETE
USING (
  public.owns_participant(participant_id)
);