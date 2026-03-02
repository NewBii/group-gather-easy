import { useState, useEffect } from 'react';
import { Loader2, Save, Check, Send, ChevronDown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScenarioCard } from './ScenarioCard';
import { ConsensusScore } from './ConsensusScore';
import { ConstraintBadge } from './ConstraintBadge';
import { GroupWishlist } from './GroupWishlist';
import { SharePanel } from './SharePanel';
import { AvailabilityPanel } from './AvailabilityPanel';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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
  eventSlug?: string;
  eventTitle?: string;
  scenarios: Scenario[];
  participantId?: string;
  totalParticipants: number;
  isOrganizer?: boolean;
  onFinalize?: () => void;
  contextAnalysis?: ContextAnalysis | null;
  onRegenerateScenarios?: () => void;
  isRegenerating?: boolean;
  onVote?: () => void;
}

interface VoteState {
  [scenarioId: string]: {
    rank: number | null;
    isDealbreaker: boolean;
  };
}

export const PulseVoting = ({
  eventId,
  eventSlug,
  eventTitle,
  scenarios,
  participantId,
  totalParticipants,
  isOrganizer,
  onFinalize,
  contextAnalysis,
  onRegenerateScenarios,
  isRegenerating,
  onVote,
}: PulseVotingProps) => {
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [votes, setVotes] = useState<VoteState>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedVotes, setSavedVotes] = useState<VoteState>({});

  // Wishes state
  const [wishText, setWishText] = useState('');
  const [isSubmittingWish, setIsSubmittingWish] = useState(false);
  const [submittedWishes, setSubmittedWishes] = useState<Array<{ id: string; text: string }>>([]);

  // Collapsible states for participant view
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [wishesOpen, setWishesOpen] = useState(false);

  const isDateFlexible = contextAnalysis?.constraints?.date?.type === 'flexible';
  const canVote = !!participantId;
  const constraints = contextAnalysis?.constraints;

  const rankedCount = Object.values(votes).filter(v => v.rank !== null && !v.isDealbreaker).length;
  const totalScenarios = scenarios.length;
  const allRanked = rankedCount >= totalScenarios;

  // Auto-expand availability when all ranked
  useEffect(() => {
    if (allRanked && !isOrganizer) {
      setAvailabilityOpen(true);
    }
  }, [allRanked, isOrganizer]);

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
          voteState[v.scenario_id] = { rank: v.rank, isDealbreaker: v.is_dealbreaker };
        });
        setVotes(voteState);
        setSavedVotes(voteState);
      }
    };
    loadVotes();
  }, [participantId, eventId]);

  // Load submitted wishes
  useEffect(() => {
    if (!participantId) return;
    const loadWishes = async () => {
      const { data } = await supabase
        .from('participant_sparks')
        .select('id, spark_text')
        .eq('event_id', eventId)
        .eq('participant_id', participantId)
        .order('created_at', { ascending: false });
      if (data) {
        setSubmittedWishes(data.map(d => ({ id: d.id, text: d.spark_text })));
      }
    };
    loadWishes();
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
      toast({ title: t.eventPage?.dateVoting?.joinFirst || 'Join the event to vote', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      await supabase.from('scenario_votes').delete().eq('participant_id', participantId).eq('event_id', eventId);
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
        const { error } = await supabase.from('scenario_votes').insert(votesToInsert);
        if (error) throw error;
      }
      setSavedVotes(votes);
      setHasChanges(false);
      toast({ title: t.eventPage?.dateVoting?.saved || 'Votes saved!' });
      onVote?.();
    } catch (error) {
      console.error('Error saving votes:', error);
      toast({ title: t.eventPage?.dateVoting?.voteError || 'Error saving votes', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitWish = async () => {
    if (!participantId || !wishText.trim()) return;
    setIsSubmittingWish(true);
    try {
      const { data, error } = await supabase.from('participant_sparks').insert({
        event_id: eventId,
        participant_id: participantId,
        spark_text: wishText.trim(),
        category: 'nice_to_have' as const,
      }).select('id, spark_text').single();
      if (error) throw error;
      if (data) {
        setSubmittedWishes(prev => [{ id: data.id, text: data.spark_text }, ...prev]);
      }
      setWishText('');
      toast({ title: language === 'fr' ? 'Souhait envoyé !' : 'Wish sent!' });
    } catch (error) {
      console.error('Error submitting wish:', error);
      toast({ title: language === 'fr' ? 'Erreur' : 'Error', variant: 'destructive' });
    } finally {
      setIsSubmittingWish(false);
    }
  };

  // ── Scenario cards grid ──
  const ScenarioCards = () => (
    <>
      {isMobile ? (
        <Carousel className="w-full" opts={{ align: 'start', loop: false }}>
          <CarouselContent className="-ml-2">
            {scenarios.map((scenario) => (
              <CarouselItem key={scenario.id} className="pl-2 basis-[90%]">
                <ScenarioCard
                  scenario={scenario}
                  rank={votes[scenario.id]?.rank ?? undefined}
                  isDealbreaker={votes[scenario.id]?.isDealbreaker}
                  onRankChange={(rank) => handleRankChange(scenario.id, rank)}
                  onDealbreakerToggle={() => handleDealbreakerToggle(scenario.id)}
                  isVotingEnabled={canVote}
                  showRanking={canVote}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex justify-center gap-2 mt-4">
            <CarouselPrevious className="static translate-y-0" />
            <CarouselNext className="static translate-y-0" />
          </div>
        </Carousel>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
      )}
    </>
  );

  // ── Availability section ──
  const AvailabilitySection = ({ collapsible }: { collapsible: boolean }) => {
    if (!isDateFlexible) return null;

    if (collapsible) {
      return (
        <Collapsible open={availabilityOpen} onOpenChange={setAvailabilityOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-3 px-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <span className="text-sm font-medium text-foreground">
              📅 {language === 'fr' ? 'Étape 2 · Vos disponibilités' : 'Step 2 · Your availability'}
            </span>
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', availabilityOpen && 'rotate-180')} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <AvailabilityPanel eventId={eventId} participantId={participantId} disabled={!canVote} />
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return <AvailabilityPanel eventId={eventId} participantId={participantId} disabled={!canVote} />;
  };

  // ── Wishes section ──
  const WishesSection = ({ collapsible }: { collapsible: boolean }) => {
    if (!canVote) return null;

    const content = (
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={wishText}
            onChange={(e) => setWishText(e.target.value.slice(0, 200))}
            placeholder={language === 'fr' ? 'Une idée, une contrainte, un souhait...' : 'An idea, a constraint, a wish...'}
            disabled={isSubmittingWish}
            onKeyDown={(e) => { if (e.key === 'Enter' && wishText.trim()) handleSubmitWish(); }}
          />
          <Button onClick={handleSubmitWish} disabled={!wishText.trim() || isSubmittingWish} size="default">
            {isSubmittingWish ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <><Send className="h-4 w-4 mr-1.5" />{language === 'fr' ? 'Envoyer' : 'Send'}</>
            )}
          </Button>
        </div>
        {submittedWishes.length > 0 && (
          <ul className="space-y-1.5">
            {submittedWishes.map((wish) => (
              <li key={wish.id} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{wish.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );

    if (collapsible) {
      return (
        <Collapsible open={wishesOpen} onOpenChange={setWishesOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-3 px-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <span className="text-sm font-medium text-foreground">
              ✨ {language === 'fr' ? 'Une idée à ajouter ?' : 'Have an idea to add?'}
            </span>
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', wishesOpen && 'rotate-180')} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            {content}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return content;
  };

  // ══════════════════════════════════════════════
  //  SHARED: Instruction banner + constraint badges + progress
  // ══════════════════════════════════════════════
  const VotingHeader = () => (
    <div className="space-y-4">
      {/* Étape 1 divider */}
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
          {language === 'fr' ? 'Étape 1 · Classez les options' : 'Step 1 · Rank the options'}
        </span>
        <Separator className="flex-1" />
      </div>

      {/* Single instruction banner — the only heading */}
      {canVote && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
          <p className="text-base font-semibold text-foreground">
            {language === 'fr'
              ? 'Classez les options de 1 à 3 et signalez les impossibilités'
              : 'Rank the options from 1 to 3 and flag any dealbreakers'}
          </p>
        </div>
      )}

      {/* Constraint badges — subtle, inline */}
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
              displayLabel={constraints.time.displayLabel || (constraints.time.type === 'fixed' ? 'Time locked' : 'Vote on time')
              }
            />
          )}
        </div>
      )}

      {/* Progress indicator */}
      {canVote && (
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalScenarios }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-2.5 h-2.5 rounded-full transition-colors',
                  i < rankedCount
                    ? (allRanked ? 'bg-green-500' : 'bg-primary')
                    : 'bg-border'
                )}
              />
            ))}
          </div>
          <p className={cn(
            'text-sm',
            allRanked ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'
          )}>
            {allRanked
              ? (language === 'fr'
                ? '✓ Classement complet'
                : '✓ Ranking complete')
              : (language === 'fr'
                ? `${rankedCount}/${totalScenarios} classées`
                : `${rankedCount}/${totalScenarios} ranked`)}
          </p>
        </div>
      )}
    </div>
  );

  // ══════════════════════════════════════════════
  //  ORGANIZER VIEW
  // ══════════════════════════════════════════════
  if (isOrganizer) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Instruction + badges + progress */}
        <VotingHeader />

        {/* Scenario cards — full width */}
        <ScenarioCards />

        {/* Tabs below cards */}
        <Tabs defaultValue="results" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="results">📊 {language === 'fr' ? 'Résultats' : 'Results'}</TabsTrigger>
            <TabsTrigger value="share">🔗 {language === 'fr' ? 'Partager' : 'Share'}</TabsTrigger>
            <TabsTrigger value="availability">📅 {language === 'fr' ? 'Disponibilités' : 'Availability'}</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="space-y-6 mt-6">
            <ConsensusScore
              eventId={eventId}
              scenarios={scenarios}
              totalParticipants={totalParticipants}
            />
            <GroupWishlist
              eventId={eventId}
              isOrganizer={isOrganizer}
              onRegenerateScenarios={onRegenerateScenarios}
              isRegenerating={isRegenerating}
              currentParticipantId={participantId}
            />
            <Button variant="default" size="lg" onClick={onFinalize} className="w-full">
              {t.aiConcierge?.pulse?.finalize || 'Finalize Event'}
            </Button>
          </TabsContent>

          <TabsContent value="share" className="space-y-6 mt-6">
            <SharePanel
              eventId={eventId}
              eventSlug={eventSlug || ''}
              eventTitle={eventTitle}
            />
            <div className="text-center text-sm text-muted-foreground">
              {language === 'fr'
                ? `${totalParticipants} participant${totalParticipants > 1 ? 's' : ''}`
                : `${totalParticipants} participant${totalParticipants > 1 ? 's' : ''}`}
            </div>
          </TabsContent>

          <TabsContent value="availability" className="space-y-6 mt-6">
            <AvailabilitySection collapsible={false} />
          </TabsContent>
        </Tabs>

        {/* Wishes — always visible for organizer */}
        <div className="space-y-2">
          <Separator />
          <p className="text-sm font-medium text-muted-foreground">
            ✨ {language === 'fr' ? 'Ajouter une idée' : 'Add an idea'}
          </p>
          <WishesSection collapsible={false} />
        </div>

        {/* Sticky save bar */}
        {canVote && hasChanges && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t shadow-lg">
            <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
              <p className="text-sm text-muted-foreground">
                {language === 'fr'
                  ? `${rankedCount}/${totalScenarios} classées`
                  : `${rankedCount}/${totalScenarios} ranked`}
              </p>
              <Button onClick={handleSave} disabled={isSaving} size="lg">
                {isSaving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.eventPage?.dateVoting?.saving || 'Saving...'}</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" />{language === 'fr' ? 'Enregistrer mes votes' : 'Save my votes'}</>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════
  //  PARTICIPANT VIEW — Single column, collapsible
  // ══════════════════════════════════════════════
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Instruction + badges + progress */}
      <VotingHeader />

      {/* Scenario cards — full width */}
      <ScenarioCards />

      {/* Collapsible sections */}
      <AvailabilitySection collapsible={true} />
      <WishesSection collapsible={true} />

      {/* Sticky save bar */}
      {canVote && hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t shadow-lg">
          <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {language === 'fr'
                ? `${rankedCount}/${totalScenarios} classées`
                : `${rankedCount}/${totalScenarios} ranked`}
            </p>
            <Button onClick={handleSave} disabled={isSaving} size="lg">
              {isSaving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.eventPage?.dateVoting?.saving || 'Saving...'}</>
              ) : (
                <><Save className="mr-2 h-4 w-4" />{language === 'fr' ? 'Enregistrer mes votes' : 'Save my votes'}</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
