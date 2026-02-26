import { Ban, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';

interface SpecialTrait {
  type: string;
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

interface BudgetInfo {
  total_weekend?: number;
  per_person?: number;
  [key: string]: any;
}

interface LocationInfo {
  townName?: string;
  justification?: string;
  [key: string]: any;
}

interface AccommodationInfo {
  name?: string;
  booking_url?: string;
  airbnb_url?: string;
  [key: string]: any;
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
  matchedSparks?: MatchedSpark[];
}

const vibeLabels: Record<string, Record<string, string>> = {
  fr: { casual: 'Décontracté', active: 'Dynamique', relaxed: 'Détente', formal: 'Formel' },
  en: { casual: 'Casual', active: 'Active', relaxed: 'Relaxed', formal: 'Formal' },
};

const vibeEmojis: Record<string, string> = {
  casual: '☕',
  active: '⚡',
  relaxed: '💆',
  formal: '👔',
};

export const ScenarioCard = ({
  scenario,
  rank,
  isDealbreaker,
  onRankChange,
  onDealbreakerToggle,
  isVotingEnabled = true,
  showRanking = true,
}: ScenarioCardProps) => {
  const { language } = useLanguage();
  const lang = language === 'fr' ? 'fr' : 'en';

  const metadata = scenario.metadata as ScenarioCardProps['scenario']['metadata'];
  const budget = metadata?.budget;
  const locationInfo = metadata?.location;
  const accommodation = metadata?.accommodation;
  const vibe = scenario.suggested_vibe;

  const rankLabels = language === 'fr'
    ? ['1er choix', '2ème choix', '3ème choix']
    : ['1st choice', '2nd choice', '3rd choice'];

  // Build compact info chips
  const infoChips: string[] = [];
  if (locationInfo?.townName) {
    infoChips.push(`📍 ${locationInfo.townName}`);
  }
  if (budget?.per_person) {
    infoChips.push(`💶 ~€${budget.per_person}/pers.`);
  } else if (budget?.total_weekend) {
    infoChips.push(`💶 ~€${budget.total_weekend}`);
  }
  if (vibe && vibeEmojis[vibe]) {
    infoChips.push(`${vibeEmojis[vibe]} ${vibeLabels[lang]?.[vibe] || vibe}`);
  }

  // Build booking links
  const bookingUrl = accommodation?.booking_url;
  const airbnbUrl = accommodation?.airbnb_url;
  const hasBookingLinks = bookingUrl || airbnbUrl;

  return (
    <Card
      className={cn(
        'relative transition-all duration-200',
        isDealbreaker && 'opacity-50 border-destructive bg-destructive/5',
        rank === 1 && !isDealbreaker && 'ring-2 ring-primary border-primary',
        rank === 2 && !isDealbreaker && 'ring-1 ring-primary/50',
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
        <Badge variant="outline" className="mb-1.5 w-fit">
          {scenario.scenario_label}
        </Badge>
        <CardTitle className="text-lg leading-snug">{scenario.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* One-line description */}
        {scenario.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{scenario.description}</p>
        )}

        {/* Compact info row */}
        {infoChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {infoChips.map((chip, i) => (
              <span key={i}>{chip}</span>
            ))}
          </div>
        )}

        {/* Vote buttons */}
        {showRanking && isVotingEnabled && (
          <div className="space-y-2 pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              {language === 'fr' ? 'Votre classement personnel :' : 'Your personal ranking:'}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((r) => (
                <Button
                  key={r}
                  variant="outline"
                  onClick={() => onRankChange?.(rank === r ? null : r)}
                  disabled={isDealbreaker}
                  className={cn(
                    'min-h-[48px] rounded-lg border-2 text-base font-semibold transition-all',
                    rank === r
                      ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                      : 'border-border bg-background hover:bg-muted'
                  )}
                >
                  {rankLabels[r - 1]}
                </Button>
              ))}
            </div>

            {/* Veto button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDealbreakerToggle}
                    className={cn(
                      'w-full text-sm',
                      isDealbreaker
                        ? 'text-destructive hover:text-destructive'
                        : 'text-destructive/70 hover:text-destructive'
                    )}
                  >
                    {isDealbreaker
                      ? (language === 'fr' ? '↩ Retirer le veto' : '↩ Remove veto')
                      : (language === 'fr' ? '🚫 Refuser cette option' : '🚫 Veto this option')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[260px] text-center">
                  <p className="text-xs">
                    {language === 'fr'
                      ? 'Les options avec un veto sont fortement pénalisées dans le calcul final.'
                      : 'Options with a veto are heavily penalized in the final calculation.'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Booking/Airbnb links */}
        {hasBookingLinks && (
          <div className="space-y-1.5 pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {language === 'fr' ? "Explorer l'hébergement :" : 'Explore accommodation:'}
            </p>
            <div className="flex gap-2">
              {bookingUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  asChild
                >
                  <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
                    Booking.com
                    <ExternalLink className="ml-1.5 h-3 w-3" />
                  </a>
                </Button>
              )}
              {airbnbUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  asChild
                >
                  <a href={airbnbUrl} target="_blank" rel="noopener noreferrer">
                    Airbnb
                    <ExternalLink className="ml-1.5 h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
