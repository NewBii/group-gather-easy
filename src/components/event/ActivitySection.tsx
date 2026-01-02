import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, X, HelpCircle, Plus, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { Activity, ActivityVote } from '@/hooks/useEventData';

const activitySchema = z.object({
  name: z.string().min(1, 'Activity name is required').max(100),
  description: z.string().max(300).optional(),
});

type ActivityFormValues = z.infer<typeof activitySchema>;

interface ActivitySectionProps {
  eventId: string;
  activities: Activity[];
  activityVotes: ActivityVote[];
  participantId: string | undefined;
  participantsCount: number;
}

type VoteType = 'yes' | 'no' | 'maybe';

export const ActivitySection = ({ 
  eventId, 
  activities, 
  activityVotes, 
  participantId,
  participantsCount 
}: ActivitySectionProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingVotes, setPendingVotes] = useState<Map<string, VoteType>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const getVoteCounts = (activityId: string) => {
    const votes = activityVotes.filter(v => v.activity_id === activityId);
    return {
      yes: votes.filter(v => v.vote === 'yes').length,
      no: votes.filter(v => v.vote === 'no').length,
      maybe: votes.filter(v => v.vote === 'maybe').length,
    };
  };

  const getSavedVote = (activityId: string): VoteType | null => {
    if (!participantId) return null;
    const vote = activityVotes.find(v => v.activity_id === activityId && v.participant_id === participantId);
    return vote?.vote || null;
  };

  const getDisplayVote = (activityId: string): VoteType | null => {
    return pendingVotes.get(activityId) ?? getSavedVote(activityId);
  };

  const isPending = (activityId: string): boolean => {
    const pending = pendingVotes.get(activityId);
    const saved = getSavedVote(activityId);
    return pending !== undefined && pending !== saved;
  };

  const handleVoteChange = (activityId: string, vote: VoteType) => {
    if (!participantId) {
      toast({
        title: t.eventPage.activities.joinFirst,
        variant: 'destructive',
      });
      return;
    }

    setPendingVotes(prev => {
      const next = new Map(prev);
      const saved = getSavedVote(activityId);
      if (vote === saved) {
        next.delete(activityId);
      } else {
        next.set(activityId, vote);
      }
      return next;
    });
  };

  const pendingCount = useMemo(() => {
    return Array.from(pendingVotes.entries()).filter(([id, vote]) => {
      const saved = getSavedVote(id);
      return vote !== saved;
    }).length;
  }, [pendingVotes, activityVotes, participantId]);

  const confirmVotes = async () => {
    if (!participantId || pendingCount === 0) return;

    setIsSaving(true);
    try {
      const promises = Array.from(pendingVotes.entries()).map(async ([activityId, vote]) => {
        const existing = activityVotes.find(
          v => v.activity_id === activityId && v.participant_id === participantId
        );

        if (existing) {
          const { error } = await supabase
            .from('activity_votes')
            .update({ vote })
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('activity_votes')
            .insert({
              activity_id: activityId,
              participant_id: participantId,
              vote,
            });
          if (error) throw error;
        }
      });

      await Promise.all(promises);
      setPendingVotes(new Map());
      toast({ title: t.eventPage.activities.saved });
    } catch (err) {
      console.error('Error saving votes:', err);
      toast({
        title: t.eventPage.activities.voteError,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetChanges = () => {
    setPendingVotes(new Map());
  };

  const handleAddActivity = async (values: ActivityFormValues) => {
    if (!participantId) {
      toast({
        title: t.eventPage.activities.joinFirst,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('activities')
        .insert({
          event_id: eventId,
          name: values.name.trim(),
          description: values.description?.trim() || null,
          suggested_by: participantId,
        });

      if (error) throw error;

      form.reset();
      setIsAdding(false);
      toast({
        title: t.eventPage.activities.addSuccess,
      });
    } catch (err) {
      console.error('Error adding activity:', err);
      toast({
        title: t.eventPage.activities.addError,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sort by yes votes
  const sortedActivities = [...activities].sort((a, b) => {
    const aYes = getVoteCounts(a.id).yes;
    const bYes = getVoteCounts(b.id).yes;
    return bYes - aYes;
  });

  const bestActivity = sortedActivities[0];
  const bestYesCount = bestActivity ? getVoteCounts(bestActivity.id).yes : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <span>{t.eventPage.activities.title}</span>
          </div>
          {!isAdding && participantId && (
            <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t.eventPage.activities.addNew}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <div className="p-4 rounded-lg border bg-muted/50">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddActivity)} className="space-y-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          placeholder={t.eventPage.activities.namePlaceholder} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          placeholder={t.eventPage.activities.descriptionPlaceholder} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={isSubmitting}>
                    {t.eventPage.activities.add}
                  </Button>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => {
                      setIsAdding(false);
                      form.reset();
                    }}
                  >
                    {t.common.cancel}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}

        {activities.length === 0 && !isAdding ? (
          <p className="text-muted-foreground text-center py-4">
            {t.eventPage.activities.noActivities}
          </p>
        ) : (
          <>
            {sortedActivities.map(activity => {
              const counts = getVoteCounts(activity.id);
              const currentVote = getDisplayVote(activity.id);
              const hasPending = isPending(activity.id);
              const isBest = bestYesCount > 0 && counts.yes === bestYesCount;

              return (
                <div 
                  key={activity.id} 
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
                          {activity.name}
                        </p>
                        {hasPending && (
                          <span className="text-xs text-amber-600 bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">
                            {t.eventPage.activities.pendingChange}
                          </span>
                        )}
                      </div>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                      )}
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
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={currentVote === 'yes' ? 'default' : 'outline'}
                        className={cn(
                          currentVote === 'yes' && 'bg-green-600 hover:bg-green-700'
                        )}
                        onClick={() => handleVoteChange(activity.id, 'yes')}
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
                        onClick={() => handleVoteChange(activity.id, 'maybe')}
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
                        onClick={() => handleVoteChange(activity.id, 'no')}
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
                  {t.eventPage.activities.unsavedChanges.replace('{count}', String(pendingCount))}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={resetChanges} disabled={isSaving}>
                    {t.eventPage.activities.reset}
                  </Button>
                  <Button size="sm" onClick={confirmVotes} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t.eventPage.activities.saving}
                      </>
                    ) : (
                      t.eventPage.activities.confirmVotes
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
