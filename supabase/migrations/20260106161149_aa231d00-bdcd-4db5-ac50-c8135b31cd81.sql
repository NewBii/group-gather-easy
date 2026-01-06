-- Table for date options within a scenario
CREATE TABLE public.scenario_date_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES public.ai_scenarios(id) ON DELETE CASCADE,
  suggested_date DATE NOT NULL,
  is_long_weekend BOOLEAN DEFAULT false,
  holiday_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table for participant votes on scenario dates
CREATE TABLE public.scenario_date_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES public.ai_scenarios(id) ON DELETE CASCADE,
  date_option_id UUID NOT NULL REFERENCES public.scenario_date_options(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  availability TEXT NOT NULL CHECK (availability IN ('available', 'maybe', 'unavailable')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date_option_id, participant_id)
);

-- Enable RLS on both tables
ALTER TABLE public.scenario_date_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_date_votes ENABLE ROW LEVEL SECURITY;

-- RLS policies for scenario_date_options
CREATE POLICY "Anyone can view scenario date options"
ON public.scenario_date_options FOR SELECT
USING (true);

CREATE POLICY "Event creators can insert date options"
ON public.scenario_date_options FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ai_scenarios s
    JOIN events e ON s.event_id = e.id
    WHERE s.id = scenario_date_options.scenario_id
    AND (e.created_by = auth.uid() OR e.created_by IS NULL)
  )
);

CREATE POLICY "Event creators can delete date options"
ON public.scenario_date_options FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM ai_scenarios s
    JOIN events e ON s.event_id = e.id
    WHERE s.id = scenario_date_options.scenario_id
    AND (e.created_by = auth.uid() OR e.created_by IS NULL)
  )
);

-- RLS policies for scenario_date_votes
CREATE POLICY "Anyone can view scenario date votes"
ON public.scenario_date_votes FOR SELECT
USING (true);

CREATE POLICY "Participants can insert their date votes"
ON public.scenario_date_votes FOR INSERT
WITH CHECK (owns_participant(participant_id));

CREATE POLICY "Participants can update their date votes"
ON public.scenario_date_votes FOR UPDATE
USING (owns_participant(participant_id));

CREATE POLICY "Participants can delete their date votes"
ON public.scenario_date_votes FOR DELETE
USING (owns_participant(participant_id));

-- Enable realtime for date votes
ALTER PUBLICATION supabase_realtime ADD TABLE public.scenario_date_votes;

-- Create index for faster lookups
CREATE INDEX idx_scenario_date_options_scenario ON public.scenario_date_options(scenario_id);
CREATE INDEX idx_scenario_date_votes_date_option ON public.scenario_date_votes(date_option_id);
CREATE INDEX idx_scenario_date_votes_participant ON public.scenario_date_votes(participant_id);