import { Sun, Moon, Sunset, Coffee, Zap, Heart, Briefcase, Ban, Lock, Vote } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { useLanguage } from '@/i18n/LanguageContext';
import { ConstraintBadge, SpecialTraitBadge, MidpointInfo } from './ConstraintBadge';
import { DateAvailabilityPicker, type DateOption, type DateVote } from './DateAvailabilityPicker';
import { MatchedSparkBadge } from './MatchedSparkBadge';
import { AccommodationCard, type AccommodationInfo } from './AccommodationCard';
import { BudgetBadge, type BudgetInfo } from './BudgetBadge';
import { LocationJustification, type LocationInfo } from './LocationJustification';
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

interface MatchedSpark {
  id: string;
  text: string;
  participantName?: string;
}

interface ScenarioCardProps {
  scenario: {
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
      accommodation?: AccommodationInfo;
      budget?: BudgetInfo;
      location?: LocationInfo;
    } | null;
  };
  rank?: number;
  isDealbreaker?: boolean;
  onRankChange?: (rank: number | null) => void;
  onDealbreakerToggle?: () => void;
  isVotingEnabled?: boolean;
  showRanking?: boolean;
  dateOptions?: DateOption[];
  dateVotes?: DateVote[];
  participantId?: string;
  onDateVoteChange?: () => void;
  matchedSparks?: MatchedSpark[];
}

const timeIcons = {
  morning: { icon: Sun, label: '🌅 Morning', color: 'text-amber-500' },
  afternoon: { icon: Sunset, label: '☀️ Afternoon', color: 'text-orange-500' },
  evening: { icon: Moon, label: '🌙 Evening', color: 'text-indigo-500' },
};

