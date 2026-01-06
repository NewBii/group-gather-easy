import { useState, useEffect } from 'react';
import { Loader2, Save, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScenarioCard } from './ScenarioCard';
import { ConsensusScore } from './ConsensusScore';
import { ConstraintBadge } from './ConstraintBadge';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { DateOption, DateVote } from './DateAvailabilityPicker';

interface SpecialTrait {
  type: 'kid_friendly' | 'accessibility' | 'dietary' | 'budget' | 'midpoint' | 'nightlife' | 'outdoor' | 'indoor';
  label: string;
  description?: string;
}

interface ConstraintsApplied {
  date_locked?: boolean;
  location_locked?: boolean;
  time_locked?: boolean;
}

interface MidpointInfoData {
  suggested_location?: string;
  travel_logic?: string;
}

interface Scenario {
  id: string;
  scenario_label: string;
  title: string;
  description?: string;
  suggested_date?: string;
  suggested_time_of_day?: string;
  suggested_vibe?: string;
  metadata?: {
    constraints_applied?: ConstraintsApplied;
    special_traits?: SpecialTrait[];
    midpoint_info?: MidpointInfoData;
    date_is_flexible?: boolean;
  } | null;
}

interface ContextAnalysis {
  constraints?: {
    date?: { type: 'fixed' | 'flexible' | 'missing'; displayLabel?: string };
    location?: { type: 'fixed' | 'flexible' | 'missing'; displayLabel?: string };
    time?: { type: 'fixed' | 'flexible' | 'missing'; displayLabel?: string };
  };
  specialRequirements?: Array<{ type: string; label: string }>;
  participantOrigins?: string[];
  isVague?: boolean;
}

interface PulseVotingProps {
  eventId: string;
  scenarios: Scenario[];
  participantId?: string;
  totalParticipants: number;
  isOrganizer?: boolean;
  onFinalize?: () => void;
  contextAnalysis?: ContextAnalysis | null;
}

interface VoteState {
  [scenarioId: string]: {
    rank: number | null;
    isDealbreaker: boolean;
  };
}

interface DateOptionsMap {
  [scenarioId: string]: DateOption[];
}

interface DateVotesMap {
  [scenarioId: string]: DateVote[];
}

export const PulseVoting = ({
  eventId,
  scenarios,
  participantId,
  totalParticipants,
  isOrganizer,
  onFinalize,
  contextAnalysis,
}: PulseVotingProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [votes, setVotes] = useState<VoteState>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedVotes, setSavedVotes] = useState<VoteState>({});
  const [dateOptionsMap, setDateOptionsMap] = useState<DateOptionsMap>({});
  const [dateVotesMap, setDateVotesMap] = useState<DateVotesMap>({});

  // Load date options for scenarios
  useEffect(() => {
    const scenarioIds = scenarios.map(s => s.id);
    if (scenarioIds.length === 0) return;

    const loadDateOptions = async () => {
      const { data } = await supabase
        .from('scenario_date_options')
        .select('*')
        .in('scenario_id', scenarioIds);

      if (data) {
        const optionsMap: DateOptionsMap = {};
        data.forEach((opt: any) => {
          if (!optionsMap[opt.scenario_id]) {
            optionsMap[opt.scenario_id] = [];
          }
          optionsMap[opt.scenario_id].push({
            id: opt.id,
            suggested_date: opt.suggested_date,
            is_long_weekend: opt.is_long_weekend,
            holiday_name: opt.holiday_name,
          });
        });
        setDateOptionsMap(optionsMap);
      }
    };

    loadDateOptions();
  }, [scenarios]);

  // Load date votes for participant
  useEffect(() => {
    if (!participantId) return;
    const scenarioIds = scenarios.map(s => s.id);
    if (scenarioIds.length === 0) return;

    const loadDateVotes = async () => {
      const { data } = await supabase
        .from('scenario_date_votes')
        .select('*')
        .eq('participant_id', participantId)
        .in('scenario_id', scenarioIds);

      if (data) {
        const votesMap: DateVotesMap = {};
        data.forEach((vote: any) => {
          if (!votesMap[vote.scenario_id]) {
            votesMap[vote.scenario_id] = [];
          }
          votesMap[vote.scenario_id].push({
            date_option_id: vote.date_option_id,
            availability: vote.availability,
          });
        });
        setDateVotesMap(votesMap);
      }
    };

    loadDateVotes();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('date-votes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scenario_date_votes' },
        () => loadDateVotes()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [participantId, scenarios]);

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
    const newVotes = { ...votes };

    if (rank !== null) {
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
      await supabase
        .from('scenario_votes')
        .delete()
        .eq('participant_id', participantId)
        .eq('event_id', eventId);

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
  const constraints = contextAnalysis?.constraints;
  const isStarterConcepts = contextAnalysis?.isVague;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          {isStarterConcepts 
            ? (t.aiConcierge?.pulse?.starterTitle || 'Which Direction Feels Right?')
            : (t.aiConcierge?.pulse?.title || 'Choose Your Preference')}
        </h2>
        <p className="text-muted-foreground">
          {isStarterConcepts
            ? (t.aiConcierge?.pulse?.starterSubtitle || 'These are starter concepts to help the group find direction. Rank them or veto what doesn\'t work!')
            : (t.aiConcierge?.pulse?.subtitle || 'Rank these options and veto any dealbreakers')}
        </p>
      </div>

      {/* Constraint badges - show what's locked vs flexible */}
      {constraints && (
        <div className="flex flex-wrap gap-2 justify-center">
          {constraints.date && (
            <ConstraintBadge
              type={constraints.date.type}
              category="date"
              displayLabel={constraints.date.displayLabel || (constraints.date.type === 'fixed' ? 'Date locked' : constraints.date.type === 'flexible' ? 'Vote on date' : 'Date TBD')}
            />
          )}
          {constraints.location && (
            <ConstraintBadge
              type={constraints.location.type}
              category="location"
              displayLabel={constraints.location.displayLabel || (constraints.location.type === 'fixed' ? 'Location set' : constraints.location.type === 'flexible' ? 'Vote on location' : 'Location TBD')}
            />
          )}
          {constraints.time && constraints.time.type !== 'missing' && (
            <ConstraintBadge
              type={constraints.time.type}
              category="time"
              displayLabel={constraints.time.displayLabel || (constraints.time.type === 'fixed' ? 'Time locked' : 'Vote on time')}
            />
          )}
        </div>
      )}

      {/* Veto power info */}
      {canVote && (
        <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <strong>{t.aiConcierge?.pulse?.vetoWarning || 'Your veto matters!'}</strong> {t.aiConcierge?.pulse?.vetoWarningDescription || 'Use it wisely - options with vetoes are heavily penalized. We\'re looking for something that works for everyone.'}
          </AlertDescription>
        </Alert>
      )}

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
                dateOptions={dateOptionsMap[scenario.id] || []}
                dateVotes={dateVotesMap[scenario.id] || []}
                participantId={participantId}
                onDateVoteChange={() => {}}
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

        {/* Consensus Score sidebar (replaces GroupMomentum) */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <ConsensusScore
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