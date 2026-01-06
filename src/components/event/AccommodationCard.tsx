import { Home, ExternalLink, CheckCircle2, Building2, Tent, Castle } from 'lucide-react';
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

interface AccommodationCardProps {
  accommodation: AccommodationInfo;
  vibe?: 'casual' | 'active' | 'relaxed' | 'formal';
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

const generateBookingUrl = (
  location: string,
  checkIn: string,
  checkOut: string,
  adults: number = 10,
  children: number = 6
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

export const AccommodationCard = ({
  accommodation,
  vibe = 'casual',
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
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="font-medium text-foreground">{styleConfig.label}</p>
          <p className="text-sm text-muted-foreground">{styleConfig.description}</p>
        </div>

        {canGenerateLink && (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
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
            View Real Options
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
