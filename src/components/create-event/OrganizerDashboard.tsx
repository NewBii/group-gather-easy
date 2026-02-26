import { useState, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AIProgressStepper } from './AIProgressStepper';
import { PulseVoting } from '@/components/event/PulseVoting';


// Types matching PulseVoting component
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
  title: string;
  description?: string;
  scenario_label: string;
  suggested_date?: string;
  suggested_time_of_day?: string;
  suggested_vibe?: string;
  metadata?: {
    special_traits?: SpecialTrait[];
    constraints_applied?: ConstraintsApplied;
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

interface OrganizerDashboardProps {
  eventId: string;
  eventSlug: string;
  eventTitle?: string;
  userId?: string;
}

export const OrganizerDashboard = ({ eventId, eventSlug, eventTitle, userId }: OrganizerDashboardProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [contextAnalysis, setContextAnalysis] = useState<ContextAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [aiPhase, setAiPhase] = useState<'spark' | 'pulse' | 'lockdown'>('spark');

  // Fetch scenarios and register organizer as participant
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        // Fetch event data for context analysis and phase
        const { data: eventData } = await supabase
          .from('events')
          .select('location_data, ai_phase')
          .eq('id', eventId)
          .single();

        if (eventData?.location_data) {
          const locationData = eventData.location_data as { contextAnalysis?: ContextAnalysis };
          setContextAnalysis(locationData.contextAnalysis || null);
        }
        
        if (eventData?.ai_phase) {
          setAiPhase(eventData.ai_phase as 'spark' | 'pulse' | 'lockdown');
        }

        // Fetch scenarios
        const { data: scenarioData } = await supabase
          .from('ai_scenarios')
          .select('*')
          .eq('event_id', eventId)
          .order('created_at', { ascending: true });

        if (scenarioData) {
          const formattedScenarios: Scenario[] = scenarioData.map((s) => ({
            id: s.id,
            title: s.title,
            description: s.description || undefined,
            scenario_label: s.scenario_label,
            suggested_date: s.suggested_date || undefined,
            suggested_time_of_day: s.suggested_time_of_day || undefined,
            suggested_vibe: s.suggested_vibe || undefined,
            metadata: s.metadata as Scenario['metadata'],
          }));
          setScenarios(formattedScenarios);
        }

        // Register organizer as participant if not already
        if (userId) {
          // Check if already a participant
          const { data: existingParticipant } = await supabase
            .from('participants')
            .select('id')
            .eq('event_id', eventId)
            .eq('user_id', userId)
            .maybeSingle();

          if (existingParticipant) {
            setParticipantId(existingParticipant.id);
          } else {
            // Get user profile for name/email
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name, email')
              .eq('user_id', userId)
              .maybeSingle();

            // Create participant record
            const { data: newParticipant } = await supabase
              .from('participants')
              .insert({
                event_id: eventId,
                user_id: userId,
                name: profile?.display_name || 'Organizer',
                email: profile?.email || null,
                is_organizer: true,
              })
              .select()
              .single();

            if (newParticipant) {
              setParticipantId(newParticipant.id);
            }
          }
        } else {
          // Anonymous user - check sessionStorage for existing participant
          const storageKey = `organizer-${eventId}`;
          const storedParticipantId = sessionStorage.getItem(storageKey);

          if (storedParticipantId) {
            // Verify it still exists in database (use public view for anonymous access)
            const { data: existingParticipant } = await supabase
              .from('participants_public')
              .select('id')
              .eq('id', storedParticipantId)
              .maybeSingle();

            if (existingParticipant) {
              setParticipantId(existingParticipant.id);
            } else {
              // Stored ID is stale, create new anonymous participant
              const { data: newParticipant } = await supabase
                .from('participants')
                .insert({
                  event_id: eventId,
                  name: 'Organizer',
                  is_organizer: true,
                })
                .select()
                .single();

              if (newParticipant) {
                sessionStorage.setItem(storageKey, newParticipant.id);
                setParticipantId(newParticipant.id);
              }
            }
          } else {
            // No stored ID, create new anonymous participant
            const { data: newParticipant } = await supabase
              .from('participants')
              .insert({
                event_id: eventId,
                name: 'Organizer',
                is_organizer: true,
              })
              .select()
              .single();

            if (newParticipant) {
              sessionStorage.setItem(storageKey, newParticipant.id);
              setParticipantId(newParticipant.id);
            }
          }
        }

        // Fetch participant count
        const { count } = await supabase
          .from('participants_public')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId);
        setParticipantCount(count || 0);

      } catch (error) {
        console.error('Error initializing organizer dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    // Subscribe to scenario updates
    const scenarioChannel = supabase
      .channel(`organizer-scenarios-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_scenarios',
          filter: `event_id=eq.${eventId}`,
        },
        async () => {
          // Refetch scenarios on any change
          const { data } = await supabase
            .from('ai_scenarios')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: true });

          if (data) {
            const formattedScenarios: Scenario[] = data.map((s) => ({
              id: s.id,
              title: s.title,
              description: s.description || undefined,
              scenario_label: s.scenario_label,
              suggested_date: s.suggested_date || undefined,
              suggested_time_of_day: s.suggested_time_of_day || undefined,
              suggested_vibe: s.suggested_vibe || undefined,
              metadata: s.metadata as Scenario['metadata'],
            }));
            setScenarios(formattedScenarios);
          }
        }
      )
      .subscribe();

    // Subscribe to participant count updates
    const participantChannel = supabase
      .channel(`organizer-participants-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'participants',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          setParticipantCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(scenarioChannel);
      supabase.removeChannel(participantChannel);
    };
  }, [eventId, userId]);

  const handleRegenerateScenarios = async () => {
    setIsRegenerating(true);
    try {
      const { error } = await supabase.functions.invoke('ai-event-assistant', {
        body: {
          action: 'regenerate_scenarios',
          event_id: eventId,
        },
      });

      if (error) throw error;

      toast({
        title: t.aiConcierge?.pulse?.title || 'Scenarios regenerated',
        description: 'New scenarios have been created based on group input.',
      });
    } catch (error) {
      console.error('Error regenerating scenarios:', error);
      toast({
        title: 'Error',
        description: 'Failed to regenerate scenarios. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleFinalize = async () => {
    try {
      // Get all votes
      const { data: votes } = await supabase
        .from('scenario_votes')
        .select('*')
        .eq('event_id', eventId);

      if (!votes || votes.length === 0) {
        toast({
          title: 'No votes yet',
          description: 'Wait for participants to vote before finalizing.',
          variant: 'destructive',
        });
        return;
      }

      // Calculate scores - lower rank is better, dealbreakers disqualify
      const scenarioScores: Record<string, { totalRank: number; voteCount: number; dealbreakers: number }> = {};

      for (const scenario of scenarios) {
        scenarioScores[scenario.id] = { totalRank: 0, voteCount: 0, dealbreakers: 0 };
      }

      for (const vote of votes) {
        if (scenarioScores[vote.scenario_id]) {
          if (vote.is_dealbreaker) {
            scenarioScores[vote.scenario_id].dealbreakers += 1;
          } else if (vote.rank) {
            scenarioScores[vote.scenario_id].totalRank += vote.rank;
            scenarioScores[vote.scenario_id].voteCount += 1;
          }
        }
      }

      // Find winner (no dealbreakers, lowest average rank)
      let winnerId: string | null = null;
      let bestScore = Infinity;

      for (const [scenarioId, scores] of Object.entries(scenarioScores)) {
        if (scores.dealbreakers === 0 && scores.voteCount > 0) {
          const avgRank = scores.totalRank / scores.voteCount;
          if (avgRank < bestScore) {
            bestScore = avgRank;
            winnerId = scenarioId;
          }
        }
      }

      if (!winnerId) {
        toast({
          title: 'No clear winner',
          description: 'All scenarios have dealbreakers or no votes. Try regenerating.',
          variant: 'destructive',
        });
        return;
      }

      const winningScenario = scenarios.find((s) => s.id === winnerId);

      // Update event to lockdown phase
      const { error } = await supabase
        .from('events')
        .update({
          ai_phase: 'lockdown',
          final_date: winningScenario?.suggested_date,
          final_location: { scenario_id: winnerId, title: winningScenario?.title },
        })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: t.aiConcierge?.lockdown?.title || "It's official!",
        description: `${winningScenario?.title} has been selected!`,
      });

      // Navigate to event page
      window.location.href = `/event/${eventSlug}`;
    } catch (error) {
      console.error('Error finalizing event:', error);
      toast({
        title: 'Error',
        description: 'Failed to finalize the event. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AIProgressStepper currentPhase={aiPhase} />

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
          <span className="text-3xl">🎯</span>
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          {eventTitle || (t.aiConcierge?.spark?.waitingRoom?.title || 'Your Event is Ready!')}
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {t.aiConcierge?.pulse?.subtitle || 'Review the scenarios, cast your vote, and share with your group'}
        </p>
      </div>

      {/* Main Layout — single column */}
      <div className="space-y-6">
        {scenarios.length > 0 && participantId ? (
          <PulseVoting
            eventId={eventId}
            eventSlug={eventSlug}
            eventTitle={eventTitle}
            scenarios={scenarios}
            participantId={participantId}
            totalParticipants={participantCount}
            isOrganizer={true}
            onFinalize={handleFinalize}
            contextAnalysis={contextAnalysis}
            onRegenerateScenarios={handleRegenerateScenarios}
            isRegenerating={isRegenerating}
          />
        ) : scenarios.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
            <p className="text-muted-foreground">
              Scenarios are being generated...
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={handleRegenerateScenarios}
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Generate Scenarios
            </Button>
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Setting up your organizer profile...</p>
          </div>
        )}
      </div>
    </div>
  );
};
