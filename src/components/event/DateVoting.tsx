import { useState } from 'react';
import { Check, X, HelpCircle } from 'lucide-react';
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
}

type VoteType = 'yes' | 'no' | 'maybe';

export const DateVoting = ({ dateOptions, dateVotes, participantId, participantsCount }: DateVotingProps) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [voting, setVoting] = useState<string | null>(null);
  const dateLocale = language === 'fr' ? fr : enUS;

  const getVoteCounts = (dateOptionId: string) => {
    const votes = dateVotes.filter(v => v.date_option_id === dateOptionId);
    return {
      yes: votes.filter(v => v.vote === 'yes').length,
      no: votes.filter(v => v.vote === 'no').length,
      maybe: votes.filter(v => v.vote === 'maybe').length,
    };
  };

  const getCurrentVote = (dateOptionId: string): VoteType | null => {
    if (!participantId) return null;
    const vote = dateVotes.find(v => v.date_option_id === dateOptionId && v.participant_id === participantId);
    return vote?.vote || null;
  };

  const handleVote = async (dateOptionId: string, vote: VoteType) => {
    if (!participantId) {
      toast({
        title: t.eventPage.dateVoting.joinFirst,
        variant: 'destructive',
      });
      return;
    }

    setVoting(dateOptionId);

    try {
      const existingVote = dateVotes.find(
        v => v.date_option_id === dateOptionId && v.participant_id === participantId
      );

      if (existingVote) {
        // Update existing vote
        const { error } = await supabase
          .from('date_votes')
          .update({ vote })
          .eq('id', existingVote.id);

        if (error) throw error;
      } else {
        // Insert new vote
        const { error } = await supabase
          .from('date_votes')
          .insert({
            date_option_id: dateOptionId,
            participant_id: participantId,
            vote,
          });

        if (error) throw error;
      }
    } catch (err) {
      console.error('Error voting:', err);
      toast({
        title: t.eventPage.dateVoting.voteError,
        variant: 'destructive',
      });
    } finally {
      setVoting(null);
    }
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
          dateOptions.map(option => {
            const counts = getVoteCounts(option.id);
            const currentVote = getCurrentVote(option.id);
            const totalVotes = counts.yes + counts.no + counts.maybe;
            const yesPercentage = totalVotes > 0 ? (counts.yes / participantsCount) * 100 : 0;
            const isBest = bestYesCount > 0 && counts.yes === bestYesCount;

            return (
              <div 
                key={option.id} 
                className={cn(
                  "p-4 rounded-lg border transition-colors",
                  isBest && "border-primary bg-primary/5"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className={cn("font-medium", isBest && "text-primary")}>
                      {formatDateOption(option)}
                    </p>
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
                      onClick={() => handleVote(option.id, 'yes')}
                      disabled={voting === option.id || !participantId}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={currentVote === 'maybe' ? 'default' : 'outline'}
                      className={cn(
                        currentVote === 'maybe' && 'bg-yellow-600 hover:bg-yellow-700'
                      )}
                      onClick={() => handleVote(option.id, 'maybe')}
                      disabled={voting === option.id || !participantId}
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={currentVote === 'no' ? 'default' : 'outline'}
                      className={cn(
                        currentVote === 'no' && 'bg-red-600 hover:bg-red-700'
                      )}
                      onClick={() => handleVote(option.id, 'no')}
                      disabled={voting === option.id || !participantId}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
