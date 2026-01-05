import { useState, useEffect } from 'react';
import { Loader2, Save, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScenarioCard } from './ScenarioCard';
import { GroupMomentum } from './GroupMomentum';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Scenario {
  id: string;
  scenario_label: string;
  title: string;
  description?: string;
  suggested_date?: string;
  suggested_time_of_day?: string;
  suggested_vibe?: string;
}

interface PulseVotingProps {
  eventId: string;
  scenarios: Scenario[];
  participantId?: string;
  totalParticipants: number;
  isOrganizer?: boolean;
  onFinalize?: () => void;
}

interface VoteState {
  [scenarioId: string]: {
    rank: number | null;
    isDealbreaker: boolean;
  };
}

export const PulseVoting = ({
  eventId,
  scenarios,
  participantId,
  totalParticipants,
  isOrganizer,
  onFinalize,
}: PulseVotingProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [votes, setVotes] = useState<VoteState>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedVotes, setSavedVotes] = useState<VoteState>({});

  // Load existing votes
  useEffect(() => {
    if (!participantId) return;

    const loadVotes = async () => {
      const { data } = await supabase
        .from('scenario_votes')
        .select('*')
        .eq('participant_id', participantId)
        .eq('event_id', eventId);

      if (data) {
        const voteState: VoteState = {};
        data.forEach((v) => {
          voteState[v.scenario_id] = {
            rank: v.rank,
            isDealbreaker: v.is_dealbreaker,
          };
        });
        setVotes(voteState);
        setSavedVotes(voteState);
      }
    };

    loadVotes();
  }, [participantId, eventId]);

  const handleRankChange = (scenarioId: string, rank: number | null) => {
    // If setting a rank, remove that rank from other scenarios
    const newVotes = { ...votes };

    if (rank !== null) {
      // Remove this rank from any other scenario
      Object.keys(newVotes).forEach((id) => {
        if (id !== scenarioId && newVotes[id]?.rank === rank) {
          newVotes[id] = { ...newVotes[id], rank: null };
        }
      });
    }

    newVotes[scenarioId] = {
      ...newVotes[scenarioId],
      rank,
      isDealbreaker: rank !== null ? false : newVotes[scenarioId]?.isDealbreaker || false,
    };

    setVotes(newVotes);
    setHasChanges(true);
  };

  const handleDealbreakerToggle = (scenarioId: string) => {
    const current = votes[scenarioId];
    const newIsDealbreaker = !current?.isDealbreaker;

    setVotes({
      ...votes,
      [scenarioId]: {
        rank: newIsDealbreaker ? null : current?.rank || null,
        isDealbreaker: newIsDealbreaker,
      },
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!participantId) {
      toast({
        title: t.eventPage?.dateVoting?.joinFirst || 'Join the event to vote',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      // Delete existing votes for this participant
      await supabase
        .from('scenario_votes')
        .delete()
        .eq('participant_id', participantId)
        .eq('event_id', eventId);

      // Insert new votes
      const votesToInsert = Object.entries(votes)
        .filter(([_, v]) => v.rank !== null || v.isDealbreaker)
        .map(([scenarioId, v]) => ({
          event_id: eventId,
          participant_id: participantId,
          scenario_id: scenarioId,
          rank: v.rank,
          is_dealbreaker: v.isDealbreaker,
        }));

      if (votesToInsert.length > 0) {
        const { error } = await supabase
          .from('scenario_votes')
          .insert(votesToInsert);

        if (error) throw error;
      }

      setSavedVotes(votes);
      setHasChanges(false);
      toast({
        title: t.eventPage?.dateVoting?.saved || 'Votes saved!',
      });
    } catch (error) {
      console.error('Error saving votes:', error);
      toast({
        title: t.eventPage?.dateVoting?.voteError || 'Error saving votes',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const canVote = !!participantId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          {t.aiConcierge?.pulse?.title || 'Choose Your Preference'}
        </h2>
        <p className="text-muted-foreground">
          {t.aiConcierge?.pulse?.subtitle || 'Rank these options and mark any dealbreakers'}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Scenarios */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {scenarios.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                rank={votes[scenario.id]?.rank ?? undefined}
                isDealbreaker={votes[scenario.id]?.isDealbreaker}
                onRankChange={(rank) => handleRankChange(scenario.id, rank)}
                onDealbreakerToggle={() => handleDealbreakerToggle(scenario.id)}
                isVotingEnabled={canVote}
                showRanking={canVote}
              />
            ))}
          </div>

          {/* Save button */}
          {canVote && (
            <div className="flex gap-4">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.eventPage?.dateVoting?.saving || 'Saving...'}
                  </>
                ) : hasChanges ? (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t.eventPage?.dateVoting?.confirmAvailability || 'Save my votes'}
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {t.eventPage?.dateVoting?.saved || 'Saved'}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Finalize button for organizers */}
          {isOrganizer && (
            <Button
              variant="default"
              size="lg"
              onClick={onFinalize}
              className="w-full"
            >
              {t.aiConcierge?.pulse?.finalize || 'Finalize Event'}
            </Button>
          )}
        </div>

        {/* Group Momentum sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <GroupMomentum
              eventId={eventId}
              scenarios={scenarios}
              totalParticipants={totalParticipants}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
