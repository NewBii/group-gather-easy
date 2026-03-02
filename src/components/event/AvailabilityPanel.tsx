import { useState, useEffect } from 'react';
import { Calendar, Check, HelpCircle, X, Users, Loader2, Sun } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type Availability = 'available' | 'maybe' | 'unavailable' | null;

interface CandidateDate {
  id: string;
  suggested_date: string;
  is_long_weekend?: boolean;
  holiday_name?: string;
}

interface DateAvailabilityVote {
  date_id: string;
  availability: Availability;
}

interface AvailabilityPanelProps {
  eventId: string;
  participantId?: string;
  disabled?: boolean;
}

const availabilityConfig = {
  available: {
    icon: Check,
    activeClass: 'bg-green-500 text-white border-green-500',
    inactiveClass: 'hover:bg-green-100 hover:border-green-300 dark:hover:bg-green-900/30',
  },
  maybe: {
    icon: HelpCircle,
    activeClass: 'bg-amber-500 text-white border-amber-500',
    inactiveClass: 'hover:bg-amber-100 hover:border-amber-300 dark:hover:bg-amber-900/30',
  },
  unavailable: {
    icon: X,
    activeClass: 'bg-red-500 text-white border-red-500',
    inactiveClass: 'hover:bg-red-100 hover:border-red-300 dark:hover:bg-red-900/30',
  },
};

export const AvailabilityPanel = ({
  eventId,
  participantId,
  disabled = false,
}: AvailabilityPanelProps) => {
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const [candidateDates, setCandidateDates] = useState<CandidateDate[]>([]);
  const [votes, setVotes] = useState<Record<string, Availability>>({});
  const [groupVotes, setGroupVotes] = useState<Record<string, { available: number; maybe: number; unavailable: number }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load candidate dates for this event
  useEffect(() => {
    const loadDates = async () => {
      const { data, error } = await supabase
        .from('event_candidate_dates')
        .select('*')
        .eq('event_id', eventId)
        .order('suggested_date', { ascending: true });

      if (error) {
        console.error('Error loading candidate dates:', error);
      } else {
        setCandidateDates(data || []);
      }
      setLoading(false);
    };

    loadDates();
  }, [eventId]);

  // Load participant's votes
  useEffect(() => {
    if (!participantId) return;

    const loadVotes = async () => {
      const { data, error } = await supabase
        .from('event_date_availability')
        .select('date_id, availability')
        .eq('event_id', eventId)
        .eq('participant_id', participantId);

      if (error) {
        console.error('Error loading votes:', error);
      } else if (data) {
        const voteMap: Record<string, Availability> = {};
        data.forEach((v) => {
          voteMap[v.date_id] = v.availability as Availability;
        });
        setVotes(voteMap);
      }
    };

    loadVotes();
  }, [eventId, participantId]);

  // Load and subscribe to group votes
  useEffect(() => {
    const loadGroupVotes = async () => {
      const { data, error } = await supabase
        .from('event_date_availability')
        .select('date_id, availability')
        .eq('event_id', eventId);

      if (error) {
        console.error('Error loading group votes:', error);
      } else if (data) {
        const groupMap: Record<string, { available: number; maybe: number; unavailable: number }> = {};
        data.forEach((v) => {
          if (!groupMap[v.date_id]) {
            groupMap[v.date_id] = { available: 0, maybe: 0, unavailable: 0 };
          }
          if (v.availability === 'available') groupMap[v.date_id].available++;
          else if (v.availability === 'maybe') groupMap[v.date_id].maybe++;
          else if (v.availability === 'unavailable') groupMap[v.date_id].unavailable++;
        });
        setGroupVotes(groupMap);
      }
    };

    loadGroupVotes();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`availability-${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_date_availability', filter: `event_id=eq.${eventId}` },
        () => loadGroupVotes()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const handleVote = async (dateId: string, availability: Availability) => {
    if (!participantId || disabled) return;

    const currentVote = votes[dateId];
    const newAvailability = currentVote === availability ? null : availability;

    // Optimistic update
    setVotes((prev) => ({
      ...prev,
      [dateId]: newAvailability,
    }));

    setSaving(dateId);

    try {
      if (newAvailability === null) {
        // Delete the vote
        await supabase
          .from('event_date_availability')
          .delete()
          .eq('date_id', dateId)
          .eq('participant_id', participantId);
      } else {
        // Upsert the vote
        const { error } = await supabase
          .from('event_date_availability')
          .upsert({
            event_id: eventId,
            date_id: dateId,
            participant_id: participantId,
            availability: newAvailability,
          }, {
            onConflict: 'date_id,participant_id',
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving vote:', error);
      // Revert optimistic update
      setVotes((prev) => ({
        ...prev,
        [dateId]: currentVote,
      }));
      toast({
        title: 'Error saving vote',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    const locale = language === 'fr' ? fr : enUS;
    return format(date, language === 'fr' ? 'EEE d MMM' : 'EEE, MMM d', { locale });
  };

  // Don't render if no candidate dates
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (candidateDates.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-primary" />
          {language === 'fr' ? 'Vos disponibilités' : 'Your Availability'}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {language === 'fr' ? 'Quand êtes-vous disponible ? Appuyez pour indiquer.' : 'When can you join? Tap to mark your availability.'}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2">
          {candidateDates.map((dateOption) => {
            const currentVote = votes[dateOption.id];
            const group = groupVotes[dateOption.id] || { available: 0, maybe: 0, unavailable: 0 };
            const totalVotes = group.available + group.maybe + group.unavailable;
            const isSaving = saving === dateOption.id;

            return (
              <div
                key={dateOption.id}
                className={cn(
                  'flex items-center justify-between gap-3 p-3 rounded-lg border bg-background',
                  dateOption.is_long_weekend && 'ring-1 ring-amber-400/50'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {formatDate(dateOption.suggested_date)}
                    </span>
                    {dateOption.is_long_weekend && (
                      <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-border rounded-full px-2 py-0.5">
                        <Sun className="h-3 w-3 mr-1" />
                        {language === 'fr' ? 'Week-end prolongé' : 'Long weekend'}
                      </Badge>
                    )}
                  </div>
                  {dateOption.holiday_name && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {dateOption.holiday_name}
                    </p>
                  )}
                  {totalVotes > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span className="text-green-600 dark:text-green-400">{group.available}✓</span>
                      <span className="text-amber-600 dark:text-amber-400">{group.maybe}?</span>
                      <span className="text-red-600 dark:text-red-400">{group.unavailable}✗</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-1">
                  {(['available', 'maybe', 'unavailable'] as const).map((avail) => {
                    const config = availabilityConfig[avail];
                    const Icon = config.icon;
                    const isActive = currentVote === avail;

                    return (
                      <Button
                        key={avail}
                        variant="outline"
                        size="sm"
                        onClick={() => handleVote(dateOption.id, avail)}
                        disabled={!participantId || disabled || isSaving}
                        className={cn(
                          'h-11 w-11 p-0 transition-all',
                          isActive ? config.activeClass : config.inactiveClass
                        )}
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 pt-2 border-t text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3 text-green-500" />
            {language === 'fr' ? 'Disponible' : 'Available'}
          </span>
          <span className="flex items-center gap-1">
            <HelpCircle className="h-3 w-3 text-amber-500" />
            {language === 'fr' ? 'Peut-être' : 'Maybe'}
          </span>
          <span className="flex items-center gap-1">
            <X className="h-3 w-3 text-red-500" />
            {language === 'fr' ? 'Indisponible' : 'Unavailable'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
