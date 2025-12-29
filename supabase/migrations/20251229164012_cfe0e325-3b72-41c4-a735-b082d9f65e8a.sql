-- Allow inserting date options for anonymous events (where created_by is NULL)
CREATE POLICY "Anyone can insert date options for anonymous events"
ON public.date_options
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_id
    AND events.created_by IS NULL
  )
);

-- Allow updates for anonymous events
CREATE POLICY "Anyone can update date options for anonymous events"
ON public.date_options
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_id
    AND events.created_by IS NULL
  )
);

-- Allow deletes for anonymous events
CREATE POLICY "Anyone can delete date options for anonymous events"
ON public.date_options
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_id
    AND events.created_by IS NULL
  )
);