const vibeIcons = {
  casual: { icon: Coffee, label: 'Casual', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  active: { icon: Zap, label: 'Active', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  relaxed: { icon: Heart, label: 'Relaxed', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  formal: { icon: Briefcase, label: 'Formal', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
};

export const ScenarioCard = ({
  scenario,
  rank,
  isDealbreaker,
  onRankChange,
  onDealbreakerToggle,
  isVotingEnabled = true,
  showRanking = true,
  dateOptions = [],
  dateVotes = [],
  participantId,
  onDateVoteChange,
  matchedSparks = [],
}: ScenarioCardProps) => {
  const { language } = useLanguage();
  const time = scenario.suggested_time_of_day as keyof typeof timeIcons;
  const vibe = scenario.suggested_vibe as keyof typeof vibeIcons;
  const TimeIcon = time ? timeIcons[time]?.icon : null;
  const VibeConfig = vibe ? vibeIcons[vibe] : null;

  const formattedDate = scenario.suggested_date
    ? format(parseISO(scenario.suggested_date), language === 'fr' ? 'EEEE d MMMM' : 'EEEE, MMMM d')
    : null;

  // Extract metadata for context-aware display
  const metadata = scenario.metadata as {
    constraints_applied?: ConstraintsApplied;
    special_traits?: SpecialTrait[];
    midpoint_info?: MidpointInfoData;
    date_is_flexible?: boolean;
    accommodation?: AccommodationInfo;
    budget?: BudgetInfo;
    location?: LocationInfo;
  } | null;
  
  const constraintsApplied = metadata?.constraints_applied;
  const specialTraits = metadata?.special_traits || [];
  const midpointInfo = metadata?.midpoint_info;
  const dateIsFlexible = metadata?.date_is_flexible;
  const accommodation = metadata?.accommodation;
  const budget = metadata?.budget;
  const locationInfo = metadata?.location;

  const isDateLocked = constraintsApplied?.date_locked;
  const isTimeLocked = constraintsApplied?.time_locked;

  // Determine if we should show date picker vs static badge
  const showDatePicker = !isDateLocked && dateIsFlexible && dateOptions.length > 0;

  return (
    <Card
      className={cn(
        'relative transition-all duration-300',
        isDealbreaker && 'opacity-60 border-destructive bg-destructive/5',
        rank === 1 && !isDealbreaker && 'ring-2 ring-primary border-primary',
        rank === 2 && !isDealbreaker && 'ring-1 ring-primary/50',
        // Slightly taller when showing date picker
        showDatePicker && 'min-h-[380px]'
      )}
    >
      {/* Rank badge */}
      {rank && !isDealbreaker && (
        <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md">
          {rank}
        </div>
      )}

      {/* Dealbreaker overlay */}
      {isDealbreaker && (
        <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md">
          <Ban className="w-4 h-4" />
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Badge variant="outline" className="mb-2">
              {scenario.scenario_label}
            </Badge>
            <CardTitle className="text-lg">{scenario.title}</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {scenario.description && (
          <p className="text-sm text-muted-foreground">{scenario.description}</p>
        )}

        {/* Date section - either static badge or interactive picker */}
        {showDatePicker ? (
          <DateAvailabilityPicker
            dateOptions={dateOptions}
            scenarioId={scenario.id}
            participantId={participantId}
            existingVotes={dateVotes}
            onVoteChange={onDateVoteChange}
            disabled={!isVotingEnabled}
          />
        ) : (
          /* Static Date/Time/Vibe badges with lock indicators */
          <div className="flex flex-wrap gap-2">
            {formattedDate && (
              <Badge 
                variant={isDateLocked ? "default" : "secondary"} 
                className={cn(
                  "capitalize gap-1",
                  isDateLocked && "bg-primary text-primary-foreground"
                )}
              >
                {isDateLocked && <Lock className="h-3 w-3" />}
                📅 {formattedDate}
              </Badge>
            )}
            {TimeIcon && (
              <Badge 
                variant={isTimeLocked ? "default" : "secondary"} 
                className={cn(
                  timeIcons[time].color,
                  isTimeLocked && "bg-primary text-primary-foreground"
                )}
              >
                {isTimeLocked && <Lock className="h-3 w-3 mr-1" />}
                {timeIcons[time].label}
              </Badge>
            )}
            {VibeConfig && (
              <Badge className={VibeConfig.color}>
                {VibeConfig.label}
              </Badge>
            )}
          </div>
        )}

        {/* Time/Vibe badges when date picker is shown */}
        {showDatePicker && (TimeIcon || VibeConfig) && (
          <div className="flex flex-wrap gap-2">
            {TimeIcon && (
              <Badge 
                variant={isTimeLocked ? "default" : "secondary"} 
                className={cn(
                  timeIcons[time].color,
                  isTimeLocked && "bg-primary text-primary-foreground"
                )}
              >
                {isTimeLocked && <Lock className="h-3 w-3 mr-1" />}
                {timeIcons[time].label}
              </Badge>
            )}
            {VibeConfig && (
              <Badge className={VibeConfig.color}>
                {VibeConfig.label}
              </Badge>
            )}
          </div>
        )}

        {/* Location justification for region-to-town specificity */}
        {locationInfo?.townName && locationInfo?.justification && (
          <LocationJustification location={locationInfo} />
        )}

        {/* Budget badge */}
        {budget?.total_weekend && (
          <BudgetBadge budget={budget} showDetails />
        )}

        {/* Special traits (kid-friendly, accessibility, etc.) */}
        {specialTraits.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {specialTraits.map((trait, idx) => (
              <SpecialTraitBadge
                key={idx}
                type={trait.type}
                label={trait.label}
                description={trait.description}
              />
            ))}
          </div>
        )}

        {/* Midpoint info for multi-origin events */}
        {midpointInfo?.suggested_location && (
          <MidpointInfo
            suggestedLocation={midpointInfo.suggested_location}
            travelLogic={midpointInfo.travel_logic || ''}
          />
        )}

        {/* Accommodation section with booking deep-links */}
        {accommodation && (
          <AccommodationCard 
            accommodation={accommodation}
            vibe={vibe}
            budget={budget}
          />
        )}

        {/* Matched sparks badge - "I've been heard" visual */}
        {matchedSparks.length > 0 && (
          <MatchedSparkBadge matchedSparks={matchedSparks} />
        )}

        {/* Ranking buttons - fixed to bottom on mobile for thumb access */}
        {showRanking && isVotingEnabled && (
          <div className="space-y-3 pt-2 border-t md:relative md:bottom-auto md:left-auto md:right-auto md:bg-transparent md:p-0 md:border-t md:shadow-none fixed bottom-0 left-0 right-0 bg-card p-4 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
            <div className="flex gap-2">
              {[1, 2, 3].map((r) => (
                <Button
                  key={r}
                  variant={rank === r ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onRankChange?.(rank === r ? null : r)}
                  className="flex-1 h-11 md:h-9 text-base md:text-sm"
                  disabled={isDealbreaker}
                >
                  {r === 1 ? '1st' : r === 2 ? '2nd' : '3rd'}
                </Button>
              ))}
            </div>

            <Button
              variant={isDealbreaker ? 'destructive' : 'ghost'}
              size="sm"
              onClick={onDealbreakerToggle}
              className="w-full text-base md:text-sm h-11 md:h-9"
            >
              <Ban className="mr-2 h-4 w-4" />
              {isDealbreaker ? 'Remove veto' : '🚫 Veto this option'}
            </Button>
          </div>
        )}
        
        {/* Spacer for fixed mobile buttons */}
        {showRanking && isVotingEnabled && (
          <div className="h-28 md:hidden" aria-hidden="true" />
        )}
      </CardContent>
    </Card>
  );
};