-- Drop vulnerable policies
DROP POLICY IF EXISTS "Suggesters can update their activities" ON activities;
DROP POLICY IF EXISTS "Suggesters can delete their activities" ON activities;

-- Create secure UPDATE policy
CREATE POLICY "Suggesters can update their activities"
  ON activities FOR UPDATE
  USING (
    suggested_by IS NOT NULL AND (
      -- Allow authenticated users who own the participant
      EXISTS (
        SELECT 1 FROM participants p
        WHERE p.id = suggested_by
        AND p.user_id = auth.uid()
      )
      OR
      -- Allow anonymous participants in anonymous events
      EXISTS (
        SELECT 1 FROM participants p
        JOIN events e ON p.event_id = e.id
        WHERE p.id = suggested_by
        AND p.user_id IS NULL
        AND e.created_by IS NULL
      )
      OR
      -- Allow event organizers to modify any activity
      EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = event_id
        AND e.created_by = auth.uid()
      )
    )
  );

-- Create secure DELETE policy
CREATE POLICY "Suggesters can delete their activities"
  ON activities FOR DELETE
  USING (
    suggested_by IS NOT NULL AND (
      -- Allow authenticated users who own the participant
      EXISTS (
        SELECT 1 FROM participants p
        WHERE p.id = suggested_by
        AND p.user_id = auth.uid()
      )
      OR
      -- Allow anonymous participants in anonymous events
      EXISTS (
        SELECT 1 FROM participants p
        JOIN events e ON p.event_id = e.id
        WHERE p.id = suggested_by
        AND p.user_id IS NULL
        AND e.created_by IS NULL
      )
      OR
      -- Allow event organizers to delete any activity
      EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = event_id
        AND e.created_by = auth.uid()
      )
    )
  );