import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { useEventData } from '@/hooks/useEventData';
import { useParticipant } from '@/hooks/useParticipant';
import { EventHeader } from '@/components/event/EventHeader';
import { ParticipantJoinForm } from '@/components/event/ParticipantJoinForm';
import { DateVoting } from '@/components/event/DateVoting';
import { ActivitySection } from '@/components/event/ActivitySection';
import { LocationSection } from '@/components/event/LocationSection';
import { ParticipantsList } from '@/components/event/ParticipantsList';
import { VoteResults } from '@/components/event/VoteResults';
import { AIProgressStepper } from '@/components/create-event/AIProgressStepper';
import { PulseVoting } from '@/components/event/PulseVoting';
import { LockdownView } from '@/components/event/LockdownView';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface AIScenario {
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

const Event = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [scenarios, setScenarios] = useState<AIScenario[]>([]);
  const [winningScenario, setWinningScenario] = useState<AIScenario | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [contextAnalysis, setContextAnalysis] = useState<ContextAnalysis | null>(null);

  const {
    event,
    dateOptions,
    dateVotes,
    participants,
    activities,
    activityVotes,
    locationSuggestions,
    locationVotes,
    loading,
    error,
    refetch,
  } = useEventData(id);

  const {
    currentParticipant,
    loading: participantLoading,
    joinEvent,
    updateLocation,
  } = useParticipant(event?.id);

  // Cast event to access new fields not yet in types
  const eventData = event as any;
  const organizationMode = eventData?.organization_mode as string | undefined;
  const aiPhase = (eventData?.ai_phase as 'spark' | 'pulse' | 'lockdown') || 'pulse';

  // Get current user
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? { id: session.user.id } : null);
    });
  }, []);

  // Extract context analysis from event location_data
  useEffect(() => {
    if (eventData?.location_data?.contextAnalysis) {
      setContextAnalysis(eventData.location_data.contextAnalysis);
    }
  }, [eventData?.location_data]);

  // Fetch AI scenarios for AI Concierge events
  useEffect(() => {
    if (!event?.id || organizationMode !== 'ai_concierge') return;

    const fetchScenarios = async () => {
      const { data } = await supabase
        .from('ai_scenarios')
        .select('*')
        .eq('event_id', event.id)
        .order('scenario_label');

      if (data) {
        setScenarios(data as AIScenario[]);
        if (aiPhase === 'lockdown' && data.length > 0) {
          setWinningScenario(data[0] as AIScenario);
        }
      }
    };

    fetchScenarios();
  }, [event?.id, organizationMode, aiPhase]);

  const isOrganizer = user?.id && eventData?.created_by === user.id;

  const handleFinalize = async () => {
    if (!event?.id) return;

    try {
      const { data: votes } = await supabase
        .from('scenario_votes')
        .select('*')
        .eq('event_id', event.id);

      if (!votes || votes.length === 0) {
        toast({ title: 'No votes yet', variant: 'destructive' });
        return;
      }

      // Calculate winner with heavier veto penalty
      const scoreMap = new Map<string, { score: number; dealbreakers: number }>();
      scenarios.forEach(s => scoreMap.set(s.id, { score: 0, dealbreakers: 0 }));
      
      votes.forEach((vote: any) => {
        const current = scoreMap.get(vote.scenario_id) || { score: 0, dealbreakers: 0 };
        if (vote.is_dealbreaker) {
          current.dealbreakers += 1;
          current.score -= 10; // Heavy penalty for vetoes
        } else if (vote.rank) {
          current.score += vote.rank === 1 ? 3 : vote.rank === 2 ? 2 : 1;
        }
        scoreMap.set(vote.scenario_id, current);
      });

      // Find winner: prefer options with no dealbreakers
      let winnerId = scenarios[0]?.id;
      let maxScore = -Infinity;
      let winnerHasDealbreakers = true;

      scoreMap.forEach((data, id) => {
        // Prefer no dealbreakers over higher score
        if (data.dealbreakers === 0 && winnerHasDealbreakers) {
          winnerId = id;
          maxScore = data.score;
          winnerHasDealbreakers = false;
        } else if ((data.dealbreakers === 0) === !winnerHasDealbreakers && data.score > maxScore) {
          winnerId = id;
          maxScore = data.score;
        }
      });

      const winner = scenarios.find(s => s.id === winnerId);

      // Check for consensus
      const winnerData = scoreMap.get(winnerId);
      if (winnerData && winnerData.dealbreakers > 0) {
        toast({ 
          title: 'Warning', 
          description: `The leading option has ${winnerData.dealbreakers} veto(s). You may want to discuss with the group first.`,
          variant: 'destructive' 
        });
        return;
      }

      await supabase.from('events').update({ 
        ai_phase: 'lockdown', 
        final_date: winner?.suggested_date || null 
      }).eq('id', event.id);
      
      setWinningScenario(winner || null);
      toast({ title: t.aiConcierge.lockdown.title });
      refetch();
    } catch (err) {
      console.error('Error finalizing:', err);
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  if (loading || participantLoading) {
    return (
      <div className="container py-16 md:py-24">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">{t.eventPage.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">{t.eventPage.notFound}</h1>
          <p className="text-muted-foreground mb-8">{t.eventPage.notFoundDescription}</p>
          <Button asChild variant="outline">
            <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />{t.event.backHome}</Link>
          </Button>
        </div>
      </div>
    );
  }

  // AI Concierge Mode
  if (organizationMode === 'ai_concierge') {
    return (
      <div className="container py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />{t.event.backHome}</Link>
          </Button>
          <EventHeader event={event} />

          {aiPhase === 'lockdown' && winningScenario ? (
            <LockdownView eventId={event.id} eventTitle={event.title} winningScenario={winningScenario} participantId={currentParticipant?.id} participantName={currentParticipant?.name} />
          ) : (
            <>
              <AIProgressStepper currentPhase="pulse" />
              <ParticipantJoinForm eventSlug={event.unique_slug} onJoin={joinEvent} currentParticipant={currentParticipant} />
              {scenarios.length > 0 && (
                <PulseVoting 
                  eventId={event.id} 
                  scenarios={scenarios} 
                  participantId={currentParticipant?.id} 
                  totalParticipants={participants.length} 
                  isOrganizer={isOrganizer} 
                  onFinalize={handleFinalize}
                  contextAnalysis={contextAnalysis}
                />
              )}
              <div className="lg:hidden">
                <ParticipantsList participants={participants} currentParticipantId={currentParticipant?.id} />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Manual Mode
  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />{t.event.backHome}</Link>
        </Button>
        <EventHeader event={event} />
        <VoteResults dateOptions={dateOptions} dateVotes={dateVotes} activities={activities} activityVotes={activityVotes} locationSuggestions={locationSuggestions} locationVotes={locationVotes} />
        <ParticipantJoinForm eventSlug={event.unique_slug} onJoin={joinEvent} currentParticipant={currentParticipant} />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {dateOptions.length > 0 && <DateVoting dateOptions={dateOptions} dateVotes={dateVotes} participantId={currentParticipant?.id} participantsCount={participants.length} />}
            <ActivitySection eventId={event.id} activities={activities} activityVotes={activityVotes} participantId={currentParticipant?.id} participantsCount={participants.length} />
            {event.location_type && <LocationSection event={event} locationSuggestions={locationSuggestions} locationVotes={locationVotes} participants={participants} participantId={currentParticipant?.id} onUpdateLocation={updateLocation} />}
          </div>
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <ParticipantsList participants={participants} currentParticipantId={currentParticipant?.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Event;