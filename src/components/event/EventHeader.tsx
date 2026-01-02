import { Share2, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import type { Event } from '@/hooks/useEventData';

interface EventHeaderProps {
  event: Event;
}

export const EventHeader = ({ event }: EventHeaderProps) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const dateLocale = language === 'fr' ? fr : enUS;

  const handleShare = async () => {
    const url = window.location.href;
    
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: t.eventPage.share.copied,
      });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getStatusBadge = () => {
    switch (event.status) {
      case 'active':
        return <Badge variant="default">{t.eventPage.status.active}</Badge>;
      case 'finalized':
        return <Badge variant="secondary">{t.eventPage.status.finalized}</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">{t.eventPage.status.cancelled}</Badge>;
      default:
        return null;
    }
  };

  const getLocationTypeLabel = () => {
    switch (event.location_type) {
      case 'set_venues':
        return t.eventPage.locationType.setVenues;
      case 'suggestions':
        return t.eventPage.locationType.suggestions;
      case 'fair_spot':
        return t.eventPage.locationType.fairSpot;
      default:
        return null;
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 shadow-sm border">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {getStatusBadge()}
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {event.title}
          </h1>
          
          {event.description && (
            <p className="text-muted-foreground mb-4">
              {event.description}
            </p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {event.date_range_start && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(event.date_range_start), 'PPP', { locale: dateLocale })}
                  {event.date_range_end && event.date_range_end !== event.date_range_start && (
                    <> - {format(new Date(event.date_range_end), 'PPP', { locale: dateLocale })}</>
                  )}
                </span>
              </div>
            )}
            
            {event.location_type && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{getLocationTypeLabel()}</span>
              </div>
            )}
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-2" />
          {t.eventPage.share.button}
        </Button>
      </div>
    </div>
  );
};
