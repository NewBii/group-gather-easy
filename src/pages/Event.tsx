import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useEventData } from '@/hooks/useEventData';
import { useParticipant } from '@/hooks/useParticipant';
import { EventHeader } from '@/components/event/EventHeader';
import { DateVoting } from '@/components/event/DateVoting';
import { ActivitySection } from '@/components/event/ActivitySection';
import { LocationSection } from '@/components/event/LocationSection';
import { ParticipantsList } from '@/components/event/ParticipantsList';
import { VoteResults } from '@/components/event/VoteResults';
import { AIProgressStepper } from '@/components/create-event/AIProgressStepper';
import { PulseVoting } from '@/components/event/PulseVoting';
import { LockdownView } from '@/components/event/LockdownView';
import { OrganizerTaskManager } from '@/components/event/OrganizerTaskManager';
import { OrganizerDashboard } from '@/components/create-event/OrganizerDashboard';
import { supabase } from '@/integrations/supabase/client';
import { ParticipantNudge } from '@/components/event/ParticipantNudge';
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

// Welcome gate shown before user joins
const EventWelcomeGate = ({ eventTitle, onJoin }: { eventTitle: string; onJoin: (name: string) => Promise<any> }) => {
  const [name, setName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsJoining(true);
    try {
      await onJoin(name.trim());
    } catch {
      setIsJoining(false);
    }
  };

  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-md mx-auto">
        <Card className="border-border/50 shadow-lg">
          <CardContent className="pt-8 pb-8 px-8 space-y-6 text-center">
            <h1 className="text-2xl font-bold text-foreground">{eventTitle}</h1>
            <p className="text-muted-foreground">{t.eventPage.join.invited}</p>
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div className="space-y-2">
                <Label htmlFor="join-name">{t.eventPage.join.firstName}</Label>
                <Input
                  id="join-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.eventPage.join.firstNamePlaceholder}
                  autoFocus
                  disabled={isJoining}
                />
              </div>
              <Button type="submit" className="w-full gap-2" size="lg" disabled={!name.trim() || isJoining}>
                {isJoining ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                {t.eventPage.join.joinEvent}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Event = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const { toast } = useToast();

  const [scenarios, setScenarios] = useState<AIScenario[]>([]);
  const [winningScenario, setWinningScenario] = useState<AIScenario | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [contextAnalysis, setContextAnalysis] = useState<ContextAnalysis | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

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

  const handleRegenerateScenarios = async () => {
    if (!event?.id || !eventData?.spark_prompt) return;

    setIsRegenerating(true);
    try {
      // Fetch all unintegrated sparks
      const { data: sparks } = await supabase
        .from('participant_sparks')
        .select('*')
        .eq('event_id', event.id)
        .eq('is_integrated', false);

      if (!sparks || sparks.length === 0) {
        toast({ title: t.aiConcierge.pulse.noNewRequirements, variant: 'destructive' });
        setIsRegenerating(false);
        return;
      }

      // Call AI to regenerate scenarios with sparks
      const { data: result, error } = await supabase.functions.invoke('ai-event-assistant', {
        body: {
          action: 'regenerate-scenarios',
          sparkPrompt: eventData.spark_prompt,
          eventId: event.id,
          contextAnalysis,
          language,
          existingSparks: sparks.map((s: any) => ({
            id: s.id,
            text: s.spark_text,
            category: s.category,
          })),
        },
      });

      if (error) throw error;

      // Update scenarios in the database
      const newScenarios = result.data?.scenarios || [];
      const integratedSparks = result.data?.integratedSparks || [];

      // Delete old scenarios and their date options
      await supabase.from('scenario_date_options').delete().in(
        'scenario_id',
        scenarios.map(s => s.id)
      );
      await supabase.from('ai_scenarios').delete().eq('event_id', event.id);

      // Insert new scenarios
      const insertedScenarioIds: string[] = [];
      for (const scenario of newScenarios) {
        const { data: insertedScenario } = await supabase.from('ai_scenarios').insert({
          event_id: event.id,
          scenario_label: `Option ${scenario.label}`,
          title: scenario.title,
          description: scenario.description,
          suggested_date: scenario.suggested_date,
          suggested_time_of_day: scenario.time_of_day,
          suggested_vibe: scenario.vibe,
          metadata: {
            constraints_applied: scenario.constraints_applied,
            special_traits: scenario.special_traits,
            midpoint_info: scenario.midpoint_info,
            date_is_flexible: scenario.date_is_flexible,
            location: scenario.location,
            budget: scenario.budget,
            accommodation: scenario.accommodation,
          },
        }).select().single();

        if (insertedScenario) {
          insertedScenarioIds.push(insertedScenario.id);
          
          // Update sparks that were integrated into this scenario
          const matchingSparkIds = integratedSparks
            .filter((is: any) => is.scenarioLabel === scenario.label)
            .map((is: any) => is.sparkId);

          if (matchingSparkIds.length > 0) {
            await supabase
              .from('participant_sparks')
              .update({
                is_integrated: true,
                integrated_into_scenario_id: insertedScenario.id,
                integration_note: `Included in ${scenario.title}`,
              })
              .in('id', matchingSparkIds);
          }
        }
      }

      // Insert date options for new scenarios if available
      const dateOptions = result.data?.dateOptions;
      if (dateOptions && dateOptions.length > 0 && insertedScenarioIds.length > 0) {
        const dateOptionsToInsert = insertedScenarioIds.flatMap((scenarioId: string) =>
          dateOptions.map((opt: any) => ({
            scenario_id: scenarioId,
            suggested_date: opt.date,
            is_long_weekend: opt.is_long_weekend,
            holiday_name: opt.holiday_name_fr || opt.holiday_name,
          }))
        );

        await supabase.from('scenario_date_options').insert(dateOptionsToInsert);

        // Also update event_candidate_dates for the AvailabilityPanel
        // First delete existing dates, then insert fresh ones
        await supabase.from('event_candidate_dates').delete().eq('event_id', event.id);
        
        const eventCandidateDates = dateOptions.map((opt: any) => ({
          event_id: event.id,
          suggested_date: opt.date,
          is_long_weekend: opt.is_long_weekend,
          holiday_name: opt.holiday_name_fr || opt.holiday_name,
        }));

        await supabase.from('event_candidate_dates').insert(eventCandidateDates);
      }

      // Mark remaining sparks as integrated (even if not matched to specific scenario)
      const allSparkIds = sparks.map((s: any) => s.id);
      const matchedIds = integratedSparks.map((is: any) => is.sparkId);
      const unmatchedIds = allSparkIds.filter((id: string) => !matchedIds.includes(id));
      
      if (unmatchedIds.length > 0) {
        await supabase
          .from('participant_sparks')
          .update({ is_integrated: true, integration_note: 'Considered in scenario generation' })
          .in('id', unmatchedIds);
      }

      // Refresh scenarios
      const { data: refreshedScenarios } = await supabase
        .from('ai_scenarios')
        .select('*')
        .eq('event_id', event.id)
        .order('scenario_label');

      if (refreshedScenarios) {
        setScenarios(refreshedScenarios as AIScenario[]);
      }

      toast({ title: t.aiConcierge.pulse.scenariosUpdated });
    } catch (error) {
      console.error('Error regenerating scenarios:', error);
      toast({ title: t.aiConcierge.pulse.errorUpdating, variant: 'destructive' });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleFinalize = async () => {
    if (!event?.id) return;

    try {
      const { data: votes } = await supabase
        .from('scenario_votes')
        .select('*')
        .eq('event_id', event.id);

      if (!votes || votes.length === 0) {
        toast({ title: t.aiConcierge.pulse.noVotesYet, variant: 'destructive' });
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
          title: t.aiConcierge.pulse.vetoWarningTitle, 
          description: t.aiConcierge.pulse.vetoWarningFinalize.replace('{count}', String(winnerData.dealbreakers)),
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
      toast({ title: t.aiConcierge.pulse.errorFinalizing, variant: 'destructive' });
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

  // Gate: user must join before seeing event content
  if (!currentParticipant) {
    return <EventWelcomeGate eventTitle={event.title} onJoin={joinEvent} />;
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
            <LockdownView eventId={event.id} eventTitle={event.title} winningScenario={winningScenario} participantId={currentParticipant?.id} participantName={currentParticipant?.name} isOrganizer={!!isOrganizer} finalLocation={eventData?.final_location as any} onRefetch={refetch} participantsCount={participants.length} />
          ) : isOrganizer ? (
            <OrganizerDashboard
              eventId={event.id}
              eventSlug={event.unique_slug}
              eventTitle={event.title}
              userId={user?.id}
            />
          ) : (
            <>
              <AIProgressStepper currentPhase="pulse" />
              {scenarios.length > 0 && (
                <PulseVoting 
                  eventId={event.id} 
                  scenarios={scenarios} 
                  participantId={currentParticipant?.id} 
                  totalParticipants={participants.length} 
                  isOrganizer={isOrganizer} 
                  onFinalize={handleFinalize}
                  contextAnalysis={contextAnalysis}
                  onRegenerateScenarios={handleRegenerateScenarios}
                  isRegenerating={isRegenerating}
                  onVote={() => setHasInteracted(true)}
                />
              )}
              <div className="lg:hidden">
                <ParticipantsList participants={participants} currentParticipantId={currentParticipant?.id} />
              </div>
              {!isOrganizer && (
                <ParticipantNudge
                  eventId={event.id}
                  eventSlug={event.unique_slug}
                  isAuthenticated={!!user}
                  hasInteracted={hasInteracted}
                />
              )}
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
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {dateOptions.length > 0 && <DateVoting dateOptions={dateOptions} dateVotes={dateVotes} participantId={currentParticipant?.id} participantsCount={participants.length} onVote={() => setHasInteracted(true)} />}
            <ActivitySection eventId={event.id} activities={activities} activityVotes={activityVotes} participantId={currentParticipant?.id} participantsCount={participants.length} />
            {event.location_type && <LocationSection event={event} locationSuggestions={locationSuggestions} locationVotes={locationVotes} participants={participants} participantId={currentParticipant?.id} onUpdateLocation={updateLocation} />}
          </div>
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <ParticipantsList participants={participants} currentParticipantId={currentParticipant?.id} />
            </div>
          </div>
        </div>
        {isOrganizer && <OrganizerTaskManager eventId={event.id} />}
        {!isOrganizer && (
          <ParticipantNudge
            eventId={event.id}
            eventSlug={event.unique_slug}
            isAuthenticated={!!user}
            hasInteracted={hasInteracted}
          />
        )}
      </div>
    </div>
  );
};

export default Event;