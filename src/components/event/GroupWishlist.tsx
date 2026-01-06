import { useState, useEffect } from 'react';
import { Sparkles, Check, RefreshCw, Loader2, AlertCircle, Target, Gift, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

type SparkCategory = 'must_have' | 'nice_to_have' | 'dealbreaker';

interface ParticipantSpark {
  id: string;
  spark_text: string;
  category: SparkCategory;
  is_integrated: boolean;
  integration_note?: string;
  created_at: string;
  participant_id: string;
  participant_name?: string;
}

interface GroupWishlistProps {
  eventId: string;
  isOrganizer?: boolean;
  onRegenerateScenarios?: () => void;
  isRegenerating?: boolean;
  currentParticipantId?: string;
}

const categoryConfig: Record<SparkCategory, { icon: React.ElementType; label: string; labelFr: string; color: string }> = {
  must_have: {
    icon: Target,
    label: 'Must-Haves',
    labelFr: 'Indispensables',
    color: 'text-red-600 dark:text-red-400',
  },
  nice_to_have: {
    icon: Gift,
    label: 'Nice-to-Haves',
    labelFr: 'Bonus',
    color: 'text-blue-600 dark:text-blue-400',
  },
  dealbreaker: {
    icon: XCircle,
    label: 'Dealbreakers',
    labelFr: 'Rédhibitoires',
    color: 'text-amber-600 dark:text-amber-400',
  },
};

export const GroupWishlist = ({
  eventId,
  isOrganizer,
  onRegenerateScenarios,
  isRegenerating,
  currentParticipantId,
}: GroupWishlistProps) => {
  const { language } = useLanguage();
  const [sparks, setSparks] = useState<ParticipantSpark[]>([]);
  const [loading, setLoading] = useState(true);

  const t = {
    title: language === 'fr' ? 'Liste de souhaits' : 'Group Wishlist',
    empty: language === 'fr' ? 'Aucun souhait ajouté' : 'No requirements added yet',
    updateScenarios: language === 'fr' ? 'Mettre à jour les scénarios' : 'Update Scenarios',
    updating: language === 'fr' ? 'Mise à jour...' : 'Updating...',
    integrated: language === 'fr' ? 'Intégré' : 'Integrated',
    you: language === 'fr' ? 'vous' : 'you',
    ago: language === 'fr' ? '' : 'ago',
    newSparks: language === 'fr' ? 'Nouveaux souhaits à intégrer' : 'New wishes to integrate',
  };

  useEffect(() => {
    const fetchSparks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('participant_sparks')
        .select(`
          id,
          spark_text,
          category,
          is_integrated,
          integration_note,
          created_at,
          participant_id,
          participants!inner(name)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setSparks(
          data.map((s: any) => ({
            ...s,
            participant_name: s.participants?.name,
          }))
        );
      }
      setLoading(false);
    };

    fetchSparks();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('sparks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participant_sparks', filter: `event_id=eq.${eventId}` },
        () => fetchSparks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const unintegratedCount = sparks.filter((s) => !s.is_integrated).length;

  // Group sparks by category
  const groupedSparks = sparks.reduce(
    (acc, spark) => {
      acc[spark.category].push(spark);
      return acc;
    },
    { must_have: [], nice_to_have: [], dealbreaker: [] } as Record<SparkCategory, ParticipantSpark[]>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {t.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Update button for organizers */}
        {isOrganizer && unintegratedCount > 0 && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-primary" />
              <span className="font-medium">
                {unintegratedCount} {t.newSparks}
              </span>
            </div>
            <Button
              onClick={onRegenerateScenarios}
              disabled={isRegenerating}
              size="sm"
              className="w-full"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t.updating}
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t.updateScenarios}
                </>
              )}
            </Button>
          </div>
        )}

        {sparks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t.empty}</p>
        ) : (
          <ScrollArea className="h-[300px] pr-2">
            <div className="space-y-4">
              {(Object.keys(categoryConfig) as SparkCategory[]).map((cat) => {
                const catSparks = groupedSparks[cat];
                if (catSparks.length === 0) return null;

                const config = categoryConfig[cat];
                const Icon = config.icon;

                return (
                  <div key={cat} className="space-y-2">
                    <div className={cn('flex items-center gap-2 text-sm font-medium', config.color)}>
                      <Icon className="h-4 w-4" />
                      {language === 'fr' ? config.labelFr : config.label}
                      <Badge variant="secondary" className="text-xs">
                        {catSparks.length}
                      </Badge>
                    </div>

                    <div className="space-y-2 ml-6">
                      {catSparks.map((spark) => (
                        <div
                          key={spark.id}
                          className={cn(
                            'p-2 rounded-lg text-sm',
                            spark.is_integrated
                              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                              : 'bg-muted/50'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="flex-1">{spark.spark_text}</p>
                            {spark.is_integrated && (
                              <Check className="h-4 w-4 text-green-600 shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>
                              {spark.participant_id === currentParticipantId
                                ? t.you
                                : spark.participant_name}
                            </span>
                            <span>•</span>
                            <span>
                              {formatDistanceToNow(new Date(spark.created_at), {
                                addSuffix: true,
                                locale: language === 'fr' ? fr : undefined,
                              })}
                            </span>
                          </div>
                          {spark.is_integrated && spark.integration_note && (
                            <p className="text-xs text-green-700 dark:text-green-400 mt-1 italic">
                              ✨ {spark.integration_note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
