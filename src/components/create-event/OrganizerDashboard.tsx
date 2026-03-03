import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, ExternalLink, Copy, Mail, MessageCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AIProgressStepper } from './AIProgressStepper';
import { PulseVoting } from '@/components/event/PulseVoting';
import { SharePanel } from '@/components/event/SharePanel';


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
  const { language, t } = useLanguage();
  const { toast } = useToast();
  
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [contextAnalysis, setContextAnalysis] = useState<ContextAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [aiPhase, setAiPhase] = useState<'spark' | 'pulse' | 'lockdown'>('spark');
  const [hasLaunched, setHasLaunched] = useState(() => {
    return localStorage.getItem(`launched-${eventId}`) === 'true';
  });
  const [copied, setCopied] = useState(false);

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
        title: t.aiConcierge?.pulse?.title || (language === 'fr' ? 'Scénarios régénérés' : 'Scenarios regenerated'),
        description: language === 'fr' ? 'De nouveaux scénarios ont été créés.' : 'New scenarios have been created based on group input.',
      });
    } catch (error) {
      console.error('Error regenerating scenarios:', error);
      toast({
        title: language === 'fr' ? 'Erreur' : 'Error',
        description: language === 'fr' ? 'Impossible de régénérer les scénarios.' : 'Failed to regenerate scenarios. Please try again.',
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
          title: language === 'fr' ? 'Aucun vote' : 'No votes yet',
          description: language === 'fr' ? 'Attendez que les participants votent.' : 'Wait for participants to vote before finalizing.',
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
          title: language === 'fr' ? 'Pas de gagnant clair' : 'No clear winner',
          description: language === 'fr' ? 'Tous les scénarios ont des vétos ou aucun vote.' : 'All scenarios have dealbreakers or no votes. Try regenerating.',
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
        title: language === 'fr' ? 'Erreur' : 'Error',
        description: language === 'fr' ? 'Impossible de finaliser l\'événement.' : 'Failed to finalize the event. Please try again.',
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

  const handleLaunch = () => {
    setHasLaunched(true);
    localStorage.setItem(`launched-${eventId}`, 'true');
  };

  const shareUrl = `${window.location.origin}/event/${eventSlug}`;

  const handleQuickCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: language === 'fr' ? 'Lien copié !' : 'Link copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickEmail = () => {
    const subject = encodeURIComponent(eventTitle || 'Join our event!');
    const body = encodeURIComponent(`${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleQuickWhatsApp = () => {
    const message = encodeURIComponent(`${eventTitle || 'Event'}: ${shareUrl}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  // ── LAUNCH SCREEN ──
  if (!hasLaunched && scenarios.length > 0 && participantId) {
    return (
      <div className="max-w-lg mx-auto space-y-6 py-8">
        <AIProgressStepper currentPhase={aiPhase} />

        {/* ① Celebration */}
        <div className="text-center space-y-2">
          <span className="text-5xl">🎉</span>
          <h2 className="text-2xl font-bold text-foreground">
            {language === 'fr' ? 'Votre événement est lancé !' : 'Your event is live!'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'fr'
              ? 'Partagez le lien avec vos amis pour qu\'ils votent pour leur option préférée.'
              : 'Share the link with your friends so they can vote for their favorite option.'}
          </p>
        </div>

        {/* ② Vote nudge card */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-1">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🗳️</span>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold text-primary">
                {language === 'fr' ? 'Et vous, avez-vous voté ?' : 'Have you voted yet?'}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === 'fr'
                  ? 'Les participants suivent votre exemple — votez en premier pour montrer la voie.'
                  : 'Participants follow your lead — vote first to set the tone.'}
              </p>
            </div>
          </div>
          <Button variant="default" size="sm" className="w-full mt-3" onClick={handleLaunch}>
            {language === 'fr' ? 'Voter maintenant →' : 'Vote now →'}
          </Button>
        </div>

        {/* ③ Share panel */}
        <Card className="border">
          <CardContent className="pt-6">
            <SharePanel eventId={eventId} eventSlug={eventSlug} eventTitle={eventTitle} />
          </CardContent>
        </Card>

        {/* ④ Primary CTA */}
        <Button variant="default" size="lg" className="w-full" onClick={handleLaunch}>
          {language === 'fr' ? 'J\'ai partagé le lien → Voir le dashboard' : 'I shared the link → View dashboard'}
        </Button>

        {/* ⑤ Helper text */}
        <p className="text-xs text-muted-foreground text-center">
          {language === 'fr'
            ? 'Vous pouvez revenir sur cette page à tout moment pour suivre les votes.'
            : 'You can come back to this page anytime to track votes.'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <AIProgressStepper currentPhase={aiPhase} />

      {/* Compact persistent share bar */}
      {hasLaunched && eventSlug && (
        <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">🔗 {language === 'fr' ? 'Partagez avec vos amis' : 'Share with friends'}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={handleQuickCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={handleQuickEmail}>
              <Mail className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleQuickWhatsApp}>
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-2xl font-bold text-foreground">
            {eventTitle || (t.aiConcierge?.spark?.waitingRoom?.title || 'Your Event is Ready!')}
          </h2>
          {eventSlug && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => window.location.href = `/event/${eventSlug}`}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
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
              {language === 'fr' ? 'Les scénarios sont en cours de génération...' : 'Scenarios are being generated...'}
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
              {language === 'fr' ? 'Générer les scénarios' : 'Generate Scenarios'}
            </Button>
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">{language === 'fr' ? 'Préparation de votre profil organisateur...' : 'Setting up your organizer profile...'}</p>
          </div>
        )}
      </div>
    </div>
  );
};
