-- Add organization mode and AI phase columns to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS organization_mode text DEFAULT 'manual' 
  CHECK (organization_mode IN ('manual', 'ai_concierge'));

ALTER TABLE events ADD COLUMN IF NOT EXISTS ai_phase text DEFAULT NULL 
  CHECK (ai_phase IS NULL OR ai_phase IN ('spark', 'pulse', 'lockdown'));

ALTER TABLE events ADD COLUMN IF NOT EXISTS spark_prompt text DEFAULT NULL;

-- Create ai_scenarios table for AI-generated voting scenarios
CREATE TABLE IF NOT EXISTS ai_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  scenario_label text NOT NULL,
  title text NOT NULL,
  description text,
  suggested_date date,
  suggested_time_of_day text CHECK (suggested_time_of_day IN ('morning', 'afternoon', 'evening')),
  suggested_vibe text CHECK (suggested_vibe IN ('casual', 'active', 'relaxed', 'formal')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on ai_scenarios
ALTER TABLE ai_scenarios ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_scenarios
CREATE POLICY "Anyone can view scenarios" ON ai_scenarios 
  FOR SELECT USING (true);

CREATE POLICY "Event creators can insert scenarios" ON ai_scenarios 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.created_by = auth.uid())
    OR EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.created_by IS NULL)
  );

CREATE POLICY "Event creators can update scenarios" ON ai_scenarios 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.created_by = auth.uid())
    OR EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.created_by IS NULL)
  );

CREATE POLICY "Event creators can delete scenarios" ON ai_scenarios 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.created_by = auth.uid())
    OR EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.created_by IS NULL)
  );

-- Create scenario_votes table for guest rankings and dealbreakers
CREATE TABLE IF NOT EXISTS scenario_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  participant_id uuid REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
  scenario_id uuid REFERENCES ai_scenarios(id) ON DELETE CASCADE NOT NULL,
  rank integer CHECK (rank >= 1 AND rank <= 3),
  is_dealbreaker boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(participant_id, scenario_id)
);

-- Enable RLS on scenario_votes
ALTER TABLE scenario_votes ENABLE ROW LEVEL SECURITY;

-- RLS policies for scenario_votes
CREATE POLICY "Anyone can view scenario votes" ON scenario_votes 
  FOR SELECT USING (true);

CREATE POLICY "Participants can insert their votes" ON scenario_votes 
  FOR INSERT WITH CHECK (owns_participant(participant_id));

CREATE POLICY "Participants can update their votes" ON scenario_votes 
  FOR UPDATE USING (owns_participant(participant_id));

CREATE POLICY "Participants can delete their votes" ON scenario_votes 
  FOR DELETE USING (owns_participant(participant_id));

-- Add trigger for updated_at on scenario_votes
CREATE TRIGGER update_scenario_votes_updated_at
  BEFORE UPDATE ON scenario_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE ai_scenarios;
ALTER PUBLICATION supabase_realtime ADD TABLE scenario_votes;