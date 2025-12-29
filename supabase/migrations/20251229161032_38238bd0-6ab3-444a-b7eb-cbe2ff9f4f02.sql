-- Create date_options table for storing multiple date choices per event
CREATE TABLE public.date_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups by event_id
CREATE INDEX idx_date_options_event_id ON public.date_options(event_id);

-- Enable Row Level Security
ALTER TABLE public.date_options ENABLE ROW LEVEL SECURITY;

-- Anyone can view date options for an event
CREATE POLICY "Anyone can view date options"
ON public.date_options
FOR SELECT
USING (true);

-- Only event creators can insert date options
CREATE POLICY "Event creators can insert date options"
ON public.date_options
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_id
    AND events.created_by = auth.uid()
  )
);

-- Only event creators can update date options
CREATE POLICY "Event creators can update date options"
ON public.date_options
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_id
    AND events.created_by = auth.uid()
  )
);

-- Only event creators can delete date options
CREATE POLICY "Event creators can delete date options"
ON public.date_options
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_id
    AND events.created_by = auth.uid()
  )
);