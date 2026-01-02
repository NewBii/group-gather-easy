-- Create vote type enum
CREATE TYPE public.vote_type AS ENUM ('yes', 'no', 'maybe');

-- Create date_votes table
CREATE TABLE public.date_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date_option_id UUID NOT NULL REFERENCES public.date_options(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  vote public.vote_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date_option_id, participant_id)
);

-- Create activities table
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  suggested_by UUID REFERENCES public.participants(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activity_votes table
CREATE TABLE public.activity_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  vote public.vote_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(activity_id, participant_id)
);

-- Create location_suggestions table
CREATE TABLE public.location_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  suggested_by UUID REFERENCES public.participants(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create location_votes table
CREATE TABLE public.location_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_suggestion_id UUID NOT NULL REFERENCES public.location_suggestions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  vote public.vote_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(location_suggestion_id, participant_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.date_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for date_votes
CREATE POLICY "Anyone can view date votes" ON public.date_votes FOR SELECT USING (true);
CREATE POLICY "Participants can insert their votes" ON public.date_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Participants can update their own votes" ON public.date_votes FOR UPDATE USING (true);
CREATE POLICY "Participants can delete their own votes" ON public.date_votes FOR DELETE USING (true);

-- RLS Policies for activities
CREATE POLICY "Anyone can view activities" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Anyone can add activities" ON public.activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Suggesters can update their activities" ON public.activities FOR UPDATE USING (true);
CREATE POLICY "Suggesters can delete their activities" ON public.activities FOR DELETE USING (true);

-- RLS Policies for activity_votes
CREATE POLICY "Anyone can view activity votes" ON public.activity_votes FOR SELECT USING (true);
CREATE POLICY "Participants can insert their votes" ON public.activity_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Participants can update their own votes" ON public.activity_votes FOR UPDATE USING (true);
CREATE POLICY "Participants can delete their own votes" ON public.activity_votes FOR DELETE USING (true);

-- RLS Policies for location_suggestions
CREATE POLICY "Anyone can view location suggestions" ON public.location_suggestions FOR SELECT USING (true);
CREATE POLICY "Anyone can add location suggestions" ON public.location_suggestions FOR INSERT WITH CHECK (true);
CREATE POLICY "Suggesters can update their suggestions" ON public.location_suggestions FOR UPDATE USING (true);
CREATE POLICY "Suggesters can delete their suggestions" ON public.location_suggestions FOR DELETE USING (true);

-- RLS Policies for location_votes
CREATE POLICY "Anyone can view location votes" ON public.location_votes FOR SELECT USING (true);
CREATE POLICY "Participants can insert their votes" ON public.location_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Participants can update their own votes" ON public.location_votes FOR UPDATE USING (true);
CREATE POLICY "Participants can delete their own votes" ON public.location_votes FOR DELETE USING (true);

-- Add input validation trigger for activities
CREATE OR REPLACE FUNCTION public.validate_activity_input()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.name IS NULL OR length(NEW.name) < 1 THEN
    RAISE EXCEPTION 'Activity name cannot be empty';
  END IF;
  
  IF length(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Activity name must be 100 characters or less';
  END IF;
  
  IF NEW.description IS NOT NULL AND length(NEW.description) > 300 THEN
    RAISE EXCEPTION 'Activity description must be 300 characters or less';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_activity_input_trigger
BEFORE INSERT OR UPDATE ON public.activities
FOR EACH ROW
EXECUTE FUNCTION public.validate_activity_input();

-- Add input validation trigger for location_suggestions
CREATE OR REPLACE FUNCTION public.validate_location_suggestion_input()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.name IS NULL OR length(NEW.name) < 1 THEN
    RAISE EXCEPTION 'Location name cannot be empty';
  END IF;
  
  IF length(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Location name must be 100 characters or less';
  END IF;
  
  IF NEW.address IS NOT NULL AND length(NEW.address) > 200 THEN
    RAISE EXCEPTION 'Address must be 200 characters or less';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_location_suggestion_input_trigger
BEFORE INSERT OR UPDATE ON public.location_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.validate_location_suggestion_input();

-- Add updated_at trigger to date_votes
CREATE TRIGGER update_date_votes_updated_at
BEFORE UPDATE ON public.date_votes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for voting tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.date_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_suggestions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;