-- Store candidate dates at event level (not per-scenario)
CREATE TABLE public.event_candidate_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  suggested_date DATE NOT NULL,
  is_long_weekend BOOLEAN DEFAULT false,
  holiday_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, suggested_date)
);

-- Participant votes on dates (independent of scenarios)
CREATE TABLE public.event_date_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  date_id UUID NOT NULL REFERENCES event_candidate_dates(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  availability TEXT NOT NULL CHECK (availability IN ('available', 'maybe', 'unavailable')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date_id, participant_id)
);

-- Enable RLS
ALTER TABLE public.event_candidate_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_date_availability ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_candidate_dates
CREATE POLICY "Anyone can view event candidate dates" 
ON public.event_candidate_dates FOR SELECT USING (true);

CREATE POLICY "Event creators can insert candidate dates" 
ON public.event_candidate_dates FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_candidate_dates.event_id AND e.created_by = auth.uid())
  OR EXISTS (SELECT 1 FROM events e WHERE e.id = event_candidate_dates.event_id AND e.created_by IS NULL)
);

CREATE POLICY "Event creators can delete candidate dates" 
ON public.event_candidate_dates FOR DELETE 
USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_candidate_dates.event_id AND e.created_by = auth.uid())
  OR EXISTS (SELECT 1 FROM events e WHERE e.id = event_candidate_dates.event_id AND e.created_by IS NULL)
);

-- RLS policies for event_date_availability
CREATE POLICY "Anyone can view date availability" 
ON public.event_date_availability FOR SELECT USING (true);

CREATE POLICY "Participants can insert their availability" 
ON public.event_date_availability FOR INSERT 
WITH CHECK (owns_participant(participant_id));

CREATE POLICY "Participants can update their availability" 
ON public.event_date_availability FOR UPDATE 
USING (owns_participant(participant_id));

CREATE POLICY "Participants can delete their availability" 
ON public.event_date_availability FOR DELETE 
USING (owns_participant(participant_id));

-- Enable realtime for availability updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_date_availability;

-- Add trigger for updated_at
CREATE TRIGGER update_event_date_availability_updated_at
BEFORE UPDATE ON public.event_date_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();