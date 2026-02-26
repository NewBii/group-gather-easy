import { useState, useMemo } from 'react';
import { Check, X, HelpCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { DateOption, DateVote } from '@/hooks/useEventData';

interface DateVotingProps {
  dateOptions: DateOption[];
  dateVotes: DateVote[];
  participantId: string | undefined;
  participantsCount: number;
  onVote?: () => void;
}

type VoteType = 'yes' | 'no' | 'maybe';

export const DateVoting = ({ dateOptions, dateVotes, participantId, participantsCount, onVote }: DateVotingProps) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [pendingVotes, setPendingVotes] = useState<Map<string, VoteType>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const dateLocale = language === 'fr' ? fr : enUS;

  const getVoteCounts = (dateOptionId: string) => {
    const votes = dateVotes.filter(v => v.date_option_id === dateOptionId);
    return {
      yes: votes.filter(v => v.vote === 'yes').length,
      no: votes.filter(v => v.vote === 'no').length,
      maybe: votes.filter(v => v.vote === 'maybe').length,
    };
  };

  const getSavedVote = (dateOptionId: string): VoteType | null => {
    if (!participantId) return null;
    const vote = dateVotes.find(v => v.date_option_id === dateOptionId && v.participant_id === participantId);
    return vote?.vote || null;
  };

  const getDisplayVote = (dateOptionId: string): VoteType | null => {
    return pendingVotes.get(dateOptionId) ?? getSavedVote(dateOptionId);
  };

  const isPending = (dateOptionId: string): boolean => {
    const pending = pendingVotes.get(dateOptionId);
    const saved = getSavedVote(dateOptionId);
    return pending !== undefined && pending !== saved;
  };

  const handleVoteChange = (dateOptionId: string, vote: VoteType) => {
    if (!participantId) {
      toast({
        title: t.eventPage.dateVoting.joinFirst,
        variant: 'destructive',
      });
      return;
    }

    setPendingVotes(prev => {
      const next = new Map(prev);
      const saved = getSavedVote(dateOptionId);
      if (vote === saved) {
        next.delete(dateOptionId);
      } else {
        next.set(dateOptionId, vote);
      }
      return next;
    });
  };

  const pendingCount = useMemo(() => {
    return Array.from(pendingVotes.entries()).filter(([id, vote]) => {
      const saved = getSavedVote(id);
      return vote !== saved;
    }).length;
  }, [pendingVotes, dateVotes, participantId]);

  const confirmAvailability = async () => {
    if (!participantId || pendingCount === 0) return;

    setIsSaving(true);
    try {
      const promises = Array.from(pendingVotes.entries()).map(async ([dateOptionId, vote]) => {
        const existing = dateVotes.find(
          v => v.date_option_id === dateOptionId && v.participant_id === participantId
        );

        if (existing) {
          const { error } = await supabase
            .from('date_votes')
            .update({ vote })
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('date_votes')
            .insert({
              date_option_id: dateOptionId,
              participant_id: participantId,
              vote,
            });
          if (error) throw error;
        }
      });

      await Promise.all(promises);
      setPendingVotes(new Map());
      toast({ title: t.eventPage.dateVoting.saved });
      onVote?.();
    } catch (err) {
      console.error('Error saving votes:', err);
      toast({
        title: t.eventPage.dateVoting.voteError,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetChanges = () => {
    setPendingVotes(new Map());
  };

  const formatDateOption = (option: DateOption) => {
    const start = format(new Date(option.start_date), 'EEE d MMM', { locale: dateLocale });
    if (option.end_date && option.end_date !== option.start_date) {
      const end = format(new Date(option.end_date), 'EEE d MMM', { locale: dateLocale });
      return `${start} - ${end}`;
    }
    return start;
  };

  // Sort by yes votes to show best dates first
  const sortedOptions = [...dateOptions].sort((a, b) => {
    const aYes = getVoteCounts(a.id).yes;
    const bYes = getVoteCounts(b.id).yes;
    return bYes - aYes;
  });

  const bestOption = sortedOptions[0];
  const bestYesCount = bestOption ? getVoteCounts(bestOption.id).yes : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t.eventPage.dateVoting.title}</span>
          {bestYesCount > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              {t.eventPage.dateVoting.bestDate}: {formatDateOption(bestOption)}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {dateOptions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            {t.eventPage.dateVoting.noDates}
          </p>
        ) : (
          <>
            {dateOptions.map(option => {
              const counts = getVoteCounts(option.id);
              const currentVote = getDisplayVote(option.id);
              const hasPending = isPending(option.id);
              const totalVotes = counts.yes + counts.no + counts.maybe;
              const yesPercentage = totalVotes > 0 ? (counts.yes / participantsCount) * 100 : 0;
              const isBest = bestYesCount > 0 && counts.yes === bestYesCount;

              return (
                <div 
                  key={option.id} 
                  className={cn(
                    "p-4 rounded-lg border transition-colors",
                    isBest && "border-primary bg-primary/5",
                    hasPending && "border-dashed border-amber-500 bg-amber-50/50 dark:bg-amber-950/20"
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={cn("font-medium", isBest && "text-primary")}>
                          {formatDateOption(option)}
                        </p>
                        {hasPending && (
                          <span className="text-xs text-amber-600 bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">
                            {t.eventPage.dateVoting.pendingChange}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Check className="h-3 w-3 text-green-600" />
                          {counts.yes}
                        </span>
                        <span className="flex items-center gap-1">
                          <HelpCircle className="h-3 w-3 text-yellow-600" />
                          {counts.maybe}
                        </span>
                        <span className="flex items-center gap-1">
                          <X className="h-3 w-3 text-red-600" />
                          {counts.no}
                        </span>
                      </div>
                      <Progress value={yesPercentage} className="mt-2 h-2" />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={currentVote === 'yes' ? 'default' : 'outline'}
                        className={cn(
                          currentVote === 'yes' && 'bg-green-600 hover:bg-green-700'
                        )}
                        onClick={() => handleVoteChange(option.id, 'yes')}
                        disabled={!participantId || isSaving}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={currentVote === 'maybe' ? 'default' : 'outline'}
                        className={cn(
                          currentVote === 'maybe' && 'bg-yellow-600 hover:bg-yellow-700'
                        )}
                        onClick={() => handleVoteChange(option.id, 'maybe')}
                        disabled={!participantId || isSaving}
                      >
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={currentVote === 'no' ? 'default' : 'outline'}
                        className={cn(
                          currentVote === 'no' && 'bg-red-600 hover:bg-red-700'
                        )}
                        onClick={() => handleVoteChange(option.id, 'no')}
                        disabled={!participantId || isSaving}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {pendingCount > 0 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  {t.eventPage.dateVoting.unsavedChanges.replace('{count}', String(pendingCount))}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={resetChanges} disabled={isSaving}>
                    {t.eventPage.dateVoting.reset}
                  </Button>
                  <Button size="sm" onClick={confirmAvailability} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t.eventPage.dateVoting.saving}
                      </>
                    ) : (
                      t.eventPage.dateVoting.confirmAvailability
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};