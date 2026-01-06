-- Create enum for spark categories
CREATE TYPE public.spark_category AS ENUM ('must_have', 'nice_to_have', 'dealbreaker');

-- Create participant_sparks table
CREATE TABLE public.participant_sparks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    spark_text TEXT NOT NULL,
    category spark_category NOT NULL DEFAULT 'nice_to_have',
    is_integrated BOOLEAN NOT NULL DEFAULT false,
    integrated_into_scenario_id UUID REFERENCES public.ai_scenarios(id) ON DELETE SET NULL,
    integration_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT spark_text_length CHECK (length(spark_text) >= 1 AND length(spark_text) <= 200)
);

-- Create indexes
CREATE INDEX idx_participant_sparks_event_id ON public.participant_sparks(event_id);
CREATE INDEX idx_participant_sparks_participant_id ON public.participant_sparks(participant_id);
CREATE INDEX idx_participant_sparks_is_integrated ON public.participant_sparks(is_integrated);

-- Enable RLS
ALTER TABLE public.participant_sparks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Participants can view sparks for events they belong to
CREATE POLICY "Participants can view sparks for their events"
ON public.participant_sparks
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.participants p
        WHERE p.event_id = participant_sparks.event_id
        AND (p.user_id = auth.uid() OR p.id = participant_sparks.participant_id)
    )
    OR EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = participant_sparks.event_id
        AND e.created_by = auth.uid()
    )
);

-- Participants can insert sparks for events they belong to
CREATE POLICY "Participants can insert sparks for their events"
ON public.participant_sparks
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.participants p
        WHERE p.id = participant_sparks.participant_id
        AND p.event_id = participant_sparks.event_id
        AND (p.user_id = auth.uid() OR p.user_id IS NULL)
    )
);

-- Organizers can update sparks (for marking as integrated)
CREATE POLICY "Organizers can update sparks"
ON public.participant_sparks
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = participant_sparks.event_id
        AND e.created_by = auth.uid()
    )
);

-- Participants can delete their own sparks
CREATE POLICY "Participants can delete their own sparks"
ON public.participant_sparks
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.participants p
        WHERE p.id = participant_sparks.participant_id
        AND (p.user_id = auth.uid() OR p.user_id IS NULL)
    )
);

-- Add updated_at trigger
CREATE TRIGGER update_participant_sparks_updated_at
BEFORE UPDATE ON public.participant_sparks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.participant_sparks;