import { Home, ExternalLink, CheckCircle2, Building2, Tent, Castle, Euro } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';

export interface AccommodationInfo {
  isLocked: boolean;
  lockedName?: string;
  lockedDescription?: string;
  suggestedStyle?: 'eco-lodge' | 'luxury-villa' | 'boutique-hotel' | 'apartment' | 'camping';
  location?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
}

export interface BudgetInfo {
  accommodation_per_night?: number;
  meals_per_day?: number;
  total_weekend?: number;
  budget_tier?: 'budget' | 'moderate' | 'premium';
}

interface AccommodationCardProps {
  accommodation: AccommodationInfo;
  vibe?: 'casual' | 'active' | 'relaxed' | 'formal';
  budget?: BudgetInfo;
  className?: string;
}

const styleIcons = {
  'eco-lodge': { icon: Tent, label: 'Eco-Lodge', description: 'Sustainable & nature-focused' },
  'luxury-villa': { icon: Castle, label: 'Luxury Villa', description: 'Premium private retreat' },
  'boutique-hotel': { icon: Building2, label: 'Boutique Hotel', description: 'Unique & charming stay' },
  'apartment': { icon: Home, label: 'Apartment', description: 'Home-like comfort' },
  'camping': { icon: Tent, label: 'Camping', description: 'Adventure under the stars' },
};

const vibeToStyle: Record<string, AccommodationInfo['suggestedStyle']> = {
  active: 'eco-lodge',
  relaxed: 'luxury-villa',
  casual: 'apartment',
  formal: 'boutique-hotel',
};

const budgetTierColors = {
  budget: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  moderate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  premium: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const budgetTierLabels = {
  budget: '€ Budget',
  moderate: '€€ Moderate',
  premium: '€€€ Premium',
};

const generateBookingUrl = (
  location: string,
  checkIn: string,
  checkOut: string,
  adults: number = 10,
  children: number = 0
): string => {
  const baseUrl = 'https://www.booking.com/searchresults.html';
  const params = new URLSearchParams({
    ss: location,
    checkin: checkIn,
    checkout: checkOut,
    group_adults: adults.toString(),
    group_children: children.toString(),
    no_rooms: Math.ceil((adults + children) / 4).toString(),
  });
  return `${baseUrl}?${params.toString()}`;
};

const generateAirbnbUrl = (
  location: string,
  checkIn: string,
  checkOut: string,
  adults: number = 10,
  children: number = 0
): string => {
  const baseUrl = 'https://www.airbnb.com/s/' + encodeURIComponent(location) + '/homes';
  const params = new URLSearchParams({
    checkin: checkIn,
    checkout: checkOut,
    adults: adults.toString(),
    children: children.toString(),
  });
  return `${baseUrl}?${params.toString()}`;
};

export const AccommodationCard = ({
  accommodation,
  vibe = 'casual',
  budget,
  className,
}: AccommodationCardProps) => {
  const { t } = useLanguage();

  // If locked by organizer, show verified badge
  if (accommodation.isLocked) {
    return (
      <Card className={cn('border-2 border-primary/30 bg-primary/5', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Home className="h-4 w-4 text-primary" />
            <span>Accommodation</span>
            <Badge 
              variant="default" 
              className="ml-auto bg-emerald-500 hover:bg-emerald-600 text-white gap-1"
            >
              <CheckCircle2 className="h-3 w-3" />
              Organizer's Choice
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="font-semibold text-foreground">
            {accommodation.lockedName}
          </p>
          {accommodation.lockedDescription && (
            <p className="text-sm text-muted-foreground">
              {accommodation.lockedDescription}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Dynamic suggestion based on vibe
  const suggestedStyle = accommodation.suggestedStyle || vibeToStyle[vibe] || 'apartment';
  const styleConfig = styleIcons[suggestedStyle];
  const StyleIcon = styleConfig.icon;

  const canGenerateLink = accommodation.location && accommodation.checkIn && accommodation.checkOut;

  return (
    <Card className={cn('border border-border', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <StyleIcon className="h-4 w-4 text-muted-foreground" />
          <span>Suggested Stay</span>
          {budget?.budget_tier && (
            <Badge className={cn('ml-auto text-xs', budgetTierColors[budget.budget_tier])}>
              {budgetTierLabels[budget.budget_tier]}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="font-medium text-foreground">{styleConfig.label}</p>
          <p className="text-sm text-muted-foreground">{styleConfig.description}</p>
        </div>

        {/* Budget breakdown */}
        {budget?.total_weekend && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
            <Euro className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              <span className="font-medium text-foreground">
                ~€{budget.total_weekend}
              </span>
              <span className="text-muted-foreground"> / person / weekend</span>
            </div>
          </div>
        )}

        {/* Booking buttons - deep links */}
        {canGenerateLink && (
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300"
              onClick={() => {
                const url = generateBookingUrl(
                  accommodation.location!,
                  accommodation.checkIn!,
                  accommodation.checkOut!,
                  accommodation.adults,
                  accommodation.children
                );
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
            >
              <ExternalLink className="h-4 w-4" />
              Search Booking.com
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:hover:bg-rose-900/30 dark:border-rose-800 dark:text-rose-300"
              onClick={() => {
                const url = generateAirbnbUrl(
                  accommodation.location!,
                  accommodation.checkIn!,
                  accommodation.checkOut!,
                  accommodation.adults,
                  accommodation.children
                );
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
            >
              <ExternalLink className="h-4 w-4" />
              Search Airbnb
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
