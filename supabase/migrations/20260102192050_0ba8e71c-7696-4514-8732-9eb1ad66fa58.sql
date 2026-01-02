-- Fix security issues for participants table RLS policies

-- Drop existing vulnerable policies
DROP POLICY IF EXISTS "Anyone can view participants of an event" ON public.participants;
DROP POLICY IF EXISTS "Users can update their own participant entry" ON public.participants;
DROP POLICY IF EXISTS "Users can delete their own participant entry" ON public.participants;

-- Create new secure SELECT policy
-- Allow viewing participants if:
-- 1. User is authenticated AND is a participant in the same event, OR
-- 2. User is authenticated AND is the event organizer, OR
-- 3. For anonymous events (created_by IS NULL), allow all to view participants
CREATE POLICY "Participants can view event participants"
  ON public.participants FOR SELECT
  USING (
    -- For anonymous events, allow all to view (needed for link-share functionality)
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = participants.event_id
      AND e.created_by IS NULL
    )
    OR
    -- Authenticated users who are participants in the same event
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.participants p2
      WHERE p2.event_id = participants.event_id
      AND p2.user_id = auth.uid()
    ))
    OR
    -- Authenticated users who are event organizers
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = participants.event_id
      AND e.created_by = auth.uid()
    ))
  );

-- Create new secure UPDATE policy
-- Only allow updates if:
-- 1. User is authenticated AND owns the participant entry (user_id matches), OR
-- 2. For anonymous participants (user_id IS NULL), only event organizers can update
CREATE POLICY "Users can update their participant entry"
  ON public.participants FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    (user_id IS NULL AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = participants.event_id
      AND e.created_by = auth.uid()
    ))
  );

-- Create new secure DELETE policy
-- Only allow deletes if:
-- 1. User is authenticated AND owns the participant entry (user_id matches), OR
-- 2. For anonymous participants (user_id IS NULL), only event organizers can delete
CREATE POLICY "Users can delete their participant entry"
  ON public.participants FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    (user_id IS NULL AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = participants.event_id
      AND e.created_by = auth.uid()
    ))
  );