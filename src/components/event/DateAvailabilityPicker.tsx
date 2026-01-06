import { useState, useEffect, useCallback } from 'react';
import { Check, HelpCircle, X, Palmtree } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

type Availability = 'available' | 'maybe' | 'unavailable' | null;

export interface DateOption {
  id: string;
  suggested_date: string;
  is_long_weekend: boolean;
  holiday_name: string | null;
}

export interface DateVote {
  date_option_id: string;
  availability: Availability;
}

interface DateAvailabilityPickerProps {
  dateOptions: DateOption[];
  scenarioId: string;
  participantId?: string;
  existingVotes?: DateVote[];
  onVoteChange?: () => void;
  disabled?: boolean;
}

const availabilityConfig = {
  available: {
    icon: Check,
    color: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
    activeColor: 'bg-green-500 text-white border-green-600 dark:bg-green-600',
  },
  maybe: {
    icon: HelpCircle,
    color: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700',
    activeColor: 'bg-orange-500 text-white border-orange-600 dark:bg-orange-600',
  },
  unavailable: {
    icon: X,
    color: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
    activeColor: 'bg-red-500 text-white border-red-600 dark:bg-red-600',
  },
};

export const DateAvailabilityPicker = ({
  dateOptions,
  scenarioId,
  participantId,
  existingVotes = [],
  onVoteChange,
  disabled = false,
}: DateAvailabilityPickerProps) => {
  const { t, language } = useLanguage();
  const [votes, setVotes] = useState<Record<string, Availability>>({});
  const [saving, setSaving] = useState<string | null>(null);

  // Initialize votes from existing data
  useEffect(() => {
    const initialVotes: Record<string, Availability> = {};
    existingVotes.forEach((vote) => {
      initialVotes[vote.date_option_id] = vote.availability;
    });
    setVotes(initialVotes);
  }, [existingVotes]);

  const cycleAvailability = (current: Availability): Availability => {
    const cycle: Availability[] = [null, 'available', 'maybe', 'unavailable'];
    const currentIndex = cycle.indexOf(current);
    return cycle[(currentIndex + 1) % cycle.length];
  };

  const saveVote = useCallback(async (dateOptionId: string, availability: Availability) => {
    if (!participantId) return;

    setSaving(dateOptionId);

    try {
      if (availability === null) {
        // Delete the vote
        await supabase
          .from('scenario_date_votes')
          .delete()
          .eq('date_option_id', dateOptionId)
          .eq('participant_id', participantId);
      } else {
        // Upsert the vote
        await supabase
          .from('scenario_date_votes')
          .upsert(
            {
              scenario_id: scenarioId,
              date_option_id: dateOptionId,
              participant_id: participantId,
              availability,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'date_option_id,participant_id' }
          );
      }

      onVoteChange?.();
    } catch (error) {
      console.error('Error saving date vote:', error);
    } finally {
      setSaving(null);
    }
  }, [participantId, scenarioId, onVoteChange]);

  const handleClick = (dateOptionId: string) => {
    if (disabled || !participantId) return;

    const currentAvailability = votes[dateOptionId] || null;
    const newAvailability = cycleAvailability(currentAvailability);

    setVotes((prev) => ({ ...prev, [dateOptionId]: newAvailability }));
    saveVote(dateOptionId, newAvailability);
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, language === 'fr' ? 'EEEE d MMM' : 'EEE, MMM d', {
      locale: language === 'fr' ? fr : enUS,
    });
  };

  if (dateOptions.length === 0) return null;

  // Access translations safely
  const dateAvailabilityT = t.aiConcierge?.pulse?.dateAvailability;

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground">
        {dateAvailabilityT?.title || 'Choose your availability'}
      </p>

      <div className="flex flex-wrap gap-2">
        {dateOptions.map((option) => {
          const currentVote = votes[option.id] || null;
          const config = currentVote ? availabilityConfig[currentVote] : null;
          const Icon = config?.icon;
          const isSaving = saving === option.id;

          return (
            <button
              key={option.id}
              onClick={() => handleClick(option.id)}
              disabled={disabled || !participantId || isSaving}
              className={cn(
                'relative flex flex-col items-start gap-1 px-3 py-2 rounded-lg border-2 transition-all duration-200',
                'hover:scale-[1.02] active:scale-[0.98]',
                disabled || !participantId
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer',
                currentVote
                  ? config?.activeColor
                  : 'bg-muted/50 border-border hover:border-primary/50'
              )}
            >
              {/* Long Weekend Badge */}
              {option.is_long_weekend && (
                <span className="absolute -top-2 -right-2 flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 rounded-full border border-amber-300 dark:border-amber-700">
                  <Palmtree className="h-3 w-3" />
                  {dateAvailabilityT?.longWeekend || 'Long Weekend'}
                </span>
              )}

              <div className="flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4" />}
                <span className="text-sm font-medium capitalize">
                  {formatDate(option.suggested_date)}
                </span>
              </div>

              {/* Availability hint */}
              {!currentVote && participantId && (
                <span className="text-[10px] text-muted-foreground">
                  {dateAvailabilityT?.tapToVote || 'Tap to vote'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground pt-1">
        <span className="flex items-center gap-1">
          <Check className="h-3 w-3 text-green-500" />
          {dateAvailabilityT?.available || 'Available'}
        </span>
        <span className="flex items-center gap-1">
          <HelpCircle className="h-3 w-3 text-orange-500" />
          {dateAvailabilityT?.maybe || 'Maybe'}
        </span>
        <span className="flex items-center gap-1">
          <X className="h-3 w-3 text-red-500" />
          {dateAvailabilityT?.unavailable || 'Unavailable'}
        </span>
      </div>
    </div>
  );
};
