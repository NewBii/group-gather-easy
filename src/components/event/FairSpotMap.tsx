import { useMemo } from 'react';
import { MapPin, Car, Train, Bike, Footprints, Navigation } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Participant } from '@/hooks/useEventData';

interface FairSpotMapProps {
  participants: Participant[];
  fairSpotAddress?: string | null;
}

interface FairSpot {
  lat: number;
  lng: number;
}

// Transport mode weights for fair spot calculation
const TRANSPORT_WEIGHTS: Record<string, number> = {
  car: 1.0,
  public_transport: 1.2,
  bike: 1.5,
  walk: 2.0,
};

export const FairSpotMap = ({ participants, fairSpotAddress }: FairSpotMapProps) => {
  const { t } = useLanguage();

  const participantsWithLocation = useMemo(() => 
    participants.filter(p => p.location_lat != null && p.location_lng != null),
    [participants]
  );

  // Calculate fair meeting point using weighted centroid
  const fairSpot = useMemo((): FairSpot | null => {
    if (participantsWithLocation.length < 2) return null;

    let totalWeightedLat = 0;
    let totalWeightedLng = 0;
    let totalWeight = 0;

    participantsWithLocation.forEach(p => {
      const weight = TRANSPORT_WEIGHTS[p.transport_mode || 'car'] || 1.0;
      totalWeightedLat += (p.location_lat || 0) * weight;
      totalWeightedLng += (p.location_lng || 0) * weight;
      totalWeight += weight;
    });

    return {
      lat: totalWeightedLat / totalWeight,
      lng: totalWeightedLng / totalWeight,
    };
  }, [participantsWithLocation]);

  const getTransportIcon = (mode: string | null) => {
    switch (mode) {
      case 'car': return <Car className="h-3 w-3" />;
      case 'public_transport': return <Train className="h-3 w-3" />;
      case 'bike': return <Bike className="h-3 w-3" />;
      case 'walk': return <Footprints className="h-3 w-3" />;
      default: return <Car className="h-3 w-3" />;
    }
  };

  const getTransportColor = (mode: string | null) => {
    switch (mode) {
      case 'car': return 'bg-blue-500';
      case 'public_transport': return 'bg-green-500';
      case 'bike': return 'bg-yellow-500';
      case 'walk': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  if (participantsWithLocation.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="py-8 text-center">
          <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            {t.eventPage.location.waitingForLocations?.replace('{count}', participants.length.toString()) || 
              `Waiting for participants to share their location`}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Fair Meeting Point */}
      {fairSpot && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary text-primary-foreground">
                <Navigation className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-primary">
                  {t.eventPage.location.fairMeetingPoint || 'Fair Meeting Point'}
                </h4>
                {fairSpotAddress ? (
                  <p className="text-sm text-muted-foreground mt-1">{fairSpotAddress}</p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t.eventPage.location.calculatingMeetingPoint || 'Calculating...'}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {fairSpot.lat.toFixed(4)}, {fairSpot.lng.toFixed(4)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Participants List with Location */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          {t.eventPage.location.participantsOnMap || 'Participants on map'} ({participantsWithLocation.length})
        </h4>
        <div className="grid gap-2">
          {participantsWithLocation.map((participant) => (
            <div 
              key={participant.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              <div className={`p-1.5 rounded-full text-white ${getTransportColor(participant.transport_mode)}`}>
                {getTransportIcon(participant.transport_mode)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{participant.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t.eventPage.location.transportModes[
                    participant.transport_mode === 'public_transport' ? 'publicTransport' : 
                    (participant.transport_mode as 'car' | 'bike' | 'walk') || 'car'
                  ]}
                </p>
              </div>
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Waiting for others */}
      {participants.length > participantsWithLocation.length && (
        <p className="text-sm text-muted-foreground text-center py-2">
          {t.eventPage.location.waitingForLocations?.replace(
            '{count}', 
            (participants.length - participantsWithLocation.length).toString()
          ) || `${participants.length - participantsWithLocation.length} participant(s) haven't shared their location yet`}
        </p>
      )}

      {/* All located message */}
      {participants.length === participantsWithLocation.length && participants.length > 0 && (
        <p className="text-sm text-green-600 text-center py-2 font-medium">
          ✓ {t.eventPage.location.everyoneLocated || 'All participants have shared their location!'}
        </p>
      )}
    </div>
  );
};
